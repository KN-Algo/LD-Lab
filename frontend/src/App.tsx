import { HashRouter, Routes, Route, Link } from "react-router-dom";
import { call } from "@saucer-dev/types";
import { useState } from "react";

// KOMPONENT PRZYKŁADOWY - NIE JEST TO KOD, KTÓRY POWINIEN BYĆ APLIKACJI
const Button = ({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) => (
  <button
    onClick={onClick}
    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors cursor-pointer"
  >
    {children}
  </button>
);

function Home() {
  const [msg, setMsg] = useState("Brak");
  const [addResult, setAddResult] = useState<number | null>(null);
  const [sumResult, setSumResult] = useState<number | null>(null);

  const getCppData = async () => {
    try {
      const res = await call<string>("hello_from_cpp", []);
      setMsg(res);
    } catch {
      setMsg("Błąd połączenia z C++ (uruchom w Saucer)");
    }
  };

  const testAddNumbers = async () => {
    try {
      const res = await call<number>("add_numbers", [5, 10]);
      setAddResult(res);
    } catch {
      setAddResult(null);
    }
  };

  const testAddMany = async () => {
    try {
      const res = await call<number>("add_many", [[1, 45, 34, 29]]);
      setSumResult(res);
    } catch {
      setSumResult(null);
    }
  };

  // TEN PONIŻSZY KOD JEST KODEM TYLKO DO ZAPREZENTOWANIA DZIAŁANIA SAUCERA - NIE JEST TO KOD, KTÓRY POWINIEN BYĆ APLIKACJI

  return (
    <div className="p-10 space-y-4">
      <h1 className="text-3xl font-bold text-slate-800">Strona Główna</h1>
      <p className="text-slate-600">POC React + Saucer</p>

      <div className="border p-4 rounded bg-slate-100">
        <p className="font-semibold mb-2">Test Greeter:</p>
        <p>
          Dane z C++: <strong>{msg}</strong>
        </p>
        <div className="mt-2">
          <Button onClick={getCppData}>Pobierz dane</Button>
        </div>
      </div>

      <div className="border p-4 rounded bg-slate-100">
        <p className="font-semibold mb-2">Test Adder - Dwie liczby:</p>
        <p>
          5 + 10 = <strong>{addResult !== null ? addResult : "?"}</strong>
        </p>
        <div className="mt-2">
          <Button onClick={testAddNumbers}>Dodaj 5 + 10</Button>
        </div>
      </div>

      <div className="border p-4 rounded bg-slate-100">
        <p className="font-semibold mb-2">Test Adder - Wiele liczb:</p>
        <p>
          [1, 45, 34, 29] = <strong>{sumResult !== null ? sumResult : "?"}</strong>
        </p>
        <div className="mt-2">
          <Button onClick={testAddMany}>Dodaj tablicę</Button>
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
