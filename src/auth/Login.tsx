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
    <div className="w-full h-screen lg:grid lg:grid-cols-2">
      {/* Left Side - Image */}
      <div className="hidden lg:block h-full relative">
        <img
          src={authBg}
          alt="Authentication Background"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/20" /> {/* Overlay */}
        <div className="absolute bottom-10 left-10 text-white z-10 p-6">
          <h1 className="text-4xl font-bold mb-2">Welcome Back</h1>
          <p className="text-lg opacity-90">Manage your incubation journey efficiently.</p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex items-center justify-center h-full p-4 bg-gray-50 dark:bg-neutral-950">
        <Card className="w-full max-w-md border-none shadow-none bg-transparent">
          <CardHeader className="space-y-1 text-center lg:text-left p-0 mb-6">
            <CardTitle className="text-2xl font-bold">Login to your account</CardTitle>
            <CardDescription>
              Enter your email and password to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 p-0">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  className={errors.email ? "border-red-500" : ""}
                  autoComplete="email"
                  {...register("email")}
                />
                {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className={errors.password ? "border-red-500 pr-10" : "pr-10"}
                    autoComplete="current-password"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-gray-500 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 select-none"
                  >
                    {showPassword ? <CiUnread size={20} /> : <CiRead size={20} />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs">{errors.password.message}</p>}
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

              <Button className="w-full mt-2" type="submit" disabled={isLoading}>
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{" "}
              <Link to="/signup" className="underline text-primary hover:text-primary/90">
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Login