import { useEffect, useState } from "react";
import axios from "axios";
import { parseISO, isValid, differenceInDays, addDays, format } from "date-fns";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const [stats, setStats] = useState({
    expecting: [],
    emptyOrRejected: [],
    weaned5Days: [],
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get("https://argopig-api.onrender.com/manes");
        const manes = Array.isArray(res.data) ? res.data : [];
        const liveManes = manes.filter((m) => m.live === 0);

        const expecting = [];
        const emptyOrRejected = [];
        const weaned = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        liveManes.forEach((m) => {
          const toketoi = m.toketos || m.toketoi || [];
          const lastToketos = toketoi[0];
          if (!lastToketos) return;

          const epibaseis = lastToketos.epibasis || lastToketos.epibaseis || [];
          const lastEpibasi = epibaseis
            .filter((e) => e.day && e.day !== "0000-00-00")
            .sort((a, b) => new Date(b.day) - new Date(a.day))[0];

          const hasToketosDate =
            lastToketos.dayToketos && lastToketos.dayToketos !== "0000-00-00";
          const hasAblactationDate =
            lastToketos.dayAblactation &&
            lastToketos.dayAblactation !== "0000-00-00";

          if (
            lastEpibasi &&
            !lastEpibasi.rejection &&
            !hasToketosDate &&
            m.positionId !== "ΤΟΚΕΤΟΣ"
          ) {
            const epDate = parseISO(lastEpibasi.day);
            if (isValid(epDate)) {
              epDate.setHours(0, 0, 0, 0);
              const diffDays = differenceInDays(today, epDate);
              if (diffDays >= 106) {
                const expectedDateObj = addDays(epDate, 116);
                expecting.push({
                  ...m,
                  expectedDate: format(expectedDateObj, "dd/MM/yyyy"),
                  daysRemaining: 116 - diffDays,
                });
              }
            }
          }

          const isRejected = lastEpibasi && Boolean(lastEpibasi.rejection);
          const isEmpty = !hasToketosDate && !lastEpibasi;
          if (isRejected || isEmpty) emptyOrRejected.push(m);

          if (hasAblactationDate) {
            const weanDate = parseISO(lastToketos.dayAblactation);
            if (isValid(weanDate)) {
              weanDate.setHours(0, 0, 0, 0);
              if (differenceInDays(today, weanDate) >= 5) weaned.push(m);
            }
          }
        });

        expecting.sort((a, b) => a.daysRemaining - b.daysRemaining);
        setStats({ expecting, emptyOrRejected, weaned5Days: weaned });
      } catch (err) {
        console.error("Σφάλμα", err);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* HEADER CARD - UNIFIED STYLE */}
      <div className="bg-white rounded-3xl shadow-sm p-6 md:p-8 border-t-8 border-blue-600 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-800 tracking-tight">
            DASHBOARD ΦΑΡΜΑΣ
          </h1>
          <p className="text-gray-500 font-medium mt-1">
            Συνοπτική εικόνα της παραγωγής
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ΚΑΡΤΑ 1 */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-col h-full hover:shadow-md transition">
          <div className="flex justify-between items-center mb-6 pb-4 border-b">
            <h2 className="text-gray-700 font-black text-lg flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500"></span>{" "}
              Περιμένουν Τοκετό
            </h2>
            <span className="bg-green-100 text-green-800 font-bold px-4 py-1.5 rounded-xl text-sm">
              {stats.expecting.length}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3">
            {stats.expecting.map((m) => (
              <div
                key={m.id}
                onClick={() => navigate(`/mana/${m.id}`)}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl cursor-pointer transition border ${m.daysRemaining < 0 ? "bg-red-50 border-red-200 hover:bg-red-100" : m.daysRemaining <= 2 ? "bg-orange-50 border-orange-200 hover:bg-orange-100" : "bg-green-50 border-green-200 hover:bg-green-100"}`}
              >
                <span className="font-black text-xl text-gray-800">
                  #{m.number}
                </span>
                <span className="text-xs font-bold text-gray-500 mt-1">
                  {m.expectedDate}
                </span>
                <span
                  className={`text-sm font-black mt-1 ${m.daysRemaining < 0 ? "text-red-600" : m.daysRemaining <= 2 ? "text-orange-600" : "text-green-700"}`}
                >
                  {m.daysRemaining === 0
                    ? "Σήμερα!"
                    : m.daysRemaining < 0
                      ? `Πέρασε ${Math.abs(m.daysRemaining)} ημ.`
                      : `σε ${m.daysRemaining} ημ.`}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ΚΑΡΤΑ 2 */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-col h-full hover:shadow-md transition">
          <div className="flex justify-between items-center mb-6 pb-4 border-b">
            <h2 className="text-gray-700 font-black text-lg flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500"></span> Απόρριψη
              / Κενές
            </h2>
            <span className="bg-red-100 text-red-800 font-bold px-4 py-1.5 rounded-xl text-sm">
              {stats.emptyOrRejected.length}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {stats.emptyOrRejected.map((m) => (
              <span
                key={m.id}
                onClick={() => navigate(`/mana/${m.id}`)}
                className="bg-red-50 border border-red-200 text-red-800 px-5 py-2.5 rounded-2xl font-black cursor-pointer hover:bg-red-100 transition shadow-sm"
              >
                #{m.number}
              </span>
            ))}
          </div>
        </div>

        {/* ΚΑΡΤΑ 3 */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-col h-full hover:shadow-md transition">
          <div className="flex justify-between items-center mb-6 pb-4 border-b">
            <h2 className="text-gray-700 font-black text-lg flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-yellow-500"></span>{" "}
              Απογαλακτισμός {">"} 5 ημ.
            </h2>
            <span className="bg-yellow-100 text-yellow-800 font-bold px-4 py-1.5 rounded-xl text-sm">
              {stats.weaned5Days.length}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {stats.weaned5Days.map((m) => (
              <span
                key={m.id}
                onClick={() => navigate(`/mana/${m.id}`)}
                className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-5 py-2.5 rounded-2xl font-black cursor-pointer hover:bg-yellow-100 transition shadow-sm"
              >
                #{m.number}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
