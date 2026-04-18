# NexusFlow: Next-Gen Venue Architect
*Intelligent crowd shaping and accessibility for 50,000+ attendee environments.*

NexusFlow is an enterprise-grade venue management and fan-coordination system designed under rigorous **Clean Architecture** patterns. It leverages high-speed caching, advanced heuristic A* pathfinding, and Google Cloud infrastructure to intercept and resolve massive crowd bottlenecks in real-time.

---

## 🎯 The Challenge Matrix Solutions

### 1. The Surge (Predictive Arrivals)
*   **Feature:** **AI Arrival Forecaster**
*   **Mechanism:** Simulating Google Vertex AI inference data, NexusFlow dynamically predicts security queue capacities. It surfaces "Fast-Pass" windows, actively incentivizing users to delay their entry by 15 minutes to mathematically flatten the entry surge. 

### 2. The Concession Paradox (Smart Load-Balancing)
*   **Feature:** **Virtual Queues & The Smart Heatmap**
*   **Mechanism:** Rather than allowing physical lines to stagnate concourse flow, fans join heavily-optimized O(1) Redis-backed virtual queues. If a specific node (e.g., *Restroom A*) exceeds a congestion threshold, the UI injects a dynamic "Suggested Alternative" (e.g., *Restroom B*) to passively balance the stadium.

### 3. Real-Time Coordination Gaps
*   **Feature:** **Digital Noticeboard & Precision SOS**
*   **Mechanism:** Replaces word-of-mouth with instant digital truth. A real-time `LiveNotificationFeed` broadcasts critical gate closures globally. Simultaneously, the `EmergencySOSModal` immediately captures a user's exact stadium coordinates and dispatches medical or security alerts directly from the Web App.

### 4. Technical Dead Zones
*   **Feature:** **Resilient Offline Mesh Mode**
*   **Mechanism:** Massive crowds instantly collapse standard cellular infrastructure. When the Web App detects `navigator.onLine === false`, it gracefully sheds heavy API overlays and pivots into a **Bluetooth/WiFi-Direct Mesh Chat Module** allowing fans to securely bounce coordination messages locally to their groups.

### 5. Seamless Accessibility
*   **Feature:** **A* Accessible Graph Routing**
*   **Mechanism:** Fully WCAG 2.1 AA compliant UI (High contrast, ARIA tags). Under the hood, the Python graph engine features a `toggle_accessible_route` mode. When engaged by a wheelchair user, the A* algorithm instantly applies an "infinite penalty" to all staircases, explicitly generating routes via ramps and VIP elevators.

---

## 🏗️ System Architecture & Tech Stack

This project is a polyglot monorepo strictly adhering to dependency inversion and SOLID principles. 

*   **`nexusflow-core` (TypeScript):** Pure Domain Rules and Use Cases. Absolute isolation from frameworks.
*   **`api-gateway` (Node.js/Express):** The high-throughput HTTP edge server injecting Redis memory and Firebase Cloud Messaging dependencies into our domain controllers.
*   **`pathfinding-service` (Python/FastAPI):** A mathematically intensive Microservice dedicating pure compute thread-pools to solving Manhattan-heuristic A* pathfinding on heavy stadium graphs.
*   **`web-client` (React/Vite):** A bespoke, Tailwind-free vanilla CSS glassmorphic frontend utilizing strict `animate-in` UX and interactive UI feedback loops.

---

## 🚀 Deployment Operations

### Running Locally
To launch locally, execute the three distinct service boundaries:
1.  **Frontend:** `cd web-client && npm run dev`
2.  **API Gateway:** `cd api-gateway && npm run dev`
3.  **Pathfinding Module:** `cd pathfinding-service && uvicorn app.main:app --reload --port 8080`

### Google Cloud Run Implementation
The repository is fully Dockerized and tuned for Google Cloud Run integration using multi-stage `alpine` containers.

1. Ensure your terminal is signed in: `gcloud auth login`
2. Open `deploy_to_cloud_run.ps1` and inject your GCP `PROJECT_ID`.
3. Execute the script natively in PowerShell:
```powershell
.\deploy_to_cloud_run.ps1
```
This triggers a `gcloud builds submit` and instantly autoscales your instances with 80 concurrent connections per block across `us-central1`.
