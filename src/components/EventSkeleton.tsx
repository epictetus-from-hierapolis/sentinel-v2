// src/components/EventSkeleton.tsx
export default function EventSkeleton() {
  return (
    <div className="bg-slate-900/50 rounded-2xl border border-white/5 overflow-hidden animate-pulse">
      {/* 1. Image Placeholder - maintaining aspect-video */}
      <div className="aspect-video bg-slate-800" />

      {/* 2. Padding matches the real card (P-4) */}
      <div className="p-4 flex flex-col gap-4">

        {/* Text Group */}
        <div className="space-y-2">
          {/* Camera name (simulating text-xs) */}
          <div className="h-2.5 w-24 bg-slate-800 rounded-full" />
          {/* Event type (simulating text-sm) */}
          <div className="h-4 w-32 bg-slate-800 rounded-full" />
        </div>

        {/* 3. Action Button Placeholder */}
        <div className="flex justify-end pt-2">
          <div className="flex items-center gap-2">
            <div className="h-2 w-16 bg-slate-800 rounded-full" /> {/* 'Details' text */}
            <div className="w-7 h-7 bg-slate-800 rounded-full" /> {/* Arrow circle */}
          </div>
        </div>
      </div>
    </div>
  );
}