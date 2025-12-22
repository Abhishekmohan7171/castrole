const { google } = require('googleapis');
const { Firestore } = require('@google-cloud/firestore');

const PROJECT_ID = process.env.GCP_PROJECT || process.env.GOOGLE_CLOUD_PROJECT;
const REGION = process.env.REGION || 'asia-south1';
const JOB_NAME = process.env.JOB_NAME || 'video-encode-job';
const RAW_BUCKET = process.env.RAW_BUCKET;
const PROC_BUCKET = process.env.PROC_BUCKET;

const firestore = new Firestore({ projectId: PROJECT_ID });

function parseObjectPath(objectPath) {
  const parts = objectPath.split('/');
  if (parts.length >= 4 && parts[0] === 'raw') {
    return { userId: parts[1], videoId: parts[2], fileName: parts[3] };
  }
  return null;
}

async function updateFirestoreStatus(userId, videoId, status) {
  try {
    const docRef = firestore.collection('uploads').doc(userId).collection('userUploads').doc(videoId);
    const updateData = { processingStatus: status };
    if (status === 'QUEUED') {
      updateData.processingQueuedAt = Firestore.FieldValue.serverTimestamp();
    }
    await docRef.update(updateData);
    console.log(`Updated Firestore: ${userId}/${videoId} -> ${status}`);
  } catch (error) {
    console.error('Failed to update Firestore:', error);
  }
}

async function executeJob(bucketName, objectName) {
  const jobPath = `projects/${PROJECT_ID}/locations/${REGION}/jobs/${JOB_NAME}`;
  console.log(`Executing Cloud Run Job: ${jobPath}`);
  console.log(`Object: gs://${bucketName}/${objectName}`);

  try {
    const auth = await google.auth.getClient({
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });
    
    const run = google.run({ version: 'v2', auth });
    
    const response = await run.projects.locations.jobs.run({
      name: jobPath,
      requestBody: {
        overrides: {
          containerOverrides: [{
            env: [
              { name: 'RAW_OBJECT', value: objectName },
              { name: 'RAW_BUCKET', value: bucketName },
              { name: 'PROC_BUCKET', value: PROC_BUCKET }
            ]
          }]
        }
      }
    });
    
    console.log('Job execution started:', response.data.name);
    return { success: true, operation: response.data.name };
  } catch (error) {
    console.error('Failed to execute job:', error);
    throw error;
  }
}

exports.videoEncodeTrigger = async (message, context) => {
  console.log('=== Video Encode Trigger Started ===');
  console.log('Pub/Sub message:', JSON.stringify(message));
  
  try {
    const messageData = message.data 
      ? JSON.parse(Buffer.from(message.data, 'base64').toString())
      : message;

    const bucketName = messageData.bucket;
    const objectName = messageData.name;
    const contentType = messageData.contentType;

    console.log(`Bucket: ${bucketName}`);
    console.log(`Object: ${objectName}`);
    console.log(`Content-Type: ${contentType}`);

    if (!contentType || !contentType.startsWith('video/')) {
      console.log('Skipping: Not a video file');
      return;
    }
    if (bucketName !== RAW_BUCKET) {
      console.log('Skipping: Not in raw bucket');
      return;
    }
    if (!objectName.startsWith('raw/')) {
      console.log('Skipping: Not in raw/ path');
      return;
    }

    const pathInfo = parseObjectPath(objectName);
    if (pathInfo) {
      console.log(`User: ${pathInfo.userId}, Video: ${pathInfo.videoId}`);
      await updateFirestoreStatus(pathInfo.userId, pathInfo.videoId, 'QUEUED');
    }

    await executeJob(bucketName, objectName);
    console.log('=== Video Encode Trigger Completed ===');
  } catch (error) {
    console.error('Error in video encode trigger:', error);
    throw error;
  }
};
