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

    // Validate ID formats (basic validation)
    if (typeof meetingId !== 'string' || typeof agentId !== 'string') {
      return NextResponse.json(
        { error: "Invalid meetingId or agentId format" },
        { status: 400 }
      );
    }

    if (meetingId.trim().length === 0 || agentId.trim().length === 0) {
      return NextResponse.json(
        { error: "MeetingId and agentId cannot be empty" },
        { status: 400 }
      );
    }

    console.log("[connect-ai-agent] Connecting AI agent", {
      meetingId,
      agentId,
    });

    // Verify the meeting and agent exist
    console.log("[connect-ai-agent] Looking up meeting", { meetingId });
    const [existingMeeting] = await db
      .select()
      .from(meetings)
      .where(and(eq(meetings.id, meetingId)));
    console.log("[connect-ai-agent] Found meeting", { 
      meetingId, 
      status: existingMeeting?.status,
      agentId: existingMeeting?.agentId 
    });

    if (!existingMeeting) {
      return NextResponse.json(
        { error: "Meeting not found" },
        { status: 404 }
      );
    }

    // Check if meeting is in a valid state for connecting AI agent
    if (existingMeeting.status === "completed" || existingMeeting.status === "cancelled") {
      console.log("[connect-ai-agent] Meeting is already completed or cancelled", { 
        meetingId, 
        status: existingMeeting.status 
      });
      return NextResponse.json(
        { error: "Meeting is already completed or cancelled" },
        { status: 400 }
      );
    }

    // Check if an AI agent is already connected to this meeting
    if (existingMeeting.agentId && existingMeeting.agentId !== agentId) {
      console.log("[connect-ai-agent] Another AI agent is already connected to this meeting", { 
        meetingId, 
        existingAgentId: existingMeeting.agentId,
        requestedAgentId: agentId 
      });
      return NextResponse.json(
        { error: "Another AI agent is already connected to this meeting" },
        { status: 409 }
      );
    }

    // If this agent is already connected, return success
    if (existingMeeting.agentId === agentId) {
      console.log("[connect-ai-agent] This AI agent is already connected to the meeting", { 
        meetingId, 
        agentId 
      });
      return NextResponse.json({
        success: true,
        message: "AI agent is already connected",
        alreadyConnected: true
      });
    }

    // Update meeting status to active if it's upcoming
    if (existingMeeting.status === "upcoming") {
      await db
        .update(meetings)
        .set({ status: "active", startedAt: new Date() })
        .where(eq(meetings.id, meetingId));
      console.log("[connect-ai-agent] Updated meeting status to active", { meetingId });
    }

    console.log("[connect-ai-agent] Looking up agent", { agentId });
    const [existingAgent] = await db
      .select()
      .from(agents)
      .where(eq(agents.id, agentId));
    console.log("[connect-ai-agent] Found agent", { 
      agentId, 
      name: existingAgent?.name,
      hasInstructions: !!existingAgent?.instructions 
    });

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

    try {
      // Check if call exists before connecting
      try {
        await call.get();
        console.log("[connect-ai-agent] Call exists", { meetingId });
      } catch (callError) {
        console.error("[connect-ai-agent] Call does not exist or is not accessible", callError);
        return NextResponse.json(
          { error: "Meeting call not found or not accessible", details: "The Stream Video call for this meeting does not exist or is not accessible" },
          { status: 404 }
        );
      }

      const realtimeClient = await streamVideo.video.connectOpenAi({
        call,
        openAiApiKey: process.env.OPENAI_API_KEY!,
        agentUserId: existingAgent.id,
      });

      console.log("[connect-ai-agent] AI agent connected", {
        meetingId,
        agentId: existingAgent.id,
      });

      // Update meeting record with the connected agent
      await db
        .update(meetings)
        .set({ agentId: existingAgent.id })
        .where(eq(meetings.id, meetingId));
      console.log("[connect-ai-agent] Updated meeting with agent ID", { 
        meetingId, 
        agentId: existingAgent.id 
      });

      if (existingAgent.instructions) {
        realtimeClient.updateSession({
          instructions: existingAgent.instructions,
        });
        console.log("[connect-ai-agent] AI session updated with instructions", {
          meetingId,
          agentId: existingAgent.id,
        });
      }
    } catch (streamError) {
      console.error("[connect-ai-agent] Stream Video connection failed", streamError);
      const errorMessage = streamError instanceof Error ? streamError.message : String(streamError);
      
      // Provide more specific error messages based on common Stream Video errors
      let userMessage = "Failed to connect AI agent to the meeting";
      if (errorMessage.includes("authentication") || errorMessage.includes("unauthorized")) {
        userMessage = "Authentication failed - please check Stream Video configuration";
      } else if (errorMessage.includes("not found") || errorMessage.includes("does not exist")) {
        userMessage = "Meeting call not found - the meeting may not be active yet";
      } else if (errorMessage.includes("rate limit") || errorMessage.includes("too many requests")) {
        userMessage = "Rate limit exceeded - please try again in a moment";
      }
      
      return NextResponse.json(
        { error: userMessage, details: errorMessage },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "AI agent connected successfully",
    });
  } catch (error) {
    console.error("[connect-ai-agent] Failed to connect AI agent", error);
    return NextResponse.json(
      { error: "Failed to connect AI agent", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}