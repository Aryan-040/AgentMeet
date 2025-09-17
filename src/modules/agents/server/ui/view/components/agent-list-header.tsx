"use client";
import { Button } from "@/components/ui/button";
import { PlusIcon, XCircleIcon } from "lucide-react";
import { useState } from "react";
import { NewAgentDialog } from "./new-agent-dialog";
import { AgentsSearchFilter } from "./agent-search-filter";
import { useAgentFilters } from "../../../../hooks/use-agent-filters";
import { DEFAULT_PAGE } from "@/constants";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

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
      <NewAgentDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
      <div className="sticky top-0 z-20 border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="flex items-center justify-between px-4 py-3 md:px-8">
          <h1 className="text-2xl font-semibold tracking-tight">My Agents</h1>
          <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
            <PlusIcon className="size-4" />
            New Agent
          </Button>
        </div>
        <ScrollArea className="w-full">
          <div className="flex items-center gap-2 px-4 pb-3 md:px-8 overflow-x-auto">
            <AgentsSearchFilter />
            {isAnyFilterModified && (
              <Button variant="outline" onClick={onClearFilters} className="gap-2">
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
