import { authClient } from "@/lib/auth-client";
import{
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuItem
}from "@/components/ui/dropdown-menu";

import{
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
}from "@/components/ui/drawer";

import {  Avatar ,AvatarImage } from "@/components/ui/avatar";

import { ChevronsDownIcon, LogOutIcon, CreditCardIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";

export const DashboardUserButton = () => {
    const router = useRouter();
    const isMobile = useIsMobile();
    const { data,isPending} = authClient.useSession();

    const onLogout = ()=>{
        authClient.signOut({
            fetchOptions:{
                onSuccess:()=>{
                    router.push("/sign-in");
                }
            }
        })    
    }

    if (isPending || !data?.user){
        return null;
    }
    // Move initials declaration here, after confirming data.user exists
    const initials = data.user.name
        ? data.user.name.split(" ").map((n) => n[0]).join("").toUpperCase()
        : "U";
    if (isMobile){
        return (
            <Drawer>
                <DrawerTrigger className="rounded-lg border border-border/10 p-3 w-full flex items-center justify-between bg-white/5 hover:bg-white/10 overflow-hidden">
                <div className="flex items-center w-full">
                    {data.user.image ? (
                        <Avatar className="size-10 mr-3">
                            {/* AvatarImage src must be string or undefined */}
                            <AvatarImage src={data.user.image ?? undefined}/>
                        </Avatar>
                    ) : (
                        <Avatar className="size-10 mr-3">
                            <span className="w-10 h-10 flex items-center justify-center font-bold bg-gray-300 text-gray-700 rounded-full text-lg">
                                {initials}
                            </span>
                        </Avatar>
                    )}
                    <div className="flex flex-col gap-0.5 text-left overflow-hidden flex-1 min-w-0 justify-center">
                        <span className="text-sm font-medium truncate w-full leading-tight">
                            {data.user.name}
                        </span>
                        <span className="text-xs text-muted-foreground truncate w-full leading-tight">
                            {data.user.email}
                        </span>
                    </div>
                </div>
                <ChevronsDownIcon className="size-4 shrink-0 ml-2"/>
                </DrawerTrigger>
                <DrawerContent>
                    <DrawerHeader>
                        <DrawerTitle>{data.user.name}</DrawerTitle>
                        <DrawerDescription>{data.user.email}</DrawerDescription>
                    </DrawerHeader>
                    <DrawerFooter>
                        <Button
                            variant="outline"
                            onClick={() => {}}
                            >
                            <CreditCardIcon className="size-4 text-black"/>
                            Billing
                        </Button>
                        <Button
                            variant="outline"
                            onClick={onLogout}
                            >
                            <LogOutIcon className="size-4 text-black"/>
                            Logout
                        </Button>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        )
    }
    return(
        <DropdownMenu>
            <DropdownMenuTrigger className="rounded-lg border border-border/10 p-3 w-full flex items-center justify-between bg-white/5 hover:bg-white/10 overflow-hidden">
                <div className="flex items-center w-full">
                    {data.user.image ? (
                        <Avatar className="size-10 mr-3">
                            <AvatarImage src={data.user.image ?? undefined}/>
                        </Avatar>
                    ) : (
                        <Avatar className="size-10 mr-3">
                            <span className="w-10 h-10 flex items-center justify-center font-bold bg-gray-300 text-gray-700 rounded-full text-lg">
                                {initials}
                            </span>
                        </Avatar>
                    )}
                    <div className="flex flex-col gap-0.5 text-left overflow-hidden flex-1 min-w-0 justify-center">
                        <span className="text-sm font-medium truncate w-full leading-tight">
                            {data.user.name}
                        </span>
                        <span className="text-xs text-muted-foreground truncate w-full leading-tight">
                            {data.user.email}
                        </span>
                    </div>
                </div>
                <ChevronsDownIcon className="size-4 shrink-0 ml-2"/>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side='right' className="w-72">
                <DropdownMenuLabel>
                    <div className="flex flex-col gap-0.5">
                        <span className="font-medium truncate w-full leading-tight">
                            {data.user.name}
                        </span>
                        <span className="text-sm font-normal text-muted-foreground truncate w-full leading-tight">
                            {data.user.email}
                        </span>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator/>
                <DropdownMenuItem className='cursor-pointer flex items-center justify-between'>
                    Billing
                    <CreditCardIcon className='size-4'/>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onLogout} className='cursor-pointer flex items-center justify-between'>
                    Logout
                    <LogOutIcon className='size-4'/>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}