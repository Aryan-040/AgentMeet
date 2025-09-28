import { auth } from "@/lib/auth";
import { CallView } from "@/modules/call/ui/view/call-view";
import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

interface Props {
    params:Promise<{
        meetingId: string;
    }>;
};

const Page = async ({ params }:Props) => {
    const { meetingId } = await params;
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    if (!session) {
        redirect("/sign-in");
    }
    const queryClient = getQueryClient();
    
    // Don't prefetch during build time to avoid database connection issues
    if (process.env.NODE_ENV !== 'production') {
        try {
            await queryClient.prefetchQuery(
                trpc.meetings.getOne.queryOptions({ id: meetingId }),
            );
        } catch (e) {
            // If DB is temporarily unavailable, continue rendering and let client fetch
            console.warn("Prefetch meetings.getOne failed", e);
        }
    }

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <CallView  meetingId={ meetingId}/>
        </HydrationBoundary>
    )
}
export default Page;