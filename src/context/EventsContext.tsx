"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Camera, SecurityEvent } from '@/types';

interface EventsContextType {
    events: SecurityEvent[]; // Combined or current view events
    cameras: Camera[];
    unreadCount: number;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    deleteEvent: (id: string) => void;
    isLoading: boolean;
    isLoadingMore: boolean;
    hasMore: boolean;
    error: string | null;
    retry: () => void;
    fetchMore: () => Promise<void>;
    clearTabData: (tab: 'unread' | 'all') => void;
    activeToast: SecurityEvent | null;
    activeTab: 'unread' | 'all';
    setActiveTab: (tab: 'unread' | 'all') => void;
}

type EventsProviderProp = {
    children: React.ReactNode
}

const EventsContext = createContext<EventsContextType | undefined>(undefined);

export function EventsProvider({ children }: EventsProviderProp) {
    // States for New (Unread) events
    const [unreadEvents, setUnreadEvents] = useState<SecurityEvent[]>([]);
    const [hasMoreUnread, setHasMoreUnread] = useState(true);

    // States for Archive (All) events
    const [allEvents, setAllEvents] = useState<SecurityEvent[]>([]);
    const [hasMoreAll, setHasMoreAll] = useState(true);

    const [cameras, setCameras] = useState<Camera[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [activeToast, setActiveToast] = useState<SecurityEvent | null>(null);
    const [activeTab, setActiveTab] = useState<'unread' | 'all'>('unread');

    const [serverUnreadCount, setServerUnreadCount] = useState(0);

    // The events exposed to the UI depend on the active tab
    const events = useMemo(() => {
        return activeTab === 'unread' ? unreadEvents : allEvents;
    }, [activeTab, unreadEvents, allEvents]);

    const hasMore = activeTab === 'unread' ? hasMoreUnread : hasMoreAll;

    const unreadCount = serverUnreadCount;


    const triggerToast = useCallback((event: SecurityEvent) => {
        setActiveToast(event);
        setTimeout(() => setActiveToast(null), 5000);
    }, []);

    // --- FETCH LOGIC ---
    const fetchData = useCallback(async (reset = false) => {
        try {
            const currentList = activeTab === 'unread' ? unreadEvents : allEvents;
            if (reset || currentList.length === 0) setIsLoading(true);
            setError(null);

            // Scroll Restoration Support: Read how many items were loaded previously for this tab
            const scrollKey = `scroll-count-${activeTab}`;
            const savedCount = sessionStorage.getItem(scrollKey);
            // Optimization: Cap the initial restoration to avoid rendering freezes
            const initialLimit = savedCount ? Math.min(40, Math.max(20, parseInt(savedCount))) : 20;

            const [unreadResponse, camerasResponse] = await Promise.all([
                fetch(`/api/events?unread=true&limit=${activeTab === 'unread' ? initialLimit : 20}`),
                fetch('/api/cameras')
            ]);


            if (!unreadResponse.ok || !camerasResponse.ok) throw new Error('Error connecting to server');

            const unreadData = await unreadResponse.json();
            const camerasData = await camerasResponse.json();

            setUnreadEvents(unreadData.events);
            setHasMoreUnread(unreadData.pagination.hasMore);
            setServerUnreadCount(unreadData.pagination.total);
            setCameras(camerasData);

            // If we are on 'all' tab, fetch those too
            if (activeTab === 'all') {
                const allRes = await fetch(`/api/events?limit=${initialLimit}`);
                const allData = await allRes.json();
                setAllEvents(allData.events);
                setHasMoreAll(allData.pagination.hasMore);
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : "Unknown error");
        } finally {
            setIsLoading(false);
        }
    }, [activeTab]);

    const fetchMore = useCallback(async () => {
        if (isLoadingMore || !hasMore) return;

        setIsLoadingMore(true);
        try {
            const currentList = activeTab === 'unread' ? unreadEvents : allEvents;
            const lastTimestamp = currentList.length > 0 ? currentList[currentList.length - 1].timestamp : undefined;

            const url = `/api/events?limit=20&unread=${activeTab === 'unread'}${lastTimestamp ? `&before=${lastTimestamp}` : ''}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch more events');

            const data = await response.json();

            if (activeTab === 'unread') {
                setUnreadEvents(prev => [...prev, ...data.events]);
                setHasMoreUnread(data.pagination.hasMore);
            } else {
                setAllEvents(prev => [...prev, ...data.events]);
                setHasMoreAll(data.pagination.hasMore);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoadingMore(false);
        }
    }, [activeTab, unreadEvents, allEvents, hasMore, isLoadingMore]);

    // --- SSE Logic ---
    useEffect(() => {
        let isMounted = true;
        const eventSource = new EventSource('/api/stream');

        let eventQueue: SecurityEvent[] = [];
        let batchTimer: NodeJS.Timeout | null = null;

        const processQueue = () => {
            if (eventQueue.length > 0 && isMounted) {
                // IMPORTANT: Capture a copy before clearing, because React state updaters
                // run asynchronously and might see an empty array otherwise!
                const eventsToAdd = [...eventQueue];
                const countToAdd = eventsToAdd.length;
                eventQueue = [];

                // SSE events are always unread
                setUnreadEvents(prev => [...eventsToAdd, ...prev]);
                setAllEvents(prev => [...eventsToAdd, ...prev]);
                setServerUnreadCount(prev => prev + countToAdd);

                triggerToast(eventsToAdd[0]);
            }
            batchTimer = null;
        };

        eventSource.onmessage = (msg) => {
            if (!isMounted) return;
            console.log('📡 [SSE Client] Message received');
            try {
                const data = JSON.parse(msg.data);
                if (data.type === 'connected') {
                    console.log('🔗 [SSE Client] Connection established');
                    return;
                }

                if (data && data.id) {
                    console.log(`🚨 [SSE Client] New event received: ${data.id}`);
                    eventQueue.push(data);
                    if (!batchTimer) {
                        batchTimer = setTimeout(processQueue, 100);
                    }
                }
            } catch (e) {
                console.error('❌ [SSE Client] Parse error:', e);
            }
        };

        return () => {
            isMounted = false;
            eventSource.close();
        };
    }, [triggerToast]);

    // --- Actions ---
    const markAsRead = useCallback(async (id: string) => {
        // 1. Check if the event is actually unread in our current state
        const eventInUnread = unreadEvents.find(ev => ev.id === id);
        const eventInAll = allEvents.find(ev => ev.id === id);
        const isCurrentlyUnread = (eventInUnread && !eventInUnread.isRead) || (eventInAll && !eventInAll.isRead);

        if (isCurrentlyUnread) {
            setServerUnreadCount(prev => Math.max(0, prev - 1));
        }

        // 2. Optimistic UI Update
        const updateFn = (prev: SecurityEvent[]) => prev.map(ev => ev.id === id ? { ...ev, isRead: true } : ev);
        setUnreadEvents(updateFn);
        setAllEvents(updateFn);

        try {
            await fetch(`/api/events/${id}`, { method: 'PATCH' });
        } catch (e) {
            console.error(e);
        }
    }, [unreadEvents, allEvents]);

    const markAllAsRead = useCallback(async () => {
        // Marks all unread events as read on the backend.
        // Performs an optimistic UI update for instant feedback by clearing the unread list
        // and resetting the counter.
        setServerUnreadCount(0);
        const updateFn = (prev: SecurityEvent[]) => prev.map(ev => ({ ...ev, isRead: true }));
        setUnreadEvents([]);
        setAllEvents(updateFn);

        try {
            await fetch('/api/events/read-all', { method: 'PATCH' });
        } catch (e) {
            console.error("❌ API Error [markAllAsRead]:", e);
            fetchData(); // Rollback/Refresh state from server on failure
        }
    }, [fetchData]);

    const clearTabData = useCallback((tab: 'unread' | 'all') => {
        // Memory Optimization: Clears the state for the specified tab.
        // Used when explicitly switching away from a tab to ensure the next 
        // focus starts with a fresh, manageable batch of items.
        if (tab === 'unread') {
            setUnreadEvents([]);
            setHasMoreUnread(true);
        } else {
            setAllEvents([]);
            setHasMoreAll(true);
        }
    }, []);

    const deleteEvent = useCallback(async (id: string) => {
        setUnreadEvents(prev => prev.filter(ev => ev.id !== id));
        setAllEvents(prev => prev.filter(ev => ev.id !== id));

        try {
            await fetch(`/api/events/${id}`, { method: 'DELETE' });
        } catch (e) {
            fetchData();
        }
    }, [fetchData]);

    // Initial Load
    useEffect(() => {
        fetchData(true);
    }, []); // Only once

    // Automatically fetch events when a tab is selected and its list is empty
    // (e.g., after the user switches back to a tab that had its memory cleared)
    useEffect(() => {
        const currentList = activeTab === 'unread' ? unreadEvents : allEvents;
        const currentHasMore = activeTab === 'unread' ? hasMoreUnread : hasMoreAll;

        if (currentList.length === 0 && !isLoading && currentHasMore) {
            fetchData();
        }
    }, [activeTab, unreadEvents.length, allEvents.length, isLoading, hasMoreUnread, hasMoreAll, fetchData]);


    return (
        <EventsContext.Provider value={{
            events,
            unreadCount,
            markAsRead,
            markAllAsRead,
            deleteEvent,
            isLoading,
            isLoadingMore,
            hasMore,
            cameras,
            error,
            retry: () => fetchData(true),
            fetchMore,
            clearTabData,
            activeToast,
            activeTab,
            setActiveTab
        }}>
            {children}
        </EventsContext.Provider>
    );
}

export const useEvents = () => {
    const context = useContext(EventsContext);
    if (!context) throw new Error('useEvents must be used within an EventsProvider');
    return context;
}