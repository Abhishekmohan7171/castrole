#!/bin/bash
set -euo pipefail

# Test Deployment Script
# Run this after deploy-all.sh completes

echo "========================================="
echo "Testing GCP Cloud Run Jobs Deployment"
echo "========================================="
echo ""

# Load environment variables
source ./env.sh

echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo ""

# Check if test video exists
if [ ! -f "test-video.mp4" ]; then
    echo "⚠️  No test video found. Please provide a test-video.mp4 file"
    echo "   You can download one or use your own video file"
    read -p "Press Enter when you have a test-video.mp4 ready..."
fi

echo "========================================="
echo "Test 1: Upload Test Video"
echo "========================================="
echo ""

TEST_USER="testUser"
TEST_VIDEO="testVideo"
TEST_PATH="raw/$TEST_USER/$TEST_VIDEO/original.mp4"

echo "Uploading test video to: gs://$RAW_BUCKET/$TEST_PATH"
gsutil cp test-video.mp4 gs://$RAW_BUCKET/$TEST_PATH

echo "✅ Test video uploaded"
echo ""

echo "========================================="
echo "Test 2: Monitor Processing"
echo "========================================="
echo ""

echo "Waiting 10 seconds for Pub/Sub trigger..."
sleep 10

echo ""
echo "Checking Cloud Function logs..."
gcloud functions logs read $FUNCTION_NAME --region=$REGION --gen2 --limit=10

echo ""
echo "Checking Cloud Run Job executions..."
gcloud run jobs executions list --job=$JOB_NAME --region=$REGION --limit=5

echo ""
echo "========================================="
echo "Test 3: Wait for Processing (60 seconds)"
echo "========================================="
echo ""

echo "Processing video... This takes 30-90 seconds"
for i in {1..12}; do
    echo -n "."
    sleep 5
done
echo ""

echo ""
echo "========================================="
echo "Test 4: Check Results"
echo "========================================="
echo ""

PROCESSED_PATH="processed/$TEST_USER/$TEST_VIDEO/1080p.mp4"

echo "Checking for processed video: gs://$PROC_BUCKET/$PROCESSED_PATH"

if gsutil ls gs://$PROC_BUCKET/$PROCESSED_PATH &>/dev/null; then
    echo "✅ Processed video found!"
    
    # Get file size
    SIZE=$(gsutil du -s gs://$PROC_BUCKET/$PROCESSED_PATH | awk '{print $1}')
    SIZE_MB=$((SIZE / 1024 / 1024))
    
    echo "   Size: ${SIZE_MB}MB"
    echo ""
    echo "Downloading processed video..."
    gsutil cp gs://$PROC_BUCKET/$PROCESSED_PATH ./test-output.mp4
    echo "✅ Downloaded to: ./test-output.mp4"
    echo ""
    echo "🎉 TEST PASSED!"
    echo ""
    echo "You can now:"
    echo "1. Play test-output.mp4 to verify quality"
    echo "2. Integrate with your Angular app (see APP_INTEGRATION.md)"
else
    echo "❌ Processed video not found yet"
    echo ""
    echo "Debugging steps:"
    echo "1. Check Cloud Function logs:"
    echo "   gcloud functions logs read $FUNCTION_NAME --region=$REGION --gen2 --limit=50"
    echo ""
    echo "2. Check Cloud Run Job logs:"
    echo "   gcloud logging read 'resource.type=cloud_run_job' --limit=50 --format=json"
    echo ""
    echo "3. List job executions:"
    echo "   gcloud run jobs executions list --job=$JOB_NAME --region=$REGION"
    echo ""
    echo "4. Wait longer (processing can take up to 2 minutes)"
fi

echo ""
echo "========================================="
echo "Test 5: View Logs"
echo "========================================="
echo ""

echo "Recent Cloud Run Job logs:"
gcloud logging read "resource.type=cloud_run_job AND resource.labels.job_name=$JOB_NAME" \
  --limit=20 \
  --format="table(timestamp,textPayload)" \
  --order=desc

echo ""
echo "========================================="
echo "Test Complete"
echo "========================================="
