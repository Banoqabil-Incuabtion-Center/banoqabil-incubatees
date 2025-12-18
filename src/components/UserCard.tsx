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

    return (
        <Card className={cn("overflow-hidden border-none shadow-premium bg-background", className)}>
            <CardContent className="pt-8 pb-8 flex flex-col items-center text-center">
                <div className="relative group mb-6">
                    <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl overflow-hidden border-4 border-background shadow-premium bg-muted relative">
                        <UserAvatar
                            src={user?.avatar}
                            name={user?.name}
                            className="w-full h-full border-0 rounded-none object-cover"
                            fallbackColor="bg-primary"
                        />
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
                    <Badge className="px-3 py-1 text-[10px] gap-1.5 font-bold bg-primary/10 text-primary border-none text-center">
                        <IdCard className="w-3.5 h-3.5" />
                        {user?.incubation_id || "N/A"}
                    </Badge>
                    {user?.shift && (
                        <Badge className="px-3 py-1 text-[10px] gap-1.5 font-bold bg-muted text-muted-foreground border-none">
                            {user?.shift === "Morning" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                            {user?.shift}
                        </Badge>
                    )}
                </div>

                <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                    {user?.name || "Student Name"}
                </h1>

                {user?.bio && (
                    <p className="text-sm text-muted-foreground mt-2 max-w-[250px] mx-auto line-clamp-2">
                        {user?.bio}
                    </p>
                )}

                {user?.status && (
                    <div className="my-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold animate-in fade-in zoom-in duration-500">
                        <Sparkles className="w-3 h-3" />
                        {user?.status}
                    </div>
                )}

                {!isPublic && (
                    <div className="w-full mt-6 space-y-3">
                        <Button
                            asChild
                            className="w-full rounded-2xl h-12 shadow-lg shadow-primary/20 font-black"
                        >
                            <Link to="/profile/edit">
                                <Edit3 className="w-4 h-4 mr-2" />
                                Edit Profile
                            </Link>
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => navigate(`/user/${authUser?._id}`)}
                            className="w-full h-12 rounded-2xl font-black gap-2 border-primary/20 text-primary hover:bg-primary/5"
                        >
                            <User2 className="w-4 h-4" />
                            View Public Profile
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
