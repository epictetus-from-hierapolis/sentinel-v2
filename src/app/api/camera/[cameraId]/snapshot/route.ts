import { NextRequest, NextResponse } from 'next/server';
import { getCameraManager } from '@/lib/server/camera-manager';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cameraId: string }> }
) {
  try {
    const resolvedParams = await params;
    const cameraId = resolvedParams.cameraId;

    const manager = getCameraManager();
    
    // Cerem snapshot de la manager
    const snapshotBuffer = await manager.takeSnapshot(cameraId);

    // Dacă nu reușim (eroare ffmpeg sau cameră offline), returnăm placeholder
    if (!snapshotBuffer) {
       console.warn(`⚠️ [Snapshot] Failed for ${cameraId}, serving placeholder.`);
       // Redirecționăm către un placeholder extern sau local
       return NextResponse.redirect('https://placehold.co/1280x720/0f172a/64748b?text=OFFLINE');
    }

    // FIXUL SUPREM PENTRU EROAREA DE BUFFER:
    // Folosim 'Response' standard din Web API, nu 'NextResponse'.
    // Acesta acceptă Buffer/ArrayBuffer nativ fără probleme de TypeScript.
    return new Response(snapshotBuffer as any, {
        status: 200,
        headers: {
          'Content-Type': 'image/jpeg',
          'Cache-Control': 'no-store, max-age=0', // Nu cache-uim niciodată snapshot-uri live
        },
    });

  } catch (error) {
    console.error("❌ [Snapshot Route Error]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}