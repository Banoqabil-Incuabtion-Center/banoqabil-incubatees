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
                setMessage(error.response?.data?.message || "Failed to verify email. Link may be expired.");
                toast.error("Verification failed");
            }
        };

        verify();
    }, [token]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/20 p-4">
            <Card className="w-full max-w-md shadow-premium rounded-[2rem] border-primary/5">
                <CardHeader className="text-center pb-2">
                    <CardTitle className="text-2xl font-black tracking-tight flex flex-col items-center gap-4">
                        {status === 'loading' && (
                            <div className="p-4 rounded-full bg-primary/10 animate-pulse">
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
                <CardContent className="text-center space-y-6 pt-4">
                    <p className="text-muted-foreground font-medium">
                        {message}
                    </p>

                    <div className="pt-2">
                        {status === 'loading' && (
                            <Button disabled className="w-full rounded-xl h-11">
                                Verifying...
                            </Button>
                        )}
                        {status === 'success' && (
                            <Button asChild className="w-full rounded-xl h-11 font-bold shadow-soft">
                                <Link to="/login">Proceed to Login</Link>
                            </Button>
                        )}
                        {status === 'error' && (
                            <Button asChild variant="secondary" className="w-full rounded-xl h-11 font-bold">
                                <Link to="/login">Back to Login</Link>
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default VerifyEmail;
