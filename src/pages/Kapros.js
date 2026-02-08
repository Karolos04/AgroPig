import { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { toast } from "react-toastify";

export default function Kapros() {
  const { id } = useParams(); // το ID του κάπρου από το Kaproi.js
  const [kapros, setKapros] = useState({});
  const [spermaList, setSpermaList] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortAsc, setSortAsc] = useState(true);
  const [newSperma, setNewSperma] = useState({
    day: "",
    grams: "",
    rate: "",
    idKapros: "",
  });

  // Φόρτωση κάπρου και σπέρματος
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Πάρε τον κάπρο
        const resKapros = await axios.get(`http://localhost:3001/kaproi/${id}`);
        setKapros(resKapros.data);

        // Πάρε όλα τα σπέρματα του κάπρου
        const resSperma = await axios.get(
          `http://localhost:3001/kaproi/sperma/${id}`,
        );
        setSpermaList(Array.isArray(resSperma.data) ? resSperma.data : []);
      } catch (err) {
        console.error(err);
        toast.error("Σφάλμα φόρτωσης κάπρου ή σπερμάτων");
      }
    };

    fetchData();
  }, [id]);

  // Προσθήκη σπέρματος
  const saveNewSperma = async () => {
    if (!newSperma.rate || !newSperma.grams || !newSperma.day) {
      toast.error("Συμπλήρωσε όλα τα πεδία");
      return;
    }

    try {
      const res = await axios.post("http://localhost:3001/sperma", {
        day: newSperma.day,
        grams: newSperma.grams,
        rate: newSperma.rate,
        idKapros: id,
      });

      setSpermaList((prev) => [...prev, res.data]);
      setNewSperma({ day: "", grams: "", rate: "", idKapros: "" });
      setIsModalOpen(false);
      toast.success("Η σπερματεγχηση αποθηκεύτηκε");
    } catch (err) {
      toast.error("Σφάλμα αποθήκευσης");
    }
  };

  // Διαγραφή σπέρματος
  const deleteSperma = async (sId) => {
    if (!window.confirm("Διαγραφή σπερμάτων;")) return;
    try {
      await axios.delete(`http://localhost:3001/sperma/${sId}`);
      setSpermaList((prev) => prev.filter((s) => s.id !== sId));
      toast.info("Σπέρμα διαγράφηκε");
    } catch (err) {
      console.error(err);
      toast.error("Σφάλμα διαγραφής σπερμάτων");
    }
  };

  // Λίστα σπερμάτων ταξινομημένη
  const sortedList = [...spermaList].sort((a, b) => {
    const dateA = new Date(a.day);
    const dateB = new Date(b.day);
    return sortAsc ? dateA - dateB : dateB - dateA;
  });

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      {/* HEADER */}
      <div className="bg-white rounded-2xl shadow-md p-5 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-center">
          {kapros.number || "—"}
        </h1>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="font-semibold">Θέση:</span>{" "}
            {kapros.position || "—"}
          </div>
          <div>
            <span className="font-semibold">Ράτσα:</span> {kapros.breed || "—"}
          </div>
          <div>
            <span className="font-semibold">Ημ. Γέννησης:</span>{" "}
            {kapros.dayLive
              ? format(parseISO(kapros.dayLive), "dd/MM/yyyy")
              : "—"}
          </div>
        </div>
      </div>

      {/* ADD BUTTON + SORT */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => setSortAsc(!sortAsc)}
          className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-xl font-semibold"
        >
          Ημερομηνία {sortAsc ? "↑" : "↓"}
        </button>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl shadow"
        >
          + Προσθήκη
        </button>
      </div>

      {/* LIST */}
      <div className="space-y-3">
        {sortedList.map((s, index) => (
          <div
            key={s.id}
            className="bg-white rounded-2xl shadow p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
          >
            {/* LEFT */}
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
              <span className="font-bold text-lg">#{index + 1}</span>
              <span className="text-gray-600">
                {format(parseISO(s.day), "dd/MM/yyyy")}
              </span>
              <span>
                <span className="font-semibold">Γρ:</span> {s.grams}
              </span>
              <span>
                <span className="font-semibold">Βαθμός:</span> {s.rate}
              </span>
            </div>

            {/* ACTION */}
            <button
              onClick={() => deleteSperma(s.id)}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-xl w-full md:w-auto"
            >
              Διαγραφή
            </button>
          </div>
        ))}
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-lg relative">
            <h2 className="text-xl font-bold mb-4">Προσθήκη</h2>

            <div className="flex flex-col gap-3">
              <input
                type="date"
                className="border rounded-lg p-2"
                value={newSperma.day}
                onChange={(e) =>
                  setNewSperma({ ...newSperma, day: e.target.value })
                }
              />
              <input
                type="number"
                placeholder="Γραμμάρια"
                className="border rounded-lg p-2"
                value={newSperma.grams}
                onChange={(e) =>
                  setNewSperma({ ...newSperma, grams: e.target.value })
                }
              />
              <input
                type="number"
                placeholder="Βαθμολογία"
                className="border rounded-lg p-2"
                value={newSperma.rate}
                onChange={(e) =>
                  setNewSperma({ ...newSperma, rate: e.target.value })
                }
              />
            </div>

            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={saveNewSperma}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
              >
                Αποθήκευση
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-lg"
              >
                Άκυρο
              </button>
            </div>

            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-2 right-3 text-gray-500 text-xl"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
