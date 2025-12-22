#!/bin/bash
set -euo pipefail

# Deploy Cloud Function trigger
# Usage: ./deploy.sh

# Load environment variables
source ../env.sh

echo "Deploying Cloud Function trigger..."
echo "Function: $FUNCTION_NAME"
echo "Region: $REGION"
echo "Trigger: Pub/Sub topic '$TOPIC'"

# Deploy Cloud Function Gen2
gcloud functions deploy $FUNCTION_NAME \
  --gen2 \
  --runtime=nodejs20 \
  --region=$REGION \
  --source=. \
  --entry-point=videoEncodeTrigger \
  --trigger-topic=$TOPIC \
  --service-account=$TRIGGER_SA_EMAIL \
  --set-env-vars="RAW_BUCKET=$RAW_BUCKET,PROC_BUCKET=$PROC_BUCKET,JOB_NAME=$JOB_NAME,REGION=$REGION" \
  --timeout=540s \
  --memory=256MB \
  --max-instances=10

echo "✅ Cloud Function deployed successfully!"
echo "Function: $FUNCTION_NAME"
echo "Trigger: Pub/Sub topic '$TOPIC'"
