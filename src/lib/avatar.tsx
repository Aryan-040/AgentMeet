import { createAvatar } from "@dicebear/core";
import { botttsNeutral, initials } from "@dicebear/collection";

interface Props{
    seed:string;
    variant:"botttsNeutral" | "initials";
};

export const generateAvatarUri = ({ seed, variant }: Props) => {
    const style = variant === "botttsNeutral" ? botttsNeutral : initials;
    const options = variant === "initials"
        ? { seed, fontWeight: 500, fontSize: 42 }
        : { seed };
    const avatar = createAvatar(style, options);
    return avatar.toDataUri();
}
