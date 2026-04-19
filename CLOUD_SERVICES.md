# NexusFlow — Google Cloud Services Architecture

This document provides a comprehensive mapping of every Google Cloud Platform (GCP) and Firebase service integrated into the NexusFlow venue management system.

## Services Overview

| Service | Module | Purpose | SDK / Library |
|---|---|---|---|
| **Google Cloud Run** | All Services | Serverless container hosting for api-gateway, pathfinding-service, and web-client | `gcloud CLI` |
| **Google Cloud Logging** | api-gateway, pathfinding-service | Structured request tracing and error monitoring | `@google-cloud/logging` (Node), `google-cloud-logging` (Python) |
| **Google Cloud Secret Manager** | api-gateway | Secure storage and retrieval of API keys, Redis URLs, and Firebase credentials | `@google-cloud/secret-manager` |
| **Google Cloud Build** | CI/CD Pipeline | Automated Docker image builds triggered via `gcloud builds submit` | `gcloud CLI` |
| **Google Container Registry** | CI/CD Pipeline | Private Docker image storage for all three microservice containers | `gcr.io` |
| **Google Firebase Admin SDK** | api-gateway | Server-side Firebase Cloud Messaging (FCM) push notifications and Firestore analytics | `firebase-admin` |
| **Google Cloud Firestore** | api-gateway | Real-time analytics event logging for queue joins, SOS dispatches, and user actions | `firebase-admin/firestore` |
| **Google Maps Embed API** | web-client | Zero-key satellite map rendering of SoFi Stadium with real-time telemetry overlay | Native `<iframe>` embed |

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Google Cloud Platform                     │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Cloud Run   │  │  Cloud Run   │  │  Cloud Run   │      │
│  │  web-client  │  │ api-gateway  │  │ pathfinding  │      │
│  │  (Nginx)     │  │  (Node.js)   │  │ (Python)     │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                 │               │
│         │    ┌────────────┴────────────┐    │               │
│         │    │                         │    │               │
│         │    ▼                         ▼    │               │
│         │  ┌──────────────┐  ┌─────────────┐│              │
│         │  │   Firestore  │  │   Cloud     ││              │
│         │  │  (Analytics) │  │   Logging   ││              │
│         │  └──────────────┘  └─────────────┘│              │
│         │                                    │              │
│         │         ┌──────────────┐           │              │
│         │         │   Secret     │           │              │
│         │         │   Manager    │           │              │
│         │         └──────────────┘           │              │
│         │                                    │              │
│         │    ┌──────────────┐                │              │
│         └───►│  Maps Embed  │                │              │
│              │    API       │                │              │
│              └──────────────┘                │              │
│                                              │              │
│  ┌──────────────┐   ┌──────────────┐        │              │
│  │ Cloud Build  │──►│   Container  │        │              │
│  │              │   │   Registry   │        │              │
│  └──────────────┘   └──────────────┘        │              │
└─────────────────────────────────────────────────────────────┘
```

## Environment Variables

All secrets are managed via **Google Cloud Secret Manager** and injected at runtime. No `.env` files are committed to version control.

| Variable | Source | Used By |
|---|---|---|
| `GOOGLE_CLOUD_PROJECT_ID` | Secret Manager | api-gateway, pathfinding-service |
| `FIREBASE_SERVICE_ACCOUNT` | Secret Manager | api-gateway (FCM + Firestore) |
| `REDIS_URL` | Secret Manager | api-gateway |
| `PORT` | Cloud Run (auto-injected) | All services |

## SDK Versions

- `@google-cloud/logging`: ^11.0.0
- `@google-cloud/secret-manager`: ^5.0.0
- `firebase-admin`: ^11.8.0
- `google-cloud-logging` (Python): ^3.5.0
