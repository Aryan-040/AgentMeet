"use client";
import { Button } from "@/components/ui/button";
import { PlusIcon, XCircleIcon } from "lucide-react";
import { useState } from "react";
import { NewAgentDialog } from "./new-agent-dialog";
import { AgentsSearchFilter } from "./agent-search-filter";
import { useAgentFilters } from "../../../../hooks/use-agent-filters";
import { DEFAULT_PAGE } from "@/constants";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { ScrollBar } from "@/components/ui/scroll-area";

export const AgentsListHeader = () => {
    const [filters, setfilters] = useAgentFilters();
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const isAnyFilterModified = !!filters.search;

    const onClearFilters = () => {
      setfilters({
        search: "",
        page: DEFAULT_PAGE,
      });
    }
  return (
    <>
    <NewAgentDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}/ >
      <div className="py-4 px-4 md:px-8 flex flex-col gap-y-4">
        <div className="flex items-center justify-between">
          <h5 className="font-medium text-xl">My Agents</h5>

          <Button onClick={() => setIsDialogOpen(true)}>
            <PlusIcon />
            New Agent
          </Button>
        </div>
        <ScrollArea>
        <div className="flex items-center gap-x-2 p-1">
          <AgentsSearchFilter/>
          {isAnyFilterModified && (
            <Button variant="outline" size="sm" onClick={onClearFilters}>
              <XCircleIcon/>
              clear
            </Button>
          )}

        </div>
        <ScrollBar orientation="horizontal"/>
        </ScrollArea>
      </div>
    </>
  );
};
