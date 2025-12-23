import { create } from 'zustand';
import axios from 'axios';
import { SOCKET_URL as SERVER_URL } from '@/lib/constant';
import {
    initializeEncryption,
    getOrDeriveSharedKey,
    encryptMessage,
    decryptMessage,
    getStoredPublicKey,
} from '@/lib/crypto';

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
    // E2E Encryption fields
    iv?: string | null;
    isEncrypted?: boolean;
}

interface ChatState {
    conversations: Conversation[];
    messages: Message[];
    activeConversation: Conversation | null;
    activeUserId: string | null;
    isLoadingConversations: boolean;
    isLoadingMessages: boolean;
    hasMoreMessages: boolean;
    isSendingMessage: boolean;

    conversationPage: number;
    hasMoreConversations: boolean;
    isLoadingMoreConversations: boolean;

    isSearching: boolean;
    searchResults: User[];

    onlineUsers: string[];
    unreadCount: number;

    // E2E Encryption state
    myKeyPair: CryptoKeyPair | null;
    isEncryptionReady: boolean;
    userPublicKeys: Map<string, string>; // userId -> publicKey

    fetchConversations: () => Promise<void>;
    loadMoreConversations: () => Promise<void>;
    fetchMessages: (receiverId: string, before?: string) => Promise<void>;
    sendMessage: (receiverId: string, text: string) => Promise<void>;
    searchUsers: (query: string) => Promise<void>;
    fetchUnreadCount: () => Promise<void>;
    setActiveUser: (userId: string | null) => void;
    addMessage: (message: Message, currentUserId?: string) => void;
    updateTypingStatus: (userId: string, isTyping: boolean) => void;
    markMessageAsRead: (conversationId: string, readerId: string) => Promise<void>;

    setOnlineUsers: (users: string[]) => void;
    addOnlineUser: (userId: string) => void;
    removeOnlineUser: (userId: string) => void;

    // E2E Encryption methods
    initEncryption: () => Promise<void>;
    fetchUserPublicKey: (userId: string) => Promise<string | null>;
    decryptMessageText: (msg: Message, otherUserId: string) => Promise<string>;
}

// Helper selector to get unread conversations count
export const getUnreadConversationsCount = (state: ChatState, currentUserId: string | undefined): number => {
    if (!currentUserId) return 0;
    return state.conversations.filter(conv => {
        const lastMessage = conv.lastMessage;
        if (!lastMessage) return false;
        // Check if last message is NOT from current user AND not seen by current user
        const senderId = typeof lastMessage.sender === 'object'
            ? (lastMessage.sender as User)._id
            : lastMessage.sender;
        const isFromOther = senderId !== currentUserId;
        const isUnread = !lastMessage.seenBy.includes(currentUserId);
        return isFromOther && isUnread;
    }).length;
};

