import { AgentIdView, AgentIdViewError, AgentIdViewLoading } from "@/modules/agents/server/ui/view/agent-Id-view";
import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

interface Props {
    params: Promise<{ agentId: string}>
};

const Page = async ({params} : Props) => {
    const { agentId } = await params;

    const queryClient = getQueryClient();
    
    // Don't prefetch during build time to avoid database connection issues
    if (process.env.NODE_ENV !== 'production') {
        try {
            await queryClient.prefetchQuery(
                trpc.agents.getOne.queryOptions({ id: agentId}),
            );
        } catch (error) {
            console.warn("Prefetch failed during build:", error);
        }
    }
    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <Suspense fallback ={<AgentIdViewLoading/>}>
                <ErrorBoundary fallback={<AgentIdViewError/>}>
                    <AgentIdView agentId={agentId}/>
                </ErrorBoundary>
            </Suspense>

        </HydrationBoundary>
    );
}
export default Page;