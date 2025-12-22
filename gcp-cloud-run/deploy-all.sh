#!/bin/bash
set -euo pipefail

# Master Deployment Script for GCP Cloud Run Jobs Video Compression
# This script automates the entire deployment process

echo "========================================="
echo "GCP Cloud Run Jobs - Video Compression"
echo "Master Deployment Script"
echo "========================================="
echo ""

# Load environment variables
if [ ! -f "./env.sh" ]; then
    echo "❌ Error: env.sh not found!"
    exit 1
fi

source ./env.sh

echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"
echo "Raw Bucket: $RAW_BUCKET"
echo "Processed Bucket: $PROC_BUCKET"
echo ""

read -p "Is this correct? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please edit env.sh and run again"
    exit 1
fi

echo ""
echo "========================================="
echo "Step 1: Enabling Required APIs"
echo "========================================="
echo "This may take 2-3 minutes..."
echo ""

gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  pubsub.googleapis.com \
  storage.googleapis.com \
  eventarc.googleapis.com \
  cloudfunctions.googleapis.com \
  logging.googleapis.com

echo "✅ APIs enabled"
echo ""

echo "========================================="
echo "Step 2: Creating Cloud Storage Buckets"
echo "========================================="
echo ""

# Check if buckets already exist
if gsutil ls -b gs://$RAW_BUCKET &>/dev/null; then
    echo "⚠️  Raw bucket already exists: $RAW_BUCKET"
else
    echo "Creating raw bucket: $RAW_BUCKET"
    gsutil mb -l $REGION gs://$RAW_BUCKET
    echo "✅ Raw bucket created"
fi

if gsutil ls -b gs://$PROC_BUCKET &>/dev/null; then
    echo "⚠️  Processed bucket already exists: $PROC_BUCKET"
else
    echo "Creating processed bucket: $PROC_BUCKET"
    gsutil mb -l $REGION gs://$PROC_BUCKET
    echo "✅ Processed bucket created"
fi

# Set lifecycle rule for raw bucket
echo "Setting lifecycle rule (auto-delete after 3 days)..."
cat > /tmp/lifecycle-raw.json << EOF
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "Delete"},
        "condition": {"age": 3}
      }
    ]
  }
}
EOF

gsutil lifecycle set /tmp/lifecycle-raw.json gs://$RAW_BUCKET
rm /tmp/lifecycle-raw.json
echo "✅ Lifecycle rule set"
echo ""

echo "========================================="
echo "Step 3: Creating Service Accounts"
echo "========================================="
echo ""

# Create encoder job service account
if gcloud iam service-accounts describe $JOB_SA_EMAIL &>/dev/null; then
    echo "⚠️  Encoder job SA already exists"
else
    echo "Creating encoder job service account..."
    gcloud iam service-accounts create sa-video-encoder-job \
      --display-name="Video Encoder Job Service Account"
    echo "✅ Encoder job SA created"
fi

# Create trigger service account
if gcloud iam service-accounts describe $TRIGGER_SA_EMAIL &>/dev/null; then
    echo "⚠️  Trigger SA already exists"
else
    echo "Creating trigger service account..."
    gcloud iam service-accounts create sa-video-encode-trigger \
      --display-name="Video Encode Trigger Service Account"
    echo "✅ Trigger SA created"
fi

echo ""
echo "========================================="
echo "Step 4: Granting IAM Permissions"
echo "========================================="
echo ""

echo "Granting permissions to encoder job SA..."

# Storage permissions
gsutil iam ch serviceAccount:$JOB_SA_EMAIL:objectAdmin gs://$RAW_BUCKET 2>/dev/null || true
gsutil iam ch serviceAccount:$JOB_SA_EMAIL:objectAdmin gs://$PROC_BUCKET 2>/dev/null || true

# Logging permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$JOB_SA_EMAIL" \
  --role="roles/logging.logWriter" \
  --condition=None 2>/dev/null || true

# Firestore permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$JOB_SA_EMAIL" \
  --role="roles/datastore.user" \
  --condition=None 2>/dev/null || true

echo "Granting permissions to trigger SA..."

# Cloud Run permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$TRIGGER_SA_EMAIL" \
  --role="roles/run.developer" \
  --condition=None 2>/dev/null || true

# Service account user permission
gcloud iam service-accounts add-iam-policy-binding $JOB_SA_EMAIL \
  --member="serviceAccount:$TRIGGER_SA_EMAIL" \
  --role="roles/iam.serviceAccountUser" 2>/dev/null || true

# Logging permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$TRIGGER_SA_EMAIL" \
  --role="roles/logging.logWriter" \
  --condition=None 2>/dev/null || true

echo "✅ IAM permissions granted"
echo ""

echo "========================================="
echo "Step 5: Creating Artifact Registry"
echo "========================================="
echo ""

if gcloud artifacts repositories describe $AR_REPO --location=$REGION &>/dev/null; then
    echo "⚠️  Artifact Registry already exists"
else
    echo "Creating Artifact Registry repository..."
    gcloud artifacts repositories create $AR_REPO \
      --repository-format=docker \
      --location=$REGION \
      --description="Video encoder container images"
    echo "✅ Artifact Registry created"
fi

echo ""
echo "========================================="
echo "Step 6: Building Encoder Container"
echo "========================================="
echo "This may take 5-10 minutes..."
echo ""

cd encoder

# Configure Docker authentication
gcloud auth configure-docker $REGION-docker.pkg.dev --quiet

# Build and push using Cloud Build
echo "Submitting build to Cloud Build..."
gcloud builds submit . \
  --tag "$IMAGE" \
  --project "$PROJECT_ID" \
  --timeout=10m

cd ..

echo "✅ Encoder container built and pushed"
echo ""

echo "========================================="
echo "Step 7: Creating Cloud Run Job"
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
      --cpu=2 \
      --execute-now=false
fi

echo "✅ Cloud Run Job created"
echo ""

echo "========================================="
echo "Step 8: Setting Up Pub/Sub"
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
echo "========================================="
echo "Step 9: Deploying Cloud Function Trigger"
echo "========================================="
echo "This may take 3-5 minutes..."
echo ""

cd trigger

# Deploy Cloud Function
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
echo "  ✅ APIs enabled"
echo "  ✅ Buckets created: $RAW_BUCKET, $PROC_BUCKET"
echo "  ✅ Service accounts created and configured"
echo "  ✅ Encoder container built and pushed"
echo "  ✅ Cloud Run Job created: $JOB_NAME"
echo "  ✅ Pub/Sub topic created: $TOPIC"
echo "  ✅ Cloud Function deployed: $FUNCTION_NAME"
echo ""
echo "Next Steps:"
echo "1. Test the setup:"
echo "   gsutil cp test-video.mp4 gs://$RAW_BUCKET/raw/testUser/testVideo/original.mp4"
echo ""
echo "2. Monitor logs:"
echo "   gcloud functions logs read $FUNCTION_NAME --region=$REGION --gen2 --limit=50"
echo ""
echo "3. Check processed output:"
echo "   gsutil ls gs://$PROC_BUCKET/processed/"
echo ""
echo "4. Update your Angular app (see APP_INTEGRATION.md)"
echo ""
echo "========================================="
