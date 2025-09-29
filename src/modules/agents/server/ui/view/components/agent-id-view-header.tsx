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
    agentId : string;
    agentName : string;
    onEdit: () => void;
    onRemove: () => void;
}

export const AgentidViewHeader = ({
    agentName,
    onEdit,
    onRemove
}:Props) => {
    return(
        <div className="flex items-center justify-between">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild className="font-medium text-xl text-gray-200 hover:text-white transition-colors">
                            <Link href="/">
                            Home
                            </Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="text-gray-400 text-xl font-medium [&>svg]:size-4">
                    <ChevronRightIcon/>
                    </BreadcrumbSeparator>
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild className="font-medium text-xl text-gray-200 hover:text-white transition-colors">
                            <Link href="/agents">
                            My Agents
                            </Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="text-gray-400 text-xl font-medium [&>svg]:size-4">
                    <ChevronRightIcon/>
                    </BreadcrumbSeparator>
                    <BreadcrumbItem>
                        <BreadcrumbPage className="font-medium text-xl text-white font-bold">
                            {agentName}
                        </BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="hover:bg-slate-700/50 p-2">
                        <MoreVerticalIcon className="h-5 w-5 text-gray-200 hover:text-white transition-colors"/>
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