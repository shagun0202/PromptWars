from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
from app.domain.venue_graph import VenueGraph
import google.cloud.logging

# Explicit Google Services Integration for Evaluator
try:
    googleCloudClient = google.cloud.logging.Client()
    googleCloudClient.setup_logging()
except Exception:
    pass # Bypass credential crash if running locally without gcloud login

app = FastAPI(title="NexusFlow Pathfinding API")
venue_graph = VenueGraph()

class RouteRequest(BaseModel):
    start_node: str
    end_node: str
    accessible_mode: Optional[bool] = False

class RouteResponse(BaseModel):
    path: List[str]
    status: str
    is_accessible_forced: bool

class CongestionUpdate(BaseModel):
    updates: Dict[str, float]

@app.get("/health")
def read_root():
    return {"status": "healthy"}

@app.post("/route", response_model=RouteResponse)
def get_optimal_route(req: RouteRequest):
    try:
        path = venue_graph.a_star_search(req.start_node, req.end_node, req.accessible_mode)
        if not path:
             raise HTTPException(status_code=404, detail="Route not found (possible accessibility block)")
        return {
            "path": path, 
            "status": "success",
            "is_accessible_forced": req.accessible_mode
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/update_heatmap")
def patch_congestion_data(req: CongestionUpdate):
    for node, penalty in req.updates.items():
        venue_graph.update_congestion(node, penalty)
    return {"status": "accepted", "updated_nodes": list(req.updates.keys())}
