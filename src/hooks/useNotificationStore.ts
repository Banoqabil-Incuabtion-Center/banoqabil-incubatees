import { create } from 'zustand';
import axios from 'axios';
import { toast } from 'sonner';

export interface Notification {
    _id: string;
    recipient: string;
    sender: {
        _id: string;
        name: string;
        avatar?: string;
        username: string;
    };
    type: 'LIKE' | 'COMMENT' | 'POST_UPLOAD' | 'MESSAGE' | 'SYSTEM' | 'LOGIN';
    message: string;
    data: any;
    isRead: boolean;
    createdAt: string;
}

interface NotificationState {
    notifications: Notification[];
    unreadCount: number;
    isLoading: boolean;
    fetchNotifications: () => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    addNotification: (notification: Notification) => void;
    deleteNotification: (id: string) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
    notifications: [],
    unreadCount: 0,
    isLoading: false,


    fetchNotifications: async () => {
        set({ isLoading: true });
        try {
            // Assuming API_URL is set in environment or a constant
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/notifications`, {
                withCredentials: true,
            });
            set({
                notifications: response.data.notifications,
                unreadCount: response.data.unreadCount,
                isLoading: false,
            });
        } catch (error) {
            console.error("Failed to fetch notifications", error);
            set({ isLoading: false });
        }
    },

    markAsRead: async (id) => {
        try {
            await axios.put(`${import.meta.env.VITE_API_URL}/api/notifications/${id}/read`, {}, {
                withCredentials: true,
            });
            set((state) => {
                const notification = state.notifications.find(n => n._id === id);
                if (notification && !notification.isRead) {
                    return {
                        notifications: state.notifications.map((n) =>
                            n._id === id ? { ...n, isRead: true } : n
                        ),
                        unreadCount: Math.max(0, state.unreadCount - 1),
                    }
                }
                return {};
            });
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    },

    markAllAsRead: async () => {
        try {
            await axios.put(`${import.meta.env.VITE_API_URL}/api/notifications/read-all`, {}, {
                withCredentials: true,
            });
            set((state) => ({
                notifications: state.notifications.map(n => ({ ...n, isRead: true })),
                unreadCount: 0
            }));
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    },

    addNotification: (notification) => {
        set((state) => ({
            notifications: [notification, ...state.notifications],
            unreadCount: state.unreadCount + 1,
        }));
        toast.info(notification.message);
    },

    deleteNotification: async (id) => {
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/notifications/${id}`, {
                withCredentials: true,
            });
            set((state) => ({
                notifications: state.notifications.filter(n => n._id !== id),
                unreadCount: state.notifications.find(n => n._id === id && !n.isRead) ? state.unreadCount - 1 : state.unreadCount
            }));
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    }
}));
