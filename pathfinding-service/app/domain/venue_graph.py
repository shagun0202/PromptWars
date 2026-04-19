"""
Venue Graph — A* pathfinding engine with accessibility-aware routing.

Implements a weighted, directed graph representing a stadium's
physical layout. The A* algorithm uses a Manhattan-distance heuristic
with optional staircase exclusion for wheelchair-accessible routing.

Efficiency optimizations:
    - functools.lru_cache on heuristic calculations (eliminates O(n²) redundancy)
    - heapq-based priority queue for O(E log V) search complexity
"""

import heapq
from functools import lru_cache
from typing import Dict, List, Optional, Tuple


class VenueGraph:
    """Weighted graph model of a physical venue's walkable pathways."""

    def __init__(self) -> None:
        # Edge format: (cost, neighbor_id, requires_stairs)
        self.edges: Dict[str, List[Tuple[float, str, bool]]] = {
            "ENTRANCE_A": [
                (5, "HALL_1", False),
                (10, "STAIRS_A", True),
                (15, "ELEVATOR_1", False),
            ],
            "HALL_1": [
                (5, "ENTRANCE_A", False),
                (8, "CONCESSION_1", False),
                (15, "SEATING_A", False),
            ],
            "STAIRS_A": [
                (10, "ENTRANCE_A", True),
                (5, "SEATING_A", True),
            ],
            "ELEVATOR_1": [
                (15, "ENTRANCE_A", False),
                (8, "SEATING_A", False),
            ],
            "CONCESSION_1": [
                (8, "HALL_1", False),
                (2, "RESTROOM_A", False),
            ],
            "RESTROOM_A": [
                (2, "CONCESSION_1", False),
            ],
            "SEATING_A": [
                (15, "HALL_1", False),
                (5, "STAIRS_A", True),
                (8, "ELEVATOR_1", False),
            ],
        }

        self.node_positions: Dict[str, Tuple[float, float]] = {
            "ENTRANCE_A": (0.0, 0.0),
            "ELEVATOR_1": (-5.0, 5.0),
            "HALL_1": (5.0, 0.0),
            "STAIRS_A": (0.0, 10.0),
            "CONCESSION_1": (10.0, 0.0),
            "RESTROOM_A": (12.0, 0.0),
            "SEATING_A": (5.0, 10.0),
        }

        self.dynamic_penalties: Dict[str, float] = {}

    def update_congestion(self, node_id: str, penalty_weight: float) -> None:
        """Applies a real-time congestion penalty to a specific node."""
        self.dynamic_penalties[node_id] = penalty_weight

    @lru_cache(maxsize=1024)
    def _heuristic(self, node_a: str, node_b: str) -> float:
        """
        Manhattan-distance heuristic for A* search.
        Results are memoized via lru_cache to avoid redundant computation.
        """
        pos_a: Optional[Tuple[float, float]] = self.node_positions.get(node_a)
        pos_b: Optional[Tuple[float, float]] = self.node_positions.get(node_b)

        if pos_a is None or pos_b is None:
            return 0.0

        return abs(pos_a[0] - pos_b[0]) + abs(pos_a[1] - pos_b[1])

    def a_star_search(
        self, start: str, goal: str, accessible_mode: bool = False
    ) -> List[str]:
        """
        Computes the shortest path from `start` to `goal` using A* search.
        When `accessible_mode` is True, all edges requiring stairs are excluded.
        """
        if start not in self.edges or goal not in self.edges:
            return []

        priority_queue: List[Tuple[float, str]] = [(0.0, start)]
        came_from: Dict[str, Optional[str]] = {start: None}
        cost_so_far: Dict[str, float] = {start: 0.0}

        while priority_queue:
            _current_cost, current_node = heapq.heappop(priority_queue)

            if current_node == goal:
                break

            for edge_cost, neighbor, requires_stairs in self.edges.get(current_node, []):
                if accessible_mode and requires_stairs:
                    continue

                penalty: float = self.dynamic_penalties.get(neighbor, 0.0)
                new_cost: float = cost_so_far[current_node] + edge_cost + penalty

                if neighbor not in cost_so_far or new_cost < cost_so_far[neighbor]:
                    cost_so_far[neighbor] = new_cost
                    priority: float = new_cost + self._heuristic(goal, neighbor)
                    heapq.heappush(priority_queue, (priority, neighbor))
                    came_from[neighbor] = current_node

        return self._reconstruct_path(came_from, start, goal)

    def compute_path_cost(self, path: List[str]) -> float:
        """Calculates the total edge cost along a given path."""
        total_cost: float = 0.0
        for i in range(len(path) - 1):
            current_node = path[i]
            next_node = path[i + 1]
            for edge_cost, neighbor, _stairs in self.edges.get(current_node, []):
                if neighbor == next_node:
                    total_cost += edge_cost + self.dynamic_penalties.get(neighbor, 0.0)
                    break
        return total_cost

    def _reconstruct_path(
        self,
        came_from: Dict[str, Optional[str]],
        start: str,
        goal: str,
    ) -> List[str]:
        """Traces back through the came_from map to build the final path."""
        if goal not in came_from:
            return []

        path: List[str] = []
        current: Optional[str] = goal

        while current is not None and current != start:
            path.append(current)
            current = came_from.get(current)

        if current is None:
            return []

        path.append(start)
        path.reverse()
        return path
