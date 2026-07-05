from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
import sys

# Add parent directory to path to import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from preprocessing.data_loader import DataLoader
from graph.graph_builder import GraphBuilder
from graph.route_search import RouteSearcher

app = FastAPI(title="Marg-Manthan Route Service", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for graph and searcher
graph_builder = None
route_searcher = None
data_loader = None

# Data paths
DATA_PATH = "../data/Train_details_clean.csv"
GRAPH_PATH = "../data/graph.pkl"
STATION_INDEX_PATH = "../data/station_index.json"
TRAIN_INDEX_PATH = "../data/train_index.json"
STATION_NAMES_PATH = "../data/station_names.json"
TRAIN_TIMETABLE_PATH = "../data/train_timetable.json"


class RouteRequest(BaseModel):
    source: str
    destination: str
    mode: str = "time"  # Options: time, distance, changes, direct
    date: Optional[str] = None
    deadline: Optional[str] = None
    class_type: Optional[str] = "SL"
    budget: Optional[int] = None
    rapidapi_key: Optional[str] = None
    rapidapi_host: Optional[str] = None


class StationInfo(BaseModel):
    code: str
    name: str


class TrainSegment(BaseModel):
    train_no: int
    train_name: str
    from_station: str
    to_station: str
    departure_time: str
    arrival_time: str
    distance: int
    travel_time: int
    departure_date: Optional[str] = None
    arrival_date: Optional[str] = None
    fare: Optional[int] = None
    availability_status: Optional[str] = None
    confirm_probability: Optional[str] = None
    from_station_name: Optional[str] = None
    to_station_name: Optional[str] = None


class Route(BaseModel):
    type: str
    trains: List[TrainSegment]
    total_distance: int
    total_time: int
    changes: int
    waiting_time: int
    total_fare: Optional[int] = None


@app.on_event("startup")
async def startup_event():
    """Initialize the graph and data structures on startup."""
    global graph_builder, route_searcher, data_loader
    
    print("Starting Marg-Manthan Route Service...")
    
    # Check if preprocessed data exists
    if os.path.exists(GRAPH_PATH) and os.path.exists(STATION_INDEX_PATH) and os.path.exists(STATION_NAMES_PATH) and os.path.exists(TRAIN_TIMETABLE_PATH):
        print("Loading preprocessed graph...")
        graph_builder = GraphBuilder(None)
        graph_builder.load_graph(GRAPH_PATH, STATION_INDEX_PATH, TRAIN_INDEX_PATH, STATION_NAMES_PATH, TRAIN_TIMETABLE_PATH)
    else:
        print("Preprocessing data and building graph...")
        data_loader = DataLoader(DATA_PATH)
        df = data_loader.preprocess()
        
        graph_builder = GraphBuilder(df)
        graph_builder.build_graph()
        graph_builder.save_graph(GRAPH_PATH, STATION_INDEX_PATH, TRAIN_INDEX_PATH, STATION_NAMES_PATH, TRAIN_TIMETABLE_PATH)
    
    # Initialize route searcher
    route_searcher = RouteSearcher(
        graph_builder.graph,
        graph_builder.station_index,
        graph_builder.reverse_station_index,
        graph_builder.train_index,
        graph_builder.train_timetable
    )
    
    print("Service initialized successfully!")


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Marg-Manthan Route Service",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "graph_loaded": graph_builder is not None,
        "stations_indexed": len(graph_builder.station_index) if graph_builder else 0,
        "trains_indexed": len(graph_builder.train_index) if graph_builder else 0
    }


@app.post("/search", response_model=List[Route])
async def search_routes(request: RouteRequest):
    """Search for routes between two stations."""
    if route_searcher is None:
        raise HTTPException(status_code=503, detail="Service not initialized")
    
    # Validate station codes
    if request.source not in graph_builder.station_index:
        raise HTTPException(status_code=404, detail=f"Source station '{request.source}' not found")
    
    if request.destination not in graph_builder.station_index:
        raise HTTPException(status_code=404, detail=f"Destination station '{request.destination}' not found")
    
    # Validate mode
    valid_modes = ["time", "distance", "changes", "direct"]
    if request.mode not in valid_modes:
        raise HTTPException(status_code=400, detail=f"Invalid mode. Must be one of: {valid_modes}")
    
    try:
        routes = route_searcher.search(
            request.source,
            request.destination,
            request.mode,
            request.date,
            request.deadline,
            request.class_type,
            request.budget,
            request.rapidapi_key,
            request.rapidapi_host
        )
        return routes
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching routes: {str(e)}")


@app.get("/stations")
async def search_stations(q: str = Query(..., min_length=2, description="Station name or code to search")):
    """Search for stations by name or code."""
    if graph_builder is None:
        raise HTTPException(status_code=503, detail="Service not initialized")
    
    q = q.upper()
    matches = []
    
    for code, name in graph_builder.station_names.items():
        if q in code or q in name:
            matches.append({"code": code, "name": name})
    
    return matches[:20]  # Limit to 20 results


@app.get("/station/{station_code}")
async def get_station_details(station_code: str):
    """Get details for a specific station."""
    if graph_builder is None:
        raise HTTPException(status_code=503, detail="Service not initialized")
    
    station_code = station_code.upper()
    
    if station_code not in graph_builder.station_index:
        raise HTTPException(status_code=404, detail=f"Station '{station_code}' not found")
    
    station_id = graph_builder.station_index[station_code]
    connections = graph_builder.get_station_connections(station_code)
    
    # Get trains passing through this station
    trains_through_station = []
    for train_no, stations in graph_builder.train_index.items():
        if station_code in stations:
            trains_through_station.append(train_no)
    
    return {
        "station_code": station_code,
        "station_id": station_id,
        "connections": connections,
        "trains_count": len(trains_through_station),
        "connected_stations": len(connections)
    }


@app.get("/train/{train_no}")
async def get_train_details(train_no: int):
    """Get complete route for a specific train."""
    if graph_builder is None:
        raise HTTPException(status_code=503, detail="Service not initialized")
    
    if train_no not in graph_builder.train_index:
        raise HTTPException(status_code=404, detail=f"Train '{train_no}' not found")
    
    stations = graph_builder.train_index[train_no]
    
    # Get detailed route information
    route_segments = []
    for i in range(len(stations) - 1):
        from_id = graph_builder.station_index[stations[i]]
        to_id = graph_builder.station_index[stations[i + 1]]
        
        if graph_builder.graph.has_edge(from_id, to_id):
            edge_data = graph_builder.graph[from_id][to_id]
            route_segments.append(edge_data)
    
    return {
        "train_no": train_no,
        "stations": stations,
        "route_segments": route_segments,
        "total_stations": len(stations)
    }


@app.get("/stats")
async def get_statistics():
    """Get statistics about the railway network."""
    if graph_builder is None:
        raise HTTPException(status_code=503, detail="Service not initialized")
    
    return {
        "total_stations": len(graph_builder.station_index),
        "total_trains": len(graph_builder.train_index),
        "total_connections": graph_builder.graph.number_of_edges(),
        "graph_nodes": graph_builder.graph.number_of_nodes()
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
