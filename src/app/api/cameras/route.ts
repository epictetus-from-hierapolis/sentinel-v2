import { NextResponse } from "next/server";
import { getCameraManager } from '@/lib/server/camera-manager';

// Force dynamic rendering to bypass caching.
// We need real-time status (Online/Offline) for all cameras.
export const dynamic = 'force-dynamic';

export async function GET() {
     const manager = getCameraManager();

     // Fetch active camera configurations from the manager
     const cameras = manager.getPublicConfig();
     return NextResponse.json(cameras);
}