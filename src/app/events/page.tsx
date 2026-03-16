"use client";
import { useState, useEffect, useLayoutEffect, useMemo } from 'react';
import { useEvents } from '@/context/EventsContext';
import EventCard from '@/components/EventCard';
import EventSkeleton from '@/components/EventSkeleton';
import ErrorDisplay from '@/components/ErrorDisplay';
import { SecurityEvent } from '@/types';
import { t } from '@/lib/dictionary';

export default function EventsPage() {
  const {
    events,
    cameras,
    unreadCount,
    isLoading,
    isLoadingMore,
    hasMore,
    fetchMore,
    error,
    retry,
    markAsRead,
    markAllAsRead,
    activeTab,
    setActiveTab,
    clearTabData
  } = useEvents();

  // --- 1. FILTERING (Strict Unread) ---
  const filteredEvents = useMemo(() => {
    if (activeTab === 'all') return events;
    // Strictly only unread events
    return events.filter((e: SecurityEvent) => !e.isRead);
  }, [events, activeTab]);

  // --- 2. INFINITE SCROLL OBSERVER ---
  const [loadMoreRef, setLoadMoreRef] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasMore || isLoadingMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchMore();
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );

    if (loadMoreRef) {
      observer.observe(loadMoreRef);
    }

    return () => observer.disconnect();
  }, [loadMoreRef, hasMore, isLoadingMore, isLoading, fetchMore]);

  // --- 3. ROBUST SCROLL RESTORATION ---
  const scrollKey = `scroll-pos-${activeTab}`;
  const countKey = `scroll-count-${activeTab}`;

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    const handleScroll = () => {
      if (window.scrollY > 0) {
        sessionStorage.setItem(scrollKey, window.scrollY.toString());
        // Save how many events we have loaded to restore the same items on back
        sessionStorage.setItem(countKey, events.length.toString());
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrollKey, countKey, events.length]);

  useLayoutEffect(() => {
    if (!isLoading && filteredEvents.length > 0) {
      const savedPos = sessionStorage.getItem(scrollKey);
      if (savedPos && parseInt(savedPos) > 0) {
        const target = parseInt(savedPos);

        const performScroll = () => {
          window.scrollTo(0, target);
        };

        performScroll();
        const t1 = setTimeout(performScroll, 30);
        const t2 = setTimeout(performScroll, 100);
        const t3 = setTimeout(performScroll, 300);

        return () => {
          clearTimeout(t1);
          clearTimeout(t2);
          clearTimeout(t3);
        };
      }
    }
  }, [isLoading, filteredEvents.length, activeTab, scrollKey]);

  // --- 5. UI OPTIONS ---
  const [showTopButton, setShowTopButton] = useState(false);
  useEffect(() => {
    const checkScroll = () => setShowTopButton(window.scrollY > 600);
    window.addEventListener('scroll', checkScroll);
    return () => window.removeEventListener('scroll', checkScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const handleMarkAllRead = () => {
    markAllAsRead();
  };

  if (error) return <ErrorDisplay message={error} onRetry={retry} />;

  return (
    <main className="flex-1 max-w-full mx-auto w-full px-1 pt-4 pb-[calc(2rem+env(safe-area-inset-bottom))] flex flex-col">
      {/* Actions Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-white/5 shadow-2xl">
          <button
            onClick={() => {
              if (activeTab !== 'unread') {
                clearTabData('all'); // Clear memory of the tab we are leaving
                setActiveTab('unread');
              }
              sessionStorage.removeItem(`scroll-pos-unread`);
              sessionStorage.removeItem(`scroll-count-unread`);
              window.scrollTo(0, 0);
            }}
            className={`relative px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'unread' ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]' : 'text-slate-400 hover:text-white'
              }`}
          >
            {t.tabs.new}
            {unreadCount > 0 && (
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${activeTab === 'unread' ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'
                }`}>
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => {
              if (activeTab !== 'all') {
                clearTabData('unread'); // Clear memory of the tab we are leaving
                setActiveTab('all');
              }
              sessionStorage.removeItem(`scroll-pos-all`);
              sessionStorage.removeItem(`scroll-count-all`);
              window.scrollTo(0, 0);
            }}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'all' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
          >
            {t.tabs.history}
          </button>
        </div>
      </div>

      {activeTab === 'unread' && filteredEvents.length > 0 && (
        <div className="flex justify-end mb-4 px-2">
          <button onClick={handleMarkAllRead} className="text-[10px] uppercase tracking-widest text-blue-400 hover:text-blue-300 flex items-center gap-2 transition-colors font-black">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 7 17l-5-5" /><path d="m22 10-7.5 7.5L13 16" /></svg>
            {t.actions.mark_all_read}
          </button>
        </div>
      )}

      {isLoading && events.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-2">
          {Array.from({ length: 8 }).map((_, i) => <EventSkeleton key={i} />)}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 py-20 text-slate-500">
          <div className="bg-slate-900/50 p-6 rounded-full mb-4 border border-white/5">
            {activeTab === 'unread' ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-500/50">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600">
                <circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" />
              </svg>
            )}
          </div>
          <h3 className="text-lg font-bold text-white mb-1">
            {activeTab === 'unread' ? t.empty_states.up_to_date : t.empty_states.history_empty}
          </h3>
          <p className="text-sm text-slate-400">
            {activeTab === 'unread' ? t.empty_states.no_new_events : t.empty_states.db_empty}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-2">
            {filteredEvents.map((event: SecurityEvent) => {
              const camera = cameras.find((c: any) => c.id === event.cameraId);
              return (
                <div key={event.id}>
                  <EventCard event={event} cameraName={camera?.name || t.common.not_available} />
                </div>
              );
            })}
          </div>

          {/* INFINITE SCROLL TARGET */}
          <div ref={setLoadMoreRef} className="w-full h-20 flex items-center justify-center mt-8">
            {isLoadingMore && (
              <div className="flex items-center gap-3 text-blue-400">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-bold uppercase tracking-widest">Loading older events...</span>
              </div>
            )}
            {!hasMore && events.length > 0 && (
              <div className="text-slate-600 text-xs font-bold uppercase tracking-widest py-8">
                — End of {activeTab === 'unread' ? 'new events' : 'history'} —
              </div>
            )}
          </div>
        </>
      )}

      {showTopButton && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-28 right-6 z-50 bg-blue-600 text-white p-3 rounded-full shadow-2xl border border-white/20 hover:scale-110 active:scale-95 transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6" /></svg>
        </button>
      )}
    </main>
  );
}