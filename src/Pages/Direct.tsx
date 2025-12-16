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

export default function Direct() {
    // const [activeId, setActiveId] = useState<string | undefined>(undefined); // Removed local state
    const isMobile = useIsMobile();
    const [sheetOpen, setSheetOpen] = useState(false); // Control sheet open/close
    const { conversations, addMessage, searchResults, activeUserId, setActiveUser } = useChatStore(); // Added activeUserId, setActiveUser
    const { on } = useSocket();
    const [searchParams] = useSearchParams();

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
            return <AnnouncementView />;
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

    // Mobile View: If no active conversation, show Sidebar directly (full screen)
    if (isMobile && !activeUserId && activeUserId !== 'announcements') {
        return (
            <div className="flex flex-1 bg-background overflow-hidden h-full min-h-0">
                <DirectSidebar
                    activeUserId={undefined} // No active user yet
                    onUserSelect={handleUserSelect}
                    className="w-full border-r-0"
                />
            </div>
        );
    }

    // Mobile View: If active conversation, show ChatArea directly (full screen) with Back button
    if (isMobile && activeUserId) {
        return (
            <div className="flex flex-1 bg-background overflow-hidden h-full min-h-0">
                {renderContent()}
            </div>
        );
    }

    // Desktop View
    return (
        <div className="flex flex-1 bg-background overflow-hidden h-full min-h-0">
            {/* Sidebar - Always visible on desktop */}
            <DirectSidebar
                className="w-80 shrink-0 hidden md:flex"
                activeUserId={activeUserId || undefined}
                onUserSelect={handleUserSelect}
            />

            {/* Content Area */}
            {renderContent()}
        </div>
    );
}
