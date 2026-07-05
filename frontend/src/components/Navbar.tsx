import { Link, useLocation } from "react-router-dom";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

interface NavbarProps {
  theme: string;
  toggleTheme: () => void;
}

export default function Navbar({ theme, toggleTheme }: NavbarProps) {
  const location = useLocation();
  const [time, setTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      };
      // Format to "04-Jul-2026 [09:54:40]"
      const formatted = now.toLocaleString('en-IN', options)
        .replace(/,/g, '')
        .replace(/(\d+)\s([a-zA-Z]+)\s(\d+)\s(\d+:\d+:\d+)/, '$1-$2-$3 [$4]');
      setTime(formatted);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const isActive = (path: string) => {
    return location.pathname === path
      ? "text-orange-500 font-extrabold border-b-2 border-orange-500"
      : "text-gray-700 dark:text-gray-300 hover:text-orange-500 transition-colors";
  };

  return (
    <header className="w-full flex flex-col bg-white dark:bg-[#090d16] border-b border-gray-200 dark:border-white/5 transition-colors duration-300 shadow-sm">
      {/* Top Utility Bar */}
      <div className="w-full bg-gray-100 dark:bg-slate-950 px-4 py-1.5 text-[11px] text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-white/5 flex items-center justify-between font-bold">
        <div className="flex items-center gap-4">
          <span>{time}</span>
          <span className="hidden md:inline text-gray-300 dark:text-gray-800">|</span>
          <span className="hidden md:inline cursor-pointer hover:text-blue-600 transition-colors">A-</span>
          <span className="hidden md:inline cursor-pointer hover:text-blue-600 transition-colors">A</span>
          <span className="hidden md:inline cursor-pointer hover:text-blue-600 transition-colors">A+</span>
          <span className="hidden md:inline text-gray-300 dark:text-gray-800">|</span>
          <span className="cursor-pointer hover:text-blue-600 transition-colors font-semibold">हिंदी</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded border border-gray-300 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300 transition-all font-black uppercase text-[10px] cursor-pointer"
            title={theme === "light" ? "Switch to GenZ Dark Mode" : "Switch to IRCTC Light Mode"}
          >
            {theme === "light" ? (
              <>
                <Moon className="h-3 w-3 text-slate-800" />
                <span>Dark Mode</span>
              </>
            ) : (
              <>
                <Sun className="h-3 w-3 text-yellow-400" />
                <span>Light Mode</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Logo Header */}
      <div className="mx-auto w-full max-w-7xl px-4 py-3 flex items-center justify-between">
        {/* Left Side: Indian Railways Emblem */}
        <Link to="/" className="flex items-center gap-3 group">
          {/* Custom Indian Railways Emblem SVG */}
          <svg className="h-12 w-12 text-[#0c244c] dark:text-blue-400 shrink-0" viewBox="0 0 100 100" fill="currentColor">
            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="4" />
            <circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
            <path d="M 50,15 L 53,24 L 62,24 L 55,30 L 58,39 L 50,33 L 42,39 L 45,30 L 38,24 L 47,24 Z" fill="currentColor" />
            <circle cx="50" cy="58" r="16" fill="none" stroke="currentColor" strokeWidth="2.5" />
            {/* Locomotive silhouette in the middle */}
            <rect x="42" y="52" width="16" height="10" rx="1" fill="currentColor" />
            <rect x="44" y="47" width="12" height="5" fill="currentColor" />
            <circle cx="45" cy="64" r="2.5" fill="currentColor" />
            <circle cx="50" cy="64" r="2.5" fill="currentColor" />
            <circle cx="55" cy="64" r="2.5" fill="currentColor" />
            <line x1="30" y1="58" x2="70" y2="58" stroke="currentColor" strokeWidth="2" />
            <line x1="30" y1="62" x2="70" y2="62" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <div className="flex flex-col">
            <span className="text-base md:text-lg font-black tracking-tight text-[#0c244c] dark:text-white uppercase leading-none">
              Indian Railways
            </span>
            <span className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">
              Safety • Security • Punctuality
            </span>
          </div>
        </Link>

        {/* Brand Banner Text (Hidden on small screens) */}
        <div className="hidden lg:flex flex-col items-center">
          <span className="text-xl font-black text-[#0f2954] dark:text-blue-500 uppercase tracking-wider">
            Marg-Manthan
          </span>
          <span className="text-[9px] text-orange-500 font-black uppercase tracking-widest">
            Intelligent Alternate Routing Engine
          </span>
        </div>

        {/* Right Side: IRCTC Crest Logo */}
        <div className="flex items-center gap-2">
          <div className="flex flex-col text-right hidden sm:flex">
            <span className="text-xs font-black text-[#0f2954] dark:text-white">IRCTC Partner</span>
            <span className="text-[9px] text-gray-400 font-bold">NextGen e-Ticketing</span>
          </div>
          {/* Custom IRCTC Corporate Swirl SVG */}
          <svg className="h-12 w-12 text-[#213c7a] dark:text-blue-400 shrink-0" viewBox="0 0 100 100" fill="currentColor">
            <path d="M 50,5 C 25,5 5,25 5,50 C 5,75 25,95 50,95 C 75,95 95,75 95,50 C 95,35 88,20 78,12 L 72,18 C 80,25 85,37 85,50 C 85,69 69,85 50,85 C 31,85 15,69 15,50 C 15,31 31,15 50,15 C 58,15 65,18 71,23 L 77,17 C 70,10 60,5 50,5 Z" />
            <path d="M 50,22 C 35,22 22,35 22,50 C 22,65 35,78 50,78 C 65,78 78,65 78,50 L 68,50 C 68,60 60,68 50,68 C 40,68 32,60 32,50 C 32,40 40,32 50,32 C 55,32 59,34 62,37 L 69,30 C 64,25 57,22 50,22 Z" fill="#fb731c" />
            <circle cx="50" cy="50" r="6" fill="currentColor" />
          </svg>
        </div>
      </div>

      {/* Blue Navigation Bar */}
      <nav className="w-full bg-[#0f2954] dark:bg-slate-900 text-white font-bold text-xs uppercase px-4 py-2.5">
        <div className="mx-auto w-full max-w-7xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
            <Link to="/" className="text-orange-400 hover:text-white transition-colors flex items-center gap-1">
              <span>🏠</span> Home
            </Link>
            <span className="text-slate-500">|</span>
            <Link to="/" className={isActive("/")}>
              Search Routes
            </Link>
            <span className="text-slate-500">|</span>
            <Link to="/about" className={isActive("/about")}>
              About Marg-Manthan
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <span className="bg-orange-500 text-white px-2 py-0.5 rounded text-[9px] font-black tracking-wider uppercase animate-pulse">
              Alternate Route Enabled
            </span>
          </div>
        </div>
      </nav>
    </header>
  );
}
