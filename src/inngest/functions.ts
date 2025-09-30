import { agents, meetings, user } from "@/db/schema";
import { inngest } from "@/inngest/client";
import { StreamTranscriptItem } from "@/modules/meetings/types";
import { eq, inArray } from "drizzle-orm";
import JSONL from "jsonl-parse-stringify";
import { db } from "@/db";

// Fallback summary generation without OpenAI API
function generateFallbackSummary(transcript: StreamTranscriptItem[]): string {
  console.log("[generateFallbackSummary] Generating fallback summary for", transcript.length, "items");
  
  if (transcript.length === 0) {
    return "No transcript data available for summarization.";
  }

  
  const speakers = [...new Set(transcript.map(item => item.speaker_id))];
  const totalMessages = transcript.length;
  const duration = transcript.length > 0 ? 
    Math.round((transcript[transcript.length - 1].stop_ts - transcript[0].start_ts) / 1000 / 60) : 0;

  const speakerGroups: { [key: string]: StreamTranscriptItem[] } = {};
  transcript.forEach(item => {
    if (!speakerGroups[item.speaker_id]) {
      speakerGroups[item.speaker_id] = [];
    }
    speakerGroups[item.speaker_id].push(item);
  });

  // Generate notes with readable timestamps
  let notesSection = "### Notes\n";
  
  Object.entries(speakerGroups).forEach(([speakerId, messages]) => {
    if (messages.length > 0) {
      const firstMessage = messages[0];
      const lastMessage = messages[messages.length - 1];
      const startTime = formatTimestamp(firstMessage.start_ts);
      const endTime = formatTimestamp(lastMessage.stop_ts);
      
      notesSection += `#### ${speakerId} (${startTime} - ${endTime})\n`;
      messages.slice(0, 3).forEach(msg => {
        notesSection += `- ${msg.text.substring(0, 100)}${msg.text.length > 100 ? '...' : ''}\n`;
      });
      if (messages.length > 3) {
        notesSection += `- ... and ${messages.length - 3} more messages\n`;
      }
      notesSection += '\n';
    }
  });

  // Create a basic summary
  const summary = `### Overview
This meeting involved ${speakers.length} participant(s): ${speakers.join(', ')}. The session lasted approximately ${duration} minutes with ${totalMessages} total messages exchanged.

${notesSection}

#### Meeting Summary
- **Duration**: ${duration} minutes
- **Participants**: ${speakers.join(', ')}
- **Total Messages**: ${totalMessages}
- **Status**: Meeting completed successfully

*Note: For AI-powered summarization, please configure the OPENAI_API_KEY environment variable.*`;

  return summary;
}

