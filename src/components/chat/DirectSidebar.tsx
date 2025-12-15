import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserAvatar } from "@/components/UserAvatar";
import { cn } from "@/lib/utils";
import { Search, Megaphone, Hash } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useChatStore } from "@/hooks/store/useChatStore";
import { useAuthStore } from "@/hooks/store/authStore";
import { useEffect, useState } from "react";
import { useSocket } from "@/hooks/useSocket";

interface DirectSidebarProps {
    className?: string;
    activeUserId?: string;
    onUserSelect: (userId: string) => void;
}

// Mock groups for now
const MOCK_GROUPS = [
    { id: "g1", name: "Project Alpha", icon: "ALPHA" },
    { id: "g2", name: "Design Team", icon: "DSGN" },
    { id: "g3", name: "Frontend Devs", icon: "DEV" },
];

export function DirectSidebar({ className, activeUserId, onUserSelect }: DirectSidebarProps) {
    const {
        conversations,
        fetchConversations,
        isLoadingConversations,
        searchUsers,
        searchResults,
        isSearching
    } = useChatStore();
    const { user: currentUser } = useAuthStore();
    const [searchQuery, setSearchQuery] = useState("");
    const { on, emit } = useSocket();
    const { onlineUsers, setOnlineUsers, addOnlineUser, removeOnlineUser } = useChatStore();

    // Socket listeners for online status
    useEffect(() => {
        const quietOffline = on('userOffline', (userId: string) => {
            removeOnlineUser(userId);
        });

        const quietOnline = on('userOnline', (userId: string) => {
            addOnlineUser(userId);
        });

        const quietGetOnline = on('getOnlineUsers', (users: string[]) => {
            setOnlineUsers(users);
        });

        // Request initial list in case we missed the connection event
        emit('getOnlineUsers');

        return () => {
            quietOffline();
            quietOnline();
            quietGetOnline();
        };
    }, [on, emit, addOnlineUser, removeOnlineUser, setOnlineUsers]);

    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    // Debounce search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchQuery) {
                searchUsers(searchQuery);
            }
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [searchQuery, searchUsers]);

    const getOtherParticipant = (participants: any[]) => {
        if (!currentUser) return participants[0]; // Fallback
        return participants.find(p => p._id !== currentUser._id) || participants[0];
    };

    const handleUserSelect = (userId: string) => {
        onUserSelect(userId);
        setSearchQuery(""); // Clear search on select
    };

    return (
        <div className={cn("flex flex-col h-full min-h-0 overflow-hidden bg-secondary/30 border-r", className)}>
            <div className="pt-12 md:pt-4 px-4 pb-4 border-b space-y-4">
                <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Find or start a conversation"
                        className="pl-8 bg-background/50 h-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <ScrollArea className="flex-1 min-h-0 overflow-hidden">
                <div className="p-2 space-y-4">

                    {searchQuery ? (
                        // Search Results
                        <div>
                            <div className="px-2 pb-1 mt-2 text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">
                                Search Results
                            </div>
                            <div className="space-y-0.5">
                                {isSearching ? (
                                    <div className="p-4 text-center text-xs text-muted-foreground">Searching...</div>
                                ) : searchResults.length === 0 ? (
                                    <div className="p-4 text-center text-xs text-muted-foreground">No users found</div>
                                ) : (
                                    searchResults.map((user) => (
                                        <Button
                                            key={user._id}
                                            variant="ghost"
                                            onClick={() => handleUserSelect(user._id)}
                                            className={cn(
                                                "w-full justify-start items-center px-2 py-6 rounded-md transition-colors group relative",
                                                activeUserId === user._id
                                                    ? "bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
                                                    : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            <div className="relative shrink-0 mr-3">
                                                <UserAvatar src={user.avatar} name={user.name} className="h-8 w-8 md:h-9 md:w-9" />
                                            </div>

                                            <div className="flex-1 min-w-0 overflow-hidden text-left">
                                                <div className="font-medium text-sm truncate">{user.name}</div>
                                                <div className="text-xs text-muted-foreground/70 font-normal truncate">
                                                    {user.email}
                                                </div>
                                            </div>
                                        </Button>
                                    ))
                                )}
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Announcements Section */}
                            <div>
                                <div className="px-2 pb-1 mt-2 text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">
                                    Official
                                </div>
                                <Button
                                    variant="ghost"
                                    onClick={() => onUserSelect('announcements')}
                                    className={cn(
                                        "w-full justify-start px-2 py-6 rounded-md transition-colors group relative",
                                        activeUserId === 'announcements'
                                            ? "bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
                                            : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <div className="h-8 w-8 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 mr-3">
                                        <Megaphone className="h-4 w-4" />
                                    </div>
                                    <div className="font-medium text-sm">Announcements</div>
                                </Button>
                            </div>

                            {/* Collaborations Section (Groups) */}
                            <div>
                                <div className="px-2 pb-1 text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider flex justify-between items-center group cursor-pointer">
                                    Collaborations
                                    {/* <Plus className="w-3 h-3 opacity-0 group-hover:opacity-100" /> */}
                                </div>
                                <div className="space-y-0.5">
                                    {MOCK_GROUPS.map((group) => (
                                        <Button
                                            key={group.id}
                                            variant="ghost"
                                            onClick={() => onUserSelect(group.id)}
                                            className={cn(
                                                "w-full justify-start px-2 py-6 rounded-md transition-colors",
                                                activeUserId === group.id
                                                    ? "bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
                                                    : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            <div className="h-8 w-8 flex items-center justify-center rounded-full bg-muted text-muted-foreground text-[10px] font-bold mr-3">
                                                <Hash className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 text-left truncate font-medium text-sm">
                                                {group.name}
                                            </div>
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <Separator className="mx-2 bg-border/50 w-auto" />

                            {/* Direct Messages Section */}
                            <div>
                                <div className="px-2 pb-1 text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">
                                    Direct Messages
                                </div>
                                <div className="space-y-0.5">
                                    {isLoadingConversations ? (
                                        <div className="p-4 text-center text-xs text-muted-foreground">Loading chats...</div>
                                    ) : conversations.length === 0 ? (
                                        <div className="p-4 text-center text-xs text-muted-foreground">No recent conversations</div>
                                    ) : (
                                        conversations.map((conversation) => {
                                            const otherUser = getOtherParticipant(conversation.participants);
                                            if (!otherUser) return null;

                                            // Determine if active (compare with activeUserId passed from parent)
                                            // Parent passes the 'activeUserId' which seems to be the ID of the person we are chatting with
                                            const isActive = activeUserId === otherUser._id;

                                            // Determine unread status
                                            // It is unread if:
                                            // 1. There is a last message
                                            // 2. The sender is NOT me (active user)
                                            // 3. My ID is NOT in seenBy array
                                            const isUnread = conversation.lastMessage &&
                                                conversation.lastMessage.sender !== currentUser?._id &&
                                                (typeof conversation.lastMessage.sender === 'object' ? conversation.lastMessage.sender._id !== currentUser?._id : true) &&
                                                !conversation.lastMessage.seenBy.includes(currentUser?._id || '');

                                            return (
                                                <Button
                                                    key={conversation._id}
                                                    variant="ghost"
                                                    onClick={() => handleUserSelect(otherUser._id)}
                                                    className={cn(
                                                        "w-full justify-start items-center px-2 py-6 rounded-md transition-colors group relative",
                                                        isActive
                                                            ? "bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
                                                            : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                                                    )}
                                                >
                                                    <div className="relative shrink-0 mr-3">
                                                        <UserAvatar src={otherUser.avatar} name={otherUser.name} className="h-8 w-8 md:h-9 md:w-9" />
                                                        <span className={cn("absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background",
                                                            onlineUsers.includes(otherUser._id) ? "bg-green-500" : "bg-gray-500"
                                                        )} />
                                                    </div>

                                                    <div className="flex-1 min-w-0 overflow-hidden text-left">
                                                        <div className={cn("text-sm truncate flex justify-between items-center", isUnread ? "font-bold text-foreground" : "font-medium")}>
                                                            <span>{otherUser.name}</span>
                                                            {isUnread && <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0 ml-2" />}
                                                        </div>
                                                        <div className={cn("text-xs truncate", isUnread ? "font-semibold text-foreground" : "text-muted-foreground/70 font-normal")}>
                                                            {conversation.lastMessage?.text ? (
                                                                conversation.lastMessage.text.length > 30
                                                                    ? conversation.lastMessage.text.substring(0, 27) + "..."
                                                                    : conversation.lastMessage.text
                                                            ) : "Started a conversation"}
                                                        </div>
                                                    </div>
                                                </Button>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </ScrollArea>

            <div className="p-2 bg-background/40 flex items-center gap-2 border-t text-xs text-muted-foreground justify-center">
                <span className="truncate">Connected</span>
            </div>
        </div>
    );
}
