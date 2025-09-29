import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { HomeView } from "@/modules/home/views/home-view";
import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

const Page = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if(!session) {
    redirect("/sign-in");
  }

  const queryClient = getQueryClient();
  
  // Don't prefetch during build time to avoid database connection issues
  if (process.env.NODE_ENV !== 'production') {
    try {
      // Prefetch all the data needed for the home page
      await queryClient.prefetchQuery(trpc.meetings.getCompletedCount.queryOptions());
      await queryClient.prefetchQuery(trpc.agents.getTotalCount.queryOptions());
      await queryClient.prefetchQuery(trpc.meetings.getUpcoming.queryOptions());
      await queryClient.prefetchQuery(trpc.premium.getCurrentSubscription.queryOptions());
    } catch (error) {
      console.warn("Prefetch failed during build:", error);
    }
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HomeView />
    </HydrationBoundary>
  );
};

export default Page;