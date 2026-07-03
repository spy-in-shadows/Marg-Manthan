import networkx as nx
from typing import List, Dict, Optional, Tuple
from datetime import datetime, timedelta
import heapq


class RouteSearcher:
    """Implements various route search algorithms on the railway graph."""
    
    def __init__(self, graph: nx.DiGraph, station_index: Dict[str, int], reverse_station_index: Dict[int, str], train_index: Dict[str, List[str]], train_timetable: Dict[str, List[Dict]]):
        self.graph = graph
        self.station_index = station_index
        self.reverse_station_index = reverse_station_index
        self.train_index = train_index
        self.train_timetable = train_timetable
        
        # Build index mapping station_code -> list of (train_no, stop_index)
        self.station_trains = {}
        for t_no, stops in self.train_timetable.items():
            for idx, stop in enumerate(stops):
                st_code = stop['station_code']
                if st_code not in self.station_trains:
                    self.station_trains[st_code] = []
                self.station_trains[st_code].append((t_no, idx))
    
    def _parse_time(self, time_str: str) -> datetime:
        """Parse time string (HH:MM or HH:MM:SS) to datetime object."""
        if time_str is None or time_str == '':
            return None
        
        try:
            time_str = str(time_str).strip()
            parts = time_str.split(':')
            if len(parts) >= 2:
                hours, minutes = int(parts[0]), int(parts[1])
                return datetime(2024, 1, 1, hours, minutes)
        except:
            return None
        
        return None
    
    def _calculate_waiting_time(self, arrival_time: str, departure_time: str) -> int:
        """Calculate waiting time in minutes between arrival and departure."""
        arrival = self._parse_time(arrival_time)
        departure = self._parse_time(departure_time)
        
        if arrival is None or departure is None:
            return 0
        
        # Handle overnight connections
        if departure < arrival:
            departure += timedelta(days=1)
        
        delta = departure - arrival
        return int(delta.total_seconds() / 60)
        
    def _calculate_time_diff(self, start_time_str: str, end_time_str: str, distance: int = 0) -> int:
        """Calculate time difference in minutes from start to end (assumed within 24h if end < start)."""
        start = self._parse_time(start_time_str)
        end = self._parse_time(end_time_str)
        if start is None or end is None:
            return 0
        
        if end < start:
            end += timedelta(days=1)
            
        t = int((end - start).total_seconds() / 60)
        
        # Apply speed-distance heuristic to adjust for multi-day runs
        if distance > 0:
            while t == 0 or (distance / (t / 60.0)) > 100.0:
                t += 1440  # Add 24 hours
                
        return t
    
    def find_direct_trains(self, source: str, destination: str, journey_date: datetime.date, deadline: Optional[datetime] = None) -> List[Dict]:
        """Find direct trains between two stations using the timetable index."""
        if source not in self.station_index or destination not in self.station_index:
            return []
            
        direct_routes = []
        
        # Check trains that pass through source
        for t_no, idx_src in self.station_trains.get(source, []):
            stops = self.train_timetable[t_no]
            # Check if destination is also on this train route after source
            for j in range(idx_src + 1, len(stops)):
                if stops[j]['station_code'] == destination:
                    stop_src = stops[idx_src]
                    stop_dest = stops[j]
                    
                    distance = stop_dest['distance'] - stop_src['distance']
                    travel_time = self._calculate_time_diff(stop_src['departure_time'], stop_dest['arrival_time'], distance)
                    
                    # Parse departure time to build absolute departure datetime
                    dep_parts = stop_src['departure_time'].split(':')
                    dep_hours = int(dep_parts[0])
                    dep_minutes = int(dep_parts[1])
                    
                    dep_datetime = datetime(journey_date.year, journey_date.month, journey_date.day, dep_hours, dep_minutes)
                    arr_datetime = dep_datetime + timedelta(minutes=travel_time)
                    
                    # Check deadline constraint
                    if deadline and arr_datetime > deadline:
                        break  # Arrives too late, skip this route
                    
                    direct_routes.append({
                        'type': 'direct',
                        'trains': [{
                            'train_no': int(t_no),
                            'train_name': stop_src['train_name'],
                            'from_station': source,
                            'to_station': destination,
                            'departure_time': stop_src['departure_time'],
                            'arrival_time': stop_dest['arrival_time'],
                            'distance': int(distance),
                            'travel_time': int(travel_time),
                            'departure_date': dep_datetime.strftime("%Y-%m-%d"),
                            'arrival_date': arr_datetime.strftime("%Y-%m-%d")
                        }],
                        'total_distance': int(distance),
                        'total_time': int(travel_time),
                        'changes': 0,
                        'waiting_time': 0
                    })
                    break  # Found destination, proceed to next train
                    
        return direct_routes
    
    def find_routes_connecting(self, source: str, destination: str, mode: str, journey_date: datetime.date, deadline: Optional[datetime] = None, max_routes: int = 5) -> List[Dict]:
        """Find connecting routes using Dijkstra's search over train legs with absolute datetimes."""
        if source not in self.station_index or destination not in self.station_index:
            return []
            
        # Start datetime is midnight of the journey date
        start_datetime = datetime(journey_date.year, journey_date.month, journey_date.day, 0, 0)
        
        # Priority queue stores: (cost, counter, current_station, last_train, current_datetime, path)
        counter = 0
        pq = [(0, counter, source, None, start_datetime, [])]
        
        routes = []
        pop_count = {}
        
        while pq and len(routes) < max_routes:
            cost, _, u, last_train, current_datetime, path = heapq.heappop(pq)
            
            if u == destination:
                # Skip direct routes in connecting search
                if len(path) <= 1:
                    continue
                    
                total_distance = sum(leg['distance'] for leg in path)
                waiting_time = 0
                for i in range(1, len(path)):
                    # Parse leg dates to calculate correct layover wait times
                    dep = datetime.strptime(path[i]['departure_date'] + " " + path[i]['departure_time'], "%Y-%m-%d %H:%M:%S")
                    arr = datetime.strptime(path[i-1]['arrival_date'] + " " + path[i-1]['arrival_time'], "%Y-%m-%d %H:%M:%S")
                    waiting_time += int((dep - arr).total_seconds() / 60)
                
                # total_time is sum of travel times + waiting times
                total_time = sum(leg['travel_time'] for leg in path) + waiting_time
                
                # Check for duplicate route (same train sequence)
                is_duplicate = False
                for r in routes:
                    if [leg['train_no'] for leg in r['trains']] == [leg['train_no'] for leg in path]:
                        is_duplicate = True
                        break
                
                if not is_duplicate:
                    routes.append({
                        'type': 'connecting',
                        'trains': path,
                        'total_distance': total_distance,
                        'total_time': total_time,
                        'changes': len(path) - 1,
                        'waiting_time': waiting_time
                    })
                continue
                
            # Limit search depth / pops to keep speed high
            pop_count[u] = pop_count.get(u, 0) + 1
            if pop_count[u] > 15:
                continue
                
            # Limit changes to 2 (at most 3 trains total)
            if len(path) >= 3:
                continue
                
            # Avoid station loops in the current path
            visited_stations = {leg['from_station'] for leg in path}
            visited_stations.add(source)
            
            # Explore trains passing through station u
            for t_no, idx_u in self.station_trains.get(u, []):
                if last_train is not None and last_train == t_no:
                    continue
                    
                stops = self.train_timetable[t_no]
                stop_u = stops[idx_u]
                
                # Compute absolute departure datetime at station u
                dep_parts = stop_u['departure_time'].split(':')
                dep_hours = int(dep_parts[0])
                dep_minutes = int(dep_parts[1])
                
                # If last_train is None: first train departure is on the journey_date
                if last_train is None:
                    dep_datetime = datetime(journey_date.year, journey_date.month, journey_date.day, dep_hours, dep_minutes)
                    waiting_time = 0
                    penalty = 0
                else:
                    # Connection logic: find next departure after current_datetime
                    dep_datetime = datetime(current_datetime.year, current_datetime.month, current_datetime.day, dep_hours, dep_minutes)
                    # Connection must have at least a 15-minute wait buffer. If not, it's the next day's run.
                    if dep_datetime < current_datetime + timedelta(minutes=15):
                        dep_datetime += timedelta(days=1)
                    
                    waiting_time = int((dep_datetime - current_datetime).total_seconds() / 60)
                    if waiting_time > 1080:  # Max 18 hours layout wait
                        continue
                    penalty = 45  # 45 minutes transfer penalty for routing cost calculation
                
                # Explore all subsequent stops on train t_no
                for j in range(idx_u + 1, len(stops)):
                    stop_v = stops[j]
                    v = stop_v['station_code']
                    
                    if v in visited_stations:
                        continue
                        
                    distance = stop_v['distance'] - stop_u['distance']
                    if distance < 0:
                        continue
                        
                    travel_time = self._calculate_time_diff(stop_u['departure_time'], stop_v['arrival_time'], distance)
                    arrival_datetime = dep_datetime + timedelta(minutes=travel_time)
                    
                    # Deadline constraint check
                    if deadline and arrival_datetime > deadline:
                        continue
                        
                    new_leg = {
                        'train_no': int(t_no),
                        'train_name': stop_u['train_name'],
                        'from_station': u,
                        'to_station': v,
                        'departure_time': stop_u['departure_time'],
                        'arrival_time': stop_v['arrival_time'],
                        'distance': int(distance),
                        'travel_time': int(travel_time),
                        'departure_date': dep_datetime.strftime("%Y-%m-%d"),
                        'arrival_date': arrival_datetime.strftime("%Y-%m-%d")
                    }
                    
                    # Compute new priority cost based on mode
                    if mode == 'time':
                        new_cost = cost + travel_time + waiting_time + penalty
                    elif mode == 'distance':
                        new_cost = cost + distance
                    elif mode == 'changes':
                        new_cost = cost + 1
                    else:
                        new_cost = cost + travel_time + waiting_time + penalty
                        
                    counter += 1
                    heapq.heappush(pq, (new_cost, counter, v, t_no, arrival_datetime, path + [new_leg]))
                    
        return routes
    
    def search(self, source: str, destination: str, mode: str = 'time', date: str = None, deadline: str = None) -> List[Dict]:
        """Main search method that routes to appropriate algorithm, validates constraints, and sorts output."""
        # Default date to today if none is provided
        if not date:
            journey_date = datetime.now().date()
        else:
            try:
                journey_date = datetime.strptime(date, "%Y-%m-%d").date()
            except:
                journey_date = datetime.now().date()
                
        # Parse deadline if provided
        parsed_deadline = None
        if deadline:
            try:
                if 'T' in deadline:
                    parsed_deadline = datetime.strptime(deadline.split('.')[0], "%Y-%m-%dT%H:%M:%S") if len(deadline.split('T')[1]) > 5 else datetime.strptime(deadline, "%Y-%m-%dT%H:%M")
                else:
                    parsed_deadline = datetime.strptime(deadline, "%Y-%m-%d %H:%M:%S")
            except Exception as e:
                print("Failed to parse deadline:", deadline, e)
                parsed_deadline = None
                
        # Find direct trains
        direct_routes = self.find_direct_trains(source, destination, journey_date, parsed_deadline)
        
        if mode == 'direct':
            return direct_routes
            
        # Find connecting routes
        connecting_routes = self.find_routes_connecting(source, destination, mode, journey_date, parsed_deadline, max_routes=5)
        
        all_routes = direct_routes + connecting_routes
        
        # Sort routes based on preference
        if mode == 'distance':
            all_routes.sort(key=lambda r: r['total_distance'])
        elif mode == 'changes':
            all_routes.sort(key=lambda r: (r['changes'], r['total_time']))
        else: # default/time
            all_routes.sort(key=lambda r: r['total_time'])
            
        return all_routes
