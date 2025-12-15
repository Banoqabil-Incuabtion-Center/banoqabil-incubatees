import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
    src?: string | null;
    name?: string;
    className?: string;
    size?: "sm" | "md" | "lg" | "xl";
    fallbackColor?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
    src,
    name = "User",
    className,
    size = "md",
    fallbackColor,
}) => {
    const sizeClasses = {
        sm: "h-8 w-8",
        md: "h-10 w-10",
        lg: "h-14 w-14",
        xl: "h-20 w-20",
    };

    const initials = name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    // Generate a consistent color based on the name if no fallbackColor is provided
    const getGradient = (str: string) => {
        const colors = [
            "from-red-500 to-orange-500",
            "from-amber-500 to-yellow-500",
            "from-lime-500 to-green-500",
            "from-emerald-500 to-teal-500",
            "from-cyan-500 to-sky-500",
            "from-blue-500 to-indigo-500",
            "from-violet-500 to-purple-500",
            "from-fuchsia-500 to-pink-500",
            "from-rose-500 to-red-500",
        ];

        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }

        const index = Math.abs(hash) % colors.length;
        return colors[index];
    };

    const gradientClass = fallbackColor || `bg-gradient-to-br ${getGradient(name)}`;

    return (
        <Avatar className={cn(sizeClasses[size], " border-2 border-background rounded-2xl", className)}>
            <AvatarImage src={src || undefined} alt={name} className="object-cover" />
            <AvatarFallback
                className={cn(
                    "text-white font-semibold flex items-center justify-center",
                    gradientClass,
                    size === "sm" ? "text-xs" : size === "md" ? "text-sm" : "text-lg"
                )}
            >
                {initials}
            </AvatarFallback>
        </Avatar>
    );
};
