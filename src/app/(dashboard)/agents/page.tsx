import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";
import { Suspense } from "react";
import { AgentsListHeader } from "@/modules/agents/server/ui/view/components/agent-list-header";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SearchParams } from "nuqs";
import { loadSearchParams } from "@/modules/agents/params";


import {
  AgentsView,
  AgentsViewError,
  AgentsViewLoading,
} from "@/modules/agents/server/ui/view/agents-view";

interface Props {
  searchParams: Promise<SearchParams>;
}

const Page = async ({searchParams}: Props) => {
  const filters = await loadSearchParams(searchParams);
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
      await queryClient.prefetchQuery(trpc.agents.getMany.queryOptions({
        ...filters
      }));
    } catch (error) {
      console.warn("Prefetch failed during build:", error);
    }
  }

  return (
    <>
      <AgentsListHeader />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<AgentsViewLoading />}>
          <ErrorBoundary fallback={<AgentsViewError />}>
            <AgentsView />
          </ErrorBoundary>
        </Suspense>
      </HydrationBoundary>
    </>
  );
};

export default Page;
