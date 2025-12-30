import { useState, useEffect } from "react";
import { DirectSidebar } from "@/components/chat/DirectSidebar";
import { ChatArea } from "@/components/chat/ChatArea";
import { AnnouncementView } from "@/components/chat/AnnouncementView";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useChatStore } from "@/hooks/store/useChatStore";
import { useSocket } from "@/hooks/useSocket";
import { useSearchParams } from "react-router-dom";

import { cn } from "@/lib/utils";
import { useInfiniteQuery } from "@tanstack/react-query";
import axios from "axios";
import { SOCKET_URL as SERVER_URL } from "@/lib/constant";

export default function Direct() {
    // const [activeId, setActiveId] = useState<string | undefined>(undefined); // Removed local state
    const isMobile = useIsMobile();
    const [sheetOpen, setSheetOpen] = useState(false); // Control sheet open/close
    const { addMessage, searchResults, activeUserId, setActiveUser } = useChatStore(); // Removed conversations from store
    const { on } = useSocket();
    const [searchParams] = useSearchParams();

    // Sync with same query as sidebar to get metadata for header
    const { data } = useInfiniteQuery({
        queryKey: ['conversations'],
        queryFn: async ({ pageParam = 1 }) => {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const response = await axios.get(`${SERVER_URL}/api/messages/conversations?page=${pageParam}&limit=10`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return response.data;
        },
        getNextPageParam: (lastPage, allPages) => {
            return lastPage.length === 10 ? allPages.length + 1 : undefined;
        },
        initialPageParam: 1,
        // Don't refetch here if already fetching in sidebar, but keep it available
        staleTime: 5 * 60 * 1000,
    });

    const conversations = data?.pages.flat() || [];

    // Handle user selection - close sheet on mobile
    const handleUserSelect = (id: string) => {
        setActiveUser(id);
        if (isMobile) {
            setSheetOpen(false); // Close sheet on mobile after selection
        }
    };

    const getName = (id?: string | null) => { // Updated type
        if (!id) return undefined;
        if (id === 'announcements') return "Announcements";

        // Find in real conversations
        const conversation = conversations.find(c => c.participants.some(p => p._id === id));
        if (conversation) {
            const participant = conversation.participants.find(p => p._id === id);
            return participant?.name || "User";
        }

        // Find in search results
        const searchUser = searchResults.find(u => u._id === id);
        if (searchUser) return searchUser.name;

        return "User";
    };

    const getAvatar = (id?: string | null) => { // Updated type
        if (!id) return undefined;
        const conversation = conversations.find(c => c.participants.some(p => p._id === id));
        if (conversation) {
            const participant = conversation.participants.find(p => p._id === id);
            return participant?.avatar;
        }

        // Find in search results
        const searchUser = searchResults.find(u => u._id === id);
        if (searchUser) return searchUser.avatar;

        return undefined;
    };

    const renderContent = () => {
        if (activeUserId === 'announcements') {
            return <AnnouncementView onBack={() => setActiveUser(null)} />;
        }
        // activeUserId can be null, cast to string|undefined if needed by component, or update component to accept null
        return (
            <ChatArea
                activeUserId={activeUserId || undefined}
                userName={getName(activeUserId)}
                userAvatar={getAvatar(activeUserId)}
                onBack={() => setActiveUser(null)} // Clear active user to return to list
            />
        );
    };

    // Deep linking support
    useEffect(() => {
        const userId = searchParams.get('user');
        if (userId) {
            setActiveUser(userId);
        }
    }, [searchParams, setActiveUser]);

    useEffect(() => {
        // Listen for new messages
        const unsubByKey = on('newMessage', (message) => {
            console.log("New message received:", message);
            addMessage(message);
        });

        return () => {
            if (unsubByKey) unsubByKey();
        };
    }, [on, addMessage]);

    // Removed auto-select 'announcements' effect to restore default placeholder behavior

    return (
        <div className="flex flex-1 bg-muted/10 overflow-hidden h-full min-h-0">
            {/* Sidebar */}
            {/* Mobile: Visible when NO active user. Hidden when active user. */}
            {/* Desktop: Always visible. */}
            <DirectSidebar
                className={cn(
                    "shrink-0 border-r border-primary/5 shadow-soft",
                    // Mobile styles
                    isMobile ? (activeUserId ? "hidden" : "flex w-full border-r-0") :
                        // Desktop styles
                        "hidden md:flex w-80 lg:w-96"
                )}
                activeUserId={activeUserId || undefined}
                onUserSelect={handleUserSelect}
            />

            {/* Content Area */}
            {/* Mobile: Hidden when NO active user. Visible when active user. */}
            {/* Desktop: Always visible (flex-1). */}
            <div className={cn(
                "flex-1 flex flex-col min-w-0 bg-background overflow-hidden relative shadow-inner",
                isMobile && !activeUserId ? "hidden" : "flex"
            )}>
                {renderContent()}
            </div>
        </div>
    );
}
