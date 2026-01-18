import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

// Constants
// Use the same backend URL logic as the rest of the app
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const VerifyEmail = () => {
    const { token } = useParams();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState("Verifying your email...");
    const [email, setEmail] = useState(""); // For resending
    const [isResending, setIsResending] = useState(false);

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage("Invalid verification link.");
            return;
        }

        const verify = async () => {
            try {
                const response = await axios.get(`${API_URL}/api/user/verify-email/${token}`);
                setStatus('success');
                setMessage(response.data.message || "Email verified successfully!");
                toast.success("Email verified!");
            } catch (error: any) {
                setStatus('error');
                const errMsg = error.response?.data?.message || "Failed to verify email. Link may be expired.";
                setMessage(errMsg);
                toast.error("Verification failed");

                // If we can extract email from error or if we had it, we could use it
                // For now, we might need a prompt or just use the login page logic
            }
        };

        verify();
    }, [token]);

    const handleResend = async () => {
        // Since we don't have the email here easily (only the expired token), 
        // we should ideally ask for it or redirect back to login where they can enter it.
        // But for a better UX, if verification fails, we can show an input.
        const inputEmail = prompt("Please enter your email to receive a new verification link:");
        if (!inputEmail) return;

        setIsResending(true);
        try {
            await axios.post(`${API_URL}/api/user/resend-verification`, { email: inputEmail });
            toast.success("New verification link sent!");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to resend");
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/20 p-4">
            <Card className="w-full max-w-md shadow-premium rounded-[2.5rem] border-primary/5 overflow-hidden">
                <div className="h-1.5 bg-primary w-full" />
                <CardHeader className="text-center pb-2 pt-8">
                    <CardTitle className="text-2xl font-black tracking-tight flex flex-col items-center gap-4">
                        {status === 'loading' && (
                            <div className="p-4 rounded-full bg-primary/10">
                                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                            </div>
                        )}
                        {status === 'success' && (
                            <div className="p-4 rounded-full bg-green-500/10">
                                <CheckCircle2 className="w-10 h-10 text-green-500" />
                            </div>
                        )}
                        {status === 'error' && (
                            <div className="p-4 rounded-full bg-red-500/10">
                                <XCircle className="w-10 h-10 text-red-500" />
                            </div>
                        )}
                        Email Verification
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-6 pt-4 pb-10 px-8">
                    <p className="text-muted-foreground font-medium text-sm leading-relaxed px-4">
                        {message}
                    </p>

                    <div className="pt-2 space-y-3">
                        {status === 'loading' && (
                            <Button disabled className="w-full rounded-2xl h-12 font-black uppercase text-xs tracking-widest">
                                Verifying...
                            </Button>
                        )}
                        {status === 'success' && (
                            <Button asChild className="w-full rounded-2xl h-12 font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20">
                                <Link to="/login">Proceed to Login</Link>
                            </Button>
                        )}
                        {status === 'error' && (
                            <>
                                <Button
                                    variant="outline"
                                    className="w-full rounded-2xl h-12 font-black uppercase text-xs tracking-widest border-primary/20"
                                    onClick={handleResend}
                                    disabled={isResending}
                                >
                                    {isResending ? "Sending..." : "Request New Link"}
                                </Button>
                                <Button asChild variant="ghost" className="w-full rounded-2xl h-12 font-black uppercase text-xs tracking-widest text-muted-foreground">
                                    <Link to="/login">Back to Login</Link>
                                </Button>
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default VerifyEmail;
