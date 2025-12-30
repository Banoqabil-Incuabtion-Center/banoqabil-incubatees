import { useRef, useEffect, useState } from "react";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Hash, Phone, Video, PlusCircle, SendHorizontal, CheckCheck, Loader2, ArrowLeft, Lock } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/hooks/store/authStore";
import { useChatStore, Message } from "@/hooks/store/useChatStore";
import { useSocket } from "@/hooks/useSocket";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { SOCKET_URL as SERVER_URL } from "@/lib/constant";

// Component to handle async decryption of a single message
function DecryptedMessageText({ msg, otherUserId }: { msg: Message & { _decryptedText?: string }; otherUserId: string }) {
    const { decryptMessageText, isEncryptionReady } = useChatStore();

    // For encrypted messages without decrypted text, start with empty string
    // so we don't flash the encrypted ciphertext
    const getInitialText = () => {
        if (msg._decryptedText) return msg._decryptedText;
        if (!msg.isEncrypted) return msg.text;
        return ''; // Don't show encrypted text
    };

    const [text, setText] = useState<string>(getInitialText());
    // Start as decrypting if message is encrypted and not already decrypted
    const [isDecrypting, setIsDecrypting] = useState(msg.isEncrypted && !msg._decryptedText);
    const [isExpanded, setIsExpanded] = useState(false);

    const MAX_LENGTH = 200; // Characters before truncation

    useEffect(() => {
        // If already has decrypted text (sent by us), use it
        if (msg._decryptedText) {
            setText(msg._decryptedText);
            setIsDecrypting(false);
            return;
        }

        // If not encrypted, use plain text
        if (!msg.isEncrypted) {
            setText(msg.text);
            setIsDecrypting(false);
            return;
        }

        // Decrypt the message
        if (isEncryptionReady) {
            setIsDecrypting(true);
            decryptMessageText(msg, otherUserId)
                .then(decrypted => {
                    setText(decrypted);
                    setIsDecrypting(false);
                })
                .catch(() => {
                    setText('[Decryption error]');
                    setIsDecrypting(false);
                });
        }
    }, [msg, otherUserId, isEncryptionReady, decryptMessageText]);

    // Show truncated text with Read More
    const shouldTruncate = text.length > MAX_LENGTH && !isExpanded;
    const displayText = shouldTruncate ? text.substring(0, MAX_LENGTH) + '...' : text;

    return (
        <>
            {isDecrypting ? (
                <div className="flex gap-1 items-center">
                    <div className="h-3 w-16 bg-muted-foreground/20 rounded animate-pulse" />
                    <div className="h-3 w-10 bg-muted-foreground/15 rounded animate-pulse" />
                </div>
            ) : (
                <>
                    {displayText}
                    {text.length > MAX_LENGTH && (
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="text-primary hover:underline text-xs font-semibold ml-1"
                        >
                            {isExpanded ? 'Show less' : 'Read more'}
                        </button>
                    )}
                </>
            )}
        </>
    );
}

interface ChatAreaProps {
    activeUserId?: string;
    userName?: string;
    userAvatar?: string;
    onBack?: () => void;
}

import { EncryptionRecovery } from "./EncryptionRecovery";

