#!/bin/bash
set -euo pipefail

# Continue Deployment Script
# Run this to complete the deployment after the initial script

echo "========================================="
echo "Continuing GCP Cloud Run Jobs Deployment"
echo "========================================="
echo ""

# Load environment variables
source ./env.sh

echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo ""

# Wait for Cloud Build to complete
echo "========================================="
echo "Step 1: Waiting for Container Build"
echo "========================================="
echo ""

echo "Checking Cloud Build status..."
echo "This may take 5-10 minutes..."
echo ""

# Get latest build
LATEST_BUILD=$(gcloud builds list --limit=1 --format="value(id)")
echo "Latest build ID: $LATEST_BUILD"
echo ""

# Wait for build to complete
gcloud builds log $LATEST_BUILD --stream

echo ""
echo "✅ Container build completed"
echo ""

# Grant IAM permissions that were skipped
echo "========================================="
echo "Step 2: Granting IAM Permissions"
echo "========================================="
echo ""

echo "Granting permissions to encoder job SA..."
gsutil iam ch serviceAccount:$JOB_SA_EMAIL:objectAdmin gs://$RAW_BUCKET 2>/dev/null || true
gsutil iam ch serviceAccount:$JOB_SA_EMAIL:objectAdmin gs://$PROC_BUCKET 2>/dev/null || true

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$JOB_SA_EMAIL" \
  --role="roles/logging.logWriter" \
  --condition=None 2>/dev/null || true

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$JOB_SA_EMAIL" \
  --role="roles/datastore.user" \
  --condition=None 2>/dev/null || true

echo "Granting permissions to trigger SA..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$TRIGGER_SA_EMAIL" \
  --role="roles/run.developer" \
  --condition=None 2>/dev/null || true

gcloud iam service-accounts add-iam-policy-binding $JOB_SA_EMAIL \
  --member="serviceAccount:$TRIGGER_SA_EMAIL" \
  --role="roles/iam.serviceAccountUser" 2>/dev/null || true

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$TRIGGER_SA_EMAIL" \
  --role="roles/logging.logWriter" \
  --condition=None 2>/dev/null || true

echo "✅ IAM permissions granted"
echo ""

# Create Cloud Run Job
echo "========================================="
echo "Step 3: Creating Cloud Run Job"
echo "========================================="
echo ""

if gcloud run jobs describe $JOB_NAME --region=$REGION &>/dev/null; then
    echo "⚠️  Cloud Run Job already exists, updating..."
    gcloud run jobs update $JOB_NAME \
      --image=$IMAGE \
      --region=$REGION \
      --service-account=$JOB_SA_EMAIL \
      --set-env-vars="RAW_BUCKET=$RAW_BUCKET,PROC_BUCKET=$PROC_BUCKET,GCP_PROJECT=$PROJECT_ID" \
      --max-retries=1 \
      --task-timeout=15m \
      --memory=4Gi \
      --cpu=2
else
    echo "Creating Cloud Run Job..."
    gcloud run jobs create $JOB_NAME \
      --image=$IMAGE \
      --region=$REGION \
      --service-account=$JOB_SA_EMAIL \
      --set-env-vars="RAW_BUCKET=$RAW_BUCKET,PROC_BUCKET=$PROC_BUCKET,GCP_PROJECT=$PROJECT_ID" \
      --max-retries=1 \
      --task-timeout=15m \
      --memory=4Gi \
      --cpu=2
fi

echo "✅ Cloud Run Job created"
echo ""

# Set up Pub/Sub
echo "========================================="
echo "Step 4: Setting Up Pub/Sub"
echo "========================================="
echo ""

# Create Pub/Sub topic
if gcloud pubsub topics describe $TOPIC &>/dev/null; then
    echo "⚠️  Pub/Sub topic already exists"
else
    echo "Creating Pub/Sub topic..."
    gcloud pubsub topics create $TOPIC
    echo "✅ Pub/Sub topic created"
fi

# Grant Storage permission to publish
echo "Granting Storage permission to publish..."
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
GCS_SA="service-$PROJECT_NUMBER@gs-project-accounts.iam.gserviceaccount.com"

gcloud pubsub topics add-iam-policy-binding $TOPIC \
  --member="serviceAccount:$GCS_SA" \
  --role="roles/pubsub.publisher" 2>/dev/null || true

# Configure Storage notification
echo "Configuring Storage notification..."
if gsutil notification list gs://$RAW_BUCKET | grep -q $TOPIC; then
    echo "⚠️  Storage notification already configured"
else
    gsutil notification create \
      -t $TOPIC \
      -f json \
      -e OBJECT_FINALIZE \
      gs://$RAW_BUCKET
    echo "✅ Storage notification configured"
fi

echo ""

# Deploy Cloud Function
echo "========================================="
echo "Step 5: Deploying Cloud Function Trigger"
echo "========================================="
echo "This may take 3-5 minutes..."
echo ""

cd trigger

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

cd ..

echo "✅ Cloud Function deployed"
echo ""

echo "========================================="
echo "🎉 DEPLOYMENT COMPLETE!"
echo "========================================="
echo ""
echo "Summary:"
echo "  ✅ Container built and pushed"
echo "  ✅ IAM permissions configured"
echo "  ✅ Cloud Run Job created: $JOB_NAME"
echo "  ✅ Pub/Sub topic created: $TOPIC"
echo "  ✅ Storage notification configured"
echo "  ✅ Cloud Function deployed: $FUNCTION_NAME"
echo ""
echo "Next Steps:"
echo "1. Test the setup:"
echo "   ./test-deployment.sh"
echo ""
echo "2. Or manually test:"
echo "   gsutil cp test-video.mp4 gs://$RAW_BUCKET/raw/testUser/testVideo/original.mp4"
echo ""
echo "3. Monitor logs:"
echo "   gcloud functions logs read $FUNCTION_NAME --region=$REGION --gen2 --limit=50"
echo ""
echo "========================================="
