import 'server-only';
import fs from 'fs';
import path from 'path';
import { prisma } from '@/lib/server/prisma';
import { SecurityEvent, Camera } from '@/types';

// 1. Data Retention Policy
const MAX_EVENTS = 200; // Limits the database to the last 200 security events to save disk space

export const db = {
  // READ: Returns events with cursor-based pagination (timestamp) and filtering
  getEvents: async (before?: Date, limit?: number, isRead?: boolean): Promise<SecurityEvent[]> => {
    try {
      return await prisma.event.findMany({
        where: {
          ...(isRead !== undefined && { isRead }),
          ...(before !== undefined && { timestamp: { lt: new Date(before) } }),
        },
        take: limit || undefined,
        orderBy: { timestamp: 'desc' },
        include: { camera: true }
      }) as unknown as Promise<SecurityEvent[]>;
    } catch (error) {
      console.error("❌ Database Read Error:", error);
      throw new Error("Could not load security alerts.");
    }
  },

  // COUNT: Returns the total number of alerts (optionally filtered by read status)
  getCount: async (isRead?: boolean): Promise<number> => {
    try {
      return await prisma.event.count({
        where: isRead !== undefined ? { isRead } : {}
      })
    } catch (error) {
      console.error("❌ Database count error:", error);
      throw new Error("Could not count security alerts.");
    }
  },

  // GET: Retrieve a single event by ID
  getEvent: async (id: string) => {
    try {
      return await prisma.event.findUnique({
        where: { id },
        include: { camera: true }
      })
    } catch (error) {
      console.error("❌ Database read error:", error);
      throw new Error("Could not load the specific security alert.");
    }
  },

  // CREATE: Add a new security event and trigger automatic cleanup
  addEvent: async (event: Omit<SecurityEvent, 'id' | 'isRead' | 'timestamp'>) => {
    try {
      const newEvent = await prisma.event.create({
        data: {
          cameraId: event.cameraId,
          type: event.type,
          videoPath: event.videoPath,
          thumbnailPath: event.thumbnailPath ?? "",
          isRead: false,
        }
      }) as unknown as SecurityEvent;

      // --- CLEANUP LOGIC (Smart Chronological Cleanup) ---
      const total = await prisma.event.count();
      if (total > MAX_EVENTS) {
        // Find the oldest read event first, fallback to oldest unread if none found
        let victim = await prisma.event.findFirst({
          where: { isRead: true },
          orderBy: { timestamp: 'asc' }
        });

        if (!victim) {
          victim = await prisma.event.findFirst({
            orderBy: { timestamp: 'asc' }
          })
        }

        if (victim) {
          await db.deleteEvent(victim.id);
          console.log(`♻️ [Auto-Cleanup] Deleted oldest event: ${victim.id}`);
        }
      }

      return newEvent;
    } catch (error) {
      console.error("❌ Database creation error:", error);
      throw new Error("Could not create the security alert.");
    }
  },

  // UPDATE: Mark an event as read
  markAsRead: async (id: string) => {
    try {
      return await prisma.event.update({
        where: { id },
        data: { isRead: true }
      });
    } catch (error) {
      console.error("❌ Database update error:", error);
      throw new Error("Could not update the security alert.");
    }
  },

  // UPDATE: Mark all unread events as read in a single operation
  markAllAsRead: async () => {
    try {
      return await prisma.event.updateMany({
        where: { isRead: false },
        data: { isRead: true }
      });
    } catch (error) {
      console.error("❌ Database update error (markAllAsRead):", error);
      throw new Error("Could not update all security alerts to read status.");
    }
  },

  // DELETE: Remove a specific security event and its associated physical files
  deleteEvent: async (id: string) => {
    try {
      const event = await prisma.event.findUnique({
        where: { id }
      });

      if (!event) return;

      // Physically remove associated media files from disk
      deleteFile(event.videoPath);
      deleteFile(event.thumbnailPath);

      // Remove record from database
      await prisma.event.delete({
        where: { id }
      });
    } catch (error) {
      console.error("❌ Database deletion error:", error);
      throw new Error("Could not delete the security alert.");
    }
  },

  // UPSERT: Ensure a camera exists in the DB (called on startup)
  upsertCamera: async (camera: Camera) => {
    try {
      await prisma.camera.upsert({
        where: { id: camera.id },
        update: {
          name: camera.name,
          ipAddress: camera.ipAddress
        },
        create: {
          id: camera.id,
          name: camera.name,
          ipAddress: camera.ipAddress
        }
      });
    } catch (error) {
      console.error("❌ Database upsert error:", error);
      throw new Error("Could not sync camera configuration.");
    }
  },

  // CHECK: Verify if an event already exists (used for reconciliation)
  checkEventExists: async (cameraId: string, timestamp: Date) => {
    try {
      const count = await prisma.event.count({
        where: {
          cameraId,
          timestamp: {
            equals: timestamp
          }
        }
      });
      return count > 0;
    } catch (error) {
      console.error("❌ Database check error:", error);
      return false;
    }
  }
}

// Helper: Physically delete a file from disk
const deleteFile = (relativePath: string | undefined) => {
  if (!relativePath) return;
  try {
    const fullPath = path.join(process.cwd(), 'public', relativePath);

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log(`🗑️ [Storage] Deleted file: ${relativePath}`);
    }
  } catch (error) {
    console.error(`❌ [Storage] Error deleting file ${relativePath}:`, error);
  }
}