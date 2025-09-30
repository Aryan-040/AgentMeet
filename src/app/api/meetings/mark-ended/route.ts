import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { meetings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { inngest } from "@/inngest/client";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { meetingId } = await req.json();
    if (!meetingId || typeof meetingId !== "string") {
      return NextResponse.json({ error: "Missing meetingId" }, { status: 400 });
    }

    const [updated] = await db
      .update(meetings)
      .set({ status: "processing", endedAt: new Date() })
      .where(eq(meetings.id, meetingId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    // Kick off processing even if transcript isn't ready; the function will mark completed on error
    try {
      await inngest.send({
        name: "meetings/processing",
        data: { meetingId, transcriptUrl: updated.transcriptUrl },
      });
    } catch {
      // Best-effort
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to mark ended" }, { status: 500 });
  }
}


