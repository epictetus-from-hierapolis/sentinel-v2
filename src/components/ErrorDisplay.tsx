import { t } from '@/lib/dictionary';

interface ErrorDisplayProps {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorDisplay({ message, onRetry }: ErrorDisplayProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      {/* Styled error icon */}
      <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </div>

      <h2 className="text-xl font-black uppercase tracking-tighter text-white mb-2">
        {t.errors.connection_interrupted}
      </h2>

      <p className="text-slate-400 text-sm max-w-xs mb-8 font-medium leading-relaxed">
        {message || t.errors.not_found_desc}
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          className="group relative inline-flex items-center gap-2 px-8 py-3 bg-red-500/10 border border-red-500/30 rounded-xl transition-all hover:bg-red-500/20 active:scale-95"
        >
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500">
            {t.actions.retry}
          </span>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:rotate-180 transition-transform duration-500">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M3 21v-5h5" />
          </svg>
        </button>
      )}
    </div>
  );
}