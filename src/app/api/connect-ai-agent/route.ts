import { NextRequest, NextResponse } from "next/server";
import { streamVideo } from "@/lib/stream-video";
import { db } from "@/db";
import { agents, meetings } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { meetingId, agentId } = body;

    if (!meetingId || !agentId) {
      return NextResponse.json(
        { error: "Missing meetingId or agentId" },
        { status: 400 }
      );
    }

    console.log("[connect-ai-agent] Connecting AI agent", {
      meetingId,
      agentId,
    });

    // Verify the meeting and agent exist
    const [existingMeeting] = await db
      .select()
      .from(meetings)
      .where(and(eq(meetings.id, meetingId), eq(meetings.status, "active")));

    if (!existingMeeting) {
      return NextResponse.json(
        { error: "Meeting not found or not active" },
        { status: 404 }
      );
    }

    const [existingAgent] = await db
      .select()
      .from(agents)
      .where(eq(agents.id, agentId));

    if (!existingAgent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error("[connect-ai-agent] OPENAI_API_KEY missing");
      return NextResponse.json(
        { error: "AI service not configured" },
        { status: 500 }
      );
    }

    // Connect the AI agent to the call
    const call = streamVideo.video.call("default", meetingId);
    console.log("[connect-ai-agent] Connecting AI agent to call", {
      meetingId,
      agentId: existingAgent.id,
    });

    const realtimeClient = await streamVideo.video.connectOpenAi({
      call,
      openAiApiKey: process.env.OPENAI_API_KEY!,
      agentUserId: existingAgent.id,
    });

    console.log("[connect-ai-agent] AI agent connected", {
      meetingId,
      agentId: existingAgent.id,
    });

    realtimeClient.updateSession({
      instructions: existingAgent.instructions,
    });

    console.log("[connect-ai-agent] AI session updated with instructions", {
      meetingId,
      agentId: existingAgent.id,
    });

    return NextResponse.json({
      success: true,
      message: "AI agent connected successfully",
    });
  } catch (error) {
    console.error("[connect-ai-agent] Failed to connect AI agent", error);
    return NextResponse.json(
      { error: "Failed to connect AI agent" },
      { status: 500 }
    );
  }
}