
"use client";

import { Button } from "@/components/ui/button";
import { Users, Video, PlusCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";

export const HomeView = () => {
  const router = useRouter();
  const trpc = useTRPC();

  // Fetch real-time data
  const { data: totalMeetings = 0 } = useSuspenseQuery(trpc.meetings.getCompletedCount.queryOptions());
  const { data: totalAgents = 0 } = useSuspenseQuery(trpc.agents.getTotalCount.queryOptions());
  const { data: upcomingMeeting = null } = useSuspenseQuery(trpc.meetings.getUpcoming.queryOptions());
  const { data: subscription = null } = useSuspenseQuery(trpc.premium.getCurrentSubscription.queryOptions());

  const subscriptionPlan = subscription?.name || "Free Plan";

  const handleStartMeeting = () => {
    if (upcomingMeeting) {
      router.push(`/meetings/${upcomingMeeting.id}`);
    }
  };

  const handleCreateAgent = () => {
    router.push('/agents');
  };

  const handleUpgrade = () => {
    router.push('/upgrade');
  };

  const handleStartFirstMeeting = () => {
    router.push('/agents');
  };

  const hasMeetings = totalMeetings > 0;

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="glass-dark p-8 rounded-2xl">
        <h1 className="text-4xl font-bold gradient-text-blue mb-2">
          Welcome to AgentMeet 🚀
        </h1>
        <p className="text-slate-300 text-lg">
          Your AI-powered meeting assistant platform
        </p>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-4">
        <Button 
          className="btn-glow bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
          onClick={handleStartMeeting}
          disabled={!upcomingMeeting}
        >
          <Video size={20} className="mr-2" />
          Start Meeting
        </Button>
        <Button 
          variant="outline" 
          className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white px-6 py-3 rounded-xl transition-all duration-300"
          onClick={handleCreateAgent}
        >
          <Users size={20} className="mr-2" />
          Create Agent
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="card-modern p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-200">
              Total Meetings Completed
            </h3>
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <Video size={24} className="text-blue-400" />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-3xl font-bold text-white">{totalMeetings}</p>
            <p className="text-sm text-slate-400">All time meetings</p>
          </div>
        </div>

        <div className="card-modern p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-200">
              Total Agents
            </h3>
            <div className="p-3 bg-purple-500/20 rounded-xl">
              <Users size={24} className="text-purple-400" />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-3xl font-bold text-white">{totalAgents}</p>
            <p className="text-sm text-slate-400">All agents created</p>
          </div>
        </div>

        <div className="card-modern p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-200">
              Subscription
            </h3>
            <div className="p-3 bg-amber-500/20 rounded-xl">
              <span className="text-amber-400 font-bold text-lg">★</span>
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-2xl font-bold text-white">{subscriptionPlan}</p>
            <p className="text-sm text-slate-400">Current plan</p>
            <Button 
              size="sm" 
              className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-lg px-4"
              onClick={handleUpgrade}
            >
              Upgrade
            </Button>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {!hasMeetings && (
        <div className="glass text-center p-12 rounded-2xl">
          <div className="mb-6">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <PlusCircle size={32} className="text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              No meetings yet
            </h3>
            <p className="text-slate-300 mb-6">
              Start your journey with AgentMeet by creating your first meeting
            </p>
            <Button 
              className="btn-glow bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl"
              onClick={handleStartFirstMeeting}
            >
              Create Your First Meeting
            </Button>
          </div>
        </div>
      )}

      {/* Upcoming Meeting Section */}
      {upcomingMeeting && (
        <div className="glass-dark p-6 rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Next Meeting
              </h3>
              <p className="text-slate-300">
                {upcomingMeeting.name || "Upcoming Meeting"}
              </p>
              {upcomingMeeting.startedAt && (
                <p className="text-sm text-slate-400 mt-1">
                  Scheduled for {new Date(upcomingMeeting.startedAt).toLocaleString()}
                </p>
              )}
            </div>
            <Button 
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-2 rounded-lg"
              onClick={handleStartMeeting}
            >
              Join Now
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
