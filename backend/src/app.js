require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const db = require("./config/db");

const app = express();
const PORT = process.env.PORT || 3000;
const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || "http://localhost:8000";

// Enable CORS and body parsing
app.use(cors());
app.use(express.json());

// Root endpoint
app.get("/", (req, res) => {
    res.send("🚆 RailRasta (Marg-Manthan) Backend Gateway is Running!");
});

// Autocomplete and suggestions endpoint (station search)
app.get("/stations", async (req, res) => {
    const q = req.query.q ? req.query.q.toUpperCase().trim() : "";
    if (q.length < 2) {
        return res.json([]);
    }
    
    try {
        // Forward request to Python service to get normalized station names
        const response = await axios.get(`${PYTHON_SERVICE_URL}/stations?q=${encodeURIComponent(q)}`);
        res.json(response.data);
    } catch (err) {
        console.error("Failed to fetch stations from Python service, falling back to database...", err.message);
        try {
            // Fallback to PostgreSQL database search
            const queryText = `
                SELECT DISTINCT station_code AS code, station_name AS name
                FROM train_schedule
                WHERE station_code ILIKE $1 OR station_name ILIKE $2
                ORDER BY station_code
                LIMIT 20
            `;
            const result = await db.query(queryText, [`%${q}%`, `%${q}%`]);
            res.json(result.rows);
        } catch (dbErr) {
            console.error(dbErr);
            res.status(500).json({ error: "Failed to search stations" });
        }
    }
});

// Route search endpoint
app.get("/search", async (req, res) => {
    const { source, destination, mode, date, deadline } = req.query;
    if (!source || !destination) {
        return res.status(400).json({ error: "Source and destination stations are required" });
    }
    
    try {
        // Forward search parameters to Python routing service
        const response = await axios.post(`${PYTHON_SERVICE_URL}/search`, {
            source: source.toUpperCase().trim(),
            destination: destination.toUpperCase().trim(),
            mode: mode || "time",
            date: date || null,
            deadline: deadline || null
        });
        res.json({ routes: response.data });
    } catch (err) {
        console.error("Error communicating with Python routing service:", err.message);
        const status = err.response ? err.response.status : 500;
        const message = err.response && err.response.data && err.response.data.detail 
            ? err.response.data.detail 
            : "Failed to calculate route paths";
        res.status(status).json({ error: message });
    }
});

// Train route details endpoint (timetable query)
app.get("/train/:train_no", async (req, res) => {
    const { train_no } = req.params;
    if (!train_no) {
        return res.status(400).json({ error: "Train number is required" });
    }
    
    try {
        // Query train timetable details from database
        const queryText = `
            SELECT seq, station_code, station_name, arrival_time, departure_time, distance
            FROM train_schedule
            WHERE train_no = $1
            ORDER BY seq
        `;
        const result = await db.query(queryText, [train_no]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: `Train ${train_no} not found` });
        }
        
        // Query general train info (train name and terminals)
        const infoQuery = `
            SELECT DISTINCT train_name, source_station, source_station_name, destination_station, destination_station_name
            FROM train_schedule
            WHERE train_no = $1
            LIMIT 1
        `;
        const infoResult = await db.query(infoQuery, [train_no]);
        const info = infoResult.rows[0];
        
        res.json({
            train_no: parseInt(train_no),
            train_name: info.train_name,
            source_station: info.source_station,
            source_station_name: info.source_station_name,
            destination_station: info.destination_station,
            destination_station_name: info.destination_station_name,
            total_stations: result.rows.length,
            route_segments: result.rows.map(row => ({
                seq: row.seq,
                station_code: row.station_code,
                station_name: row.station_name,
                arrival_time: row.arrival_time,
                departure_time: row.departure_time,
                distance: parseFloat(row.distance) || 0
            }))
        });
    } catch (err) {
        console.error("Database error fetching train details:", err.message);
        res.status(500).json({ error: "Database error fetching train details" });
    }
});

// Station details endpoint (passing trains and connected nodes)
app.get("/station/:station_code", async (req, res) => {
    const { station_code } = req.params;
    if (!station_code) {
        return res.status(400).json({ error: "Station code is required" });
    }
    
    const code = station_code.toUpperCase().trim();
    
    try {
        // Query trains passing through station
        const trainsQuery = `
            SELECT DISTINCT train_no, train_name, seq, arrival_time, departure_time, source_station, destination_station
            FROM train_schedule
            WHERE station_code = $1
            ORDER BY train_no
        `;
        const trainsResult = await db.query(trainsQuery, [code]);
        
        // Find general station details
        const nameQuery = `
            SELECT DISTINCT station_name 
            FROM train_schedule 
            WHERE station_code = $1 
            LIMIT 1
        `;
        const nameResult = await db.query(nameQuery, [code]);
        if (nameResult.rows.length === 0) {
            return res.status(404).json({ error: `Station ${code} not found` });
        }
        
        const stationName = nameResult.rows[0].station_name;
        
        // Get station connections from Python service graph
        let connections = [];
        try {
            const pyRes = await axios.get(`${PYTHON_SERVICE_URL}/station/${code}`);
            connections = pyRes.data.connections || [];
        } catch (pyErr) {
            console.error(`Python connection fetch failed for station ${code}:`, pyErr.message);
        }
        
        res.json({
            station_code: code,
            station_name: stationName,
            trains_count: trainsResult.rows.length,
            trains: trainsResult.rows.map(row => ({
                train_no: row.train_no,
                train_name: row.train_name,
                seq: row.seq,
                arrival_time: row.arrival_time,
                departure_time: row.departure_time,
                source_station: row.source_station,
                destination_station: row.destination_station
            })),
            connected_stations: connections.length,
            connections: connections
        });
    } catch (err) {
        console.error("Database error fetching station details:", err.message);
        res.status(500).json({ error: "Database error fetching station details" });
    }
});

// Network statistics endpoint
app.get("/stats", async (req, res) => {
    try {
        const dbStats = await db.query(`
            SELECT 
                COUNT(DISTINCT train_no) as total_trains,
                COUNT(DISTINCT station_code) as total_stations,
                COUNT(*) as total_records
            FROM train_schedule
        `);
        
        let graphStats = {};
        try {
            const pyRes = await axios.get(`${PYTHON_SERVICE_URL}/stats`);
            graphStats = pyRes.data;
        } catch (pyErr) {
            console.error("Failed to query stats from Python service:", pyErr.message);
        }
        
        res.json({
            database: {
                total_trains: parseInt(dbStats.rows[0].total_trains),
                total_stations: parseInt(dbStats.rows[0].total_stations),
                total_records: parseInt(dbStats.rows[0].total_records)
            },
            graph: graphStats
        });
    } catch (err) {
        console.error("Database error fetching statistics:", err.message);
        res.status(500).json({ error: "Database error fetching statistics" });
    }
});

app.listen(PORT, () => {
    console.log(`Express Gateway Server running on port ${PORT}`);
    console.log(`Python Service URL configured: ${PYTHON_SERVICE_URL}`);
});
