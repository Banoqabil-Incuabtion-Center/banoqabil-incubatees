import React, { useState } from 'react';
import { useChatStore } from '@/hooks/store/useChatStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, ShieldAlert, Key, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export function EncryptionRecovery() {
    const { needsRecovery, recoverKeys, setupRecovery, isEncryptionReady, backupData } = useChatStore();
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showSetup, setShowSetup] = useState(false);

    // If it's a new setup (no backup and no local keys) we should prompt for setup
    // But initEncryption handled that by generating keys. 
    // We should check if they want to backup those keys.

    const handleRecover = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password.trim()) return;

        setIsLoading(true);
        const success = await recoverKeys(password);
        setIsLoading(false);

        if (success) {
            toast.success("Messages recovered successfully!");
        } else {
            toast.error("Incorrect password. Please try again.");
        }
    };

    const handleSetup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password.trim()) return;

        setIsLoading(true);
        try {
            await setupRecovery(password);
            toast.success("Recovery password set! Your messages are now safe.");
            setShowSetup(false);
        } catch (error) {
            toast.error("Failed to setup recovery.");
        } finally {
            setIsLoading(false);
        }
    };

    if (needsRecovery) {
        return (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
                <Card className="max-w-md w-full shadow-premium border-primary/10">
                    <CardHeader className="text-center">
                        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                            <ShieldAlert className="text-primary w-6 h-6" />
                        </div>
                        <CardTitle className="text-xl font-black tracking-tight">Recover Secure Chats</CardTitle>
                        <CardDescription className="text-sm font-medium">
                            Your browser storage was cleared. Enter your recovery password to restore your encrypted messages.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleRecover} className="space-y-4">
                            <div className="space-y-2">
                                <Input
                                    type="password"
                                    placeholder="Enter recovery password"
                                    className="h-12 rounded-xl"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoFocus
                                />
                                <p className="text-[10px] text-muted-foreground font-medium text-center">
                                    This is the password you set during your first secure chat setup.
                                </p>
                            </div>
                            <Button
                                className="w-full h-12 rounded-xl font-black uppercase tracking-widest"
                                type="submit"
                                disabled={isLoading || !password}
                            >
                                {isLoading ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : <Key className="w-4 h-4 mr-2" />}
                                Recover Messages
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // If encryption is ready but no backup exists on server, prompt for setup
    if (isEncryptionReady && !backupData && !showSetup) {
        return (
            <div className="absolute top-4 left-4 right-4 z-40">
                <div className="bg-primary/95 backdrop-blur shadow-premium-hover rounded-2xl p-4 flex items-center justify-between gap-4 text-primary-foreground border-white/10 border">
                    <div className="flex items-center gap-3">
                        <Lock className="w-5 h-5 opacity-70" />
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest">Secure Your Chats</p>
                            <p className="text-[11px] font-medium opacity-80">Set a recovery password to avoid losing your messages if you clear your browser data.</p>
                        </div>
                    </div>
                    <Button
                        size="sm"
                        variant="secondary"
                        className="rounded-xl font-black text-[10px] h-9 px-4 uppercase tracking-widest shadow-sm hover:translate-y-[-1px] transition-transform"
                        onClick={() => setShowSetup(true)}
                    >
                        Setup Now
                    </Button>
                </div>
            </div>
        );
    }

    if (showSetup) {
        return (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
                <Card className="max-w-md w-full shadow-premium border-primary/10">
                    <CardHeader className="text-center">
                        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                            <Lock className="text-primary w-6 h-6" />
                        </div>
                        <CardTitle className="text-xl font-black tracking-tight">Set Recovery Password</CardTitle>
                        <CardDescription className="text-sm font-medium">
                            Create a password to backup your encryption keys. You will need this only if you clear your browser storage.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSetup} className="space-y-4">
                            <div className="space-y-2">
                                <Input
                                    type="password"
                                    placeholder="Enter a strong recovery password"
                                    className="h-12 rounded-xl"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoFocus
                                />
                                <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 flex gap-2 items-start">
                                    <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                    <p className="text-[10px] text-amber-700 font-bold leading-relaxed">
                                        IMPORTANT: We cannot reset this password. If you lose it, your backup will be unrecoverable.
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    className="flex-1 h-12 rounded-xl font-black uppercase tracking-widest"
                                    type="submit"
                                    disabled={isLoading || !password}
                                >
                                    {isLoading ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                                    Enable Backup
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="h-12 rounded-xl font-bold text-xs uppercase"
                                    onClick={() => setShowSetup(false)}
                                    disabled={isLoading}
                                >
                                    Later
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return null;
}
