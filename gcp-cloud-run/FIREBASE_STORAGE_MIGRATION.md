# Firebase Storage Migration Guide

## ✅ Changes Made

Your Cloud Run video encoder has been updated to store processed videos in **Firebase Storage** instead of a separate GCS bucket.

### **What Changed**

1. **Environment Variables** (`env.sh` and `env.sh.local`)
   - `PROC_BUCKET` now points to Firebase Storage bucket
   - Both raw and processed videos use the same bucket

2. **Encoder Script** (`encoder/encode.py`)
   - Uploads processed videos to `processed/{userId}/{videoId}/1080p.mp4`
   - Sets proper cache headers for better performance
   - Updates Firestore with complete video metadata (duration, resolution)
   - Stores `processedUrl` in correct format for Firebase Storage

### **New Storage Structure**

```
gs://yberhood-castrole.firebasestorage.app/
├── raw/                          # Raw uploads (existing)
│   └── {userId}/
│       └── {videoId}/
│           └── original.mp4
│
└── processed/                    # ✅ NEW: Processed videos
    └── {userId}/
        └── {videoId}/
            └── 1080p.mp4
```

### **Firestore Document Structure**

```javascript
uploads/{userId}/userUploads/{videoId}
{
  videoId: "vid_xxx",
  userId: "user123",
  rawUrl: "gs://yberhood-castrole.../raw/...",
  processedUrl: "gs://yberhood-castrole.../processed/.../1080p.mp4", // ✅ NEW
  processingStatus: "READY",
  processedSize: 52428800,
  duration: 120.5,              // ✅ NEW: in seconds
  resolution: "1920x1080",      // ✅ NEW
  fileName: "my-video.mp4",
  uploadCompletedAt: Timestamp,
  processingCompletedAt: Timestamp
}
```

---

## 🚀 Deployment Steps

### **Step 1: Rebuild and Deploy Cloud Run Job**

```bash
cd gcp-cloud-run

# Load environment variables
source env.sh

# Build and push Docker image
cd encoder
./build.sh

# Deploy the updated job
cd ..
./deploy-job.sh
```

### **Step 2: Update Cloud Function (if needed)**

The Cloud Function trigger should work as-is, but verify it's using the correct bucket:

```bash
# Check current function configuration
gcloud functions describe video-encode-trigger \
  --gen2 \
  --region=asia-south1 \
  --format="value(serviceConfig.environmentVariables)"
```

If needed, redeploy:

```bash
./deploy-all.sh
```

### **Step 3: Update Firebase Storage Security Rules**

Add rules for the `processed/` folder:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Raw uploads - only owner can read/write
    match /raw/{userId}/{videoId}/{fileName} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Processed videos - owner can read, system can write
    match /processed/{userId}/{videoId}/{fileName} {
      // Allow authenticated users to read their own processed videos
      allow read: if request.auth != null && request.auth.uid == userId;
      
      // Or allow public read for processed videos (if you want):
      // allow read: if request.auth != null;
      
      // Only backend (Cloud Run) can write - handled via service account
      allow write: if false;
    }
  }
}
```

Apply the rules:
1. Go to Firebase Console → Storage → Rules
2. Paste the rules above
3. Click "Publish"

### **Step 4: Grant Cloud Run Service Account Permissions**

Ensure the Cloud Run service account can write to Firebase Storage:

```bash
# Get service account email
SA_EMAIL="sa-video-encoder-job@yberhood-castrole.iam.gserviceaccount.com"

# Grant Storage Object Admin role
gcloud projects add-iam-policy-binding yberhood-castrole \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/storage.objectAdmin"
```

---

## 🧪 Testing

### **Test 1: Upload a New Video**

1. Go to your Angular app: `/discover/upload`
2. Upload a test video
3. Watch the console logs

**Expected Flow:**
```
1. Upload to: gs://yberhood-castrole.../raw/{userId}/{videoId}/original.mp4
2. Firestore: processingStatus = "UPLOADING" → "QUEUED" → "PROCESSING"
3. Cloud Run processes video
4. Upload to: gs://yberhood-castrole.../processed/{userId}/{videoId}/1080p.mp4
5. Firestore: processingStatus = "READY", processedUrl set
```

### **Test 2: Check Firestore**

```javascript
// In Firebase Console → Firestore
uploads/{yourUserId}/userUploads/{videoId}

