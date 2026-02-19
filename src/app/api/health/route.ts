import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';

/**
 * GET /api/health
 *
 * Health check endpoint used by Docker to verify the container is alive and ready.
 * It performs a lightweight database ping to confirm the app is fully operational.
 *
 * Returns 200 OK  → container is healthy
 * Returns 503     → container is starting up or the DB is unreachable
 */
export async function GET() {
    try {
        // Run a minimal query to confirm the database connection is alive.
        // $queryRaw is the lightest possible check — no table scan, no data returned.
        await prisma.$queryRaw`SELECT 1`;

        return NextResponse.json(
            { status: 'ok', timestamp: new Date().toISOString() },
            { status: 200 }
        );
    } catch (error) {
        // If the DB is unreachable, report unhealthy so Docker can act accordingly.
        return NextResponse.json(
            { status: 'error', message: 'Database unreachable' },
            { status: 503 }
        );
    }
}
