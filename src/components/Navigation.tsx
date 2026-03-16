"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { t } from '@/lib/dictionary';
import BackButton from './header/BackButton';

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();

  // Check if current page is an event detail page
  const isDetailPage = pathname.includes('/events/');

  return (
    // 'box-content' and 'pt-[env(safe-area-inset-top)]' ensure the nav bar doesn't collide
    // with mobile status bars or notches (Safe Area support).
    <nav className="fixed top-0 left-0 right-0 h-16 pt-[env(safe-area-inset-top)] bg-slate-900/80 backdrop-blur-md border-b border-white/5 z-50 px-4 flex items-center justify-between box-content">

      <div className="flex items-center gap-4">
        {isDetailPage ? (
          <BackButton
            label={t.common.back_to_events}
            onBackClick={() => router.back()}
          />
        ) : (
          <Link href="/events" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.5)] group-hover:scale-105 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
              </svg>
            </div>
            <span className="font-bold text-lg tracking-tight text-white">
              Sentinel <span className="text-blue-500">Hub</span>
            </span>
          </Link>
        )
        }
      </div>

    </nav>
  );
}