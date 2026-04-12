import heapq
from typing import List, Dict, Tuple, Optional

class VenueGraph:
    def __init__(self):
        # node_id: list of (cost, neighbor_id, requires_stairs)
        # Added requires_stairs boolean to model Challenge 5: Seamless Accessibility
        self.edges: Dict[str, List[Tuple[float, str, bool]]] = {
            "ENTRANCE_A": [(5, "HALL_1", False), (10, "STAIRS_A", True), (15, "ELEVATOR_1", False)],
            "HALL_1": [(5, "ENTRANCE_A", False), (8, "CONCESSION_1", False), (15, "SEATING_A", False)],
            "STAIRS_A": [(10, "ENTRANCE_A", True), (5, "SEATING_A", True)],
            "ELEVATOR_1": [(15, "ENTRANCE_A", False), (8, "SEATING_A", False)],
            "CONCESSION_1": [(8, "HALL_1", False), (2, "RESTROOM_A", False)],
            "RESTROOM_A": [(2, "CONCESSION_1", False)],
            "SEATING_A": [(15, "HALL_1", False), (5, "STAIRS_A", True), (8, "ELEVATOR_1", False)]
        }
        
        self.node_positions: Dict[str, Tuple[float, float]] = {
            "ENTRANCE_A": (0, 0),
            "ELEVATOR_1": (-5, 5),
            "HALL_1": (5, 0),
            "STAIRS_A": (0, 10),
            "CONCESSION_1": (10, 0),
            "RESTROOM_A": (12, 0),
            "SEATING_A": (5, 10)
        }
        
        # Dynamic weights driven by Real-time crowding from heatmaps
        self.dynamic_penalties: Dict[str, float] = {}

    def update_congestion(self, node_id: str, penalty_weight: float):
        self.dynamic_penalties[node_id] = penalty_weight

    def _heuristic(self, node_a: str, node_b: str) -> float:
        if node_a not in self.node_positions or node_b not in self.node_positions:
            return 0
        x1, y1 = self.node_positions[node_a]
        x2, y2 = self.node_positions[node_b]
        return abs(x1 - x2) + abs(y1 - y2)

    def a_star_search(self, start: str, goal: str, accessible_mode: bool = False) -> List[str]:
        if start not in self.edges or goal not in self.edges:
            return []

        pq = [(0, start)]
        came_from = {start: None}
        cost_so_far = {start: 0}

        while pq:
            current_priority, current = heapq.heappop(pq)

            if current == goal:
                break

            for cost, next_node, requires_stairs in self.edges.get(current, []):
                # The Challenge 5: Seamless Accessibility Logic
                if accessible_mode and requires_stairs:
                    continue # Skip this edge entirely if mobility impaired

                crowd_penalty = self.dynamic_penalties.get(next_node, 0.0)
                new_cost = cost_so_far[current] + cost + crowd_penalty
                
                if next_node not in cost_so_far or new_cost < cost_so_far[next_node]:
                    cost_so_far[next_node] = new_cost
                    priority = new_cost + self._heuristic(goal, next_node)
                    heapq.heappush(pq, (priority, next_node))
                    came_from[next_node] = current

        return self._reconstruct_path(came_from, start, goal)

    def _reconstruct_path(self, came_from: Dict, start: str, goal: str) -> List[str]:
        current = goal
        path = []
        if goal not in came_from:
            return []
            
        while current != start:
            path.append(current)
            current = came_from[current]
        path.append(start)
        path.reverse()
        return path
