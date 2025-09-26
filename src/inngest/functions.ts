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

  // Extract key information from transcript
  const speakers = [...new Set(transcript.map(item => item.speaker_id))];
  const totalMessages = transcript.length;
  const duration = transcript.length > 0 ? 
    Math.round((transcript[transcript.length - 1].stop_ts - transcript[0].start_ts) / 1000 / 60) : 0;

  // Create a basic summary
  const summary = `### Overview
This meeting involved ${speakers.length} participant(s): ${speakers.join(', ')}. The session lasted approximately ${duration} minutes with ${totalMessages} total messages exchanged.

### Notes
#### Meeting Summary
- **Duration**: ${duration} minutes
- **Participants**: ${speakers.join(', ')}
- **Total Messages**: ${totalMessages}
- **Status**: Meeting completed successfully

#### Key Points
- Meeting transcript has been processed and recorded
- All participants were active during the session
- Summary generated using fallback method (OpenAI API not configured)

*Note: For AI-powered summarization, please configure the OPENAI_API_KEY environment variable.*`;

  return summary;
}

// Simple summarization function using OpenAI directly
async function summarizeTranscript(transcript: StreamTranscriptItem[]): Promise<string> {
  try {
    console.log("[summarizeTranscript] Starting summarization for transcript with", transcript.length, "items");
    
    if (!process.env.OPENAI_API_KEY) {
      console.warn("[summarizeTranscript] OPENAI_API_KEY is not set, using fallback summary");
      return generateFallbackSummary(transcript);
    }

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
Break down key content into thematic sections with timestamp ranges. Each section should summarize key points, actions, or demos in bullet format.

Example:
#### Section Name
- Main point or demo shown here
- Another key insight or interaction
- Follow-up tool or explanation provided

#### Next Section
- Feature X automatically does Y
- Mention of integration with Z`
          },
          {
            role: "user",
            content: `Summarize the following transcript: ${JSON.stringify(transcript)}`
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

      const transcriptText = await step.run("fetch-transcript", async () => {
        console.log("[meetingsProcessing] Fetching transcript from:", event.data.transcriptUrl);
        const response = await fetch(event.data.transcriptUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch transcript: ${response.status} ${response.statusText}`);
        }
        return response.text();
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