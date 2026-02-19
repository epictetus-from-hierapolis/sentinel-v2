"use client";

import { usePathname, useRouter } from 'next/navigation';
import BackButton from './BackButton';
import { t } from '@/lib/dictionary';
import { useEvents } from '@/context/EventsContext';
import { Camera, CameraStatus } from '@/types';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();

  // Logica pentru stabilirea contextului paginii
  const isRootPage = pathname === '/events';

  const getSubtitle = () => {
    if (pathname === '/events') return t.common.events;
    if (pathname.startsWith('/events/')) return t.common.archive;
    return 'DASHBOARD';
  };

  const handleBackClick = () => router.back();

  const { cameras } = useEvents();
  const isSimulation = cameras.length > 0 && cameras.every((c: Camera) => c.status === CameraStatus.OFFLINE);

  return (
    <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md px-4 border-b border-white/5 h-20 flex items-center justify-between">

      {/* 1. ZONA STÂNGA: Buton Back Minimalist */}
      <div className="flex-1">
        {!isRootPage && (
          <BackButton label={t.common.back || 'Înapoi'} onBackClick={handleBackClick} />
        )}
      </div>

      {/* 2. ZONA CENTRALĂ: Titlu Centrat Matematic */}
      <div className="flex-[2] text-center">
        <h1 className="text-sm sm:text-lg font-black uppercase tracking-tighter whitespace-nowrap">
          {t.navigation.sentinel} <span className="text-blue-500 transition-all duration-300">{getSubtitle()}</span>
        </h1>
      </div>

      {/* 3. ZONA DREAPTĂ: Indicator Status & Clock */}
      <div className="flex-1 flex justify-end items-center">
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-end">
              <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500 hidden xs:inline">
                {t.status.secured}
              </span>
              {isSimulation && (
                <span className="text-[7px] font-bold uppercase tracking-[0.1em] text-blue-500/60 hidden xs:inline">
                  {t.status.simulated}
                </span>
              )}
            </div>
            <div className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)] animate-pulse" />
          </div>
        </div>
      </div>

    </header>
  );
}