"use client";

import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { PanelLeftCloseIcon, PanelLeftIcon, SearchIcon } from "lucide-react";
import { DashboardCommand } from "./dashboard-command";
import { useEffect, useState } from "react";

export const DashboardNavbar = () => {
  const { state, toggleSidebar, isMobile } = useSidebar();
  const [commandOpen, setCommandOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, []);

  return (
    <>
      <DashboardCommand open={commandOpen} setOpen={setCommandOpen} />
      <nav className="flex px-6 gap-x-4 items-center py-4 border-b border-slate-700/30 bg-slate-900/50 backdrop-blur-sm">
        <Button 
          className="size-10 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600/30 rounded-xl transition-all duration-200 hover:scale-105"
          onClick={toggleSidebar}
        >
          {state === "collapsed" || isMobile ? (
            <PanelLeftIcon className="size-5 text-slate-300" />
          ) : (
            <PanelLeftCloseIcon className="size-5 text-slate-300" />
          )}
        </Button>
        <Button
          className="h-11 w-[280px] justify-start font-normal text-slate-400 hover:text-slate-200 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600/30 rounded-xl transition-all duration-200"
          variant="outline"
          size="sm"
          onClick={() => setCommandOpen((open) => !open)}
        >
          <SearchIcon className="size-5 mr-3" />
          <span className="flex-1 text-left">Search meetings & agents...</span>
          <kbd className="pointer-events-none inline-flex h-6 select-none items-center gap-1 rounded bg-slate-700/50 px-2 font-mono text-[10px] font-medium text-slate-400 border border-slate-600/30">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
        <div className="flex-1"></div>
      </nav>
    </>
  );
};
