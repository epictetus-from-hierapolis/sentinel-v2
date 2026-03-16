"use client";

import Image from 'next/image';
import { SecurityEvent } from "@/types";
import LinkButton from './LinkButton';
import { t, getEventLabel } from '@/lib/dictionary';
import React, { useState, memo } from 'react';

interface EventCardProps {
    event: SecurityEvent;
    cameraName: string;
}

// EventCard is wrapped in React.memo to skip re-rendering when parent state changes 
// unless its specific 'event' or 'cameraName' props have actually changed.
const EventCard = memo(function EventCard({ event, cameraName }: EventCardProps) {
    const [isLoading, setIsLoading] = useState(true);

    // Optimized time formatting to avoid creating new object instances on every render.
    const formattedTime = React.useMemo(() => {
        return new Date(event.timestamp).toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }, [event.timestamp]);

    return (
        <div className={`
            relative flex flex-col bg-slate-900 rounded-2xl border overflow-hidden shadow-lg transition-all
            ${event.isRead ? 'border-white/5 opacity-80 hover:opacity-100' : 'border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.1)] animate-new-alert'}
        `}>
            {/* 1. Image Area */}
            <div className="relative aspect-video bg-slate-950 group overflow-hidden shrink-0">

                {/* SPINNER (Visible during loading) */}
                {isLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-10">
                        <svg className="w-6 h-6 text-slate-600 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </div>
                )}

                <Image
                    src={event.thumbnailPath || '/placeholder-camera.jpg'}
                    alt={`${t.common.camera} ${cameraName}`}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className={`object-cover transition-all duration-700 group-hover:scale-110 ${isLoading ? 'opacity-0' : 'opacity-90'}`}
                    onLoad={() => setIsLoading(false)}
                />

                {/* Status/Type Badge Overlay */}
                <div className="absolute top-3 left-3 flex gap-2 z-20">
                    {!event.isRead && (
                        <span className="bg-blue-600 text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider shadow-lg">
                            {t.status.new}
                        </span>
                    )}
                    <span className="bg-black/60 backdrop-blur-md text-[10px] font-bold px-2 py-1 rounded-lg border border-white/10 text-white uppercase tracking-widest">
                        {getEventLabel(event.type)}
                    </span>
                </div>

                {/* Time Overlay */}
                <span className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md text-[10px] font-mono px-2 py-1 rounded-md border border-white/5 text-white/80 z-20">
                    {formattedTime}
                </span>

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 pointer-events-none z-10" />
            </div>

            {/* 2. Info & Actions */}
            <div className="p-4 flex justify-between items-center bg-slate-900 relative z-30">
                <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">{t.common.camera}</p>
                    <h3 className="text-xs text-slate-200 font-semibold truncate max-w-[120px]">{cameraName}</h3>
                </div>

                <div className="flex justify-end pt-2">
                    <LinkButton href={`/events/${event.id}`} label={t.actions.details} />
                </div>
            </div>
        </div>
    );
});

export default EventCard;