import { CommandResponsiveDialog, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Dispatch, SetStateAction } from "react"

interface props{
    open:boolean;
    setOpen:Dispatch<SetStateAction<boolean>>;
};
export const DashboardCommand = ({open,setOpen}:props) => {
    return (
        <CommandResponsiveDialog open={open} onOpenChange={setOpen}>
            <CommandInput
            placeholder = "Find a meeting"/>
            <CommandList>
                <CommandItem>
                    Test
                </CommandItem>
            </CommandList>
        </CommandResponsiveDialog>
    );
};