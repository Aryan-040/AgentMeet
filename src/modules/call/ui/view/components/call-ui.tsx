"use client"

import { useState } from "react";
import { StreamTheme, useCall, useCallStateHooks, CallingState } from "@stream-io/video-react-sdk";
import { CallLobby } from "./call-lobby";
import { CallActive } from "./call-active";
import { CallEnded } from "./call-ended";
import { AIAgentJoiner } from "./ai-agent-joiner";

interface Props {
    meetingId: string;
    meetingName: string;
    agent: {
        id: string;
        name: string;
        instructions: string;
    };
};

export const CallUI = ({ meetingId, meetingName, agent}: Props) => {
    const call = useCall();
    const { useCallCallingState } = useCallStateHooks();
    const callingState = useCallCallingState();
    const [show,setShow] = useState<"lobby" | "call" | "ended">("lobby");
    const [isJoining, setIsJoining] = useState(false);

    const handleJoin =async () => {
        if(!call || isJoining) return;

        setIsJoining(true);
        try {
            // Create the call if it doesn't exist yet to avoid 404 from coordinator
            await call.join({ create: true });
            // Ensure meetingId is attached for server-side webhook consumers
            await call.update({ custom: { meetingId } });
            setShow("call");
        } catch (error) {
            console.error("Failed to join call", error);
        } finally {
            setIsJoining(false);
        }
    };
    const handleLeave = async () => {
        if (!call) return;
        if (callingState === CallingState.LEFT) {
            setShow("ended");
            return;
        }
        try {
            // End the call so the backend receives call.session_ended immediately
            await call.endCall();
            // Best-effort fallback: mark meeting as ended to move status to processing
            try {
                await fetch("/api/meetings/mark-ended", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ meetingId }),
                });
            } catch {
                // ignore; webhook should still process
            }
        } catch (error) {
            console.error("Failed to leave call", error);
        } finally {
            setShow("ended");
        }
    };
    return (
        <StreamTheme className="h-screen">
            {show === "lobby" && <CallLobby onJoin={handleJoin}/>}
            {show === "call" && (
                <>
                    <CallActive onLeave={handleLeave} meetingName={meetingName}/>
                    <AIAgentJoiner 
                        meetingId={meetingId}
                        agentId={agent.id}
                        agentName={agent.name}
                        agentInstructions={agent.instructions}
                    />
                </>
            )}
            {show === "ended" && <CallEnded/>}
        </StreamTheme>
    )
    
};