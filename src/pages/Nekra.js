import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { format, parseISO, isValid, differenceInDays } from "date-fns";

export default function NekraTable() {
  const [listNekra, setListNekra] = useState([]);
  const [deadAnimals, setDeadAnimals] = useState([]);
  const [numberError, setNumberError] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [isModalOpen, setIsModalOpen] = useState(false);

  const todayStr = new Date().toISOString().split("T")[0];
  const [newNekra, setNewNekra] = useState({
    day: todayStr,
    age: "",
    category: "0",
  });
  let numberNekra = "";

  const navigate = useNavigate();
  const ages = ["A", "B", "SOUPER", "MESEO", "PAXYNSH", "MANA", "KAPROS"];

  const safeDateDisplay = (dateStr) => {
    if (!dateStr || dateStr === "0000-00-00") return "—";
    const parsed = parseISO(dateStr);
    return isValid(parsed) ? format(parsed, "dd/MM/yyyy") : "—";
  };

  const getCategoryLabel = (cat) => {
    if (String(cat) === "0") return "Καλό";
    if (String(cat) === "1") return "Μέτριο";
    if (String(cat) === "2") return "Χάλια";
    return "—";
  };

  const loadAllData = async () => {
    try {
      const [resNekra, resManes, resKaproi] = await Promise.all([
        axios.get("https://argopig-api.onrender.com/nekra"),
        axios.get("https://argopig-api.onrender.com/manes"),
        axios.get("https://argopig-api.onrender.com/kaproi"),
      ]);
      setListNekra(resNekra.data);
      const manesData = resManes.data
        .filter((m) => Number(m.live) === 1)
        .map((m) => ({
          ...m,
          type: "MANA",
          label: "Χοιρομητέρα",
          link: `/mana/${m.id}`,
        }));
      const kaproiData = resKaproi.data
        .filter((k) => Number(k.live) === 1)
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

  useEffect(() => {
    loadAllData();
  }, []);

  const filteredNekra = listNekra.filter(
    (n) => n.day && new Date(n.day).getFullYear() === Number(year),
  );

  const totals = { 0: 0, 1: 0, 2: 0, sum: 0 };
  ages.forEach((a) => {
    const kala = filteredNekra.filter(
      (n) => n.age === a && String(n.category) === "0",
    ).length;
    const metria = filteredNekra.filter(
      (n) => n.age === a && String(n.category) === "1",
    ).length;
    const xalia = filteredNekra.filter(
      (n) => n.age === a && String(n.category) === "2",
    ).length;
    totals["0"] += kala;
    totals["1"] += metria;
    totals["2"] += xalia;
    totals.sum += kala + metria + xalia;
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const recentEntries = listNekra
    .filter((n) => {
      if (!n.day || n.day === "0000-00-00") return false;
      const entryDate = parseISO(n.day);
      if (!isValid(entryDate)) return false;
      entryDate.setHours(0, 0, 0, 0);
      const diffDays = differenceInDays(today, entryDate);
      return diffDays >= 0 && diffDays <= 3;
    })
    .sort((a, b) => new Date(b.day) - new Date(a.day));

  const handleSave = async () => {
    setNumberError("");
    if (!newNekra.day || !newNekra.age || newNekra.category === "")
      return toast.error("Συμπλήρωσε όλα τα βασικά πεδία");
    if ((newNekra.age === "MANA" || newNekra.age === "KAPROS") && !numberNekra)
      return setNumberError("Ο αριθμός είναι υποχρεωτικός");

    try {
      if (newNekra.age === "MANA" || newNekra.age === "KAPROS") {
        const endpoint = newNekra.age === "MANA" ? "manes" : "kaproi";
        try {
          const res = await axios.get(
            `https://argopig-api.onrender.com/${endpoint}/number/${numberNekra}`,
          );
          if (!res.data) return setNumberError("Δεν υπάρχει αυτός ο αριθμός");
        } catch (err) {
          return setNumberError("Δεν υπάρχει αυτός ο αριθμός");
        }
      }

      await axios.post("https://argopig-api.onrender.com/nekra", newNekra);

      if (newNekra.age === "MANA" || newNekra.age === "KAPROS") {
        const endpoint = newNekra.age === "MANA" ? "manes" : "kaproi";
        await axios.put(
          `https://argopig-api.onrender.com/${endpoint}/number/${numberNekra}`,
          { live: 1, dayDead: newNekra.day },
        );
      }

      toast.success("Η εγγραφή αποθηκεύτηκε");
      setNewNekra({ day: todayStr, age: "", category: "0" });
      numberNekra = "";
      setIsModalOpen(false);
      loadAllData();
    } catch (err) {
      toast.error("Σφάλμα διακομιστή κατά την αποθήκευση.");
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-8">
      {/* HEADER CARD - UNIFIED STYLE */}
      <div className="bg-white rounded-3xl shadow-sm p-6 md:p-8 border-t-8 border-red-600 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-800 tracking-tight">
            ΝΕΚΡΑ
          </h1>
          <p className="text-gray-500 font-medium mt-1">
            Καταγραφή και στατιστικά απωλειών
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-red-600 hover:bg-red-700 active:scale-95 text-white px-6 py-3 rounded-2xl shadow-md transition-all font-bold w-full sm:w-auto text-lg"
        >
          + Προσθήκη
        </button>
      </div>

      {/* ΠΙΝΑΚΑΣ ΣΤΑΤΙΣΤΙΚΩΝ ΜΕ ΣΤΡΟΓΓΥΛΕΜΕΝΕΣ ΓΩΝΙΕΣ */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-4">
          <span className="font-black text-gray-600 uppercase text-sm tracking-wider">
            Επιλογή Έτους:
          </span>
          <input
            type="number"
            className="w-24 p-2.5 bg-white border border-gray-200 rounded-xl text-center focus:ring-2 focus:ring-red-500 outline-none font-bold text-gray-800 transition-colors"
            value={year}
            onChange={(e) => setYear(e.target.value)}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead className="bg-gray-100/50">
              <tr>
                <th className="px-6 py-4 text-left font-black text-gray-500 text-sm uppercase tracking-wider">
                  ΗΛΙΚΙΑ
                </th>
                <th className="px-6 py-4 text-center font-black text-green-700 text-sm uppercase tracking-wider">
                  ΚΑΛΟ
                </th>
                <th className="px-6 py-4 text-center font-black text-yellow-600 text-sm uppercase tracking-wider">
                  ΜΕΤΡΙΟ
                </th>
                <th className="px-6 py-4 text-center font-black text-red-600 text-sm uppercase tracking-wider">
                  ΧΑΛΙΑ
                </th>
                <th className="px-6 py-4 text-center font-black text-gray-800 text-sm uppercase tracking-wider">
                  ΣΥΝΟΛΟ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ages.map((a) => {
                const kala = filteredNekra.filter(
                  (n) => n.age === a && String(n.category) === "0",
                ).length;
                const metria = filteredNekra.filter(
                  (n) => n.age === a && String(n.category) === "1",
                ).length;
                const xalia = filteredNekra.filter(
                  (n) => n.age === a && String(n.category) === "2",
                ).length;
                const sum = kala + metria + xalia;

                return (
                  <tr key={a} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-black text-gray-700">{a}</td>
                    <td className="px-6 py-4 text-center font-black text-green-700 bg-green-50/30">
                      {kala}
                    </td>
                    <td className="px-6 py-4 text-center font-black text-yellow-600 bg-yellow-50/30">
                      {metria}
                    </td>
                    <td className="px-6 py-4 text-center font-black text-red-600 bg-red-50/30">
                      {xalia}
                    </td>
                    <td className="px-6 py-4 text-center font-black text-gray-900 bg-gray-50/50">
                      {sum}
                    </td>
                  </tr>
                );
              })}
              <tr className="bg-gray-100/80">
                <td className="px-6 py-5 text-left font-black text-gray-800 uppercase tracking-wider">
                  Σύνολο
                </td>
                <td className="px-6 py-5 text-center font-black text-green-800 text-lg">
                  {totals["0"]}
                </td>
                <td className="px-6 py-5 text-center font-black text-yellow-700 text-lg">
                  {totals["1"]}
                </td>
                <td className="px-6 py-5 text-center font-black text-red-700 text-lg">
                  {totals["2"]}
                </td>
                <td className="px-6 py-5 text-center font-black text-gray-900 text-xl">
                  {totals.sum}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ΠΡΟΣΦΑΤΕΣ ΕΓΓΡΑΦΕΣ */}
      <div className="pt-4">
        <h2 className="text-xl font-black text-gray-700 mb-4 uppercase pl-2">
          Πρόσφατες Απώλειες (Τελ. 3 Ημέρες)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {recentEntries.map((entry) => (
            <div
              key={entry.id}
              className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 flex flex-col gap-3 hover:shadow-md transition-all"
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-black text-gray-400 uppercase">
                  {safeDateDisplay(entry.day)}
                </span>
                <span
                  className={`px-3 py-1 text-[11px] font-black rounded-xl uppercase ${String(entry.category) === "0" ? "bg-green-100 text-green-800" : String(entry.category) === "1" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}`}
                >
                  {getCategoryLabel(entry.category)}
                </span>
              </div>
              <div className="text-2xl font-black text-gray-800 tracking-tight">
                {entry.age}{" "}
                {entry.number && (
                  <span className="text-gray-400 text-xl ml-1">
                    #{entry.number}
                  </span>
                )}
              </div>
            </div>
          ))}
          {recentEntries.length === 0 && (
            <div className="col-span-full text-center font-bold text-gray-400 py-10 bg-white rounded-3xl border-2 border-dashed border-gray-200">
              Καμία εγγραφή νεκρού ζώου τις τελευταίες 3 ημέρες!
            </div>
          )}
        </div>
      </div>

      {/* ΙΣΤΟΡΙΚΟ ΜΑΝΕΣ & ΚΑΠΡΟΙ */}
      <div className="pt-4">
        <h2 className="text-xl font-black text-gray-700 mb-4 uppercase pl-2">
          Ιστορικό Νεκρών Μανών & Κάπρων
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {deadAnimals.map((animal) => (
            <div
              key={`${animal.type}-${animal.id}`}
              className="bg-white rounded-3xl shadow-sm border border-gray-100 border-l-8 border-l-gray-400 p-5 flex flex-col justify-between hover:shadow-md transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-gray-400 text-[11px] font-black uppercase tracking-wider">
                    {animal.label}
                  </span>
                  <h3 className="text-2xl font-black text-gray-800 tracking-tight">
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
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-sm space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-400 uppercase text-[11px]">
                    Γεννήθηκε
                  </span>
                  <span className="font-black text-gray-700">
                    {safeDateDisplay(animal.dayLive)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                  <span className="font-bold text-red-400 uppercase text-[11px]">
                    Πέθανε
                  </span>
                  <span className="font-black text-red-600 text-lg">
                    {safeDateDisplay(animal.dayDead)}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {deadAnimals.length === 0 && (
            <div className="col-span-full text-center font-bold text-gray-400 py-10 bg-white rounded-3xl border-2 border-dashed border-gray-200">
              Δεν υπάρχουν νεκρές μάνες ή κάπροι στο ιστορικό.
            </div>
          )}
        </div>
      </div>

      {/* MODAL - UNIFIED STYLE */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl p-8 relative animate-in zoom-in duration-200">
            <h2 className="text-3xl font-black mb-6 text-gray-800 tracking-tight">
              Προσθήκη Νεκρού
            </h2>
            <div className="space-y-4">
              <select
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-red-500 font-bold text-gray-700 cursor-pointer transition-colors"
                value={newNekra.age}
                onChange={(e) =>
                  setNewNekra({ ...newNekra, age: e.target.value })
                }
              >
                <option value="">Ηλικία / Κατηγορία</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="SOUPER">SOUPER</option>
                <option value="MESEO">MESEO</option>
                <option value="PAXYNSH">ΠΑΧΥΝΣΗ</option>
                <option value="MANA">ΧΟΙΡΟΜΗΤΕΡΑ</option>
                <option value="KAPROS">ΚΑΠΡΟΣ</option>
              </select>

              {(newNekra.age === "MANA" || newNekra.age === "KAPROS") && (
                <div>
                  <input
                    type="text"
                    placeholder="Αριθμός ζώου"
                    className={`w-full p-4 border rounded-2xl outline-none font-bold transition-colors ${numberError ? "border-red-500 bg-red-50 focus:ring-2 focus:ring-red-500 text-red-700" : "bg-gray-50 border-gray-200 focus:ring-2 focus:ring-red-500 text-gray-700"}`}
                    value={numberNekra}
                    onChange={(e) => {
                      numberNekra = e.target.value;
                      setNumberError("");
                    }}
                  />
                  {numberError && (
                    <p className="text-red-500 text-xs mt-2 font-black uppercase tracking-wider pl-1">
                      {numberError}
                    </p>
                  )}
                </div>
              )}

              <select
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-red-500 font-bold text-gray-700 cursor-pointer transition-colors"
                value={newNekra.category}
                onChange={(e) =>
                  setNewNekra({ ...newNekra, category: e.target.value })
                }
              >
                <option value="0">Καλό</option>
                <option value="1">Μέτριο</option>
                <option value="2">Χάλια</option>
              </select>

              <input
                type="date"
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-red-500 font-bold text-gray-700 transition-colors"
                value={newNekra.day}
                onChange={(e) =>
                  setNewNekra({ ...newNekra, day: e.target.value })
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
