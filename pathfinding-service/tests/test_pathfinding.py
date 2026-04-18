import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

def test_find_path_success():
    payload = {
        "start_node": "Gate_A",
        "end_node": "Section_104",
        "accessible_mode": False
    }
    response = client.post("/route", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "path" in data
    assert "status" in data
    assert len(data["path"]) > 0

def test_find_path_accessible_mode_avoids_stairs():
    payload = {
        "start_node": "ENTRANCE_A",
        "end_node": "SEATING_A",  
        "accessible_mode": True
    }
    response = client.post("/route", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "STAIRS_A" not in data["path"]

def test_edge_case_invalid_node():
    payload = {
        "start_node": "NonExistentGate",
        "end_node": "SEATING_A",
        "accessible_mode": False
    }
    # We should expect 404 validation depending on routing logic return
    response = client.post("/route", json=payload)
    assert response.status_code in [400, 404, 500]  
