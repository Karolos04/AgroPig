import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { format, parseISO, isValid, addDays } from "date-fns";
import { toast } from "react-toastify";

export default function Manes() {
  const [listManes, setListManes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // "", "rejected", "notoketo"

  const [positionFilter, setPositionFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newMana, setNewMana] = useState({
    number: "",
    position: "",
    dayLive: "",
    breed: "",
  });

  const navigate = useNavigate();
  const countmanes = listManes.filter((mana) => Number(mana.live) === 0).length;

  /* ================= HELPERS ================= */
  const getDaysToToketo = (m) => {
    if (!m.toketoi || m.toketoi.length === 0) return Infinity;
    if (m.position === "ΤΟΚΕΤΟΣ") return Infinity;

    const lastEpibasi = m.toketoi
      .flatMap((t) => t.epibaseis || [])
      .filter((e) => e.day && e.day !== "0000-00-00")
      .sort((a, b) => new Date(b.day) - new Date(a.day))[0];

    if (!lastEpibasi || !isValid(parseISO(lastEpibasi.day))) return Infinity;

    const toketoDate = addDays(parseISO(lastEpibasi.day), 116);
    return Math.ceil((toketoDate - new Date()) / (1000 * 60 * 60 * 24));
  };

  const getToketoBadgeColor = (days) => {
    if (days <= 7) return "bg-red-600";
    if (days <= 14) return "bg-orange-500";
    if (days <= 30) return "bg-yellow-500";
    return "bg-gray-500";
  };

  /* ================= FETCH ================= */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get("http://localhost:3001/manes");
        const manes = Array.isArray(res.data) ? res.data : [];

        const full = await Promise.all(
          manes.map(async (m) => {
            const resTok = await axios.get(
              `http://localhost:3001/toketos/${m.id}`,
            );
            const toketoi = Array.isArray(resTok.data) ? resTok.data : [];

            if (toketoi.length === 0) return { ...m, toketoi: [] };

            const lastToketos = toketoi.reduce((latest, current) =>
              !latest || current.id > latest.id ? current : latest,
            );

            const resEp = await axios.get(
              `http://localhost:3001/epibasi/${lastToketos.id}`,
            );
            lastToketos.epibaseis = Array.isArray(resEp.data) ? resEp.data : [];

            return { ...m, toketoi: [lastToketos] };
          }),
        );

        setListManes(full);
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, []);

  /* ================= FILTERS ================= */
  const filteredManes = listManes
    .filter((m) => m.number.toString().includes(searchTerm))
    .filter((m) => positionFilter === "" || m.position === positionFilter)
    .filter((m) => m.live === 0)
    .filter((m) => {
      if (statusFilter === "rejected") {
        const lastEp =
          m.toketoi?.[m.toketoi.length - 1]?.epibaseis?.slice(-1)[0];
        return lastEp?.rejection;
      }
      if (statusFilter === "notoketo") {
        const lastTok = m.toketoi?.[m.toketoi.length - 1];
        const lastEp = lastTok?.epibaseis?.slice(-1)[0];
        return !lastEp; // δεν υπάρχει τελευταία επίβαση
      }

      return true;
    })

    .sort((a, b) => {
      // παίρνουμε το rejection της τελευταίας επίβασης του τελευταίου τοκετού
      const aLastEp =
        a.toketoi?.[a.toketoi.length - 1]?.epibaseis?.slice(-1)[0];
      const bLastEp =
        b.toketoi?.[b.toketoi.length - 1]?.epibaseis?.slice(-1)[0];

      const aRejected = aLastEp?.rejection;
      const bRejected = bLastEp?.rejection;

      if (aRejected && !bRejected) return 1; // a στο τέλος
      if (!aRejected && bRejected) return -1; // b στο τέλος

      return getDaysToToketo(a) - getDaysToToketo(b);
    });

  /* ================= DELETE ================= */
  const deleteMana = async (id) => {
    if (!window.confirm("Διαγραφή μάνας;")) return;
    try {
      await axios.delete(`http://localhost:3001/manes/${id}`);
      setListManes((m) => m.filter((mana) => mana.id !== id));
      toast.info("Μάνα διαγράφηκε");
    } catch {
      toast.error("Σφάλμα διαγραφής");
    }
  };

  /* ================= SAVE NEW MANA ================= */
  const saveNewMana = async () => {
    if (!newMana.number || !newMana.position || !newMana.breed) {
      toast.error("Συμπλήρωσε όλα τα πεδία");
      return;
    }

    try {
      const res = await axios.post("http://localhost:3001/manes", {
        number: newMana.number,
        position: newMana.position,
        dayLive: newMana.dayLive,
        breed: newMana.breed,
        live: 0,
      });

      setListManes((prev) => [...prev, res.data]);
      setNewMana({ number: "", position: "", dayLive: "", breed: "" });
      setIsModalOpen(false);
      toast.success("Η μάνα αποθηκεύτηκε");
    } catch (err) {
      toast.error("Σφάλμα αποθήκευσης");
    }
  };

  /* ================= RENDER ================= */
  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      {/* TITLE & SEARCH */}
      <div className="bg-white rounded-2xl shadow border p-6 space-y-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">
          Μάνες
        </h1>

        <input
          type="text"
          placeholder={`Αναζήτηση σε ${countmanes} μάνες`}
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

          {/* Φίλτρο Απόρριψη / Χωρίς Τοκετό */}
          <select
            className="flex-1 p-3 border rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Όλες</option>
            <option value="rejected">Μόνο Απόρριψη</option>
            <option value="notoketo">Μόνο Χωρίς Επίβαση</option>
          </select>
        </div>
      </div>

      {/* ADD BUTTON */}
      <div className="flex justify-end">
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl shadow transition"
        >
          + Προσθήκη
        </button>
      </div>

      {/* CARDS LIST */}
      <div className="space-y-4">
        {filteredManes
          .filter((m) => {
            if (statusFilter === "rejected") {
              const lastEp =
                m.toketoi?.[m.toketoi.length - 1]?.epibaseis?.slice(-1)[0];
              return lastEp?.rejection;
            }
            if (statusFilter === "notoketo") {
              return (
                !m.toketoi ||
                m.toketoi.length === 0 ||
                m.toketoi[0].epibaseis?.length === 0
              );
            }
            return true;
          })
          .map((m) => {
            const lastToketoi = m.toketoi?.[m.toketoi.length - 1];
            const lastEp = lastToketoi?.epibaseis?.slice(-1)[0];
            const days = getDaysToToketo(m);

            const epibasiDate =
              lastEp && isValid(parseISO(lastEp.day))
                ? format(parseISO(lastEp.day), "dd/MM/yyyy")
                : "—";

            const toketoDate =
              lastEp && isValid(parseISO(lastEp.day))
                ? format(addDays(parseISO(lastEp.day), 116), "dd/MM/yyyy")
                : "—";

            const fullText = lastEp?.rejection
              ? "Απόρριψη"
              : days !== Infinity
                ? `${toketoDate} (${days} ημ.)`
                : "—";

            return (
              <div
                key={m.id}
                className="bg-white rounded-2xl shadow p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
              >
                {/* INFO */}
                <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6 flex-1">
                  <span className="font-bold text-lg">{m.number}</span>

                  <select
                    className="border rounded-lg p-2 focus:ring-2 focus:ring-green-500 outline-none"
                    value={m.position || ""}
                    onChange={(e) =>
                      axios
                        .put(`http://localhost:3001/manes/${m.id}`, {
                          ...m,
                          position: e.target.value,
                        })
                        .then((res) =>
                          setListManes((prev) =>
                            prev.map((x) => (x.id === m.id ? res.data : x)),
                          ),
                        )
                    }
                  >
                    <option value="">θέση</option>
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

                  <span>Τελ. Επίβαση: {epibasiDate}</span>

                  <span
                    className={`px-3 py-1 text-sm font-semibold text-white rounded-full ${
                      lastEp?.rejection
                        ? "bg-red-600"
                        : days !== Infinity
                          ? getToketoBadgeColor(days)
                          : "bg-gray-400"
                    }`}
                  >
                    {fullText}
                  </span>
                </div>

                {/* ACTIONS */}
                <div className="flex gap-2 mt-2 md:mt-0">
                  <button
                    onClick={() => navigate(`/mana/${m.id}`)}
                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg transition"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => deleteMana(m.id)}
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
            <h2 className="text-2xl font-bold mb-6">Νέα Μάνα</h2>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Αριθμός"
                className="border rounded-xl p-3 w-full focus:ring-2 focus:ring-green-500 outline-none"
                value={newMana.number}
                onChange={(e) =>
                  setNewMana({ ...newMana, number: e.target.value })
                }
              />

              <select
                className="border rounded-xl p-3 w-full focus:ring-2 focus:ring-green-500 outline-none"
                value={newMana.position}
                onChange={(e) =>
                  setNewMana({ ...newMana, position: e.target.value })
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
                  <option key={p}>{p}</option>
                ))}
              </select>

              <select
                value={newMana.breed}
                onChange={(e) =>
                  setNewMana({ ...newMana, breed: e.target.value })
                }
                className="border rounded-xl p-3 w-full focus:ring-2 focus:ring-green-500 outline-none"
              >
                <option value="">Ράτσα</option>
                {[
                  "Landrace",
                  "Yorkshire",
                  "Duroc",
                  "F1",
                  "F2-Landrace",
                  "F2-Yorkshire",
                ].map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </select>

              <input
                type="date"
                className="border rounded-xl p-3 w-full focus:ring-2 focus:ring-green-500 outline-none"
                value={newMana.dayLive}
                onChange={(e) =>
                  setNewMana({ ...newMana, dayLive: e.target.value })
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
                onClick={saveNewMana}
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
