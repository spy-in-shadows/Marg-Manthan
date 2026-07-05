import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

interface Station {
  code: string;
  name: string;
}

const POPULAR_STATIONS = [
  { code: "NDLS", name: "NEW DELHI" },
  { code: "PUNE", name: "PUNE JN" },
  { code: "CSMT", name: "MUMBAI CSMT" },
  { code: "HWH", name: "HOWRAH JN" },
  { code: "SBC", name: "KSR BENGALURU" },
  { code: "MAS", name: "MGR CHENNAI CTL" }
];

export default function Home() {
  const navigate = useNavigate();
  
  const [source, setSource] = useState("");
  const [sourceCode, setSourceCode] = useState("");
  const [sourceSuggestions, setSourceSuggestions] = useState<Station[]>([]);
  const [showSourceSuggestions, setShowSourceSuggestions] = useState(false);

  const [dest, setDest] = useState("");
  const [destCode, setDestCode] = useState("");
  const [destSuggestions, setDestSuggestions] = useState<Station[]>([]);
  const [showDestSuggestions, setShowDestSuggestions] = useState(false);

  const [mode, setMode] = useState("time");
  const [journeyDate, setJourneyDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [arrivalDeadline, setArrivalDeadline] = useState("");
  const [maxBudget, setMaxBudget] = useState("");
  const [error, setError] = useState<string | null>(null);

  const sourceRef = useRef<HTMLDivElement>(null);
  const destRef = useRef<HTMLDivElement>(null);

  // Debounced autocomplete for source station
  useEffect(() => {
    if (source.length < 2) {
      setSourceSuggestions([]);
      return;
    }
    
    // Skip fetching if the input matches our selected code (user just selected it)
    if (source.endsWith(`(${sourceCode})`)) {
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const response = await axios.get(`http://localhost:3000/stations?q=${source}`);
        setSourceSuggestions(response.data);
      } catch (err) {
        console.error("Autocomplete failed:", err);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [source, sourceCode]);

  // Debounced autocomplete for destination station
  useEffect(() => {
    if (dest.length < 2) {
      setDestSuggestions([]);
      return;
    }
    
    // Skip if input matches selected code
    if (dest.endsWith(`(${destCode})`)) {
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const response = await axios.get(`http://localhost:3000/stations?q=${dest}`);
        setDestSuggestions(response.data);
      } catch (err) {
        console.error("Autocomplete failed:", err);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [dest, destCode]);

  // Click outside listener to close suggestion panels
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sourceRef.current && !sourceRef.current.contains(event.target as Node)) {
        setShowSourceSuggestions(false);
      }
      if (destRef.current && !destRef.current.contains(event.target as Node)) {
        setShowDestSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSourceSelect = (station: Station) => {
    setSource(`${station.name} (${station.code})`);
    setSourceCode(station.code);
    setShowSourceSuggestions(false);
    setError(null);
  };

  const handleDestSelect = (station: Station) => {
    setDest(`${station.name} (${station.code})`);
    setDestCode(station.code);
    setShowDestSuggestions(false);
    setError(null);
  };

  const swapStations = () => {
    const tempSource = source;
    const tempSourceCode = sourceCode;
    setSource(dest);
    setSourceCode(destCode);
    setDest(tempSource);
    setDestCode(tempSourceCode);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceCode) {
      setError("Please select a valid source station from suggestions.");
      return;
    }
    if (!destCode) {
      setError("Please select a valid destination station from suggestions.");
      return;
    }
    if (sourceCode === destCode) {
      setError("Source and destination stations cannot be the same.");
      return;
    }

    navigate(`/results?source=${sourceCode}&destination=${destCode}&mode=${mode}&date=${journeyDate}&deadline=${arrivalDeadline}&budget=${maxBudget}`);
  };

  const selectPopular = (station: Station, type: "source" | "dest") => {
    if (type === "source") {
      setSource(`${station.name} (${station.code})`);
      setSourceCode(station.code);
    } else {
      setDest(`${station.name} (${station.code})`);
      setDestCode(station.code);
    }
    setError(null);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-1 sm:px-4 py-4 animate-fadeIn">
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch mb-12">
        
        {/* LEFT COLUMN: BOOK TICKET CARD (lg:col-span-5) */}
        <div className="lg:col-span-5 flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-white/5 bg-white dark:bg-[#131926]/90">
          {/* The Search Form */}
          <form
            onSubmit={handleSearch}
            className="flex-1 text-slate-800 dark:text-slate-100 p-6 relative flex flex-col justify-between"
          >
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs font-semibold text-red-400 text-center">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <h2 className="text-xl font-black text-[#0f2954] dark:text-blue-400 uppercase tracking-wide border-b border-gray-100 dark:border-white/5 pb-2 mb-4 flex items-center gap-2">
                <span>🎫</span> Find Routes
              </h2>

              {/* Source Input */}
              <div ref={sourceRef} className="relative">
                <label className="block text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mb-1.5">
                  From
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#213c7a] dark:text-blue-400">📍</span>
                  <input
                    type="text"
                    value={source}
                    onChange={(e) => {
                      setSource(e.target.value);
                      if (!e.target.value) setSourceCode("");
                      setShowSourceSuggestions(true);
                    }}
                    onFocus={() => setShowSourceSuggestions(true)}
                    placeholder="Boarding Station"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-gray-300 dark:border-white/10 pl-9 pr-4 py-2.5 rounded-xl text-xs font-bold text-slate-900 dark:text-white placeholder-gray-500 focus:border-blue-600 focus:outline-none transition-all"
                    required
                  />
                </div>
                
                {/* Swap Button (Vertical Double Arrow overlapping From & To inputs on the right margin) */}
                <button
                  type="button"
                  onClick={swapStations}
                  className="absolute right-4 top-[32px] z-10 bg-white dark:bg-slate-800 border border-gray-300 dark:border-white/15 rounded-full h-8 w-8 flex items-center justify-center text-gray-500 hover:text-orange-500 hover:border-orange-500 shadow-md active:scale-90 transition-all cursor-pointer"
                  title="Swap stations"
                >
                  ⇄
                </button>

                {/* Source suggestions */}
                {showSourceSuggestions && sourceSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 z-20 w-full mt-1 rounded-xl border border-gray-200 dark:border-white/5 bg-white dark:bg-[#0e1320] overflow-hidden max-h-60 overflow-y-auto shadow-2xl divide-y divide-gray-100 dark:divide-white/5">
                    {sourceSuggestions.map((station) => (
                      <button
                        key={station.code}
                        type="button"
                        onClick={() => handleSourceSelect(station)}
                        className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/5 text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <span>{station.name}</span>
                        <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/10 dark:border-blue-500/20 px-1.5 py-0.5 rounded-md">
                          {station.code}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Destination Input */}
              <div ref={destRef} className="relative">
                <label className="block text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mb-1.5">
                  To
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#213c7a] dark:text-blue-400">📍</span>
                  <input
                    type="text"
                    value={dest}
                    onChange={(e) => {
                      setDest(e.target.value);
                      if (!e.target.value) setDestCode("");
                      setShowDestSuggestions(true);
                    }}
                    onFocus={() => setShowDestSuggestions(true)}
                    placeholder="Destination Station"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-gray-300 dark:border-white/10 pl-9 pr-4 py-2.5 rounded-xl text-xs font-bold text-slate-900 dark:text-white placeholder-gray-500 focus:border-blue-600 focus:outline-none transition-all"
                    required
                  />
                </div>

                {/* Destination suggestions */}
                {showDestSuggestions && destSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 z-20 w-full mt-1 rounded-xl border border-gray-200 dark:border-white/5 bg-white dark:bg-[#0e1320] overflow-hidden max-h-60 overflow-y-auto shadow-2xl divide-y divide-gray-100 dark:divide-white/5">
                    {destSuggestions.map((station) => (
                      <button
                        key={station.code}
                        type="button"
                        onClick={() => handleDestSelect(station)}
                        className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/5 text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <span>{station.name}</span>
                        <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/10 dark:border-blue-500/20 px-1.5 py-0.5 rounded-md">
                          {station.code}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Date and Deadline Picker */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mb-1.5">
                    DD/MM/YYYY *
                  </label>
                  <input
                    type="date"
                    value={journeyDate}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setJourneyDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-gray-300 dark:border-white/10 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:border-blue-600 focus:outline-none transition-all cursor-pointer"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mb-1.5">
                    Arrival Deadline
                  </label>
                  <input
                    type="datetime-local"
                    value={arrivalDeadline}
                    min={new Date().toISOString().substring(0, 16)}
                    onChange={(e) => setArrivalDeadline(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-gray-300 dark:border-white/10 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:border-blue-600 focus:outline-none transition-all cursor-pointer"
                  />
                </div>
              </div>

              {/* Budget */}
              <div>
                <label className="block text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mb-1.5">
                  Max Budget (₹) (Optional)
                </label>
                <input
                  type="number"
                  value={maxBudget}
                  onChange={(e) => setMaxBudget(e.target.value)}
                  placeholder="e.g. 1500"
                  min="0"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-gray-300 dark:border-white/10 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:border-blue-600 focus:outline-none transition-all"
                />
              </div>

              {/* GENERAL / mode preference */}
              <div>
                <label className="block text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mb-1.5">
                  Quota / Optimisation
                </label>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-gray-300 dark:border-white/10 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:border-blue-600 focus:outline-none transition-all cursor-pointer"
                >
                  <option value="time">Fastest</option>
                  <option value="distance">Shortest</option>
                  <option value="changes">Least Changes</option>
                  <option value="direct">Direct Trains</option>
                </select>
              </div>
            </div>

            {/* Search Button */}
            <button
              type="submit"
              className="w-full bg-[#fb731c] hover:bg-[#e05f0d] text-white py-3 rounded-xl text-sm font-extrabold uppercase transition-all shadow-md hover:shadow-lg active:scale-[0.98] mt-6 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>🔍</span> Search Trains
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: VANDE BHARAT BANNER (lg:col-span-7) */}
        <div className="lg:col-span-7 relative rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-white/5 min-h-[450px] flex items-end p-8 bg-slate-900 group">
          <img
            src="/vande_bharat.jpg"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            alt="Vande Bharat Express"
          />
          {/* Glow overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
          <div className="relative z-10 text-white space-y-2">
            <span className="text-[10px] bg-orange-500 text-white px-2 py-0.5 rounded font-black tracking-widest uppercase">
              Vande Bharat Express
            </span>
            <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight leading-none text-white">
              Indian Railways
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 font-bold tracking-wide">
              Safety | Security | Punctuality
            </p>
          </div>
        </div>
      </div>

      {/* Popular Stations Section */}
      <div className="w-full mt-12 space-y-4">
        <h3 className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider px-1">
          Popular Station Shortcuts
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
          {POPULAR_STATIONS.map((station) => (
            <div
              key={station.code}
              className="bg-white dark:bg-[#131926]/90 border border-gray-200 dark:border-white/5 p-2.5 rounded-xl text-center flex flex-col items-center justify-between shadow-sm"
            >
              <span className="block text-xs font-bold text-slate-800 dark:text-white truncate max-w-full">
                {station.name.split(" ")[0]}
              </span>
              <span className="block text-[9px] text-gray-400 font-black tracking-wide my-1">
                {station.code}
              </span>
              <div className="flex gap-1 mt-1.5 w-full">
                <button
                  type="button"
                  onClick={() => selectPopular(station, "source")}
                  className="flex-1 py-1 rounded bg-blue-500/5 hover:bg-blue-500/10 text-[9px] font-bold text-blue-600 dark:text-blue-400 border border-blue-500/10 dark:border-blue-500/20 cursor-pointer"
                >
                  From
                </button>
                <button
                  type="button"
                  onClick={() => selectPopular(station, "dest")}
                  className="flex-1 py-1 rounded bg-indigo-500/5 hover:bg-indigo-500/10 text-[9px] font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-500/10 dark:border-indigo-500/20 cursor-pointer"
                >
                  To
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
