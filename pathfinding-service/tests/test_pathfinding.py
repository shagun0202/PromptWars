"""
Integration and unit tests for the NexusFlow Pathfinding API.

Covers:
    - Health check endpoint
    - Successful route calculation
    - Accessible-mode staircase avoidance
    - Invalid node handling (404)
    - Heatmap congestion updates
    - Empty/whitespace input validation
    - Path cost estimation
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.domain.venue_graph import VenueGraph


client = TestClient(app)


# ---------------------------------------------------------------------------
# Health Check
# ---------------------------------------------------------------------------
class TestHealthCheck:
    """Validates the /health endpoint for Cloud Run probes."""

    def test_returns_healthy_status(self) -> None:
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "NexusFlow Pathfinding API"
        assert data["version"] == "2.0.0"


# ---------------------------------------------------------------------------
# Route Finding — Success Cases
# ---------------------------------------------------------------------------
class TestRouteFinding:
    """Validates the /route endpoint with valid graph nodes."""

    def test_basic_route_success(self) -> None:
        payload = {
            "start_node": "ENTRANCE_A",
            "end_node": "SEATING_A",
            "accessible_mode": False,
        }
        response = client.post("/route", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert "ENTRANCE_A" in data["path"]
        assert "SEATING_A" in data["path"]
        assert data["estimated_time_seconds"] > 0

    def test_accessible_mode_avoids_stairs(self) -> None:
        payload = {
            "start_node": "ENTRANCE_A",
            "end_node": "SEATING_A",
            "accessible_mode": True,
        }
        response = client.post("/route", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "STAIRS_A" not in data["path"]
        assert data["is_accessible_forced"] is True

    def test_route_to_restroom(self) -> None:
        payload = {
            "start_node": "ENTRANCE_A",
            "end_node": "RESTROOM_A",
            "accessible_mode": False,
        }
        response = client.post("/route", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["path"][-1] == "RESTROOM_A"

    def test_default_accessible_mode_is_false(self) -> None:
        payload = {"start_node": "HALL_1", "end_node": "SEATING_A"}
        response = client.post("/route", json=payload)
        assert response.status_code == 200
        assert response.json()["is_accessible_forced"] is False


# ---------------------------------------------------------------------------
# Route Finding — Error Cases
# ---------------------------------------------------------------------------
class TestRouteErrors:
    """Validates error handling for invalid or edge-case inputs."""

    def test_invalid_start_node_returns_404(self) -> None:
        payload = {
            "start_node": "NONEXISTENT",
            "end_node": "SEATING_A",
            "accessible_mode": False,
        }
        response = client.post("/route", json=payload)
        assert response.status_code == 404

    def test_invalid_end_node_returns_404(self) -> None:
        payload = {
            "start_node": "ENTRANCE_A",
            "end_node": "NONEXISTENT",
            "accessible_mode": False,
        }
        response = client.post("/route", json=payload)
        assert response.status_code == 404

    def test_empty_start_node_returns_422(self) -> None:
        payload = {"start_node": "", "end_node": "SEATING_A"}
        response = client.post("/route", json=payload)
        assert response.status_code == 422


# ---------------------------------------------------------------------------
# Heatmap Updates
# ---------------------------------------------------------------------------
class TestHeatmapUpdates:
    """Validates the /update_heatmap congestion endpoint."""

    def test_apply_congestion_penalty(self) -> None:
        payload = {"updates": {"HALL_1": 50.0, "CONCESSION_1": 25.0}}
        response = client.post("/update_heatmap", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "accepted"
        assert "HALL_1" in data["updated_nodes"]
        assert "CONCESSION_1" in data["updated_nodes"]


# ---------------------------------------------------------------------------
# VenueGraph Unit Tests
# ---------------------------------------------------------------------------
class TestVenueGraphUnit:
    """Direct unit tests on the VenueGraph domain model."""

    def test_heuristic_returns_manhattan_distance(self) -> None:
        graph = VenueGraph()
        distance = graph._heuristic("ENTRANCE_A", "SEATING_A")
        assert distance == abs(0 - 5) + abs(0 - 10)

    def test_heuristic_unknown_node_returns_zero(self) -> None:
        graph = VenueGraph()
        assert graph._heuristic("UNKNOWN", "ENTRANCE_A") == 0.0

    def test_compute_path_cost(self) -> None:
        graph = VenueGraph()
        path = graph.a_star_search("ENTRANCE_A", "HALL_1")
        cost = graph.compute_path_cost(path)
        assert cost == 5.0

    def test_congestion_affects_routing(self) -> None:
        graph = VenueGraph()
        path_before = graph.a_star_search("ENTRANCE_A", "SEATING_A")
        graph.update_congestion("STAIRS_A", 1000.0)
        path_after = graph.a_star_search("ENTRANCE_A", "SEATING_A")
        # Heavy penalty on STAIRS_A should alter the chosen path
        assert path_before != path_after or "STAIRS_A" not in path_after
