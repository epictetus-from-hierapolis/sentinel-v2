export const CameraStatus = {
    ONLINE: 'online',
    OFFLINE: 'offline',
    RECORDING: 'recording',
    ERROR: 'error'
} as const;

export type CameraStatusType = typeof CameraStatus[keyof typeof CameraStatus];

export const CameraLocation = {
    INTERIOR: 'interior',
    EXTERIOR: 'exterior',
    GARDEN: 'garden', // Optional, if needed in the future
} as const;

export type CameraLocationType = typeof CameraLocation[keyof typeof CameraLocation];

export interface Camera {
    id: string;
    name: string;
    location: CameraLocationType;
    status: CameraStatusType;
    ipAddress: string;
    credentials: {
        user: string;
        pass: string;
    };
    streamPath: string; // ex: /stream1
}

// Object detection type definitions
export type DetectionType = 'person' | 'motion' | 'vehicle' | 'animal';

export interface SecurityEvent {
    id: string;
    cameraId: string; // Foreign Key link to the Camera ID
    timestamp: Date;
    type: DetectionType;
    thumbnailPath?: string;
    videoPath: string;
    isRead: boolean;
}
