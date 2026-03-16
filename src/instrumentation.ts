import { logger } from '@/lib/logger';

// Create a child logger scoped to the boot/instrumentation phase.
// This makes it easy to filter startup logs separately in production.
const log = logger.child({ module: 'instrumentation' });

export async function register() {
    // Only run in the Node.js runtime (the real server environment).
    // This guard prevents execution in the Edge Runtime (middleware, etc.).
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        log.info('Sentinel system booting up...');

        // Import CameraManager lazily to avoid Edge Runtime import issues.
        const { getCameraManager } = await import('@/lib/server/camera-manager');
        const manager = getCameraManager();
        manager.startMonitoring();
    }
}