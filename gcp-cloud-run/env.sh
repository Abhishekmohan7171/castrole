#!/bin/bash
# Environment variables for GCP Cloud Run Jobs setup
# Source this file before running deployment scripts: source env.sh

# Project Configuration
export PROJECT_ID="yberhood-castrole"
export REGION="asia-south1"          # Mumbai, India

# Get project number (auto-detected)
export PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")

# Cloud Storage Buckets
export RAW_BUCKET="castrole-raw-videos"
export PROC_BUCKET="castrole-processed-videos"

# Service Accounts
export JOB_SA_EMAIL="sa-video-encoder-job@$PROJECT_ID.iam.gserviceaccount.com"
export TRIGGER_SA_EMAIL="sa-video-encode-trigger@$PROJECT_ID.iam.gserviceaccount.com"

# Pub/Sub
export TOPIC="video-upload-finalized"

# Artifact Registry
export AR_REPO="video-encoder"
export IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/$AR_REPO/encoder:latest"

# Cloud Run Job
export JOB_NAME="video-encode-job"

# Cloud Function
export FUNCTION_NAME="video-encode-trigger"

echo "Environment variables loaded:"
echo "  PROJECT_ID: $PROJECT_ID"
echo "  REGION: $REGION"
echo "  RAW_BUCKET: $RAW_BUCKET"
echo "  PROC_BUCKET: $PROC_BUCKET"
