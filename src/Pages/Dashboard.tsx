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
  MessageSquare,
  FileText,
  TrendingUp,
  CheckCircle2,
  XCircle,
  LogIn,
  LogOut,
  Megaphone,
  Sun,
  Moon,
  TimerIcon
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area
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

const Dashboard = () => {
  const { user, setUser, isLoading, setLoading } = useAuthStore()

  // States
  const [todayAttendance, setTodayAttendance] = useState<any>(null)
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([])
  const [myPosts, setMyPosts] = useState<PostStat[]>([])
  const [announcements, setAnnouncements] = useState<AdminAnnouncement[]>([])
  const [dashboardLoading, setDashboardLoading] = useState(true)

  // Stats
  const [totalHours, setTotalHours] = useState(0)
  const [totalAnnouncements, setTotalAnnouncements] = useState(0)
  const [totalPosts, setTotalPosts] = useState(0)
  const [attendanceStats, setAttendanceStats] = useState({
    present: 0,
    absent: 0,
    late: 0
  })

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

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?._id) {
        setDashboardLoading(false);
        return;
      }

      setDashboardLoading(true)

      try {
        // Fetch today's attendance
        const todayRes = await attRepo.getTodayStatus(user._id)
        setTodayAttendance(todayRes)

        // ✅ FIXED: Fetch ALL attendance history using pagination
        let allHistory: any[] = []
        let currentPage = 1
        let hasMoreData = true
        let fetchedTotalHours = 0


        let safetyCounter = 0;
        const MAX_PAGES = 50;

        while (hasMoreData && safetyCounter < MAX_PAGES) {
          safetyCounter++;
          const historyRes = await attRepo.getUserHistory(user._id, currentPage, 100)
          const pageHistory = historyRes.history || []

          if (pageHistory.length === 0) {
            hasMoreData = false
          } else {
            // Capture total hours from the first page response
            if (currentPage === 1 && historyRes.totalHours !== undefined) {
              fetchedTotalHours = historyRes.totalHours
            }

            allHistory = [...allHistory, ...pageHistory]

            // Check if there are more pages
            const totalPages = historyRes.pagination?.totalPages || 1
            if (currentPage >= totalPages) {
              hasMoreData = false
            } else {
              currentPage++
            }
          }
        }

        setAttendanceHistory(allHistory)
        // ✅ UPDATED: Calculate ALL attendance stats from complete history
        const presentCount = allHistory.filter((h: any) => h.status === 'Present').length
        const absentCount = allHistory.filter((h: any) => h.status === 'Absent').length
        const lateCount = allHistory.filter((h: any) => h.status?.includes('Late')).length

        setAttendanceStats({
          present: presentCount,
          absent: absentCount,
          late: lateCount
        })

        // ✅ OPTIMIZED: Fetch user's posts with stats in single query (no loops!)
        const postsRes = await postRepo.getUserPostsWithStats(1, 100, user._id);
        const userPosts = postsRes.data || [];

        // Calculate totals from the aggregated data
        let likesTotal = 0;
        let commentsTotal = 0;
        const postsWithStats: PostStat[] = userPosts.slice(0, 10).map((post: any) => {
          likesTotal += post.likeCount || 0;
          commentsTotal += post.commentCount || 0;
          return {
            _id: post._id,
            title: post.title || 'Untitled',
            likeCount: post.likeCount || 0,
            commentCount: post.commentCount || 0,
            createdAt: post.createdAt
          };
        });

        setMyPosts(postsWithStats);

        // ✅ FIXED: Total Hours should be from attendance, not likes
        setTotalHours(fetchedTotalHours || 0);
        setTotalPosts(userPosts.length);

        // Fetch admin announcements
        const announcementsRes = await postRepo.getAllPosts(1, 5)
        setAnnouncements(announcementsRes.data || [])

        // Use available announcements count or default to 0
        setTotalAnnouncements(announcementsRes?.pagination?.totalItems || announcementsRes?.data?.length || 0)

      } catch (err) {
        console.error("Error fetching dashboard data:", err)
      } finally {
        setDashboardLoading(false)
      }
    }

    fetchDashboardData()
  }, [user?._id])

  // Only block if no user - otherwise show skeleton loading
  if (!user) {
    return null // Let PrivateRoute handle the redirect
  }

  // Chart colors
  const COLORS = ['#22c55e', '#ef4444', '#f59e0b', '#3b82f6']

  // ✅ UPDATED: Attendance pie data (overall, not last 10 days)
  const attendancePieData = [
    { name: 'Present', value: attendanceStats.present, color: '#22c55e' },
    { name: 'Absent', value: attendanceStats.absent, color: '#ef4444' },
    { name: 'Late', value: attendanceStats.late, color: '#f59e0b' },
  ].filter(d => d.value > 0)

  // ✅ ADDED: Total attendance count display
  const totalAttendanceRecords = attendanceHistory.length

  // Post engagement chart data
  const postEngagementData = myPosts.slice(0, 5).map(post => ({
    name: post.title.length > 15 ? post.title.substring(0, 15) + '...' : post.title,
    likes: post.likeCount,
    comments: post.commentCount
  }))

  // Weekly attendance data (last 7 records)
  const weeklyAttendanceData = attendanceHistory.slice(0, 7).reverse().map(record => ({
    date: new Date(record.createdAt).toLocaleDateString('en-US', { weekday: 'short' }),
    hours: record.hoursWorked || (record.checkInTime && record.checkOutTime
      ? Math.round((new Date(record.checkOutTime).getTime() - new Date(record.checkInTime).getTime()) / (1000 * 60 * 60) * 10) / 10
      : 0)
  }))

  const isCheckedIn = Boolean(todayAttendance?.checkInTime)
  const isCheckedOut = Boolean(todayAttendance?.checkOutTime)

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-8 rounded-3xl bg-gradient-to-br from-primary/10 via-background to-background border border-primary/5 shadow-soft">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground tracking-tight">
            Hey, {user.name}! 👋
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2 font-medium">
            Ready to build something amazing today?
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {dashboardLoading ? (
            // Skeleton for badges
            <>
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </>
          ) : (
            <>
              <>
                {todayAttendance?.shift && (
                  <Badge className="gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary border-none font-bold text-[10px] uppercase tracking-wider">
                    {todayAttendance.shift === 'Morning' ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
                    {todayAttendance.shift}
                  </Badge>
                )}
                {/* Replaced static badges with MarkAttendance component */}
                <MarkAttendance userId={user?._id} />
              </>
            </>
          )}
        </div>
      </div>

      {/* Stats Cards */}


      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {dashboardLoading ? (
          // Skeleton loaders for stats
          <>
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="border-none shadow-premium rounded-3xl overflow-hidden">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-8 w-12 rounded-lg" />
                    </div>
                    <Skeleton className="h-12 w-12 rounded-2xl" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <>
            <Card className="border-none shadow-premium rounded-3xl hover:translate-y-[-4px] transition-transform">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Posts</p>
                    <h3 className="text-2xl sm:text-3xl font-black mt-1">{totalPosts}</h3>
                  </div>
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-premium rounded-3xl hover:translate-y-[-4px] transition-transform">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Hours</p>
                    <h3 className="text-2xl sm:text-3xl font-black mt-1">{totalHours}</h3>
                  </div>
                  <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                    <TimerIcon className="h-6 w-6 text-amber-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-premium rounded-3xl hover:translate-y-[-4px] transition-transform">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Announcements</p>
                    <h3 className="text-2xl sm:text-3xl font-black mt-1">{totalAnnouncements}</h3>
                  </div>
                  <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                    <Megaphone className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-premium rounded-3xl hover:translate-y-[-4px] transition-transform">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Attendance Rate</p>
                    <h3 className="text-2xl sm:text-3xl font-black mt-1">
                      {attendanceHistory.length > 0
                        ? Math.round((attendanceStats.present / attendanceHistory.length) * 100)
                        : 0}%
                    </h3>
                  </div>
                  <div className="h-12 w-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
                    <CalendarCheck className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Admin Announcements Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {dashboardLoading ? (
                <>
                  <Skeleton className="h-5 w-5 rounded" />
                  <Skeleton className="h-5 w-36" />
                </>
              ) : (
                <>
                  <Megaphone className="h-5 w-5" />
                  Admin Announcements
                </>
              )}
            </CardTitle>
            <CardDescription>
              {dashboardLoading ? <Skeleton className="h-4 w-36" /> : "Latest updates from admin"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-60 overflow-y-auto">
              {dashboardLoading ? (
                // Skeleton loaders for announcements
                [...Array(3)].map((_, i) => (
                  <div key={i} className="p-3 rounded-lg border">
                    <div className="flex items-start gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  </div>
                ))
              ) : announcements.length > 0 ? (
                announcements.map((announcement) => (
                  <div
                    key={announcement._id}
                    className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <UserAvatar
                        className="h-8 w-8 bg-primary"
                        fallbackColor="bg-primary"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{announcement.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {announcement.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(announcement.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <Megaphone className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground text-sm">No announcements yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Attendance Pie Chart with total count */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {dashboardLoading ? (
                <>
                  <Skeleton className="h-5 w-5 rounded" />
                  <Skeleton className="h-5 w-36" />
                </>
              ) : (
                <>
                  <TrendingUp className="h-5 w-5" />
                  Attendance Overview
                </>
              )}
            </CardTitle>
            <CardDescription>
              {dashboardLoading ? (
                <Skeleton className="h-4 w-56" />
              ) : (
                <>Your overall attendance distribution ({totalAttendanceRecords} total records)</>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dashboardLoading ? (
              // Skeleton for pie chart
              <div className="space-y-4">
                <div className="flex items-center justify-center h-[250px]">
                  <Skeleton className="h-40 w-40 rounded-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            ) : attendancePieData.length > 0 ? (
              <div className="space-y-4">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={attendancePieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {attendancePieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>

                {/* Summary stats below chart */}
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-muted-foreground">Present: {attendanceStats.present}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <span className="text-muted-foreground">Late: {attendanceStats.late}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[200px]">
                <p className="text-muted-foreground">No attendance data yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Weekly Hours */}
      <div className="lg:grid-cols-2 gap-6">
        {/* Weekly Hours Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {dashboardLoading ? (
                <>
                  <Skeleton className="h-5 w-5 rounded" />
                  <Skeleton className="h-5 w-28" />
                </>
              ) : (
                <>
                  <Clock className="h-5 w-5" />
                  Weekly Hours
                </>
              )}
            </CardTitle>
            <CardDescription>
              {dashboardLoading ? <Skeleton className="h-4 w-44" /> : "Hours worked in the last 7 days"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dashboardLoading ? (
              // Skeleton for area chart
              <div className="space-y-3">
                <div className="flex items-end justify-between h-[200px] gap-2">
                  {[...Array(7)].map((_, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <Skeleton className="w-full" style={{ height: `${Math.random() * 100 + 50}px` }} />
                      <Skeleton className="h-3 w-8" />
                    </div>
                  ))}
                </div>
              </div>
            ) : weeklyAttendanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={weeklyAttendanceData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="hours"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.3}
                    name="Hours"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[200px]">
                <p className="text-muted-foreground">No attendance data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div >
  )
}

export default Dashboard