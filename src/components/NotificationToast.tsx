"use client";

import { useEvents } from '@/context/EventsContext';
import { SecurityEvent } from '@/types';
import { t } from '@/lib/dictionary';
import Image from 'next/image';
import { useEffect, useState } from 'react';

export default function NotificationToast() {
    const { activeToast, cameras } = useEvents();

    // 1. Local state for data (prevents text from disappearing during exit animation)
    const [toastToShow, setToastToShow] = useState<SecurityEvent | null>(null);

    // 2. Visibility state (controls CSS opacity/translate)
    const [isVisible, setIsVisible] = useState(false);

    // 3. Image state (fallback)
    const [imgSrc, setImgSrc] = useState<string>('/placeholder-camera.jpg');
    const [isImgLoading, setIsImgLoading] = useState(true);

    useEffect(() => {
        if (activeToast) {
            setIsImgLoading(true); // Reset loading on new toast
        }
    }, [activeToast]);

    useEffect(() => {
        let entryDataTimer: NodeJS.Timeout;
        let entryAnimTimer: NodeJS.Timeout;
        let exitAnimTimer: NodeJS.Timeout;
        let exitDataTimer: NodeJS.Timeout;

        if (activeToast) {
            // === ENTRANCE (New Event) ===

            // Step 1: Set data (Async - prevents React state error)
            entryDataTimer = setTimeout(() => {
                setToastToShow(activeToast);
                setImgSrc(activeToast.thumbnailPath || '/placeholder-camera.jpg');

                // Step 2: Start visual animation (Small delay to allow DOM rendering)
                entryAnimTimer = setTimeout(() => {
                    setIsVisible(true);
                }, 50);
            }, 10);

        } else {
            // === EXIT (Event Cleared / Expired) ===

            // Step 1: Start exit animation (Async - prevents React state error)
            exitAnimTimer = setTimeout(() => {
                setIsVisible(false);
            }, 10);

            // Step 2: Clear data from DOM after CSS transition finishes (500ms)
            exitDataTimer = setTimeout(() => {
                setToastToShow(null);
            }, 500);
        }

        // Complete cleanup: Stops any timers if state changes rapidly
        return () => {
            clearTimeout(entryDataTimer);
            clearTimeout(entryAnimTimer);
            clearTimeout(exitAnimTimer);
            clearTimeout(exitDataTimer);
        };
    }, [activeToast]);

    // If no local data, don't render anything
    if (!toastToShow) return null;

    // --- RENDER ---

    const cameraName = cameras.find(c => c.id === toastToShow.cameraId)?.name
        || `CAM_${toastToShow.cameraId}`;

    const eventType = toastToShow.type === 'person' ? t.status.person_detected : t.status.motion_detected;

    return (
        <div
            className={`fixed top-20 left-0 w-full z-[100] transition-all duration-500 transform ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
                }`}
        >
            <div className="bg-slate-950/95 backdrop-blur-3xl border-b border-blue-500/30 shadow-[0_10px_40px_rgba(0,0,0,0.7)]">

                {/* Visual Scanner Bar */}
                <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50 shadow-[0_0_8px_#3b82f6]" />

                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">

                    {/* Image */}
                    <div className="relative group flex-shrink-0 w-20 h-14 sm:w-16 sm:h-12">
                        <div className="w-full h-full rounded bg-slate-900 overflow-hidden border border-white/10 relative flex items-center justify-center">
                            {isImgLoading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-10">
                                    <div className="w-4 h-4 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                                </div>
                            )}
                            <Image
                                key={toastToShow.id}
                                src={imgSrc}
                                alt="Security Scan"
                                width={128}
                                height={96}
                                className={`w-full h-full object-cover transition-opacity duration-500 ${isImgLoading ? 'opacity-0' : 'opacity-80'}`}
                                unoptimized={true}
                                onLoad={() => setIsImgLoading(false)}
                                onError={() => {
                                    setImgSrc('/placeholder-camera.jpg');
                                    setIsImgLoading(false);
                                }}
                            />

                            {/* Overlays */}
                            <div className="absolute inset-0 bg-blue-900/20 mix-blend-overlay" />
                            <div className="absolute inset-0 border border-blue-500/20 shadow-[inset_0_0_10px_rgba(59,130,246,0.3)]" />
                        </div>
                        {/* Focus Corners */}
                        <div className="absolute -top-1 -left-1 w-2 h-2 border-t border-l border-blue-500" />
                        <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b border-r border-blue-500" />
                    </div>

                    {/* Text Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                            <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-400/90">
                                System Alert // {t.common.live}
                            </span>
                        </div>

                        <h3 className="text-sm font-bold text-white uppercase tracking-tight flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                            <span>{eventType}</span>
                            <span className="hidden sm:inline text-slate-500 text-[10px]">|</span>
                            <span className="text-blue-200/60 font-mono text-[11px] truncate">
                                {cameraName}
                            </span>
                        </h3>
                    </div>

                    {/* Timestamp & Close */}
                    <div className="flex items-center gap-4">
                        <div className="hidden sm:block text-right">
                            <p className="text-[10px] font-mono text-slate-500">TIMESTAMP</p>
                            <p className="text-[10px] font-mono text-blue-400">
                                {new Date(toastToShow.timestamp).toLocaleTimeString('en-GB')}
                            </p>
                        </div>

                        <div className="h-10 w-[1px] bg-white/5 hidden sm:block" />

                        <div
                            className="text-blue-500 group cursor-pointer hover:text-blue-400 transition-colors p-2"
                            onClick={() => setIsVisible(false)} // Manual close
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-pulse">
                                <path d="m6 17 5-5-5-5M13 17l5-5-5-5" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                {isVisible && (
                    <div className="h-1 bg-white/10 w-full overflow-hidden">
                        <div
                            className="h-full bg-blue-500 shadow-[0_0_10px_#3b82f6]"
                            style={{
                                animation: 'shrink 5s linear forwards'
                            }}
                        />
                        <style jsx>{`
                            @keyframes shrink {
                                from { width: 100%; }
                                to { width: 0%; }
                            }
                        `}</style>
                    </div>
                )}
            </div>
        </div>
    );
}