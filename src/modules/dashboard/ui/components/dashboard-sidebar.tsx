"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import { BotIcon, VideoIcon, StarIcon, HomeIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { usePathname } from "next/navigation";
import { DashboardUserButton } from "./dashboard-user-button";
import { DashboardTrial } from "./dashboard-trial";

const firstSection = [
  {
    icon: HomeIcon,
    label: "Home",
    href: "/",
  },
  {
    icon: VideoIcon,
    label: "Meetings",
    href: "/meetings",
  },
  {
    icon: BotIcon,
    label: "Agents",
    href: "/agents",
  },
];
const secondSection = [
  {
    icon: StarIcon,
    label: "Upgrade",
    href: "/upgrade",
  },
];
export const DashboardSidebar = () => {
  const pathname = usePathname();

  return (
    <Sidebar className="border-r border-slate-200/10 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <SidebarHeader className="p-4 border-b border-slate-700/30">
        <Link href="/" className="flex items-center gap-3 px-2 py-3 rounded-xl hover:bg-slate-700/30 transition-all duration-200 group">
          <div className="relative">
            <Image 
              src="/logo.svg" 
              height={40} 
              width={40} 
              alt="AgentMeet" 
              className="transition-transform duration-300 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
          <div className="flex flex-col">
            <p className="text-xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
              AgentMeet
            </p>
            <p className="text-xs text-slate-400 font-medium">AI Meeting Assistant</p>
          </div>
        </Link>
      </SidebarHeader>
      
      <SidebarContent className="py-4">
        <SidebarGroup className="px-3">
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {firstSection.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    className={cn(
                      "h-12 px-4 rounded-xl transition-all duration-200 border border-transparent",
                      "hover:bg-gradient-to-r hover:from-blue-600/20 hover:to-purple-600/20 hover:border-blue-400/30",
                      "hover:shadow-lg hover:shadow-blue-500/10 hover:scale-[1.02]",
                      "group relative overflow-hidden",
                      pathname === item.href &&
                        "bg-gradient-to-r from-blue-600/30 to-purple-600/30 border-blue-400/50 shadow-lg shadow-blue-500/20 scale-[1.02]"
                    )}
                    isActive={pathname === item.href}
                  >
                    <Link href={item.href} className="flex items-center gap-4">
                      <div className={cn(
                        "p-2 rounded-lg transition-all duration-200",
                        pathname === item.href 
                          ? "bg-blue-500/20 text-blue-300" 
                          : "text-slate-400 group-hover:text-blue-300"
                      )}>
                        <item.icon className="size-5 transition-transform duration-200 group-hover:scale-110" />
                      </div>
                      <span className={cn(
                        "text-sm font-semibold transition-colors duration-200",
                        pathname === item.href 
                          ? "text-white" 
                          : "text-slate-300 group-hover:text-white"
                      )}>
                        {item.label}
                      </span>
                      {pathname === item.href && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          <div className="w-1.5 h-6 bg-gradient-to-b from-blue-400 to-purple-400 rounded-full animate-pulse"></div>
                        </div>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <div className="px-6 py-2">
          <Separator className="bg-slate-700/50" />
        </div>
        
        <SidebarGroup className="px-3">
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {secondSection.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    className={cn(
                      "h-12 px-4 rounded-xl transition-all duration-200 border border-transparent",
                      "hover:bg-gradient-to-r hover:from-amber-600/20 hover:to-orange-600/20 hover:border-amber-400/30",
                      "hover:shadow-lg hover:shadow-amber-500/10 hover:scale-[1.02]",
                      "group relative overflow-hidden",
                      pathname === item.href &&
                        "bg-gradient-to-r from-amber-600/30 to-orange-600/30 border-amber-400/50 shadow-lg shadow-amber-500/20 scale-[1.02]"
                    )}
                    isActive={pathname === item.href}
                  >
                    <Link href={item.href} className="flex items-center gap-4">
                      <div className={cn(
                        "p-2 rounded-lg transition-all duration-200",
                        pathname === item.href 
                          ? "bg-amber-500/20 text-amber-300" 
                          : "text-slate-400 group-hover:text-amber-300"
                      )}>
                        <item.icon className="size-5 transition-transform duration-200 group-hover:scale-110" />
                      </div>
                      <span className={cn(
                        "text-sm font-semibold transition-colors duration-200",
                        pathname === item.href 
                          ? "text-white" 
                          : "text-slate-300 group-hover:text-white"
                      )}>
                        {item.label}
                      </span>
                      {pathname === item.href && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          <div className="w-1.5 h-6 bg-gradient-to-b from-amber-400 to-orange-400 rounded-full animate-pulse"></div>
                        </div>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="p-4 border-t border-slate-700/30 bg-slate-900/50">
        <div className="space-y-3">
          <DashboardTrial/>
          <DashboardUserButton/>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};
