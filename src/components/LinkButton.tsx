import Link from "next/link";
import { useState, useEffect } from "react";

type LinkButtonProps = {
    href: string;
    label: string;
}

export default function LinkButton({ href, label }: LinkButtonProps) {
    const [isNavigating, setIsNavigating] = useState(false);

    // Reset state if navigation takes too long (failsafe)
    useEffect(() => {
        if (isNavigating) {
            const timer = setTimeout(() => setIsNavigating(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [isNavigating]);

    return (
        <Link
            href={href}
            onClick={() => setIsNavigating(true)}
            // 'touch-manipulation' ensures instant tap feedback on mobile devices.
            // 'active:scale-95' simulates a haptic button press.
            className={`
                group relative inline-flex items-center justify-between gap-2.5 pl-3.5 pr-1 h-9 rounded-xl transition-all shadow-lg active:scale-95 touch-manipulation pb-[env(safe-area-inset-bottom)]
                ${isNavigating
                    ? 'bg-blue-600/30 border-blue-500/60 cursor-default shadow-[0_0_20px_rgba(59,130,246,0.4)] scale-[0.98]'
                    : 'bg-blue-600/10 border-blue-500/20 hover:bg-blue-600/20 hover:border-blue-500/40 shadow-blue-500/5 hover:shadow-blue-500/10'
                }
                border
            `}
            style={{ pointerEvents: isNavigating ? 'none' : 'auto' }}
        >
            {/* Textul cu aspect de buton premium */}
            <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${isNavigating ? 'text-blue-300' : 'text-blue-400 group-hover:text-blue-300'
                }`}>
                {label}
            </span>

            {/* Styled Icon */}
            <div className={`
                flex items-center justify-center w-7 h-7 rounded-lg transition-all shadow-md
                ${isNavigating ? 'bg-blue-400 shadow-blue-400/40 opacity-100' : 'bg-blue-500 shadow-blue-500/20 group-hover:translate-x-0.5'}
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
                        <path d="M5 12h14m-7-7 7 7-7 7" />
                    </svg>
                )}
            </div>
        </Link>
    )
}