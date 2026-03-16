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
    console.log(`[EventBus] Initializing global bus in process ${process.pid}`);
    global.__EVENT_BUS__ = new EventEmitter();
    global.__EVENT_BUS__.setMaxListeners(20);
}

export const eventBus = global.__EVENT_BUS__ as EventEmitter;