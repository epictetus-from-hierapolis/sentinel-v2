import 'server-only';
// @ts-ignore
import { Cam } from 'onvif';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { db } from './db';
import { eventBus } from './event-bus';
import { Camera, CameraStatus, CameraLocation } from '@/types';
import { logger } from '@/lib/logger';

// Create a child logger scoped to this module.
// Every log line from CameraManager will automatically include { module: 'camera-manager' }.
const log = logger.child({ module: 'camera-manager' });

declare global {
  var __CAMERA_MANAGER__: CameraManager | undefined;
}

class CameraManager {
  private isMonitoring: boolean = false;
  private recordingStatus: Map<string, boolean> = new Map();
  private activeCameras: Map<string, any> = new Map();

  // --- STABILITY IMPROVEMENTS ---
  // 1. Semaphore: Tracks if a camera is busy with a snapshot
  private snapshotLocks: Map<string, boolean> = new Map();
  // 2. Cache: Keeps the last successful snapshot for fallback
  private lastSnapshots: Map<string, Buffer> = new Map();
  // 3. Simulation: Manage mock engine
  private simulationInterval: NodeJS.Timeout | null = null;
  private isSimulating: boolean = false;

  // Camera configuration
  private configs: Camera[] = [];

  private discoverCameras() {
    log.info('Discovering cameras from environment variables...');
    let i = 1;
    while (process.env[`CAMERA_${i}_IP`]) {
      const id = `cam-${i.toString().padStart(2, '0')}`;
      const name = process.env[`CAMERA_${i}_NAME`] || `Camera ${i}`;
      const ip = process.env[`CAMERA_${i}_IP`] || '';
      const user = process.env[`CAMERA_${i}_USER`] || '';
      const pass = process.env[`CAMERA_${i}_PASS`] || '';
      const stream = process.env[`CAMERA_${i}_STREAM`] || '/stream1';

      this.configs.push({
        id,
        name,
        location: i === 1 ? CameraLocation.EXTERIOR : (i === 2 ? CameraLocation.GARDEN : CameraLocation.INTERIOR),
        status: CameraStatus.OFFLINE,
        ipAddress: ip,
        credentials: { user, pass },
        streamPath: stream
      });

      // Log each discovered camera with its key details (password is intentionally omitted)
      log.info({ cameraId: id, name, ip }, 'Camera discovered');
      i++;
    }
    log.info({ total: this.configs.length }, 'Camera discovery complete');

    // SYNC: Ensure these cameras exist in the DB (to satisfy Foreign Key constraints)
    this.configs.forEach(async (cam) => {
      try {
        await db.upsertCamera(cam);
        log.info({ cameraId: cam.id }, 'Camera synced to DB');
      } catch (err) {
        log.error({ err, cameraId: cam.id }, 'Failed to sync camera to DB');
      }
    });
  }

  constructor() {
    log.info('Camera Manager initializing...');
    this.discoverCameras();

    // 1. Create necessary directories
    const dirs = ['recordings', 'thumbnails'];
    dirs.forEach(dir => {
      const fullPath = path.join(process.cwd(), 'public', dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        log.info({ dir: `public/${dir}` }, 'Created missing directory');
      }
    });

    // 2. IMPORTANT: Start monitoring automatically on initialization!
    this.startMonitoring();

    // 3. RECONCILE: Sync existing files in /public/recordings with the DB
    this.reconcileExistingEvents();
  }

