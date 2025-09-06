import { ChevronRightIcon , TrashIcon, PencilIcon, MoreVerticalIcon} from "lucide-react";
import Link from "next/link";

import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuItem,
    DropdownMenuContent
} from "@/components/ui/dropdown-menu";

import{
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbPage,
    BreadcrumbSeparator,
}from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";

interface Props {
    meetingId : string;
    meetingName : string;
    onEdit: () => void;
    onRemove: () => void;
}

export const MeetingidViewHeader = ({
    meetingId,
    meetingName,
    onEdit,
    onRemove
}:Props) => {
    return(
        <div className="flex items-center justify-between">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild className="font-medium text-xl">
                            <Link href="/">
                            Home
                            </Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="text-foreground text-xl font-medium [&>svg]:size-4">
                    <ChevronRightIcon/>
                    </BreadcrumbSeparator>
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild className="font-medium text-xl">
                            <Link href="/meetings">
                            My Meetings
                            </Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="text-foreground text-xl font-medium [&>svg]:size-4">
                    <ChevronRightIcon/>
                    </BreadcrumbSeparator>
                    <BreadcrumbItem>
                        <BreadcrumbPage className="font-medium text-xl text-foreground">
                            {meetingName}
                        </BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost">
                        <MoreVerticalIcon/>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={onEdit}>
                        <PencilIcon className="size-4 text-black"/>
                        Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onRemove}>
                        <TrashIcon className="size-4 text-black"/>
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}