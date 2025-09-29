"use client"

import { useEffect, useState, useRef } from "react";
import { useCall, useCallStateHooks, CallingState } from "@stream-io/video-react-sdk";
import { LoaderIcon } from "lucide-react";

interface Props {
    meetingId: string;
    agentId: string;
    agentName: string;
    agentInstructions: string;
}

export const AIAgentJoiner = ({ 
    meetingId, 
    agentId, 
    agentName 
}: Props) => {
    const call = useCall();
    const { useCallCallingState, useParticipants } = useCallStateHooks();
    const callingState = useCallCallingState();
    const participants = useParticipants();
    
    const [isAgentConnected, setIsAgentConnected] = useState(false);
    const [connectionAttempts, setConnectionAttempts] = useState(0);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const connectionCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);


    const isAgentInCall = participants.some(p => p.userId === agentId);

    useEffect(() => {
        // Only attempt to connect agent when user is in an active call
        if (callingState !== CallingState.JOINED || !call) {
            return;
        }

        // If agent is already connected, no need to do anything
        if (isAgentInCall) {
            setIsAgentConnected(true);
            return;
        }

        const connectAgent = async () => {
            try {
                console.log("[AIAgentJoiner] Attempting to connect AI agent:", {
                    meetingId,
                    agentId,
                    agentName,
                    attempt: connectionAttempts + 1
                });

                // Call the webhook endpoint to trigger AI agent connection
                const response = await fetch("/api/webhook", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        type: "call.session_started",
                        call: {
                            custom: { meetingId },
                            cid: `default:${meetingId}`
                        },
                        call_cid: `default:${meetingId}`
                    }),
                });

                if (!response.ok) {
                    throw new Error(`Failed to connect AI agent: ${response.statusText}`);
                }

                console.log("[AIAgentJoiner] AI agent connection triggered successfully");
                setConnectionAttempts(prev => prev + 1);
                
                // Give some time for the agent to join
                setTimeout(() => {
                    setIsAgentConnected(true);
                }, 2000);

            } catch (error) {
                console.error("[AIAgentJoiner] Failed to connect AI agent:", error);
                
                // Retry connection after a delay
                if (connectionAttempts < 3) {
                    reconnectTimeoutRef.current = setTimeout(() => {
                        connectAgent();
                    }, 5000);
                }
            }
        };

        connectAgent();

        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };
    }, [callingState, call, meetingId, agentId, agentName, isAgentInCall, connectionAttempts]);

    useEffect(() => {
        if (callingState !== CallingState.JOINED || !call) {
            return;
        }

        const checkAgentConnection = () => {
            const agentPresent = participants.some(p => p.userId === agentId);
            
            if (!agentPresent && isAgentConnected) {
                console.log("[AIAgentJoiner] Agent disconnected, attempting to reconnect...");
                setIsAgentConnected(false);
                
                // Trigger reconnection
                if (connectionAttempts < 3) {
                    setConnectionAttempts(prev => prev + 1);
                }
            }
        };

        connectionCheckIntervalRef.current = setInterval(checkAgentConnection, 10000);

        return () => {
            if (connectionCheckIntervalRef.current) {
                clearInterval(connectionCheckIntervalRef.current);
            }
        };
    }, [callingState, participants, agentId, isAgentConnected, connectionAttempts]);

    
    useEffect(() => {
        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (connectionCheckIntervalRef.current) {
                clearInterval(connectionCheckIntervalRef.current);
            }
        };
    }, [isAgentConnected, call]);

    if (callingState !== CallingState.JOINED || isAgentConnected) {
        return null;
    }

    return (
        <div className="fixed top-4 right-4 z-50 bg-slate-800 text-white px-4 py-2 rounded-lg shadow-lg">
            <div className="flex items-center gap-2">
                <LoaderIcon className="size-4 animate-spin" />
                <span className="text-sm">Connecting AI Agent...</span>
            </div>
        </div>
    );
};