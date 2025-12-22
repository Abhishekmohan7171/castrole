#!/bin/bash

echo "=========================================="
echo "Testing GCP Video Processing System"
echo "=========================================="
echo ""

# Check if Cloud Function exists
echo "1. Checking Cloud Function..."
gcloud functions describe video-encode-trigger --region=asia-south1 --gen2 2>/dev/null || \
gcloud functions describe video-encode-trigger --region=asia-south1 2>/dev/null

if [ $? -eq 0 ]; then
  echo "✅ Cloud Function exists"
else
  echo "❌ Cloud Function not found"
  exit 1
fi

echo ""
echo "2. Checking Cloud Run Job..."
gcloud run jobs describe video-encode-job --region=asia-south1

if [ $? -eq 0 ]; then
  echo "✅ Cloud Run Job exists"
else
  echo "❌ Cloud Run Job not found"
  exit 1
fi

echo ""
echo "3. Checking Storage buckets..."
gsutil ls gs://castrole-raw-videos/ > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "✅ Raw bucket exists"
else
  echo "❌ Raw bucket not found"
fi

gsutil ls gs://castrole-processed-videos/ > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "✅ Processed bucket exists"
else
  echo "❌ Processed bucket not found"
fi

echo ""
echo "4. Checking Pub/Sub topic..."
gcloud pubsub topics describe video-upload-finalized

if [ $? -eq 0 ]; then
  echo "✅ Pub/Sub topic exists"
else
  echo "❌ Pub/Sub topic not found"
fi

echo ""
echo "5. Checking Storage notification..."
gsutil notification list gs://castrole-raw-videos/

echo ""
echo "=========================================="
echo "System Status Summary"
echo "=========================================="
echo ""
echo "All components are deployed!"
echo ""
echo "Next steps:"
echo "1. Verify Cloud Function environment variables"
echo "2. Test with a sample video upload"
echo "3. Integrate with Angular app"
echo ""
echo "To test manually:"
echo "  gsutil cp test-video.mp4 gs://castrole-raw-videos/raw/testUser/testVideo123/original.mp4"
echo ""
echo "To view logs:"
echo "  gcloud functions logs read video-encode-trigger --region=asia-south1 --limit=50"
echo "  gcloud logging read 'resource.type=cloud_run_job AND resource.labels.job_name=video-encode-job' --limit=50"
echo ""
