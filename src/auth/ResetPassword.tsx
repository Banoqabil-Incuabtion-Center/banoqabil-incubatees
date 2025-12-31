// auth/ResetPassword.tsx
import React, { useState } from "react"
import { toast } from "sonner"
import { CiUnread, CiRead } from "react-icons/ci"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Link, useParams, useNavigate } from "react-router-dom"
import authBg from "@/assets/auth-bg.png"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { cn } from "@/lib/utils"
import { Lock, ArrowLeft, CheckCircle2, Loader2, XCircle } from "lucide-react"
import axios from "axios"
import { SOCKET_URL as SERVER_URL } from "@/lib/constant"

const resetPasswordSchema = z.object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
})

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>

const ResetPassword: React.FC = () => {
    const { token } = useParams<{ token: string }>()
    const navigate = useNavigate()
    const [isLoading, setIsLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [isError, setIsError] = useState(false)
    const [errorMessage, setErrorMessage] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ResetPasswordFormValues>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: {
            password: "",
            confirmPassword: "",
        },
    })

    const onSubmit = async (data: ResetPasswordFormValues) => {
        setIsLoading(true)
        setIsError(false)

        try {
            await axios.post(`${SERVER_URL}/api/user/reset-password/${token}`, {
                password: data.password,
                confirmPassword: data.confirmPassword,
            })

            setIsSuccess(true)
            toast.success("Password reset successfully!")

            // Redirect to login after 3 seconds
            setTimeout(() => {
                navigate("/login")
            }, 3000)
        } catch (error: any) {
            const message = error.response?.data?.message || "Something went wrong"
            setErrorMessage(message)
            setIsError(true)
            toast.error(message)
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
                    <h1 className="text-5xl font-black tracking-tighter mb-4 leading-none">New Password</h1>
                    <p className="text-xl opacity-80 font-medium tracking-tight">Create a strong password to secure your account.</p>
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

                    {isSuccess ? (
                        <div className="space-y-6 text-center">
                            <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="w-10 h-10 text-primary" />
                            </div>
                            <div className="space-y-2">
                                <h1 className="text-3xl font-black tracking-tight">Password Reset!</h1>
                                <p className="text-sm text-muted-foreground font-medium tracking-tight">
                                    Your password has been successfully reset. Redirecting to login...
                                </p>
                            </div>
                            <Link to="/login">
                                <Button
                                    className="w-full h-12 rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-primary/20"
                                >
                                    Go to Login
                                </Button>
                            </Link>
                        </div>
                    ) : isError ? (
                        <div className="space-y-6 text-center">
                            <div className="w-20 h-20 mx-auto bg-red-500/10 rounded-full flex items-center justify-center">
                                <XCircle className="w-10 h-10 text-red-500" />
                            </div>
                            <div className="space-y-2">
                                <h1 className="text-3xl font-black tracking-tight">Reset Failed</h1>
                                <p className="text-sm text-muted-foreground font-medium tracking-tight">
                                    {errorMessage}
                                </p>
                            </div>
                            <Link to="/forgot-password">
                                <Button
                                    className="w-full h-12 rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-primary/20"
                                >
                                    Request New Link
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-2">
                                <h1 className="text-3xl font-black tracking-tight">Set New Password</h1>
                                <p className="text-sm text-muted-foreground font-medium tracking-tight">
                                    Create a strong password with at least 6 characters.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                                        New Password
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            className={cn(
                                                "h-12 rounded-xl border-muted/50 bg-muted/5 px-4 pl-12 pr-12 focus-visible:ring-primary/20",
                                                errors.password ? "border-red-500" : ""
                                            )}
                                            autoComplete="new-password"
                                            {...register("password")}
                                        />
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50" />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 cursor-pointer hover:text-primary transition-colors select-none"
                                        >
                                            {showPassword ? <CiUnread size={22} /> : <CiRead size={22} />}
                                        </button>
                                    </div>
                                    {errors.password && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.password.message}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                                        Confirm Password
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="confirmPassword"
                                            type={showConfirmPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            className={cn(
                                                "h-12 rounded-xl border-muted/50 bg-muted/5 px-4 pl-12 pr-12 focus-visible:ring-primary/20",
                                                errors.confirmPassword ? "border-red-500" : ""
                                            )}
                                            autoComplete="new-password"
                                            {...register("confirmPassword")}
                                        />
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50" />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 cursor-pointer hover:text-primary transition-colors select-none"
                                        >
                                            {showConfirmPassword ? <CiUnread size={22} /> : <CiRead size={22} />}
                                        </button>
                                    </div>
                                    {errors.confirmPassword && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.confirmPassword.message}</p>}
                                </div>

                                <Button
                                    className="w-full h-12 rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-95"
                                    type="submit"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Resetting...
                                        </>
                                    ) : (
                                        "Reset Password"
                                    )}
                                </Button>
                            </form>
                        </>
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

export default ResetPassword