export const useChatStore = create<ChatState>((set, get) => ({
    conversations: [],
    messages: [],
    activeConversation: null,
    activeUserId: null,
    isLoadingConversations: false,
    conversationPage: 1,
    hasMoreConversations: true,
    isLoadingMoreConversations: false,
    isLoadingMessages: false,
    hasMoreMessages: true,
    isSendingMessage: false,
    isSearching: false,
    searchResults: [],

    onlineUsers: [],
    unreadCount: 0,

    // E2E Encryption state
    myKeyPair: null,
    isEncryptionReady: false,
    userPublicKeys: new Map(),

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
        set({ isLoadingConversations: true, conversationPage: 1, hasMoreConversations: true });
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const response = await axios.get(`${SERVER_URL}/api/messages/conversations?page=1&limit=10`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            set({
                conversations: response.data,
                isLoadingConversations: false,
                hasMoreConversations: response.data.length === 10
            });
        } catch (error) {
            console.error('Error fetching conversations:', error);
            set({ isLoadingConversations: false });
        }
    },

    loadMoreConversations: async () => {
        const { conversationPage, hasMoreConversations, isLoadingMoreConversations, isLoadingConversations } = get();
        if (!hasMoreConversations || isLoadingMoreConversations || isLoadingConversations) return;

        set({ isLoadingMoreConversations: true });
        const nextPage = conversationPage + 1;

        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const response = await axios.get(`${SERVER_URL}/api/messages/conversations?page=${nextPage}&limit=10`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const newConversations = response.data;
            const hasMore = newConversations.length === 10;

            set((state) => ({
                conversations: [...state.conversations, ...newConversations],
                conversationPage: nextPage,
                hasMoreConversations: hasMore,
                isLoadingMoreConversations: false
            }));

        } catch (error) {
            console.error('Error loading more conversations:', error);
            set({ isLoadingMoreConversations: false });
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

    fetchUnreadCount: async () => {
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const response = await axios.get(`${SERVER_URL}/api/messages/unread-count`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            set({ unreadCount: response.data.unreadCount });
        } catch (error) {
            console.error("Error fetching unread count:", error);
        }
    },

    fetchMessages: async (receiverId: string, before?: string) => {
        // If it's an initial fetch (no 'before'), clear messages and set loading
        if (!before) {
            set({ isLoadingMessages: true, messages: [], hasMoreMessages: true });
        }

        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            let url = `${SERVER_URL}/api/messages/${receiverId}?limit=15`; // Optimized limit for balance
            if (before) {
                url += `&before=${before}`;
            }

            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const newMessages = response.data;

            set((state) => {
                let updatedMessages;
                if (before) {
                    // Prepend new messages
                    updatedMessages = [...newMessages, ...state.messages];
                } else {
                    updatedMessages = newMessages;
                }

                return {
                    messages: updatedMessages,
                    isLoadingMessages: false,
                    hasMoreMessages: newMessages.length === 15 // If we got full limit, likely more exists
                };
            });
        } catch (error) {
            console.error('Error fetching messages:', error);
            set({ isLoadingMessages: false });
        }
    },

    sendMessage: async (receiverId: string, text: string) => {
        set({ isSendingMessage: true });
        try {
            const { myKeyPair, isEncryptionReady } = get();
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');

            let messagePayload: { receiverId: string; message: string; iv?: string; isEncrypted?: boolean } = {
                receiverId,
                message: text,
            };

            // Encrypt message if encryption is ready
            console.log('🔐 E2E: Checking encryption', { isEncryptionReady, hasKeyPair: !!myKeyPair });
            if (isEncryptionReady && myKeyPair) {
                const theirPublicKey = await get().fetchUserPublicKey(receiverId);
                console.log('🔐 E2E: Fetched their public key', { hasKey: !!theirPublicKey, keyLength: theirPublicKey?.length });
                if (theirPublicKey) {
                    try {
                        const sharedKey = await getOrDeriveSharedKey(
                            myKeyPair.privateKey,
                            theirPublicKey,
                            receiverId
                        );
                        const { ciphertext, iv } = await encryptMessage(sharedKey, text);
                        messagePayload = {
                            receiverId,
                            message: ciphertext,
                            iv,
                            isEncrypted: true,
                        };
                        console.log('🔐 E2E: Message encrypted successfully', { ciphertextLength: ciphertext.length });
                    } catch (encErr) {
                        console.warn('❌ E2E: Encryption failed, sending plain text:', encErr);
                    }
                } else {
                    console.log('⚠️ E2E: Receiver has no public key, sending plain text');
                }
            }

            const response = await axios.post(
                `${SERVER_URL}/api/messages/send`,
                messagePayload,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Optimistically add the message or rely on socket? 
            // For now, let's add it directly to store as well
            const newMessage = response.data;

            // Ensure defaults
            if (!newMessage.seenBy) newMessage.seenBy = [];

            // Store plain text locally for optimistic UI (we know what we sent)
            const localMessage = { ...newMessage, text: text, _decryptedText: text };

            set((state) => {
                const currentMessages = state.messages;
                // Avoid duplicates if socket already added it
                if (currentMessages.some(m => m._id === newMessage._id)) {
                    return { isSendingMessage: false };
                }

                return {
                    messages: [...currentMessages, localMessage],
                    isSendingMessage: false
                };
            });

            // Also update conversation last message if it exists in list
            set((state) => {
                const conversations = state.conversations.map(c => {
                    const isParticipant = c.participants.some(p => p._id === receiverId);
                    if (isParticipant) {
                        return { ...c, lastMessage: localMessage, updatedAt: newMessage.createdAt };
                    }
                    return c;
                });

                // Sort to move this conversation to top
                conversations.sort((a, b) => {
                    const aTime = a.lastMessage?.createdAt || a.updatedAt;
                    const bTime = b.lastMessage?.createdAt || b.updatedAt;
                    return new Date(bTime).getTime() - new Date(aTime).getTime();
                });

                return { conversations };
            });

        } catch (error) {
            console.error('Error sending message:', error);
            set({ isSendingMessage: false });
        }
    },

    setActiveUser: (userId) => {
        set({ activeUserId: userId });
    },

    addMessage: (message: Message, currentUserId?: string) => {
        // Ensure defaults
        if (!message.seenBy) message.seenBy = [];

        set((state) => {
            const { activeUserId, messages, conversations, unreadCount } = state;
            const updates: Partial<ChatState> = {};

            // Check if sender is activeUser OR if user is sender (loopback)
            const senderId = typeof message.sender === 'object' ? (message.sender as any)._id : message.sender;

            if (senderId === activeUserId) {
                // Message FROM the person I'm chatting with
                if (!messages.some(m => m._id === message._id)) {
                    updates.messages = [...messages, message];
                }
            } else {
                // Check if message belongs to current conversation context.
                const activeConv = state.activeConversation;
                if (activeConv && activeConv._id === message.conversationId) {
                    if (!messages.some(m => m._id === message._id)) {
                        updates.messages = [...messages, message];
                    }
                } else {
                    const conversationWithActiveUser = conversations.find(c => c.participants.some(p => p._id === activeUserId));
                    if (conversationWithActiveUser && conversationWithActiveUser._id === message.conversationId) {
                        if (!messages.some(m => m._id === message._id)) {
                            updates.messages = [...messages, message];
                        }
                    }
                }
            }

            // Update unread count if message is from other and not currently being read
            const isMsgFromOther = senderId !== currentUserId;
            if (isMsgFromOther) {
                // If we are NOT in the conversation where message arrived, we might need to increment unreadCount
                // But only if this conversation wasn't already unread.
                const conv = conversations.find(c => c._id === message.conversationId);
                const wasReadBefore = !conv || !conv.lastMessage || conv.lastMessage.seenBy.includes(currentUserId || '');

                // Also check if we are currently looking at this conversation
                const isCurrentlyViewing = activeUserId === senderId || (state.activeConversation && state.activeConversation._id === message.conversationId);

                if (wasReadBefore && !isCurrentlyViewing) {
                    updates.unreadCount = unreadCount + 1;
                }
            }

            // Always update conversation list last message and move it to top
            const updatedConversations = conversations.map(c => {
                if (c._id === message.conversationId) {
                    return { ...c, lastMessage: message, updatedAt: message.createdAt };
                }
                return c;
            });

            // Sort by updatedAt
            updatedConversations.sort((a, b) => {
                const aTime = a.lastMessage?.createdAt || a.updatedAt;
                const bTime = b.lastMessage?.createdAt || b.updatedAt;
                return new Date(bTime).getTime() - new Date(aTime).getTime();
            });

            updates.conversations = updatedConversations;

            return updates;
        });
    },

    updateTypingStatus: (userId, isTyping) => {
        // TODO: implement logic to show typing indicator in UI
    },

    markMessageAsRead: async (conversationId, readerId) => {
        try {
            // Optimistic/Immediate update to UI to prevent waiting for API
            set((state) => {
                const alreadyUnread = state.conversations.some(c =>
                    c._id === conversationId &&
                    c.lastMessage &&
                    c.lastMessage.sender !== readerId &&
                    !c.lastMessage.seenBy.includes(readerId)
                );

                return {
                    unreadCount: alreadyUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
                    messages: state.messages.map(msg => {
                        if (msg.conversationId === conversationId && !msg.seenBy.includes(readerId)) {
                            return { ...msg, seenBy: [...msg.seenBy, readerId] };
                        }
                        return msg;
                    }),
                    conversations: state.conversations.map(c => {
                        if (c._id === conversationId && c.lastMessage && !c.lastMessage.seenBy.includes(readerId)) {
                            return {
                                ...c,
                                lastMessage: { ...c.lastMessage, seenBy: [...c.lastMessage.seenBy, readerId] }
                            };
                        }
                        return c;
                    })
                };
            });

            // Send request to backend
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            await axios.put(
                `${SERVER_URL}/api/messages/read`,
                { conversationId },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // No need to set state again after API if we trust the optimistic update.
            // If we wanted to be strictly accurate, we could update again, but purely functional:
            // But usually optimistic is enough unless error.

        } catch (error) {
            console.error('Error marking messages as read:', error);
            // Ideally revert here, but strict revert logic is complex. 
            // For read receipts, occasional sync error is acceptable vs disappearance.
        }
    },

    // E2E Encryption: Initialize encryption on app start
    initEncryption: async () => {
        try {
            const { keyPair, publicKeyBase64, isNew } = await initializeEncryption();
            set({ myKeyPair: keyPair, isEncryptionReady: true });

            // Always upload public key to server (to ensure it's synced)
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            if (token) {
                try {
                    await axios.put(
                        `${SERVER_URL}/api/messages/public-key`,
                        { publicKey: publicKeyBase64 },
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    console.log('✅ E2E: Public key uploaded to server');
                } catch (uploadErr) {
                    console.warn('⚠️ E2E: Failed to upload public key:', uploadErr);
                }
            }

            console.log('✅ E2E Encryption initialized', { isNew, keyLength: publicKeyBase64.length });
        } catch (error) {
            console.error('❌ Error initializing encryption:', error);
        }
    },

    // E2E Encryption: Fetch user's public key
    fetchUserPublicKey: async (userId: string) => {
        const { userPublicKeys } = get();

        // Check cache first
        if (userPublicKeys.has(userId)) {
            return userPublicKeys.get(userId)!;
        }

        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const response = await axios.get(`${SERVER_URL}/api/messages/public-key/${userId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const publicKey = response.data.publicKey;
            if (publicKey) {
                // Cache it
                const newMap = new Map(userPublicKeys);
                newMap.set(userId, publicKey);
                set({ userPublicKeys: newMap });
            }

            return publicKey;
        } catch (error) {
            console.error('Error fetching user public key:', error);
            return null;
        }
    },

    // E2E Encryption: Decrypt a message
    decryptMessageText: async (msg: Message, otherUserId: string) => {
        const { myKeyPair, isEncryptionReady } = get();

        // If not encrypted, return plain text
        if (!msg.isEncrypted || !msg.iv) {
            return msg.text;
        }

        // If encryption not ready, return placeholder
        if (!isEncryptionReady || !myKeyPair) {
            return '[Encrypted message - loading...]';
        }

        try {
            const theirPublicKey = await get().fetchUserPublicKey(otherUserId);
            if (!theirPublicKey) {
                return '[Encrypted message - key not available]';
            }

            const sharedKey = await getOrDeriveSharedKey(
                myKeyPair.privateKey,
                theirPublicKey,
                otherUserId
            );

            const decrypted = await decryptMessage(sharedKey, msg.text, msg.iv);
            return decrypted;
        } catch (error) {
            console.error('Error decrypting message:', error);
            return '[Decryption failed]';
        }
    }
}));

