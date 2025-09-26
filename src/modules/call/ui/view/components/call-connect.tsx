"use client"

import { useTRPC } from "@/trpc/client";
import {
    StreamVideo,
    StreamCall,
    StreamVideoClient,
    CallingState,
} from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { CallUI } from "./call-ui";
import { LoaderIcon } from "lucide-react";

interface Props {
    meetingId: string;
    meetingName: string;
    userId: string;
    userName: string;
    userImage: string;
};

export const CallConnect = ({
    meetingId,
    meetingName,
    userId,
    userName,
    userImage,
}: Props) => {
    const trpc = useTRPC();
    const { mutateAsync: generateToken } = useMutation(
        trpc.meetings.generateToken.mutationOptions(),
    )
    const [client, setClient] = useState<StreamVideoClient | undefined>();
    const [call, setCall] = useState<ReturnType<StreamVideoClient["call"]> | undefined>();

    useEffect(() => {
        const videoClient = new StreamVideoClient({
            apiKey: process.env.NEXT_PUBLIC_STREAM_VIDEO_KEY!,
            user: {
                id: userId,
                name: userName,
                image: userImage,
            },
            tokenProvider: generateToken,
        });
        setClient(videoClient);

        return () => {
            videoClient.disconnectUser();
            setClient(undefined);
        };
    }, [userId, userName, userImage, generateToken]);

    useEffect(() => {
        if (!client) return;
        const nextCall = client.call("default", meetingId);
        nextCall.camera.disable();
        nextCall.microphone.disable();
        setCall(nextCall);

        return () => {
            const callingState = nextCall.state.callingState;
            if (callingState !== CallingState.LEFT) {
                nextCall.leave();
            }
            setCall(undefined);
        };
    }, [client, meetingId]);

    if (!client || !call) {
        return (
            <div className="flex h-screen items-center justify-center bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),rgba(0,0,0,0))]">
                <LoaderIcon className="size-6 animate-spin text-white" />
            </div>
        );
    }

    return (
        <StreamVideo client={client}>
            <StreamCall call={call}>
                <CallUI meetingId={meetingId} meetingName={meetingName} />
            </StreamCall>
        </StreamVideo>
    );
}