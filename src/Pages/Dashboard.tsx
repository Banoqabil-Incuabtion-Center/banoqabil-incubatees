// Pages/Dashboard.tsx
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import MarkAttendance from "@/components/MarkAttendance"
import { UserAvatar } from "@/components/UserAvatar"
import { userRepo } from "../repositories/userRepo"
import { attRepo } from "../repositories/attRepo"
import { postRepo } from "../repositories/postRepo"
import { useAuthStore } from "@/hooks/store/authStore"
import {
  CalendarCheck,
  Clock,
  FileText,
  TrendingUp,
  Megaphone,
  Sun,
  Moon,
  TimerIcon,
  Zap,
  Activity,
  ArrowUpRight
} from "lucide-react"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  BarChart,
  Bar
} from "recharts"

interface AttendanceRecord {
  _id: string
  createdAt: string
  checkInTime: string | null
  checkOutTime: string | null
  status: string
  shift?: string
  hoursWorked?: number
}

interface PostStat {
  _id: string
  title: string
  likeCount: number
  commentCount: number
  createdAt: string
}

interface AdminAnnouncement {
  _id: string
  title: string
  description: string
  createdAt: string
}

import { useQuery } from "@tanstack/react-query"

const Dashboard = () => {
  const { user, setUser, isLoading, setLoading } = useAuthStore()

  // Queries
  const { data: todayAttendance, isLoading: todayLoading } = useQuery({
    queryKey: ['attendance', 'today', user?._id],
    queryFn: () => attRepo.getTodayStatus(user?._id!),
    enabled: !!user?._id,
  })

  const { data: attendanceData, isLoading: historyLoading } = useQuery({
    queryKey: ['attendance', 'history', user?._id],
    queryFn: async () => {
      let allHistory: any[] = []
      let currentPage = 1
      let hasMoreData = true
      let fetchedTotalHours = 0
      const MAX_PAGES = 50

      let safetyCounter = 0
      while (hasMoreData && safetyCounter < MAX_PAGES) {
        safetyCounter++
        const historyRes = await attRepo.getUserHistory(user?._id!, currentPage, 100)
        const pageHistory = historyRes.history || []

        if (pageHistory.length === 0) {
          hasMoreData = false
        } else {
          if (currentPage === 1 && historyRes.totalHours !== undefined) {
            fetchedTotalHours = historyRes.totalHours
          }
          allHistory = [...allHistory, ...pageHistory]
          const totalPages = historyRes.pagination?.totalPages || 1
          if (currentPage >= totalPages) {
            hasMoreData = false
          } else {
            currentPage++
          }
        }
      }

      const presentCount = allHistory.filter((h: any) => h.status === 'Present').length
      const absentCount = allHistory.filter((h: any) => h.status === 'Absent').length
      const lateCount = allHistory.filter((h: any) => h.status?.includes('Late')).length

      return {
        history: allHistory,
        totalHours: fetchedTotalHours,
        stats: {
          present: presentCount,
          absent: absentCount,
          late: lateCount
        }
      }
    },
    enabled: !!user?._id,
  })

  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ['posts', 'user-stats', user?._id],
    queryFn: async () => {
      const postsRes = await postRepo.getUserPostsWithStats(1, 100, user?._id!);
      const userPosts = postsRes.data || [];
      const postsWithStats: PostStat[] = userPosts.slice(0, 10).map((post: any) => ({
        _id: post._id,
        title: post.title || 'Untitled',
        likeCount: post.likeCount || 0,
        commentCount: post.commentCount || 0,
        createdAt: post.createdAt
      }));
      return {
        posts: postsWithStats,
        totalPosts: userPosts.length
      }
    },
    enabled: !!user?._id,
  })

  const { data: announcementsData, isLoading: announcementsLoading } = useQuery({
    queryKey: ['posts', 'announcements'],
    queryFn: async () => {
      const announcementsRes = await postRepo.getAllPosts(1, 5)
      return {
        list: announcementsRes.data || [],
        total: announcementsRes?.pagination?.totalItems || announcementsRes?.data?.length || 0
      }
    },
    enabled: !!user?._id,
  })

  // Derived Values
  const attendanceHistory = attendanceData?.history || []
  const myPosts = postsData?.posts || []
  const announcements = announcementsData?.list || []
  const totalHours = attendanceData?.totalHours || 0
  const totalAnnouncements = announcementsData?.total || 0
  const totalPosts = postsData?.totalPosts || 0
  const attendanceStats = attendanceData?.stats || { present: 0, absent: 0, late: 0 }

  const dashboardLoading = todayLoading || historyLoading || postsLoading || announcementsLoading

  useEffect(() => {
    const fetchUser = async () => {
      if (user) {
        setLoading(false)
        return
      }
      try {
        const res = await userRepo.profile()
        setUser(res.data)
      } catch (err: any) {
        console.error("Failed to fetch user:", err)
        setLoading(false)
      }
    }
    fetchUser()
  }, [user, setUser, setLoading])

  if (!user) {
    return null
  }

  // --- EVIL CHARTS CONFIG (Adapted for Light Mode) ---
  const CHART_COLORS = {
    primary: '#8b5cf6', // Violet
    secondary: '#ec4899', // Pink
    tertiary: '#06b6d4', // Cyan
    success: '#10b981', // Emerald
  };

  const attendancePieData = [
    { name: 'Present', value: attendanceStats.present, color: '#10b981' }, // Emerald
    { name: 'Late', value: attendanceStats.late, color: '#f59e0b' },    // Amber
    { name: 'Absent', value: attendanceStats.absent, color: '#ef4444' },  // Red
  ].filter(d => d.value > 0)

  // Use theme-aware colors for charts
  const weeklyAttendanceData = attendanceHistory.slice(0, 7).reverse().map(record => ({
    date: new Date(record.createdAt).toLocaleDateString('en-US', { weekday: 'short' }),
    hours: record.hoursWorked || (record.checkInTime && record.checkOutTime
      ? Math.round((new Date(record.checkOutTime).getTime() - new Date(record.checkInTime).getTime()) / (1000 * 60 * 60) * 10) / 10
      : 0)
  }))

  const postEngageData = myPosts.slice(0, 7).map(post => ({
    name: post.title,
    likes: post.likeCount,
    comments: post.commentCount,
    engagement: post.likeCount + post.commentCount
  }))

  const totalAnnouncementsCount = totalAnnouncements // Re-derived for safety if state update lagged (though state is preferable)

  // Custom Toolkit (Themed)
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border p-4 rounded-xl shadow-xl">
          <p className="text-foreground font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-foreground font-bold">{entry.value}</span>
              <span className="text-muted-foreground capitalize">{entry.name}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full bg-background text-foreground p-4 sm:p-8 space-y-8 font-jakarta">
      {/* Decorative Background Elements (Subtler for Light Mode) */}
      <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-primary/5 to-transparent pointer-events-none -z-10" />
      <div className="fixed top-[-100px] right-[-100px] w-[500px] h-[500px] bg-pink-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="fixed bottom-0 left-[-100px] w-[600px] h-[600px] bg-blue-500/10 blur-[150px] rounded-full pointer-events-none -z-10" />

      {/* Header Section */}
      <div className="relative overflow-hidden rounded-2xl p-8 sm:p-12 border border-border/100 bg-card/50 backdrop-blur-xl ">
        <div className="absolute top-0 right-0 w-[400px] h-full bg-gradient-to-l from-primary/5 to-transparent" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <Badge variant="outline" className="border-pink-500/30 text-pink-600 px-3 py-1 rounded-full uppercase tracking-widest text-[10px] bg-pink-500/5">
              Welcome Back
            </Badge>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground">
              {user.name}
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl">
              Here's what's happening with your projects and attendance today.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {todayAttendance?.shift && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-background/80 border border-border backdrop-blur-md shadow-sm">
                {todayAttendance.shift === 'Morning' ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-500" />}
                <span className="text-sm font-medium text-foreground">{todayAttendance.shift}</span>
              </div>
            )}
            <div>
              <MarkAttendance userId={user?._id} />
            </div>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full overflow-hidden">
        {[
          {
            title: 'Total Posts',
            value: totalPosts,
            icon: FileText,
            color: 'text-violet-600',
            bg: 'bg-violet-100 dark:bg-violet-900/20',
            border: 'border-violet-200 dark:border-violet-800/30'
          },
          {
            title: 'Total Hours',
            value: totalHours,
            icon: TimerIcon,
            color: 'text-pink-600',
            bg: 'bg-pink-100 dark:bg-pink-900/20',
            border: 'border-pink-200 dark:border-pink-800/30'
          },
          {
            title: 'Announcements',
            value: totalAnnouncements,
            icon: Megaphone,
            color: 'text-cyan-600',
            bg: 'bg-cyan-100 dark:bg-cyan-900/20',
            border: 'border-cyan-200 dark:border-cyan-800/30'
          },
          {
            title: 'Attendance Rate',
            value: `${attendanceHistory.length > 0 ? Math.round((attendanceStats.present / attendanceHistory.length) * 100) : 0}%`,
            icon: Activity,
            color: 'text-emerald-600',
            bg: 'bg-emerald-100 dark:bg-emerald-900/20',
            border: 'border-emerald-200 dark:border-emerald-800/30'
          },
        ].map((stat, i) => (
          <Card key={i} className={`bg-card/50 border ${stat.border} backdrop-blur-sm hover:shadow-md transition-all duration-300 group`}>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">{stat.title}</p>
                <h3 className="text-3xl font-black text-foreground group-hover:scale-105 transition-transform origin-left">
                  {dashboardLoading ? <Skeleton className="h-8 w-16" /> : stat.value}
                </h3>
              </div>
              <div className={`h-12 w-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                <stat.icon className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full overflow-hidden">

        {/* Main Chart - Weekly Activity (Span 2) */}
        <Card className="lg:col-span-2 shadow-sm border-border overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Zap className="w-32 h-32 text-primary" />
          </div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Clock className="w-5 h-5 text-primary" />
              Weekly Rhythm
            </CardTitle>
            <CardDescription>Your work hours over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              {dashboardLoading ? (
                <Skeleton className="w-full h-full rounded-xl" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyAttendanceData}>
                    <defs>
                      <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-muted/20" vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke="currentColor"
                      className="text-muted-foreground"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="currentColor"
                      className="text-muted-foreground"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value}h`}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'currentColor', strokeWidth: 1, className: "text-muted/50" }} />
                    <Area
                      type="monotone"
                      dataKey="hours"
                      stroke="#8b5cf6"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorHours)"
                      animationDuration={1500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Engagement / Attendance Radial (Span 1) */}
        <Card className="shadow-sm border-border relative overflow-hidden">
          <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-emerald-500/10 blur-[50px] rounded-full" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              Attendance Split
            </CardTitle>
            <CardDescription>Distribution of your attendance status</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="h-[220px] w-full relative">
              {dashboardLoading ? (
                <Skeleton className="w-40 h-40 rounded-full mx-auto" />
              ) : attendancePieData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={attendancePieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                        cornerRadius={6}
                        stroke="none"
                      >
                        {attendancePieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-black text-foreground">{attendanceStats.present}</span>
                    <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Present</span>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">No Data</div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4 w-full mt-6">
              <div className="flex items-center gap-2 bg-secondary/50 p-2 rounded-lg border border-border">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xs text-muted-foreground">On Time</span>
                <span className="ml-auto text-xs font-bold text-foreground">{attendanceStats.present}</span>
              </div>
              <div className="flex items-center gap-2 bg-secondary/50 p-2 rounded-lg border border-border">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-xs text-muted-foreground">Late</span>
                <span className="ml-auto text-xs font-bold text-foreground">{attendanceStats.late}</span>
              </div>
              <div className="flex items-center gap-2 bg-secondary/50 p-2 rounded-lg border border-border">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-xs text-muted-foreground">Absent</span>
                <span className="ml-auto text-xs font-bold text-foreground">{attendanceStats.absent}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 3 - Announcements & Post Engagement */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full overflow-hidden">
        {/* Announcements Feed */}
        <Card className="shadow-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-cyan-500" />
                Announcements
              </CardTitle>
              <CardDescription>Latest updates from the team</CardDescription>
            </div>
            <Badge variant="secondary" className="bg-cyan-500/10 text-cyan-600 hover:bg-cyan-500/20 border-cyan-200">
              {totalAnnouncementsCount} New
              {/* Fixed variable usage */}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
              {dashboardLoading ? (
                [...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)
              ) : announcements.length > 0 ? (
                announcements.map((ann, i) => (
                  <div key={ann._id} className="p-4 rounded-xl bg-card border border-border hover:bg-accent/50 transition-colors group cursor-pointer shadow-sm">
                    <div className="flex items-start gap-3">
                      <UserAvatar className="h-8 w-8 ring-2 ring-cyan-500/20" fallbackColor="bg-cyan-600" />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h4 className="text-sm font-semibold text-foreground group-hover:text-cyan-600 transition-colors truncate">{ann.title}</h4>
                          <span className="text-[10px] text-muted-foreground">{new Date(ann.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{ann.description}</p>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-cyan-600 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">No announcements yet</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Post Engagement Bar Chart */}
        <Card className="shadow-sm border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Activity className="w-5 h-5 text-pink-500" />
              Top Engagement
            </CardTitle>
            <CardDescription>Your most active posts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              {dashboardLoading ? (
                <Skeleton className="w-full h-full rounded-lg" />
              ) : postEngageData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={postEngageData} layout="vertical" margin={{ left: -20, right: 10, top: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="currentColor" className="text-muted/10" />
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'currentColor', fontSize: 11, className: "text-muted-foreground" }}
                      width={100}
                      tickFormatter={(val) => val.length > 12 ? val.substr(0, 12) + '...' : val}
                    />
                    <Tooltip
                      cursor={{ fill: 'currentColor', className: 'text-muted/5' }}
                      content={<CustomTooltip />}
                    />
                    <Bar dataKey="engagement" radius={[0, 4, 4, 0]} barSize={20}>
                      {postEngageData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#ec4899' : '#8b5cf6'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">No posts yet</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Dashboard