import { useRef, useEffect, useState } from "react";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Hash, Phone, Video, PlusCircle, SendHorizontal, CheckCheck } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/hooks/store/authStore";
import { useChatStore } from "@/hooks/store/useChatStore";
import { useSocket } from "@/hooks/useSocket";

interface ChatAreaProps {
    activeUserId?: string;
    userName?: string;
    userAvatar?: string;
}

export function ChatArea({ activeUserId, userName = "Select a User", userAvatar }: ChatAreaProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const { user } = useAuthStore();
    const { messages, fetchMessages, sendMessage, isLoadingMessages, markMessageAsRead } = useChatStore();
    const [inputValue, setInputValue] = useState("");
    const { socket, on, emit } = useSocket();

    // Listen for read receipts
    useEffect(() => {
        const removeListener = on('messageRead', ({ conversationId, readerId }) => {
            markMessageAsRead(conversationId, readerId);
        });
        return removeListener;
    }, [on, markMessageAsRead]);

    // Mark messages as read when viewing them
    useEffect(() => {
        if (activeUserId && messages.length > 0 && user) {
            const lastMessage = messages[messages.length - 1];

            // Only mark as read if:
            // 1. Message exists and has an ID (sanity check)
            // 2. Message is NOT sent by me (I don't "read" my own messages in this context)
            // 3. I haven't already marked it as seen (prevents infinite loop)
            const isFromMe = (typeof lastMessage.sender === 'object' ? lastMessage.sender._id : lastMessage.sender) === user._id;
            const hasSeen = lastMessage.seenBy.includes(user._id);

            if (lastMessage.conversationId && !isFromMe && !hasSeen) {
                // Emit event to notify the sender
                emit('messageRead', {
                    conversationId: lastMessage.conversationId,
                    readerId: user._id,
                    senderId: activeUserId
                });

                // Update local store immediately to remove unread highlight
                markMessageAsRead(lastMessage.conversationId, user._id);
            }
        }
    }, [activeUserId, messages, user, emit, markMessageAsRead]);

    useEffect(() => {
        if (activeUserId && activeUserId !== 'announcements') {
            fetchMessages(activeUserId);
        }
    }, [activeUserId, fetchMessages]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, activeUserId]);

    const handleSendMessage = async () => {
        if (!inputValue.trim() || !activeUserId) return;
        await sendMessage(activeUserId, inputValue);
        setInputValue("");
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
        <div className="flex flex-col flex-1 h-full bg-background relative min-h-0">
            {/* Header */}
            <div className="h-14 border-b flex items-center justify-between px-4 shadow-sm bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="flex items-center gap-3">
                    <UserAvatar src={userAvatar} name={userName} className="h-8 w-8" />
                    <div className="flex flex-col">
                        <span className="font-semibold text-sm leading-none flex items-center gap-1.5">
                            {userName}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-4 text-muted-foreground">
                    <Phone className="w-5 h-5 cursor-pointer hover:text-foreground transition-colors" />
                    <Video className="w-5 h-5 cursor-pointer hover:text-foreground transition-colors" />
                    <Separator orientation="vertical" className="h-6 mx-2" />
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar" ref={scrollRef}>
                <div className="flex flex-col gap-4 pb-4">
                    {/* Welcome message */}
                    <div className="mt-8 mb-8 px-4">
                        <div className="h-16 w-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                            <UserAvatar src={userAvatar} name={userName} className="h-16 w-16" />
                        </div>
                        <h1 className="text-3xl font-bold mb-1">This is the beginning of your direct message history with <span className="text-primary">{userName}</span></h1>
                        <p className="text-muted-foreground">This is the beginning of your direct message history with {userName}. Say hello!</p>
                    </div>

                    <Separator className="mb-4" />

                    {isLoadingMessages ? (
                        <div className="text-center text-muted-foreground">Loading messages...</div>
                    ) : (
                        messages.map((msg) => {
                            // Check if msg.sender is populated object or string ID
                            const senderId = typeof msg.sender === 'object' ? msg.sender._id : msg.sender;
                            const isMe = senderId === user?._id;

                            return (
                                <div key={msg._id} className={`flex gap-3 group ${isMe ? 'flex-row-reverse' : ''}`}>
                                    {isMe ? (
                                        <UserAvatar src={user?.avatar} name={user?.name} className="h-10 w-10 mt-0.5 cursor-pointer hover:opacity-80 transition-opacity" />
                                    ) : (
                                        <UserAvatar src={userAvatar} name={userName} className="h-10 w-10 mt-0.5 cursor-pointer hover:opacity-80 transition-opacity" />
                                    )}

                                    <div className={`max-w-[70%] min-w-0 flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                        <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                                            {!isMe && <span className="font-semibold text-sm hover:underline cursor-pointer truncate max-w-[150px]">{userName}</span>}
                                            <span className="text-[10px] text-muted-foreground select-none whitespace-nowrap flex items-center gap-1">
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                {isMe && (
                                                    <CheckCheck
                                                        className={`w-3 h-3 ${msg.seenBy.some(id => id !== user?._id) ? "text-blue-500" : "text-muted-foreground"}`}
                                                    />
                                                )}
                                            </span>
                                        </div>
                                        <div className={`px-4 py-2.5 rounded-2xl text-[15px] leading-relaxed shadow-sm break-words overflow-hidden
                                    ${isMe
                                                ? 'bg-primary text-primary-foreground rounded-tr-sm'
                                                : 'bg-secondary/50 hover:bg-secondary/60 transition-colors rounded-tl-sm'
                                            }`}
                                            style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                                            {msg.text}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Input Area */}
            <div className="pt-0">
                <div className="bg-secondary/30 rounded-lg p-3 flex items-start gap-3">
                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full bg-muted/50 text-muted-foreground hover:text-foreground shrink-0">
                        <PlusCircle className="w-5 h-5" />
                    </Button>

                    <div className="flex-1">
                        <Input
                            className="bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-0 h-auto py-2 text-base placeholder:text-muted-foreground/70"
                            placeholder={`Message @${userName}`}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                    </div>

                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-primary hover:text-primary/80 shrink-0"
                        onClick={handleSendMessage}
                        disabled={!inputValue.trim()}
                    >
                        <SendHorizontal className="w-5 h-5" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
