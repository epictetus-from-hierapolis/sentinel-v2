import { NextResponse } from 'next/server';
import { db } from '@/lib/server/db';

export async function PATCH() {
    try {
        await db.markAllAsRead();
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("❌ API Error [Mark All As Read]:", error);
        return NextResponse.json({ error: "Could not update security alerts." }, { status: 500 });
    }
}
