import { HashRouter, Routes, Route, Link } from "react-router-dom";
import { call } from "@saucer-dev/types";
import { useState } from "react";

// Prosty komponent Shadcn-like (button)
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

  const getCppData = async () => {
    try {
      const res = await call<string>("hello_from_cpp", []);
      setMsg(res);
    } catch {
      setMsg("Błąd połączenia z C++ (uruchom w Saucer)");
    }
  };

  return (
    <div className="p-10 space-y-4">
      <h1 className="text-3xl font-bold text-slate-800">Strona Główna</h1>
      <p className="text-slate-600">TW REACT WRAZ Z SAUCEREM.</p>

      <div className="border p-4 rounded bg-slate-100">
        <p>
          Dane z C++: <strong>{msg}</strong>
        </p>
        <div className="mt-2">
          <Button onClick={getCppData}>Pobierz dane</Button>
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
