// Windows 11 / Fedora: node build.mjs
// Prerequisites: Node >=24, CMake, Git, and the platform's C++ development tools.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const windows = process.platform === 'win32';
const args = process.argv.slice(2);
// Use the active Node installation also inside npm's child processes (nvm).
process.env.PATH = `${path.dirname(process.execPath)}${path.delimiter}${process.env.PATH ?? ''}`;
if (args.includes('--help')) {
  console.log('node build.mjs              Install frontend dependencies, build, and launch.');
  console.log('node build.mjs --build-only Build without launching the application.');
  process.exit(0);
}

function run(command, commandArgs, cwd = root) {
  console.log(`\n> ${path.basename(command)} ${commandArgs.join(' ')}`);
  const result = spawnSync(command, commandArgs, { cwd, stdio: 'inherit' });
  if (result.error || result.status !== 0) {
    throw new Error(result.error?.message ?? `Command failed (exit ${result.status}, signal ${result.signal ?? 'none'}).`);
  }
}

try {
  if (args.some(arg => arg !== '--build-only')) throw new Error('Unknown option. Use --help.');
  if (Number(process.versions.node.split('.')[0]) < 24) throw new Error('Node.js >=24 is required.');
  if (!windows && process.platform !== 'linux') throw new Error('Supported targets: Windows 11 and Fedora Linux.');
  run('cmake', ['--version']);

  const build = path.join(root, 'build', windows ? 'run-windows' : 'run-fedora');
  const configure = ['-S', root, '-B', build, '-DCMAKE_BUILD_TYPE=Release'];
  if (windows) {
    const vswhere = path.join(process.env['ProgramFiles(x86)'] ?? 'C:\\Program Files (x86)', 'Microsoft Visual Studio', 'Installer', 'vswhere.exe');
    let version = spawnSync(vswhere, ['-latest', '-prerelease', '-products', '*', '-requires',
      'Microsoft.VisualStudio.Component.VC.Tools.x86.x64', '-property', 'installationVersion'], { encoding: 'utf8' }).stdout?.trim();
    if (!version) {
      const installation = spawnSync(vswhere, ['-latest', '-prerelease', '-products', '*',
        '-property', 'installationPath'], { encoding: 'utf8' }).stdout?.trim();
      const installer = path.join(path.dirname(vswhere), 'setup.exe');
      const quote = value => `'${value.replaceAll("'", "''")}'`;
      if (!installation || !existsSync(installer)) {
        throw new Error('Visual Studio Build Tools is required on Windows. Install Desktop development with C++ and Windows SDK, then run this command again.');
      }
      console.log('\nMissing Visual Studio C++ tools. Installing the desktop C++ workload and Windows SDK.');
      console.log('Windows will request administrator permission. The download can take several minutes.');
      const installerArgs = `modify --installPath "${installation}" --add Microsoft.VisualStudio.Workload.NativeDesktop --includeRecommended --quiet --norestart`;
      run('powershell.exe', ['-NoProfile', '-Command',
        `$p = Start-Process -FilePath ${quote(installer)} -ArgumentList ${quote(installerArgs)} -Verb RunAs -WindowStyle Hidden -PassThru; $p.WaitForExit(); if ($p.ExitCode -notin 0,3010) { exit $p.ExitCode }; while (Get-Process -Name setup -ErrorAction SilentlyContinue) { Start-Sleep -Seconds 2 }`]);
      const installed = spawnSync(vswhere, ['-latest', '-prerelease', '-products', '*', '-requires',
        'Microsoft.VisualStudio.Component.VC.Tools.x86.x64', '-property', 'installationVersion'], { encoding: 'utf8' }).stdout?.trim();
      if (!installed) throw new Error('C++ tools are still unavailable. Check Visual Studio Installer or restart Windows if the installer requested it.');
      // Repeat detection after installation, then continue the same build.
      version = installed;
    }
    const help = spawnSync('cmake', ['--help'], { encoding: 'utf8' }).stdout;
    const generator = help?.match(new RegExp(`Visual Studio ${version.split('.')[0]} \\d{4}`))?.[0];
    if (!generator) throw new Error('Update CMake to support the installed Visual Studio.');
    configure.push('-G', generator, '-A', 'x64');
  } else {
    run('pkg-config', ['--exists', 'gtk4 >= 4.12', 'libadwaita-1', 'json-glib-1.0', 'webkitgtk-6.0']);
    configure.push('-G', 'Unix Makefiles', '-DCMAKE_CXX_COMPILER=g++', '-Dsaucer_backend=WebKitGtk');
  }

  const frontend = path.join(root, 'frontend');
  const npmCli = path.join(path.dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js');
  const npm = npmArgs => existsSync(npmCli)
    ? run(process.execPath, [npmCli, ...npmArgs], frontend)
    : run('npm', npmArgs, frontend);
  npm(['ci', '--no-audit', '--no-fund']);
  npm(['run', 'build']);
  run('cmake', configure);
  run('cmake', ['--build', build, '--config', 'Release', '--parallel', '4']);
  const executable = path.join(build, ...(windows ? ['Release', 'LD-Lab.exe'] : ['LD-Lab']));
  console.log(`\nBuilt: ${executable}`);
  if (!args.includes('--build-only')) run(executable, []);
} catch (error) {
  console.error(`\nBuild stopped: ${error.message}`);
  if (!windows) console.error('Fedora dependencies: sudo dnf install gcc-c++ cmake make git pkgconf-pkg-config gtk4-devel libadwaita-devel json-glib-devel webkitgtk6.0-devel');
  process.exitCode = 1;
}
