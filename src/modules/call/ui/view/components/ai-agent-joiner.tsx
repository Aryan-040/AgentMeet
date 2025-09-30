"use client"

import { useEffect } from "react";
import { useCall, useCallStateHooks, CallingState } from "@stream-io/video-react-sdk";

interface Props {
    meetingId: string;
    agentId: string;
    agentName: string;
    agentInstructions: string;
}

export const AIAgentJoiner = ({ agentId }: Props) => {
    const call = useCall();
    const { useCallCallingState, useParticipants } = useCallStateHooks();
    const callingState = useCallCallingState();
    const participants = useParticipants();
    
    // Local state no longer needed; presence is driven by server webhook
    

    const isAgentInCall = participants.some(p => p.userId === agentId);

    useEffect(() => {
        if (callingState !== CallingState.JOINED || !call) {
            return;
        }

        if (isAgentInCall) {
        // Presence acknowledged
        }

        return () => {};
    }, [callingState, call, isAgentInCall]);

    useEffect(() => {
        if (callingState !== CallingState.JOINED || !call) {
            return;
        }

        // Keep effect to re-run when participants change
    }, [callingState, participants, agentId, call]);

    
    useEffect(() => {}, []);

    // No client-side connection spinner since server handles joining
    return null;
};