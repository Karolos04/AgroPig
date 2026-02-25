import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { parseISO, isValid, addDays, format } from "date-fns";

export default function Mana() {
  const apiUrl = process.env.REACT_APP_API_URL;

  const { id } = useParams();
  const navigate = useNavigate();
  const [mana, setMana] = useState({});
  const [toketoi, setToketoi] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [kaproi, setKaproi] = useState([]);
  const [thesiList, setThesiList] = useState([]);

  // Συνάρτηση για ασφαλή εμφάνιση ημερομηνιών
  const safeDate = (date) =>
    !date || date === "0000-00-00" ? "" : date.split("T")[0];

  // Φόρτωση βοηθητικών δεδομένων (κάπροι και θέσεις) κατά την αρχική φόρτωση της σελίδας
  useEffect(() => {
    const fetchLookups = async () => {
      try {
        const [resKaproi, resThesi] = await Promise.all([
          axios.get(`${apiUrl}/kaproi`),
          axios.get(`${apiUrl}/thesi`),
        ]);
        setKaproi(resKaproi.data);
        setThesiList(resThesi.data);
      } catch (err) {
        toast.error("Σφάλμα φόρτωσης βοηθητικών δεδομένων");
      }
    };
    fetchLookups();
  }, []);

  // Φόρτωση δεδομένων της μάνας και των τοκετών της κατά την αρχική φόρτωση της σελίδας ή όταν αλλάζει το ID της μάνας
  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await axios.get(`${apiUrl}/manes/${id}`);
        const data = res.data;
        setMana({
          id: data.id,
          number: data.number,
          positionId: data.positionId,
          breed: data.breed,
          dayLive: data.dayLive,
        });
        const formattedToketoi = (data.toketos || data.toketoi || []).map(
          (t) => ({
            ...t,
            epibaseis: t.epibasis || t.epibaseis || [],
          }),
        );
        setToketoi(formattedToketoi);
      } catch (err) {
        toast.error("Σφάλμα φόρτωσης δεδομένων της μάνας");
      }
    };
    loadData();
  }, [id]);

  // Επιλογή τοκετών προς εμφάνιση με βάση την κατάσταση του φίλτρου "Εμφάνιση Όλων"
  const visibleToketoi = showAll ? toketoi : toketoi.slice(-1);

  // Συνάρτηση για ενημέρωση πεδίων της μάνας με αποθήκευση στο backend και εμφάνιση ειδοποιήσεων
  const updateMana = async (key, value) => {
    try {
      const updatedMana = { ...mana, [key]: value };
      const res = await axios.put(`${apiUrl}/manes/${id}`, updatedMana);
      setMana({ ...res.data, positionId: res.data.positionId });
      toast.success("Η καρτέλα ενημερώθηκε!");
    } catch (err) {
      toast.error("Σφάλμα ενημέρωσης χοιρομητέρας");
    }
  };

  // Συνάρτηση για ενημέρωση πεδίων τοκετού και επιβάσεων με τοπική ενημέρωση της κατάστασης και αποθήκευση στο backend
  const updateToketo = (id, key, value) =>
    setToketoi((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [key]: value } : t)),
    );
  // Για τις επιβάσεις, χρειάζεται να ενημερώσουμε τη σωστή επίβαση μέσα στον σωστό τοκετό
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

  // Συνάρτηση για αποθήκευση τοκετού με ενημέρωση στο backend και εμφάνιση ειδοποιήσεων
  const saveToketo = async (t) => {
    try {
      const res = await axios.put(`${apiUrl}/toketos/${t.id}`, t);
      setToketoi((prev) =>
        prev.map((tok) =>
          tok.id === t.id ? { ...res.data, epibaseis: tok.epibaseis } : tok,
        ),
      );
      toast.success("Ο Τοκετός αποθηκεύτηκε!");
    } catch (err) {
      toast.error("Σφάλμα αποθήκευσης τοκετού");
    }
  };

  // Συνάρτηση για διαγραφή τοκετού με επιβεβαίωση και ενημέρωση της λίστας τοκετών μετά τη διαγραφή
  const deleteToketo = async (idToketo) => {
    if (
      !window.confirm("Διαγραφή τοκετού; Θα διαγραφούν και οι επιβάσεις του!")
    )
      return;
    try {
      await axios.delete(`${apiUrl}/toketos/${idToketo}`);
      setToketoi((p) => p.filter((t) => t.id !== idToketo));
      toast.info("Ο Τοκετός διαγράφηκε");
    } catch (err) {
      toast.error("Σφάλμα διαγραφής τοκετού");
    }
  };

  // Συνάρτηση για προσθήκη νέου τοκετού με αρχικές κενές τιμές και ενημέρωση της λίστας τοκετών μετά την προσθήκη
  const addToketo = async () => {
    try {
      const res = await axios.post(`${apiUrl}/toketos`, {
        idManas: id,
      });
      setToketoi([...toketoi, { ...res.data, epibaseis: [] }]);
      toast.success("Νέος τοκετός προστέθηκε!");
    } catch (err) {
      toast.error("Σφάλμα προσθήκης τοκετού");
    }
  };

  // Συνάρτηση για προσθήκη νέας επίβασης με αρχικές κενές τιμές και ενημέρωση της λίστας επιβάσεων μέσα στον σωστό τοκετό μετά την προσθήκη
  const addEpibasi = async (toketoId) => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const res = await axios.post(`${apiUrl}/epibasi`, {
        idToketou: toketoId,
        day: today,
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
      toast.error("Σφάλμα προσθήκης επίβασης");
    }
  };

  // Συνάρτηση για αποθήκευση επίβασης με ενημέρωση στο backend και εμφάνιση ειδοποιήσεων
  const saveEpibasi = async (toketoId, epId) => {
    try {
      const toketo = toketoi.find((t) => t.id === toketoId);
      const ep = toketo.epibaseis.find((e) => e.id === epId);
      await axios.put(`${apiUrl}/epibasi/${ep.id}`, ep);
      toast.success("Η Επίβαση αποθηκεύτηκε!");
    } catch (err) {
      toast.error("Σφάλμα αποθήκευσης επίβασης");
    }
  };

  // Συνάρτηση για διαγραφή επίβασης με επιβεβαίωση και ενημέρωση της λίστας επιβάσεων μέσα στον σωστό τοκετό μετά τη διαγραφή
  const deleteEpibasi = async (toketoId, epId) => {
    if (!window.confirm("Διαγραφή επίβασης;")) return;
    try {
      await axios.delete(`${apiUrl}/epibasi/${epId}`);
      setToketoi((prev) =>
        prev.map((t) =>
          t.id === toketoId
            ? { ...t, epibaseis: t.epibaseis.filter((e) => e.id !== epId) }
            : t,
        ),
      );
      toast.info("Η Επίβαση διαγράφηκε");
    } catch (err) {
      toast.error("Σφάλμα διαγραφής επίβασης");
    }
  };

  // Υπολογισμός ημερομηνιών επίβασης και τοκετού με βάση την τελευταία επίβαση που έχει ημερομηνία και εμφάνιση κατάστασης τοκετού (σε αναμονή, ολοκληρώθηκε, απορρίφθηκε)
  let dayToEpibasi = "—",
    dayToToketo = "—",
    isRejected = false,
    showExpectedDates = false;
  if (toketoi.length > 0) {
    const lastToketo = toketoi[toketoi.length - 1];
    const hasToketoDate =
      lastToketo.dayToketos && lastToketo.dayToketos !== "0000-00-00";
    if (!hasToketoDate) {
      const lastEpibasiInToketo = lastToketo.epibaseis
        .filter((e) => e.day && e.day !== "0000-00-00")
        .sort((a, b) => new Date(b.day) - new Date(a.day))[0];
      if (lastEpibasiInToketo && isValid(parseISO(lastEpibasiInToketo.day))) {
        dayToEpibasi = format(parseISO(lastEpibasiInToketo.day), "dd/MM/yyyy");
        dayToToketo = format(
          addDays(parseISO(lastEpibasiInToketo.day), 116),
          "dd/MM/yyyy",
        );
        isRejected = Boolean(lastEpibasiInToketo.rejection);
        showExpectedDates = true;
      }
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <ToastContainer position="top-right" autoClose={2000} />
      {/* HEADER CARD */}
      <div className="bg-white rounded-3xl shadow-sm p-6 md:p-8 border-t-8 border-green-500 relative">
        <button
          onClick={() => navigate("/manes")}
          className="absolute top-6 left-6 text-gray-400 hover:text-gray-800 font-bold transition-colors hidden sm:block"
        >
          ← Πίσω
        </button>
        <h1 className="text-4xl md:text-5xl font-black mb-8 text-center text-gray-800 tracking-tight">
          #{mana.number}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-gray-50/50 p-4 md:p-6 rounded-[2rem] border border-gray-100">
          <div className="flex flex-col">
            <span className="text-xs font-black text-gray-400 uppercase mb-2 pl-1">
              Θέση
            </span>
            <select
              value={mana.positionId || ""}
              onChange={(e) => updateMana("positionId", e.target.value)}
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

          <div className="flex flex-col">
            <span className="text-xs font-black text-gray-400 uppercase mb-2 pl-1">
              Ράτσα
            </span>
            <select
              value={mana.breed || ""}
              onChange={(e) => updateMana("breed", e.target.value)}
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

          <div className="flex flex-col">
            <span className="text-xs font-black text-gray-400 uppercase mb-2 pl-1">
              Ημερ. Γέννησης
            </span>
            <input
              type="date"
              value={safeDate(mana.dayLive)}
              onChange={(e) => updateMana("dayLive", e.target.value)}
              className="p-3.5 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none font-bold text-gray-800 transition-colors"
            />
          </div>

          <div className="flex flex-col justify-center gap-1.5 p-3">
            {showExpectedDates ? (
              !isRejected ? (
                <>
                  <span className="text-xs font-black text-gray-400 uppercase">
                    Αναμ. Τοκετός:{" "}
                    <span className="text-green-600 font-black text-lg ml-1">
                      {dayToToketo}
                    </span>
                  </span>
                  <span className="text-xs font-black text-gray-400 uppercase">
                    Τελ. Επίβαση:{" "}
                    <span className="text-gray-800 font-black ml-1">
                      {dayToEpibasi}
                    </span>
                  </span>
                </>
              ) : (
                <span className="bg-red-100 text-red-700 px-4 py-2 rounded-xl font-black text-center inline-block w-max shadow-sm">
                  ⚠️ Απορρίφθηκε
                </span>
              )
            ) : toketoi.length > 0 &&
              toketoi[toketoi.length - 1].dayToketos &&
              toketoi[toketoi.length - 1].dayToketos !== "0000-00-00" ? (
              <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-xl font-black text-center inline-block w-max shadow-sm">
                ✅ Ολοκληρώθηκε
              </span>
            ) : (
              <span className="text-sm font-bold text-gray-400 italic mt-2">
                Σε αναμονή επίβασης...
              </span>
            )}
          </div>
        </div>
      </div>

      {/* BUTTONS */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full sm:w-auto bg-gray-800 hover:bg-gray-900 active:scale-95 text-white font-bold px-6 py-3.5 rounded-2xl shadow-md transition-all"
        >
          {showAll ? "👀 Εμφάνιση Τελευταίου" : "📂 Εμφάνιση Όλων"}
        </button>
        <button
          onClick={addToketo}
          className="w-full sm:w-auto bg-green-600 hover:bg-green-700 active:scale-95 text-white font-bold px-6 py-3.5 rounded-2xl shadow-md transition-all"
        >
          + Προσθήκη Τοκετού
        </button>
      </div>

      {/* ΤΟΚΕΤΟΙ */}
      <div className="space-y-6">
        {visibleToketoi.map((t, idx) => (
          <div
            key={t.id}
            className={`bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6 md:p-8 space-y-6 transition-all hover:shadow-md ${idx === visibleToketoi.length - 1 ? "border-t-4 border-t-green-500" : ""}`}
          >
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 items-end">
              <div className="col-span-2 lg:col-span-1">
                <label className="font-black text-[11px] text-gray-400 uppercase block mb-2 pl-1">
                  Ημ. Τοκετού
                </label>
                <input
                  type="date"
                  value={safeDate(t.dayToketos)}
                  onChange={(e) =>
                    updateToketo(t.id, "dayToketos", e.target.value)
                  }
                  className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-green-500 transition-colors"
                />
              </div>
              <div>
                <label className="font-black text-[11px] text-gray-400 uppercase block mb-2 pl-1">
                  Ζωντανά
                </label>
                <input
                  type="text"
                  value={t.bornLive || ""}
                  onChange={(e) =>
                    updateToketo(t.id, "bornLive", e.target.value)
                  }
                  className="w-full p-3.5 bg-green-50/50 border border-green-100 rounded-2xl font-black outline-none text-center text-green-700 focus:ring-2 focus:ring-green-500 transition-colors"
                />
              </div>
              <div>
                <label className="font-black text-[11px] text-gray-400 uppercase block mb-2 pl-1">
                  Νεκρά
                </label>
                <input
                  type="text"
                  value={t.bornDead || ""}
                  onChange={(e) =>
                    updateToketo(t.id, "bornDead", e.target.value)
                  }
                  className="w-full p-3.5 bg-red-50/50 border border-red-100 rounded-2xl font-black outline-none text-center text-red-600 focus:ring-2 focus:ring-green-500 transition-colors"
                />
              </div>
              <div className="col-span-2 lg:col-span-1">
                <label className="font-black text-[11px] text-gray-400 uppercase block mb-2 pl-1">
                  Ημ. Απογαλακτ.
                </label>
                <input
                  type="date"
                  value={safeDate(t.dayAblactation)}
                  onChange={(e) =>
                    updateToketo(t.id, "dayAblactation", e.target.value)
                  }
                  className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-green-500 transition-colors"
                />
              </div>
              <div>
                <label className="font-black text-[11px] text-gray-400 uppercase block mb-2 pl-1">
                  Απογαλακτ.
                </label>
                <input
                  type="text"
                  value={t.Ablactation || ""}
                  onChange={(e) =>
                    updateToketo(t.id, "Ablactation", e.target.value)
                  }
                  className="w-full p-3.5 bg-blue-50/50 border border-blue-100 rounded-2xl font-black outline-none text-center text-blue-700 focus:ring-2 focus:ring-green-500 transition-colors"
                />
              </div>
              <div>
                <label className="font-black text-[11px] text-gray-400 uppercase block mb-2 pl-1">
                  Αξιολόγηση
                </label>
                <select
                  value={t.rate || ""}
                  onChange={(e) => updateToketo(t.id, "rate", e.target.value)}
                  className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-green-500 transition-colors cursor-pointer"
                >
                  <option value="">-</option>
                  {[
                    "Α++",
                    "Α+",
                    "Α",
                    "Α-",
                    "Β+",
                    "Β",
                    "Β-",
                    "Γ+",
                    "Γ",
                    "Γ-",
                  ].map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-end border-b border-gray-100 pb-8">
              <div className="lg:col-span-3">
                <label className="font-black text-[11px] text-gray-400 uppercase block mb-2 pl-1">
                  Σημειώσεις Τοκετού
                </label>
                <textarea
                  value={t.text || ""}
                  onChange={(e) => updateToketo(t.id, "text", e.target.value)}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl font-medium outline-none resize-none h-14 focus:ring-2 focus:ring-green-500 transition-colors"
                  placeholder="Προσθήκη σημείωσης..."
                />
              </div>
              <div className="flex gap-2 h-14">
                <button
                  onClick={() => saveToketo(t)}
                  className="flex-1 bg-green-100 hover:bg-green-200 text-green-800 font-black rounded-2xl transition-colors shadow-sm active:scale-95"
                >
                  💾 Αποθήκευση
                </button>
                <button
                  onClick={() => deleteToketo(t.id)}
                  className="px-5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-2xl transition-colors shadow-sm active:scale-95"
                >
                  🗑️
                </button>
              </div>
            </div>

            {/* ΕΠΙΒΑΣΕΙΣ */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pt-2">
              {t.epibaseis.map((e) => (
                <div
                  key={e.id}
                  className={`p-5 rounded-3xl border transition-colors ${e.rejection ? "bg-red-50/50 border-red-200" : "bg-gray-50/50 border-gray-200"} space-y-4 relative`}
                >
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="font-black text-[10px] text-gray-400 uppercase block mb-1.5 pl-1">
                        Ημερομηνία
                      </label>
                      <input
                        type="date"
                        value={safeDate(e.day)}
                        onChange={(ev) =>
                          updateEpibasi(t.id, e.id, "day", ev.target.value)
                        }
                        className="w-full p-2.5 border border-gray-200 rounded-xl font-bold outline-none bg-white text-sm focus:ring-2 focus:ring-green-500 transition-colors"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="font-black text-[10px] text-gray-400 uppercase block mb-1.5 pl-1">
                        Κάπρος
                      </label>
                      <select
                        value={e.idKapros || ""}
                        onChange={(ev) =>
                          updateEpibasi(t.id, e.id, "idKapros", ev.target.value)
                        }
                        className="w-full p-2.5 border border-gray-200 rounded-xl font-bold outline-none bg-white text-sm focus:ring-2 focus:ring-green-500 transition-colors cursor-pointer"
                      >
                        <option value="">Επιλογή</option>
                        {kaproi.map((k) => (
                          <option key={k.id} value={k.id}>
                            {k.number}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <textarea
                    value={e.text || ""}
                    onChange={(ev) =>
                      updateEpibasi(t.id, e.id, "text", ev.target.value)
                    }
                    className="w-full p-3 border border-gray-200 rounded-xl font-medium outline-none bg-white text-sm resize-none h-16 focus:ring-2 focus:ring-green-500 transition-colors"
                    placeholder="Σημειώσεις επίβασης..."
                  />

                  <div className="flex items-center justify-between mt-2 pt-4 border-t border-gray-200">
                    <label className="flex items-center gap-2 cursor-pointer group">
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
                        className="w-5 h-5 text-red-600 rounded-md border-gray-300 focus:ring-red-500 cursor-pointer"
                      />
                      <span className="font-bold text-sm text-gray-600 group-hover:text-red-600 transition-colors">
                        Απόρριψη
                      </span>
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEpibasi(t.id, e.id)}
                        className="bg-white border border-gray-200 hover:bg-green-50 hover:border-green-200 hover:text-green-700 p-2.5 rounded-xl transition-colors shadow-sm text-sm active:scale-95"
                      >
                        💾
                      </button>
                      <button
                        onClick={() => deleteEpibasi(t.id, e.id)}
                        className="bg-white border border-gray-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 p-2.5 rounded-xl transition-colors shadow-sm text-sm active:scale-95"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={() => addEpibasi(t.id)}
                className="border-2 border-dashed border-gray-300 hover:border-green-500 hover:bg-green-50 text-gray-400 hover:text-green-700 rounded-3xl p-4 transition-all flex flex-col items-center justify-center font-black active:scale-95 min-h-[160px] group"
              >
                <span className="text-4xl mb-1 group-hover:scale-110 transition-transform">
                  +
                </span>{" "}
                Νέα Επίβαση
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
