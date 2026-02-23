import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { format, parseISO, isValid, addDays } from "date-fns";
import { toast } from "react-toastify";

export default function Manes() {
  const [listManes, setListManes] = useState([]);
  const [thesiList, setThesiList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [positionFilter, setPositionFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  const [newMana, setNewMana] = useState({
    number: "",
    positionId: "",
    dayLive: "",
    breed: "",
  });

  const countmanes = listManes.filter((mana) => Number(mana.live) === 0).length;

  const getDaysToToketo = (m) => {
    if (!m.toketoi || m.toketoi.length === 0) return Infinity;
    const currentThesi = thesiList.find((t) => t.id === Number(m.positionId));
    if (currentThesi && currentThesi.name === "ΤΟΚΕΤΟΣ") return Infinity;

    const lastToketo = m.toketoi[m.toketoi.length - 1];
    if (lastToketo.dayToketos && lastToketo.dayToketos !== "0000-00-00")
      return Infinity;

    const lastEpibasi = lastToketo.epibaseis
      ?.filter((e) => e.day && e.day !== "0000-00-00")
      .sort((a, b) => new Date(b.day) - new Date(a.day))[0];
    if (
      !lastEpibasi ||
      !isValid(parseISO(lastEpibasi.day)) ||
      lastEpibasi.rejection
    )
      return Infinity;

    const toketoDate = addDays(parseISO(lastEpibasi.day), 116);
    return Math.ceil((toketoDate - new Date()) / (1000 * 60 * 60 * 24));
  };

  const getToketoBadgeColor = (days) => {
    if (days < 0) return "bg-red-600";
    if (days <= 7) return "bg-orange-500";
    if (days <= 14) return "bg-yellow-500";
    return "bg-green-500";
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resManes, resThesi] = await Promise.all([
          axios.get("https://argopig-api.onrender.com/manes"),
          axios.get("https://argopig-api.onrender.com/thesi"),
        ]);
        setThesiList(resThesi.data);
        const manesData = Array.isArray(resManes.data) ? resManes.data : [];
        const formattedManes = manesData.map((m) => ({
          ...m,
          toketoi: m.toketos
            ? m.toketos.map((t) => ({
                ...t,
                epibaseis: t.epibasis || t.epibasi || t.epibaseis || [],
              }))
            : [],
        }));
        setListManes(formattedManes);
      } catch (err) {
        toast.error("Σφάλμα φόρτωσης χοιρομητέρων");
      }
    };
    fetchData();
  }, []);

  const filteredManes = listManes
    .filter((m) => m.number.toString().includes(searchTerm))
    .filter(
      (m) =>
        positionFilter === "" ||
        String(m.positionId) === String(positionFilter),
    )
    .filter((m) => m.live === 0)
    .filter((m) => {
      if (statusFilter === "rejected")
        return m.toketoi?.[m.toketoi.length - 1]?.epibaseis?.slice(-1)[0]
          ?.rejection;
      if (statusFilter === "notoketo")
        return !m.toketoi?.[m.toketoi.length - 1]?.epibaseis?.slice(-1)[0];
      return true;
    })
    .sort((a, b) => {
      const aRejected =
        a.toketoi?.[a.toketoi.length - 1]?.epibaseis?.slice(-1)[0]?.rejection;
      const bRejected =
        b.toketoi?.[b.toketoi.length - 1]?.epibaseis?.slice(-1)[0]?.rejection;
      if (aRejected && !bRejected) return 1;
      if (!aRejected && bRejected) return -1;
      return getDaysToToketo(a) - getDaysToToketo(b);
    });

  const deleteMana = async (id) => {
    if (!window.confirm("Διαγραφή μάνας; Θα διαγραφούν και οι τοκετοί της."))
      return;
    try {
      await axios.delete(`https://argopig-api.onrender.com/manes/${id}`);
      setListManes((m) => m.filter((mana) => mana.id !== id));
      toast.info("Η Μάνα διαγράφηκε");
    } catch {
      toast.error("Σφάλμα διαγραφής");
    }
  };

  const saveNewMana = async () => {
    if (!newMana.number || !newMana.positionId || !newMana.breed)
      return toast.error("Συμπλήρωσε όλα τα υποχρεωτικά πεδία");
    try {
      const res = await axios.post("https://argopig-api.onrender.com/manes", {
        ...newMana,
        live: 0,
      });
      setListManes((prev) => [...prev, { ...res.data, toketoi: [] }]);
      setNewMana({ number: "", positionId: "", dayLive: "", breed: "" });
      setIsModalOpen(false);
      toast.success("Η μάνα αποθηκεύτηκε");
    } catch (err) {
      toast.error("Σφάλμα αποθήκευσης");
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* HEADER CARD */}
      <div className="bg-white rounded-3xl shadow-sm p-6 md:p-8 border-t-8 border-green-500 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-800 tracking-tight">
            ΧΟΙΡΟΜΗΤΕΡΕΣ
          </h1>
          <p className="text-gray-500 font-medium mt-1">
            Σύνολο Ενεργών: {countmanes}
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-green-600 hover:bg-green-700 active:scale-95 text-white px-6 py-3 rounded-2xl shadow-md transition-all font-bold w-full sm:w-auto text-lg"
        >
          + Νέα Μάνα
        </button>
      </div>

      {/* SEARCH & FILTERS CARD */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4 md:p-6 flex flex-col md:flex-row gap-4">
        <input
          type="text"
          placeholder="Αναζήτηση αριθμού..."
          className="flex-1 p-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 font-bold text-gray-700 transition-colors"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="flex-1 p-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 font-bold text-gray-700 cursor-pointer transition-colors"
          value={positionFilter}
          onChange={(e) => setPositionFilter(e.target.value)}
        >
          <option value="">Όλες οι Θέσεις</option>
          {thesiList.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <select
          className="flex-1 p-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 font-bold text-gray-700 cursor-pointer transition-colors"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Όλες οι Καταστάσεις</option>
          <option value="rejected">Μόνο Απόρριψη</option>
          <option value="notoketo">Χωρίς Επίβαση</option>
        </select>
      </div>

      {/* LIST ITEMS */}
      <div className="space-y-4">
        {filteredManes.map((m) => {
          const lastToketo = m.toketoi?.[m.toketoi.length - 1];
          const hasBorn =
            lastToketo?.dayToketos && lastToketo.dayToketos !== "0000-00-00";
          const lastEp = lastToketo?.epibaseis?.slice(-1)[0];
          const days = getDaysToToketo(m);

          const epibasiDate =
            lastEp && isValid(parseISO(lastEp.day))
              ? format(parseISO(lastEp.day), "dd/MM/yyyy")
              : "—";
          const toketoDate =
            lastEp && isValid(parseISO(lastEp.day))
              ? format(addDays(parseISO(lastEp.day), 116), "dd/MM/yyyy")
              : "—";

          let statusBadge = "—";
          let badgeColor = "bg-gray-400";

          if (lastEp?.rejection) {
            statusBadge = "Απόρριψη";
            badgeColor = "bg-red-600";
          } else if (hasBorn) {
            statusBadge = "Γέννησε";
            badgeColor = "bg-blue-500";
          } else if (days !== Infinity) {
            statusBadge =
              days === 0
                ? "Σήμερα!"
                : days < 0
                  ? `Πέρασε ${Math.abs(days)} ημ.`
                  : `σε ${days} ημ.`;
            badgeColor = getToketoBadgeColor(days);
          } else {
            statusBadge = "Κενή";
          }

          return (
            <div
              key={m.id}
              className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-6 transition-all hover:shadow-md hover:border-green-200 group"
            >
              <div className="flex flex-col md:flex-row md:items-center gap-6 lg:gap-10 flex-1">
                {/* ΚΑΛΥΤΕΡΟ ΚΕΝΟ ΑΝΑΜΕΣΑ ΣΕ ΑΡΙΘΜΟ ΚΑΙ ΘΕΣΗ */}
                <div className="flex items-center gap-6 w-full md:w-auto">
                  <span className="font-black text-2xl md:text-3xl text-gray-800 min-w-[90px]">
                    #{m.number}
                  </span>
                  <select
                    className="p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-bold text-gray-700 cursor-pointer transition-colors flex-1 md:w-[180px]"
                    value={m.positionId || ""}
                    onChange={(e) => {
                      const newPosId = e.target.value;
                      axios
                        .put(`https://argopig-api.onrender.com/manes/${m.id}`, {
                          positionId: newPosId,
                        })
                        .then(() => {
                          setListManes((p) =>
                            p.map((x) =>
                              x.id === m.id
                                ? { ...x, positionId: newPosId }
                                : x,
                            ),
                          );
                          toast.success("Ενημερώθηκε");
                        })
                        .catch(() => toast.error("Σφάλμα"));
                    }}
                  >
                    <option value="" disabled>
                      Επιλογή θέσης
                    </option>
                    {thesiList.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col">
                  <span className="text-[11px] font-black uppercase text-gray-400 mb-0.5">
                    Τελ. Επίβαση
                  </span>
                  <span className="font-black text-gray-800 text-lg">
                    {epibasiDate}
                  </span>
                </div>

                {days !== Infinity && !lastEp?.rejection && !hasBorn && (
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black uppercase text-gray-400 mb-0.5">
                      Ημ. Τοκετού
                    </span>
                    <span className="font-black text-green-600 text-lg">
                      {toketoDate}
                    </span>
                  </div>
                )}

                <div className="flex flex-col">
                  <span className="text-[11px] font-black uppercase text-gray-400 mb-0.5">
                    Κατάσταση
                  </span>
                  <span
                    className={`px-4 py-1.5 text-sm font-black text-white rounded-xl w-max shadow-sm ${badgeColor}`}
                  >
                    {statusBadge}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 w-full lg:w-auto mt-2 lg:mt-0">
                <button
                  onClick={() => navigate(`/mana/${m.id}`)}
                  className="flex-1 lg:flex-none bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold px-6 py-3 rounded-xl transition-colors"
                >
                  Καρτέλα
                </button>
                <button
                  onClick={() => deleteMana(m.id)}
                  className="flex-1 lg:flex-none bg-red-50 hover:bg-red-100 text-red-600 px-5 py-3 rounded-xl transition-colors font-bold"
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl p-8 relative animate-in zoom-in duration-200">
            <h2 className="text-3xl font-black mb-6 text-gray-800 tracking-tight">
              Νέα Μάνα
            </h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Αριθμός (π.χ. 120)"
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 font-bold text-gray-700"
                value={newMana.number}
                onChange={(e) =>
                  setNewMana({ ...newMana, number: e.target.value })
                }
              />
              <select
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 font-bold text-gray-700 cursor-pointer"
                value={newMana.positionId}
                onChange={(e) =>
                  setNewMana({ ...newMana, positionId: e.target.value })
                }
              >
                <option value="">Επιλογή Θέσης</option>
                {thesiList.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <select
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 font-bold text-gray-700 cursor-pointer"
                value={newMana.breed}
                onChange={(e) =>
                  setNewMana({ ...newMana, breed: e.target.value })
                }
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
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 font-bold text-gray-700"
                value={newMana.dayLive}
                onChange={(e) =>
                  setNewMana({ ...newMana, dayLive: e.target.value })
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
                onClick={saveNewMana}
                className="flex-1 py-4 rounded-2xl bg-green-600 text-white font-bold hover:bg-green-700 shadow-md transition-all active:scale-95"
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
