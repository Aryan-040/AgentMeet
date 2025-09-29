import { db } from "@/db";
import JSONL from "jsonl-parse-stringify";
import { agents, meetings, user } from "@/db/schema";
import { createTRPCRouter, premiumProcedure, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";

import { z } from "zod";
import { and, count, desc, eq, getTableColumns, ilike, inArray, sql } from "drizzle-orm";
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, MIN_PAGE_SIZE } from "@/constants";
import { meetingsInsertSchema, meetingsUpdatedSchema } from "./schemas";
import { MeetingStatus, StreamTranscriptItem } from "../types";
import { streamVideo } from "@/lib/stream-video";
import { generateAvatarUri } from "@/lib/avatar";
import { streamChat } from "@/lib/stream-chat";

export const meetingsRouter = createTRPCRouter({
  generateChatToken: protectedProcedure.mutation(async ({ ctx }) => {
    const token = streamChat.createToken(ctx.auth.user.id);
    await streamChat.upsertUser({
      id:ctx.auth.user.id,
      role:"admin",
    });
    return token;
  }),
  getTranscript: protectedProcedure
  .input(z.object({id:z.string()}))
  .query(async ({ ctx, input}) => {
    const [existingMeeting] = await db
    .select()
    .from(meetings)
    .where(
      and(eq(meetings.id, input.id),eq(meetings.userId, ctx.auth.user.id))
    );

    if (!existingMeeting) {
      throw new TRPCError({ 
        code: "NOT_FOUND", 
        message: "Meeting not found"
      });
    }

    if (!existingMeeting.transcriptUrl) {
      return[];
    }

    const transcript = await fetch(existingMeeting.transcriptUrl)
    .then(res => res.text())
    .then(text => JSONL.parse<StreamTranscriptItem>(text))
    .catch(() => {
      return [];
    });

    const speakersIds = [
      ...new Set(transcript.map(item => item.speaker_id)),
    ];

    const userSpeakers = await db
      .select()
      .from(user)
      .where(inArray(user.id, speakersIds))
      .then((users) => 
        users.map((user) => ({
          ...user,
          image:
          user.image ??
          generateAvatarUri({ seed: user.name, variant: "initials" }),
        }))
      );

      const agentSpeakers = await db
      .select()
      .from(agents)
      .where(inArray(agents.id, speakersIds))
      .then((agents) => 
        agents.map((agent) => ({
          ...agent,
          image: generateAvatarUri({ 
            seed: agent.name, variant: "botttsNeutral" }),
        }))
      );

      const speakers = [...userSpeakers, ...agentSpeakers];

      const transcriptWithSpeakers = transcript.map((item) => {
        const speaker = speakers.find((speaker) => speaker.id === item.speaker_id
      );

      if (!speaker) {
        return {
          ...item,
          user: {
            name: "Unknown",
            image: generateAvatarUri({ seed: "Unknown", variant: "initials" }),
          },

        }
      };

      return {
        ...item,
        user:{
          name: speaker.name,
          image: speaker.image,
        },
      };
    })

    return transcriptWithSpeakers;

  }),
  generateToken: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      // Ensure the user exists as a Stream user before issuing a token
      await streamVideo.upsertUsers([
        {
          id: ctx.auth.user.id,
          name: ctx.auth.user.name || ctx.auth.user.email,
          role: "admin",
          image:
            ctx.auth.user.image ??
            generateAvatarUri({ seed: ctx.auth.user.name || ctx.auth.user.email, variant: "initials" }),
        },
      ]);

      // Mitigate client/server clock skew by backdating issued_at a bit
      const nowInSeconds = Math.floor(Date.now() / 1000);
      const token = streamVideo.generateUserToken({
        user_id: ctx.auth.user.id,
        validity_in_seconds: 60 * 60,
        iat: nowInSeconds - 120,
      });
      return token;
    } catch (err) {
      console.error("Stream token generation failed:", err);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message:
          "Video service misconfigured. Please verify NEXT_PUBLIC_STREAM_VIDEO_KEY and STREAM_VIDEO_SECRET.",
      });
    }
  }),
  remove: protectedProcedure
  .input(z.object({id:z.string()}))
  .mutation(async ({ ctx, input}) => {
    const [removedMeeting] = await db
    .delete(meetings)
    .where(
      and(
        eq(meetings.id, input.id),
        eq(meetings.userId, ctx.auth.user.id),
      ),
    )
    .returning();

    if (!removedMeeting) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Meeting not found",
      });
    }
    return removedMeeting;
    }),
  update: protectedProcedure
  .input(meetingsUpdatedSchema)
  .mutation(async ({ ctx, input}) => {
    const [updatedMeeting] = await db
    .update(meetings)
    .set(input)
    .where(
      and(
        eq(meetings.id, input.id),
        eq(meetings.userId, ctx.auth.user.id),
      ),
    )
    .returning();

    if (!updatedMeeting) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Meeting not found",
      });
    }
    return updatedMeeting;
    }),
  create: premiumProcedure("meetings")
    .input(meetingsInsertSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const [createdMeeting] = await db
          .insert(meetings)
          .values({
            ...input,
            userId: ctx.auth.user.id,
          })
          .returning();

        // Best-effort Stream setup; do not block meeting creation
        try {
          // Create Stream call
          const call = streamVideo.video.call("default", createdMeeting.id);
          await call.create({
            data: {
              created_by_id: ctx.auth.user.id,
              custom: {
                meetingId: createdMeeting.id,
                meetingName: createdMeeting.name,
              },
              settings_override: {
                transcription: {
                  language: "en",
                  mode: "auto-on",
                  closed_caption_mode: "auto-on",
                },
                recording: {
                  mode: "auto-on",
                  quality: "1080p",
                },
              },
            },
          });

          // Ensure agent exists then upsert as a Stream user
          const [existingAgent] = await db
            .select()
            .from(agents)
            .where(eq(agents.id, createdMeeting.agentId));

          if (existingAgent) {
            await streamVideo.upsertUsers([
              {
                id: existingAgent.id,
                name: existingAgent.name,
                role: "user",
                image: generateAvatarUri({
                  seed: existingAgent.name,
                  variant: "botttsNeutral",
                }),
              },
            ]);
          }
        } catch (streamError) {
          console.warn("Stream setup failed during meeting.create", streamError);
        }

        return createdMeeting;

      } catch (error) {
          console.error("Database error in meetings.create:", error);
        throw new Error("Failed to create meeting. Please try again.");
      }
    }),
  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      console.log("meetings.getOne called with:", { meetingId: input.id, userId: ctx.auth.user.id });

      const [existingMeeting] = await db
        .select({
          ...getTableColumns(meetings),
          agent: agents,
          duration :  sql<number>`EXTRACT(EPOCH FROM (meetings.ended_at - meetings.started_at))`.as("duration"),
        })
        .from(meetings)
        .innerJoin(agents,eq(meetings.agentId,agents.id))
        .where(
          and(
            eq(meetings.id, input.id),
            eq(meetings.userId, ctx.auth.user.id),
          ),
        );

      console.log("Query result:", existingMeeting);

      if (!existingMeeting) {
        console.log("Meeting not found for:", { meetingId: input.id, userId: ctx.auth.user.id });
        throw new TRPCError({ code: "NOT_FOUND", message: "Meeting not found" });
      }

      return existingMeeting;
    }),
  getMany: protectedProcedure
    .input(
      z.object({
        page: z.number().default(DEFAULT_PAGE),
        pageSize: z
          .number()
          .min(MIN_PAGE_SIZE)
          .max(MAX_PAGE_SIZE)
          .default(DEFAULT_PAGE_SIZE),
        search: z.string().nullish(),
        agentId: z.string().nullish(),
        status: z
        .enum([
          MeetingStatus.Upcoming,
          MeetingStatus.Active,
          MeetingStatus.Completed,
          MeetingStatus.Processing,
          MeetingStatus.Cancelled,
        ])
        .nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        const { search, page, pageSize, status, agentId } = input;

        const data = await db
          .select({
            ...getTableColumns(meetings),
            agent: agents,
            duration :  sql<number>`EXTRACT(EPOCH FROM (meetings.ended_at - meetings.started_at))`.as("duration"),
          })
          .from(meetings)
          .innerJoin(agents, eq(meetings.agentId, agents.id))
          .where(
            and(
              eq(meetings.userId, ctx.auth.user.id),
              search ? ilike(meetings.name, `%${search}%`) : undefined,
              status ? eq(meetings.status, status): undefined,
              agentId ? eq(meetings.agentId, agentId): undefined,
            ),
          )
          .orderBy(desc(meetings.createdAt), desc(meetings.id))
          .limit(pageSize)
          .offset((page - 1) * pageSize);

        const [total] = await db
          .select({ count: count() })
          .from(meetings)
          .innerJoin(agents, eq(meetings.agentId, agents.id))
          .where(
            and(
              eq(meetings.userId, ctx.auth.user.id),
              search ? ilike(meetings.name, `%${search}%`) : undefined,
              status ? eq(meetings.status, status): undefined,
              agentId ? eq(meetings.agentId, agentId): undefined,
            ),
          );

        const totalPages = Math.ceil(total.count / pageSize);

        return {
          items: data,
          total: total.count,
          totalPages,
        };
      } catch (error) {
        console.error("Database error in meetings.getMany:", error);
        throw new Error("Failed to fetch meetings. Please try again.");
      }
    }),
  regenerateSummary: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Find the meeting and verify ownership
      const [existingMeeting] = await db
        .select()
        .from(meetings)
        .where(
          and(
            eq(meetings.id, input.id),
            eq(meetings.userId, ctx.auth.user.id),
            eq(meetings.status, "completed")
          )
        );

      if (!existingMeeting) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Meeting not found or not completed",
        });
      }

      if (!existingMeeting.transcriptUrl) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No transcript available for this meeting",
        });
      }

      // Trigger the Inngest function to regenerate the summary
      const { inngest } = await import("@/inngest/client");
      await inngest.send({
        name: "meetings/processing",
        data: {
          meetingId: existingMeeting.id,
          transcriptUrl: existingMeeting.transcriptUrl,
        }
      });

      return { success: true, message: "Summary regeneration started" };
    }),
  getUpcoming: protectedProcedure
    .query(async ({ ctx }) => {
      const upcomingMeeting = await db
        .select({
          id: meetings.id,
          name: meetings.name,
          startedAt: meetings.startedAt,
        })
        .from(meetings)
        .where(
          and(
            eq(meetings.userId, ctx.auth.user.id),
            eq(meetings.status, MeetingStatus.Upcoming)
          )
        )
        .orderBy(meetings.startedAt)
        .limit(1);

      return upcomingMeeting[0] || null;
    }),
  getCompletedCount: protectedProcedure
    .query(async ({ ctx }) => {
      const [result] = await db
        .select({
          count: count(meetings.id),
        })
        .from(meetings)
        .where(
          and(
            eq(meetings.userId, ctx.auth.user.id),
            eq(meetings.status, MeetingStatus.Completed)
          )
        );

      return result.count;
    }),
});