  private async reconcileExistingEvents() {
    log.info('Starting event reconciliation (syncing physical files with DB)...');
    try {
      const recordingsDir = path.join(process.cwd(), 'public', 'recordings');
      if (!fs.existsSync(recordingsDir)) return;

      const files = fs.readdirSync(recordingsDir).filter(f => f.startsWith('sentinel_') && f.endsWith('.mp4'));
      log.info({ count: files.length }, 'Found recording files to check');

      for (const file of files) {
        // Format: sentinel_cam-01_1771517731608.mp4
        const parts = file.replace('.mp4', '').split('_');
        if (parts.length < 3) continue;

        const cameraId = parts[1];
        const timestampMs = parseInt(parts[2]);
        if (isNaN(timestampMs)) continue;

        const timestamp = new Date(timestampMs);

        // Check if camera is managed by us
        const camera = this.configs.find(c => c.id === cameraId);
        if (!camera) {
          log.debug({ cameraId, file }, 'Skipping reconciliation for unknown camera');
          continue;
        }

        // Check if event already exists in DB
        const exists = await db.checkEventExists(cameraId, timestamp);
        if (!exists) {
          log.info({ cameraId, timestamp: timestamp.toISOString() }, 'Reconciling missing event from file');

          const videoPath = path.join(recordingsDir, file);

          // PROTECTION: Delete 0-byte corrupted files (e.g., from network drops during recording)
          try {
            const stats = fs.statSync(videoPath);
            if (stats.size === 0) {
              log.warn({ file }, 'Reconciliation found 0-byte corrupt video, deleting and skipping...');
              fs.unlinkSync(videoPath);
              continue;
            }
          } catch (e) {
            continue; // Skip if file can't be read
          }

          const thumbFilename = `thumb_${cameraId}_${timestampMs}.jpg`;
          const thumbPath = path.join(process.cwd(), 'public', 'thumbnails', thumbFilename);

          // Ensure thumbnail exists, generate if missing
          if (!fs.existsSync(thumbPath)) {
            log.info({ thumbFilename }, 'Thumbnail missing for reconciled event, generating...');
            await new Promise<void>((resolve) => {
              this.generateThumbnailFromVideo(videoPath, thumbPath, () => resolve());
            });
          }

          try {
            await db.addEvent({
              cameraId,
              type: 'person', // Mark reconciled events as 'person' to match user preference
              videoPath: `/recordings/${file}`,
              thumbnailPath: `/thumbnails/${thumbFilename}`,
            });
          } catch (dbErr) {
            log.error({ err: dbErr, file }, 'Failed to save reconciled event to DB');
          }
        }
      }
      log.info('Event reconciliation complete.');
    } catch (err) {
      log.error({ err }, 'Event reconciliation failed');
    }
  }

  // --- PUBLIC API ---

  public getPublicConfig() {
    return this.configs.map((cfg) => ({
      id: cfg.id,
      name: cfg.name,
      location: cfg.location,
      status: cfg.status,
      streamPath: cfg.streamPath,
      ipAddress: cfg.ipAddress
    }));
  }

  // 1. SMART SNAPSHOT (With Lock & Cache)
  public async takeSnapshot(cameraId: string): Promise<Buffer | null> {
    const config = this.configs.find(c => c.id === cameraId);
    if (!config) return null;

    // SEMAPHORE CHECK:
    // If the camera is busy (e.g., rapid Back/Fwd navigation),
    // don't open a new process. Return the last cached image.
    if (this.snapshotLocks.get(cameraId)) {
      log.debug({ cameraId }, 'Snapshot lock active, returning cached image');
      return this.lastSnapshots.get(cameraId) || null;
    }

    // Lock the camera
    this.snapshotLocks.set(cameraId, true);

    const user = encodeURIComponent(config.credentials.user);
    const pass = encodeURIComponent(config.credentials.pass);
    const rtspUrl = `rtsp://${user}:${pass}@${config.ipAddress}:554${config.streamPath}`;

    return new Promise((resolve) => {
      try {
        const ffmpeg = spawn('ffmpeg', [
          '-y',
          '-rtsp_transport', 'tcp',
          '-analyzeduration', '5000000',
          '-probesize', '5000000',
          '-i', rtspUrl,
          '-frames:v', '1',
          '-q:v', '2',
          '-f', 'image2',
          '-'
        ]);

        const chunks: any[] = [];
        ffmpeg.stdout.on('data', (chunk) => chunks.push(chunk));

        // Suppress ffmpeg's verbose stderr output to keep logs clean.
        // Re-enable this handler (log.debug) if you need to debug ffmpeg issues.
        ffmpeg.stderr.on('data', () => { });

        ffmpeg.on('close', (code) => {
          // Unlock the camera regardless of the result
          this.snapshotLocks.set(cameraId, false);

          if (code === 0 && chunks.length > 0) {
            const imgBuffer = Buffer.concat(chunks);
            // Update cache with the new successful image
            this.lastSnapshots.set(cameraId, imgBuffer);
            resolve(imgBuffer);
          } else {
            // Warn and fall back to the last cached snapshot
            log.warn({ cameraId, cameraName: config.name, exitCode: code }, 'Snapshot failed, serving cached image');
            resolve(this.lastSnapshots.get(cameraId) || null);
          }
        });
      } catch (e) {
        this.snapshotLocks.set(cameraId, false);
        log.error({ err: e, cameraId }, 'Snapshot process threw an exception');
        resolve(this.lastSnapshots.get(cameraId) || null);
      }
    });
  }

