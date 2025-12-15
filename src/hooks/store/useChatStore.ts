import { create } from 'zustand';
import axios from 'axios';
import { SOCKET_URL as SERVER_URL } from '@/lib/constant';

export interface User {
    _id: string;
    name: string;
    avatar: string;
    email: string;
    status?: 'online' | 'offline' | 'idle' | 'dnd'; // For UI only for now
}

export interface Conversation {
    _id: string;
    participants: User[];
    lastMessage?: Message;
    createdAt: string;
    updatedAt: string;
}

export interface Message {
    _id: string;
    conversationId: string;
    sender: User | string; // Populated or ID
    text: string;
    createdAt: string;
    seenBy: string[];
}

interface ChatState {
    conversations: Conversation[];
    messages: Message[];
    activeConversation: Conversation | null;
    activeUserId: string | null;
    isLoadingConversations: boolean;
    isLoadingMessages: boolean;
    isSendingMessage: boolean;

    isSearching: boolean;
    searchResults: User[];

    fetchConversations: () => Promise<void>;
    fetchMessages: (receiverId: string) => Promise<void>;
    sendMessage: (receiverId: string, text: string) => Promise<void>;
    searchUsers: (query: string) => Promise<void>;
    setActiveUser: (userId: string | null) => void;
    addMessage: (message: Message) => void;
    updateTypingStatus: (userId: string, isTyping: boolean) => void; // Placeholder
    markMessageAsRead: (conversationId: string, readerId: string) => Promise<void>;

    // Online Users
    onlineUsers: string[];
    setOnlineUsers: (users: string[]) => void;
    addOnlineUser: (userId: string) => void;
    removeOnlineUser: (userId: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
    conversations: [],
    messages: [],
    activeConversation: null,
    activeUserId: null,
    isLoadingConversations: false,
    isLoadingMessages: false,
    isSendingMessage: false,
    isSearching: false,
    searchResults: [],

    onlineUsers: [],

    setOnlineUsers: (users) => set({ onlineUsers: users }),

    addOnlineUser: (userId) => {
        set((state) => {
            if (!state.onlineUsers.includes(userId)) {
                return { onlineUsers: [...state.onlineUsers, userId] };
            }
            return state;
        });
    },

    removeOnlineUser: (userId) => {
        set((state) => ({
            onlineUsers: state.onlineUsers.filter(id => id !== userId)
        }));
    },

    fetchConversations: async () => {
        set({ isLoadingConversations: true });
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const response = await axios.get(`${SERVER_URL}/api/messages/conversations`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            set({ conversations: response.data, isLoadingConversations: false });
        } catch (error) {
            console.error('Error fetching conversations:', error);
            set({ isLoadingConversations: false });
        }
    },

    searchUsers: async (query: string) => {
        if (!query.trim()) {
            set({ searchResults: [], isSearching: false });
            return;
        }
        set({ isSearching: true });
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const response = await axios.get(`${SERVER_URL}/api/messages/search?query=${query}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            set({ searchResults: response.data, isSearching: false });
        } catch (error) {
            console.error("Error searching users:", error);
            set({ isSearching: false });
        }
    },

    fetchMessages: async (receiverId: string) => {
        set({ isLoadingMessages: true, messages: [] }); // Clear previous messages
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const response = await axios.get(`${SERVER_URL}/api/messages/${receiverId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            set({ messages: response.data, isLoadingMessages: false });
        } catch (error) {
            console.error('Error fetching messages:', error);
            set({ isLoadingMessages: false });
        }
    },

    sendMessage: async (receiverId: string, text: string) => {
        set({ isSendingMessage: true });
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const response = await axios.post(
                `${SERVER_URL}/api/messages/send`,
                { receiverId, message: text },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Optimistically add the message or rely on socket? 
            // For now, let's add it directly to store as well
            const newMessage = response.data;

            // Need to ensure sender is populated or handled correctly in UI
            // Backend returns the message object. Helper to format if needed.

            const currentMessages = get().messages;
            set({
                messages: [...currentMessages, newMessage],
                isSendingMessage: false
            });

            // Also update conversation last message if it exists in list
            let conversations = get().conversations.map(c => {
                // Assuming we can identify the conversation. 
                // Ideally backend returns the conversation ID, but let's check participants
                const isParticipant = c.participants.some(p => p._id === receiverId);
                if (isParticipant) {
                    return { ...c, lastMessage: newMessage, updatedAt: newMessage.createdAt };
                }
                return c;
            });

            // Sort to move this conversation to top
            conversations.sort((a, b) => {
                const aTime = a.lastMessage?.createdAt || a.updatedAt;
                const bTime = b.lastMessage?.createdAt || b.updatedAt;
                return new Date(bTime).getTime() - new Date(aTime).getTime();
            });

            set({ conversations });

        } catch (error) {
            console.error('Error sending message:', error);
            set({ isSendingMessage: false });
        }
    },

    setActiveUser: (userId) => {
        set({ activeUserId: userId });
    },

    addMessage: (message: Message) => {
        const { activeUserId, messages, conversations } = get();

        // If message belongs to active chat, add it
        // Check if sender is activeUser OR if user is sender (loopback)
        const isRelevantToActiveChat =
            (typeof message.sender === 'object' ? message.sender._id : message.sender) === activeUserId ||
            (message.conversationId === (get().activeConversation?._id)); // This might need refinement

        // Actually, simpler logic: check if the other party in the message is the activeUserId

        // For simplicity, just append if it matches activeUserId
        // We need to know who the message is FROM.
        const senderId = typeof message.sender === 'object' ? message.sender._id : message.sender;

        if (senderId === activeUserId || (senderId !== activeUserId && get().activeUserId === senderId)) {
            // Wait, if I received a message from activeUserId:
            if (senderId === activeUserId) {
                set({ messages: [...messages, message] });
            }
        }

        // Always update conversation list last message and move it to top
        // If conversation doesn't exist in list (new chat started by someone else), fetch conversations?
        // Or just update existing.
        const updatedConversations = conversations.map(c => {
            if (c._id === message.conversationId) {
                return { ...c, lastMessage: message, updatedAt: message.createdAt };
            }
            return c;
        });

        // Sort by updatedAt to move conversation with new message to top
        updatedConversations.sort((a, b) => {
            const aTime = a.lastMessage?.createdAt || a.updatedAt;
            const bTime = b.lastMessage?.createdAt || b.updatedAt;
            return new Date(bTime).getTime() - new Date(aTime).getTime();
        });

        set({ conversations: updatedConversations });
    },

    updateTypingStatus: (userId, isTyping) => {
        // TODO: implement logic to show typing indicator in UI
    },

    markMessageAsRead: async (conversationId, readerId) => {
        try {
            // Optimistic update first
            const { messages, conversations } = get();

            // Send request to backend
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            await axios.put(
                `${SERVER_URL}/api/messages/read`,
                { conversationId },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Update messages in current view
            const updatedMessages = messages.map(msg => {
                if (msg.conversationId === conversationId && !msg.seenBy.includes(readerId)) {
                    return { ...msg, seenBy: [...msg.seenBy, readerId] };
                }
                return msg;
            });

            // Update last message in conversations list if applicable
            const updatedConversations = conversations.map(c => {
                if (c._id === conversationId && c.lastMessage && !c.lastMessage.seenBy.includes(readerId)) {
                    return {
                        ...c,
                        lastMessage: { ...c.lastMessage, seenBy: [...c.lastMessage.seenBy, readerId] }
                    };
                }
                return c;
            });

            set({ messages: updatedMessages, conversations: updatedConversations });

        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    }
}));
