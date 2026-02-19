import pino from 'pino';

/**
 * Centralized logger for the Sentinel Event Hub application.
 *
 * In development: logs are pretty-printed with colors and human-readable timestamps.
 * In production:  logs are emitted as structured JSON (ideal for Docker / log aggregators).
 *
 * Usage:
 *   import { logger } from '@/lib/logger';
 *   logger.info('Server started');
 *   logger.error({ err }, 'Something went wrong');
 *
 * Child loggers (add a persistent context field to every message):
 *   const cameraLog = logger.child({ module: 'camera-manager', cameraId: 'cam-01' });
 *   cameraLog.warn('Connection lost');
 */

const isDevelopment = process.env.NODE_ENV !== 'production';

const logger = pino({
    // Set the minimum log level.
    // In development we want to see everything (debug and above).
    // In production we only care about info and above to reduce noise.
    level: isDevelopment ? 'debug' : 'info',

    // In development, use pino-pretty for human-readable, colorized output.
    // In production, emit raw JSON so Docker / log collectors can parse it easily.
    transport: isDevelopment
        ? {
            target: 'pino-pretty',
            options: {
                colorize: true,           // Colorize log level labels
                translateTime: 'SYS:standard', // Human-readable timestamp (local time)
                ignore: 'pid,hostname',   // Hide pid and hostname to reduce clutter
            },
        }
        : undefined, // No transport in production → raw JSON to stdout

    // Base fields added to every log line in production JSON output.
    // Useful for filtering logs when multiple services share the same log stream.
    base: isDevelopment
        ? undefined // Skip base fields in dev (pino-pretty already shows enough)
        : { service: 'sentinel-hub' },
});

export { logger };
