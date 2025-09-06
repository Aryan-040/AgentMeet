"use client";
import { Button } from "@/components/ui/button";
import { PlusIcon, XCircleIcon} from "lucide-react";
import { NewMeetingDialog } from "./new-meeting-dialog";
import { useState } from "react";
import { MeetingsSearchFilter } from "./meetings-search-filter";
import { StatusFilter } from "./status-filter";
import { AgentIdFilter } from "./agent-id-filter";
import { useMeetingsFilters } from "@/modules/meetings/hooks/use-meetings-filters";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { ScrollBar } from "@/components/ui/scroll-area";
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
    <NewMeetingDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}/>
        <div className="flex items-center justify-between">
          <h5 className="font-medium text-xl">My Meetings</h5>

          <Button onClick={() => setIsDialogOpen(true)}>
            <PlusIcon />
            New Meeting
          </Button>
        </div>
        <ScrollArea>
        <div className="flex items-center gap-x-2 p-1">
          <MeetingsSearchFilter/>
          <StatusFilter/>
          <AgentIdFilter/>
          {isAnyFilterModified && (
            <Button variant="outline" onClick={onClearFilters}>
              <XCircleIcon className="size-4"/>
              Clear

            </Button>
          )}
        </div>
        <ScrollBar orientation="horizontal"/>
        </ScrollArea>
    </>
  );
};
