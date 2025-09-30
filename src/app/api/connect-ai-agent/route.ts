import { NextRequest, NextResponse } from "next/server";
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { streamVideo } from "@/lib/stream-video";
import { db } from "@/db";
import { agents, meetings } from "@/db/schema";
import { and, eq } from "drizzle-orm";

// Declare a typed lock map on the global object to avoid duplicate concurrent connections
declare global {
  // eslint-disable-next-line no-var
  var __agentConnectingLocks: Map<string, number> | undefined;
}

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

    const now = Date.now();

    const locks: Map<string, number> = globalThis.__agentConnectingLocks || new Map<string, number>();

    globalThis.__agentConnectingLocks = locks;
    const existingLock = locks.get(meetingId);
    if (existingLock && now - existingLock < 15000) {
      return NextResponse.json({ success: false, message: "Agent connection in progress" }, { status: 202 });
    }
    locks.set(meetingId, now);

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
        console.warn("[connect-ai-agent] Call missing. Attempting to create call on the fly.", callError);
        try {
          await call.create({
            data: {
              created_by_id: existingMeeting.userId,
              custom: { meetingId },
            },
          });
          console.log("[connect-ai-agent] Call created", { meetingId });
        } catch (createErr) {
          console.error("[connect-ai-agent] Failed to create missing call", createErr);
          return NextResponse.json(
            { error: "Meeting call not found or not accessible", details: "The Stream Video call could not be found or created" },
            { status: 404 }
          );
        }
      }

      try {
        await streamVideo.upsertUsers([
          {
            id: existingAgent.id,
            name: existingAgent.name,
            role: "user",
          },
        ]);
      } catch (upsertErr) {
        console.warn("[connect-ai-agent] Upsert agent user failed", upsertErr);
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
        try {
          await realtimeClient.updateSession({
            instructions: existingAgent.instructions,
          });
          console.log("[connect-ai-agent] AI session updated with instructions", {
            meetingId,
            agentId: existingAgent.id,
          });
        } catch (e) {
          console.warn("[connect-ai-agent] updateSession failed; continuing without instructions", e);
        }
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
    } finally {
      // Release lock
      const l: Map<string, number> | undefined = globalThis.__agentConnectingLocks;
      l?.delete(meetingId);
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