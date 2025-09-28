"use client";
import { ErrorState } from "@/components/error-state ";
import { LoadingState } from "@/components/loading-state";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { MeetingidViewHeader } from "../components/meeting-id-view-header";
import { useRouter } from "next/navigation";
import { useConfirm } from "@/hooks/use-confirm";
import { UpdateMeetingDialog } from "../components/update-meeting-dialog";
import { useState } from "react";
import { toast } from "sonner";
import { UpcomingState } from "../components/upcoming-state";
import { ActiveState } from "../components/active-state";
import { CancelledState } from "../components/cancelled-state";
import { ProcessingState } from "../components/processing-state";
import { CompletedState } from "../components/completed-state";

interface Props{
    meetingId:string;
}

export const MeetingIdView = ({meetingId}:Props) => {
    const trpc = useTRPC();
    const router = useRouter();
    const queryClient = useQueryClient();

    const[updateMeetingDialogOpen, setUpdateMeetingDialogOpen] = useState(false);
    const[RemoveConfirmation, confirmRemove] = useConfirm(
        "Are you sure?",
        "the following actions will remove this meeting"
    );
    const {data} = useSuspenseQuery({
        ...trpc.meetings.getOne.queryOptions({ id:meetingId}),
        // Enable polling for processing meetings to automatically update status
        refetchInterval: (query) => {
            // Only poll if the meeting is in processing state
            return query.state.data?.status === "processing" ? 3000 : false; // Poll every 3 seconds
        },
        // Stop polling when tab is not active
        refetchIntervalInBackground: false,
    });

    const removeMeeting = useMutation(
        trpc.meetings.remove.mutationOptions({
            onSuccess:async()=>{
                queryClient.invalidateQueries(trpc.meetings.getMany.queryOptions({}))
                await queryClient.invalidateQueries(trpc.premium.getFreeUsage.queryOptions());
                router.push("/meetings")
            },
        })
    );
    const handelRemoveMeeting = async () => {
        const ok = await confirmRemove();

        if(!ok) return;

        await removeMeeting.mutateAsync({ id: meetingId });
    };

    const regenerateSummary = useMutation(
        trpc.meetings.regenerateSummary.mutationOptions({
            onSuccess: () => {
                // Invalidate queries to refresh the data
                queryClient.invalidateQueries(trpc.meetings.getOne.queryOptions({ id: meetingId }));
                // Show success message
                toast.success("Summary regeneration started! The page will update automatically.");
            },
            onError: (error) => {
                toast.error(`Failed to regenerate summary: ${error.message}`);
            },
        })
    );

    const handleRegenerateSummary = async () => {
        await regenerateSummary.mutateAsync({ id: meetingId });
    };

    const isActive = data.status ==="active";
    const isUpcoming = data.status ==="upcoming";
    const isCancelled = data.status ==="cancelled";
    const isCompleted = data.status ==="completed";
    const isProcessing = data.status ==="processing";
    
    return(
        <>
        <RemoveConfirmation/>
        <UpdateMeetingDialog
        open={updateMeetingDialogOpen}
        onOpenChange={setUpdateMeetingDialogOpen}
        initialValues={data}/>
        <div className="flex-1 py-4 px-4 md:px-8 flex flex-col gap-y-4">
            <MeetingidViewHeader
            meetingId={meetingId}
            meetingName={data.name}
            onEdit={() => setUpdateMeetingDialogOpen(true)}
            onRemove={handelRemoveMeeting}
            onRegenerateSummary={handleRegenerateSummary}
            canRegenerateSummary={isCompleted && !!data.transcriptUrl}
            />
            {isCancelled && <CancelledState/>}
            {isProcessing && <ProcessingState/>}
            {isCompleted && <CompletedState data={data}/>}
            {isActive && <ActiveState meetingId={meetingId}/>}
            {isUpcoming && (<UpcomingState
            meetingId={meetingId}
            isCancelling={false}
            />)}
            
        </div>
        </>
    )
};
export const MeetingIdViewLoading = () => {
    return(
        <LoadingState
        title="Loading Meeting"
        description="This may take few seconds"
        />
    )
};
export const MeetingIdViewError = () => {
    return(
        <ErrorState
        title="Error Loading Meeting"
        description="Please Try again later"
        />
    )
};