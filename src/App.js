import "./App.css";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Link,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { useState } from "react";
import Home from "./pages/Home";
import Manes from "./pages/Manes";
import Mana from "./pages/Mana";
import Kaproi from "./pages/Kaproi";
import Kapros from "./pages/Kapros";
import Nekra from "./pages/Nekra";
import Sfageio from "./pages/Sfageio";
import Thesi from "./pages/Thesi";
// import Embolia from "./pages/Embolia"; // Αποσχολίασε όταν δημιουργήσεις τη σελίδα Embolia

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Διαχείριση του Dropdown στον υπολογιστή
  const handleDesktopSelect = (e) => {
    const path = e.target.value;
    if (path) {
      navigate(path);
      e.target.value = "";
    }
  };

  // Διαχείριση πλοήγησης από το Mobile Menu
  const handleMobileNav = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false); // Κλείνει το μενού μόλις πατήσεις
  };

  // Βοηθητική συνάρτηση για να "φωτίζει" το ενεργό κουμπί στο κινητό
  const isActive = (path) =>
    location.pathname === path
      ? "text-blue-600"
      : "text-gray-500 hover:text-blue-500";

  return (
    <div className="App min-h-screen bg-gray-50 font-sans text-gray-900 pb-20 md:pb-0">
      {/* ================= HEADER (Κοινό, αλλά προσαρμόζεται) ================= */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-4">
          {/* ΝΕΟ LOGO: ARGOPIG */}
          <Link
            to="/"
            className="text-3xl font-black text-blue-600 tracking-tighter"
          >
            ARGO<span className="text-gray-800">PIG</span>
          </Link>

          {/* ----- DESKTOP MENU (Κρύβεται στα κινητά) ----- */}
          <div className="hidden md:flex items-center gap-4 lg:gap-6">
            <Link
              to="/"
              className="px-3 py-2 rounded-xl font-bold text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition"
            >
              Αρχική
            </Link>
            <Link
              to="/manes"
              className="px-3 py-2 rounded-xl font-bold text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition"
            >
              Μάνες
            </Link>
            <Link
              to="/kaproi"
              className="px-3 py-2 rounded-xl font-bold text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition"
            >
              Κάπροι
            </Link>
            <Link
              to="/nekra"
              className="px-3 py-2 rounded-xl font-bold text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition"
            >
              Νεκρά
            </Link>
            <Link
              to="/sfageio"
              className="px-3 py-2 rounded-xl font-bold text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition"
            >
              Σφαγείο
            </Link>

            <select
              onChange={handleDesktopSelect}
              defaultValue=""
              className="px-3 py-2 rounded-xl font-bold text-gray-600 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition outline-none cursor-pointer focus:ring-2 focus:ring-blue-500"
            >
              <option value="" disabled hidden>
                Περισσότερα
              </option>
              <option value="/thesi">📍 Θέσεις</option>
              {/* <option value="/embolia">💉 Εμβόλια</option> */}
            </select>
          </div>
        </div>
      </nav>

      {/* ================= ΚΕΝΤΡΙΚΟ ΠΕΡΙΕΧΟΜΕΝΟ ================= */}
      <main className="max-w-7xl mx-auto py-6 sm:px-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/manes" element={<Manes />} />
          <Route path="/mana/:id" element={<Mana />} />
          <Route path="/kaproi" element={<Kaproi />} />
          <Route path="/kapros/:id" element={<Kapros />} />
          <Route path="/nekra" element={<Nekra />} />
          <Route path="/sfageio" element={<Sfageio />} />
          <Route path="/thesi" element={<Thesi />} />
          {/* <Route path="/embolia" element={<Embolia />} /> */}
        </Routes>
      </main>

      {/* ================= MOBILE BOTTOM NAVIGATION (Κρύβεται στο PC) ================= */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-[0_-5px_15px_rgba(0,0,0,0.05)] z-50 px-2 pb-safe">
        <div className="flex justify-between items-center h-16">
          <button
            onClick={() => handleMobileNav("/")}
            className={`flex flex-col items-center justify-center w-full ${isActive("/")}`}
          >
            <svg
              className="w-6 h-6 mb-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              ></path>
            </svg>
            <span className="text-[10px] font-bold">Αρχική</span>
          </button>

          <button
            onClick={() => handleMobileNav("/manes")}
            className={`flex flex-col items-center justify-center w-full ${isActive("/manes")}`}
          >
            <span className="text-xl mb-1">🐷</span>
            <span className="text-[10px] font-bold">Μάνες</span>
          </button>

          <button
            onClick={() => handleMobileNav("/kaproi")}
            className={`flex flex-col items-center justify-center w-full ${isActive("/kaproi")}`}
          >
            <span className="text-xl mb-1">🐗</span>
            <span className="text-[10px] font-bold">Κάπροι</span>
          </button>

          <button
            onClick={() => handleMobileNav("/nekra")}
            className={`flex flex-col items-center justify-center w-full ${isActive("/nekra")}`}
          >
            <span className="text-xl mb-1">💀</span>
            <span className="text-[10px] font-bold">Νεκρά Ζώα</span>
          </button>

          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center w-full text-gray-500 hover:text-blue-500"
          >
            <svg
              className="w-6 h-6 mb-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              ></path>
            </svg>
            <span className="text-[10px] font-bold">Μενού</span>
          </button>
        </div>
      </nav>

      {/* ================= MOBILE BOTTOM SHEET (Το "Περισσότερα" του κινητού) ================= */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-[60] flex items-end animate-in fade-in duration-200">
          <div className="bg-white w-full rounded-t-3xl p-6 pb-10 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h3 className="text-xl font-black text-gray-800">Περισσότερα</h3>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-gray-400 hover:text-gray-800 bg-gray-100 rounded-full p-2"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => handleMobileNav("/sfageio")}
                className="w-full flex items-center p-4 bg-gray-50 rounded-2xl active:bg-gray-100 transition"
              >
                <span className="text-2xl mr-4">🔪</span>
                <span className="text-lg font-bold text-gray-700">Σφαγείο</span>
              </button>
              <button
                onClick={() => handleMobileNav("/thesi")}
                className="w-full flex items-center p-4 bg-gray-50 rounded-2xl active:bg-gray-100 transition"
              >
                <span className="text-2xl mr-4">📍</span>
                <span className="text-lg font-bold text-gray-700">
                  Διαχείριση Θέσεων
                </span>
              </button>
              {/* <button
                onClick={() => handleMobileNav("/embolia")}
                className="w-full flex items-center p-4 bg-gray-50 rounded-2xl active:bg-gray-100 transition"
              >
                <span className="text-2xl mr-4">💉</span>
                <span className="text-lg font-bold text-gray-700">Εμβόλια</span>
              </button> */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
