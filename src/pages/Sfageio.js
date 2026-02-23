import { useEffect, useState } from "react";
import axios from "axios";
import { format, parseISO, isValid } from "date-fns";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

export default function Sfageio() {
  const [listSfageio, setListSfageio] = useState([]);
  const [deadAnimals, setDeadAnimals] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear().toString(),
  );
  const navigate = useNavigate();
  // Αρχικοποίηση νέας εγγραφής σφαγείου με προεπιλεγμένη ημερομηνία σήμερα
  const todayStr = new Date().toISOString().split("T")[0];
  const [newSfageio, setNewSfageio] = useState({
    day: todayStr,
    quantity: "1",
    kilos: "",
    category: "",
    number: "",
  });
  const categories = ["ΠΑΧΥΝΣΗ", "ΜΑΝΕΣ", "ΚΑΠΡΟΙ"];

  // Φόρτωση θέσεων και ζωντανών ζώων
  const loadData = async () => {
    try {
      const [resSfageio, resManes, resKaproi] = await Promise.all([
        axios.get("https://argopig-api.onrender.com/sfageio"),
        axios.get("https://argopig-api.onrender.com/manes"),
        axios.get("https://argopig-api.onrender.com/kaproi"),
      ]);

      setListSfageio(Array.isArray(resSfageio.data) ? resSfageio.data : []);

      const manesData = resManes.data
        .filter((m) => Number(m.live) === 1 && m.dayDead)
        .map((m) => ({
          ...m,
          type: "MANA",
          label: "Χοιρομητέρα",
          link: `/mana/${m.id}`,
        }));
      const kaproiData = resKaproi.data
        .filter((k) => Number(k.live) === 1 && k.dayDead)
        .map((k) => ({
          ...k,
          type: "KAPROS",
          label: "Κάπρος",
          link: `/kapros/${k.id}`,
        }));

      const combined = [...manesData, ...kaproiData].sort(
        (a, b) => new Date(b.dayDead || 0) - new Date(a.dayDead || 0),
      );
      setDeadAnimals(combined);
    } catch (err) {
      toast.error("Σφάλμα φόρτωσης δεδομένων");
    }
  };

  // Φόρτωση δεδομένων κατά την αρχική απόδοση
  useEffect(() => {
    loadData();
  }, []);

  // Βοηθητική συνάρτηση για ασφαλή εμφάνιση ημερομηνιών
  const safeDateDisplay = (dateStr) => {
    if (!dateStr || dateStr === "0000-00-00") return "—";
    const parsed = parseISO(dateStr);
    return isValid(parsed) ? format(parsed, "dd/MM/yyyy") : "—";
  };

  // Διαχείριση αποθήκευσης νέας εγγραφής σφαγείου
  const handleSave = async () => {
    if (!newSfageio.day || !newSfageio.quantity || !newSfageio.category)
      return toast.error("Συμπλήρωσε τα απαραίτητα πεδία");
    try {
      await axios.post("https://argopig-api.onrender.com/sfageio", newSfageio);
      if (newSfageio.category === "ΜΑΝΕΣ" || newSfageio.category === "ΚΑΠΡΟΙ") {
        const endpoint = newSfageio.category === "ΜΑΝΕΣ" ? "manes" : "kaproi";
        await axios.put(
          `https://argopig-api.onrender.com/${endpoint}/number/${newSfageio.number}`,
          { live: 1, dayDead: newSfageio.day },
        );
      }
      toast.success("Η εγγραφή αποθηκεύτηκε");
      setNewSfageio({
        day: todayStr,
        quantity: "1",
        kilos: "",
        category: "",
        number: "",
      });
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      toast.error("Σφάλμα αποθήκευσης");
    }
  };

  // Διαχείριση διαγραφής εγγραφής σφαγείου
  const handleDelete = async (id) => {
    if (!window.confirm("Διαγραφή αυτής της εγγραφής;")) return;
    try {
      await axios.delete(`https://argopig-api.onrender.com/sfageio/${id}`);
      toast.info("Η εγγραφή διαγράφηκε");
      loadData();
    } catch (err) {
      toast.error("Σφάλμα διαγραφής");
    }
  };

  // Φιλτράρισμα εγγραφών πάχυνσης για το επιλεγμένο έτος και υπολογισμός στατιστικών
  const paxynshFiltered = listSfageio.filter(
    (item) =>
      item.category === "PAXYNSH" &&
      new Date(item.day).getFullYear().toString() === selectedYear,
  );

  // Υπολογισμός συνολικών ποσοτήτων και κιλών για το επιλεγμένο έτος
  const yearlyStats = paxynshFiltered.reduce(
    (acc, item) => {
      acc.quantity += Number(item.quantity || 0);
      acc.kilos += Number(item.kilos || 0);
      return acc;
    },
    { quantity: 0, kilos: 0 },
  );

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* HEADER CARD */}
      <div className="bg-white rounded-3xl shadow-sm p-6 md:p-8 border-t-8 border-red-600 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-800 tracking-tight">
            ΣΦΑΓΕΙΟ
          </h1>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <input
            type="number"
            className="w-24 p-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-center focus:ring-2 focus:ring-red-500 outline-none font-bold text-gray-700 transition-colors"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          />
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-red-600 hover:bg-red-700 active:scale-95 text-white px-6 py-3.5 rounded-2xl shadow-md transition-all font-bold flex-1 sm:flex-none"
          >
            + Νέα Σφαγή
          </button>
        </div>
      </div>

      {/* ΣΥΝΟΛΑ ΠΑΧΥΝΣΗΣ */}
      <div className="bg-blue-600 rounded-[2rem] shadow-lg p-8 text-white relative overflow-hidden">
        <div className="absolute -right-8 -bottom-10 opacity-10 text-[10rem] font-black leading-none">
          {selectedYear}
        </div>
        <h2 className="text-2xl font-black border-b border-blue-400/50 pb-3 mb-6 relative z-10">
          Σύνολα Πάχυνσης {selectedYear}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative z-10">
          <div className="flex flex-col bg-white/10 p-5 rounded-2xl backdrop-blur-sm border border-white/20">
            <span className="text-blue-100 text-xs uppercase font-black tracking-wider mb-1">
              Σύνολο Ζώων
            </span>
            <span className="text-4xl font-black">{yearlyStats.quantity}</span>
          </div>
          <div className="flex flex-col bg-white/10 p-5 rounded-2xl backdrop-blur-sm border border-white/20">
            <span className="text-blue-100 text-xs uppercase font-black tracking-wider mb-1">
              Σύνολο Κιλών
            </span>
            <span className="text-4xl font-black">
              {yearlyStats.kilos.toLocaleString()} kg
            </span>
          </div>
          <div className="flex flex-col bg-white/10 p-5 rounded-2xl backdrop-blur-sm border border-white/20">
            <span className="text-blue-100 text-xs uppercase font-black tracking-wider mb-1">
              Μέσος Όρος
            </span>
            <span className="text-4xl font-black">
              {yearlyStats.quantity > 0
                ? (yearlyStats.kilos / yearlyStats.quantity).toFixed(1)
                : 0}{" "}
              kg
            </span>
          </div>
        </div>
      </div>

      {/* ΙΣΤΟΡΙΚΟ ΠΑΧΥΝΣΗΣ */}
      <div>
        <h2 className="text-xl font-black text-gray-700 mb-4 uppercase pl-2">
          Ιστορικό {selectedYear}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {paxynshFiltered.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 border-l-8 border-l-blue-400 hover:shadow-md transition-all group"
            >
              <div className="flex justify-between items-center mb-3">
                <span className="font-bold text-gray-500">
                  {safeDateDisplay(item.day)}
                </span>
                <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-xl font-black">
                  {item.quantity} ζώα
                </span>
              </div>
              <div className="text-gray-800 flex flex-col gap-1">
                <span className="font-black text-lg">{item.kilos} kg</span>
                <span className="text-xs font-bold text-gray-400 uppercase">
                  Μ.Ο:{" "}
                  {item.quantity > 0
                    ? (item.kilos / item.quantity).toFixed(1)
                    : 0}
                  kg
                </span>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-50 flex justify-end">
                <button
                  onClick={() => handleDelete(item.id)}
                  className="text-red-500 hover:text-white hover:bg-red-500 px-4 py-1.5 rounded-xl text-sm font-bold transition-colors"
                >
                  Διαγραφή
                </button>
              </div>
            </div>
          ))}
          {paxynshFiltered.length === 0 && (
            <div className="col-span-full text-center text-gray-400 py-10 bg-white rounded-3xl border-2 border-dashed font-bold">
              Καμία εγγραφή πάχυνσης για το {selectedYear}.
            </div>
          )}
        </div>
      </div>

      {/* ΙΣΤΟΡΙΚΟ ΜΑΝΕΣ & ΚΑΠΡΟΙ */}
      <div className="pt-8">
        <h2 className="text-xl font-black text-gray-700 mb-4 uppercase pl-2 flex items-center gap-2">
          Μάνες & Κάπροι (Σφαγή)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {deadAnimals.map((animal) => (
            <div
              key={`${animal.type}-${animal.id}`}
              className="bg-white rounded-3xl shadow-sm border border-gray-100 border-l-8 border-l-red-500 p-5 flex flex-col justify-between hover:shadow-md transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-gray-400 text-[11px] font-black uppercase tracking-wider">
                    {animal.label}
                  </span>
                  <h3 className="text-2xl font-black text-gray-800">
                    #{animal.number}
                  </h3>
                </div>
                <button
                  onClick={() => navigate(animal.link)}
                  className="bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-700 px-4 py-2 rounded-xl text-sm font-bold transition-colors active:scale-95"
                >
                  Καρτέλα
                </button>
              </div>
              <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 text-sm flex justify-between items-center">
                <span className="font-bold text-gray-500">Σφάχτηκε:</span>
                <span className="font-black text-red-600 text-lg">
                  {safeDateDisplay(animal.dayDead)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl p-8 relative animate-in zoom-in duration-200">
            <h2 className="text-3xl font-black mb-6 text-gray-800 tracking-tight">
              Καταχώρηση Σφαγείου
            </h2>
            <div className="space-y-4">
              <select
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-red-500 font-bold text-gray-700 cursor-pointer"
                value={newSfageio.category}
                onChange={(e) =>
                  setNewSfageio({ ...newSfageio, category: e.target.value })
                }
              >
                <option value="">Κατηγορία</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {(newSfageio.category === "ΜΑΝΕΣ" ||
                newSfageio.category === "ΚΑΠΡΟΙ") && (
                <input
                  type="text"
                  placeholder="Αριθμός Ζώου"
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-red-500 font-bold text-gray-700"
                  value={newSfageio.number}
                  onChange={(e) =>
                    setNewSfageio({ ...newSfageio, number: e.target.value })
                  }
                />
              )}
              <div className="flex gap-4">
                <input
                  type="number"
                  placeholder="Ποσότητα"
                  className="w-1/2 p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-red-500 font-bold text-gray-700"
                  value={newSfageio.quantity}
                  onChange={(e) =>
                    setNewSfageio({ ...newSfageio, quantity: e.target.value })
                  }
                />
                <input
                  type="number"
                  placeholder="Κιλά"
                  className="w-1/2 p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-red-500 font-bold text-gray-700"
                  value={newSfageio.kilos}
                  onChange={(e) =>
                    setNewSfageio({ ...newSfageio, kilos: e.target.value })
                  }
                />
              </div>
              <input
                type="date"
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-red-500 font-bold text-gray-700"
                value={newSfageio.day}
                onChange={(e) =>
                  setNewSfageio({ ...newSfageio, day: e.target.value })
                }
              />
            </div>
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-4 rounded-2xl bg-gray-100 font-bold text-gray-600 hover:bg-gray-200 transition-colors"
              >
                Άκυρο
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-4 rounded-2xl bg-red-600 text-white font-bold hover:bg-red-700 shadow-md transition-all active:scale-95"
              >
                Αποθήκευση
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
