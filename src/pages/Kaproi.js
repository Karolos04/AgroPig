import { useEffect, useState } from "react";
import axios from "axios";
import { format, parseISO, isValid } from "date-fns";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

export default function Kaproi() {
  const [listKaproi, setListKaproi] = useState([]);
  const [thesiList, setThesiList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [positionFilter, setPositionFilter] = useState("");
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [newKapro, setNewKapro] = useState({
    number: "",
    positionId: "",
    dayLive: "",
  });

  const countKaproi = listKaproi.filter((k) => Number(k.live) === 0).length;

  useEffect(() => {
    const fetchKaproiAndThesi = async () => {
      try {
        const [resKaproi, resThesi] = await Promise.all([
          axios.get("https://argopig-api.onrender.com/kaproi"),
          axios.get("https://argopig-api.onrender.com/thesi"),
        ]);
        setThesiList(resThesi.data);
        const kaproiData = Array.isArray(resKaproi.data) ? resKaproi.data : [];
        const formatted = kaproiData.map((k) => {
          const spermaList = k.spermas || k.sperma || k.spermata || [];
          return { ...k, lastSperma: spermaList[0] || null };
        });
        setListKaproi(formatted);
      } catch (err) {
        toast.error("Σφάλμα φόρτωσης δεδομένων");
      }
    };
    fetchKaproiAndThesi();
  }, []);

  const saveNewKapro = async () => {
    if (!newKapro.number || !newKapro.positionId || !newKapro.dayLive)
      return toast.error("Συμπλήρωσε όλα τα πεδία");
    try {
      const res = await axios.post("https://argopig-api.onrender.com/kaproi", {
        ...newKapro,
        live: 0,
      });
      setListKaproi((prev) => [...prev, { ...res.data, lastSperma: null }]);
      setNewKapro({ number: "", positionId: "", dayLive: "" });
      setIsModalOpen(false);
      toast.success("Ο κάπρος αποθηκεύτηκε");
    } catch {
      toast.error("Σφάλμα αποθήκευσης");
    }
  };

  const deleteKaproi = async (id) => {
    if (!window.confirm("Διαγραφή κάπρου; Θα διαγραφούν και τα σπέρματά του."))
      return;
    try {
      await axios.delete(`https://argopig-api.onrender.com/kaproi/${id}`);
      setListKaproi((p) => p.filter((k) => k.id !== id));
      toast.info("Ο κάπρος διαγράφηκε");
    } catch {
      toast.error("Σφάλμα διαγραφής");
    }
  };

  const filteredKaproi = listKaproi
    .filter((k) => k.number.toString().includes(searchTerm))
    .filter(
      (k) =>
        positionFilter === "" ||
        String(k.positionId) === String(positionFilter),
    )
    .filter((k) => k.live === 0)
    .sort((a, b) => {
      const dateA =
        a.lastSperma && a.lastSperma.day
          ? new Date(a.lastSperma.day)
          : new Date(0);
      const dateB =
        b.lastSperma && b.lastSperma.day
          ? new Date(b.lastSperma.day)
          : new Date(0);
      return dateB - dateA;
    });

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* HEADER CARD */}
      <div className="bg-white rounded-3xl shadow-sm p-6 md:p-8 border-t-8 border-green-500 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-800 tracking-tight">
            ΚΑΠΡΟΙ
          </h1>
          <p className="text-gray-500 font-medium mt-1">
            Σύνολο Ενεργών: {countKaproi}
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-green-600 hover:bg-green-700 active:scale-95 text-white px-6 py-3 rounded-2xl shadow-md transition-all font-bold w-full sm:w-auto text-lg"
        >
          + Νέος Κάπρος
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
      </div>

      {/* LIST ITEMS */}
      <div className="space-y-4">
        {filteredKaproi.map((k) => {
          const lastSpermaDate =
            k.lastSperma && isValid(parseISO(k.lastSperma.day))
              ? format(parseISO(k.lastSperma.day), "dd/MM/yyyy")
              : "—";

          return (
            <div
              key={k.id}
              className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-6 transition-all hover:shadow-md hover:border-green-200 group"
            >
              <div className="flex flex-col md:flex-row md:items-center gap-6 lg:gap-10 flex-1">
                {/* ΚΑΛΥΤΕΡΟ ΚΕΝΟ ΑΝΑΜΕΣΑ ΣΕ ΑΡΙΘΜΟ ΚΑΙ ΘΕΣΗ */}
                <div className="flex items-center gap-6 w-full md:w-auto">
                  <span className="font-black text-2xl md:text-3xl text-gray-800 min-w-[90px]">
                    #{k.number}
                  </span>
                  <select
                    className="p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-bold text-gray-700 cursor-pointer transition-colors flex-1 md:w-[180px]"
                    value={k.positionId || ""}
                    onChange={(e) => {
                      const newPosId = e.target.value;
                      axios
                        .put(
                          `https://argopig-api.onrender.com/kaproi/${k.id}`,
                          {
                            positionId: newPosId,
                          },
                        )
                        .then(() => {
                          setListKaproi((p) =>
                            p.map((x) =>
                              x.id === k.id
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
                    Τελ. Σπέρμα
                  </span>
                  <span className="font-black text-gray-800 bg-gray-100 px-3 py-1 rounded-lg w-max shadow-sm">
                    {lastSpermaDate}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 w-full lg:w-auto mt-2 lg:mt-0">
                <button
                  onClick={() => navigate(`/kapros/${k.id}`)}
                  className="flex-1 lg:flex-none bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold px-6 py-3 rounded-xl transition-colors"
                >
                  Καρτέλα
                </button>
                <button
                  onClick={() => deleteKaproi(k.id)}
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
              Νέος Κάπρος
            </h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Αριθμός (π.χ. 50)"
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 font-bold text-gray-700"
                value={newKapro.number}
                onChange={(e) =>
                  setNewKapro({ ...newKapro, number: e.target.value })
                }
              />
              <select
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 font-bold text-gray-700 cursor-pointer"
                value={newKapro.positionId}
                onChange={(e) =>
                  setNewKapro({ ...newKapro, positionId: e.target.value })
                }
              >
                <option value="">Επιλογή Θέσης</option>
                {thesiList.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <input
                type="date"
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 font-bold text-gray-700"
                value={newKapro.dayLive}
                onChange={(e) =>
                  setNewKapro({ ...newKapro, dayLive: e.target.value })
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
                onClick={saveNewKapro}
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
