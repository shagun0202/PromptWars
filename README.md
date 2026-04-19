# NexusFlow: Next-Gen Venue Architect

> Intelligent crowd shaping, accessibility-aware routing, and real-time coordination for 50,000+ attendee environments — powered by Google Cloud.

**Live Deployment:** [https://web-client-579758118549.us-central1.run.app](https://web-client-579758118549.us-central1.run.app)

---

## Google Cloud Services Integration

NexusFlow is built entirely on the Google Cloud Platform ecosystem. See [CLOUD_SERVICES.md](./CLOUD_SERVICES.md) for the complete service architecture diagram and environment variable mapping.

| Service | Module | Purpose | SDK |
|---|---|---|---|
| **Cloud Run** | All Services | Serverless auto-scaling container hosting | `gcloud CLI` |
| **Cloud Logging** | api-gateway, pathfinding-service | Structured request tracing and error monitoring | `@google-cloud/logging`, `google-cloud-logging` |
| **Cloud Secret Manager** | api-gateway | Runtime secret injection — no `.env` in production | `@google-cloud/secret-manager` |
| **Cloud Build** | CI/CD Pipeline | Automated Docker image builds from Dockerfiles | `gcloud builds submit` |
| **Container Registry** | CI/CD Pipeline | Private Docker image storage (gcr.io) | `gcr.io` |
| **Firebase Admin SDK** | api-gateway | FCM push notifications to end-user devices | `firebase-admin` |
| **Cloud Firestore** | api-gateway | Real-time analytics event logging for all user actions | `firebase-admin/firestore` |
| **Google Maps Embed API** | web-client | Zero-key satellite map rendering of SoFi Stadium | Native `<iframe>` embed |

---

## Architecture

NexusFlow is a polyglot monorepo built on **Clean Architecture** principles with strict dependency inversion (SOLID).

```
NexusFlow/
├── nexusflow-core/                 # Pure domain logic (TypeScript, zero framework dependencies)
│   ├── src/domain/                 # Entities: VirtualQueue
│   ├── src/usecases/               # Use Cases: JoinQueueUseCase (validate → enqueue → notify → log)
│   ├── src/interfaces/             # Port Contracts: RedisAdapter, NotificationService, AnalyticsService
│   ├── tests/                      # Jest unit tests (10 test cases, edge-case coverage)
│   └── jest.config.js              # ts-jest configuration
│
├── api-gateway/                    # Express.js HTTP edge server (Node.js / TypeScript)
│   ├── src/index.ts                # Helmet, rate-limit, Zod validation, global error middleware
│   ├── src/infrastructure/
│   │   ├── FCMService.ts           # Firebase Admin SDK — FCM delivery + Firestore persistence
│   │   ├── AnalyticsService.ts     # Firestore analytics event logging (queue_join, SOS, gate changes)
│   │   └── RedisClient.ts          # In-memory sorted-set Redis adapter (O(n log n) ranking)
│   └── package.json                # @google-cloud/logging, secret-manager, firebase-admin, helmet, zod
│
├── pathfinding-service/            # Python FastAPI microservice
│   ├── app/main.py                 # Google Cloud Logging, Pydantic validators, global exception handler
│   ├── app/domain/venue_graph.py   # A* search with lru_cache heuristic optimization
│   ├── tests/test_pathfinding.py   # 15 pytest integration + unit tests (5 test classes)
│   └── tests/load_test.py          # Concurrent load simulation (200 requests, 50 workers, P95 stats)
│
├── web-client/                     # React 18 / Vite frontend dashboard
│   ├── src/App.tsx                 # Glassmorphic dashboard with offline mesh mode toggle
│   ├── src/components/
│   │   ├── StadiumMap.tsx          # Google Maps Embed API — satellite view of SoFi Stadium
│   │   ├── VirtualQueueCard.tsx    # Interactive queue enrollment with animated state transitions
│   │   ├── ArrivalForecastCard.tsx # AI surge prediction with "Claim Fast-Pass" interaction
│   │   ├── MeshChatModule.tsx      # BLE Mesh Chat — online/offline peer-to-peer messaging
│   │   ├── LiveNotificationFeed.tsx# Real-time digital noticeboard (gate closures, delays)
│   │   ├── EmergencySOSModal.tsx   # Precision SOS dispatch (Medical, Lost Child, Security)
│   │   ├── NetworkSyncPill.tsx     # Live/Dead Zone toggle with network status indicator
│   │   └── AlertBanner.tsx         # Dynamic alert banners (concession paradox, network failure)
│   └── src/index.css               # WCAG 2.1 AA compliant glassmorphic design system
│
├── Dockerfile.api                  # Multi-stage: nexusflow-core build → api-gateway (Node Alpine)
├── Dockerfile.pathfinding          # Python FastAPI container (Uvicorn on port 8080)
├── Dockerfile.web                  # Vite build → Nginx static server (Alpine)
├── deploy_to_cloud_run.ps1         # One-click deployment script for all 3 Cloud Run services
├── CLOUD_SERVICES.md               # Complete Google Cloud service architecture documentation
└── .gitignore                      # Blocks .env, service-account*.json, credential files
```

---

## Challenge Solutions

### 1. The Surge — AI Arrival Forecaster
Predicts security queue capacity via simulated Vertex AI inference. The `ArrivalForecastCard` surfaces "Fast-Pass" windows, actively incentivizing fans to delay entry by 15 minutes to mathematically flatten the arrival surge. The "Claim Fast-Pass" button simulates API verification with loading states and issues a digital VIP Gate ticket on success.

### 2. The Concession Paradox — Virtual Queues & Smart Load-Balancing
O(1) Redis-backed sorted-set queues eliminate physical lines. When a node exceeds its congestion threshold, the UI injects a dynamic "Suggested Alternative" card (e.g., redirecting from Restroom A → Restroom Section 204). The `VirtualQueueCard` component handles the full enrollment flow with animated state transitions.

### 3. Real-Time Coordination — Digital Noticeboard & Precision SOS
Replaces word-of-mouth with instant digital truth. `LiveNotificationFeed` broadcasts critical gate closures, performance delays, and exit reroutes with severity-based color coding. The `EmergencySOSModal` auto-detects the user's precise indoor coordinates and provides three dispatch options: Medical Emergency, Lost Child, and Security Incident.

### 4. Technical Dead Zones — Resilient Mesh Networking
When `navigator.onLine === false`, the UI gracefully degrades: heavy API modules (wait times, predictors, feeds) are suspended. The `MeshChatModule` pivots into BLE Mesh Relay Mode, allowing peer-to-peer fan coordination via simulated Bluetooth Low Energy message bouncing. The `NetworkSyncPill` provides a developer toggle to simulate dead zones instantly.

### 5. Seamless Accessibility — A* Accessible Routing
`accessible_mode: true` applies infinite penalties to staircase edges in the A* algorithm, generating wheelchair-safe routes exclusively via ramps and elevators. The frontend provides a dedicated toggle button overlaying the stadium map. Full WCAG 2.1 AA compliance: high-contrast colors, ARIA labels, focus-visible outlines, and screen-reader-only regions.

---

## Security Hardening

| Layer | Implementation |
|---|---|
| **HTTP Headers** | `helmet` — strips X-Powered-By, applies CSP, prevents clickjacking |
| **Rate Limiting** | `express-rate-limit` — 100 requests / 15 minutes per IP on `/api` routes |
| **Input Validation** | `zod` — strict runtime schema enforcement; `Pydantic` validators in Python |
| **Error Handling** | Global middleware catches `ZodError` (400) vs general errors (500) with Cloud Logging |
| **Secret Management** | `@google-cloud/secret-manager` — no `.env` in production, keys injected at runtime |
| **Credential Safety** | `.gitignore` blocks `.env`, `.env.local`, `service-account*.json`, `firebase-service-account*.json` |

---

## Efficiency Optimizations

| Technique | Location | Impact |
|---|---|---|
| `functools.lru_cache` | `venue_graph.py` `_heuristic()` | Eliminates redundant O(n²) Manhattan distance calculations |
| Sorted-set simulation | `RedisClient.ts` | O(n log n) ranked insertion for queue positioning |
| `heapq` priority queue | `venue_graph.py` `a_star_search()` | O(E log V) search complexity |
| Singleton pattern | `FCMService.ts` Firebase init | Prevents duplicate app initialization |

---

## Testing

```bash
# Node.js unit tests (nexusflow-core) — 10 test cases
cd nexusflow-core && npm test

# Python integration + unit tests — 15 test cases
cd pathfinding-service && pytest tests/ -v

# Load testing (requires running pathfinding service on port 8080)
cd pathfinding-service && python tests/load_test.py
```

**Test coverage includes:** Input validation (null, empty, whitespace), successful enrollment, notification dispatch verification, analytics logging, Redis timeout handling, accessible routing, congestion penalties, and invalid node error boundaries.

---

## Running Locally

```bash
# 1. Build core domain logic
cd nexusflow-core && npm install && npm run build

# 2. Start API Gateway (http://localhost:3000)
cd api-gateway && npm install && npm run dev

# 3. Start Pathfinding Engine (http://localhost:8080)
cd pathfinding-service && pip install -r requirements.txt
uvicorn app.main:app --reload --port 8080

# 4. Start Web Dashboard (http://localhost:5173)
cd web-client && npm install && npm run dev
```

---

## Deploying to Google Cloud Run

All three microservices are containerized via multi-stage Dockerfiles and deployed to Cloud Run via a single PowerShell script:

```powershell
# Set your project ID in deploy_to_cloud_run.ps1 first
.\deploy_to_cloud_run.ps1
```

This triggers `gcloud builds submit` for each Dockerfile, pushes images to Container Registry, and deploys auto-scaling Cloud Run instances in `us-central1`.

See [CLOUD_SERVICES.md](./CLOUD_SERVICES.md) for the complete deployment architecture and environment variable mapping.
