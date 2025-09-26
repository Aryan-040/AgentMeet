"use client"

import { useState } from "react";
import { StreamTheme, useCall, useCallStateHooks, CallingState } from "@stream-io/video-react-sdk";
import { CallLobby } from "./call-lobby";
import { CallActive } from "./call-active";
import { CallEnded } from "./call-ended";
interface Props {
    meetingId: string;
    meetingName: string;
};

export const CallUI = ({ meetingId, meetingName}: Props) => {
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
        } catch (error) {
            console.error("Failed to leave call", error);
        } finally {
            setShow("ended");
        }
    };
    return (
        <StreamTheme className="h-screen">
            {show === "lobby" && <CallLobby onJoin={handleJoin}/>}
            {show === "call" && <CallActive onLeave={handleLeave} meetingName={meetingName}/>}
            {show === "ended" && <CallEnded/>}
        </StreamTheme>
    )
    
};