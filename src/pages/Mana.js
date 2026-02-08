import { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { parseISO, isValid, addDays, format } from "date-fns";

export default function Mana() {
  const { id } = useParams();
  const [mana, setMana] = useState({});
  const [toketoi, setToketoi] = useState([]);
  const [showAll, setShowAll] = useState(false);

  // Κάπροι για επιλογή στις επιβάσεις
  const [kaproi, setKaproi] = useState([]);
  useEffect(() => {
    const fetchKaproi = async () => {
      try {
        const res = await axios.get("http://localhost:3001/kaproi");
        setKaproi(res.data);
      } catch (err) {
        console.error(err);
        toast.error("Σφάλμα φόρτωσης καπρών");
      }
    };
    fetchKaproi();
  }, []);

  // Βοηθητική συνάρτηση για ασφαλή εμφάνιση ημερομηνιών
  const safeDate = (date) => (!date || date === "0000-00-00" ? "-" : date);

  // Load Mana + Toketoi + Epibaseis
  useEffect(() => {
    const loadData = async () => {
      try {
        const resMana = await axios.get(`http://localhost:3001/manes/${id}`);
        setMana(resMana.data);

        const resTok = await axios.get(`http://localhost:3001/toketos/${id}`);
        const full = await Promise.all(
          resTok.data.map(async (t) => {
            const ep = await axios.get(`http://localhost:3001/epibasi/${t.id}`);
            return { ...t, epibaseis: ep.data || [] };
          }),
        );
        setToketoi(full);
      } catch (err) {
        console.error(err);
        toast.error("Σφάλμα φόρτωσης δεδομένων");
      }
    };
    loadData();
  }, [id]);

  // Μεταβλητή για εμφάνιση καρτελών τοκετών
  const visibleToketoi = showAll ? toketoi : toketoi.slice(-1);

  // Ενημέρωση Χοιρομητέρας
  const updateMana = async (key, value) => {
    try {
      const updatedMana = { ...mana, [key]: value };
      const res = await axios.put(
        `http://localhost:3001/manes/${id}`,
        updatedMana,
      );
      setMana(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Σφάλμα ενημέρωσης χοιρομητέρας");
    }
  };

  // Ενημέρωση τοκετού
  const updateToketo = (id, key, value) =>
    setToketoi((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [key]: value } : t)),
    );

  // Ενημέρωση επίβασης
  const updateEpibasi = (toketoId, epId, key, value) =>
    setToketoi((prev) =>
      prev.map((t) =>
        t.id === toketoId
          ? {
              ...t,
              epibaseis: t.epibaseis.map((e) =>
                e.id === epId ? { ...e, [key]: value } : e,
              ),
            }
          : t,
      ),
    );

  // Αποθήκευση τοκετού
  const saveToketo = async (t) => {
    try {
      const res = await axios.put(`http://localhost:3001/toketos/${t.id}`, t);
      setToketoi((prev) =>
        prev.map((tok) =>
          tok.id === t.id ? { ...res.data, epibaseis: tok.epibaseis } : tok,
        ),
      );
      toast.success("Τοκετός αποθηκεύτηκε!");
    } catch (err) {
      console.error(err);
      toast.error("Σφάλμα αποθήκευσης τοκετού");
    }
  };

  // Διαγραφή τοκετού
  const deleteToketo = async (idToketo) => {
    if (!window.confirm("Διαγραφή τοκετού;")) return;
    try {
      await axios.delete(`http://localhost:3001/toketos/${idToketo}`);
      setToketoi((p) => p.filter((t) => t.id !== idToketo));
      toast.info("Τοκετός διαγράφηκε");
    } catch (err) {
      console.error(err);
      toast.error("Σφάλμα διαγραφής τοκετού");
    }
  };

  // Προσθήκη νέου τοκετού
  const addToketo = async () => {
    try {
      const res = await axios.post("http://localhost:3001/toketos", {
        idManas: id,
        dayToketos: "",
        bornLive: "",
        bornDead: "",
        Ablactation: "",
        dayAblactation: "",
        rate: "",
        text: "",
      });
      setToketoi([...toketoi, { ...res.data, epibaseis: [] }]);
      toast.success("Νέος τοκετός προστέθηκε!");
    } catch (err) {
      console.error(err);
      toast.error("Σφάλμα προσθήκης τοκετού");
    }
  };

  // Προσθήκη νέας επίβασης
  const addEpibasi = async (toketoId) => {
    try {
      const res = await axios.post("http://localhost:3001/epibasi", {
        idToketou: toketoId,
        day: "",
        idKapros: "",
        text: "",
        rejection: 0,
      });
      setToketoi((prev) =>
        prev.map((t) =>
          t.id === toketoId
            ? { ...t, epibaseis: [...t.epibaseis, res.data] }
            : t,
        ),
      );
      toast.success("Νέα επίβαση προστέθηκε!");
    } catch (err) {
      console.error(err);
      toast.error("Σφάλμα προσθήκης επίβασης");
    }
  };

  // Αποθήκευση επίβασης
  const saveEpibasi = async (toketoId, epId) => {
    try {
      const toketo = toketoi.find((t) => t.id === toketoId);
      const ep = toketo.epibaseis.find((e) => e.id === epId);
      await axios.put(`http://localhost:3001/epibasi/${ep.id}`, ep);
      toast.success("Επίβαση αποθηκεύτηκε!");
    } catch (err) {
      console.error(err);
      toast.error("Σφάλμα αποθήκευσης επίβασης");
    }
  };

  // Διαγραφή επίβασης
  const deleteEpibasi = async (toketoId, epId) => {
    if (!window.confirm("Διαγραφή επίβασης;")) return;
    try {
      await axios.delete(`http://localhost:3001/epibasi/${epId}`);
      setToketoi((prev) =>
        prev.map((t) =>
          t.id === toketoId
            ? { ...t, epibaseis: t.epibaseis.filter((e) => e.id !== epId) }
            : t,
        ),
      );
      toast.info("Επίβαση διαγράφηκε");
    } catch (err) {
      console.error(err);
      toast.error("Σφάλμα διαγραφής επίβασης");
    }
  };

  // Τελευταία επίβαση
  const lastEpibasi = toketoi
    .flatMap((t) => t.epibaseis)
    .filter((e) => e.day && e.day !== "0000-00-00")
    .sort((a, b) => new Date(b.day) - new Date(a.day))[0];

  // Τελευταία ημερομηνία επιβάσης και υπολογισμός τοκετού
  let dayToEpibasi = "-";
  let dayToToketo = "-";
  let isRejected = "";
  if (lastEpibasi && isValid(parseISO(lastEpibasi.day))) {
    dayToEpibasi = format(parseISO(lastEpibasi.day), "dd/MM/yyyy");
    dayToToketo = format(addDays(parseISO(lastEpibasi.day), 116), "dd/MM/yyyy");
    isRejected = Boolean(lastEpibasi.rejection);
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <ToastContainer position="top-right" autoClose={2000} />

      {/* --- Μάνα --- */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        <h1 className="text-3xl font-bold mb-4 text-center">{mana.number}</h1>
        <h2 className="text-2xl font-bold mb-4">Βασικά Στοιχεία Μάνας:</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm sm:text-base">
          <span>
            Θέση:
            <select
              value={mana.position || ""}
              onChange={(e) => updateMana("position", e.target.value)}
              className="ml-2 p-2 border rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
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
          </span>

          <span>
            Ράτσα:
            <select
              value={mana.breed || ""}
              onChange={(e) => updateMana("breed", e.target.value)}
              className="ml-2 p-2 border rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
            >
              <option value="">διάλεξε</option>
              {[
                "Landrace",
                "Yorkshire",
                "Duroc",
                "F1",
                "F2-Landrace",
                "F2-Yorkshire",
              ].map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </span>

          <span>
            Ημερομηνία Γεννήσεως:
            <input
              type="date"
              value={safeDate(mana.dayLive)}
              onChange={(e) => updateMana("dayLive", e.target.value)}
              className="ml-2 p-2 border rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
            />
          </span>

          {!isRejected && (
            <>
              <span>
                Ημερομηνία Τοκετού: <b>{dayToToketo}</b>
              </span>
              <span>
                Τελευταία Επίβαση: <b>{dayToEpibasi}</b>
              </span>
            </>
          )}
        </div>
      </div>

      {/* --- Κουμπιά --- */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl shadow transition"
        >
          {showAll ? "Εμφάνιση τελευταίου" : "Εμφάνιση όλων"}
        </button>

        <button
          onClick={addToketo}
          className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl shadow transition"
        >
          + Προσθήκη Τοκετού
        </button>
      </div>

      {/* --- Καρτέλες Τοκετού --- */}
      <div className="space-y-4">
        {visibleToketoi.map((t, idx) => (
          <div
            key={t.id}
            className={`bg-white rounded-2xl shadow p-4 space-y-4 transition-transform hover:scale-[1.01] ${
              idx === visibleToketoi.length - 1
                ? "border-2 border-green-500 ring-2 ring-green-200"
                : ""
            }`}
          >
            {/* Τοκετός */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="font-semibold block mb-1">
                  Ημερομηνία Τοκετού:
                </label>
                <input
                  type="date"
                  value={safeDate(t.dayToketos)}
                  onChange={(e) =>
                    updateToketo(t.id, "dayToketos", e.target.value)
                  }
                  className="w-full p-2 border rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Ζωντανά:</label>
                <input
                  type="text"
                  value={t.bornLive || ""}
                  onChange={(e) =>
                    updateToketo(t.id, "bornLive", e.target.value)
                  }
                  className="w-full p-2 border rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Νεκρά:</label>
                <input
                  type="text"
                  value={t.bornDead || ""}
                  onChange={(e) =>
                    updateToketo(t.id, "bornDead", e.target.value)
                  }
                  className="w-full p-2 border rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">
                  Ημέρα Απογαλακτισμού:
                </label>
                <input
                  type="date"
                  value={safeDate(t.dayAblactation)}
                  onChange={(e) =>
                    updateToketo(t.id, "dayAblactation", e.target.value)
                  }
                  className="w-full p-2 border rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
            </div>

            {/* Κουμπιά Τοκετού */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => saveToketo(t)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl shadow transition"
              >
                💾 Αποθήκευση
              </button>
              <button
                onClick={() => deleteToketo(t.id)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl shadow transition"
              >
                🗑️ Διαγραφή
              </button>
            </div>

            {/* Επιβάσεις */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {t.epibaseis.map((e) => (
                <div
                  key={e.id}
                  className="bg-gray-50 p-3 rounded-2xl shadow space-y-2"
                >
                  <label className="font-semibold block mb-1">
                    Ημερομηνία:
                  </label>
                  <input
                    type="date"
                    value={safeDate(e.day)}
                    onChange={(ev) =>
                      updateEpibasi(t.id, e.id, "day", ev.target.value)
                    }
                    className="w-full p-2 border rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                  />
                  <label className="font-semibold block mb-1">Κάπρος:</label>
                  <select
                    value={e.idKapros || ""}
                    onChange={(ev) =>
                      updateEpibasi(t.id, e.id, "idKapros", ev.target.value)
                    }
                    className="w-full p-2 border rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                  >
                    <option value="">-- διάλεξε --</option>
                    {kaproi.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.number}
                      </option>
                    ))}
                  </select>
                  <label className="font-semibold block mb-1">
                    Σημειώσεις:
                  </label>
                  <textarea
                    value={e.text || ""}
                    onChange={(ev) =>
                      updateEpibasi(t.id, e.id, "text", ev.target.value)
                    }
                    className="w-full p-2 border rounded-xl focus:ring-2 focus:ring-green-500 outline-none resize-none h-16"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={Boolean(e.rejection)}
                      onChange={(ev) =>
                        updateEpibasi(
                          t.id,
                          e.id,
                          "rejection",
                          ev.target.checked ? 1 : 0,
                        )
                      }
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                    />
                    <label>Απόρριψη</label>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => saveEpibasi(t.id, e.id)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-xl py-2 shadow transition"
                    >
                      💾
                    </button>
                    <button
                      onClick={() => deleteEpibasi(t.id, e.id)}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl py-2 shadow transition"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}

              {/* Προσθήκη νέας επίβασης */}
              <button
                onClick={() => addEpibasi(t.id)}
                className="sm:col-span-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2 shadow transition"
              >
                ➕ Νέα Επίβαση
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