// Should have:
{
  processedUrl: "gs://yberhood-castrole.firebasestorage.app/processed/...",
  processingStatus: "READY",
  duration: 120.5,
  resolution: "1920x1080"
}
```

### **Test 3: Access Video in Angular**

```typescript
import { Storage, ref, getDownloadURL } from '@angular/fire/storage';

// Get download URL
const storage = inject(Storage);
const videoRef = ref(storage, `processed/${userId}/${videoId}/1080p.mp4`);
const url = await getDownloadURL(videoRef);

// Play video
<video [src]="url" controls></video>
```

---

## 🔍 Troubleshooting

### **Issue: "Permission Denied" when accessing video**

**Solution:** Check Firebase Storage rules allow read access:
```javascript
match /processed/{userId}/{videoId}/{fileName} {
  allow read: if request.auth != null && request.auth.uid == userId;
}
```

### **Issue: Cloud Run can't upload to Firebase Storage**

**Solution:** Grant service account permissions:
```bash
gcloud projects add-iam-policy-binding yberhood-castrole \
  --member="serviceAccount:sa-video-encoder-job@yberhood-castrole.iam.gserviceaccount.com" \
  --role="roles/storage.objectAdmin"
```

### **Issue: Video not processing**

**Check Cloud Run logs:**
```bash
gcloud logging read "resource.type=cloud_run_job AND resource.labels.job_name=video-encode-job" \
  --limit 50 \
  --format json
```

**Check Firestore:**
- Look for `processingStatus: "FAILED"`
- Check `processingError` field for details

---

## 📊 Monitoring

### **Check Processing Status**

```bash
# View recent Cloud Run Job executions
gcloud run jobs executions list \
  --job=video-encode-job \
  --region=asia-south1 \
  --limit=10
```

### **View Logs**

```bash
# Real-time logs
gcloud logging tail "resource.type=cloud_run_job" --format=json

# Recent errors
gcloud logging read "resource.type=cloud_run_job AND severity>=ERROR" \
  --limit 20 \
  --format json
```

### **Check Storage Usage**

```bash
# List processed videos
gsutil ls -lh gs://yberhood-castrole.firebasestorage.app/processed/

# Get bucket size
gsutil du -sh gs://yberhood-castrole.firebasestorage.app/processed/
```

---

## 🎯 Benefits of This Change

1. **Simpler Architecture**
   - One bucket to manage
   - Consistent security rules
   - No cross-bucket permissions

2. **Easier Frontend Access**
   - Firebase SDK handles auth automatically
   - `getDownloadURL()` works seamlessly
   - No additional configuration needed

3. **Better Performance**
   - Cache headers set automatically
   - CDN-backed by Firebase
   - Optimized for web delivery

4. **Cost Efficient**
   - No data transfer between buckets
   - Simpler billing
   - Firebase Storage pricing is competitive

---

## 📝 Next Steps

1. **Deploy the changes** (see Step 1-4 above)
2. **Test with a video upload**
3. **Update your Angular components** to fetch from Firebase Storage
4. **Monitor the first few uploads** to ensure everything works

---

## 🔗 Related Files

- **Encoder**: `gcp-cloud-run/encoder/encode.py`
- **Environment**: `gcp-cloud-run/env.sh`
- **Deployment**: `gcp-cloud-run/deploy-job.sh`
- **Documentation**: `docs/VIDEO_PROCESSING_COMPLETE_GUIDE.md`

---

**Status**: ✅ Ready to deploy

The code changes are complete. Follow the deployment steps above to apply the changes to your Cloud Run Job.
