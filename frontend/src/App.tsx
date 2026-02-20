import { HashRouter, Routes, Route, Link } from "react-router-dom";
import { useGreeter, useAddNumbers, useAddMany } from "@/features/cpp-api/api";

// TEN PONIŻSZY KOD JEST KODEM TYLKO DO ZAPREZENTOWANIA DZIAŁANIA SAUCERA - NIE JEST TO KOD, KTÓRY POWINIEN BYĆ APLIKACJI
const Button = ({
  children,
  onClick,
  disabled = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
  >
    {children}
  </button>
);

function Home() {
  const greeter = useGreeter();
  const addNumbers = useAddNumbers();
  const addMany = useAddMany();

  return (
    <div className="p-10 space-y-4">
      <h1 className="text-3xl font-bold text-slate-800">Strona Główna</h1>
      <p className="text-slate-600">POC React + Saucer</p>

      {/* Greeter */}
      <div className="border p-4 rounded bg-slate-100">
        <p className="font-semibold mb-2">Test Greeter:</p>
        <p>
          Dane z C++: <strong>{greeter.data || "?"}</strong>
        </p>
        {greeter.error && <p className="text-red-500 text-sm">{greeter.error}</p>}
        <div className="mt-2">
          <Button onClick={() => greeter.call()} disabled={greeter.loading}>
            {greeter.loading ? "Ładowanie..." : "Pobierz dane"}
          </Button>
        </div>
      </div>

      {/* Add Numbers */}
      <div className="border p-4 rounded bg-slate-100">
        <p className="font-semibold mb-2">Test Adder - Dwie liczby:</p>
        <p>
          5 + 10 = <strong>{addNumbers.result !== null ? addNumbers.result : "?"}</strong>
        </p>
        {addNumbers.error && <p className="text-red-500 text-sm">{addNumbers.error}</p>}
        <div className="mt-2">
          <Button onClick={() => addNumbers.add(5, 10)} disabled={addNumbers.loading}>
            {addNumbers.loading ? "Ładowanie..." : "Dodaj 5 + 10"}
          </Button>
        </div>
      </div>

      {/* Add Many */}
      <div className="border p-4 rounded bg-slate-100">
        <p className="font-semibold mb-2">Test Adder - Wiele liczb:</p>
        <p>
          [1, 45, 34, 29] = <strong>{addMany.sum !== null ? addMany.sum : "?"}</strong>
        </p>
        {addMany.error && <p className="text-red-500 text-sm">{addMany.error}</p>}
        <div className="mt-2">
          <Button onClick={() => addMany.addMany([1, 45, 34, 29])} disabled={addMany.loading}>
            {addMany.loading ? "Ładowanie..." : "Dodaj tablicę"}
          </Button>
        </div>
      </div>

      <Link to="/about" className="text-blue-500 underline block mt-4">
        O nas
      </Link>
    </div>
  );
}

function About() {
  return (
    <div className="p-10 bg-slate-50 min-h-screen">
      <h1 className="text-2xl font-bold">O aplikacji</h1>
      <Link to="/" className="text-blue-500 underline">
        Wróć
      </Link>
    </div>
  );
}

function App() {
  // Używamy HashRouter, bo w środowisku desktopowym (plikowym)
  // BrowserRouter często sprawia problemy ze ścieżkami
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
