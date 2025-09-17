import "server-only";

import { StreamClient } from "@stream-io/node-sdk"

const apiKey = process.env.NEXT_PUBLIC_STREAM_VIDEO_KEY;
const secret = process.env.STREAM_VIDEO_SECRET || process.env.STREAM_VIDEO_SECRET_KEY;

if (!apiKey) {
    throw new Error("NEXT_PUBLIC_STREAM_VIDEO_KEY is not set. Add it to your env.");
}
if (!secret) {
    throw new Error("STREAM_VIDEO_SECRET (or STREAM_VIDEO_SECRET_KEY) is not set. Add it to your env.");
}

export const streamVideo = new StreamClient(apiKey, secret);