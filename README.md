# 🚆 Marg-Manthan: Multi-Modal Railway Transit Pathfinder

Marg-Manthan is a high-performance, budget-aware, and deadline-constrained railway route planning system designed for Indian Railways. By pairing an **A\* Search Pathfinder** on a time-expanded topological network with a **Node.js Express Gateway** and an **IRCTC-branded React Frontend**, Marg-Manthan discovers optimal direct and connecting train itineraries under 2 seconds.

---

## ✨ Features

- **🔍 Direct & Connecting Searches**: Discovers paths with up to 2 transfers (3 trains total) dynamically routing across multi-day schedules.
- **⚡ A* Pathfinder Engine**: Guided by single-source undirected topological shortest path distance heuristics to restrict expansions and return routes instantly.
- **🕒 Temporal Connection & Deadline Constraints**: Computes layout layovers (minimum 15 mins, maximum 18 hours) across absolute datetimes and filters paths exceeding latest arrival deadlines.
- **💰 Budget-Aware Class Pruning**: Prunes individual class ticket combinations that exceed the user's maximum budget.
- **🚀 Concurrent API Query Engine**: Executes parallel seat availability checks (using thread pools), deduplicates segment-level queries to save API quota, and uses strict connection socket timeouts.
- **🔌 API Circuit Breaker**: Instantly intercepts `HTTP 429` Rate Limit errors from external IRCTC RapidAPIs, falling back to deterministic synthetic generators to preserve speed.
- **🎨 IRCTC Branding & Theme Engine**: Premium layout matching the official IRCTC portal with fully custom SVG iconography and dark/light glassmorphic styling.
- **📋 Sequential Booking Helper**: Booking modal with clipboard-copy shortcuts for station codes and dates, preventing session and route loss on login redirects.

---

## 🛠 Tech Stack

| Category | Technology |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4 |
| **Gateway Tier** | Node.js, Express, Axios, Nodemon |
| **Routing Tier** | Python 3.11, FastAPI, Uvicorn |
| **Database** | PostgreSQL, Static In-Memory JSON Timetable Indexes |
| **Graph Processing** | NetworkX, Pickle |

---

## 📂 Project Structure

```text
Marg-Manthan/
│
├── backend/
│   ├── data/                      # Station indices, names, and graph.pkl data
│   ├── src/                       # Node.js Express Gateway (App & Controllers)
│   ├── python_service/            # FastAPI Python Routing Service
│   │   ├── app/                   # API entry points (main.py)
│   │   ├── graph/                 # A* pathfinder (route_search.py)
│   │   └── venv/                  # Python Virtual Environment
│   └── package.json
│
├── frontend/                      # React Frontend Web Application (Vite)
│   ├── src/
│   │   ├── components/            # UI components (Emblem, Navbar, BookingModal)
│   │   ├── pages/                 # Home, Results, TrainDetails, About
│   │   └── index.css              # Custom themes, styling, and override utilities
│   └── package.json
│
└── README.md
```

---

## ⚙️ How It Works

1. **Static Preprocessing**: During startup, the Python service loads the NetworkX database graph (`graph.pkl`) and indexes station timetables into fast lookup memory mappings.
2. **Topological BFS**: Once a search query (Source $\rightarrow$ Destination) is received, the pathfinder runs a single-source BFS on the undirected station network to map the minimum train hops from the target station to all other nodes.
3. **A\* Pathfinder Execution**: Dijkstra's frontier is expanded, sorted by $f(u) = g(u) + h(u)$, where $h(u) = \text{hops} \times 120\text{ minutes}$. It filters out suburban local trains (numbers starting with `9`) and slow passenger/DEMU trains (starting with `5` or `7`) to avoid local loop explosions.
4. **Temporal Layover Validation**: The pathfinder validates connecting windows at layovers, ensuring they fall between 15 minutes and 18 hours.
5. **Parallel Seat/Fare Querying**: Discovered routes have their unique segment availability queried in parallel. Circuit-breakers trip and use fallback generators if API limits are hit.
6. **Budget Filtering**: Routes exceeding the total budget are pruned, and class details are updated accordingly.

---

## 🚀 Installation & Running

### 1. Database Setup
Ensure PostgreSQL is running, then load the timetable database:
```bash
createdb railway_db
psql -d railway_db -f backend/data/railway_db.sql
```

### 2. Configure Environment Variables
Create a `.env` file inside the `backend/` directory:
```env
PORT=3000
DATABASE_URL=postgres://username:password@localhost:5432/railway_db
PYTHON_SERVICE_URL=http://localhost:8000
RAPIDAPI_KEY=your_rapidapi_key
RAPIDAPI_HOST=irctc1.p.rapidapi.com
```

### 3. Run FastAPI Python Service
```bash
cd backend/python_service
source venv/bin/activate
pip install -r requirements.txt
python run_service.py
```

### 4. Run Express Backend Gateway
```bash
cd backend
npm install
npm run dev
```

### 5. Run Vite React Frontend
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5174](http://localhost:5174) in your browser.

---

## 📄 License

This project is licensed under the MIT License.