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

const UserLayout = () => {
    const location = useLocation();
    const isDirectPage = location.pathname.startsWith('/direct');

    const { activeUserId } = useChatStore();
    const isMobile = useIsMobile();

    // Hide Header and Footer only when in an active chat on mobile
    const hideUI = isDirectPage && !!activeUserId && isMobile;

    const { addNotification, fetchNotifications } = useNotificationStore();
    const { fetchUnreadCount, addMessage } = useChatStore();
    const { user } = useAuthStore();
    const { on } = useSocket();

    useEffect(() => {
        fetchNotifications();
        fetchUnreadCount();

        const unsubNotif = on('new_notification', (notification) => {
            addNotification(notification);
        });

        const unsubMsg = on('newMessage', (message) => {
            addMessage(message, user?._id);
        });

        return () => {
            unsubNotif();
            unsubMsg();
        };
    }, [on, addNotification, fetchNotifications, fetchUnreadCount, addMessage, user?._id]);

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
