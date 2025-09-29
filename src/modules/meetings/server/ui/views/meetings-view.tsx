"use client";

import { DataTable } from "@/components/data-table";
import { ErrorState } from "@/components/error-state ";
import { LoadingState } from "@/components/loading-state";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { columns } from "../components/columns";
import { EmptyState } from "@/components/empty-state";
import { useRouter } from "next/navigation";
import { useMeetingsFilters } from "@/modules/meetings/hooks/use-meetings-filters";
import { DataPagination } from "@/components/data-pagination";

export const MeetingsView = () => {
    const trpc = useTRPC();
    const router = useRouter();
    const [filters,setFilters] = useMeetingsFilters();
    const { data } = useSuspenseQuery({
        ...trpc.meetings.getMany.queryOptions({
            ...filters,
        }),
        // Enable polling if there are any processing meetings
        refetchInterval: (query) => {
            // Only poll if there are meetings in processing state
            const hasProcessingMeetings = query.state.data?.items?.some(meeting => meeting.status === "processing");
            return hasProcessingMeetings ? 5000 : false; // Poll every 5 seconds
        },
        // Stop polling when tab is not active
        refetchIntervalInBackground: false,
    });

    return (
        <div className="flex-1 h-full">
            <div className="glass-dark">
                <div className="p-6">
                    <DataTable
                        data={data.items}
                        columns={columns}
                        onRowClick={(row) => router.push(`/meetings/${row.id}`)}
                    />
                </div>
                <div className="border-t border-slate-700/30 p-4">
                    <DataPagination
                        page={filters.page}
                        totalPages={data.totalPages}
                        onPageChange={(page) => setFilters({ page })}
                    />
                </div>
            </div>
            {data.items.length === 0 && (
                <div className="mt-6">
                    <EmptyState
                        title="Create your first meeting"
                        description="Create a meeting to get started."
                    />
                </div>
            )}
        </div>
    )
};

export const MeetingsViewLoading = () => {
    return(
        <LoadingState
        title="Loadng Meetings"
        description="This may take a few seconds"/>
    );
};

export const MeetingsViewError = ()=>{
    return(
        <ErrorState
        title="Error Loading Meetings"
        description="Soemthing went wrong"/>
    )
}