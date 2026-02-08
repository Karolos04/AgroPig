import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Manes from "./pages/Manes";
import Kaproi from "./pages/Kaproi";
import Nekra from "./pages/Nekra";
import More from "./pages/More";
import Mana from "./pages/Mana";
import Kapros from "./pages/Kapros";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        {/* Navigation */}
        <nav className="bg-green-600 text-white p-4 flex justify-center gap-8 font-semibold">
          <Link to="/" className="hover:text-gray-200">
            Αρχική
          </Link>
          <Link to="/manes" className="hover:text-gray-200">
            Μάνες
          </Link>
          <Link to="/kaproi" className="hover:text-gray-200">
            Κάπροι
          </Link>
          <Link to="/nekra" className="hover:text-gray-200">
            Νεκρά
          </Link>
          <Link to="/more" className="hover:text-gray-200">
            Περισσότερα
          </Link>
        </nav>

        {/* Routes */}
        <div className="mt-6">
          <Routes>
            <Route
              path="/"
              element={
                <div className="text-center text-2xl mt-20">
                  Καλωσήρθες στην αρχική σελίδα
                </div>
              }
            />
            <Route path="/manes" element={<Manes />} />
            <Route path="/mana/:id" element={<Mana />} />
            <Route path="/kaproi" element={<Kaproi />} />
            <Route path="/kapros/:id" element={<Kapros />} />
            <Route path="/nekra" element={<Nekra />} />
            <Route path="/more" element={<More />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}
