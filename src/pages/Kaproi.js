import { useEffect, useState } from "react";
import axios from "axios";
import { format, parseISO, isValid } from "date-fns";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

export default function Kaproi() {
  const [listKaproi, setListKaproi] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [positionFilter, setPositionFilter] = useState("");
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newKapro, setNewKapro] = useState({
    number: "",
    position: "",
    dayLive: "",
  });

  // Αποθήκευση κάπρου
  const saveNewKapro = async () => {
    if (!newKapro.number || !newKapro.position || !newKapro.dayLive) {
      toast.error("Συμπλήρωσε όλα τα πεδία");
      return;
    }

    try {
      const res = await axios.post(
        "https://argopig-6ad68ad8d47f.herokuapp.com/kaproi",
        {
          number: newKapro.number,
          position: newKapro.position,
          live: 0,
          dayLive: newKapro.dayLive,
        },
      );

      setListKaproi((prev) => [...prev, res.data]);
      setNewKapro({ number: "", position: "", dayLive: "" });
      setIsModalOpen(false);
      toast.success("Ο κάπρος αποθηκεύτηκε");
    } catch {
      toast.error("Σφάλμα αποθήκευσης");
    }
  };

  const countKaproi = listKaproi.filter(
    (kaproi) => Number(kaproi.live) === 0,
  ).length;

  /* ================= FETCH ================= */
  useEffect(() => {
    const fetchKaproi = async () => {
      try {
        const res = await axios.get(
          "https://argopig-6ad68ad8d47f.herokuapp.com/kaproi",
        );
        const kaproiData = Array.isArray(res.data) ? res.data : [];

        // Για κάθε κάπρο παίρνουμε το τελευταίο σπέρμα
        const full = await Promise.all(
          kaproiData.map(async (k) => {
            const resSperma = await axios.get(
              `https://argopig-6ad68ad8d47f.herokuapp.com/kaproi/sperma/${k.id}`,
            );
            const spermaList = Array.isArray(resSperma.data)
              ? resSperma.data
              : [];
            const lastSperma = spermaList[0] || null; // τελευταία ημερομηνία πρώτα
            return { ...k, lastSperma };
          }),
        );

        setListKaproi(full);
      } catch (err) {
        console.error(err);
        toast.error("Σφάλμα φόρτωσης καπρών");
      }
    };

    fetchKaproi();
  }, []);

  /* ================= DELETE ================= */
  const deleteKaproi = async (id) => {
    if (!window.confirm("Διαγραφή κάπρου;")) return;
    try {
      await axios.delete(
        `https://argopig-6ad68ad8d47f.herokuapp.com/kaproi/${id}`,
      );
      setListKaproi((p) => p.filter((k) => k.id !== id));
      toast.info("Κάπρος διαγράφηκε");
    } catch {
      toast.error("Σφάλμα διαγραφής");
    }
  };

  /* ================= UPDATE POSITION ================= */
  const updatePosition = async (k, newPosition) => {
    try {
      const res = await axios.put(
        `https://argopig-6ad68ad8d47f.herokuapp.com/kaproi/${k.id}`,
        {
          ...k,
          position: newPosition,
        },
      );
      setListKaproi((prev) => prev.map((x) => (x.id === k.id ? res.data : x)));
    } catch {
      toast.error("Σφάλμα ενημέρωσης θέσης");
    }
  };

  /* ================= FILTER ================= */
  const filteredKaproi = listKaproi
    .filter((m) => m.number.toString().includes(searchTerm))
    .filter((k) => positionFilter === "" || k.position === positionFilter)
    .filter((k) => k.live === 0);

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl shadow border p-6 space-y-4">
        {/* TITLE & SEARCH */}
        <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">
          Κάπροι
        </h1>

        <input
          type="text"
          placeholder={`Αναζήτηση σε ${countKaproi} κάπρους`}
          className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className="flex flex-col md:flex-row gap-3">
          {/* Φίλτρο θέσης */}
          <select
            className="flex-1 p-3 border rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
            value={positionFilter}
            onChange={(e) => setPositionFilter(e.target.value)}
          >
            <option value="">Φιλτράρισμα ανά θέση</option>
            {[
              "Α1",
              "Α2",
              "Α3",
              "Α4",
              "Α5",
              "Α6",
              "Α7",
              "Α8",
              "Α9",
              "Α10",
              "Δ1",
              "Δ2",
              "Δ3",
              "ΞΗΡΑ",
              "ΤΟΚΕΤΟΣ",
              "ΑΛΛΟΥ",
            ].map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>
      {/* ADD BUTTON */}
      <div className="flex justify-end mt-4">
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl shadow transition"
        >
          + Προσθήκη
        </button>
      </div>

      {/* CARDS */}
      <div className="space-y-4">
        {filteredKaproi.map((k) => {
          const lastSpermaDate =
            k.lastSperma && isValid(parseISO(k.lastSperma.day))
              ? format(parseISO(k.lastSperma.day), "dd/MM/yyyy")
              : "—";

          return (
            <div
              key={k.id}
              className="bg-white rounded-2xl shadow border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition hover:bg-gray-50"
            >
              <div className="font-semibold text-gray-800 text-lg">
                {k.number}
              </div>

              {/* POSITION */}
              <select
                className="border rounded-lg p-2 w-full sm:w-32 focus:ring-2 focus:ring-green-500 outline-none"
                value={k.position || ""}
                onChange={(e) => updatePosition(k, e.target.value)}
              >
                <option value="">διάλεξε</option>
                {[
                  "Α1",
                  "Α2",
                  "Α3",
                  "Α4",
                  "Α5",
                  "Α6",
                  "Α7",
                  "Α8",
                  "Α9",
                  "Α10",
                  "Δ1",
                  "Δ2",
                  "Δ3",
                  "ΞΗΡΑ",
                  "ΤΟΚΕΤΟΣ",
                  "ΑΛΛΟΥ",
                ].map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>

              {/* LAST SPERMA */}
              <div className="text-gray-600">{lastSpermaDate}</div>

              {/* ACTIONS */}
              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/kapros/${k.id}`)}
                  className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg transition"
                >
                  ✏️
                </button>
                <button
                  onClick={() => deleteKaproi(k.id)}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg transition"
                >
                  🗑️
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 relative">
            <h2 className="text-2xl font-bold mb-6">Νέος Κάπρος</h2>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Αριθμός"
                className="border rounded-xl p-3 w-full focus:ring-2 focus:ring-green-500 outline-none"
                value={newKapro?.number || ""}
                onChange={(e) =>
                  setNewKapro({ ...newKapro, number: e.target.value })
                }
              />

              <select
                className="border rounded-xl p-3 w-full focus:ring-2 focus:ring-green-500 outline-none"
                value={newKapro?.position || ""}
                onChange={(e) =>
                  setNewKapro({ ...newKapro, position: e.target.value })
                }
              >
                <option value="">Θέση</option>
                {[
                  "Α1",
                  "Α2",
                  "Α3",
                  "Α4",
                  "Α5",
                  "Α6",
                  "Α7",
                  "Α8",
                  "Α9",
                  "Α10",
                  "Δ1",
                  "Δ2",
                  "Δ3",
                  "ΞΗΡΑ",
                  "ΤΟΚΕΤΟΣ",
                  "ΑΛΛΟΥ",
                ].map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>

              <input
                type="date"
                className="border rounded-xl p-3 w-full focus:ring-2 focus:ring-green-500 outline-none"
                value={newKapro?.dayLive || ""}
                onChange={(e) =>
                  setNewKapro({ ...newKapro, dayLive: e.target.value })
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
                onClick={saveNewKapro}
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
