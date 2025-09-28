import { auth } from "@/lib/auth";
import { MeetingsListHeader } from "@/modules/meetings/server/ui/components/meetings-list-header";
import {
  MeetingsView,
  MeetingsViewError,
  MeetingsViewLoading,
} from "@/modules/meetings/server/ui/views/meetings-view";
import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { loadSearchParams } from "@/modules/meetings/params";
import type { SearchParams } from "nuqs";

interface Props {
  searchParams:Promise<SearchParams>;
}

const Page = async({ searchParams}: Props) => {
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
      await queryClient.prefetchQuery(trpc.meetings.getMany.queryOptions({
        ...filters,
      }));
    } catch (error) {
      console.warn("Prefetch failed during build:", error);
    }
  }
  return (
    <>
    <MeetingsListHeader/>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<MeetingsViewLoading />}>
          <ErrorBoundary fallback={<MeetingsViewError />}>
            <MeetingsView />
          </ErrorBoundary>
        </Suspense>
      </HydrationBoundary>
    </>
  );
};
export default Page;
