import { db } from "@/db";
import { agents, meetings } from "@/db/schema";
import { streamVideo } from "@/lib/stream-video";
import { and, eq, not } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import {
  CallRecordingReadyEvent,
  CallSessionEndedEvent,
  CallSessionParticipantLeftEvent,
  CallSessionStartedEvent,
  CallTranscriptionReadyEvent,
} from "@stream-io/node-sdk";
import { inngest } from "@/inngest/client";

function verifySignatureWithSDk(body: string, signature: string): boolean {
  return streamVideo.verifyWebhook(body, signature);
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const body = await req.text();

  if (!verifySignatureWithSDk(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(body) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const eventType = (payload as Record<string, unknown>)?.type as
    | string
    | undefined;

  try {
  if (eventType === "call.session_started") {
    const event = payload as CallSessionStartedEvent;
    const meetingId =
      event.call?.custom?.meetingId ?? event.call_cid?.split(":")[1];

    if (!meetingId) {
      return NextResponse.json({ error: "Missing meetingId" }, { status: 400 });
    }

    const [existingMeeting] = await db
      .select()
      .from(meetings)
      .where(
        and(
          eq(meetings.id, meetingId),
          not(eq(meetings.status, "completed")),
          not(eq(meetings.status, "active")),
          not(eq(meetings.status, "cancelled")),
          not(eq(meetings.status, "processing"))
        )
      );

    if (!existingMeeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }
    await db
      .update(meetings)
      .set({
        status: "active",
        startedAt: new Date(),
      })
      .where(eq(meetings.id, existingMeeting.id));

    const [existingAgent] = await db
      .select()
      .from(agents)
      .where(eq(agents.id, existingMeeting.agentId));

    if (!existingAgent) {
      return NextResponse.json({ error: "agent not found" }, { status: 404 });
    }

    try {
      if (!process.env.OPENAI_API_KEY) {
        console.warn("[webhook] OPENAI_API_KEY missing; agent will not join.");
        // Skip connecting agent but keep meeting active
        return NextResponse.json({ status: "ok" });
      }
      const call = streamVideo.video.call("default", meetingId);
      console.log("[webhook] Connecting AI agent to call", {
        meetingId,
        agentId: existingAgent.id,
      });
      const realtimeClient = await streamVideo.video.connectOpenAi({
        call,
        openAiApiKey: process.env.OPENAI_API_KEY!,
        agentUserId: existingAgent.id,
      });
      console.log("[webhook] AI agent connected", {
        meetingId,
        agentId: existingAgent.id,
      });
      realtimeClient.updateSession({
        instructions: existingAgent.instructions,
      });
      console.log("[webhook] AI session updated with instructions", {
        meetingId,
        agentId: existingAgent.id,
      });
    } catch (error) {
      console.error("[webhook] Failed to connect AI agent", error);
      // Do not fail the webhook; the human call can proceed.
    }
  } else if (eventType === "call.session_participant_left") {
    const event = payload as CallSessionParticipantLeftEvent;
    const meetingId = event.call_cid?.split(":")[1];

    if (!meetingId) {
      return NextResponse.json({ error: "Missing meetingId" }, { status: 400 });
    }
    // Do not force-end the call on any single participant leaving.
    // The platform will emit call.session_ended when the call actually ends.
  } else if (eventType === "call.session_ended") {
    const event = payload as CallSessionEndedEvent;
    const meetingId =
      event.call?.custom?.meetingId ?? event.call_cid?.split(":")[1];

    if (!meetingId) {
      return NextResponse.json({ error: "Missing meetingId" }, { status: 400 });
    }
    await db
      .update(meetings)
      .set({
        status: "processing",
        endedAt: new Date(),
      })
      .where(and(eq(meetings.id, meetingId), eq(meetings.status, "active")));
  } else if (
    eventType === "call.session_transcription_ready" ||
    eventType === "call.transcription_ready"
  ) {
    const event = payload as CallTranscriptionReadyEvent;
    const meetingId = event.call_cid?.split(":")[1];

    const [updatedMeeting] = await db
      .update(meetings)
      .set({
        transcriptUrl: event.call_transcription.url,
      })
      .where(and(eq(meetings.id, meetingId)))
      .returning();

    if (!updatedMeeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    await inngest.send({
      name: "meetings/processing",
      data: {
        meetingId: updatedMeeting.id,
        transcriptUrl: updatedMeeting.transcriptUrl,
      }
    })
  } else if (eventType === "call.recording_ready") {
    const event = payload as CallRecordingReadyEvent;
    const meetingId = event.call_cid?.split(":")[1];

    await db
      .update(meetings)
      .set({
        recordingUrl: event.call_recording.url,
      })
      .where(and(eq(meetings.id, meetingId)));
  } else {
    // Unhandled event types are acknowledged to avoid retries
  }
  } catch (err) {
    console.error("[webhook] Unhandled error", err);
    // Swallow unexpected errors to prevent 500s and webhook retries
  }

  return NextResponse.json({ status: "ok" });
}