  public startMonitoring() {
    if (this.isMonitoring) return;
    this.isMonitoring = true;

    this.configs.forEach((config) => {
      if (config.ipAddress && config.credentials.user) {
        this.connectToCamera(config);
      }
    });
  }

  // --- INTERNAL LOGIC ---

  private connectToCamera(config: Camera) {
    log.info({ cameraId: config.id, cameraName: config.name, ip: config.ipAddress }, 'Attempting ONVIF connection...');

    let device: any;
    device = new Cam({
      hostname: config.ipAddress,
      username: config.credentials.user,
      password: config.credentials.pass,
      port: 2020,
      timeout: 10000
    }, (err: any, camInstance: any) => {

      if (err) {
        // Log the error with structured fields so it's easy to filter in production
        log.error(
          { cameraId: config.id, cameraName: config.name, err: err.message || err },
          'ONVIF connection failed, will retry in 30s'
        );
        config.status = CameraStatus.OFFLINE;

        // Reconnection logic: Try again after 30 seconds
        this.activeCameras.delete(config.id);
        setTimeout(() => this.connectToCamera(config), 30000);
        return;
      }

      const activeCam = camInstance || device;
      if (!activeCam) return;

      log.info({ cameraId: config.id, cameraName: config.name }, 'ONVIF connection established, monitoring active');
      config.status = CameraStatus.ONLINE;
      this.activeCameras.set(config.id, activeCam);

      activeCam.on('event', (msg: any) => this.processEvent(config, msg));

      // Handle connection loss/errors during monitoring
      activeCam.on('error', (err: any) => {
        log.warn(
          { cameraId: config.id, cameraName: config.name, err: err.message || err },
          'Camera stream error'
        );
        config.status = CameraStatus.OFFLINE;
        this.activeCameras.delete(config.id);
      });

      activeCam.on('close', () => {
        log.warn({ cameraId: config.id, cameraName: config.name }, 'Camera connection closed, reconnecting in 10s...');
        config.status = CameraStatus.OFFLINE;
        this.activeCameras.delete(config.id);
        setTimeout(() => this.connectToCamera(config), 10000);
      });
    });
  }

  private processEvent(config: Camera, msg: any) {
    try {
      const topic = msg.topic?._ || msg.topic || '';

      // Log every ONVIF event at debug level.
      // In production (level=info) these are suppressed to avoid flooding.
      // Switch to log.info if you need to see them in production temporarily.
      const simpleVal = msg.message?.message?.data?.simpleItem?.$?.Value;
      log.debug({ cameraId: config.id, cameraName: config.name, topic, value: simpleVal }, 'ONVIF event received');

      // Check for Person Detection (Prioritized)
      // We look for common ONVIF person detection topics used by Tapo, Hikvision, and others.
      const isPerson = topic.includes('PeopleDetector/People') ||
        topic.includes('VideoAnalytics/PersonDetection') ||
        topic.includes('Visitor');

      if (isPerson) {
        const val = simpleVal;
        const isRecording = this.recordingStatus.get(config.id) || false;

        if ((val === 'true' || val === true) && !isRecording) {
          // Log alarm at warn level so it stands out in production logs.
          // Including the topic help us verify if the camera is misidentifying or if our filter is too loose.
          log.warn(
            { cameraId: config.id, cameraName: config.name, eventType: 'person', onvifTopic: topic },
            'ALARM: Person detection triggered'
          );
          this.startRecording(config, 'person');
        }
      }
    } catch (e) {
      log.error({ err: e, cameraId: config.id }, 'Failed to parse ONVIF event');
    }
  }

