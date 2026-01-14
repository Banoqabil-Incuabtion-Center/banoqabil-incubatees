import React, { useState, useRef, useEffect } from 'react';
import { useChatStore } from '@/hooks/store/useChatStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, ShieldAlert, Key, Loader2, CheckCircle2, AlertTriangle, RefreshCw, Settings } from 'lucide-react';
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

export function EncryptionRecovery() {
    const { needsRecovery, recoverKeys, setupRecovery, isEncryptionReady, backupData, resetEncryptionKeys } = useChatStore();
    const [pin, setPin] = useState(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [showResetDialog, setShowResetDialog] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Focus first input on mount
    useEffect(() => {
        if ((needsRecovery || (isEncryptionReady && !backupData)) && inputRefs.current[0]) {
            setTimeout(() => inputRefs.current[0]?.focus(), 100);
        }
    }, [needsRecovery, isEncryptionReady, backupData]);

    const handleChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;

        const newPin = [...pin];
        newPin[index] = value.substring(value.length - 1);
        setPin(newPin);

        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !pin[index] && index > 0) {
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

    const handleResetKeys = async () => {
        setIsResetting(true);
        try {
            await resetEncryptionKeys();
            setShowResetDialog(false);
            toast.success("Keys reset. Please create a new PIN.");
        } catch (error) {
            toast.error("Failed to reset keys. Please try again.");
        } finally {
            setIsResetting(false);
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
                                <span>📱</span>
                                <span>You will need to create a <strong>new PIN</strong></span>
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

    // 1. RECOVERY STATE (Highest Priority)
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

                                {/* Forgot PIN Option */}
                                <div className="text-center pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowResetDialog(true)}
                                        className="text-xs font-bold text-muted-foreground hover:text-destructive transition-colors underline-offset-2 hover:underline"
                                    >
                                        Forgot PIN? Reset keys
                                    </button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </>
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

// Exportable Settings Component for changing PIN
export function EncryptionSettings() {
    const { changePIN, backupData, isEncryptionReady } = useChatStore();
    const [oldPin, setOldPin] = useState(['', '', '', '', '', '']);
    const [newPin, setNewPin] = useState(['', '', '', '', '', '']);
    const [confirmPin, setConfirmPin] = useState(['', '', '', '', '', '']);
    const [step, setStep] = useState<'old' | 'new' | 'confirm'>('old');
    const [isLoading, setIsLoading] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const hasBackup = isEncryptionReady && !!backupData;

    const handleChange = (
        index: number,
        value: string,
        pinState: string[],
        setPinState: React.Dispatch<React.SetStateAction<string[]>>
    ) => {
        if (!/^\d*$/.test(value)) return;

        const newPinState = [...pinState];
        newPinState[index] = value.substring(value.length - 1);
        setPinState(newPinState);

        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto advance to next step when complete
        if (value && index === 5) {
            const fullPin = [...newPinState];
            fullPin[index] = value.substring(value.length - 1);
            if (fullPin.every(d => d !== '')) {
                // Small delay for UX
                setTimeout(() => {
                    if (step === 'old') setStep('new');
                    else if (step === 'new') setStep('confirm');
                }, 200);
            }
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && index > 0) {
            const currentPinState = step === 'old' ? oldPin : step === 'new' ? newPin : confirmPin;
            if (!currentPinState[index]) {
                inputRefs.current[index - 1]?.focus();
            }
        }
    };

    const renderPinInputsFor = (
        pinState: string[],
        setPinState: React.Dispatch<React.SetStateAction<string[]>>
    ) => (
        <div className="flex justify-center gap-2 my-2">
            {pinState.map((digit, index) => (
                <Input
                    key={index}
                    ref={el => { inputRefs.current[index] = el }}
                    type="password"
                    inputMode="numeric"
                    className={cn(
                        "w-10 h-12 text-center text-lg font-bold transition-all duration-200 rounded-xl shadow-sm",
                        "focus:scale-105 focus:z-10 focus:ring-4 focus:ring-primary/20 focus:border-primary",
                        digit
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background border-input hover:border-primary/50"
                    )}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value, pinState, setPinState)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    maxLength={1}
                    autoComplete="off"
                />
            ))}
        </div>
    );

    const handleSubmit = async () => {
        const oldPinStr = oldPin.join('');
        const newPinStr = newPin.join('');
        const confirmPinStr = confirmPin.join('');

        if (newPinStr !== confirmPinStr) {
            toast.error("New PINs don't match. Please try again.");
            setConfirmPin(['', '', '', '', '', '']);
            setStep('confirm');
            return;
        }

        setIsLoading(true);
        const success = await changePIN(oldPinStr, newPinStr);
        setIsLoading(false);

        if (success) {
            toast.success("PIN changed successfully!");
            setOldPin(['', '', '', '', '', '']);
            setNewPin(['', '', '', '', '', '']);
            setConfirmPin(['', '', '', '', '', '']);
            setStep('old');
        } else {
            toast.error("Incorrect current PIN. Please try again.");
            setOldPin(['', '', '', '', '', '']);
            setStep('old');
        }
    };

    useEffect(() => {
        if (inputRefs.current[0]) {
            inputRefs.current[0]?.focus();
        }
    }, [step]);

    if (!hasBackup) {
        return (
            <Card className="border-primary/10">
                <CardContent className="pt-6 text-center">
                    <div className="w-12 h-12 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
                        <Lock className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground font-medium">
                        No recovery PIN is set. Start a chat to set up encryption.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-primary/10">
            <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                        <Settings className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-lg font-bold">Change Recovery PIN</CardTitle>
                        <CardDescription className="text-xs">Update your encryption recovery PIN</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {step === 'old' && (
                    <div className="space-y-3">
                        <p className="text-sm font-semibold text-center">Enter Current PIN</p>
                        {renderPinInputsFor(oldPin, setOldPin)}
                    </div>
                )}

                {step === 'new' && (
                    <div className="space-y-3">
                        <p className="text-sm font-semibold text-center">Enter New PIN</p>
                        {renderPinInputsFor(newPin, setNewPin)}
                        <button
                            type="button"
                            onClick={() => setStep('old')}
                            className="text-xs text-muted-foreground hover:text-primary block mx-auto"
                        >
                            ← Back
                        </button>
                    </div>
                )}

                {step === 'confirm' && (
                    <div className="space-y-3">
                        <p className="text-sm font-semibold text-center">Confirm New PIN</p>
                        {renderPinInputsFor(confirmPin, setConfirmPin)}
                        <button
                            type="button"
                            onClick={() => setStep('new')}
                            className="text-xs text-muted-foreground hover:text-primary block mx-auto"
                        >
                            ← Back
                        </button>
                    </div>
                )}

                {step === 'confirm' && confirmPin.every(d => d !== '') && (
                    <Button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="w-full h-12 rounded-xl font-bold"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                        Change PIN
                    </Button>
                )}

                <div className="flex justify-center gap-1.5 pt-2">
                    {['old', 'new', 'confirm'].map((s, i) => (
                        <div
                            key={s}
                            className={cn(
                                "w-2 h-2 rounded-full transition-colors",
                                step === s ? "bg-primary" : "bg-muted"
                            )}
                        />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

