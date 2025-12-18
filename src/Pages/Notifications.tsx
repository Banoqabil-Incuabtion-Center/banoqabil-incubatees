import { useRef } from 'react';
import { useNotificationStore, Notification } from "@/hooks/useNotificationStore";
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { UserAvatar } from '@/components/UserAvatar';
import { Button } from '@/components/ui/button';
import { usePushSubscription } from '@/hooks/usePushSubscription';
import { Trash2, CheckCheck, Bell, BellRing, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import PaginatedList, { PaginatedListRef } from '@/components/PaginatedList';
import axios from 'axios';

const Notifications = () => {
    const markAsReadStore = useNotificationStore(state => state.markAsRead);
    const deleteNotificationStore = useNotificationStore(state => state.deleteNotification);
    const markAllAsReadStore = useNotificationStore(state => state.markAllAsRead);

    // We still use store for global unread count updates if needed, 
    // but the list state is now managed by PaginatedList.
    // However, the store also has "notifications" state. 
    // To avoid duplication and conflicts, we will primarily rely on PaginatedList for the list view
    // and just use the store actions for keeping the global unread count in sync if possible.

    // Actually, looking at the store, it manages the list too. 
    // If we use PaginatedList, it has its own local state. 
    // To keep simple, we'll let PaginatedList manage the view data.

    const { isSubscribed, subscribeToPush, loading: pushLoading } = usePushSubscription();
    const paginatedListRef = useRef<PaginatedListRef<Notification>>(null);

    const fetchNotificationsData = async (page: number, limit: number) => {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/notifications`, {
            params: { page, limit },
            withCredentials: true,
        });

        const { notifications, totalPages, totalNotifications } = response.data;

        return {
            items: notifications,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalPosts: totalNotifications,
                hasMore: page < totalPages,
                postsPerPage: limit
            }
        };
    };

    const handleNotificationClick = async (id: string, postId?: string) => {
        try {
            await markAsReadStore(id);
            paginatedListRef.current?.updateItem(id, { isRead: true });
        } catch (error) {
            console.error("Failed to mark as read", error);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteNotificationStore(id);
            paginatedListRef.current?.removeItem(id);
        } catch (error) {
            console.error("Failed to delete notification", error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await markAllAsReadStore();
            paginatedListRef.current?.refresh();
            // Or ideally update all items locally to avoid refetch, 
            // but refresh is safer to ensure sync with backend state
        } catch (error) {
            console.error("Failed to mark all as read", error);
        }
    };

    const renderNotification = (notification: Notification) => (
        <div
            className={cn(
                "group relative flex items-start gap-4 p-5 rounded-[1.5rem] border transition-all duration-300 hover:border-primary/30 hover:shadow-soft cursor-pointer",
                notification.isRead
                    ? "bg-background/50 border-muted/20"
                    : "bg-white border-primary/20 shadow-sm"
            )}
        >
            <div className="relative flex-shrink-0">
                <UserAvatar
                    src={notification.sender.avatar}
                    name={notification.sender.name}
                    className="h-10 w-10 border-2 border-background shadow-sm"
                />
            </div>

            <div className="flex-1 min-w-0 py-0.5">
                <Link
                    to={notification.data?.postId ? `/posts/${notification.data.postId}` : '#'}
                    onClick={() => handleNotificationClick(notification._id, notification.data?.postId)}
                    className="block"
                >
                    <p className="text-sm leading-relaxed">
                        <span className={cn(
                            "font-black tracking-tight transition-colors",
                            notification.isRead ? "text-muted-foreground/70" : "text-primary"
                        )}>
                            {notification.sender.name}
                        </span>
                        {" "}
                        <span className={cn(
                            "font-medium",
                            notification.isRead ? "text-muted-foreground/60" : "text-foreground"
                        )}>
                            {notification.message}
                        </span>
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                        <Clock className="w-3 h-3 text-muted-foreground/60" />
                        <span className="text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground/60">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </span>
                    </div>
                </Link>
            </div>

            <div className="flex flex-col gap-2">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-2xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100 transition-all duration-300"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(notification._id);
                    }}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );

    return (
        <div className="container max-w-2xl mx-auto py-10 px-4 space-y-8 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 flex items-center justify-center">
                            <Bell className="w-6 h-6 text-primary stroke-[2.5px] scale-110 transition-all" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tight">Notifications</h1>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleMarkAllAsRead}
                        className="rounded-xl font-bold text-xs gap-2 hover:bg-primary/5 hover:text-primary transition-all"
                    >
                        <CheckCheck className="w-4 h-4" />
                        MARK ALL AS READ
                    </Button>
                </div>
            </div>

            {/* Push Banner */}
            {!isSubscribed && !pushLoading && (
                <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-background to-primary/5 border border-primary/20 rounded-3xl p-6 shadow-premium group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors duration-700" />
                    <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4 text-center sm:text-left">
                            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary animate-pulse">
                                <BellRing className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="font-black tracking-tight text-lg">Push Notifications</p>
                                <p className="text-sm text-muted-foreground font-medium">Never miss a like, comment or update again.</p>
                            </div>
                        </div>
                        <Button
                            onClick={subscribeToPush}
                            className="w-full sm:w-auto rounded-2xl h-11 px-8 font-black bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all active:scale-95"
                        >
                            ENABLE NOW
                        </Button>
                    </div>
                </div>
            )}

            {/* Notifications List */}
            <div className="space-y-4">
                <PaginatedList<Notification>
                    ref={paginatedListRef}
                    fetchData={fetchNotificationsData}
                    renderItem={renderNotification}
                    pageSize={15}
                    loadingComponent={
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-24 rounded-3xl bg-muted/20 animate-pulse border border-dashed border-muted" />
                            ))}
                        </div>
                    }
                />
            </div>
        </div>
    );
};

export default Notifications;


