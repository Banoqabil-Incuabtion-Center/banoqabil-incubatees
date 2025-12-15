import { useRef } from 'react';
import { useNotificationStore, Notification } from "@/hooks/useNotificationStore";
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { UserAvatar } from '@/components/UserAvatar';
import { Button } from '@/components/ui/button';
import { usePushSubscription } from '@/hooks/usePushSubscription';
import { Trash2, CheckCheck, Bell, BellRing } from 'lucide-react';
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
                "relative flex items-start gap-4 p-4 rounded-lg border transition-all duration-200 hover:shadow-sm mb-3",
                notification.isRead ? "bg-card" : "bg-muted/30 border-primary/20"
            )}
        >
            <UserAvatar
                src={notification.sender.avatar}
                name={notification.sender.name}
                className="h-10 w-10 mt-1"
            />

            <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-2">
                    <Link
                        to={notification.data?.postId ? `/posts/${notification.data.postId}` : '#'}
                        onClick={() => handleNotificationClick(notification._id, notification.data?.postId)}
                        className="flex-1 block group"
                    >
                        <p className="text-sm leading-snug">
                            <span className="font-semibold text-foreground group-hover:underline">
                                {notification.sender.name}
                            </span>
                            {" "}
                            <span className="text-muted-foreground">
                                {notification.message}
                            </span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </p>
                    </Link>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 top-2"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(notification._id);
                        }}
                    >
                        <span className="sr-only">Delete</span>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {!notification.isRead && (
                <div className="w-2.5 h-2.5 rounded-full bg-primary flex-shrink-0 mt-2 self-center" />
            )}
        </div>
    );

    return (
        <div className="container py-6 max-w-2xl mx-auto space-y-6">
            {!isSubscribed && !pushLoading && (
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <BellRing className="h-5 w-5 text-primary" />
                        <div>
                            <p className="font-medium">Enable Push Notifications</p>
                            <p className="text-sm text-muted-foreground">Get notified instantly about new activities.</p>
                        </div>
                    </div>
                    <Button onClick={subscribeToPush} size="sm">
                        Enable
                    </Button>
                </div>
            )}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <div className="space-y-1">
                        <CardTitle className="text-2xl font-bold flex items-center gap-2">
                            <Bell className="h-6 w-6" />
                            Notifications
                        </CardTitle>
                        <CardDescription>
                            Stay updated with recent activity
                        </CardDescription>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleMarkAllAsRead}
                        className="ml-auto"
                    >
                        <CheckCheck className="mr-2 h-4 w-4" />
                        Mark all as read
                    </Button>
                </CardHeader>
                <CardContent>
                    <PaginatedList<Notification>
                        ref={paginatedListRef}
                        fetchData={fetchNotificationsData}
                        renderItem={renderNotification}
                        pageSize={15}
                        loadingComponent={
                            <div className="flex items-center justify-center py-12 text-muted-foreground">
                                Loading notifications...
                            </div>
                        }
                    />
                </CardContent>
            </Card>
        </div>
    );
};

export default Notifications;

