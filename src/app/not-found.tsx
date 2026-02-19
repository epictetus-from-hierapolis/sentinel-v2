import { t } from '@/lib/dictionary';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col p-6">
      {/* Content container, positioned at 1/4 of the viewport height */}
      <div className="mt-[20vh] flex flex-col items-center text-center w-full">

        {/* Element vizual */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-blue-500/10 blur-3xl rounded-full" />
          <div className="relative border-2 border-white/5 w-20 h-20 rounded-3xl flex items-center justify-center bg-slate-900 shadow-2xl">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
        </div>

        {/* Text */}
        <h1 className="text-xl font-black text-white uppercase tracking-tighter mb-2">
          {t.errors.source_unavailable}
        </h1>

        <p className="text-slate-400 text-sm max-w-[280px] leading-relaxed mb-10">
          {t.errors.not_found_desc}
        </p>

        {/* Set global dark theme */}
        <Link
          href="/"
          className="w-full max-w-xs bg-blue-600 hover:bg-blue-500 text-white text-xs font-black py-4 rounded-2xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
          {t.actions.go_back_to_cameras}
        </Link>

        {/* Discrete error code at the bottom of the screen */}
        <p className="mt-12 text-[10px] font-mono text-slate-700 uppercase tracking-[0.3em]">
          {t.errors.error_404}
        </p>
      </div>
    </div>
  );
}