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
        if (callingState !== CallingState.JOINED || !call) {
            return;
        }

        if (isAgentInCall) {
            setIsAgentConnected(true);
        }

        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };
    }, [callingState, call, isAgentInCall]);

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

    // No client-side connection spinner since server handles joining
    if (true) {
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