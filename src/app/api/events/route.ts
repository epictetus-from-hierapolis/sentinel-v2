import { NextResponse } from 'next/server';
import { db } from '@/lib/server/db';

// Force dynamic rendering to ensure fresh data and bypass caching
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20;
  const beforeRaw = searchParams.get('before');
  // Handle both Unix timestamp (number) and ISO string (Date)
  const before = beforeRaw
    ? (isNaN(Number(beforeRaw)) ? new Date(beforeRaw) : new Date(parseInt(beforeRaw)))
    : undefined;
  const unreadOnly = searchParams.get('unread') === 'true';

  // 1. Fetch real events with cursor-based pagination
  const isRead = unreadOnly ? false : undefined;
  const events = await db.getEvents(before, limit, isRead);
  const total = await db.getCount(isRead);

  // 2. Return as JSON with pagination metadata
  const lastEvent = events.length > 0 ? events[events.length - 1] : null;

  return NextResponse.json({
    events,
    pagination: {
      total,
      limit,
      nextCursor: lastEvent ? lastEvent.timestamp.getTime() : null,
      hasMore: events.length === limit
    }
  });
}