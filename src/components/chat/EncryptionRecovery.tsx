import React, { useState, useRef, useEffect } from 'react';
import { useChatStore } from '@/hooks/store/useChatStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, ShieldAlert, Key, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function EncryptionRecovery() {
    const { needsRecovery, recoverKeys, setupRecovery, isEncryptionReady, backupData } = useChatStore();
    const [pin, setPin] = useState(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Focus first input on mount
    useEffect(() => {
        if ((needsRecovery || (isEncryptionReady && !backupData)) && inputRefs.current[0]) {
            // Small timeout to ensure modal animation doesn't interfere with focus
            setTimeout(() => inputRefs.current[0]?.focus(), 100);
        }
    }, [needsRecovery, isEncryptionReady, backupData]);

    const handleChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;

        const newPin = [...pin];
        // Take the last character if user types in a filled field
        newPin[index] = value.substring(value.length - 1);
        setPin(newPin);

        // Move to next input if value is entered
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !pin[index] && index > 0) {
            // Move to previous input on backspace if current is empty
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6).split('');

        if (pastedData.length > 0) {
            const newPin = [...pin];
            pastedData.forEach((char, index) => {
                if (index < 6) newPin[index] = char;
            });
            setPin(newPin);

            // Focus the input after the last pasted character
            const nextIndex = Math.min(pastedData.length, 5);
            inputRefs.current[nextIndex]?.focus();
        }
    };

    const getPinString = () => pin.join('');
    const isPinComplete = pin.every(digit => digit !== '');

    const handleRecover = async (e: React.FormEvent) => {
        e.preventDefault();
        const pinString = getPinString();
        if (pinString.length !== 6) return;

        setIsLoading(true);
        const success = await recoverKeys(pinString);
        setIsLoading(false);

        if (success) {
            toast.success("Messages recovered successfully!");
        } else {
            toast.error("Incorrect PIN. Please try again.");
            setPin(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        }
    };

    const handleSetup = async (e: React.FormEvent) => {
        e.preventDefault();
        const pinString = getPinString();
        if (pinString.length !== 6) return;

        setIsLoading(true);
        try {
            await setupRecovery(pinString);
            toast.success("Recovery PIN set! Your messages are now safe.");
        } catch (error) {
            toast.error("Failed to setup recovery.");
        } finally {
            setIsLoading(false);
        }
    };

    const renderPinInputs = () => (
        <div className="flex justify-center gap-2 sm:gap-3 my-2">
            {pin.map((digit, index) => (
                <Input
                    key={index}
                    ref={el => { inputRefs.current[index] = el }}
                    type="password"
                    inputMode="numeric"
                    className={cn(
                        "w-10 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-bold transition-all duration-200 rounded-xl shadow-sm",
                        "focus:scale-110 focus:z-10 focus:ring-4 focus:ring-primary/20 focus:border-primary",
                        digit
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background border-input hover:border-primary/50"
                    )}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    maxLength={1}
                    autoComplete="off"
                />
            ))}
        </div>
    );

    // 1. RECOVERY STATE (Highest Priority)
    if (needsRecovery) {
        return (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4">
                <Card className="max-w-md w-full shadow-premium border-primary/10 animate-in fade-in zoom-in-95 duration-200">
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 ring-4 ring-background shadow-lg">
                            <ShieldAlert className="text-primary w-8 h-8" />
                        </div>
                        <CardTitle className="text-2xl font-black tracking-tight">Recover Secure Chats</CardTitle>
                        <CardDescription className="text-base font-medium text-muted-foreground/80 mt-2">
                            Enter your 6-digit PIN to unlock your encrypted messages.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <form onSubmit={handleRecover} className="space-y-6">
                            {renderPinInputs()}

                            <p className="text-[11px] text-muted-foreground font-semibold text-center uppercase tracking-wider">
                                Secure E2E Encryption
                            </p>

                            <Button
                                className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-sm shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                type="submit"
                                disabled={isLoading || !isPinComplete}
                            >
                                {isLoading ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : <Key className="w-5 h-5 mr-2" />}
                                Unlock Messages
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // 2. SETUP STATE (Mandatory if encryption is on but no backup)
    if (isEncryptionReady && !backupData) {
        return (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4">
                <Card className="max-w-md w-full shadow-premium border-primary/10 animate-in fade-in zoom-in-95 duration-200">
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 ring-4 ring-background shadow-lg">
                            <Lock className="text-primary w-8 h-8" />
                        </div>
                        <CardTitle className="text-2xl font-black tracking-tight">Create Recovery PIN</CardTitle>
                        <CardDescription className="text-base font-medium text-muted-foreground/80 mt-2">
                            Create a <span className="text-primary font-bold">6-digit PIN</span> to secure your message backup.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <form onSubmit={handleSetup} className="space-y-6">
                            <div className="space-y-4">
                                <div>
                                    {renderPinInputs()}
                                    <div className="flex justify-center mt-2">
                                        <p className={cn("text-[10px] uppercase font-bold tracking-wider transition-colors",
                                            isPinComplete ? "text-green-500" : "text-primary/40"
                                        )}>
                                            {pin.filter(d => d).length}/6 Digits Entered
                                        </p>
                                    </div>
                                </div>

                                <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20 flex gap-3 items-start">
                                    <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                    <p className="text-xs text-amber-900/80 dark:text-amber-200/80 font-bold leading-relaxed">
                                        Memorize this PIN. It is the <span className="underline decoration-amber-500/50 underline-offset-2">only way</span> to restore your chats if you switch devices or clear history.
                                    </p>
                                </div>
                            </div>

                            <Button
                                className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-sm shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                type="submit"
                                disabled={isLoading || !isPinComplete}
                            >
                                {isLoading ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
                                Secure My Chats
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return null;
}
