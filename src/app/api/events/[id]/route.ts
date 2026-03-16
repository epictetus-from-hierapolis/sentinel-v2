import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/server/db';
import fs from 'fs';
import path from 'path';

// MARK AS READ (PATCH /api/events/:id)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // In Next.js 15, params is a Promise
) {
  const { id } = await params;
  try {
    await db.markAsRead(id);
    return NextResponse.json({ success: true, message: 'Event marked as read' });
  } catch (error) {
    console.error("PATCH Error:", error);
    return NextResponse.json({ success: false, error: 'Event not found or database error' }, { status: 404 });
  }
}

// DELETE EVENT & VIDEO (DELETE /api/events/:id)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // 1. Find the event to identify the file to be deleted
  const events = await db.getEvents();
  const event = events.find((e) => e.id === id);

  if (!event) {
    return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 });
  }

  // 2. Physically remove the media file from disk
  try {
    // videoPath is stored as "/recordings/video.mp4", we need the absolute system path
    const relativePath = event.videoPath.replace(/^\//, ''); // remove leading slash
    const absolutePath = path.join(process.cwd(), 'public', relativePath);

    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
      console.log(`🗑️ [System] Deleted file: ${absolutePath}`);
    }
  } catch (err) {
    console.error('⚠️ Error deleting file:', err);
    // Continue DB deletion even if the file is missing
  }

  // 3. Remove entry from database
  try {
    await db.deleteEvent(id);
    return NextResponse.json({ success: true, message: 'Event deleted' });
  } catch (error) {
    console.error("DELETE Error:", error);
    return NextResponse.json({ success: false, error: 'Event not found or database error' }, { status: 404 });
  }
}