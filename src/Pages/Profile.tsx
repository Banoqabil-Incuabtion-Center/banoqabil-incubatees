"use client"

import { cn } from "@/lib/utils"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { toast } from "sonner"
import {
  Edit3,
  Loader2,
  LogOut,
  Mail,
  Phone,
  CreditCard,
  GraduationCap,
  User2,
  IdCard,
  Clock,
  LogIn,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  MapPin,
  ChevronRight,
  Sparkles
} from "lucide-react"
import { userRepo } from "../repositories/userRepo"
import { postRepo } from "../repositories/postRepo"
import { useAuthStore } from "@/hooks/store/authStore"
import { UserCard } from "../components/UserCard"
import Logout from "@/auth/Logout"
import { Link, useNavigate } from "react-router-dom"
import { PostCard } from "../components/PostCard"
import { Palette, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Switch } from "@/components/ui/switch"

export default function ProfilePage() {
  const navigate = useNavigate()
  const { setTheme, theme } = useTheme()
  const { user: authUser, setUser: setAuthUser, setLogoutDialogOpen } = useAuthStore()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activities, setActivities] = useState<any[]>([])
  const [activitiesLoading, setActivitiesLoading] = useState(true)
  const [myPosts, setMyPosts] = useState<any[]>([])
  const [postsLoading, setPostsLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await userRepo.profile()
        setUser(res.user || res)
      } catch (err) {
        console.error(err)
        toast.error("Failed to fetch profile")
      } finally {
        setLoading(false)
      }
    }

    const fetchActivities = async () => {
      try {
        const res = await userRepo.getActivities(1, 5)
        setActivities(res.data || [])
      } catch (err) {
        console.error("Failed to fetch activities", err)
      } finally {
        setActivitiesLoading(false)
      }
    }

    const fetchMyPosts = async (userId: string) => {
      try {
        setPostsLoading(true)
        const res = await postRepo.getUserPostsWithStats(1, 10, userId)
        setMyPosts(res.data || [])
      } catch (err) {
        console.error("Failed to fetch my posts", err)
      } finally {
        setPostsLoading(false)
      }
    }

    fetchUser().then(() => {
      if (authUser?._id) fetchMyPosts(authUser._id)
    })
    fetchActivities()
  }, [authUser?._id])

  const triggerLogout = () => {
    setLogoutDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="container max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const profileFields = [
    { label: "Full Name", value: user?.name, icon: User2 },
    { label: "Bio", value: user?.bio, icon: Edit3 },
    { label: "Status", value: user?.status, icon: Sparkles },
    { label: "Bano Qabil ID", value: user?.bq_id, icon: IdCard },
    { label: "Email Address", value: user?.email, icon: Mail },
    { label: "Phone Number", value: user?.phone, icon: Phone },
    { label: "CNIC", value: user?.CNIC, icon: CreditCard },
    { label: "Course", value: user?.course, icon: GraduationCap },
    { label: "Location", value: user?.location, icon: MapPin },
  ]

  return (
    <div className="container max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-24">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

        {/* Left Column: Profile Summary */}
        <div className="lg:col-span-4 space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
          <UserCard user={user} authUser={authUser} />

          <Button
            onClick={() => navigate("/profile/customize")}
            variant="outline"
            className="w-full gap-2 rounded-2xl h-12 border-dashed hover:border-primary transition-all font-bold"
          >
            <Palette className="w-4 h-4 text-primary" />
            Customize Profile Card
          </Button>

          <Card className="border-dashed border-2 shadow-none bg-transparent">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Sun className="w-4 h-4 dark:hidden" />
                  <Moon className="w-4 h-4 hidden dark:block" />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-sm">Dark Mode</span>
                  <span className="text-xs text-muted-foreground">Adjust the appearance</span>
                </div>
              </div>
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
              />
            </CardContent>
          </Card>

          {/* Account Actions (Edit, Public, Logout) */}
          <div className="space-y-3 animate-in fade-in slide-in-from-left-6 duration-700 delay-200">
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => navigate("/profile/edit")}
                className="flex-1 h-12 rounded-2xl bg-primary shadow-soft hover:shadow-premium font-bold gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Edit3 className="w-4 h-4" />
                <span className="truncate">Edit Profile</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => navigate(`/user/${authUser?._id}`)}
                className="flex-1 h-12 rounded-2xl font-bold gap-2 border-primary/10 text-primary hover:bg-primary/5 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <User2 className="w-4 h-4" />
                <span className="truncate">Public View</span>
              </Button>
            </div>

            <Card className="border-none shadow-sm overflow-hidden bg-muted/30">
              <CardContent className="p-2">
                <button
                  onClick={triggerLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-destructive/10 rounded-xl transition-colors group text-destructive"
                >
                  <div className="p-2 rounded-lg bg-destructive/10 group-hover:bg-destructive group-hover:text-white transition-colors">
                    <LogOut className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">Logout</p>
                    <p className="text-xs opacity-70">Sign out of account</p>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-30" />
                </button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Column: Details & Activity */}
        <div className="lg:col-span-8">
          <Tabs defaultValue="posts" className="w-full">
            <TabsList className="w-full h-12 p-1 bg-muted/50 rounded-xl gap-1">
              <TabsTrigger value="posts" className="flex-1 rounded-lg h-10 font-medium">Timeline</TabsTrigger>
              <TabsTrigger value="details" className="flex-1 rounded-lg h-10 font-medium">Personal Details</TabsTrigger>
              <TabsTrigger value="activity" className="flex-1 rounded-lg h-10 font-medium">Activity Log</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-6 space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {profileFields.map((field, idx) => {
                      const Icon = field.icon
                      return (
                        <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 p-4 sm:p-5 hover:bg-muted/5 transition-colors group">
                          <div className="flex items-center gap-3 sm:w-48 shrink-0">
                            <div className="p-2 rounded-lg bg-primary/5 text-primary">
                              <Icon className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-bold text-muted-foreground uppercase tracking-tight">
                              {field.label}
                            </span>
                          </div>
                          <div className="flex-1 pl-11 sm:pl-0">
                            <p className="font-medium text-foreground">
                              {field.value || "Not provided"}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="posts" className="mt-6 space-y-2 animate-in fade-in slide-in-from-bottom-2">
              {postsLoading ? (
                <div className="space-y-0">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="py-6 sm:py-8 border-b border-primary/5">
                      <div className="flex gap-4">
                        <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 rounded-full" />
                        <div className="flex-1 space-y-3">
                          <Skeleton className="h-4 w-1/4" />
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-32 w-full rounded-2xl sm:rounded-3xl" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : myPosts.length === 0 ? (
                <Card className="p-12 text-center text-muted-foreground flex flex-col items-center gap-2">
                  <div className="p-3 rounded-full bg-muted/50">
                    <Clock className="w-6 h-6 opacity-40" />
                  </div>
                  <p className="text-sm">You haven't posted anything yet.</p>
                  <Button asChild variant="outline" size="sm" className="mt-2 rounded-xl">
                    <Link to="/posts">Go to Community</Link>
                  </Button>
                </Card>
              ) : (
                <div className="space-y-0">
                  {myPosts.map(post => (
                    <PostCard
                      key={post._id}
                      postId={post._id}
                      title={post.title}
                      description={post.description}
                      image={post.image}
                      link={post.link}
                      createdAt={post.createdAt}
                      authorName={authUser?.name}
                      authorAvatar={authUser?.avatar}
                      authorId={authUser?._id}
                      likeCount={post.likeCount}
                      commentCount={post.commentCount}
                      onDelete={(id) => setMyPosts(prev => prev.filter(p => p._id !== id))}
                      onEdit={(id, data) => setMyPosts(prev => prev.map(p => p._id === id ? { ...p, ...data } : p))}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="activity" className="mt-6 space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <Card>
                <CardContent className="p-0">
                  <div className="p-4 border-b flex items-center justify-between">
                    <h3 className="font-semibold text-sm">Recent Activity</h3>
                    <Button variant="ghost" size="sm" asChild className="text-xs font-medium text-primary hover:bg-primary/5">
                      <Link to="/activities">View Full History</Link>
                    </Button>
                  </div>

                  {activitiesLoading ? (
                    <div className="p-5 space-y-6">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-center gap-4">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-1/4" />
                            <Skeleton className="h-3 w-1/2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : activities.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-2">
                      <Clock className="w-8 h-8 opacity-20" />
                      <p className="text-sm">No recent activities found</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {activities.map((activity, idx) => {
                        const isLogin = activity.action === "login"
                        const deviceType = activity.device?.type || "unknown"
                        let DeviceIcon = Globe
                        if (deviceType === "desktop") DeviceIcon = Monitor
                        if (deviceType === "mobile") DeviceIcon = Smartphone
                        if (deviceType === "tablet") DeviceIcon = Tablet

                        return (
                          <div key={activity._id || idx} className="flex items-center gap-4 p-4 sm:p-5 hover:bg-muted/10 transition-colors group">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm border ${isLogin
                              ? "bg-green-50 text-green-600 border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/50"
                              : "bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/50"
                              }`}>
                              {isLogin ? <LogIn className="w-5 h-5" /> : <LogOut className="w-5 h-5" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <p className="font-semibold text-sm capitalize">
                                  {activity.action}
                                </p>
                                <span className="text-[10px] sm:text-xs text-muted-foreground font-medium bg-muted/30 px-2 py-0.5 rounded-full">
                                  {new Date(activity.timestamp || activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground flex items-center gap-2 truncate">
                                <DeviceIcon className="w-3 h-3 opacity-60" />
                                {activity.device?.browser} on {activity.device?.os}
                                {activity.location?.city && (
                                  <span className="flex items-center gap-1.5 border-l pl-2 h-3 ml-1">
                                    <MapPin className="w-3 h-3 opacity-60" />
                                    {activity.location.city}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Mobile actions removed - now consolidated in left column */}
        </div>
      </div>

      {/* Hidden Logout logic handler */}
      <div className="hidden">
        <Logout />
      </div>
    </div >
  )
}
