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
    const [isConnecting, setIsConnecting] = useState(false);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const connectionCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const connectionInitiatedRef = useRef(false);

    const isAgentInCall = participants.some(p => p.userId === agentId);

    useEffect(() => {
        // Only attempt to connect agent when user is in an active call
        if (callingState !== CallingState.JOINED || !call) {
            return;
        }

        // If agent is already connected, no need to do anything
        if (isAgentInCall) {
            console.log("[AIAgentJoiner] AI agent is already in the call");
            setIsAgentConnected(true);
            return;
        }

        // Prevent multiple connection attempts
        if (isConnecting || connectionInitiatedRef.current) {
            console.log("[AIAgentJoiner] Connection already in progress or initiated");
            return;
        }

        // Only connect when there are actual participants (not just the AI agent)
        const humanParticipants = participants.filter(p => p.userId !== agentId);
        if (humanParticipants.length === 0) {
            console.log("[AIAgentJoiner] No human participants in meeting yet, waiting...");
            return;
        }

        const connectAgent = async () => {
            // Mark connection as initiated to prevent duplicates
            connectionInitiatedRef.current = true;
            setIsConnecting(true);

            try {
                console.log("[AIAgentJoiner] Attempting to connect AI agent:", {
                    meetingId,
                    agentId,
                    agentName,
                    humanParticipants: humanParticipants.length,
                    attempt: connectionAttempts + 1
                });

                // Add a small delay on first attempt to ensure meeting is fully established
                if (connectionAttempts === 0) {
                    console.log("[AIAgentJoiner] Waiting 2 seconds before first connection attempt...");
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }

                // Call the connect-ai-agent endpoint to trigger AI agent connection
                const response = await fetch("/api/connect-ai-agent", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        meetingId,
                        agentId,
                    }),
                });

                if (!response.ok) {
                    let errorData;
                    try {
                        errorData = await response.json();
                    } catch {
                        errorData = { error: await response.text() };
                    }
                    
                    console.error(`[AIAgentJoiner] Connect AI agent failed:`, {
                        status: response.status,
                        statusText: response.statusText,
                        error: errorData.error || errorData.details || 'Unknown error',
                        fullError: errorData
                    });
                    
                    throw new Error(`Failed to connect AI agent: ${errorData.error || errorData.details || response.statusText}`);
                }

                const responseData = await response.json();
                console.log("[AIAgentJoiner] AI agent connection successful:", responseData);
                setConnectionAttempts(prev => prev + 1);
                
                // Give some time for the agent to join
                setTimeout(() => {
                    setIsAgentConnected(true);
                    setIsConnecting(false);
                }, 2000);

            } catch (error) {
                setIsConnecting(false);
                const errorMessage = error instanceof Error ? error.message : String(error);
                console.error("[AIAgentJoiner] Failed to connect AI agent:", errorMessage);
                
                // Smart retry logic - don't retry on certain errors
                const shouldNotRetry = errorMessage.includes('not found') || 
                                     errorMessage.includes('completed') || 
                                     errorMessage.includes('cancelled') ||
                                     errorMessage.includes('Authentication failed') ||
                                     errorMessage.includes('Another AI agent is already connected');
                
                if (!shouldNotRetry && connectionAttempts < 3) {
                    console.log(`[AIAgentJoiner] Retrying connection in 5 seconds (attempt ${connectionAttempts + 1}/3)`);
                    connectionInitiatedRef.current = false; // Allow retry
                    reconnectTimeoutRef.current = setTimeout(() => {
                        connectAgent();
                    }, 5000);
                } else if (shouldNotRetry) {
                    console.error("[AIAgentJoiner] Not retrying due to permanent error:", errorMessage);
                    connectionInitiatedRef.current = false; // Reset for future attempts if meeting becomes active again
                } else {
                    console.error("[AIAgentJoiner] Max retry attempts reached");
                    connectionInitiatedRef.current = false; // Reset for future attempts
                }
            }
        };

        connectAgent();

        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };
    }, [callingState, call, meetingId, agentId, agentName, isAgentInCall, connectionAttempts, isConnecting, participants]);

    useEffect(() => {
        if (callingState !== CallingState.JOINED || !call) {
            return;
        }

        const checkAgentConnection = () => {
            const agentPresent = participants.some(p => p.userId === agentId);
            
            if (!agentPresent && isAgentConnected) {
                console.log("[AIAgentJoiner] Agent disconnected, attempting to reconnect...");
                setIsAgentConnected(false);
                connectionInitiatedRef.current = false; // Allow reconnection
                
                // Trigger reconnection
                if (connectionAttempts < 3) {
                    setConnectionAttempts(prev => prev + 1);
                }
            } else if (agentPresent && !isAgentConnected) {
                console.log("[AIAgentJoiner] Agent detected in call, updating state...");
                setIsAgentConnected(true);
            }
        };

        connectionCheckIntervalRef.current = setInterval(checkAgentConnection, 5000);

        return () => {
            if (connectionCheckIntervalRef.current) {
                clearInterval(connectionCheckIntervalRef.current);
            }
        };
    }, [callingState, participants, agentId, isAgentConnected, connectionAttempts, call]);

    
    useEffect(() => {
        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (connectionCheckIntervalRef.current) {
                clearInterval(connectionCheckIntervalRef.current);
            }
        };
    }, []);

    if (callingState !== CallingState.JOINED || isAgentConnected || !isConnecting) {
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