"use client"
import { ErrorState } from "@/components/error-state ";
import { LoadingState } from "@/components/loading-state";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AgentidViewHeader } from "./components/agent-id-view-header";
import { GeneratedAvatarProps } from "@/components/generated-avatar";
import { Badge } from "@/components/ui/badge";
import {  VideoIcon } from "lucide-react";

interface Props{
    agentId: string;
}

export const AgentIdView = ({ agentId }:  Props) => {
    const trpc = useTRPC();

    const { data } = useSuspenseQuery(trpc.agents.getOne.queryOptions({ id: agentId }));

    return(
        <div className="flex-1 py-4 px-4 md:px-8 flex flex-col gap-y-4">
           <AgentidViewHeader
             agentId={agentId}
             agentName={data.name}
             onEdit={() => {}}
             onRemove={() => {}}
           />
           <div className="bg-white rounded-lg border">
            <div className="px-4 py-5 gap-y-5 flex flex-col col-span-5">
                <div className="flex items-center gap-x-3">
                    <GeneratedAvatarProps
                    variant="botttsNeutal"
                    seed={data.name}
                    className="size-10"/>
                </div>
                <Badge
                variant="outline"
                className="flex items-center gap-x-2 [&>svg]:size-4"
                >
                    <VideoIcon className="text-green-700"/>
                    {data.meetingCount} {data.meetingCount ===1 ? "meeting" : "meetings"}

                </Badge>
                <div className="flex flex-col gap-y-4">
                    <p className= "text-lg font-medium">
                        Instructions

                    </p>
                    <p className="text-neutral-800">{data.instructions}</p>

                </div>

            </div>

           </div>
        </div>
    )
}
export const AgentIdViewLoading = () => {
    return(
        <LoadingState
        title="Loadng Agent"
        description="This may take a few seconds"/>
    );
};

export const AgentIdViewError = ()=>{
    return(
        <ErrorState
        title="Error Loading Agent"
        description="Soemthing went wrong"/>
    )
}