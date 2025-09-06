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
    const {data} = useSuspenseQuery(
        trpc.meetings.getOne.queryOptions({ id:meetingId}),
    );

    const removeMeeting = useMutation(
        trpc.meetings.remove.mutationOptions({
            onSuccess:()=>{
                queryClient.invalidateQueries(trpc.meetings.getMany.queryOptions({}))
                //TODO invalidate free tier
                router.push("/meetings")
            },
        })
    );
    const handelRemoveMeeting = async () => {
        const ok = await confirmRemove();

        if(!ok) return;

        await removeMeeting.mutateAsync({ id: meetingId });
    };

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
            />
            {JSON.stringify(data,null,2)}
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