import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import axios from "axios";
import { Clock, Navigation, GitCompare, ArrowRight, ChevronDown, ChevronUp, Filter, ArrowUpDown, Loader2, AlertCircle } from "lucide-react";

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
}

interface Route {
  type: string;
  trains: TrainSegment[];
  total_distance: number;
  total_time: number;
  changes: number;
  waiting_time: number;
}

export default function Results() {
  const [searchParams] = useSearchParams();
  const source = searchParams.get("source") || "";
  const destination = searchParams.get("destination") || "";
  const initialMode = searchParams.get("mode") || "time";
  const date = searchParams.get("date") || "";
  const deadline = searchParams.get("deadline") || "";

  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter and Sorting states
  const [maxChangesFilter, setMaxChangesFilter] = useState<number | "all">("all");
  const [sortBy, setSortBy] = useState<"time" | "distance" | "changes">("time");
  
  // Track which cards are expanded to show detailed timeline
  const [expandedCards, setExpandedCards] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    const fetchRoutes = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(
          `http://localhost:3000/search?source=${source}&destination=${destination}&mode=${initialMode}&date=${date}&deadline=${deadline}`
        );
        setRoutes(response.data.routes || []);
        
        // Auto-expand the first card
        setExpandedCards({ 0: true });
      } catch (err: any) {
        console.error("Search failed:", err);
        setError(err.response?.data?.error || "An error occurred while finding routes.");
      } finally {
        setLoading(false);
      }
    };

    if (source && destination) {
      fetchRoutes();
    }
  }, [source, destination, initialMode]);

  const toggleExpand = (idx: number) => {
    setExpandedCards((prev) => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
  };

  // Filter routes
  const filteredRoutes = routes.filter((route) => {
    if (maxChangesFilter !== "all" && route.changes > maxChangesFilter) {
      return false;
    }
    return true;
  });

  // Sort routes
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
      <div className="flex h-96 flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="text-sm text-gray-400">Running route calculations...</p>
      </div>
    );
  }

  if (error || routes.length === 0) {
    return (
      <div className="glass-panel mx-auto max-w-md p-8 rounded-2xl border border-red-500/10 text-center flex flex-col items-center gap-4 animate-fadeIn">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h3 className="text-lg font-bold text-white">No Routes Found</h3>
        <p className="text-sm text-gray-400">
          {error || `We couldn't find any path connections between ${source} and ${destination}.`}
        </p>
        <Link
          to="/"
          className="mt-2 inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-500 transition-all"
        >
          Modify Search
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Route Info Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/10">
              ROUTE PLAN
            </span>
            {date && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/5 text-gray-300 border border-white/5">
                Date: {date}
              </span>
            )}
            {deadline && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/10">
                Deadline: {new Date(deadline).toLocaleString()}
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Link to={`/station/${source}`} className="hover:text-blue-400 transition-colors">
              {source}
            </Link>
            <ArrowRight className="h-4.5 w-4.5 text-gray-500 shrink-0" />
            <Link to={`/station/${destination}`} className="hover:text-blue-400 transition-colors">
              {destination}
            </Link>
          </h1>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Computed {routes.length} paths using {initialMode} optimization
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            to="/"
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-xs font-bold text-white transition-all text-center"
          >
            New Search
          </Link>
        </div>
      </div>

      {/* Filters and Sorters */}
      <div className="glass-panel p-4 rounded-xl border border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-xs font-bold text-gray-400 mr-2">Max Transfers</span>
          <div className="flex gap-1.5 w-full sm:w-auto">
            <button
              onClick={() => setMaxChangesFilter("all")}
              className={`flex-1 sm:flex-initial px-3 py-1 rounded-lg text-xs font-bold transition-all border ${
                maxChangesFilter === "all"
                  ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                  : "border-transparent text-gray-400 hover:text-gray-200"
              }`}
            >
              Any
            </button>
            <button
              onClick={() => setMaxChangesFilter(0)}
              className={`flex-1 sm:flex-initial px-3 py-1 rounded-lg text-xs font-bold transition-all border ${
                maxChangesFilter === 0
                  ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                  : "border-transparent text-gray-400 hover:text-gray-200"
              }`}
            >
              Direct
            </button>
            <button
              onClick={() => setMaxChangesFilter(1)}
              className={`flex-1 sm:flex-initial px-3 py-1 rounded-lg text-xs font-bold transition-all border ${
                maxChangesFilter === 1
                  ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                  : "border-transparent text-gray-400 hover:text-gray-200"
              }`}
            >
              1 Transfer
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <ArrowUpDown className="h-4 w-4 text-gray-500" />
          <span className="text-xs font-bold text-gray-400 mr-2">Sort By</span>
          <div className="flex gap-1.5 w-full sm:w-auto">
            <button
              onClick={() => setSortBy("time")}
              className={`flex-1 sm:flex-initial px-3 py-1 rounded-lg text-xs font-bold transition-all border ${
                sortBy === "time"
                  ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                  : "border-transparent text-gray-400 hover:text-gray-200"
              }`}
            >
              Duration
            </button>
            <button
              onClick={() => setSortBy("distance")}
              className={`flex-1 sm:flex-initial px-3 py-1 rounded-lg text-xs font-bold transition-all border ${
                sortBy === "distance"
                  ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                  : "border-transparent text-gray-400 hover:text-gray-200"
              }`}
            >
              Distance
            </button>
            <button
              onClick={() => setSortBy("changes")}
              className={`flex-1 sm:flex-initial px-3 py-1 rounded-lg text-xs font-bold transition-all border ${
                sortBy === "changes"
                  ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                  : "border-transparent text-gray-400 hover:text-gray-200"
              }`}
            >
              Transfers
            </button>
          </div>
        </div>
      </div>

      {/* Routes List */}
      <div className="space-y-4">
        {sortedRoutes.map((route, idx) => {
          const isExpanded = !!expandedCards[idx];
          const isDirect = route.changes === 0;

          return (
            <div
              key={idx}
              className={`glass-panel rounded-2xl border transition-all overflow-hidden ${
                isExpanded ? "border-blue-500/20" : "border-white/5"
              }`}
            >
              {/* Card Header Panel */}
              <div
                onClick={() => toggleExpand(idx)}
                className="p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer hover:bg-white/2 transition-colors select-none"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded-md border ${
                        isDirect
                          ? "bg-green-500/10 border-green-500/10 text-green-400"
                          : "bg-indigo-500/10 border-indigo-500/10 text-indigo-400"
                      }`}
                    >
                      {isDirect ? "Direct Route" : `${route.changes} Transfers`}
                    </span>
                    <span className="text-xs text-gray-500 font-bold">
                      {route.trains.map((t) => t.train_no).join(" → ")}
                    </span>
                  </div>

                  {/* Summary row */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                    <div className="flex items-center gap-1 text-white font-black">
                      <Clock className="h-4.5 w-4.5 text-blue-400 shrink-0" />
                      <span>{formatMinutes(route.total_time)}</span>
                    </div>
                    <div className="h-3.5 w-px bg-white/10"></div>
                    <div className="flex items-center gap-1 text-gray-300 font-semibold">
                      <Navigation className="h-4.5 w-4.5 text-gray-500 shrink-0" />
                      <span>{route.total_distance} km</span>
                    </div>
                    {!isDirect && (
                      <>
                        <div className="h-3.5 w-px bg-white/10"></div>
                        <div className="flex items-center gap-1 text-gray-400">
                          <GitCompare className="h-4.5 w-4.5 text-purple-400 shrink-0" />
                          <span>Wait {formatMinutes(route.waiting_time)}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-between border-t border-white/5 pt-3 sm:border-0 sm:pt-0">
                  <div className="flex -space-x-1 sm:hidden">
                    {route.trains.map((seg, sIdx) => (
                      <span
                        key={sIdx}
                        className="rounded-full bg-blue-600 px-2 py-0.5 text-[9px] font-bold border border-slate-900"
                      >
                        #{seg.train_no}
                      </span>
                    ))}
                  </div>
                  <button className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 text-gray-400 transition-colors">
                    {isExpanded ? <ChevronUp className="h-4.5 w-4.5" /> : <ChevronDown className="h-4.5 w-4.5" />}
                  </button>
                </div>
              </div>

              {/* Detailed Timeline Panel */}
              {isExpanded && (
                <div className="border-t border-white/5 bg-[#0a0d16]/50 p-6 space-y-6 animate-slideDown">
                  <h4 className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Journey Timeline</h4>

                  <div className="relative pl-6 sm:pl-8 border-l border-white/5 space-y-6">
                    {route.trains.map((seg, sIdx) => {
                      const showTransfer = sIdx < route.trains.length - 1;
                      const nextSeg = showTransfer ? route.trains[sIdx + 1] : null;

                      // Calculate transit wait time for transfer
                      let waitTime = 0;
                      if (nextSeg) {
                        if (seg.arrival_date && nextSeg.departure_date) {
                          const arrStr = `${seg.arrival_date}T${seg.arrival_time}`;
                          const depStr = `${nextSeg.departure_date}T${nextSeg.departure_time}`;
                          const arr = new Date(arrStr);
                          const dep = new Date(depStr);
                          waitTime = Math.round((dep.getTime() - arr.getTime()) / 60000);
                        } else {
                          const arr = seg.arrival_time;
                          const dep = nextSeg.departure_time;
                          const [ah, am] = arr.split(":").map(Number);
                          const [dh, dm] = dep.split(":").map(Number);
                          let aMin = ah * 60 + am;
                          let dMin = dh * 60 + dm;
                          if (dMin < aMin) dMin += 1440; // overnight
                          waitTime = dMin - aMin;
                        }
                      }

                      return (
                        <div key={sIdx} className="relative space-y-3">
                          {/* Marker dot */}
                          <div className="absolute top-1.5 -left-[31px] sm:-left-[39px] h-4 w-4 rounded-full border-2 border-[#0a0d16] bg-blue-500 shadow-md shadow-blue-500/20 z-10"></div>

                          {/* Leg Segment Details */}
                          <div className="glass-panel p-4 rounded-xl border border-white/5 space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2">
                              <div>
                                <span className="block text-[10px] text-blue-400 font-bold uppercase">TRAIN SEGMENT</span>
                                <Link to={`/train/${seg.train_no}`} className="text-sm font-black text-white hover:text-blue-400 transition-colors">
                                  {seg.train_name}
                                </Link>
                                <span className="text-xs text-gray-500 font-bold ml-1.5">#{seg.train_no}</span>
                              </div>
                              <div className="text-left sm:text-right">
                                <span className="block text-xs font-semibold text-white">{seg.distance} km</span>
                                <span className="block text-[10px] text-gray-500">{(seg.travel_time / 60).toFixed(1)} hours travel</span>
                              </div>
                            </div>

                            <div className="flex justify-between items-center text-xs">
                              <div>
                                <span className="block text-gray-500 font-medium">Board</span>
                                <Link to={`/station/${seg.from_station}`} className="text-sm font-bold text-white hover:text-blue-400 transition-colors">
                                  {seg.from_station}
                                </Link>
                                <span className="block text-[10px] text-gray-400 font-semibold mt-0.5">
                                  Departs {seg.departure_time.substring(0, 5)}
                                  {seg.departure_date && <span className="text-gray-500 font-medium ml-1">({seg.departure_date})</span>}
                                </span>
                              </div>

                              <div className="flex flex-col items-center">
                                <ArrowRight className="h-4 w-4 text-gray-600" />
                              </div>

                              <div className="text-right">
                                <span className="block text-gray-500 font-medium">Deboard</span>
                                <Link to={`/station/${seg.to_station}`} className="text-sm font-bold text-white hover:text-blue-400 transition-colors">
                                  {seg.to_station}
                                </Link>
                                <span className="block text-[10px] text-gray-400 font-semibold mt-0.5">
                                  Arrives {seg.arrival_time.substring(0, 5)}
                                  {seg.arrival_date && <span className="text-gray-500 font-medium ml-1">({seg.arrival_date})</span>}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Transfer stopover warning panel */}
                          {showTransfer && nextSeg && (
                            <div className="relative pl-2 py-4">
                              <div className="absolute top-1/2 -left-[35px] sm:-left-[43px] h-2 w-2 rounded-full bg-purple-500 z-10"></div>
                              <div className="rounded-xl border border-purple-500/10 bg-purple-500/5 p-3 flex items-center justify-between text-xs text-purple-300">
                                <div>
                                  <span className="block font-bold">Transfer Connection</span>
                                  <span className="text-[10px] text-purple-400">Switch trains at {seg.to_station}</span>
                                </div>
                                <div className="text-right">
                                  <span className="block font-black text-white">{formatMinutes(waitTime)}</span>
                                  <span className="text-[9px] text-purple-400 font-bold uppercase tracking-wider">Laying Wait</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        
        {sortedRoutes.length === 0 && (
          <div className="text-center py-12 text-gray-500 text-sm glass-panel rounded-2xl border border-white/5">
            No journeys match the selected Transfer filters.
          </div>
        )}
      </div>
    </div>
  );
}
