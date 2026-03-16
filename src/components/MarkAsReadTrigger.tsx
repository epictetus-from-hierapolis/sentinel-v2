"use client";

import { useEffect, useRef } from 'react';
import { useEvents } from '@/context/EventsContext';

type MarkAsReadTriggerProp = {
    eventId: string;
}

export default function MarkAsReadTrigger({ eventId }: MarkAsReadTriggerProp) {

    const {events, markAsRead} = useEvents();
    const hasMarked = useRef(false);

    useEffect(()=>{
        const currentEvent = events.find(e => e.id === eventId);
        if(currentEvent && !currentEvent.isRead && !hasMarked.current) {
            markAsRead(eventId);
            hasMarked.current = true;
        }
    },[eventId, markAsRead, events]);    

    return null;
}