// Helper function to convert milliseconds to readable time format
function formatTimestamp(timestampMs: number): string {
  const minutes = Math.floor(timestampMs / 60000);
  const seconds = Math.floor((timestampMs % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Helper function to format transcript with readable timestamps
function formatTranscriptWithReadableTimestamps(transcript: StreamTranscriptItem[]): Record<string, unknown>[] {
  return transcript.map(item => ({
    ...item,
    start_time: formatTimestamp(item.start_ts),
    stop_time: formatTimestamp(item.stop_ts),
    duration_seconds: Math.round((item.stop_ts - item.start_ts) / 1000)
  }));
}

// Simple summarization function using OpenAI directly
async function summarizeTranscript(transcript: StreamTranscriptItem[]): Promise<string> {
  try {
    console.log("[summarizeTranscript] Starting summarization for transcript with", transcript.length, "items");
    
    if (!process.env.OPENAI_API_KEY) {
      console.warn("[summarizeTranscript] OPENAI_API_KEY is not set, using fallback summary");
      return generateFallbackSummary(transcript);
    }

    // Format transcript with readable timestamps
    const formattedTranscript = formatTranscriptWithReadableTimestamps(transcript);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an expert summarizer. You write readable, concise, simple content. You are given a transcript of a meeting and you need to summarize it.

Use the following markdown structure for every output:

### Overview
Provide a detailed, engaging summary of the session's content. Focus on major features, user workflows, and any key takeaways. Write in a narrative style, using full sentences. Highlight unique or powerful aspects of the product, platform, or discussion.

### Notes
Break down key content into thematic sections with timestamp ranges. Use the readable time format (e.g., "2:30 - 4:15") from the start_time and stop_time fields. Each section should summarize key points, actions, or demos in bullet format.

Example:
#### Section Name (2:30 - 4:15)
- Main point or demo shown here
- Another key insight or interaction
- Follow-up tool or explanation provided

#### Next Section (4:15 - 6:45)
- Feature X automatically does Y
- Mention of integration with Z

IMPORTANT: Always use the readable time format (start_time - stop_time) when referencing timestamps, not the raw timestamp values.`
          },
          {
            role: "user",
            content: `Summarize the following transcript: ${JSON.stringify(formattedTranscript)}`
          }
        ],
        temperature: 0.7,
      }),
    });

    console.log("[summarizeTranscript] OpenAI API response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[summarizeTranscript] OpenAI API error:", response.status, errorText);
      console.warn("[summarizeTranscript] Falling back to basic summary due to API error");
      return generateFallbackSummary(transcript);
    }

    const data = await response.json();
    console.log("[summarizeTranscript] OpenAI API response data:", JSON.stringify(data, null, 2));

    if (!data || !data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
      console.error("[summarizeTranscript] Invalid response structure:", data);
      console.warn("[summarizeTranscript] Falling back to basic summary due to invalid response");
      return generateFallbackSummary(transcript);
    }

    const content = data.choices[0]?.message?.content;
    if (!content) {
      console.error("[summarizeTranscript] No content in response:", data.choices[0]);
      console.warn("[summarizeTranscript] Falling back to basic summary due to empty content");
      return generateFallbackSummary(transcript);
    }

    console.log("[summarizeTranscript] Successfully generated summary");
    return content;
  } catch (error) {
    console.error("[summarizeTranscript] Error during summarization:", error);
    console.warn("[summarizeTranscript] Falling back to basic summary due to error");
    return generateFallbackSummary(transcript);
  }
}

export const meetingsProcessing = inngest.createFunction(
  { id: "meetings-processing" },
  { event: "meetings/processing" },
  async ({ event, step }) => {
    try {
      console.log("[meetingsProcessing] Starting processing for meeting:", event.data.meetingId);

      
      const transcriptUrl = await step.run("wait-for-transcript-url", async (): Promise<string | undefined> => {
        
        const raw = (event.data as { transcriptUrl?: string | null }).transcriptUrl;
        const url: string | undefined = raw != null && typeof raw === "string" && raw.length > 0 ? raw : undefined;
        if (url) {
          return url;
        }

        // Poll DB for up to ~90s (6 attempts with backoff) for transcript URL to be populated by webhook
        const maxAttempts = 6;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          const [meeting] = await db
            .select()
            .from(meetings)
            .where(eq(meetings.id, event.data.meetingId));
          const dbUrl = meeting?.transcriptUrl ?? undefined; 
          if (typeof dbUrl === "string" && dbUrl.length > 0) {
            return dbUrl;
          }
          const delayMs = attempt * 15000; // 15s, 30s, 45s, ...
          console.log(`[meetingsProcessing] Transcript URL not ready (attempt ${attempt}/${maxAttempts}). Waiting ${delayMs}ms`);
          await new Promise((res) => setTimeout(res, delayMs));
        }
        return undefined;
      });

      // 2) Try to fetch transcript text with retries; if unavailable, continue with fallback summary
      const transcriptText = await step.run("fetch-transcript", async () => {
        if (!transcriptUrl) {
          console.warn("[meetingsProcessing] No transcript URL available after waiting. Proceeding with fallback summary.");
          return "[]"; 
        }
        const maxAttempts = 3;
        let lastErr: unknown;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          try {
            console.log(`[meetingsProcessing] Fetching transcript (attempt ${attempt}/${maxAttempts}) from:`, transcriptUrl);
            const response = await fetch(transcriptUrl);
            if (!response.ok) {
              throw new Error(`Failed to fetch transcript: ${response.status} ${response.statusText}`);
            }
            return await response.text();
          } catch (err) {
            lastErr = err;
            const backoff = attempt * 5000;
            console.warn(`[meetingsProcessing] Transcript fetch failed (attempt ${attempt}). Retrying in ${backoff}ms`);
            await new Promise((res) => setTimeout(res, backoff));
          }
        }
        console.error("[meetingsProcessing] All transcript fetch attempts failed", lastErr);
        return "[]"; // proceed with empty transcript -> fallback summary
      });

      const transcript = (await step.run("parse-transcript", async () => {
        console.log("[meetingsProcessing] Parsing transcript JSONL");
        try {
          return JSONL.parse(transcriptText);
        } catch (error) {
          console.error("[meetingsProcessing] Failed to parse transcript:", error);
          throw new Error(`Failed to parse transcript: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      })) as unknown as StreamTranscriptItem[];

      const transcriptWithSpeakers = await step.run("add-speakers", async () => {
        console.log("[meetingsProcessing] Adding speaker information");
        const speakerIds = [...new Set(transcript.map((item) => item.speaker_id))];

        const userSpeakers = await db
          .select()
          .from(user)
          .where(inArray(user.id, speakerIds));

        const agentSpeakers = await db
          .select()
          .from(agents)
          .where(inArray(agents.id, speakerIds));

        const speakerIndex = new Map(
          [...userSpeakers, ...agentSpeakers].map((s) => [s.id, s])
        );

        return transcript.map((item) => {
          const speaker = speakerIndex.get(item.speaker_id);
          return {
            ...item,
            user: {
              name: speaker?.name ?? "Unknown"
            }
          };
        });
      });

      const summary = await step.run("generate-summary", async () => {
        console.log("[meetingsProcessing] Generating summary");
        return await summarizeTranscript(transcriptWithSpeakers);
      });

      await step.run("save-summary", async () => {
        console.log("[meetingsProcessing] Saving summary and marking meeting as completed");
        await db
          .update(meetings)
          .set({
            summary: summary,
            status: "completed"
          })
          .where(eq(meetings.id, event.data.meetingId));
        
        console.log("[meetingsProcessing] Successfully completed processing for meeting:", event.data.meetingId);
      });
    } catch (error) {
      console.error("[meetingsProcessing] Error processing meeting:", event.data.meetingId, error);
      
      // Even if processing fails, mark the meeting as completed to prevent it from staying in processing state
      await step.run("mark-completed-on-error", async () => {
        console.log("[meetingsProcessing] Marking meeting as completed due to error");
        await db
          .update(meetings)
          .set({
            summary: `Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            status: "completed"
          })
          .where(eq(meetings.id, event.data.meetingId));
      });
      
      // Re-throw the error so Inngest knows the function failed
      throw error;
    }
  }
);  