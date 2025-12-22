#!/bin/bash
set -euo pipefail

# Build and push encoder container to Artifact Registry
# Usage: ./build.sh

# Load environment variables
source ../env.sh

echo "Building encoder container..."
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo "Image: $IMAGE"

# Configure Docker to use gcloud as credential helper
gcloud auth configure-docker $REGION-docker.pkg.dev

# Build and push using Cloud Build (recommended)
echo "Submitting build to Cloud Build..."
gcloud builds submit . \
  --tag "$IMAGE" \
  --project "$PROJECT_ID" \
  --timeout=10m

echo "✅ Build completed successfully!"
echo "Image: $IMAGE"
