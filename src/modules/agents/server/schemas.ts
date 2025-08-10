import { z } from "zod";

export const agentsInsertSchema = z.object({
    name: z.string().min(1,{message:"Name is Required"}),
    instructions: z.string().min(1,{message:"Instructions is Required"}),
})