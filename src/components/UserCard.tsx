import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Edit3, User2, Sun, Moon, IdCard, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
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

export const UserCard: React.FC<UserCardProps> = ({ user, authUser, isPublic = false, className }) => {
    const navigate = useNavigate();
    const settings = user?.cardSettings || {};

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
        default: "bg-background border-none shadow-premium",
        glass: "bg-background/40 backdrop-blur-xl border border-white/20 shadow-premium",
        gradient: cn(selectedGradient, "border-none shadow-premium"),
        dark: "bg-zinc-950 text-zinc-100 border-none shadow-2xl",
    };

    return (
        <Card
            className={cn(
                "relative group overflow-hidden transition-all duration-700 active:scale-[0.99]",
                themeClasses[currentTheme],
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
                "flex flex-col items-center text-center relative z-10 p-8 sm:p-10"
            )}>
                <div className="relative mb-6">
                    <div className={cn(
                        "w-24 h-24 sm:w-32 sm:h-32 overflow-hidden border-4 border-background bg-muted relative z-10 transition-all duration-700",
                        settings.borderRadius || "rounded-3xl"
                    )}>
                        <UserAvatar
                            src={user?.avatar}
                            name={user?.name}
                            className="w-full h-full border-0 rounded-none object-cover transition-transform duration-700"
                            fallbackColor={`bg-${accentColor}`}
                        />
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 mb-6 animate-in slide-in-from-bottom-2 duration-700">
                    <Badge className={cn(
                        "px-3 py-1 text-[10px] gap-1.5 font-black border-none tracking-widest uppercase",
                        accentColor === 'primary' ? "bg-primary/10 text-primary" : `bg-${accentColor}-500/10 text-${accentColor}-500`
                    )}>
                        <IdCard className="w-3 h-3" />
                        {user?.incubation_id || "STUDENT"}
                    </Badge>
                    {user?.shift && (
                        <Badge className="px-3 py-1 text-[10px] gap-1.5 font-black bg-muted/50 text-muted-foreground border-none tracking-widest uppercase">
                            {user?.shift === "Morning" ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
                            {user?.shift}
                        </Badge>
                    )}
                </div>

                <h1
                    className={cn(
                        "text-2xl sm:text-3xl font-black tracking-tight leading-none mb-1 transition-all duration-500",
                        !settings.textColor && (currentTheme === 'dark' ? "text-white" : "text-foreground")
                    )}
                    style={settings.textColor ? { color: settings.textColor } : {}}
                >
                    {user?.name || "Member Name"}
                </h1>

                {user?.bio && (
                    <p
                        className={cn(
                            "text-sm mt-3 max-w-[280px] leading-relaxed font-medium mx-auto line-clamp-2 transition-all duration-500 opacity-90",
                            !settings.textColor && (currentTheme === 'dark' ? "text-zinc-400" : "text-muted-foreground")
                        )}
                        style={settings.textColor ? { color: settings.textColor } : {}}
                    >
                        {user?.bio}
                    </p>
                )}

                {user?.status && settings.showStatus !== false && (
                    <div className={cn(
                        "mt-4 px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase bg-primary/5 text-primary border border-primary/10 flex items-center gap-2 hover:bg-primary/10 transition-colors cursor-default",
                        accentColor === 'primary' ? "" : `text-${accentColor}-500 border-${accentColor}-500/10 bg-${accentColor}-500/5`
                    )}>
                        <Sparkles className="w-3 h-3" />
                        {user?.status}
                    </div>
                )}

                {!isPublic && (
                    <div className="w-full mt-10 space-y-3">
                        <Button
                            asChild
                            className={cn(
                                "w-full rounded-2xl h-14 font-black transition-all shadow-premium",
                                accentColor === 'primary' ? "bg-primary hover:bg-primary/90" : `bg-${accentColor}-500 hover:bg-${accentColor}-400`
                            )}
                        >
                            <Link to="/profile/edit">
                                <Edit3 className="w-4 h-4 mr-2" />
                                Edit Profile
                            </Link>
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => navigate(`/user/${authUser?._id}`)}
                            className={cn(
                                "w-full h-14 rounded-2xl font-black gap-2 transition-all border-2 bg-transparent",
                                accentColor === 'primary'
                                    ? "border-primary/10 text-primary hover:bg-primary/5 hover:border-primary/20"
                                    : `border-${accentColor}-500/10 text-${accentColor}-500 hover:bg-${accentColor}-500/5 hover:border-${accentColor}-500/20`
                            )}
                        >
                            <User2 className="w-4 h-4" />
                            View Public
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
