import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Search, Train, ArrowRightLeft, MapPin, Zap, Navigation, GitCompare } from "lucide-react";

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

    navigate(`/results?source=${sourceCode}&destination=${destCode}&mode=${mode}&date=${journeyDate}&deadline=${arrivalDeadline}`);
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
    <div className="flex flex-col items-center justify-center py-4 lg:py-12 animate-fadeIn">
      {/* Title Hero */}
      <div className="text-center space-y-4 max-w-2xl mb-12">
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-none">
          Find the Perfect{" "}
          <span className="bg-gradient-to-r from-blue-500 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Marg
          </span>
        </h1>
        <p className="text-sm sm:text-base text-gray-400 font-medium">
          Indian Railways intelligent connection finder and route search engine. Discover direct and multi-hop paths instantly.
        </p>
      </div>

      {/* Main Search Panel */}
      <form
        onSubmit={handleSearch}
        className="w-full max-w-3xl glass-panel p-6 sm:p-8 rounded-3xl border border-white/5 shadow-2xl relative"
      >
        {/* Glow decoration */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-1 w-24 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs font-semibold text-red-400 text-center">
            {error}
          </div>
        )}

        <div className="flex flex-col md:flex-row items-stretch gap-4 relative mb-6">
          {/* Source Autocomplete */}
          <div ref={sourceRef} className="flex-1 relative">
            <label className="block text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-2 px-1">
              Source Station
            </label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type="text"
                value={source}
                onChange={(e) => {
                  setSource(e.target.value);
                  if (!e.target.value) setSourceCode("");
                  setShowSourceSuggestions(true);
                }}
                onFocus={() => setShowSourceSuggestions(true)}
                placeholder="e.g. Pune or PUNE"
                className="w-full glass-input pl-10 pr-4 py-3 rounded-xl text-sm font-bold text-white placeholder-gray-600 focus:outline-none transition-all"
                required
              />
            </div>
            {showSourceSuggestions && sourceSuggestions.length > 0 && (
              <div className="absolute top-full left-0 z-20 w-full mt-1.5 rounded-xl border border-white/5 bg-[#0e1320]/95 backdrop-blur-md overflow-hidden max-h-60 overflow-y-auto shadow-2xl divide-y divide-white/5 animate-slideDown">
                {sourceSuggestions.map((station) => (
                  <button
                    key={station.code}
                    type="button"
                    onClick={() => handleSourceSelect(station)}
                    className="w-full text-left px-4 py-3 hover:bg-white/5 text-sm font-bold text-white flex items-center justify-between transition-colors"
                  >
                    <span>{station.name}</span>
                    <span className="text-xs font-black text-blue-400 bg-blue-500/10 border border-blue-500/10 px-1.5 py-0.5 rounded-md">
                      {station.code}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Swap Button */}
          <div className="flex items-center justify-center md:pt-6">
            <button
              type="button"
              onClick={swapStations}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all shadow-md active:scale-95"
              title="Swap stations"
            >
              <ArrowRightLeft className="h-4.5 w-4.5 rotate-90 md:rotate-0" />
            </button>
          </div>

          {/* Destination Autocomplete */}
          <div ref={destRef} className="flex-1 relative">
            <label className="block text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-2 px-1">
              Destination Station
            </label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type="text"
                value={dest}
                onChange={(e) => {
                  setDest(e.target.value);
                  if (!e.target.value) setDestCode("");
                  setShowDestSuggestions(true);
                }}
                onFocus={() => setShowDestSuggestions(true)}
                placeholder="e.g. Delhi or NDLS"
                className="w-full glass-input pl-10 pr-4 py-3 rounded-xl text-sm font-bold text-white placeholder-gray-600 focus:outline-none transition-all"
                required
              />
            </div>
            {showDestSuggestions && destSuggestions.length > 0 && (
              <div className="absolute top-full left-0 z-20 w-full mt-1.5 rounded-xl border border-white/5 bg-[#0e1320]/95 backdrop-blur-md overflow-hidden max-h-60 overflow-y-auto shadow-2xl divide-y divide-white/5 animate-slideDown">
                {destSuggestions.map((station) => (
                  <button
                    key={station.code}
                    type="button"
                    onClick={() => handleDestSelect(station)}
                    className="w-full text-left px-4 py-3 hover:bg-white/5 text-sm font-bold text-white flex items-center justify-between transition-colors"
                  >
                    <span>{station.name}</span>
                    <span className="text-xs font-black text-blue-400 bg-blue-500/10 border border-blue-500/10 px-1.5 py-0.5 rounded-md">
                      {station.code}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Date and Deadline Constraints */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-2 px-1">
              Journey Date
            </label>
            <input
              type="date"
              value={journeyDate}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => setJourneyDate(e.target.value)}
              className="w-full glass-input px-4 py-3 rounded-xl text-sm font-bold text-white focus:outline-none transition-all cursor-pointer"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-2 px-1">
              Latest Arrival Deadline (Optional)
            </label>
            <input
              type="datetime-local"
              value={arrivalDeadline}
              min={new Date().toISOString().substring(0, 16)}
              onChange={(e) => setArrivalDeadline(e.target.value)}
              className="w-full glass-input px-4 py-3 rounded-xl text-sm font-bold text-white focus:outline-none transition-all cursor-pointer"
            />
          </div>
        </div>

        {/* Route optimization selectors */}
        <div className="mb-8">
          <label className="block text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-3 px-1">
            Search Mode Preferences
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button
              type="button"
              onClick={() => setMode("time")}
              className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
                mode === "time"
                  ? "border-blue-500/30 bg-blue-500/10 text-white shadow-lg shadow-blue-500/5"
                  : "border-white/5 bg-white/2 text-gray-400 hover:text-gray-200 hover:bg-white/5"
              }`}
            >
              <Zap className="h-4.5 w-4.5 text-blue-400 shrink-0" />
              <div className="min-w-0">
                <span className="block text-xs font-bold leading-tight">Fastest</span>
                <span className="block text-[9px] text-gray-500 font-medium">Min travel time</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setMode("distance")}
              className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
                mode === "distance"
                  ? "border-blue-500/30 bg-blue-500/10 text-white shadow-lg shadow-blue-500/5"
                  : "border-white/5 bg-white/2 text-gray-400 hover:text-gray-200 hover:bg-white/5"
              }`}
            >
              <Navigation className="h-4.5 w-4.5 text-indigo-400 shrink-0" />
              <div className="min-w-0">
                <span className="block text-xs font-bold leading-tight">Shortest</span>
                <span className="block text-[9px] text-gray-500 font-medium">Min distance</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setMode("changes")}
              className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
                mode === "changes"
                  ? "border-blue-500/30 bg-blue-500/10 text-white shadow-lg shadow-blue-500/5"
                  : "border-white/5 bg-white/2 text-gray-400 hover:text-gray-200 hover:bg-white/5"
              }`}
            >
              <GitCompare className="h-4.5 w-4.5 text-purple-400 shrink-0" />
              <div className="min-w-0">
                <span className="block text-xs font-bold leading-tight">Least changes</span>
                <span className="block text-[9px] text-gray-500 font-medium">Fewest train swaps</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setMode("direct")}
              className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
                mode === "direct"
                  ? "border-blue-500/30 bg-blue-500/10 text-white shadow-lg shadow-blue-500/5"
                  : "border-white/5 bg-white/2 text-gray-400 hover:text-gray-200 hover:bg-white/5"
              }`}
            >
              <Train className="h-4.5 w-4.5 text-teal-400 shrink-0" />
              <div className="min-w-0">
                <span className="block text-xs font-bold leading-tight">Direct Only</span>
                <span className="block text-[9px] text-gray-500 font-medium">No transfer stopovers</span>
              </div>
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-sm font-extrabold text-white shadow-xl shadow-blue-500/25 hover:from-blue-500 hover:to-indigo-500 active:scale-99 transition-all cursor-pointer"
        >
          <Search className="h-4.5 w-4.5" />
          Plan Journey Route
        </button>
      </form>

      {/* Popular Stations Section */}
      <div className="w-full max-w-3xl mt-12 space-y-4">
        <h3 className="text-xs text-gray-400 font-bold uppercase tracking-wider px-1">
          Popular Station Shortcuts
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {POPULAR_STATIONS.map((station) => (
            <div
              key={station.code}
              className="glass-panel p-2.5 rounded-xl border border-white/5 text-center flex flex-col items-center justify-between"
            >
              <span className="block text-xs font-bold text-white truncate max-w-full">
                {station.name.split(" ")[0]}
              </span>
              <span className="block text-[9px] text-gray-500 font-black tracking-wide my-1">
                {station.code}
              </span>
              <div className="flex gap-1 mt-1.5 w-full">
                <button
                  type="button"
                  onClick={() => selectPopular(station, "source")}
                  className="flex-1 py-1 rounded bg-blue-500/10 hover:bg-blue-500/20 text-[9px] font-bold text-blue-400 border border-blue-500/15"
                >
                  From
                </button>
                <button
                  type="button"
                  onClick={() => selectPopular(station, "dest")}
                  className="flex-1 py-1 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-[9px] font-bold text-indigo-400 border border-indigo-500/15"
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
