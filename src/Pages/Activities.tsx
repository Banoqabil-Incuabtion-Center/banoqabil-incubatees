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
        <div className="flex flex-col gap-4 sm:gap-5 p-4 sm:p-6">
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <Clock className="w-5 h-5" />
                            Your Activities
                        </span>
                        <Badge variant="outline">{pagination.total} total</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-3">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-3 w-48" />
                                    </div>
                                    <Skeleton className="h-4 w-20" />
                                </div>
                            ))}
                        </div>
                    ) : activities.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">
                            <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No activities found</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {activities.map((activity) => (
                                <div
                                    key={activity._id}
                                    className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                    {/* Action Icon */}
                                    <div
                                        className={`p-2 rounded-full ${activity.action === "login"
                                            ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                                            : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                                            }`}
                                    >
                                        {activity.action === "login" ? (
                                            <LogIn className="w-5 h-5" />
                                        ) : (
                                            <LogOut className="w-5 h-5" />
                                        )}
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-medium capitalize">
                                                {activity.action}
                                            </span>
                                            <Badge variant="secondary" className="gap-1">
                                                {getDeviceIcon(activity.device?.type)}
                                                {activity.device?.type || "Unknown"}
                                            </Badge>
                                        </div>

                                        <div className="text-sm text-muted-foreground mt-1 space-y-0.5">
                                            {activity.device?.browser && activity.device?.os && (
                                                <p className="truncate">
                                                    {activity.device.browser} on {activity.device.os}
                                                </p>
                                            )}
                                            {activity.location?.city && (
                                                <p className="flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" />
                                                    {activity.location.city}
                                                    {activity.location.country && `, ${activity.location.country}`}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Time */}
                                    <div className="text-right shrink-0">
                                        <p className="text-sm font-medium">
                                            {getRelativeTime(activity.timestamp || activity.createdAt)}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatTime(activity.timestamp || activity.createdAt)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between mt-6 pt-4 border-t">
                            <p className="text-sm text-muted-foreground">
                                Page {pagination.currentPage} of {pagination.totalPages}
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fetchActivities(pagination.currentPage - 1)}
                                    disabled={pagination.currentPage <= 1 || isLoading}
                                >
                                    <ChevronLeft className="w-4 h-4 mr-1" />
                                    Prev
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fetchActivities(pagination.currentPage + 1)}
                                    disabled={pagination.currentPage >= pagination.totalPages || isLoading}
                                >
                                    Next
                                    <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default Activities;
