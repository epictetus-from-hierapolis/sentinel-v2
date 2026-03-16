import { EventEmitter } from "events";

/**
 * GLOBAL EVENT BUS (Singleton Pattern)
 * Used for inter-module communication within the server.
 * Example: CameraManager emits an event, and the API/Sockets can react to it.
 */

declare global {
    var __EVENT_BUS__: EventEmitter | undefined;
}

if (!global.__EVENT_BUS__) {
    global.__EVENT_BUS__ = new EventEmitter();
    // Increase listeners limit to prevent memory leak warnings (default is 10)
    global.__EVENT_BUS__.setMaxListeners(20);
}

export const eventBus = global.__EVENT_BUS__ as EventEmitter;