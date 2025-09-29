"use client";
import { Button } from "@/components/ui/button";
import { PlusIcon, XCircleIcon} from "lucide-react";
import { NewMeetingDialog } from "./new-meeting-dialog";
import { useState } from "react";
import { MeetingsSearchFilter } from "./meetings-search-filter";
import { StatusFilter } from "./status-filter";
import { AgentIdFilter } from "./agent-id-filter";
import { useMeetingsFilters } from "@/modules/meetings/hooks/use-meetings-filters";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { DEFAULT_PAGE } from "@/constants";




export const MeetingsListHeader = () => {
  const [filters,setFilters] = useMeetingsFilters();
  const [isDialogOpen, setIsDialogOpen] =useState(false);

  const isAnyFilterModified = 
  !!filters.status || !!filters.search || !!filters.agentId;

  const onClearFilters = () => {
    setFilters({
      status:null,
      agentId:"",
      search:"",
      page:DEFAULT_PAGE,
    })
  }
   
  return (
    <>
      <NewMeetingDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
      <div className="sticky top-0 z-20 border-b border-slate-700/50 bg-slate-800/80 backdrop-blur supports-[backdrop-filter]:bg-slate-800/60">
        <div className="flex items-center justify-between px-4 py-3 md:px-8">
          <h1 className="text-2xl font-semibold tracking-tight text-white">My Meetings</h1>
          <Button onClick={() => setIsDialogOpen(true)} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
            <PlusIcon className="size-4" />
            New Meeting
          </Button>
        </div>
        <ScrollArea className="w-full">
          <div className="flex items-center gap-2 px-4 pb-3 md:px-8 overflow-x-auto">
            <MeetingsSearchFilter />
            <StatusFilter />
            <AgentIdFilter />
            {isAnyFilterModified && (
              <Button variant="outline" onClick={onClearFilters} className="gap-2 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white">
                <XCircleIcon className="size-4" />
                Clear
              </Button>
            )}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </>
  );
};
