const { google } = require('googleapis');
const { Firestore } = require('@google-cloud/firestore');

const PROJECT_ID = process.env.GCP_PROJECT || process.env.GOOGLE_CLOUD_PROJECT;
const REGION = process.env.REGION || 'asia-south1';
const JOB_NAME = process.env.JOB_NAME || 'video-encode-job';
const RAW_BUCKET = process.env.RAW_BUCKET || 'yberhood-castrole.firebasestorage.app';
const PROC_BUCKET = process.env.PROC_BUCKET || 'castrole-processed-videos';

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

exports.videoEncodeTrigger = async (req, res) => {
  console.log('=== Video Encode Trigger Started ===');
  
  try {
    // Log what we receive to debug the structure
    console.log('Request body type:', typeof req.body);
    console.log('Request body keys:', req.body ? Object.keys(req.body) : 'null');
    
    // Gen2 Cloud Functions with Eventarc - try multiple formats
    let messageData;
    
    // Format 1: Direct CloudEvent with data.message.data
    if (req.body && req.body.data && req.body.data.message && req.body.data.message.data) {
      const pubsubMessage = req.body.data.message.data;
      const decodedMessage = Buffer.from(pubsubMessage, 'base64').toString();
      messageData = JSON.parse(decodedMessage);
      console.log('Format 1: CloudEvent with nested message');
    }
    // Format 2: Direct message in body
    else if (req.body && req.body.message && req.body.message.data) {
      const pubsubMessage = req.body.message.data;
      const decodedMessage = Buffer.from(pubsubMessage, 'base64').toString();
      messageData = JSON.parse(decodedMessage);
      console.log('Format 2: Direct Pub/Sub message');
    }
    // Format 3: Base64 data directly in body
    else if (req.body && req.body.data && typeof req.body.data === 'string') {
      const decodedMessage = Buffer.from(req.body.data, 'base64').toString();
      messageData = JSON.parse(decodedMessage);
      console.log('Format 3: Base64 data in body.data');
    }
    // Format 4: Already decoded in body
    else if (req.body && (req.body.bucket || req.body.name)) {
      messageData = req.body;
      console.log('Format 4: Already decoded Storage notification');
    }
    else {
      console.error('Could not parse message. Body structure:', JSON.stringify(req.body, null, 2));
      res.status(400).send('Bad Request: Unsupported message format');
      return;
    }

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
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Error in video encode trigger:', error);
    res.status(500).send('Internal Server Error');
  }
};
