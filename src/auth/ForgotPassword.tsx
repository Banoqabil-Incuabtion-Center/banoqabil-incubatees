// auth/ForgotPassword.tsx
import React, { useState } from "react"
import { toast } from "sonner"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Link } from "react-router-dom"
import authBg from "@/assets/auth-bg.png"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { cn } from "@/lib/utils"
import { Mail, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react"
import axios from "axios"
import { SOCKET_URL as SERVER_URL } from "@/lib/constant"

const forgotPasswordSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
})

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

const ForgotPassword: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ForgotPasswordFormValues>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: {
            email: "",
        },
    })

    const onSubmit = async (data: ForgotPasswordFormValues) => {
        setIsLoading(true)

        try {
            await axios.post(`${SERVER_URL}/api/user/forgot-password`, {
                email: data.email,
            })

            setIsSuccess(true)
            toast.success("Password reset email sent!")
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || "Something went wrong"
            toast.error(errorMessage)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="w-full h-screen lg:grid lg:grid-cols-2 bg-background">
            {/* Left Side - Image */}
            <div className="hidden lg:block h-full relative overflow-hidden">
                <img
                    src={authBg}
                    alt="Authentication Background"
                    className="absolute inset-0 h-full w-full object-cover scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-black/20 to-black/10" />
                <div className="absolute bottom-16 left-16 text-white z-10 max-w-md animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    <div className="w-16 h-1 w-primary bg-white mb-6 rounded-full" />
                    <h1 className="text-5xl font-black tracking-tighter mb-4 leading-none">Reset Password</h1>
                    <p className="text-xl opacity-80 font-medium tracking-tight">Enter your email and we'll send you a link to reset your password.</p>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex items-center justify-center h-full p-8 lg:p-16">
                <div className="w-full max-w-sm space-y-8 animate-in fade-in slide-in-from-right-8 duration-1000">

                    {/* Back to Login */}
                    <Link to="/login" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Back to Login</span>
                    </Link>

                    {!isSuccess ? (
                        <>
                            <div className="space-y-2">
                                <h1 className="text-3xl font-black tracking-tight">Forgot Password?</h1>
                                <p className="text-sm text-muted-foreground font-medium tracking-tight">
                                    No worries! Enter your email and we'll send you reset instructions.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                                        Email Address
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="m@example.com"
                                            className={cn(
                                                "h-12 rounded-xl border-muted/50 bg-muted/5 px-4 pl-12 focus-visible:ring-primary/20",
                                                errors.email ? "border-red-500" : ""
                                            )}
                                            autoComplete="email"
                                            {...register("email")}
                                        />
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50" />
                                    </div>
                                    {errors.email && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.email.message}</p>}
                                </div>

                                <Button
                                    className="w-full h-12 rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-95"
                                    type="submit"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        "Send Reset Link"
                                    )}
                                </Button>
                            </form>
                        </>
                    ) : (
                        <div className="space-y-6 text-center">
                            <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="w-10 h-10 text-primary" />
                            </div>
                            <div className="space-y-2">
                                <h1 className="text-3xl font-black tracking-tight">Check Your Email</h1>
                                <p className="text-sm text-muted-foreground font-medium tracking-tight">
                                    We've sent a password reset link to your email. Please check your inbox and spam folder.
                                </p>
                            </div>
                            <p className="text-xs text-muted-foreground/60">
                                Link expires in 30 minutes
                            </p>
                            <Button
                                variant="outline"
                                className="w-full h-12 rounded-xl font-black text-xs uppercase tracking-[0.2em]"
                                onClick={() => setIsSuccess(false)}
                            >
                                Try Another Email
                            </Button>
                        </div>
                    )}

                    <div className="pt-4 text-center">
                        <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                            Remember your password?{" "}
                            <Link to="/login" className="text-primary hover:opacity-80 transition-opacity ml-1">
                                Sign In
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ForgotPassword
