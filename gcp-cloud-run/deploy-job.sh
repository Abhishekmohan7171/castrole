#!/bin/bash
set -euo pipefail

# Deploy Cloud Run Job
# Usage: ./deploy-job.sh

# Load environment variables
source ./env.sh

echo "Creating Cloud Run Job..."
echo "Job: $JOB_NAME"
echo "Region: $REGION"
echo "Image: $IMAGE"

# Create Cloud Run Job
gcloud run jobs create $JOB_NAME \
  --image=$IMAGE \
  --region=$REGION \
  --service-account=$JOB_SA_EMAIL \
  --set-env-vars="RAW_BUCKET=$RAW_BUCKET,PROC_BUCKET=$PROC_BUCKET,GCP_PROJECT=$PROJECT_ID" \
  --max-retries=1 \
  --task-timeout=15m \
  --memory=4Gi \
  --cpu=2

echo "✅ Cloud Run Job created successfully!"
echo "Job: $JOB_NAME"
echo ""
echo "To test manually:"
echo "gcloud run jobs execute $JOB_NAME --region=$REGION --wait \\"
echo "  --update-env-vars=RAW_OBJECT=raw/testUser/testVideo/test.mp4"
