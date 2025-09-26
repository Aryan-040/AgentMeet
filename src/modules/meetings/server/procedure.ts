import { db } from "@/db";
import { agents, meetings } from "@/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";

import { z } from "zod";
import { and, count, desc, eq, getTableColumns, ilike, sql } from "drizzle-orm";
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, MIN_PAGE_SIZE } from "@/constants";
import { meetingsInsertSchema, meetingsUpdatedSchema } from "./schemas";
import { MeetingStatus } from "../types";
import { streamVideo } from "@/lib/stream-video";
import { generateAvatarUri } from "@/lib/avatar";

export const meetingsRouter = createTRPCRouter({
  generateToken: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      // Ensure the user exists as a Stream user before issuing a token
      await streamVideo.upsertUsers([
        {
          id: ctx.auth.user.id,
          name: ctx.auth.user.name,
          role: "admin",
          image:
            ctx.auth.user.image ??
            generateAvatarUri({ seed: ctx.auth.user.name, variant: "initials" }),
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
  create: protectedProcedure
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
});