export function ChatArea({ activeUserId, userName = "Select a User", userAvatar, onBack }: ChatAreaProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const queryClient = useQueryClient();
    const { user } = useAuthStore();
    const {
        sendMessage,
        markMessageAsRead,
        isSendingMessage,
        onlineUsers,
        initEncryption,
        isEncryptionReady,
    } = useChatStore();

    // TanStack Query for messages
    const {
        data: messagePages,
        fetchNextPage: fetchOlderMessages,
        hasNextPage: hasMoreMessages,
        isFetchingNextPage: isLoadingMore,
        isLoading: isLoadingMessages
    } = useInfiniteQuery({
        queryKey: ['messages', activeUserId],
        queryFn: async ({ pageParam = undefined }) => {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            let url = `${SERVER_URL}/api/messages/${activeUserId}?limit=15`;
            if (pageParam) {
                url += `&before=${pageParam}`;
            }
            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` },
            });
            // Reverse to [newest...oldest] for flex-col-reverse
            return [...response.data].reverse();
        },
        getNextPageParam: (lastPage) => {
            // lastPage is [newest...oldest] due to our queryFn modification
            return lastPage.length === 15 ? lastPage[lastPage.length - 1]?.createdAt : undefined;
        },
        enabled: !!activeUserId && activeUserId !== 'announcements',
        initialPageParam: undefined,
    });

    const messages = messagePages?.pages.flat() || [];
    // Currently API returns [oldest...newest] or [newest...oldest]?
    // Let's assume Backend returns [newest...oldest] if we use before.
    // Actually, based on previous logic, it seemed to be [oldest...newest].
    // To use flex-col-reverse effectively, we want [newest...oldest].

    const [inputValue, setInputValue] = useState("");
    const { on, emit } = useSocket();

    // Initialize E2E Encryption
    useEffect(() => {
        initEncryption();
    }, [initEncryption]);

    // Listen for read receipts and new messages
    useEffect(() => {
        const removeReadListener = on('messageRead', ({ conversationId, readerId }) => {
            markMessageAsRead(conversationId, readerId);
            // Also invalidate query to update checks
            queryClient.invalidateQueries({ queryKey: ['messages', activeUserId] });
        });

        const removeMsgListener = on('newMessage', (msg) => {
            if (msg.sender === activeUserId || (typeof msg.sender === 'object' && msg.sender._id === activeUserId)) {
                queryClient.invalidateQueries({ queryKey: ['messages', activeUserId] });
            }
        });

        return () => {
            removeReadListener();
            removeMsgListener();
        };
    }, [on, markMessageAsRead, queryClient, activeUserId]);

    // Mark messages as read when viewing them
    useEffect(() => {
        if (activeUserId && messages.length > 0 && user) {
            const lastMessage = messages[0]; // Newest message is at index 0
            const senderId = typeof lastMessage.sender === 'object' ? lastMessage.sender._id : lastMessage.sender;
            const isFromMe = senderId === user._id;
            const hasSeen = lastMessage.seenBy?.includes(user._id);

            if (lastMessage.conversationId && !isFromMe && !hasSeen) {
                emit('messageRead', {
                    conversationId: lastMessage.conversationId,
                    readerId: user._id,
                    senderId: activeUserId
                });
                markMessageAsRead(lastMessage.conversationId, user._id);
            }
        }
    }, [activeUserId, messages, user, emit, markMessageAsRead]);

    // Scroll listener for pagination (upward)
    const handleScroll = async () => {
        if (!scrollRef.current) return;

        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;

        // In flex-col-reverse, scrollTop is 0 at the bottom and negative as you scroll up.
        // Or sometimes it's positive but increases as you scroll up.
        // Let's use a browser-agnostic check: if we are near the very top (furthest from start).
        // For column-reverse, reaching the "top" of history means scrollTop + clientHeight >= scrollHeight - threshold
        if (Math.abs(scrollTop) + clientHeight >= scrollHeight - 20 && !isLoadingMessages && !isLoadingMore && hasMoreMessages) {
            await fetchOlderMessages();
        }
    };

    // Removed manual fetch useEffect as useInfiniteQuery handles it

    // Auto-scroll to bottom - Not strictly needed with flex-col-reverse as browser anchors to start
    useEffect(() => {
        if (scrollRef.current && !isLoadingMore) {
            // In column-reverse, 0 is the bottom
            scrollRef.current.scrollTop = 0;
        }
    }, [activeUserId, messages.length]);

    const handleSendMessage = async () => {
        if (!inputValue.trim() || !activeUserId) return;
        const text = inputValue;
        setInputValue("");
        await sendMessage(activeUserId, text);
        // Invalidate to show our message if it's not optimistically added correctly
        queryClient.invalidateQueries({ queryKey: ['messages', activeUserId] });
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    if (!activeUserId) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground bg-background">
                <div className="w-24 h-24 bg-muted/50 rounded-full flex items-center justify-center mb-6">
                    <Hash className="w-12 h-12 opacity-50" />
                </div>
                <h2 className="text-2xl font-bold mb-2">No conversation selected</h2>
                <p>Choose a friend from the sidebar to start chatting.</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col flex-1 h-full bg-background/50 relative min-h-0">
            {/* E2E Recovery / Setup UI */}
            <EncryptionRecovery />

            {/* Header */}
            <div className="h-16 border-b border-primary/5 flex items-center justify-between px-6 shadow-soft bg-background/80 backdrop-blur-md sticky top-0 z-10 transition-all duration-300">
                <div className="flex items-center gap-4">
                    {/* Back Button for Mobile */}
                    <Button variant="ghost" size="icon" className="md:hidden -ml-2 h-10 w-10 rounded-xl hover:bg-primary/5" onClick={onBack}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>

                    <Link to={`/user/${activeUserId}`} className="flex items-center gap-4 hover:opacity-80 transition-opacity">
                        <div className="relative">
                            <UserAvatar src={userAvatar} name={userName} className="h-10 w-10 border border-primary/10" />
                            {activeUserId && activeUserId !== 'announcements' && (
                                <span className={cn("absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-background",
                                    onlineUsers.includes(activeUserId) ? "bg-primary" : "bg-gray-400"
                                )} />
                            )}
                        </div>

                        <div className="flex flex-col">
                            <span className="font-black text-sm tracking-tight leading-none flex items-center gap-1.5">
                                {userName}
                            </span>
                            {activeUserId && activeUserId !== 'announcements' && (
                                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mt-1 flex items-center gap-1.5">
                                    {onlineUsers.includes(activeUserId) ? "Active Now" : "Offline"}
                                </span>
                            )}
                        </div>
                    </Link>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-primary/5 hover:text-primary transition-all">
                        <Phone className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-primary/5 hover:text-primary transition-all">
                        <Video className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar flex flex-col-reverse" ref={scrollRef} onScroll={handleScroll}>
                <div className="flex flex-col-reverse gap-3 pb-4 min-h-full justify-start">
                    {/* Welcome message - Moved to bottom of the flex-col-reverse list (visually top) */}
                    {!hasMoreMessages && !isLoadingMessages && (
                        <div className="mt-4 mb-4 px-6 py-6 rounded-[2rem] bg-primary/5 border border-primary/5 flex flex-col items-center text-center shadow-soft order-last">
                            <Link to={`/user/${activeUserId}`} className="flex flex-col items-center group">
                                <div className="relative mb-6">
                                    <UserAvatar src={userAvatar} name={userName} className="h-24 w-24 border-2 border-primary/20 shadow-premium transition-transform group-hover:scale-105 duration-300" />
                                    <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground p-2 rounded-full shadow-lg">
                                        <Hash className="w-5 h-5" />
                                    </div>
                                </div>
                                <div className="max-w-md space-y-3">
                                    <h1 className="text-2xl font-black tracking-tight group-hover:text-primary transition-colors">Chat with <span className="text-primary">{userName}</span></h1>
                                    <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                                        This is the start of your private conversation with {userName}. Keep it professional and polite!
                                    </p>
                                </div>
                            </Link>
                        </div>
                    )}

                    {/* Pagination Loader - Moved to bottom of the flex-col-reverse list (visually top) */}
                    {isLoadingMore && (
                        <div className="flex justify-center py-4 order-last">
                            <div className="flex gap-1.5 items-center">
                                <div className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce" />
                                <div className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                                <div className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]" />
                            </div>
                        </div>
                    )}

                    {isLoadingMessages ? (
                        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground h-full">
                            <Loader2 className="w-10 h-10 animate-spin mb-4 text-primary opacity-20" />
                            <p className="text-xs font-black uppercase tracking-[0.2em] opacity-40">Loading history</p>
                        </div>
                    ) : (
                        messages.map((msg, index) => {
                            const senderId = typeof msg.sender === 'object' ? msg.sender._id : msg.sender;
                            const isMe = senderId === user?._id;
                            // In reversed array, msg[index-1] is NEWER
                            const newerMsg = index > 0 ? messages[index - 1] : null;
                            const newerSenderId = newerMsg ? (typeof newerMsg.sender === 'object' ? newerMsg.sender._id : newerMsg.sender) : null;
                            const isLastInGroup = senderId !== newerSenderId;

                            return (
                                <div key={msg._id} className={`flex group px-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] sm:max-w-[70%] min-w-0 flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                        <div className={`px-4 py-3 shadow-soft transition-all duration-300
                                            ${isMe
                                                ? 'bg-primary text-primary-foreground rounded-2xl rounded-tr-[4px]'
                                                : 'bg-white dark:bg-muted/50 hover:shadow-md border border-primary/5 text-foreground rounded-2xl rounded-tl-[4px]'
                                            }`}
                                            style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                                            <p className="text-[14.5px] leading-relaxed font-medium">
                                                <DecryptedMessageText msg={msg} otherUserId={activeUserId || ''} />
                                            </p>
                                        </div>

                                        {isLastInGroup && (
                                            <div className="flex items-center gap-1.5 mt-1.5 px-1">
                                                {msg.isEncrypted && (
                                                    <Lock className="w-2.5 h-2.5 text-muted-foreground/40" />
                                                )}
                                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                {isMe && (
                                                    <CheckCheck
                                                        className={`w-3 h-3 ${msg.seenBy?.some(id => id !== user?._id) ? "text-primary" : "text-muted-foreground/30"}`}
                                                    />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Floating Input Area */}
            <div className="sticky bottom-0 p-4 md:p-6 bg-gradient-to-t from-background via-background/80 to-transparent">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white/90 dark:bg-muted/90 backdrop-blur-xl rounded-[2rem] p-2 pr-3 flex items-center gap-2 border border-primary/10 shadow-premium hover:shadow-premium-hover transition-all duration-500 group focus-within:ring-2 focus-within:ring-primary/20">
                        <Button size="icon" variant="ghost" className="h-11 w-11 rounded-2xl bg-primary/5 text-primary hover:bg-primary/10 shrink-0 transition-all active:scale-95">
                            <PlusCircle className="w-5 h-5" />
                        </Button>

                        <div className="flex-1">
                            <Input
                                className="bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-2 h-11 text-sm sm:text-base font-medium placeholder:text-muted-foreground/50"
                                placeholder={`Write a message to ${userName}...`}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                        </div>

                        <Button
                            size="icon"
                            className={cn(
                                "h-11 w-11 rounded-2xl shrink-0 transition-all duration-300",
                                inputValue.trim()
                                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-0.5 active:scale-90"
                                    : "bg-muted text-muted-foreground/50 cursor-not-allowed"
                            )}
                            onClick={handleSendMessage}
                            disabled={!inputValue.trim() || isSendingMessage}
                        >
                            {isSendingMessage ? <Loader2 className="w-5 h-5 animate-spin" /> : <SendHorizontal className="w-5 h-5" />}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
