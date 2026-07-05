import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import axios from "axios";
import { RefreshCw } from "lucide-react";

interface TrainSegment {
  train_no: number;
  train_name: string;
  from_station: string;
  to_station: string;
  departure_time: string;
  arrival_time: string;
  distance: number;
  travel_time: number;
  departure_date?: string;
  arrival_date?: string;
  fare?: number;
  availability_status?: string;
  confirm_probability?: string;
  from_station_name?: string;
  to_station_name?: string;
}

interface Route {
  type: string;
  trains: TrainSegment[];
  total_distance: number;
  total_time: number;
  changes: number;
  waiting_time: number;
  total_fare?: number;
}

export default function Results() {
  const [searchParams] = useSearchParams();
  const source = searchParams.get("source") || "";
  const destination = searchParams.get("destination") || "";
  const initialMode = searchParams.get("mode") || "time";
  const date = searchParams.get("date") || "";
  const deadline = searchParams.get("deadline") || "";
  const travelClass = searchParams.get("class") || "SL";
  const maxBudget = searchParams.get("budget") || "";

  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedClasses, setSelectedClasses] = useState<string[]>([travelClass]);
  const [selectedTrainTypes, setSelectedTrainTypes] = useState<string[]>(["ALL"]);
  const [departureTimeFilter, setDepartureTimeFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"time" | "distance" | "changes">("time");
  
  // Expanded card tracking
  const [expandedCards, setExpandedCards] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    const fetchRoutes = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(
          `http://localhost:3000/search?source=${source}&destination=${destination}&mode=${initialMode}&date=${date}&deadline=${deadline}&class=${travelClass}&budget=${maxBudget}`
        );
        setRoutes(response.data.routes || []);
        setExpandedCards({ 0: true }); // Auto-expand the first card
      } catch (err: any) {
        console.error("Search failed:", err);
        setError(err.response?.data?.error || "Failed to load journey routes. Check server connection.");
      } finally {
        setLoading(false);
      }
    };

    if (source && destination) {
      fetchRoutes();
    }
  }, [source, destination, initialMode, date, deadline, travelClass, maxBudget]);

  const toggleExpand = (idx: number) => {
    setExpandedCards((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const formatMinutes = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
  };

  const toggleClassFilter = (cls: string) => {
    setSelectedClasses(prev =>
      prev.includes(cls) ? prev.filter(c => c !== cls) : [...prev, cls]
    );
  };

  // Sort and filter logic
  const filteredRoutes = routes.filter(route => {
    // If departureTimeFilter is active: check first train departure
    if (departureTimeFilter) {
      const depHour = parseInt(route.trains[0].departure_time.split(":")[0]);
      if (departureTimeFilter === "morning" && (depHour < 6 || depHour >= 12)) return false;
      if (departureTimeFilter === "midday" && (depHour < 12 || depHour >= 18)) return false;
      if (departureTimeFilter === "night" && (depHour < 18 && depHour >= 0)) return false;
      if (departureTimeFilter === "early" && depHour >= 6) return false;
    }
    return true;
  });

  const sortedRoutes = [...filteredRoutes].sort((a, b) => {
    if (sortBy === "distance") {
      return a.total_distance - b.total_distance;
    }
    if (sortBy === "changes") {
      return a.changes - b.changes;
    }
    return a.total_time - b.total_time;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-orange-500 border-blue-900"></div>
        <p className="text-sm font-bold text-gray-500 animate-pulse">Searching optimal alternate routes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-xl p-6 bg-red-500/5 border border-red-500/10 rounded-2xl text-center space-y-4">
        <span className="text-3xl">⚠️</span>
        <h2 className="text-base font-black text-red-500 dark:text-red-400 uppercase">Search Error</h2>
        <p className="text-xs text-gray-500 leading-relaxed">{error}</p>
        <Link to="/" className="inline-flex items-center justify-center rounded-xl bg-orange-500 px-4 py-2 text-xs font-bold text-white shadow hover:bg-orange-600 transition-all">
          Modify Search
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-1 sm:px-4 py-2 animate-fadeIn space-y-6">
      
      {/* 1. HORIZONTAL SEARCH PANEL (IRCTC STYLED BANNER) */}
      <div className="w-full bg-[#0f2954] dark:bg-slate-900 text-white p-3 rounded-2xl flex flex-wrap items-center gap-3 shadow-lg border border-[#1e3a8a]/20 dark:border-white/5 transition-colors duration-300">
        <div className="flex-1 min-w-[140px] bg-white/10 dark:bg-black/20 px-3 py-1.5 rounded-lg border border-white/5">
          <span className="block text-[8px] uppercase tracking-wider text-slate-300 font-bold">From</span>
          <span className="text-xs font-black truncate block text-white">{source}</span>
        </div>
        <div className="text-lg text-slate-400 hidden md:block">⇄</div>
        <div className="flex-1 min-w-[140px] bg-white/10 dark:bg-black/20 px-3 py-1.5 rounded-lg border border-white/5">
          <span className="block text-[8px] uppercase tracking-wider text-slate-300 font-bold">To</span>
          <span className="text-xs font-black truncate block text-white">{destination}</span>
        </div>
        <div className="bg-white/10 dark:bg-black/20 px-3 py-1.5 rounded-lg border border-white/5 min-w-[100px]">
          <span className="block text-[8px] uppercase tracking-wider text-slate-300 font-bold">Journey Date</span>
          <span className="text-xs font-black block text-white">{date || "Today"}</span>
        </div>
        <div className="bg-white/10 dark:bg-black/20 px-3 py-1.5 rounded-lg border border-white/5 min-w-[80px]">
          <span className="block text-[8px] uppercase tracking-wider text-slate-300 font-bold">Class</span>
          <span className="text-xs font-black block text-white">{travelClass}</span>
        </div>
        <div className="bg-white/10 dark:bg-black/20 px-3 py-1.5 rounded-lg border border-white/5 min-w-[90px]">
          <span className="block text-[8px] uppercase tracking-wider text-slate-300 font-bold">Quota</span>
          <span className="text-xs font-black block text-white">GENERAL</span>
        </div>
        <Link 
          to="/" 
          className="bg-[#fb731c] hover:bg-[#e05f0d] text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase shadow transition-all cursor-pointer text-center"
        >
          Modify Search
        </Link>
      </div>

      {/* 2. SPLIT LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: REFINE RESULTS SIDEBAR */}
        <aside className="lg:col-span-3 bg-white dark:bg-[#131926]/90 border border-gray-200 dark:border-white/5 rounded-2xl p-4 space-y-6 shadow-sm transition-colors duration-300">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-2.5">
            <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">Refine Results</h3>
            <button 
              onClick={() => {
                setSelectedClasses([travelClass]);
                setDepartureTimeFilter(null);
              }}
              className="text-[10px] text-orange-500 font-bold hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          </div>

          {/* Journey Class */}
          <div className="space-y-2">
            <h4 className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Journey Class</h4>
            <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300 font-bold">
              {["SL", "3A", "2A", "1A", "CC", "2S"].map(cls => (
                <label key={cls} className="flex items-center gap-2 cursor-pointer hover:text-orange-500">
                  <input 
                    type="checkbox" 
                    checked={selectedClasses.includes(cls)}
                    onChange={() => toggleClassFilter(cls)}
                    className="accent-orange-500 cursor-pointer"
                  />
                  <span>{cls === "SL" ? "Sleeper (SL)" : cls === "3A" ? "AC 3 Tier (3A)" : cls === "2A" ? "AC 2 Tier (2A)" : cls === "1A" ? "AC 1 Class (1A)" : cls === "CC" ? "AC Chair Car (CC)" : "Second Sitting (2S)"}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Train Types */}
          <div className="space-y-2">
            <h4 className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Train Type</h4>
            <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300 font-bold">
              {["ALL", "Rajdhani / VB", "Express / Mail"].map(type => (
                <label key={type} className="flex items-center gap-2 cursor-pointer hover:text-orange-500">
                  <input 
                    type="checkbox" 
                    checked={selectedTrainTypes.includes(type)}
                    onChange={() => setSelectedTrainTypes([type])}
                    className="accent-orange-500 cursor-pointer"
                  />
                  <span>{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Departure Time Slots */}
          <div className="space-y-2">
            <h4 className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Departure Time</h4>
            <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-center">
              <button
                onClick={() => setDepartureTimeFilter(departureTimeFilter === "early" ? null : "early")}
                className={`p-2 rounded-lg border transition-all cursor-pointer ${
                  departureTimeFilter === "early"
                    ? "bg-blue-500/10 border-blue-500 text-blue-500 dark:text-blue-400"
                    : "border-gray-200 dark:border-white/5 text-gray-500 dark:text-gray-400 bg-slate-50 dark:bg-slate-900/40 hover:bg-slate-100"
                }`}
              >
                <span className="block">00:00 - 06:00</span>
                <span className="block text-[8px] font-medium text-gray-400">Early Morning</span>
              </button>

              <button
                onClick={() => setDepartureTimeFilter(departureTimeFilter === "morning" ? null : "morning")}
                className={`p-2 rounded-lg border transition-all cursor-pointer ${
                  departureTimeFilter === "morning"
                    ? "bg-blue-500/10 border-blue-500 text-blue-500 dark:text-blue-400"
                    : "border-gray-200 dark:border-white/5 text-gray-500 dark:text-gray-400 bg-slate-50 dark:bg-slate-900/40 hover:bg-slate-100"
                }`}
              >
                <span className="block">06:00 - 12:00</span>
                <span className="block text-[8px] font-medium text-gray-400">Morning</span>
              </button>

              <button
                onClick={() => setDepartureTimeFilter(departureTimeFilter === "midday" ? null : "midday")}
                className={`p-2 rounded-lg border transition-all cursor-pointer ${
                  departureTimeFilter === "midday"
                    ? "bg-blue-500/10 border-blue-500 text-blue-500 dark:text-blue-400"
                    : "border-gray-200 dark:border-white/5 text-gray-500 dark:text-gray-400 bg-slate-50 dark:bg-slate-900/40 hover:bg-slate-100"
                }`}
              >
                <span className="block">12:00 - 18:00</span>
                <span className="block text-[8px] font-medium text-gray-400">Mid Day</span>
              </button>

              <button
                onClick={() => setDepartureTimeFilter(departureTimeFilter === "night" ? null : "night")}
                className={`p-2 rounded-lg border transition-all cursor-pointer ${
                  departureTimeFilter === "night"
                    ? "bg-blue-500/10 border-blue-500 text-blue-500 dark:text-blue-400"
                    : "border-gray-200 dark:border-white/5 text-gray-500 dark:text-gray-400 bg-slate-50 dark:bg-slate-900/40 hover:bg-slate-100"
                }`}
              >
                <span className="block">18:00 - 24:00</span>
                <span className="block text-[8px] font-medium text-gray-400">Night</span>
              </button>
            </div>
          </div>
        </aside>

        {/* RIGHT COLUMN: MAIN CONTENT (TRAIN CARDS LIST) */}
        <main className="lg:col-span-9 space-y-4">
          {/* Summary Details Header */}
          <div className="bg-white dark:bg-[#131926]/90 border border-gray-200 dark:border-white/5 p-3.5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-bold text-slate-800 dark:text-white transition-colors duration-300">
            <div>
              <span>{sortedRoutes.length} Route options for </span>
              <span className="text-[#0f2954] dark:text-blue-400 font-extrabold">{source.split(" (")[0]} ➔ {destination.split(" (")[0]}</span>
              {date && <span> on {new Date(date).toDateString()}</span>}
            </div>
            
            {/* Sorter Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-[10px] uppercase font-bold">Sort By:</span>
              <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-gray-200 dark:border-white/5 text-[10px]">
                <button
                  onClick={() => setSortBy("time")}
                  className={`px-3 py-1 rounded-lg transition-all font-black cursor-pointer ${
                    sortBy === "time" ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm" : "text-gray-500"
                  }`}
                >
                  Duration
                </button>
                <button
                  onClick={() => setSortBy("distance")}
                  className={`px-3 py-1 rounded-lg transition-all font-black cursor-pointer ${
                    sortBy === "distance" ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm" : "text-gray-500"
                  }`}
                >
                  Distance
                </button>
                <button
                  onClick={() => setSortBy("changes")}
                  className={`px-3 py-1 rounded-lg transition-all font-black cursor-pointer ${
                    sortBy === "changes" ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm" : "text-gray-500"
                  }`}
                >
                  Transfers
                </button>
              </div>
            </div>
          </div>

          {/* Cards List */}
          <div className="space-y-4">
            {sortedRoutes.map((route, idx) => {
              const isExpanded = !!expandedCards[idx];
              const isDirect = route.changes === 0;
              
              // Get first train details
              const firstTrain = route.trains[0];
              const lastTrain = route.trains[route.trains.length - 1];

              return (
                <div
                  key={idx}
                  className="bg-white dark:bg-[#131926]/90 border border-gray-200 dark:border-white/5 rounded-2xl shadow-md overflow-hidden transition-colors duration-300 hover:shadow-lg flex flex-col justify-between"
                >
                  {/* IRCTC-style Train Header Row */}
                  <div className="bg-slate-100 dark:bg-slate-950 px-5 py-3 border-b border-gray-200 dark:border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-[#0f2954] dark:text-blue-400 text-sm">
                        {isDirect 
                          ? `${firstTrain.train_name} (${firstTrain.train_no})` 
                          : `${firstTrain.train_name} → ${lastTrain.train_name} [Connecting]`
                        }
                      </span>
                      <span className="text-[10px] bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded font-black tracking-wider uppercase">
                        {isDirect ? "Direct Train" : `${route.changes} Swap Layovers`}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400 font-semibold text-[10px]">
                      <span>Runs On: M T W T F S S</span>
                      <span className="text-slate-300 dark:text-slate-800">|</span>
                      <span className="text-orange-500 hover:underline cursor-pointer">Train Schedule</span>
                    </div>
                  </div>

                  {/* IRCTC Timing Timeline Block */}
                  <div className="p-5 flex flex-col md:flex-row items-stretch justify-between gap-6 border-b border-gray-100 dark:border-white/5">
                    {/* Departure Info */}
                    <div className="flex-1 flex items-start gap-3">
                      <span className="text-xl">📤</span>
                      <div>
                        <span className="block text-lg font-black text-slate-900 dark:text-white leading-tight">
                          {firstTrain.departure_time.substring(0, 5)}
                        </span>
                        <span className="block font-bold text-xs text-slate-800 dark:text-slate-200 mt-0.5">
                          {firstTrain.from_station_name} ({firstTrain.from_station})
                        </span>
                        {firstTrain.departure_date && (
                          <span className="block text-[10px] text-gray-500 font-bold uppercase mt-0.5">
                            {new Date(firstTrain.departure_date).toDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Duration / Layout line */}
                    <div className="flex-1 flex flex-col items-center justify-center min-w-[120px] py-2 md:py-0 border-y border-dashed border-gray-200 dark:border-white/5 md:border-0">
                      <span className="text-xs font-black text-gray-500">{formatMinutes(route.total_time)}</span>
                      {/* Visual line */}
                      <div className="relative w-full flex items-center justify-center my-1.5">
                        <div className="h-[2px] w-full bg-slate-300 dark:bg-slate-700 rounded-full"></div>
                        <div className="absolute h-2.5 w-2.5 rounded-full bg-orange-500 shadow border border-white"></div>
                      </div>
                      <span className="text-[10px] font-bold text-gray-400">Distance: {route.total_distance} km</span>
                    </div>

                    {/* Arrival Info */}
                    <div className="flex-1 flex items-start justify-end text-right gap-3">
                      <div>
                        <span className="block text-lg font-black text-slate-900 dark:text-white leading-tight">
                          {lastTrain.arrival_time.substring(0, 5)}
                        </span>
                        <span className="block font-bold text-xs text-slate-800 dark:text-slate-200 mt-0.5">
                          {lastTrain.to_station_name} ({lastTrain.to_station})
                        </span>
                        {lastTrain.arrival_date && (
                          <span className="block text-[10px] text-gray-500 font-bold uppercase mt-0.5">
                            {new Date(lastTrain.arrival_date).toDateString()}
                          </span>
                        )}
                      </div>
                      <span className="text-xl">📥</span>
                    </div>
                  </div>

                  {/* IRCTC-style Class Fares Grid & Detail Switcher */}
                  <div className="p-5 space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      {route.trains.map((seg, sIdx) => (
                        <div
                          key={sIdx}
                          onClick={() => toggleExpand(idx)}
                          className="border border-gray-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl text-left select-none cursor-pointer hover:border-blue-500 transition-all flex flex-col justify-between min-w-[150px] shadow-sm active:scale-98"
                        >
                          <span className="block text-[10px] font-extrabold text-[#0f2954] dark:text-blue-400">
                            {travelClass === "SL" ? "Sleeper (SL)" : travelClass === "3A" ? "AC 3 Tier (3A)" : travelClass === "2A" ? "AC 2 Tier (2A)" : travelClass === "1A" ? "AC 1 Class (1A)" : travelClass === "CC" ? "AC Chair Car (CC)" : "Second Sitting (2S)"}
                          </span>
                          
                          <span
                            className={`block font-black text-xs uppercase my-1.5 ${
                              (seg.availability_status || "").includes("AVAILABLE")
                                ? "text-green-600 dark:text-green-400"
                                : (seg.availability_status || "").includes("WL")
                                  ? "text-amber-600 dark:text-amber-400"
                                  : "text-red-500"
                            }`}
                          >
                            {seg.availability_status || "AVAILABLE-0021"}
                          </span>

                          <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-100 dark:border-white/5 mt-1 font-bold text-slate-800 dark:text-white">
                            <span>₹{seg.fare || 240}</span>
                            <span className="text-[9px] text-blue-500 dark:text-blue-400 uppercase tracking-widest flex items-center gap-0.5">
                              <RefreshCw className="h-2.5 w-2.5" /> Refresh
                            </span>
                          </div>
                        </div>
                      ))}

                      {/* Cumulative Total Fare callout badge (connecting segments) */}
                      {!isDirect && route.total_fare !== undefined && (
                        <div className="ml-auto p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-center">
                          <span className="block text-[8px] uppercase font-black tracking-widest leading-none">Total Fare</span>
                          <span className="text-base font-black">₹{route.total_fare}</span>
                        </div>
                      )}
                    </div>

                    {/* Detailed Route Timeline (Layover wait details) */}
                    {isExpanded && (
                      <div className="border-t border-gray-100 dark:border-white/5 pt-4 space-y-4 animate-slideDown text-xs text-slate-800 dark:text-slate-200">
                        <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-2">
                          <span className="font-extrabold uppercase text-[10px] tracking-wider text-[#0f2954] dark:text-blue-400">Connection Journey Segments</span>
                          <span className="text-[10px] text-gray-500">Wait times between layovers included</span>
                        </div>
                        
                        <div className="relative pl-6 border-l-2 border-dashed border-gray-300 dark:border-white/10 space-y-6">
                          {route.trains.map((seg, sIdx) => {
                            const showTransfer = sIdx < route.trains.length - 1;
                            const nextSeg = showTransfer ? route.trains[sIdx + 1] : null;

                            // Calculate layover transfer times
                            let waitTime = 0;
                            if (nextSeg && seg.arrival_date && nextSeg.departure_date) {
                              const arr = new Date(`${seg.arrival_date}T${seg.arrival_time}`);
                              const dep = new Date(`${nextSeg.departure_date}T${nextSeg.departure_time}`);
                              waitTime = Math.round((dep.getTime() - arr.getTime()) / 60000);
                            }

                            return (
                              <div key={sIdx} className="relative space-y-2">
                                {/* Bullet indicator */}
                                <div className="absolute top-1 -left-[31px] h-4.5 w-4.5 rounded-full bg-white dark:bg-slate-900 border-2 border-[#0f2954] dark:border-blue-400 flex items-center justify-center text-[8px] font-black z-10">
                                  {sIdx + 1}
                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-slate-800 dark:text-slate-100 font-extrabold text-[13px]">
                                  <span>{seg.train_name} (#{seg.train_no})</span>
                                  <span className="text-gray-500 font-medium text-xs">{seg.distance} km | {(seg.travel_time / 60).toFixed(1)} hrs</span>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-xs font-bold text-gray-600 dark:text-gray-400">
                                  <div>
                                    <span className="block text-[9px] uppercase tracking-wider text-gray-400">Boarding</span>
                                    <span className="text-slate-800 dark:text-slate-200">{seg.from_station_name} ({seg.from_station})</span>
                                    <span className="block text-[10px] text-gray-500 font-semibold">{seg.departure_time.substring(0,5)} | {seg.departure_date}</span>
                                  </div>
                                  <div>
                                    <span className="block text-[9px] uppercase tracking-wider text-gray-400">Deboarding</span>
                                    <span className="text-slate-800 dark:text-slate-200">{seg.to_station_name} ({seg.to_station})</span>
                                    <span className="block text-[10px] text-gray-500 font-semibold">{seg.arrival_time.substring(0,5)} | {seg.arrival_date}</span>
                                  </div>
                                </div>

                                {showTransfer && nextSeg && (
                                  <div className="bg-amber-500/5 border border-amber-500/10 p-3 rounded-xl text-amber-600 dark:text-amber-400 flex items-center justify-between text-xs font-semibold my-3">
                                    <span>⚠️ Layover swap transfer at {seg.to_station_name} ({seg.to_station})</span>
                                    <span>Laying Wait: {formatMinutes(waitTime)}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* IRCTC-style Train Actions row */}
                  <div className="px-5 py-3 border-t border-gray-100 dark:border-white/5 flex items-center gap-3 bg-slate-50 dark:bg-slate-950/20">
                    <button
                      onClick={() => alert("Booking functionality is integrated via IRCTC gateway.")}
                      className="bg-[#fb731c] hover:bg-[#e05f0d] text-white px-5 py-2 rounded-xl text-xs font-extrabold uppercase shadow cursor-pointer transition-all active:scale-95"
                    >
                      Book Now
                    </button>
                    <button
                      onClick={() => toggleExpand(idx)}
                      className="border border-gray-300 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-xl text-xs font-bold uppercase cursor-pointer transition-all"
                    >
                      {isExpanded ? "Hide Details" : "Other Routes"}
                    </button>
                  </div>
                </div>
              );
            })}

            {sortedRoutes.length === 0 && (
              <div className="text-center py-16 text-gray-500 text-xs bg-white dark:bg-[#131926]/90 border border-gray-200 dark:border-white/5 rounded-2xl">
                No journey paths match your refine filters. Try clearing time slots.
              </div>
            )}
          </div>
        </main>

      </div>
    </div>
  );
}
