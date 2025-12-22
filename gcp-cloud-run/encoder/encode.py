#!/usr/bin/env python3
"""
Video Encoder for Cloud Run Jobs
Processes videos using FFmpeg to 1080p MP4 with Instagram-quality settings
"""

import os
import sys
import subprocess
import tempfile
import shutil
from pathlib import Path
from google.cloud import storage
from google.cloud import firestore

# Environment variables (set by Cloud Run Job)
RAW_BUCKET = os.environ.get('RAW_BUCKET')
PROC_BUCKET = os.environ.get('PROC_BUCKET')
RAW_OBJECT = os.environ.get('RAW_OBJECT')  # e.g., "raw/userId/videoId/original.mp4"
PROJECT_ID = os.environ.get('GCP_PROJECT') or os.environ.get('GOOGLE_CLOUD_PROJECT')

def log(message):
    """Print log message with timestamp"""
    print(f"[ENCODER] {message}", flush=True)

def validate_env():
    """Validate required environment variables"""
    if not RAW_BUCKET:
        raise ValueError("RAW_BUCKET environment variable is required")
    if not PROC_BUCKET:
        raise ValueError("PROC_BUCKET environment variable is required")
    if not RAW_OBJECT:
        raise ValueError("RAW_OBJECT environment variable is required")
    if not PROJECT_ID:
        raise ValueError("PROJECT_ID environment variable is required")

def parse_object_path(object_path):
    """
    Parse object path to extract userId and videoId
    Expected format: raw/{userId}/{videoId}/original.ext
    """
    parts = object_path.split('/')
    if len(parts) >= 4 and parts[0] == 'raw':
        user_id = parts[1]
        video_id = parts[2]
        return user_id, video_id
    return None, None

def update_firestore_status(user_id, video_id, status, error=None):
    """Update Firestore document with processing status"""
    try:
        db = firestore.Client(project=PROJECT_ID)
        doc_ref = db.collection('uploads').document(user_id).collection('userUploads').document(video_id)
        
        update_data = {
            'processingStatus': status
        }
        
        if status == 'PROCESSING':
            update_data['processingStartedAt'] = firestore.SERVER_TIMESTAMP
        elif status == 'READY':
            update_data['processingCompletedAt'] = firestore.SERVER_TIMESTAMP
        elif status == 'FAILED':
            update_data['processingError'] = error or 'Unknown error'
            update_data['processingFailedAt'] = firestore.SERVER_TIMESTAMP
        
        doc_ref.update(update_data)
        log(f"Updated Firestore: {user_id}/{video_id} -> {status}")
    except Exception as e:
        log(f"Warning: Failed to update Firestore: {e}")

