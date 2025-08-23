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

  try {
    const queryClient = getQueryClient();
    await queryClient.prefetchQuery(trpc.agents.getMany.queryOptions({
      ...filters
    }));

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
  } catch (error) {
    console.error("Database connection error:", error);
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Database Connection Error</h1>
          <p className="text-gray-600 mb-4">
            Unable to connect to the database. Please check your DATABASE_URL environment variable.
          </p>
          <p className="text-sm text-gray-500">
            Make sure to create a .env.local file with your DATABASE_URL
          </p>
        </div>
      </div>
    );
  }
};

export default Page;
