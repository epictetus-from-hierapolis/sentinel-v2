import React, { useState } from "react";

type BackButtonProp = {
    label: string;
    onBackClick: React.MouseEventHandler<HTMLButtonElement>;
}

export default function BackButton({
    label,
    onBackClick }: BackButtonProp) {
    const [isNavigating, setIsNavigating] = useState(false);

    // Resetăm starea dacă navigarea durează prea mult (failsafe)
    // Sau dacă componenta rămâne montată după back (depinde de layout)
    React.useEffect(() => {
        if (isNavigating) {
            const timer = setTimeout(() => setIsNavigating(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [isNavigating]);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (isNavigating) return;
        setIsNavigating(true);
        onBackClick(e);
    };

    return (
        <button
            onClick={handleClick}
            disabled={isNavigating}
            className={`
                group relative inline-flex items-center justify-between gap-2.5 pl-1 pr-3.5 h-9 rounded-xl transition-all shadow-lg active:scale-95 touch-manipulation
                ${isNavigating
                    ? 'bg-blue-600/30 border-blue-500/60 cursor-default shadow-[0_0_20px_rgba(59,130,246,0.4)] scale-[0.98]'
                    : 'bg-blue-600/10 border-blue-500/20 hover:bg-blue-600/20 hover:border-blue-500/40 shadow-blue-500/5 hover:shadow-blue-500/10'
                }
                border
            `}
        >
            {/* Boxed Icon (Left side for Back button) */}
            <div className={`
                flex items-center justify-center w-7 h-7 rounded-lg transition-all shadow-md
                ${isNavigating ? 'bg-blue-400 shadow-blue-400/40 opacity-100' : 'bg-blue-500 shadow-blue-500/20 group-hover:-translate-x-0.5'}
                text-white
            `}>
                {isNavigating ? (
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14" height="14"
                        viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="4"
                        strokeLinecap="round" strokeLinejoin="round"
                    >
                        <path d="M19 12H5m7 7-7-7 7-7" />
                    </svg>
                )}
            </div>

            <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${isNavigating ? 'text-blue-300' : 'text-blue-400 group-hover:text-blue-300'
                }`}>
                {label}
            </span>
        </button>
    );
}