def get_video_metadata(input_file):
    """Get video metadata using ffprobe"""
    try:
        cmd = [
            'ffprobe',
            '-v', 'error',
            '-select_streams', 'v:0',
            '-show_entries', 'stream=width,height,r_frame_rate,duration',
            '-show_entries', 'format=duration',
            '-of', 'default=noprint_wrappers=1',
            input_file
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        
        metadata = {}
        for line in result.stdout.strip().split('\n'):
            if '=' in line:
                key, value = line.split('=', 1)
                metadata[key] = value
        
        # Parse FPS
        fps = 30
        if 'r_frame_rate' in metadata:
            num, den = metadata['r_frame_rate'].split('/')
            fps = round(int(num) / int(den))
        
        return {
            'width': int(metadata.get('width', 1920)),
            'height': int(metadata.get('height', 1080)),
            'fps': fps,
            'duration': float(metadata.get('duration', 0))
        }
    except Exception as e:
        log(f"Warning: Failed to get metadata: {e}")
        return {'width': 1920, 'height': 1080, 'fps': 30, 'duration': 0}

def encode_video(input_file, output_file):
    """
    Encode video to 1080p MP4 with Instagram-quality settings
    
    Settings:
    - Resolution: 1920x1080 (forced, padded if needed)
    - Codec: H.264 High Profile Level 4.2
    - Preset: medium
    - CRF: 18 (excellent quality)
    - FPS: 30 (or 60 if input >= 48fps)
    - Audio: AAC 128kbps
    - Container: MP4 with faststart
    """
    log(f"Getting video metadata...")
    metadata = get_video_metadata(input_file)
    
    # Determine output FPS
    input_fps = metadata['fps']
    output_fps = 60 if input_fps >= 48 else 30
    
    log(f"Input: {metadata['width']}x{metadata['height']} @ {input_fps}fps")
    log(f"Output: 1920x1080 @ {output_fps}fps")
    
    # FFmpeg command with Instagram-quality settings
    cmd = [
        'ffmpeg',
        '-y',  # Overwrite output
        '-i', input_file,
        
        # Video filters: scale to 1080p, pad if needed
        '-vf', "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2",
        
        # Video codec settings
        '-c:v', 'libx264',
        '-profile:v', 'high',
        '-level', '4.2',
        '-preset', 'medium',
        '-crf', '18',
        '-pix_fmt', 'yuv420p',
        '-r', str(output_fps),
        
        # Audio codec settings
        '-c:a', 'aac',
        '-b:a', '128k',
        
        # MP4 optimization
        '-movflags', '+faststart',
        
        output_file
    ]
    
    log(f"Encoding with FFmpeg...")
    log(f"Command: {' '.join(cmd)}")
    
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            check=True
        )
        log("Encoding completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        log(f"FFmpeg error: {e.stderr}")
        raise

def main():
    """Main encoder logic"""
    try:
        # Validate environment
        log("Starting video encoder...")
        validate_env()
        
        log(f"RAW_BUCKET: {RAW_BUCKET}")
        log(f"PROC_BUCKET: {PROC_BUCKET}")
        log(f"RAW_OBJECT: {RAW_OBJECT}")
        
        # Parse object path
        user_id, video_id = parse_object_path(RAW_OBJECT)
        if not user_id or not video_id:
            log(f"Warning: Could not parse userId/videoId from path: {RAW_OBJECT}")
        else:
            log(f"Processing video for user: {user_id}, video: {video_id}")
            update_firestore_status(user_id, video_id, 'PROCESSING')
        
        # Initialize Cloud Storage client
        storage_client = storage.Client()
        raw_bucket = storage_client.bucket(RAW_BUCKET)
        proc_bucket = storage_client.bucket(PROC_BUCKET)
        
        # Create temp directory
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            input_file = temp_path / 'input'
            output_file = temp_path / 'output.mp4'
            
            # Download raw video
            log(f"Downloading gs://{RAW_BUCKET}/{RAW_OBJECT}")
            blob = raw_bucket.blob(RAW_OBJECT)
            blob.download_to_filename(str(input_file))
            
            input_size_mb = input_file.stat().st_size / (1024 * 1024)
            log(f"Downloaded {input_size_mb:.2f} MB")
            
            # Encode video
            encode_video(str(input_file), str(output_file))
            
            output_size_mb = output_file.stat().st_size / (1024 * 1024)
            log(f"Encoded to {output_size_mb:.2f} MB")
            
            # Determine output path
            # Convert: raw/userId/videoId/original.ext -> processed/userId/videoId/1080p.mp4
            if user_id and video_id:
                output_object = f"processed/{user_id}/{video_id}/1080p.mp4"
            else:
                # Fallback: just replace 'raw' with 'processed' and change extension
                output_object = RAW_OBJECT.replace('raw/', 'processed/', 1)
                output_object = output_object.rsplit('.', 1)[0] + '.mp4'
            
            # Upload processed video
            log(f"Uploading gs://{PROC_BUCKET}/{output_object}")
            output_blob = proc_bucket.blob(output_object)
            output_blob.upload_from_filename(
                str(output_file),
                content_type='video/mp4'
            )
            log("Upload completed")
            
            # Update Firestore with processed URL
            if user_id and video_id:
                # Get public URL (or signed URL)
                processed_url = f"gs://{PROC_BUCKET}/{output_object}"
                
                try:
                    db = firestore.Client(project=PROJECT_ID)
                    doc_ref = db.collection('uploads').document(user_id).collection('userUploads').document(video_id)
                    doc_ref.update({
                        'metadata.processedUrl': processed_url,
                        'metadata.processedSize': int(output_file.stat().st_size),
                        'metadata.processed': True
                    })
                    log("Updated Firestore with processed URL")
                except Exception as e:
                    log(f"Warning: Failed to update processed URL: {e}")
                
                update_firestore_status(user_id, video_id, 'READY')
            
            # Delete raw video (optional - uncomment to enable)
            # log(f"Deleting raw video gs://{RAW_BUCKET}/{RAW_OBJECT}")
            # blob.delete()
            # log("Raw video deleted")
        
        log("Encoding job completed successfully!")
        sys.exit(0)
        
    except Exception as e:
        log(f"ERROR: {str(e)}")
        
        # Update Firestore with error
        user_id, video_id = parse_object_path(RAW_OBJECT) if RAW_OBJECT else (None, None)
        if user_id and video_id:
            update_firestore_status(user_id, video_id, 'FAILED', str(e))
        
        sys.exit(1)

if __name__ == '__main__':
    main()
