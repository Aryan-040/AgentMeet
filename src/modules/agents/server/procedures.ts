import { db } from "@/db";
import { agents } from "@/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { agentsInsertSchema } from "./schemas";
import { z } from "zod";
import { and, count, desc, eq, getTableColumns, ilike, sql } from "drizzle-orm";
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, MIN_PAGE_SIZE } from "@/constants";

export const agentsRouter = createTRPCRouter({
  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input,ctx }) => {
      console.log("getOne called with:", { agentId: input.id, userId: ctx.auth.user.id }); //this line is changed 
      
      const [existingAgent] = await db
        .select({
          meetingCount: sql<number>`5`,
          ...getTableColumns(agents),
        })
        .from(agents)
        .where(
          and(
            eq(agents.id, input.id),
            eq(agents.userId, ctx.auth.user.id)
          )
        );

      console.log("Query result:", existingAgent);

        if (!existingAgent){
          console.log("Agent not found for:", { agentId: input.id, userId: ctx.auth.user.id });
          throw new TRPCError({ code: "NOT_FOUND", message: "Agent not found"});
        }

      return existingAgent; // Return single agent, not array
    }),
  getMany: protectedProcedure
    .input(
      z .object({
          page: z.number().default(DEFAULT_PAGE),
          pageSize: z
          .number()
          .min(MIN_PAGE_SIZE)
          .max(MAX_PAGE_SIZE)
          .default(DEFAULT_PAGE_SIZE),
          search: z.string().nullish(),
        })
    )
    .query(async ({ctx,input}) => {
      try {
        const {search, page, pageSize} = input;
        const data = await db
          .select({
            //TODO change to actual count
            meetingCount: sql<number>`5`,
            ...getTableColumns(agents),
          })
          .from(agents)
          .where(
            and(
              eq(agents.userId,ctx.auth.user.id),
              search ? ilike(agents.name,`%${search}%`) : undefined,
            )
          )
          .orderBy(desc(agents.createdAt),desc(agents.id))
          .limit(pageSize)
          .offset((page-1)*pageSize)

        const [total] = await db
          .select({count: count() })
          .from(agents)
          .where(
            and(
              eq(agents.userId,ctx.auth.user.id),
              search ? ilike(agents.name,`%${search}%`) : undefined,
            )
          );

          const totalPages = Math.ceil(total.count / pageSize);

          return{
            items:data,
            total: total.count,
            totalPages,
          }
      } catch (error) {
        console.error("Database error in agents.getMany:", error);
        throw new Error("Failed to fetch agents. Please try again.");
      }
    }),
  create: protectedProcedure
    .input(agentsInsertSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const [createdAgent] = await db
          .insert(agents)
          .values({
            ...input,
            userId: ctx.auth.user.id,
          })
          .returning();

        return createdAgent;
      } catch (error) {
        console.error("Database error in agents.create:", error);
        throw new Error("Failed to create agent. Please try again.");
      }
    }),
});