  // 2. OPTIMIZED VIDEO RECORDING (Single Stream)
  private startRecording(config: Camera, eventType: 'person' | 'motion' = 'person') {
    this.recordingStatus.set(config.id, true);
    const timestamp = Date.now();

    const videoFilename = `sentinel_${config.id}_${timestamp}.mp4`;
    const thumbFilename = `thumb_${config.id}_${timestamp}.jpg`;

    const videoPath = path.join(process.cwd(), 'public', 'recordings', videoFilename);
    const thumbPath = path.join(process.cwd(), 'public', 'thumbnails', thumbFilename);

    const user = encodeURIComponent(config.credentials.user);
    const pass = encodeURIComponent(config.credentials.pass);
    const rtspUrl = `rtsp://${user}:${pass}@${config.ipAddress}:554${config.streamPath}`;

    // Note: Thumbnail generation via RTSP removed to prevent camera locking.
    // We now open ONLY the video stream.

    log.info({ cameraId: config.id, videoFilename }, 'FFmpeg recording started');
    const ffmpeg = spawn('ffmpeg', [
      '-y',
      '-rtsp_transport', 'tcp',
      '-i', rtspUrl,
      '-t', '15',
      '-an',
      '-c:v', 'copy',
      videoPath
    ]);

    ffmpeg.on('close', (code) => {
      this.recordingStatus.set(config.id, false);

      if (code === 0) {
        log.info({ cameraId: config.id, videoFilename }, 'FFmpeg recording saved successfully');

        // Generate thumbnail LOCALLY from the saved video file.
        // This saves bandwidth and ensures sync.
        this.generateThumbnailFromVideo(videoPath, thumbPath, async () => {
          // Save event to DB only after thumbnail is ready
          const newEvent = await db.addEvent({
            cameraId: config.id,
            type: eventType,
            videoPath: `/recordings/${videoFilename}`,
            thumbnailPath: `/thumbnails/${thumbFilename}`,
          });

          log.info({ eventId: newEvent.id, cameraId: config.id }, 'New security event saved and emitted to EventBus');
          eventBus.emit('new-security-event', newEvent);
        });

      } else {
        log.error({ cameraId: config.id, exitCode: code }, 'FFmpeg recording process failed');
      }
    });
  }

  // 3. LOCAL THUMBNAIL GENERATOR
  private generateThumbnailFromVideo(videoPath: string, thumbPath: string, callback: () => void) {
    const ffmpeg = spawn('ffmpeg', [
      '-y',
      '-i', videoPath,   // Local input (very fast, no network needed)
      '-ss', '00:00:01', // Extract frame at 1 second mark
      '-frames:v', '1',
      '-q:v', '2',
      thumbPath
    ]);

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        log.info({ thumbPath }, 'Thumbnail generated from video');
      } else {
        // Non-fatal: the event will still be saved, a placeholder will be shown in the UI
        log.warn({ thumbPath, exitCode: code }, 'Thumbnail generation failed, placeholder will be used');
      }
      callback();
    });
  }

  public startSimulation() {
    if (this.isSimulating) return;
    this.isSimulating = true;

    const runSimulationStep = async () => {
      // 1. Pick a random camera
      const config = this.configs[Math.floor(Math.random() * this.configs.length)];

      // 2. Look for existing recordings to simulate a real event
      try {
        const recordingsDir = path.join(process.cwd(), 'public', 'recordings');
        const videos = fs.readdirSync(recordingsDir).filter(f => f.endsWith('.mp4'));

        if (videos.length === 0) return;

        const randomVideo = videos[Math.floor(Math.random() * videos.length)];
        const timestampPart = randomVideo.split('_').pop()?.replace('.mp4', '');
        const randomThumb = `thumb_${config.id}_${timestampPart}.jpg`;

        // Verification and fallback for mock thumbnails
        let thumbPath = `/thumbnails/${randomThumb}`;
        if (!fs.existsSync(path.join(process.cwd(), 'public', 'thumbnails', randomThumb))) {
          const thumbs = fs.readdirSync(path.join(process.cwd(), 'public', 'thumbnails')).filter(f => f.endsWith('.jpg'));
          if (thumbs.length > 0) thumbPath = `/thumbnails/${thumbs[0]}`;
        }

        log.info({ cameraId: config.id, cameraName: config.name }, 'Simulator: generating mock security event');

        const newEvent = await db.addEvent({
          cameraId: config.id,
          type: 'person',
          videoPath: `/recordings/${randomVideo}`,
          thumbnailPath: thumbPath,
        });
        eventBus.emit('new-security-event', newEvent);
      } catch (err) {
        log.error({ err }, 'Simulator: failed to generate mock event');
      }

      // Schedule next event (between 1 and 3 minutes)
      const nextDelay = (1 + Math.random() * 2) * 60 * 1000;
      this.simulationInterval = setTimeout(runSimulationStep, nextDelay);
    };

    // First mock event appears 5 seconds after activation
    setTimeout(runSimulationStep, 5000);
  }

  public stopSimulation() {
    if (this.simulationInterval) {
      clearTimeout(this.simulationInterval);
      this.simulationInterval = null;
    }
    this.isSimulating = false;
  }
}

export const getCameraManager = () => {
  if (!global.__CAMERA_MANAGER__) {
    global.__CAMERA_MANAGER__ = new CameraManager();
  }
  return global.__CAMERA_MANAGER__;
};