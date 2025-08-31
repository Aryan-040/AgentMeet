"use client"

import { GeneratedAvatarProps } from "@/components/generated-avatar"

import { inferRouterOutputs } from "@trpc/server"
import type { AppRouter } from "@/trpc/routers/_app"

type AgentGetMany = inferRouterOutputs<AppRouter>["agents"]["getMany"]["items"][0]
import { ColumnDef } from "@tanstack/react-table"
import { CornerDownRightIcon, VideoIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.

export const columns: ColumnDef<AgentGetMany>[]= [
  {
    accessorKey: "name",
    header: "Agent Name",
    cell: ({row}) => (
        <div className="flex flex-col gap-y-1">
            <div className="flex items-center gap-x-2">
                <GeneratedAvatarProps
                variant ="botttsNeutal"
                seed={row.original.name}
                className="size-6"
                />
                <span className="font-semibold capitalize">
                    {row.original.name}
                </span>

            </div>
            <div className="flex items-center gap-x-2">
                <div className="flex items-center gap-x-1">
                    <CornerDownRightIcon className="size-3 text-muted-foreground"/>
                    <span className="text-sm text-muted-foreground max-w-[200px] truncate capitalize">
                        {row.original.instructions}
                    </span>
                </div>
            </div>

        </div>
    )
  },
  {
    accessorKey: "meetingCount",
    header: "Meeting" ,
    cell: ({ row }) => (
        <Badge
            variant="outline"
            className="flex items-center gap-x-2 [&>svg]:size-4"
        >
            <VideoIcon className="text-blue-700"/>
            {row.original.meetingCount} {row.original.meetingCount === 1 ? "meeting" : "meetings"}
        </Badge>
    )
  }
  
]