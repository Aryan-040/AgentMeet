"use client"
import { format } from "date-fns";

import {
    CircleCheckIcon,
    CircleXIcon,
    ClockFadingIcon,
    CornerDownRightIcon,
    LoaderIcon,
    ClockArrowUpIcon,
} from "lucide-react";

import { cn, formatDuration } from "@/lib/utils";

import { GeneratedAvatarProps } from "@/components/generated-avatar"
import { MeetingGetMany } from "@/modules/meetings/types"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.


const statusIcons = {
    upcoming: ClockArrowUpIcon,
    active: LoaderIcon,
    completed: CircleCheckIcon,
    processing: LoaderIcon,
    cancelled: CircleXIcon,
};

const statueColorMap ={ 
    upcoming:"bg-yellow-500/20 text-yellow-800 border-yellow-800/5",
    active:"bg-blue-500/20 text-blue-800 border-blue-800/5",
    completed:"bg-emerald-500/20 text-emerald-800 border-emerald-800/5",
    cancelled:"bg-rose-500/20 text-rose-800 border-rose-800/5",
    processing:"bg-gray-300/20 text-gray-800 border-gray-800/5",
}

export const columns: ColumnDef<MeetingGetMany[number]>[] = [
  {
    accessorKey: "name",
    header: "Meeting Name",
    cell: ({row}) => (
        <div className="flex flex-col gap-y-1">
            <span className="font-bold text-slate-100 capitalize">{row.original.name}</span>
            
            <div className="flex items-center gap-x-2">
                <div className="flex items-center gap-x-1">
                    <CornerDownRightIcon className="size-3 text-slate-400"/>
                    <span className="text-sm text-slate-300 max-w-[200px] truncate capitalize font-medium">
                        {row.original.agent.name}
                    </span>
                </div>
                <GeneratedAvatarProps
                variant="botttsNeutal"
                seed={row.original.agent.name}
                className="size-4"
                />
                <span className="text-sm text-slate-400 font-medium">
                    {row.original.startedAt ? format(row.original.startedAt, "MMM d, yyyy h:mm a") : "Not started"}
                </span>
            </div>
        </div>
    )
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
       const Icon = statusIcons[row.original.status as keyof typeof statusIcons];

       return (
        <Badge 
        variant="outline"
        className={cn(
            "capitalize [&>svg]:size-4 font-bold status-badge",
            statueColorMap[row.original.status as keyof typeof statueColorMap]
        )}
       >
         <Icon
           className={cn(
             row.original.status === "processing" && "animate-spin"
           )}
         />
         {row.original.status}
       </Badge>
       );
    }
  },
  {
    accessorKey: "duration",
    header: "Duration",
    cell: ({ row }) => (
        <Badge
        variant="outline"
        className="capitalize [&>svg]:size-4 flex items-center gap-x-2 number-badge"
        >
        <ClockFadingIcon className="text-purple-400"/>
        <span className="font-bold text-white">
          {row.original.duration ? formatDuration(row.original.duration) : "No Duration"}
        </span>
        </Badge>
    )
  }
];