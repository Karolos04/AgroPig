import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

export default function NekraTable() {
  const [listNekra, setListNekra] = useState([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newNekra, setNewNekra] = useState({
    day: "",
    age: "",
    category: "0",
  });

  const ages = ["Α", "Β", "SOUPER", "MESEO", "PAXYNSH", "MANA", "KAPROS"];

  useEffect(() => {
    axios
      .get("http://localhost:3001/nekra")
      .then((res) => setListNekra(res.data))
      .catch(console.error);
  }, []);

  const categoryColors = {
    0: "bg-green-100 text-green-800",
    1: "bg-yellow-100 text-yellow-800",
    2: "bg-red-100 text-red-800",
  };

  // Φιλτράρισμα ανά έτος
  const filteredNekra = listNekra.filter(
    (n) => n.day && new Date(n.day).getFullYear() === Number(year),
  );

  const totals = { 0: 0, 1: 0, 2: 0, sum: 0 };
  ages.forEach((a) => {
    const kala = filteredNekra.filter(
      (n) => n.age === a && n.category === "0",
    ).length;
    const metria = filteredNekra.filter(
      (n) => n.age === a && n.category === "1",
    ).length;
    const xalia = filteredNekra.filter(
      (n) => n.age === a && n.category === "2",
    ).length;
    totals["0"] += kala;
    totals["1"] += metria;
    totals["2"] += xalia;
    totals.sum += kala + metria + xalia;
  });

  // Αποθήκευση νέας εγγραφής
  const saveNewNekra = async () => {
    if (!newNekra.day || !newNekra.age || !newNekra.category) {
      toast.error("Συμπλήρωσε όλα τα πεδία");
      return;
    }

    try {
      const res = await axios.post("http://localhost:3001/nekra", newNekra);
      setListNekra((prev) => [...prev, res.data]);
      setNewNekra({
        day: "",
        age: "",
        category: "",
      });
      setIsModalOpen(false);
      toast.success("Η εγγραφή αποθηκεύτηκε");
    } catch (err) {
      toast.error("Σφάλμα αποθήκευσης");
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* TITLE */}
      <div className="bg-white rounded-2xl shadow p-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">ΝΕΚΡΑ</h1>

        {/* +Προσθήκη Button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl shadow transition"
        >
          + Προσθήκη
        </button>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse shadow-md rounded-xl overflow-hidden mt-4">
          <thead className="bg-gray-200 sticky top-0">
            <tr>
              <th className="border px-4 py-2 text-left">
                <input
                  type="number"
                  className="w-24 p-1 border rounded-xl text-center focus:ring-2 focus:ring-green-500 outline-none"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                />
              </th>
              <th className="border px-4 py-2 text-center">ΚΑΛΟ</th>
              <th className="border px-4 py-2 text-center">ΜΕΤΡΙΟ</th>
              <th className="border px-4 py-2 text-center">ΧΑΛΙΑ</th>
              <th className="border px-4 py-2 text-center">ΣΥΝΟΛΟ</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {ages.map((a) => {
              const kala = filteredNekra.filter(
                (n) => n.age === a && n.category === "0",
              ).length;
              const metria = filteredNekra.filter(
                (n) => n.age === a && n.category === "1",
              ).length;
              const xalia = filteredNekra.filter(
                (n) => n.age === a && n.category === "2",
              ).length;
              const sum = kala + metria + xalia;

              return (
                <tr key={a} className="hover:bg-gray-50 transition-colors">
                  <td className="border px-4 py-2 font-semibold">{a}</td>
                  <td
                    className={`border px-4 py-2 text-center font-medium ${categoryColors["0"]} transition duration-300`}
                  >
                    {kala}
                  </td>
                  <td
                    className={`border px-4 py-2 text-center font-medium ${categoryColors["1"]} transition duration-300`}
                  >
                    {metria}
                  </td>
                  <td
                    className={`border px-4 py-2 text-center font-medium ${categoryColors["2"]} transition duration-300`}
                  >
                    {xalia}
                  </td>
                  <td className="border px-4 py-2 text-center font-semibold transition duration-300">
                    {sum}
                  </td>
                </tr>
              );
            })}

            <tr className="bg-gray-100 font-bold">
              <td className="border px-4 py-2 text-left">Σύνολο</td>
              <td className="border px-4 py-2 text-center transition duration-300">
                {totals["0"]}
              </td>
              <td className="border px-4 py-2 text-center transition duration-300">
                {totals["1"]}
              </td>
              <td className="border px-4 py-2 text-center transition duration-300">
                {totals["2"]}
              </td>
              <td className="border px-4 py-2 text-center transition duration-300">
                {totals.sum}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 relative">
            <h2 className="text-2xl font-bold mb-6">Προσθήκη Νεκρού</h2>

            <div className="space-y-4">
              <select
                className="border rounded-xl p-3 w-full focus:ring-2 focus:ring-green-500 outline-none"
                value={newNekra.age}
                onChange={(e) =>
                  setNewNekra({ ...newNekra, number: e.target.value })
                }
              >
                <option value="">Ηλικία</option>
                {["Α", "Β", "SOUPER", "MESEO", "PAXYNSH", "MANA", "KAPROS"].map(
                  (a) => (
                    <option key={a}>{a}</option>
                  ),
                )}
              </select>
              <input
                type="text"
                placeholder="Θέση"
                className="border rounded-xl p-3 w-full focus:ring-2 focus:ring-green-500 outline-none"
                value={newNekra.position}
                onChange={(e) =>
                  setNewNekra({ ...newNekra, position: e.target.value })
                }
              />
              <input
                type="text"
                placeholder="Ράτσα"
                className="border rounded-xl p-3 w-full focus:ring-2 focus:ring-green-500 outline-none"
                value={newNekra.breed}
                onChange={(e) =>
                  setNewNekra({ ...newNekra, breed: e.target.value })
                }
              />
              <input
                type="date"
                className="border rounded-xl p-3 w-full focus:ring-2 focus:ring-green-500 outline-none"
                value={newNekra.day}
                onChange={(e) =>
                  setNewNekra({ ...newNekra, day: e.target.value })
                }
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300"
              >
                Άκυρο
              </button>
              <button
                onClick={saveNewNekra}
                className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white"
              >
                Αποθήκευση
              </button>
            </div>

            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-3 right-4 text-gray-400 hover:text-gray-700 text-xl"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
