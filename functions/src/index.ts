import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as ffmpeg from 'fluent-ffmpeg';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

admin.initializeApp();

// ==================== ACCOUNT DELETION FUNCTIONS ====================

// Firestore trigger - sends confirmation email when deletion is requested
export { onAccountDeletionRequested } from './accountDeletionTrigger';

// Scheduled functions for deletion reminders and permanent deletion
export {
  processScheduledDeletions,
  sendDeletionReminders,
} from './scheduledDeletion';

// ==================== ANALYTICS FUNCTIONS ====================

// Scheduled function - aggregates analytics data daily
export { aggregateAnalytics } from './analyticsAggregation';

// ==================== VIDEO PROCESSING FUNCTIONS ====================

/**
 * Cloud Function to process uploaded videos
 * Triggers on new video upload to Storage
 * Compresses to 1080p with Instagram-quality settings
 */
export const processVideo = functions.storage.object().onFinalize(async (object) => {
  const filePath = object.name;
  const contentType = object.contentType;

  // Only process videos in the videos folder that need processing
  if (!filePath || !contentType?.startsWith('video/')) {
    return null;
  }

  if (!filePath.includes('/videos/')) {
    return null;
  }

  // Don't process already processed videos
  if (filePath.includes('_processed')) {
    return null;
  }

  const bucket = admin.storage().bucket(object.bucket);
  const fileName = path.basename(filePath);
  const tempFilePath = path.join(os.tmpdir(), fileName);
  const processedFileName = fileName.replace(/\.[^/.]+$/, '_processed.mp4');
  const processedFilePath = path.join(os.tmpdir(), processedFileName);

  try {
    // Download file from bucket
    await bucket.file(filePath).download({ destination: tempFilePath });
    console.log('Video downloaded to', tempFilePath);

    // Get video metadata to determine optimal settings
    const metadata = await getVideoMetadata(tempFilePath);
    console.log('Video metadata:', metadata);

    // Calculate target bitrate to stay under 100MB for 2-minute videos
    const targetSizeMB = 95;
    const duration = metadata.duration;
    const totalBitrateKbps = Math.floor((targetSizeMB * 8 * 1024) / duration);
    const audioBitrateKbps = 128;
    const videoBitrateKbps = Math.max(totalBitrateKbps - audioBitrateKbps, 3000);

    // Determine output FPS based on input
    let outputFps = 30;
    if (metadata.fps >= 48) {
      outputFps = 60;
    } else if (metadata.fps <= 30) {
      outputFps = 30;
    }

    console.log(`Processing with video bitrate: ${videoBitrateKbps}kbps, fps: ${outputFps}`);

    // Process video with FFmpeg
    await new Promise<void>((resolve, reject) => {
      ffmpeg(tempFilePath)
        .videoCodec('libx264')
        .size('1920x1080')
        .videoBitrate(videoBitrateKbps)
        .fps(outputFps)
        .outputOptions([
          '-preset medium',
          '-profile:v high',
          '-level 4.2',
          '-crf 18',
          '-pix_fmt yuv420p',
          `-maxrate ${Math.floor(videoBitrateKbps * 1.5)}k`,
          `-bufsize ${videoBitrateKbps * 2}k`,
          '-movflags +faststart'
        ])
        .audioCodec('aac')
        .audioBitrate('128k')
        .on('start', (commandLine) => {
          console.log('FFmpeg command:', commandLine);
        })
        .on('progress', (progress) => {
          console.log('Processing: ' + progress.percent + '% done');
        })
        .on('end', () => {
          console.log('Processing finished successfully');
          resolve();
        })
        .on('error', (err) => {
          console.error('FFmpeg error:', err);
          reject(err);
        })
        .save(processedFilePath);
    });

    // Upload processed video
    const processedPath = filePath.replace(fileName, processedFileName);
    await bucket.upload(processedFilePath, {
      destination: processedPath,
      metadata: {
        contentType: 'video/mp4',
        metadata: {
          processed: 'true',
          originalFile: fileName,
          processedAt: new Date().toISOString()
        }
      }
    });

    console.log('Processed video uploaded to', processedPath);

    // Get processed file size
    const [processedMetadata] = await bucket.file(processedPath).getMetadata();
    const processedSize = parseInt(processedMetadata.size || '0');
    const processedSizeMB = processedSize / (1024 * 1024);

    console.log(`Processed video size: ${processedSizeMB.toFixed(2)}MB`);

    // Update Firestore document with processed video URL
    const processedUrl = await bucket.file(processedPath).getSignedUrl({
      action: 'read',
      expires: '03-01-2500' // Far future expiry
    });

    // Find and update the Firestore document
    const userId = filePath.split('/')[1]; // Extract userId from path
    const uploadsRef = admin.firestore()
      .collection('uploads')
      .doc(userId)
      .collection('userUploads');

    const snapshot = await uploadsRef
      .where('fileName', '==', fileName)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      await doc.ref.update({
        'metadata.processed': true,
        'metadata.processedUrl': processedUrl[0],
        'metadata.processedSize': processedSize,
        'metadata.processedAt': admin.firestore.FieldValue.serverTimestamp()
      });
      console.log('Firestore document updated');
    }

    // Clean up temp files
    fs.unlinkSync(tempFilePath);
    fs.unlinkSync(processedFilePath);

    // Optionally delete original file to save storage costs
    // await bucket.file(filePath).delete();
    // console.log('Original file deleted');

    return null;
  } catch (error) {
    console.error('Error processing video:', error);
    
    // Clean up temp files on error
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
    if (fs.existsSync(processedFilePath)) {
      fs.unlinkSync(processedFilePath);
    }

    throw error;
  }
});

/**
 * Get video metadata using ffprobe
 */
function getVideoMetadata(filePath: string): Promise<{
  duration: number;
  width: number;
  height: number;
  fps: number;
}> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }

      const videoStream = metadata.streams.find(s => s.codec_type === 'video');
      if (!videoStream) {
        reject(new Error('No video stream found'));
        return;
      }

      const duration = metadata.format.duration || 0;
      const width = videoStream.width || 1920;
      const height = videoStream.height || 1080;
      
      // Calculate FPS from r_frame_rate (e.g., "30/1" or "60000/1001")
      let fps = 30;
      if (videoStream.r_frame_rate) {
        const [num, den] = videoStream.r_frame_rate.split('/').map(Number);
        fps = Math.round(num / den);
      }

      resolve({ duration, width, height, fps });
    });
  });
}
