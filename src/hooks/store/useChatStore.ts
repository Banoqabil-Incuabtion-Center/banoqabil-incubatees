import { create } from 'zustand';
import axios from 'axios';
import { SOCKET_URL as SERVER_URL } from '@/lib/constant';
import {
    initializeEncryption,
    getOrDeriveSharedKey,
    encryptMessage,
    decryptMessage,
    getStoredPublicKey,
    generateKeyPair,
    getStoredKeyPair,
    storeKeyPair,
    exportPublicKey,
    importPublicKey,
    backupPrivateKey,
    restorePrivateKey,
    clearSharedKeyCache,
} from '@/lib/crypto';

// Helper to safely decode JWT payload
const decodeJWTPayload = (token: string) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
};

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
    needsRecovery: boolean;
    backupData: { encryptedPrivateKey: string; iv: string; salt: string } | null;

    fetchConversations: () => Promise<void>;
    loadMoreConversations: () => Promise<void>;
    fetchMessages: (receiverId: string, before?: string) => Promise<void>;
    sendMessage: (receiverId: string, text: string, publicKey?: string) => Promise<void>;
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
    initEncryption: (password?: string) => Promise<void>;
    fetchUserPublicKey: (userId: string) => Promise<string | null>;
    decryptMessageText: (msg: Message, otherUserId: string, publicKey?: string) => Promise<string>;
    resetEncryptionKeys: () => Promise<void>;
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
    needsRecovery: false,
    backupData: null,

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

    sendMessage: async (receiverId: string, text: string, publicKey?: string) => {
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
            // Encrypt message if encryption is ready
            console.log('🔐 E2E: Checking encryption', { isEncryptionReady, hasKeyPair: !!myKeyPair });
            if (isEncryptionReady && myKeyPair) {
                const theirPublicKey = publicKey || await get().fetchUserPublicKey(receiverId);
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
                        console.error('❌ E2E: Encryption failed:', encErr);
                        // Strict mode: Fail if encryption fails
                        throw new Error("Encryption failed. Please check your keys.");
                    }
                } else {
                    console.warn('⚠️ E2E: Receiver has no public key.');
                    // Strict mode: Fail if receiver has no key
                    throw new Error("Recipient has not set up secure chat yet. Cannot send encrypted message.");
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

        } catch (error: any) {
            console.error('Error sending message:', error);
            set({ isSendingMessage: false });
            // Show toast for error
            import('sonner').then(({ toast }) => {
                toast.error(error.message || "Failed to send message");
            });
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

    // E2E Encryption: Initialize encryption on app start or login
    // If password is provided (during login), auto-recover or auto-setup backup
    initEncryption: async (password?: string) => {
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            if (!token) return;

            // 1. Get current user's profile info from server (includes backup)
            const decodedToken = decodeJWTPayload(token);
            if (!decodedToken) {
                console.error('🔐 E2E: Failed to decode token');
                return;
            }
            const myUserId = decodedToken.userId || decodedToken.id;

            console.log('🔐 E2E: Initializing for user', myUserId);
            let currentUserBackupData = null;
            let serverPublicKey = null;
            try {
                // We use the public-key endpoint with own ID to get backup info
                const response = await axios.get(`${SERVER_URL}/api/messages/public-key/${myUserId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                console.log('🔐 E2E: Server backup status:', { hasBackup: !!response.data.backup?.encryptedPrivateKey });
                if (response.data.backup?.encryptedPrivateKey) {
                    currentUserBackupData = response.data.backup;
                }
                serverPublicKey = response.data.publicKey;
            } catch (err) {
                console.warn('⚠️ E2E: Failed to fetch own backup info:', err);
            }

            // 2. Try to get local key pair
            let keyPair = await getStoredKeyPair();

            if (!keyPair) {
                // No local key. 
                if (currentUserBackupData && password) {
                    // We have backup AND password (from login) -> Auto-recover
                    console.log('🔐 E2E: Auto-recovering keys using password...');
                    try {
                        const { encryptedPrivateKey, iv, salt } = currentUserBackupData;
                        const privateKey = await restorePrivateKey(encryptedPrivateKey, password, iv, salt);

                        if (serverPublicKey) {
                            const publicKey = await importPublicKey(serverPublicKey);
                            keyPair = { privateKey, publicKey };
                            await storeKeyPair(keyPair);
                            clearSharedKeyCache();
                            console.log('✅ E2E: Keys recovered successfully from password');
                        } else {
                            throw new Error('Public key not found on server');
                        }
                    } catch (recoveryError) {
                        console.error('❌ E2E: Auto-recovery failed:', recoveryError);
                        // Recovery failed - generate new keys
                        console.log('🔐 E2E: Generating new keys after failed recovery...');
                        keyPair = await generateKeyPair();
                        await storeKeyPair(keyPair);
                        clearSharedKeyCache();
                        currentUserBackupData = null; // Will trigger new backup
                    }
                } else if (currentUserBackupData && !password) {
                    // We have backup but no password - need recovery prompt
                    console.log('🔐 E2E: Local key missing, backup found but no password. Setting needsRecovery.');
                    set({
                        needsRecovery: true,
                        backupData: currentUserBackupData,
                        isEncryptionReady: false
                    });
                    return;
                } else {
                    // No local key and no backup. Generate new one.
                    console.log('🔐 E2E: No local key or backup found. Generating new pair.');
                    keyPair = await generateKeyPair();
                    await storeKeyPair(keyPair);
                    clearSharedKeyCache();
                }
            }

            // 3. Sync public key and create/update backup if we have password
            const publicKeyBase64 = await exportPublicKey(keyPair.publicKey);

            if (password) {
                // We have password - create/update backup
                console.log('🔐 E2E: Creating/updating backup with password...');
                try {
                    const backup = await backupPrivateKey(keyPair.privateKey, password);
                    const backupPayload = {
                        encryptedPrivateKey: backup.ciphertext,
                        iv: backup.iv,
                        salt: backup.salt
                    };

                    await axios.put(
                        `${SERVER_URL}/api/messages/public-key`,
                        { publicKey: publicKeyBase64, backup: backupPayload },
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    console.log('✅ E2E: Public key and backup synced to server');
                    currentUserBackupData = backupPayload;
                } catch (err) {
                    console.error('❌ E2E: Backup sync failed:', err);
                }
            } else if (!currentUserBackupData) {
                // No password and no backup - just sync public key
                try {
                    await axios.put(
                        `${SERVER_URL}/api/messages/public-key`,
                        { publicKey: publicKeyBase64 },
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    console.log('🔐 E2E: Public key synced to server (no backup)');
                } catch (err) {
                    console.error('❌ E2E: Public key sync failed:', err);
                }
            }

            set({
                myKeyPair: keyPair,
                isEncryptionReady: true,
                needsRecovery: false,
                backupData: currentUserBackupData
            });
            console.log('✅ E2E Encryption initialized');
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
    decryptMessageText: async (msg: Message, otherUserId: string, publicKey?: string) => {
        const { myKeyPair, isEncryptionReady, needsRecovery } = get();

        // If not encrypted, return plain text
        if (!msg.isEncrypted || !msg.iv) {
            return msg.text;
        }

        // If recovery is needed, inform user
        if (needsRecovery) {
            return '🔐 Recovery required';
        }

        // If encryption not ready, return placeholder
        if (!isEncryptionReady || !myKeyPair) {
            return '🔐 Loading...';
        }

        try {
            const theirPublicKey = publicKey || await get().fetchUserPublicKey(otherUserId);
            if (!theirPublicKey) {
                return '🔐 Key not available';
            }

            const sharedKey = await getOrDeriveSharedKey(
                myKeyPair.privateKey,
                theirPublicKey,
                otherUserId
            );

            const decrypted = await decryptMessage(sharedKey, msg.text, msg.iv);
            return decrypted;
        } catch (error: any) {
            console.error('Error decrypting message:', error);

            // OperationError usually means key mismatch - message was encrypted with different keys
            if (error.name === 'OperationError') {
                console.warn('🔐 Decryption failed: Key mismatch. Message may have been encrypted with old/different keys.');
                return '🔐 Cannot decrypt (key changed)';
            }

            return '🔐 Decryption failed';
        }
    },

    // Reset encryption keys (used when PIN is forgotten)
    resetEncryptionKeys: async () => {
        try {
            console.log('🔐 E2E: Resetting encryption keys...');

            // 1. Clear local keys from localStorage
            localStorage.removeItem('e2e_private_key');
            localStorage.removeItem('e2e_public_key');

            // 2. Clear shared key cache
            clearSharedKeyCache();

            // 3. Generate new key pair
            const newKeyPair = await generateKeyPair();
            await storeKeyPair(newKeyPair);

            // 4. Get new public key and sync to server
            const publicKeyBase64 = await exportPublicKey(newKeyPair.publicKey);
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');

            // Clear backup on server and set new public key
            await axios.put(
                `${SERVER_URL}/api/messages/public-key`,
                { publicKey: publicKeyBase64, backup: null },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // 5. Update state - user needs to setup new PIN
            set({
                myKeyPair: newKeyPair,
                isEncryptionReady: true,
                needsRecovery: false,
                backupData: null,
                userPublicKeys: new Map() // Clear cached public keys
            });

            console.log('✅ E2E: Keys reset successfully.');
        } catch (error) {
            console.error('❌ E2E: Failed to reset keys:', error);
            throw error;
        }
    }
}));

