import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
    LogIn,
    LogOut,
    Monitor,
    Smartphone,
    Tablet,
    Globe,
    Clock,
    MapPin,
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import api from "@/lib/axios";

interface Activity {
    _id: string;
    action: "login" | "logout";
    device: {
        type: "desktop" | "mobile" | "tablet" | "unknown";
        browser: string;
        os: string;
        platform: string;
    };
    ip: string;
    location: {
        country: string;
        region: string;
        city: string;
        timezone: string;
    };
    timestamp: string;
    createdAt: string;
}

interface PaginationInfo {
    currentPage: number;
    totalPages: number;
    total: number;
    limit: number;
}

const Activities: React.FC = () => {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [pagination, setPagination] = useState<PaginationInfo>({
        currentPage: 1,
        totalPages: 1,
        total: 0,
        limit: 10
    });

    const fetchActivities = async (page = 1) => {
        setIsLoading(true);
        try {
            const res = await api.get(`/api/user/activities?page=${page}&limit=10`);
            // Response format: { data: [], pagination: { currentPage, totalPages, total, limit } }
            setActivities(res.data.data || []);
            const paginationData = res.data.pagination || {};
            setPagination({
                currentPage: paginationData.currentPage || 1,
                totalPages: paginationData.totalPages || 1,
                total: paginationData.total || 0,
                limit: paginationData.limit || 10
            });
        } catch (error) {
            console.error("Error fetching activities:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchActivities();
    }, []);

    const getDeviceIcon = (type: string) => {
        switch (type) {
            case "desktop":
                return <Monitor className="w-4 h-4" />;
            case "mobile":
                return <Smartphone className="w-4 h-4" />;
            case "tablet":
                return <Tablet className="w-4 h-4" />;
            default:
                return <Globe className="w-4 h-4" />;
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const getRelativeTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return formatDate(dateStr);
    };

    return (
        <div className="container max-w-2xl mx-auto py-10 px-4 space-y-8 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 flex items-center justify-center">
                            <Clock className="w-6 h-6 text-primary stroke-[2.5px] scale-110 transition-all" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tight">Activities</h1>
                        </div>
                    </div>
                    <div className="flex items-center px-4 py-2 bg-muted/30 rounded-xl border border-muted/50 shadow-sm">
                        <span className="text-[10px] font-black tracking-widest uppercase opacity-60 mr-2">EVENTS</span>
                        <Badge className="bg-primary/20 text-primary border-none font-black px-2 py-0.5 text-[10px] rounded-md">{pagination.total}</Badge>
                    </div>
                </div>
            </div>

            <div className="grid gap-4">
                {isLoading ? (
                    <div className="grid gap-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-28 rounded-[2rem] bg-muted/20 animate-pulse border border-dashed border-muted" />
                        ))}
                    </div>
                ) : activities.length === 0 ? (
                    <div className="text-center py-24 bg-muted/10 rounded-[2.5rem] border-2 border-dashed border-muted shadow-inner">
                        <div className="w-20 h-20 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-6">
                            <Clock className="w-10 h-10 opacity-30" />
                        </div>
                        <p className="font-black text-muted-foreground/60 uppercase tracking-widest">No activities found</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {activities.map((activity) => (
                            <div
                                key={activity._id}
                                className="group flex items-center gap-4 p-5 rounded-[2rem] border border-muted/30 transition-all duration-300 hover:border-primary/30 hover:shadow-soft bg-background cursor-pointer"
                            >
                                {/* Action Icon */}
                                <div
                                    className={cn(
                                        "w-12 h-12 flex items-center justify-center transition-all duration-500 shrink-0",
                                        activity.action === "login"
                                            ? "text-green-500"
                                            : "text-red-500"
                                    )}
                                >
                                    {activity.action === "login" ? (
                                        <LogIn className="w-6 h-6 stroke-[2.5px]" />
                                    ) : (
                                        <LogOut className="w-6 h-6 stroke-[2.5px]" />
                                    )}
                                </div>

                                {/* Details */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-black tracking-tight capitalize">
                                            {activity.action}
                                        </span>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">•</span>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                                            {activity.device?.type || "Unknown"}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-medium opacity-80">
                                        <span className="truncate">{activity.device?.browser}</span>
                                        {activity.location?.city && (
                                            <>
                                                <span className="text-muted-foreground/20">•</span>
                                                <span className="truncate">{activity.location.city}</span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Time */}
                                <div className="flex flex-col items-end shrink-0 pl-3">
                                    <div className="text-[11px] text-foreground font-black tracking-tight">
                                        {getRelativeTime(activity.timestamp || activity.createdAt)}
                                    </div>
                                    <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest mt-0.5 opacity-50">
                                        {formatTime(activity.timestamp || activity.createdAt)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-12 py-8 border-t border-muted/30">
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">
                            Page {pagination.currentPage} / {pagination.totalPages}
                        </p>
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => fetchActivities(pagination.currentPage - 1)}
                                disabled={pagination.currentPage <= 1 || isLoading}
                                className="rounded-2xl h-11 px-6 font-black text-xs gap-2 border-2 hover:bg-muted transition-all active:scale-95"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                PREV
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => fetchActivities(pagination.currentPage + 1)}
                                disabled={pagination.currentPage >= pagination.totalPages || isLoading}
                                className="rounded-2xl h-11 px-6 font-black text-xs gap-2 border-2 hover:bg-muted transition-all active:scale-95"
                            >
                                NEXT
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Activities;
