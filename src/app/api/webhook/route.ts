import OpenAI from "openai";
import { db } from "@/db";
import { agents, meetings } from "@/db/schema";
import { streamVideo } from "@/lib/stream-video";
import { and, eq, not } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import {
  MessageNewEvent,
  CallRecordingReadyEvent,
  CallSessionEndedEvent,
  CallSessionParticipantLeftEvent,
  CallSessionStartedEvent,
  CallTranscriptionReadyEvent,
} from "@stream-io/node-sdk";

import { generateAvatarUri } from "@/lib/avatar";
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { inngest } from "@/inngest/client";
import { streamChat } from "@/lib/stream-chat";

// Disable body parsing for webhook signature verification
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

function verifySignatureWithSdk(body: string, signature: string): boolean {
  try {
    console.log("[webhook] Verifying signature", {
      bodyLength: body.length,
      signatureLength: signature.length,
      bodyPreview: body.substring(0, 100),
    });
    const result = streamVideo.verifyWebhook(body, signature);
    console.log("[webhook] Signature verification result:", result);
    return result;
  } catch (error) {
    console.error("[webhook] Signature verification error:", error);
    return false;
  }
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  // Read raw body for signature verification
  const body = await req.text();

  if (!verifySignatureWithSdk(body, signature)) {
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

    console.log("[webhook] call.session_started event received", {
      meetingId,
      callCid: event.call_cid,
      custom: event.call?.custom,
    });

    if (!meetingId) {
      console.error("[webhook] Missing meetingId in event", event);
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
      console.error("[webhook] Meeting not found", { meetingId });
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }
    
    console.log("[webhook] Found meeting", {
      meetingId: existingMeeting.id,
      agentId: existingMeeting.agentId,
      status: existingMeeting.status,
    });

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
      console.error("[webhook] Agent not found", { agentId: existingMeeting.agentId });
      return NextResponse.json({ error: "agent not found" }, { status: 404 });
    }

    console.log("[webhook] Found agent", {
      agentId: existingAgent.id,
      name: existingAgent.name,
      hasInstructions: !!existingAgent.instructions,
    });

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
    
    const [updatedMeeting] = await db
      .update(meetings)
      .set({
        status: "processing",
        endedAt: new Date(),
      })
      .where(and(eq(meetings.id, meetingId), eq(meetings.status, "active")))
      .returning();

    // Create chat channel for completed meeting
    if (updatedMeeting) {
      try {
        const channel = streamChat.channel("messaging", meetingId);
        await channel.create();
        await channel.addMembers([updatedMeeting.userId]);
        console.log(`[webhook] Chat channel created for meeting ${meetingId}`);
      } catch (error) {
        console.error(`[webhook] Failed to create chat channel for meeting ${meetingId}:`, error);
      }
    }
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
  } else if (eventType === "message.new"){
    const event = payload as MessageNewEvent;

    const userId = event.user?.id;
    const channelId = event.channel_id;
    const text = event.message?.text;

    console.log("[webhook] New message received:", { userId, channelId, text });

    if (!userId || !channelId || !text){
      console.log("[webhook] Missing required fields");
      return NextResponse.json(
        {error: "Missing required fields"},
        {status:400}
      );
    }

    const [existingMeeting] = await db
      .select()
      .from(meetings)
      .where(and(eq(meetings.id, channelId), eq(meetings.status, "completed")));

    if (!existingMeeting){
      console.log("[webhook] Meeting not found or not completed");
      return NextResponse.json({error: "Meeting not found"}, {status: 404});
    }

    const [existingAgent] = await db 
      .select()
      .from(agents)
      .where(eq(agents.id, existingMeeting.agentId));

      if (!existingAgent){
        console.log("[webhook] Agent not found");
        return NextResponse.json({error: "Agent not found"}, {status: 404});
      }

      console.log("[webhook] Processing message for agent:", existingAgent.name);

      if(userId !== existingAgent.id){
        const instructions = `
      You are an AI assistant helping the user revisit a recently completed meeting.
      Below is a summary of the meeting, generated from the transcript:
      
      ${existingMeeting.summary}
      
      The following are your original instructions from the live meeting assistant. Please continue to follow these behavioral guidelines as you assist the user:
      
      ${existingAgent.instructions}
      
      The user may ask questions about the meeting, request clarifications, or ask for follow-up actions.
      Always base your responses on the meeting summary above.
      
      You also have access to the recent conversation history between you and the user. Use the context of previous messages to provide relevant, coherent, and helpful responses. If the user's question refers to something discussed earlier, make sure to take that into account and maintain continuity in the conversation.
      
      If the summary does not contain enough information to answer a question, politely let the user know.
      
      Be concise, helpful, and focus on providing accurate information from the meeting and the ongoing conversation.
      `;

      const channel = streamChat.channel("messaging", channelId);
      await channel.watch();

      const previousMessages = channel.state.messages
        .slice(-5)
        .filter((msg) => msg.text && msg.text.trim()!=="")
        .map<ChatCompletionMessageParam>((message)=> ({
          role: message.user?.id === existingAgent.id? "assistant" : "user",
          content: message.text || "",
        }));

        console.log("[webhook] Sending to GPT with context:", { 
          instructionsLength: instructions.length, 
          previousMessagesCount: previousMessages.length 
        });

        const GPTResponse = await openaiClient.chat.completions.create({
          messages: [
            { role: "system", content: instructions },
            ...previousMessages,
            {role: "user", content:text},
          ],
          model:"gpt-4o",
        });

        const GPTResponseText = GPTResponse.choices[0].message.content;

        if(!GPTResponseText){
          console.log("[webhook] No response from GPT");
          return NextResponse.json(
            { error: "No response frm GPT"},
            { status:400 }
          );
        }

        console.log("[webhook] GPT response received, sending message");

        const avatarUrl = generateAvatarUri({
          seed:existingAgent.name,
          variant:"botttsNeutral",
        });

        streamChat.upsertUser({
          id:existingAgent.id,
          name:existingAgent.name,
          image:avatarUrl,
        });

        await channel.sendMessage({
          text: GPTResponseText,
          user: {
            id:existingAgent.id,
            name:existingAgent.name,
            image:avatarUrl,
          },
        });

        console.log("[webhook] AI response sent successfully");
      }
  
  }
  } catch (err) {
    console.error("[webhook] Unhandled error", err);
    // Swallow unexpected errors to prevent 500s and webhook retries
  }

  return NextResponse.json({ status: "ok" });
}

export async function PUT(req: NextRequest) {
  const signature = req.headers.get("x-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const body = await req.text();

  if (!body) {
    return NextResponse.json({ error: "Empty body" }, { status: 400 });
  }

  if (!verifySignatureWithSdk(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  try {
    JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Handle PUT requests (same logic as POST)
  return POST(req);
}