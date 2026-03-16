import { NextRequest, NextResponse } from 'next/server';
import { eventBus } from '@/lib/server/event-bus';

// Mark this route as dynamic (no caching)
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Create a ReadableStream (continuous data flow)
  const stream = new ReadableStream({
    start(controller) {

      // Function to send data to the browser
      const sendEvent = (data: any) => {
        console.log(`📡 [SSE] Sending event to client: ${data.id || data.type}`);
        // SSE format requires "data: ..." followed by two newlines
        const message = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(new TextEncoder().encode(message));
      };

      console.log('🔗 [SSE] Client connected to Sentinel Stream');
      // Subscribe to the internal event bus
      eventBus.on('new-security-event', sendEvent);

      // Send a "Keep-Alive" message (optional, to verify connection)
      sendEvent({ type: 'connected', message: 'Sentinel Stream Online' });

      // IMPORTANT: Unsubscribe when the browser closes the connection
      // This prevents connection leaks and server memory issues
      req.signal.addEventListener('abort', () => {
        eventBus.off('new-security-event', sendEvent);
      });
    }
  });

  // Return response with SSE headers
  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}