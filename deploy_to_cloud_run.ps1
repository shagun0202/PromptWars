# NexusFlow Master Deployment Script for Google Cloud Run
# Ensure you are logged in via: gcloud auth login
# Ensure your project is set: gcloud config set project tribal-octane-493106-r2

$PROJECT_ID = "tribal-octane-493106-r2" 
$REGION = "us-central1"
$GCR_BASE = "gcr.io/$PROJECT_ID"

Write-Host "================================="
Write-Host "Deploying NexusFlow to Cloud Run"
Write-Host "================================="

# ----------------------------------------------------------------
# Step 1: Deploy the Pathfinding Service (Python)
# ----------------------------------------------------------------
Write-Host "`n[1/3] Containerizing & Deploying Pathfinding Engine..."
Copy-Item Dockerfile.pathfinding Dockerfile -Force
gcloud builds submit --tag "$GCR_BASE/pathfinding-service" .
gcloud run deploy pathfinding-service `
    --image "$GCR_BASE/pathfinding-service" `
    --platform managed `
    --region $REGION `
    --allow-unauthenticated `
    --memory 1024Mi `
    --concurrency 80

# ----------------------------------------------------------------
# Step 2: Deploy the API Gateway (Node.js)
# ----------------------------------------------------------------
Write-Host "`n[2/3] Containerizing & Deploying API Gateway..."
Copy-Item Dockerfile.api Dockerfile -Force
gcloud builds submit --tag "$GCR_BASE/api-gateway" .
gcloud run deploy api-gateway `
    --image "$GCR_BASE/api-gateway" `
    --platform managed `
    --region $REGION `
    --allow-unauthenticated `
    --memory 512Mi

# ----------------------------------------------------------------
# Step 3: Deploy the Web Client (React/Nginx)
# ----------------------------------------------------------------
Write-Host "`n[3/3] Containerizing & Deploying Web Client Dashboard..."
Copy-Item Dockerfile.web Dockerfile -Force
gcloud builds submit --tag "$GCR_BASE/web-client" .
gcloud run deploy web-client `
    --image "$GCR_BASE/web-client" `
    --platform managed `
    --region $REGION `
    --allow-unauthenticated `
    --port 8080

Remove-Item Dockerfile -ErrorAction SilentlyContinue

Write-Host "`n================================="
Write-Host "Deployment Complete! Check your Google Cloud Console."
