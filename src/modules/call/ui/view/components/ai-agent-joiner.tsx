"use client"

import { useEffect, useRef } from "react";
import { useCall, useCallStateHooks, CallingState } from "@stream-io/video-react-sdk";

interface Props {
    meetingId: string;
    agentId: string;
    agentName: string;
    agentInstructions: string;
}

export const AIAgentJoiner = ({ meetingId, agentId }: Props) => {
    const call = useCall();
    const { useCallCallingState, useParticipants } = useCallStateHooks();
    const callingState = useCallCallingState();
    const participants = useParticipants();
    
    // Prevent duplicate client-side triggers
    const connectAttemptedRef = useRef(false);

    const isAgentInCall = participants.some(p => p.userId === agentId);

    // Guarded client-side connect: trigger once when user joins and agent not present
    useEffect(() => {
        if (callingState !== CallingState.JOINED || !call) {
            return;
        }
        if (isAgentInCall) {
            return;
        }
        if (connectAttemptedRef.current) {
            return;
        }

        connectAttemptedRef.current = true;
        const controller = new AbortController();
        void (async () => {
            try {
                await fetch("/api/connect-ai-agent", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ meetingId, agentId }),
                    signal: controller.signal,
                });
            } catch {
                // allow one retry after brief delay
                setTimeout(() => { connectAttemptedRef.current = false; }, 3000);
            }
        })();

        return () => {
            controller.abort();
        };
    }, [callingState, call, isAgentInCall, meetingId, agentId]);

    // Keep effect to re-run when participants change (no-op, used to detect presence)
    useEffect(() => {
        if (callingState !== CallingState.JOINED || !call) {
            return;
        }
        void participants;
    }, [callingState, participants, call]);

    
    useEffect(() => {}, []);

    // No client-side connection spinner since server handles joining
    return null;
};