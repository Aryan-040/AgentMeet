import { GeneratedAvatarProps } from "@/components/generated-avatar";
import { CommandSelect } from "@/components/ui/command-select";
import { useMeetingsFilters } from "@/modules/meetings/hooks/use-meetings-filters"
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

export const AgentIdFilter = () => {
    const[filters,setFilters] = useMeetingsFilters();

    const trpc = useTRPC();

    const[agentSearch,setAgentSearch] = useState("");
    const { data } = useQuery(
        trpc.agents.getMany.queryOptions({
            pageSize:100,
            search:agentSearch,
        }),
    );
    return(
        <CommandSelect
        className="h-9"
        placeholder="Agent"
        options={(data?.items ?? []).map((agent) => ({
            id: agent.id,
            value: agent.id,
            children: (
                <div className="flex items-center gap-x-2">
                    <GeneratedAvatarProps
                    seed={agent.name}
                    variant="botttsNeutal"
                    className="size-4"
                    />
                    {agent.name}

                </div>
            )
        }))}
        onSelect={(value) => setFilters({agentId: value})}
        onSearch={setAgentSearch}
        value={filters.agentId ?? ""}
        />
    )
}