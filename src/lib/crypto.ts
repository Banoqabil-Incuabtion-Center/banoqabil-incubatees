/**
 * E2E Encryption Utility using ECDH Key Exchange + AES-GCM
 * 
 * Flow:
 * 1. Generate ECDH key pair on first use
 * 2. Store private key in localStorage (JWK format)
 * 3. Upload public key to server
 * 4. When chatting, derive shared secret using ECDH
 * 5. Use shared secret to encrypt/decrypt messages with AES-GCM
 */

const ALGORITHM = {
    name: 'ECDH',
    namedCurve: 'P-256'
};

const AES_ALGORITHM = {
    name: 'AES-GCM',
    length: 256
};

const PRIVATE_KEY_STORAGE_KEY = 'e2e_private_key';
const PUBLIC_KEY_STORAGE_KEY = 'e2e_public_key';

// Convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    bytes.forEach(b => binary += String.fromCharCode(b));
    return btoa(binary);
}

// Convert Base64 to ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

// Generate ECDH key pair
export async function generateKeyPair(): Promise<CryptoKeyPair> {
    return await crypto.subtle.generateKey(
        ALGORITHM,
        true, // extractable
        ['deriveKey', 'deriveBits']
    );
}

// Export public key to Base64 (for sending to server)
export async function exportPublicKey(key: CryptoKey): Promise<string> {
    const exported = await crypto.subtle.exportKey('raw', key);
    return arrayBufferToBase64(exported);
}

// Import public key from Base64 (received from server)
export async function importPublicKey(base64: string): Promise<CryptoKey> {
    const keyData = base64ToArrayBuffer(base64);
    return await crypto.subtle.importKey(
        'raw',
        keyData,
        ALGORITHM,
        true,
        []
    );
}

// Export private key to JWK (for localStorage storage)
async function exportPrivateKey(key: CryptoKey): Promise<JsonWebKey> {
    return await crypto.subtle.exportKey('jwk', key);
}

// Import private key from JWK (from localStorage)
async function importPrivateKey(jwk: JsonWebKey): Promise<CryptoKey> {
    return await crypto.subtle.importKey(
        'jwk',
        jwk,
        ALGORITHM,
        true,
        ['deriveKey', 'deriveBits']
    );
}

// Derive shared AES key using ECDH
export async function deriveSharedKey(privateKey: CryptoKey, publicKey: CryptoKey): Promise<CryptoKey> {
    return await crypto.subtle.deriveKey(
        {
            name: 'ECDH',
            public: publicKey
        },
        privateKey,
        AES_ALGORITHM,
        false,
        ['encrypt', 'decrypt']
    );
}

/**
 * BACKUP & RECOVERY LOGIC
 * We use PBKDF2 to derive a symmetric key from a user password, 
 * which is then used to encrypt the private key before uploading to server.
 */

// Derive a backup key from a password
async function deriveBackupKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const baseKey = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        'PBKDF2',
        false,
        ['deriveKey']
    );

    return await crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt as any,
            iterations: 100000,
            hash: 'SHA-256'
        },
        baseKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
}

// Encrypt private key for backup
export async function backupPrivateKey(privateKey: CryptoKey, password: string): Promise<{ ciphertext: string; iv: string; salt: string }> {
    const jwk = await exportPrivateKey(privateKey);
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(jwk));

    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const backupKey = await deriveBackupKey(password, salt);

    const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        backupKey,
        data
    );

    return {
        ciphertext: arrayBufferToBase64(encrypted),
        iv: arrayBufferToBase64(iv.buffer),
        salt: arrayBufferToBase64(salt.buffer)
    };
}

// Decrypt and restore private key from backup
export async function restorePrivateKey(
    ciphertext: string,
    password: string,
    ivBase64: string,
    saltBase64: string
): Promise<CryptoKey> {
    const encryptedData = base64ToArrayBuffer(ciphertext);
    const iv = new Uint8Array(base64ToArrayBuffer(ivBase64));
    const salt = new Uint8Array(base64ToArrayBuffer(saltBase64));

    const backupKey = await deriveBackupKey(password, salt);

    const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        backupKey,
        encryptedData
    );

    const decoder = new TextDecoder();
    const jwk = JSON.parse(decoder.decode(decrypted));
    return await importPrivateKey(jwk);
}

