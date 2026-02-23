import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

export default function Thesi() {
  const [thesiList, setThesiList] = useState([]);
  const [liveAnimals, setLiveAnimals] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newThesiName, setNewThesiName] = useState("");
  const navigate = useNavigate();

  // Φόρτωση θέσεων και ζωντανών ζώων
  const loadData = async () => {
    try {
      const [resThesi, resManes, resKaproi] = await Promise.all([
        axios.get("https://argopig-api.onrender.com/thesi"),
        axios.get("https://argopig-api.onrender.com/manes"),
        axios.get("https://argopig-api.onrender.com/kaproi"),
      ]);

      setThesiList(resThesi.data);

      const manes = resManes.data
        .filter((m) => Number(m.live) === 0)
        .map((m) => ({ ...m, link: `/mana/${m.id}`, animalType: "Μάνα" }));

      const kaproi = resKaproi.data
        .filter((k) => Number(k.live) === 0)
        .map((k) => ({ ...k, link: `/kapros/${k.id}`, animalType: "Κάπρος" }));

      setLiveAnimals([...manes, ...kaproi]);
    } catch (err) {
      toast.error("Σφάλμα φόρτωσης δεδομένων");
    }
  };

  // Φόρτωση δεδομένων κατά την αρχική απόδοση
  useEffect(() => {
    loadData();
  }, []);

  // Διαχείριση αποθήκευσης νέας θέσης
  const handleSave = async () => {
    if (!newThesiName.trim())
      return toast.error("Το όνομα της θέσης δεν μπορεί να είναι κενό");
    try {
      await axios.post("https://argopig-api.onrender.com/thesi", {
        name: newThesiName,
      });
      toast.success("Η θέση προστέθηκε!");
      setNewThesiName("");
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      toast.error("Σφάλμα κατά την αποθήκευση");
    }
  };

  // Διαχείριση διαγραφής θέσης
  const handleDelete = async (id) => {
    if (!window.confirm("Σίγουρα θέλεις να διαγράψεις αυτή τη θέση;")) return;
    try {
      await axios.delete(`https://argopig-api.onrender.com/thesi/${id}`);
      toast.info("Η θέση διαγράφηκε");
      loadData();
    } catch (err) {
      toast.error("Σφάλμα διαγραφής");
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* HEADER CARD */}
      <div className="bg-white rounded-3xl shadow-sm p-6 md:p-8 border-t-8 border-blue-500 flex flex-col sm:flex-row justify-between items-center gap-4 relative">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-800 tracking-tight">
            ΘΕΣΕΙΣ
          </h1>
          <p className="text-gray-500 font-medium mt-1">
            Διαχείριση Χώρων Φάρμας
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white px-6 py-3 rounded-2xl shadow-md transition-all font-bold w-full sm:w-auto text-lg"
        >
          + Νέα Θέση
        </button>
      </div>

      {/* GRID ΜΕ ΤΙΣ ΚΑΡΤΕΣ ΤΩΝ ΘΕΣΕΩΝ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {thesiList.map((pos) => {
          const animalsInPos = liveAnimals.filter(
            (animal) => Number(animal.positionId) === Number(pos.id),
          );

          return (
            <div
              key={pos.id}
              className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-col h-full hover:shadow-md hover:border-blue-200 transition-all relative group"
            >
              <button
                onClick={() => handleDelete(pos.id)}
                className="absolute top-6 right-6 text-gray-300 hover:text-red-500 transition-colors text-lg active:scale-90"
              >
                ✖
              </button>

              <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4 pr-8">
                <h2 className="text-2xl font-black text-gray-700 tracking-tight">
                  {pos.name}
                </h2>
                <span className="bg-blue-50 border border-blue-100 text-blue-700 font-black px-4 py-1.5 rounded-xl text-sm shadow-sm">
                  {animalsInPos.length} Ζώα
                </span>
              </div>

              <div className="flex flex-wrap gap-2.5">
                {animalsInPos.length === 0 ? (
                  <span className="text-gray-400 text-sm font-medium italic bg-gray-50 px-4 py-2 rounded-xl w-full text-center border border-dashed border-gray-200">
                    Άδεια θέση
                  </span>
                ) : (
                  animalsInPos.map((animal) => (
                    <span
                      key={`${animal.animalType}-${animal.id}`}
                      onClick={() => navigate(animal.link)}
                      className={`text-sm px-5 py-2.5 rounded-2xl font-black cursor-pointer transition-all shadow-sm border active:scale-95
                        ${
                          animal.animalType === "Μάνα"
                            ? "bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100"
                            : "bg-gray-100 border-gray-300 text-gray-800 hover:bg-gray-200"
                        }
                      `}
                      title={animal.animalType}
                    >
                      #{animal.number}
                    </span>
                  ))
                )}
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
              Νέα Θέση
            </h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="π.χ. Α1, ΤΟΚΕΤΟΣ 1"
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-gray-700 text-lg transition-colors"
                value={newThesiName}
                onChange={(e) => setNewThesiName(e.target.value)}
                autoFocus
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
                className="flex-1 py-4 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-md transition-all active:scale-95"
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
