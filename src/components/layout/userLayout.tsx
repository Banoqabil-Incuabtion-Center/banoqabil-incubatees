import React, { useEffect } from 'react'
import { SidebarInset, SidebarProvider } from '../ui/sidebar'
import { AppSidebar } from '../app-sidebar'
import { SiteHeader } from '../site-header'
import { Outlet, useLocation } from 'react-router-dom'

import { BottomNav } from '../BottomNav'
import PullToRefresh from '../PullToRefresh'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'
import { useChatStore } from '@/hooks/store/useChatStore'
import { useAuthStore } from '@/hooks/store/authStore'
import { useNotificationStore } from '@/hooks/useNotificationStore'
import { useSocket } from '@/hooks/useSocket'
import { ProfileReminder } from '../ProfileReminder'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { SOCKET_URL as SERVER_URL } from '@/lib/constant'

const UserLayout = () => {
    const location = useLocation();
    const isDirectPage = location.pathname.startsWith('/direct');

    const { activeUserId } = useChatStore();
    const isMobile = useIsMobile();

    // List of paths or checks where the UI (Header/BottomNav) should be hidden on mobile
    const MOBILE_HIDDEN_PATHS: (string | ((path: string) => boolean))[] = [
        '/profile/*',
        '/posts/*',
        // Direct uses state-based navigation (activeUserId), so path doesn't change. 
        // We check for /direct AND active user presense.
        (path) => path.startsWith('/direct') && !!activeUserId,
    ];

    console.log('DEBUG: Current pathname:', location.pathname);
    console.log('DEBUG: isMobile:', isMobile);
    console.log('DEBUG: activeUserId:', activeUserId);

    const shouldHideOnMobile = MOBILE_HIDDEN_PATHS.some(matcher => {
        let result = false;
        if (typeof matcher === 'string') {
            // Check for wildcard specifically for strict subpath matching
            if (matcher.endsWith('/*')) {
                const basePath = matcher.slice(0, -2); // Remove /*
                result = location.pathname.startsWith(`${basePath}/`);
            } else {
                // Default: Exact match or subpath match
                result = location.pathname === matcher || location.pathname.startsWith(`${matcher}/`);
            }
            console.log('DEBUG: String matcher:', matcher, 'Result:', result);
        } else {
            result = matcher(location.pathname);
            console.log('DEBUG: Function matcher result:', result);
        }
        return result;
    });

    console.log('DEBUG: shouldHideOnMobile:', shouldHideOnMobile);
    console.log('DEBUG: hideUI will be:', shouldHideOnMobile && isMobile);

    // Hide Header and Footer only when matching hidden logic on mobile
    const hideUI = shouldHideOnMobile && isMobile;

    const { addNotification, fetchNotifications } = useNotificationStore();
    const { addMessage } = useChatStore();
    const { user } = useAuthStore();
    const { on } = useSocket();
    const queryClient = useQueryClient();

    // Use TanStack Query for unread count
    const { data: unreadData } = useQuery({
        queryKey: ['unreadCount'],
        queryFn: async () => {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const response = await axios.get(`${SERVER_URL}/api/messages/unread-count`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return response.data;
        },
        enabled: !!user,
        refetchInterval: 60000, // Fallback poll every minute
    });

    // Update store for shared access (compatibility)
    useEffect(() => {
        if (unreadData) {
            useChatStore.setState({ unreadCount: unreadData.unreadCount });
        }
    }, [unreadData]);

    useEffect(() => {
        fetchNotifications();

        const unsubNotif = on('new_notification', (notification) => {
            addNotification(notification);
        });

        const unsubMsg = on('newMessage', (message) => {
            addMessage(message, user?._id);
            // Invalidate unread count on new message
            queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
        });

        const unsubRead = on('messageRead', () => {
            // Invalidate unread count when message is read
            queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
        });

        return () => {
            unsubNotif();
            unsubMsg();
            unsubRead();
        };
    }, [on, addNotification, fetchNotifications, addMessage, user?._id, queryClient]);

    return (
        <SidebarProvider
            className="h-screen w-full overflow-hidden"
            style={
                {
                    "--sidebar-width": "calc(var(--spacing) * 72)",
                    "--header-height": "calc(var(--spacing) * 14)",
                } as React.CSSProperties
            }
        >
            {/* Sidebar - hidden on mobile via CSS */}
            <AppSidebar variant="inset" className="hidden md:flex h-full" />
            <SidebarInset className={cn(
                "h-svh overflow-hidden peer-data-[variant=inset]:min-h-[calc(100svh-theme(spacing.4))] md:peer-data-[variant=inset]:ml-0  md:peer-data-[variant=inset]:shadow",
                isDirectPage && "md:peer-data-[variant=inset]:m-0 md:peer-data-[variant=inset]:rounded-none md:peer-data-[variant=inset]:ml-0"
            )}>
                {!hideUI && <SiteHeader />}
                {/* Add bottom padding on mobile for BottomNav, unless hidden */}
                <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                    {/* Breadcrumbs moved to SiteHeader */}
                    {isDirectPage ? (
                        <Outlet />
                    ) : (
                        <PullToRefresh>
                            <div className={cn("min-h-full", !hideUI && "pb-12 md:pb-0")}>
                                <Outlet />
                            </div>
                        </PullToRefresh>
                    )}
                </div>
            </SidebarInset>
            {/* Bottom Navigation - only visible on mobile */}
            {!hideUI && <BottomNav />}
            <ProfileReminder />
        </SidebarProvider>
    )
}

export default UserLayout