// Encrypt message using AES-GCM
export async function encryptMessage(sharedKey: CryptoKey, plaintext: string): Promise<{ ciphertext: string; iv: string }> {
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);

    // Generate random 12-byte IV
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encrypted = await crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv: iv
        },
        sharedKey,
        data
    );

    return {
        ciphertext: arrayBufferToBase64(encrypted),
        iv: arrayBufferToBase64(iv.buffer)
    };
}

// Decrypt message using AES-GCM
export async function decryptMessage(sharedKey: CryptoKey, ciphertext: string, iv: string): Promise<string> {
    const encryptedData = base64ToArrayBuffer(ciphertext);
    const ivData = base64ToArrayBuffer(iv);

    const decrypted = await crypto.subtle.decrypt(
        {
            name: 'AES-GCM',
            iv: ivData
        },
        sharedKey,
        encryptedData
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
}

// Store key pair in localStorage
export async function storeKeyPair(keyPair: CryptoKeyPair): Promise<void> {
    const privateJwk = await exportPrivateKey(keyPair.privateKey);
    const publicBase64 = await exportPublicKey(keyPair.publicKey);

    localStorage.setItem(PRIVATE_KEY_STORAGE_KEY, JSON.stringify(privateJwk));
    localStorage.setItem(PUBLIC_KEY_STORAGE_KEY, publicBase64);
}

// Get stored key pair from localStorage
export async function getStoredKeyPair(): Promise<CryptoKeyPair | null> {
    const privateJwkStr = localStorage.getItem(PRIVATE_KEY_STORAGE_KEY);
    const publicBase64 = localStorage.getItem(PUBLIC_KEY_STORAGE_KEY);

    if (!privateJwkStr || !publicBase64) {
        return null;
    }

    try {
        const privateJwk = JSON.parse(privateJwkStr);
        const privateKey = await importPrivateKey(privateJwk);
        const publicKey = await importPublicKey(publicBase64);

        return { privateKey, publicKey };
    } catch (error) {
        console.error('Error loading stored key pair:', error);
        return null;
    }
}

// Get stored public key (for quick check)
export function getStoredPublicKey(): string | null {
    return localStorage.getItem(PUBLIC_KEY_STORAGE_KEY);
}

// Initialize encryption: load or generate key pair
export async function initializeEncryption(): Promise<{ keyPair: CryptoKeyPair; publicKeyBase64: string; isNew: boolean }> {
    let keyPair = await getStoredKeyPair();
    let isNew = false;

    if (!keyPair) {
        // Generate new key pair
        keyPair = await generateKeyPair();
        await storeKeyPair(keyPair);
        isNew = true;
    }

    const publicKeyBase64 = await exportPublicKey(keyPair.publicKey);

    return { keyPair, publicKeyBase64, isNew };
}

// Cache for derived shared keys (userId -> sharedKey)
const sharedKeyCache = new Map<string, CryptoKey>();

// Get or derive shared key for a user
export async function getOrDeriveSharedKey(
    privateKey: CryptoKey,
    theirPublicKeyBase64: string,
    userId: string
): Promise<CryptoKey> {
    // Check cache first - use both userId and public key to avoid stale keys
    const cacheKey = `${userId}:${theirPublicKeyBase64}`;
    if (sharedKeyCache.has(cacheKey)) {
        return sharedKeyCache.get(cacheKey)!;
    }

    // Derive new shared key
    const theirPublicKey = await importPublicKey(theirPublicKeyBase64);
    const sharedKey = await deriveSharedKey(privateKey, theirPublicKey);

    // Cache it
    sharedKeyCache.set(cacheKey, sharedKey);

    return sharedKey;
}

// Clear shared key cache (e.g., on logout)
export function clearSharedKeyCache(): void {
    sharedKeyCache.clear();
}
