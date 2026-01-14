import React, { useState } from 'react';
import { useChatStore } from '@/hooks/store/useChatStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, ShieldAlert, Key, Loader2, AlertTriangle, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { restorePrivateKey, importPublicKey, storeKeyPair, clearSharedKeyCache } from '@/lib/crypto';
import axios from 'axios';
import { SOCKET_URL as SERVER_URL } from '@/lib/constant';

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

export function EncryptionRecovery() {
    const { needsRecovery, backupData, resetEncryptionKeys } = useChatStore();
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showResetDialog, setShowResetDialog] = useState(false);
    const [isResetting, setIsResetting] = useState(false);

    const handleRecover = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password.trim() || !backupData) return;

        setIsLoading(true);
        try {
            const { encryptedPrivateKey, iv, salt } = backupData;
            const privateKey = await restorePrivateKey(encryptedPrivateKey, password, iv, salt);

            // Fetch public key from server
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const decodedToken = decodeJWTPayload(token!);
            if (!decodedToken) throw new Error('Failed to decode token');
            const myUserId = decodedToken.userId || decodedToken.id;

            const response = await axios.get(`${SERVER_URL}/api/messages/public-key/${myUserId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const publicKeyBase64 = response.data.publicKey;
            if (!publicKeyBase64) throw new Error('Public key not found on server');

            const publicKey = await importPublicKey(publicKeyBase64);
            const keyPair = { privateKey, publicKey };

            await storeKeyPair(keyPair);
            clearSharedKeyCache();

            // Update store state
            useChatStore.setState({
                myKeyPair: keyPair,
                isEncryptionReady: true,
                needsRecovery: false
            });

            toast.success("Messages recovered successfully!");
        } catch (error) {
            console.error('Recovery failed:', error);
            toast.error("Incorrect password. Please try again.");
            setPassword('');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetKeys = async () => {
        setIsResetting(true);
        try {
            await resetEncryptionKeys();
            setShowResetDialog(false);
            toast.success("Keys reset successfully.");
        } catch (error) {
            toast.error("Failed to reset keys. Please try again.");
        } finally {
            setIsResetting(false);
        }
    };

    // Reset Keys Dialog
    const ResetDialog = () => (
        <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
            <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                    <div className="mx-auto w-14 h-14 bg-destructive/10 rounded-full flex items-center justify-center mb-2">
                        <AlertTriangle className="w-7 h-7 text-destructive" />
                    </div>
                    <AlertDialogTitle className="text-center text-xl font-black">Reset Encryption Keys?</AlertDialogTitle>
                    <AlertDialogDescription className="text-center space-y-3">
                        <p className="font-semibold text-destructive">⚠️ This action cannot be undone!</p>
                        <ul className="text-sm text-left space-y-2 bg-muted/50 p-4 rounded-xl">
                            <li className="flex gap-2">
                                <span>❌</span>
                                <span>All <strong>existing encrypted messages</strong> will become permanently unreadable</span>
                            </li>
                            <li className="flex gap-2">
                                <span>🔑</span>
                                <span>New encryption keys will be generated</span>
                            </li>
                            <li className="flex gap-2">
                                <span>✅</span>
                                <span>New messages will be encrypted normally</span>
                            </li>
                        </ul>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-2 sm:gap-0">
                    <AlertDialogCancel disabled={isResetting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleResetKeys}
                        disabled={isResetting}
                        className="bg-destructive hover:bg-destructive/90"
                    >
                        {isResetting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                        Reset Keys
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );

    // RECOVERY STATE - Show password prompt
    if (needsRecovery) {
        return (
            <>
                <ResetDialog />
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4">
                    <Card className="max-w-md w-full shadow-premium border-primary/10 animate-in fade-in zoom-in-95 duration-200">
                        <CardHeader className="text-center pb-2">
                            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 ring-4 ring-background shadow-lg">
                                <ShieldAlert className="text-primary w-8 h-8" />
                            </div>
                            <CardTitle className="text-2xl font-black tracking-tight">Recover Secure Chats</CardTitle>
                            <CardDescription className="text-base font-medium text-muted-foreground/80 mt-2">
                                Enter your <span className="text-primary font-bold">account password</span> to unlock your encrypted messages.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <form onSubmit={handleRecover} className="space-y-6">
                                <div className="relative">
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="h-14 rounded-2xl pr-12 text-center text-lg font-medium"
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>

                                <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20 flex gap-3 items-start">
                                    <Lock className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                                    <p className="text-xs text-blue-900/80 dark:text-blue-200/80 font-bold leading-relaxed">
                                        Your encryption keys are protected by your account password. This is the same password you use to login.
                                    </p>
                                </div>

                                <Button
                                    className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-sm shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                    type="submit"
                                    disabled={isLoading || !password.trim()}
                                >
                                    {isLoading ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : <Key className="w-5 h-5 mr-2" />}
                                    Unlock Messages
                                </Button>

                                {/* Forgot Password / Reset Option */}
                                <div className="text-center pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowResetDialog(true)}
                                        className="text-xs font-bold text-muted-foreground hover:text-destructive transition-colors underline-offset-2 hover:underline"
                                    >
                                        Can't remember? Reset keys
                                    </button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </>
        );
    }

    return null;
}
