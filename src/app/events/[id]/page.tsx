import { db } from '@/lib/server/db';
import { getCameraManager } from '@/lib/server/camera-manager';
import { notFound } from 'next/navigation';
import MarkAsReadTrigger from '@/components/MarkAsReadTrigger';
import { t, getEventLabel } from '@/lib/dictionary';

type EventDetailPageProp = {
  params: Promise<{ id: string }>
}

export default async function EventDetailPage({ params }: EventDetailPageProp) {
  const { id } = await params;
  const event = await db.getEvent(id);

  if (!event) notFound();

  const manager = getCameraManager();
  const cameras = manager.getPublicConfig();
  const camera = cameras.find((c) => c.id === event.cameraId);

  return (
    <div className="bg-slate-950 text-white min-h-screen pt-6 pb-[calc(3rem+env(safe-area-inset-bottom))] px-4 md:px-8 animate-in fade-in duration-500">
      {/* Manual Scroll Reset on Enter */}
      <script dangerouslySetInnerHTML={{ __html: 'window.scrollTo(0,0)' }} />

      {/* Auto Mark As Read Trigger */}
      <MarkAsReadTrigger eventId={id} />

      <main className="max-w-5xl mx-auto w-full">

        {/* VIDEO AREA */}
        <div className="w-full aspect-video bg-black flex items-center justify-center relative shadow-2xl border border-white/10 rounded-2xl overflow-hidden mb-8">
          <video
            src={event.videoPath}
            controls
            autoPlay
            className="w-full h-full object-contain z-10 focus:outline-none"
            poster={event.thumbnailPath}
            preload="metadata"
          />

          <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-slate-900/90 backdrop-blur px-3 py-1.5 rounded-lg border border-white/10 shadow-lg pointer-events-none">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span className="font-mono text-[10px] text-blue-200 uppercase tracking-widest">
              PLAYBACK
            </span>
          </div>
        </div>

        {/* INFO & DETAILS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {/* Card 1: CAMERA NAME */}
          <div className="bg-white/5 p-4 rounded-2xl border border-white/5 transition-all hover:bg-white/10">
            <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">{t.common.camera}</p>
            <p className="text-sm font-bold text-white truncate">{camera?.name || t.errors.camera_deleted}</p>
          </div>

          {/* Card 2: Date */}
          <div className="bg-white/5 p-4 rounded-2xl border border-white/5 transition-all hover:bg-white/10">
            <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">{t.common.date}</p>
            <p className="text-sm font-semibold">
              {new Date(event.timestamp).toLocaleDateString('en-GB')} {new Date(event.timestamp).toLocaleTimeString('en-GB')}
            </p>
          </div>

          {/* Card 3: Object */}
          <div className="bg-white/5 p-4 rounded-2xl border border-white/5 transition-all hover:bg-white/10">
            <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">{t.common.object}</p>
            <p className="text-sm font-semibold capitalize text-blue-400">
              {getEventLabel ? getEventLabel(event.type) : event.type}
            </p>
          </div>

          {/* Card 4: Location */}
          <div className="bg-white/5 p-4 rounded-2xl border border-white/5 transition-all hover:bg-white/10">
            <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">{t.common.zone}</p>
            <p className="text-sm font-semibold text-gray-300 capitalize">
              {camera?.location || t.common.not_available}
            </p>
          </div>
        </div>

      </main>
    </div>
  );
}