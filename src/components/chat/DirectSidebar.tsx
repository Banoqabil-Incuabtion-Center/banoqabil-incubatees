import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserAvatar } from "@/components/UserAvatar";
import { cn } from "@/lib/utils";
import { Search, Megaphone, Hash, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useChatStore, Message } from "@/hooks/store/useChatStore";
import { useAuthStore } from "@/hooks/store/authStore";
import { useEffect, useState, useRef, useCallback } from "react";
import { useSocket } from "@/hooks/useSocket";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { SOCKET_URL as SERVER_URL } from "@/lib/constant";

// Component to decrypt last message for sidebar preview
function DecryptedLastMessage({ message, otherUserId }: { message: Message & { _decryptedText?: string }; otherUserId: string }) {
    const { decryptMessageText, isEncryptionReady } = useChatStore();
    const [text, setText] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // If already has decrypted text, use it
        if (message._decryptedText) {
            setText(message._decryptedText);
            setIsLoading(false);
            return;
        }

        // If not encrypted, use plain text
        if (!message.isEncrypted) {
            setText(message.text);
            setIsLoading(false);
            return;
        }

        // Decrypt the message
        if (isEncryptionReady) {
            decryptMessageText(message, otherUserId)
                .then(decrypted => {
                    setText(decrypted);
                    setIsLoading(false);
                })
                .catch(() => {
                    setText('Encrypted');
                    setIsLoading(false);
                });
        } else {
            setText('Encrypted');
            setIsLoading(false);
        }
    }, [message, otherUserId, isEncryptionReady, decryptMessageText]);

    if (isLoading) {
        return <span className="animate-pulse">...</span>;
    }

    const displayText = text.length > 30 ? `${text.slice(0, 30)}...` : text;

    return (
        <>
            {message.isEncrypted && <Lock className="w-3 h-3 mr-1 inline-block opacity-50" />}
            {displayText}
        </>
    );
}

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
    const queryClient = useQueryClient();
    const {
        searchUsers,
        searchResults,
        isSearching,
    } = useChatStore();

    // Use TanStack Query for conversations
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading: isLoadingConversations
    } = useInfiniteQuery({
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
    });

    const conversations = data?.pages.flat() || [];

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

        // Register new message listener to invalidate conversations
        const quietNewMessage = on('newMessage', () => {
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
        });

        // Request initial list in case we missed the connection event
        emit('getOnlineUsers');

        return () => {
            quietOffline();
            quietOnline();
            quietGetOnline();
            quietNewMessage();
        };
    }, [on, emit, addOnlineUser, removeOnlineUser, setOnlineUsers, queryClient]);

    const observerTarget = useRef<HTMLDivElement>(null);

    const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
        const [target] = entries;
        if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    useEffect(() => {
        const element = observerTarget.current;
        const option = { threshold: 0.1 };

        if (!element) return;

        const observer = new IntersectionObserver(handleObserver, option);
        observer.observe(element);

        return () => observer.unobserve(element);
    }, [handleObserver, isLoadingConversations]); // Re-attach if loading state changes (though ref shouldn't change, consistency good)

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
        <div className={cn("flex flex-col h-full min-h-0 overflow-hidden bg-background/50", className)}>
            <div className="pt-6 px-4 pb-4 border-b border-primary/5 space-y-4">
                <div className="relative group">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                        placeholder="Search conversations..."
                        className="pl-10 bg-muted/30 border-primary/5 focus-visible:ring-primary/20 rounded-xl h-10 shadow-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <ScrollArea className="flex-1 min-h-0">
                <div className="p-3 pb-20 md:pb-6 space-y-6">

                    {searchQuery ? (
                        // Search Results
                        <div className="space-y-2">
                            <div className="px-3 pb-1 text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.2em]">
                                Search Results
                            </div>
                            <div className="space-y-1">
                                {isSearching ? (
                                    <div className="p-8 text-center">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2" />
                                        <span className="text-xs text-muted-foreground">Searching...</span>
                                    </div>
                                ) : searchResults.length === 0 ? (
                                    <div className="p-8 text-center text-xs text-muted-foreground bg-muted/20 rounded-2xl border border-dashed border-primary/10">
                                        No users found
                                    </div>
                                ) : (
                                    searchResults.map((user) => (
                                        <Button
                                            key={user._id}
                                            variant="ghost"
                                            onClick={() => handleUserSelect(user._id)}
                                            className={cn(
                                                "w-full justify-start items-center px-3 py-7 rounded-2xl transition-all duration-300 group relative overflow-hidden",
                                                activeUserId === user._id
                                                    ? "bg-primary/10 text-primary shadow-soft"
                                                    : "hover:bg-primary/5 text-muted-foreground hover:text-foreground hover:translate-x-1"
                                            )}
                                        >
                                            <div className="relative shrink-0 mr-3">
                                                <UserAvatar src={user.avatar} name={user.name} className="h-10 w-10 border border-primary/10" />
                                            </div>

                                            <div className="flex-1 min-w-0 overflow-hidden text-left">
                                                <div className="font-bold text-sm truncate">{user.name}</div>
                                                <div className="text-[11px] text-muted-foreground/70 font-medium truncate">
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
                            <div className="space-y-2">
                                <div className="px-3 pb-1 text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.2em]">
                                    Official
                                </div>
                                <Button
                                    variant="ghost"
                                    onClick={() => onUserSelect('announcements')}
                                    className={cn(
                                        "w-full justify-start px-3 py-7 rounded-2xl transition-all duration-300 group relative overflow-hidden",
                                        activeUserId === 'announcements'
                                            ? "bg-primary/10 text-primary shadow-soft"
                                            : "hover:bg-primary/5 text-muted-foreground hover:text-foreground hover:translate-x-1"
                                    )}
                                >
                                    <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-primary/10 text-primary mr-3 shadow-soft border border-primary/5 shrink-0">
                                        <Megaphone className="h-5 w-5" />
                                    </div>
                                    <div className="font-bold text-sm truncate">Announcements</div>
                                </Button>
                            </div>

                            {/* Collaborations Section (Groups) */}
                            <div className="space-y-2">
                                <div className="px-3 pb-1 text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.2em] flex justify-between items-center group cursor-pointer">
                                    Collaborations
                                </div>
                                <div className="space-y-1">
                                    {MOCK_GROUPS.map((group) => (
                                        <Button
                                            key={group.id}
                                            variant="ghost"
                                            onClick={() => onUserSelect(group.id)}
                                            className={cn(
                                                "w-full justify-start px-3 py-7 rounded-2xl transition-all duration-300 group relative overflow-hidden",
                                                activeUserId === group.id
                                                    ? "bg-primary/10 text-primary shadow-soft"
                                                    : "hover:bg-primary/5 text-muted-foreground hover:text-foreground hover:translate-x-1"
                                            )}
                                        >
                                            <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-muted/50 text-muted-foreground text-[10px] font-bold mr-3 border border-primary/5 shrink-0">
                                                <Hash className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1 text-left truncate font-bold text-sm min-w-0">
                                                {group.name}
                                            </div>
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <div className="px-2">
                                <Separator className="bg-primary/5" />
                            </div>

                            {/* Direct Messages Section */}
                            <div className="space-y-2">
                                <div className="px-3 pb-1 text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.2em]">
                                    Direct Messages
                                </div>
                                <div className="space-y-1">
                                    {isLoadingConversations ? (
                                        <div className="p-8 text-center text-xs text-muted-foreground">
                                            <div className="animate-pulse flex flex-col items-center gap-2">
                                                <div className="h-8 w-8 bg-muted rounded-full" />
                                                Loading chats...
                                            </div>
                                        </div>
                                    ) : conversations.length === 0 ? (
                                        <div className="p-8 text-center text-xs text-muted-foreground bg-muted/20 rounded-2xl border border-dashed border-primary/10">
                                            No recent conversations
                                        </div>
                                    ) : (
                                        conversations.map((conversation) => {
                                            const otherUser = getOtherParticipant(conversation.participants);
                                            if (!otherUser) return null;

                                            const isActive = activeUserId === otherUser._id;

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
                                                        "w-full justify-start items-center px-3 py-7 rounded-2xl transition-all duration-300 group relative overflow-hidden",
                                                        isActive
                                                            ? "bg-primary/10 text-primary shadow-soft"
                                                            : "hover:bg-primary/5 text-muted-foreground hover:text-foreground hover:translate-x-1"
                                                    )}
                                                >
                                                    <div className="relative shrink-0 mr-3">
                                                        <UserAvatar src={otherUser.avatar} name={otherUser.name} className="h-10 w-10 border border-primary/10" />
                                                        <span className={cn("absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-background shadow-sm",
                                                            onlineUsers.includes(otherUser._id) ? "bg-primary" : "bg-gray-400"
                                                        )} />
                                                    </div>

                                                    <div className="flex-1 min-w-0 overflow-hidden text-left">
                                                        <div className={cn("text-sm flex justify-between items-center mb-0.5 gap-2", isUnread ? "font-black text-foreground" : "font-bold text-muted-foreground/90")}>
                                                            <span className="block">
                                                                {otherUser.name.length > 20 ? `${otherUser.name.slice(0, 20)}...` : otherUser.name}
                                                            </span>
                                                            {isUnread && <span className="h-2 w-2 rounded-full bg-primary animate-pulse shrink-0" />}
                                                        </div>
                                                        <p className={cn("text-xs font-medium", isUnread ? "text-foreground" : "text-muted-foreground/60")}>
                                                            {conversation.lastMessage
                                                                ? <DecryptedLastMessage message={conversation.lastMessage as Message} otherUserId={otherUser._id} />
                                                                : "Started a conversation"}
                                                        </p>
                                                    </div>
                                                </Button>
                                            );
                                        })
                                    )}

                                    {/* Sentinel for infinite scroll */}
                                    {conversations.length > 0 && (
                                        <div ref={observerTarget} className="h-10 flex items-center justify-center w-full">
                                            {isFetchingNextPage && (
                                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary/40 animate-pulse">
                                                    <div className="h-1 w-1 bg-primary/40 rounded-full animate-bounce" />
                                                    <div className="h-1 w-1 bg-primary/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                                                    <div className="h-1 w-1 bg-primary/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </ScrollArea>


        </div>
    );
}
