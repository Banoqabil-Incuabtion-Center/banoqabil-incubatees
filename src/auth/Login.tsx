// auth/Login.tsx
import React, { useState } from "react"
import { toast } from "sonner"
import { CiUnread, CiRead } from "react-icons/ci"
import { userRepo } from "../repositories/userRepo"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Checkbox } from "../components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Link, useNavigate } from "react-router-dom"
import { useAuthStore } from "@/hooks/store/authStore"
import { useAttendanceStore } from "@/hooks/store/attendanceStore"
import authBg from "@/assets/auth-bg.png"
import { useForm, Controller } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { cn } from "@/lib/utils"

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean(),
})

type LoginFormValues = z.infer<typeof loginSchema>

const Login: React.FC = () => {
  const navigate = useNavigate()
  const { setUser } = useAuthStore()
  const { clearAttendance } = useAttendanceStore()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: true,
    },
  })

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true)

    try {
      const response = await userRepo.loginUser({
        email: data.email,
        password: data.password,
        remember: data.rememberMe,
      })

      // Store token for socket.io auth (cookies dont work cross-origin on Vercel)
      if (response.token) {
        if (data.rememberMe) {
          localStorage.setItem('token', response.token)
          sessionStorage.removeItem('token')
        } else {
          sessionStorage.setItem('token', response.token)
          localStorage.removeItem('token')
        }
      }
      setUser(response.user)
      clearAttendance()

      toast.success("Login successful")

      navigate("/")
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Login failed"
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
        <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-black/20 to-black/10" /> {/* Professional Overlay */}
        <div className="absolute bottom-16 left-16 text-white z-10 max-w-md animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="w-16 h-1 w-primary bg-white mb-6 rounded-full" />
          <h1 className="text-5xl font-black tracking-tighter mb-4 leading-none">Welcome Back</h1>
          <p className="text-xl opacity-80 font-medium tracking-tight">Manage your incubation journey efficiently with our elite management suite.</p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex items-center justify-center h-full p-8 lg:p-16">
        <div className="w-full max-w-sm space-y-8 animate-in fade-in slide-in-from-right-8 duration-1000">
          <div className="space-y-2">
            <h1 className="text-3xl font-black tracking-tight">Login to account</h1>
            <p className="text-sm text-muted-foreground font-medium tracking-tight">
              Enter your credentials to access your dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                className={cn(
                  "h-12 rounded-xl border-muted/50 bg-muted/5 px-4 focus-visible:ring-primary/20",
                  errors.email ? "border-red-500" : ""
                )}
                autoComplete="email"
                {...register("email")}
              />
              {errors.email && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <Label htmlFor="password" university-id="password" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Password</Label>
                <Link to="#" className="text-[10px] font-black uppercase tracking-widest text-primary hover:opacity-70">Forgot?</Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className={cn(
                    "h-12 rounded-xl border-muted/50 bg-muted/5 px-4 pr-12 focus-visible:ring-primary/20",
                    errors.password ? "border-red-500" : ""
                  )}
                  autoComplete="current-password"
                  {...register("password")}
                />
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

            {/* Remember Me Hidden but Default True */}
            <div className="hidden">
              <Controller
                name="rememberMe"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="remember"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>

            <Button className="w-full h-12 rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-95 mt-2" type="submit" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Login"}
            </Button>
          </form>

          <div className="pt-4 text-center">
            <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link to="/signup" className="text-primary hover:opacity-80 transition-opacity ml-1">
                New Registration
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login