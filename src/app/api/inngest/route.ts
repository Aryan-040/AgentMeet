import { serve } from "inngest/next";
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { inngest } from "@/inngest/client";
import { meetingsProcessing } from "@/inngest/functions";

// Create an API that serves zero functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    meetingsProcessing,
  ],
});
