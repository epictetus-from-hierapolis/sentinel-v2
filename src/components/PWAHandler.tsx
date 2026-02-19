"use client";

import { useEffect } from 'react';

// Client-side bridge for PWA features.
// Registers the Service Worker to enable "Add to Home Screen" on Android browsers.
export default function PWAHandler() {
    useEffect(() => {
        if ('serviceWorker' in navigator && window.location.hostname !== 'localhost') {
            const register = () => {
                navigator.serviceWorker.register('/sw.js').then(
                    (reg) => console.log('SW registered: ', reg),
                    (err) => console.log('SW registration failed: ', err)
                );
            };

            if (document.readyState === 'complete') {
                register();
            } else {
                window.addEventListener('load', register);
                return () => window.removeEventListener('load', register);
            }
        }
    }, []);

    return null;
}
