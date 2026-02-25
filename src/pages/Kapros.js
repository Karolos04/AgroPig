import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { format, parseISO, isValid } from "date-fns";
import { toast } from "react-toastify";

export default function Kapros() {
  const apiUrl = process.env.REACT_APP_API_URL;

  const { id } = useParams();
  const navigate = useNavigate();
  const [kapros, setKapros] = useState({});
  const [spermaList, setSpermaList] = useState([]);
  const [thesiList, setThesiList] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortAsc, setSortAsc] = useState(false);
  // Προεπιλεγμένη ημερομηνία για νέα σπερματέγχυση είναι η σημερινή
  const today = new Date().toISOString().split("T")[0];
  const [newSperma, setNewSperma] = useState({
    day: today,
    grams: "",
    rate: "",
  });
  const safeDate = (date) =>
    !date || date === "0000-00-00" ? "" : date.split("T")[0];

  // Φόρτωση δεδομένων καπρού, σπερμάτων και θέσεων κατά την αρχική φόρτωση της σελίδας
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resKapros, resSperma, resThesi] = await Promise.all([
          axios.get(`${apiUrl}/kaproi/${id}`),
          axios.get(`${apiUrl}/kaproi/sperma/${id}`),
          axios.get(`${apiUrl}/thesi`),
        ]);
        setKapros(resKapros.data);
        setSpermaList(Array.isArray(resSperma.data) ? resSperma.data : []);
        setThesiList(resThesi.data);
      } catch (err) {
        toast.error("Σφάλμα φόρτωσης δεδομένων");
      }
    };
    fetchData();
  }, [id]);

  const updateKapros = async (field, value) => {
    try {
      const updated = { ...kapros, [field]: value };
      const res = await axios.put(`${apiUrl}/kaproi/${id}`, updated);
      setKapros(res.data);
      toast.success("Η καρτέλα ενημερώθηκε!");
    } catch (err) {
      toast.error("Σφάλμα ενημέρωσης καρτέλας");
    }
  };

  // Εύρεση ονόματος θέσης καπρού με βάση το positionId
  const thesiName =
    thesiList.find((t) => t.id === Number(kapros.positionId))?.name || "—";

  // Συνάρτηση για αποθήκευση νέας σπερματέγχυσης με έλεγχο εγκυρότητας των πεδίων και ενημέρωση της λίστας σπερμάτων μετά την αποθήκευση
  const saveNewSperma = async () => {
    if (!newSperma.grams || !newSperma.day)
      return toast.error("Συμπλήρωσε Ημερομηνία & Γραμμάρια");
    try {
      const res = await axios.post(`${apiUrl}/sperma`, {
        ...newSperma,
        idKapros: id,
      });
      setSpermaList((prev) => [...prev, res.data]);
      setNewSperma({ day: today, grams: "", rate: "" });
      setIsModalOpen(false);
      toast.success("Η σπερματέγχυση αποθηκεύτηκε");
    } catch (err) {
      toast.error("Σφάλμα αποθήκευσης");
    }
  };

  // Συνάρτηση για διαγραφή σπερματέγχυσης με επιβεβαίωση και ενημέρωση της λίστας σπερμάτων μετά τη διαγραφή
  const deleteSperma = async (sId) => {
    if (!window.confirm("Είστε σίγουροι για τη διαγραφή;")) return;
    try {
      await axios.delete(`${apiUrl}/sperma/${sId}`);
      setSpermaList((prev) => prev.filter((s) => s.id !== sId));
      toast.info("Το σπέρμα διαγράφηκε");
    } catch (err) {
      toast.error("Σφάλμα διαγραφής");
    }
  };

  // Συνάρτηση για ασφαλή εμφάνιση ημερομηνίας, επιστρέφοντας "—" για μη έγκυρες ή κενές ημερομηνίες
  const safeDateDisplay = (dateStr) => {
    if (!dateStr || dateStr === "0000-00-00") return "—";

    const parsed = parseISO(dateStr);
    return isValid(parsed) ? format(parsed, "dd/MM/yyyy") : "—";
  };

  // Ταξινόμηση της λίστας σπερμάτων με βάση την ημερομηνία, είτε σε αύξουσα είτε σε φθίνουσα σειρά ανάλογα με την κατάσταση sortAsc
  const sortedList = [...spermaList].sort((a, b) => {
    return sortAsc
      ? new Date(a.day) - new Date(b.day)
      : new Date(b.day) - new Date(a.day);
  });

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      {/* HEADER CARD */}
      <div className="bg-white rounded-3xl shadow-sm p-6 md:p-10 relative border-t-8 border-green-500">
        <button
          onClick={() => navigate("/kaproi")}
          className="absolute top-6 left-6 text-gray-400 hover:text-gray-800 font-bold transition-colors hidden sm:block"
        >
          ← Πίσω
        </button>

        <h1 className="text-4xl md:text-5xl font-black text-center text-gray-800 tracking-tight">
          <input
            type="text"
            value={kapros.number || ""}
            onChange={(e) => setKapros({ ...kapros, number: e.target.value })}
            className="bg-transparent border-2 border-gray-300 rounded-3xl px-4 py-2 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-colors text-center w-max mx-auto font-black text-gray-800 text-4xl"
            placeholder="Αριθμός Καπρού"
          />
        </h1>

        <div className="mt-8 flex flex-wrap justify-center gap-4 md:gap-6 text-sm md:text-base">
          <div className="bg-gray-50 px-6 py-4 rounded-3xl border border-gray-100 text-center min-w-[140px] shadow-sm">
            <div className="flex flex-col">
              <span className="text-xs font-black text-gray-400 uppercase mb-2 pl-1">
                Θέση
              </span>
              <select
                value={kapros.positionId || ""}
                onChange={(e) => updateKapros("positionId", e.target.value)}
                className="p-3.5 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none font-bold text-gray-800 transition-colors cursor-pointer"
              >
                <option value="">Επιλογή Θέσης</option>
                {thesiList.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="bg-gray-50 px-6 py-4 rounded-3xl border border-gray-100 text-center min-w-[140px] shadow-sm">
            <div className="flex flex-col">
              <span className="text-xs font-black text-gray-400 uppercase mb-2 pl-1">
                Ράτσα
              </span>
              <select
                value={kapros.breed || ""}
                onChange={(e) => updateKapros("breed", e.target.value)}
                className="p-3.5 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none font-bold text-gray-800 transition-colors cursor-pointer"
              >
                <option value="">Επιλογή Ράτσας</option>
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
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-black text-gray-400 uppercase mb-2 pl-1">
              Ημερ. Γέννησης
            </span>
            <input
              type="date"
              value={safeDate(kapros.dayLive)}
              onChange={(e) => updateKapros("dayLive", e.target.value)}
              className="p-3.5 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none font-bold text-gray-800 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* BUTTONS */}
      <div className="flex justify-between items-center bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
        <button
          onClick={() => setSortAsc(!sortAsc)}
          className="bg-gray-50 border border-gray-200 hover:bg-gray-100 px-5 py-3 rounded-2xl font-bold text-gray-700 transition-colors active:scale-95"
        >
          Ημερομηνία {sortAsc ? "↑ (Παλαιότερα)" : "↓ (Νεότερα)"}
        </button>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-2xl shadow-md transition-all font-bold active:scale-95 text-lg"
        >
          + Προσθήκη
        </button>
      </div>

      {/* ΛΙΣΤΑ ΣΠΕΡΜΑΤΩΝ */}
      <div className="space-y-4">
        {sortedList.length === 0 ? (
          <div className="text-center font-bold text-gray-400 py-12 bg-white rounded-3xl border-2 border-dashed border-gray-200">
            Δεν υπάρχουν καταγεγραμμένα σπέρματα.
          </div>
        ) : (
          sortedList.map((s, index) => (
            <div
              key={s.id}
              className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:shadow-md hover:border-blue-200 border-l-8 border-l-blue-400 group"
            >
              <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-10 flex-1 pl-2">
                <span className="text-gray-300 font-black text-xl w-10">
                  {sortAsc ? `#${index + 1}` : `#${sortedList.length - index}`}
                </span>

                <div className="flex flex-col">
                  <span className="text-[11px] font-black uppercase text-gray-400 mb-0.5">
                    Ημερομηνία
                  </span>
                  <span className="text-gray-800 font-black text-xl">
                    {safeDateDisplay(s.day)}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-[11px] font-black uppercase text-gray-400 mb-0.5">
                    Γραμμάρια
                  </span>
                  <span className="bg-blue-50 text-blue-800 px-4 py-1 rounded-xl font-black text-lg w-max">
                    {s.grams}g
                  </span>
                </div>

                {s.rate && (
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black uppercase text-gray-400 mb-0.5">
                      Βαθμολογία
                    </span>
                    <span className="bg-yellow-50 text-yellow-800 px-4 py-1 rounded-xl font-black text-lg w-max">
                      {s.rate}
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={() => deleteSperma(s.id)}
                className="bg-red-50 hover:bg-red-100 text-red-600 font-bold px-5 py-3 rounded-2xl w-full md:w-auto transition-colors active:scale-95"
              >
                🗑️ Διαγραφή
              </button>
            </div>
          ))
        )}
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white p-8 rounded-[2rem] w-full max-w-md shadow-2xl relative animate-in zoom-in duration-200">
            <h2 className="text-3xl font-black mb-6 text-gray-800 tracking-tight">
              Νέο Σπέρμα
            </h2>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-[11px] font-black text-gray-400 uppercase mb-2 block pl-1">
                  Ημερομηνία
                </label>
                <input
                  type="date"
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 font-bold text-gray-700 transition-colors"
                  value={newSperma.day}
                  onChange={(e) =>
                    setNewSperma({ ...newSperma, day: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-[11px] font-black text-gray-400 uppercase mb-2 block pl-1">
                  Γραμμάρια
                </label>
                <input
                  type="number"
                  placeholder="π.χ. 100"
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 font-bold text-gray-700 transition-colors"
                  value={newSperma.grams}
                  onChange={(e) =>
                    setNewSperma({ ...newSperma, grams: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-[11px] font-black text-gray-400 uppercase mb-2 block pl-1">
                  Βαθμολογία (Προαιρετικό)
                </label>
                <input
                  type="text"
                  placeholder="π.χ. Α, Β, 10..."
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 font-bold text-gray-700 transition-colors"
                  value={newSperma.rate}
                  onChange={(e) =>
                    setNewSperma({ ...newSperma, rate: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-4 rounded-2xl bg-gray-100 font-bold text-gray-600 hover:bg-gray-200 transition-colors"
              >
                Άκυρο
              </button>
              <button
                onClick={saveNewSperma}
                className="flex-1 py-4 rounded-2xl bg-green-600 hover:bg-green-700 text-white shadow-md transition-all font-bold active:scale-95"
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
