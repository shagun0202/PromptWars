"""
NexusFlow Pathfinding API — FastAPI application entry point.

Google Cloud Services integrated:
    - google.cloud.logging: Structured request tracing to Cloud Operations Suite.
    - Cloud Run: Serverless container hosting with auto-scaling.

All route handlers follow single-responsibility principle with
explicit Pydantic models for request/response validation.
"""

import logging
from typing import Dict, List, Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, validator

from app.domain.venue_graph import VenueGraph

# ---------------------------------------------------------------------------
# Google Cloud Logging — structured log integration
# ---------------------------------------------------------------------------
logger = logging.getLogger("nexusflow.pathfinding")

try:
    import google.cloud.logging as google_cloud_logging

    google_cloud_client = google_cloud_logging.Client()
    google_cloud_client.setup_logging()
    logger.info("Google Cloud Logging client initialized successfully.")
except Exception:
    logging.basicConfig(level=logging.INFO)
    logger.warning("Google Cloud Logging unavailable; using local fallback.")

# ---------------------------------------------------------------------------
# Application factory
# ---------------------------------------------------------------------------
app = FastAPI(
    title="NexusFlow Pathfinding API",
    description="A* pathfinding engine with accessibility-aware routing.",
    version="2.0.0",
)

venue_graph = VenueGraph()


# ---------------------------------------------------------------------------
# Request / Response models (strict Pydantic validation)
# ---------------------------------------------------------------------------
class RouteRequest(BaseModel):
    """Request body for pathfinding queries."""

    start_node: str = Field(..., min_length=1, description="Origin node identifier")
    end_node: str = Field(..., min_length=1, description="Destination node identifier")
    accessible_mode: Optional[bool] = Field(
        default=False,
        description="When True, avoids stairs and uses ramps/elevators only.",
    )

    @validator("start_node", "end_node")
    def strip_whitespace(cls, value: str) -> str:
        """Sanitize input by stripping leading/trailing whitespace."""
        return value.strip()


class RouteResponse(BaseModel):
    """Successful pathfinding response."""

    path: List[str]
    estimated_time_seconds: float
    status: str = "success"
    is_accessible_forced: bool


class CongestionUpdate(BaseModel):
    """Heatmap congestion penalty updates."""

    updates: Dict[str, float] = Field(
        ..., description="Mapping of node_id to congestion penalty weight"
    )


class HealthResponse(BaseModel):
    """Health check response."""

    status: str
    service: str
    version: str


# ---------------------------------------------------------------------------
# Global exception handler
# ---------------------------------------------------------------------------
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catches unhandled exceptions and returns a structured JSON error."""
    logger.error("Unhandled exception on %s: %s", request.url.path, str(exc))
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "detail": str(exc)},
    )


# ---------------------------------------------------------------------------
# Route handlers
# ---------------------------------------------------------------------------
@app.get("/health", response_model=HealthResponse)
def health_check() -> dict:
    """Returns service health status for Cloud Run probes."""
    return {
        "status": "healthy",
        "service": "NexusFlow Pathfinding API",
        "version": "2.0.0",
    }


@app.post("/route", response_model=RouteResponse)
def get_optimal_route(req: RouteRequest) -> dict:
    """
    Computes the optimal A* path between two venue nodes.
    When accessible_mode is True, all staircase edges are excluded.
    """
    logger.info(
        "Route request: %s → %s (accessible=%s)",
        req.start_node,
        req.end_node,
        req.accessible_mode,
    )

    path = venue_graph.a_star_search(req.start_node, req.end_node, req.accessible_mode)

    if not path:
        logger.warning(
            "No route found: %s → %s (accessible=%s)",
            req.start_node,
            req.end_node,
            req.accessible_mode,
        )
        raise HTTPException(
            status_code=404,
            detail="Route not found. Possible causes: invalid node or accessibility constraint.",
        )

    estimated_time_seconds = venue_graph.compute_path_cost(path) * 6.0

    return {
        "path": path,
        "estimated_time_seconds": estimated_time_seconds,
        "status": "success",
        "is_accessible_forced": req.accessible_mode or False,
    }


@app.post("/update_heatmap")
def patch_congestion_data(req: CongestionUpdate) -> dict:
    """Applies real-time congestion penalty weights to the venue graph."""
    for node_id, penalty in req.updates.items():
        venue_graph.update_congestion(node_id, penalty)

    logger.info("Heatmap updated for nodes: %s", list(req.updates.keys()))

    return {"status": "accepted", "updated_nodes": list(req.updates.keys())}
