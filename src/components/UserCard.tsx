import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Edit3, User2, Sun, Moon, IdCard, Sparkles, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from '@/hooks/store/authStore';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "./UserAvatar";

interface UserCardProps {
    user: any;
    authUser?: any;
    isPublic?: boolean;
    className?: string;
}

const DEFAULT_SETTINGS = {
    theme: 'default',
    accentColor: 'primary',
    borderRadius: 'rounded-2xl',
    showStatus: true,
    backgroundColor: '',
    textColor: '',
    gradient: '',
};

export const UserCard: React.FC<UserCardProps> = ({ user, authUser, isPublic = false, className }) => {
    const navigate = useNavigate();
    const settings = { ...DEFAULT_SETTINGS, ...(user?.cardSettings || {}) };

    const GRADIENTS: Record<string, string> = {
        // Linear Blends
        sunset: "bg-gradient-to-br from-orange-500/20 via-background to-rose-500/20",
        ocean: "bg-gradient-to-br from-blue-500/20 via-background to-teal-500/20",
        midnight: "bg-gradient-to-br from-indigo-500/20 via-background to-purple-500/20",
        brand: "bg-gradient-to-br from-primary/20 via-background to-primary/10",

        // Radial / Glow Styles ("Radient")
        aurora: "bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-from)_0%,_transparent_50%),_radial-gradient(circle_at_bottom_left,_var(--tw-gradient-to)_0%,_transparent_50%)] from-emerald-500/10 to-blue-500/10",
        nebula: "bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_70%)] from-purple-500/20 to-zinc-950",
        flare: "bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-from)_0%,_transparent_60%)] from-amber-400/20 to-background",
        soft: "bg-[radial-gradient(circle_at_bottom_right,_var(--tw-gradient-from)_0%,_transparent_60%)] from-pink-500/10 to-background",

        // Multi-Color / Vibrant
        cyber: "bg-gradient-to-tr from-cyan-500/20 via-purple-500/10 to-pink-500/20",
        tropical: "bg-gradient-to-br from-yellow-400/20 via-orange-500/10 to-emerald-500/20",
        cosmic: "bg-gradient-to-r from-indigo-500/20 via-purple-500/10 to-pink-500/20",
        hyper: "bg-gradient-to-br from-fuchsia-600/20 via-blue-600/10 to-cyan-400/20",
    };

    const currentTheme = (settings.theme as keyof typeof themeClasses) || "default";
    const accentColor = settings.accentColor || "primary";
    const selectedGradient = settings.gradient && GRADIENTS[settings.gradient] ? GRADIENTS[settings.gradient] : GRADIENTS.brand;

    const themeClasses = {
        default: "bg-background border-none shadow-premium transition-colors duration-700",
        glass: "bg-background/40 backdrop-blur-xl border border-white/20 shadow-premium transition-colors duration-700",
        gradient: cn(selectedGradient, "border-none shadow-premium transition-all duration-700"),
        dark: "bg-zinc-950 text-zinc-100 border-none shadow-2xl transition-colors duration-700",
    };

    // Helper to get consistent badge styles
    const getBadgeStyle = (accent: string) => {
        const isHex = accent.startsWith("#");

        const PRESETS: Record<string, { bg: string, text: string }> = {
            primary: { bg: "#10b981", text: "#10b981" },
            blue: { bg: "#3b82f6", text: "#3b82f6" },
            purple: { bg: "#a855f7", text: "#a855f7" },
            orange: { bg: "#f97316", text: "#f97316" },
            rose: { bg: "#f43f5e", text: "#f43f5e" },
        };

        const color = isHex ? accent : (PRESETS[accent]?.text || "#10b981");

        return {
            style: {
                backgroundColor: `${color}15`, // ~8% opacity
                color: color,
            },
            className: "px-3 py-1 text-[10px] gap-1.5 font-black border-none tracking-widest uppercase"
        };
    };

    const badgeStyle = getBadgeStyle(accentColor);

    return (
        <Card
            onClick={() => user?._id && navigate(`/user/${user._id}`)}
            className={cn(
                "relative group overflow-hidden transition-all duration-700 active:scale-[0.99] cursor-pointer",
                themeClasses[currentTheme],
                "rounded-2xl",
                "w-full max-w-[380px] min-h-[460px] sm:min-h-[520px] mx-auto flex flex-col justify-center", // Responsive standardized sizing
                className
            )}
            style={settings.backgroundColor ? { backgroundColor: settings.backgroundColor } : {}}
        >
            {/* Decorative Spotlights & Patterns */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {currentTheme === 'glass' && (
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px] -mr-32 -mt-32 opacity-50" />
                )}
                {currentTheme === 'dark' && (
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] -ml-32 -mb-32 opacity-30" />
                )}
            </div>

            <CardContent className={cn(
                "flex flex-col items-center text-center relative z-10 p-6 sm:p-10 gap-4 sm:gap-6" // Reduced padding and gap on mobile
            )}>
                <div className="relative">
                    <div className={cn(
                        "w-24 h-24 sm:w-32 sm:h-32 overflow-hidden border-4 border-background bg-muted relative z-10 transition-all duration-700",
                        settings.borderRadius || "rounded-3xl"
                    )}>
                        <UserAvatar
                            src={user?.avatar}
                            name={user?.name}
                            className="w-full h-full border-0 rounded-none object-cover transition-transform duration-700"
                            fallbackColor={accentColor}
                        />
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 animate-in slide-in-from-bottom-2 duration-700">
                    <Badge {...badgeStyle}>
                        <IdCard className="w-3 h-3" />
                        {user?.incubation_id}
                    </Badge>
                    {user?.shift && (
                        <Badge {...badgeStyle}>
                            {user?.shift === "Morning" ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
                            {user?.shift}
                        </Badge>
                    )}
                    {user?.location && (
                        <Badge {...badgeStyle}>
                            <MapPin className="w-3 h-3" />
                            {user?.location}
                        </Badge>
                    )}
                </div>

                <div className="flex flex-col gap-2">
                    <h1
                        className={cn(
                            "text-2xl sm:text-3xl font-black tracking-tight leading-none transition-all duration-500",
                            !settings.textColor && (currentTheme === 'dark' ? "text-white" : "text-foreground")
                        )}
                        style={settings.textColor ? { color: settings.textColor } : {}}
                    >
                        {user?.name || "Member Name"}
                    </h1>

                    {user?.bio && (
                        <p
                            className={cn(
                                "text-sm max-w-[280px] leading-relaxed font-medium mx-auto line-clamp-2 transition-all duration-500 opacity-90",
                                !settings.textColor && (currentTheme === 'dark' ? "text-zinc-400" : "text-muted-foreground")
                            )}
                            style={settings.textColor ? { color: settings.textColor } : {}}
                        >
                            {user?.bio}
                        </p>
                    )}
                </div>

                {user?.status && settings.showStatus !== false && (
                    <div
                        {...badgeStyle}
                        className={cn(badgeStyle.className, "rounded-full py-1.5 flex items-center gap-2 hover:opacity-80 transition-opacity cursor-default")}
                    >
                        <Sparkles className="w-3 h-3" />
                        {user?.status}
                    </div>
                )}

                {/* Action buttons removed from here - moved to Profile page */}
            </CardContent>
        </Card>
    );
};

