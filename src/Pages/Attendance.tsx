import React, { useEffect, useState } from "react";
import { Table, Tag } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import { attRepo, AttendanceStatus, HistoryRecord, AttendanceSettings } from "@/repositories/attRepo";
import { useAuthStore } from "@/hooks/store/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sun, Moon, Clock, AlertCircle, CheckCircle2, XCircle, Info, CalendarDays, TableIcon } from "lucide-react";
import AttendanceCalendar from "@/components/AttendanceCalendar";
import MarkAttendance from "@/components/MarkAttendance";
import { cn } from "@/lib/utils";

const Attendance: React.FC = () => {
  const { user } = useAuthStore();
  const [attendance, setAttendance] = useState<AttendanceStatus | null>(null);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [shiftInfo, setShiftInfo] = useState<AttendanceSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  // Pagination & Total Hours State
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [totalHours, setTotalHours] = useState<number>(0);

  // Fetch today's status and shift info
  useEffect(() => {
    const fetchData = async () => {
      if (!user?._id) {
        setIsLoading(false);
        return;
      }
      try {
        const [statusRes, shiftRes] = await Promise.all([
          attRepo.getTodayStatus(user._id),
          attRepo.getShiftInfo()
        ]);
        setAttendance(statusRes);
        setShiftInfo(shiftRes);
      } catch (err) {
        console.error("Error fetching attendance:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user?._id]);

  // Fetch history with pagination
  const fetchHistory = async (page = 1, pageSize = 10) => {
    if (!user?._id) return;
    setIsHistoryLoading(true);
    try {
      const res = await attRepo.getUserHistory(user._id, page, pageSize);
      setHistory(res.history || []);
      setPagination({
        current: res.pagination.currentPage,
        pageSize: res.pagination.limit,
        total: res.pagination.total
      });
      if (res.totalHours !== undefined) {
        setTotalHours(res.totalHours);
      }
    } catch (err) {
      console.error("Error fetching history:", err);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user?._id]);

  const handleTableChange = (newPagination: TablePaginationConfig) => {
    fetchHistory(newPagination.current || 1, newPagination.pageSize || 10);
  };

  const getStatusColor = (status: string) => {
    if (status === 'Present') return 'green';
    if (status === 'Late') return 'gold';
    if (status === 'Early Leave') return 'orange';
    if (status.includes('Late') && status.includes('Early')) return 'red';
    if (status.includes('No Checkout')) return 'volcano';
    if (status === 'Incomplete') return 'default';
    if (status === 'Absent') return 'red';
    return 'blue';
  };

  // Helper to calculate hours from check-in/out
  const calculateHours = (record: HistoryRecord): number | null => {
    // First try the hoursWorked field
    if (record.hoursWorked && record.hoursWorked > 0) {
      return record.hoursWorked;
    }
    // Calculate from check-in/out times
    if (record.checkInTime && record.checkOutTime) {
      const checkIn = new Date(record.checkInTime).getTime();
      const checkOut = new Date(record.checkOutTime).getTime();
      const hours = (checkOut - checkIn) / (1000 * 60 * 60);
      return Math.round(hours * 10) / 10; // Round to 1 decimal
    }
    return null;
  };

  const columns: ColumnsType<HistoryRecord> = [
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 110,
      render: (val: string) => val
        ? new Date(val).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
        : "—",
    },
    {
      title: "Shift",
      dataIndex: "shift",
      key: "shift",
      width: 90,
      render: (shift: string) => (
        <span className="flex items-center gap-1">
          {shift === 'Morning' ? <Sun className="w-4 h-4 text-yellow-500" /> : <Moon className="w-4 h-4 text-blue-500" />}
          {shift}
        </span>
      ),
    },
    {
      title: "Check In",
      dataIndex: "checkInTime",
      key: "checkInTime",
      width: 110,
      render: (val: string, record) => (
        <span className="flex items-center gap-1">
          {val ? new Date(val).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}
          {record.isLate && <Tag color="gold" className="text-xs ml-1">Late</Tag>}
        </span>
      ),
    },
    {
      title: "Check Out",
      dataIndex: "checkOutTime",
      key: "checkOutTime",
      width: 110,
      render: (val: string, record) => (
        <span className="flex items-center gap-1">
          {val ? new Date(val).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : <span className="text-red-500">Missing</span>}
          {val && record.isEarlyLeave && <Tag color="orange" className="text-xs ml-1">Early</Tag>}
        </span>
      ),
    },
    {
      title: "Hours",
      key: "hoursWorked",
      width: 80,
      render: (_, record: HistoryRecord) => {
        const hours = calculateHours(record);
        if (hours === null) {
          return <span className="text-muted-foreground">—</span>;
        }
        return (
          <span className={`font-medium ${hours >= 4 ? "text-green-600" : "text-red-500"}`}>
            {hours.toFixed(1)}h
          </span>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (status: string) => <Tag color={getStatusColor(status)}>{status}</Tag>,
    },
  ];

  // if (isLoading) {
  //   return <div className="flex justify-center items-center h-64"><Loader /></div>;
  // }

  if (!user?._id) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <AlertCircle className="w-10 h-10 mb-2" />
        <p>User information not available</p>
      </div>
    );
  }

  const isCheckedIn = Boolean(attendance?.checkInTime);
  const isCheckedOut = Boolean(attendance?.checkOutTime);
  const userShift = attendance?.userShift || user?.shift;
  const shiftTiming = attendance?.shiftTiming;
  const currentShiftInfo = userShift && shiftInfo?.shifts ? shiftInfo.shifts[userShift as 'Morning' | 'Evening'] : null;

  // Calculate today's hours
  const todayHours = attendance?.hoursWorked || (
    attendance?.checkInTime && attendance?.checkOutTime
      ? Math.round((new Date(attendance.checkOutTime).getTime() - new Date(attendance.checkInTime).getTime()) / (1000 * 60 * 60) * 10) / 10
      : 0
  );

  return (
    <div className="flex flex-col gap-4 sm:gap-5 p-4 sm:p-6">


      {/* Today's Status */}
      <Card className="border-primary/5 rounded-[2rem] shadow-premium hover:shadow-premium-hover transition-all duration-300">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Today's Attendance
            </CardTitle>
            <div className="w-full md:w-auto flex justify-start md:justify-end">
              <MarkAttendance userId={user?._id} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="p-3 sm:p-5 rounded-2xl bg-muted/30 space-y-3 flex flex-col items-center border border-primary/5 shadow-soft">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                ))}
              </div>
            </div>
          ) : isCheckedIn ? (
            <div className="space-y-4">
              {/* Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="h-7 px-3 rounded-full border-primary/20 bg-primary/5 text-primary font-bold tracking-tight">
                  {attendance?.shift === 'Morning' ? <Sun className="w-3.5 h-3.5 mr-1.5" /> : <Moon className="w-3.5 h-3.5 mr-1.5" />}
                  {attendance?.shift}
                </Badge>
                {attendance?.isLate && (
                  <Badge className="h-7 px-3 bg-yellow-500 hover:bg-yellow-600 font-bold tracking-tight">
                    <AlertCircle className="w-3.5 h-3.5 mr-1.5" />
                    Late
                  </Badge>
                )}
                {attendance?.isEarlyLeave && (
                  <Badge className="h-7 px-3 bg-orange-500 hover:bg-orange-600 font-bold tracking-tight">
                    Early Leave
                  </Badge>
                )}
                {!isCheckedOut && attendance?.status?.includes('No Checkout') && (
                  <Badge className="h-7 px-3 bg-red-500 hover:bg-red-600 font-bold tracking-tight">
                    <XCircle className="w-3.5 h-3.5 mr-1.5" />
                    No Checkout
                  </Badge>
                )}
                <Badge className={cn(
                  "h-7 px-3 font-bold tracking-tight",
                  attendance?.status === 'Present' ? 'bg-green-500 hover:bg-green-600' :
                    attendance?.status?.includes('Late') ? 'bg-yellow-500 hover:bg-yellow-600' :
                      attendance?.status?.includes('Early') ? 'bg-orange-500 hover:bg-orange-600' :
                        attendance?.status?.includes('No Checkout') ? 'bg-red-500 hover:bg-red-600' :
                          'bg-gray-500 hover:bg-gray-600'
                )}>
                  {attendance?.status}
                </Badge>
              </div>

              {/* Time Cards */}
              <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-2">
                <div className="bg-green-50/50 dark:bg-green-900/10 p-4 sm:p-5 rounded-2xl border border-green-100 dark:border-green-900/20 text-center shadow-soft group hover:translate-y-[-2px] transition-all">
                  <p className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-green-600/60 dark:text-green-400/60 mb-1.5">Check In</p>
                  <p className="text-sm sm:text-2xl font-black tracking-tight text-green-700 dark:text-green-300">
                    {attendance?.checkInTime
                      ? new Date(attendance.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : "—"}
                  </p>
                </div>

                <div className={cn(
                  "p-4 sm:p-5 rounded-2xl text-center border shadow-soft group hover:translate-y-[-2px] transition-all",
                  isCheckedOut
                    ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/20'
                    : 'bg-yellow-50/50 dark:bg-yellow-900/10 border-yellow-100 dark:border-yellow-900/20'
                )}>
                  <p className={cn(
                    "text-[10px] sm:text-xs font-black uppercase tracking-widest mb-1.5",
                    isCheckedOut ? "text-blue-600/60 dark:text-blue-400/60" : "text-yellow-600/60 dark:text-yellow-400/60"
                  )}>Check Out</p>
                  <p className={cn(
                    "text-sm sm:text-2xl font-black tracking-tight",
                    isCheckedOut ? "text-blue-700 dark:text-blue-300" : "text-yellow-600"
                  )}>
                    {attendance?.checkOutTime
                      ? new Date(attendance.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : "Pending"}
                  </p>
                </div>

                <div className="bg-primary/5 dark:bg-primary/10 p-4 sm:p-5 rounded-2xl text-center border border-primary/10 shadow-soft group hover:translate-y-[-2px] transition-all">
                  <p className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-primary/60 mb-1.5">Hours</p>
                  <p className={cn(
                    "text-sm sm:text-2xl font-black tracking-tight flex items-center justify-center gap-2",
                    todayHours >= (currentShiftInfo?.minHours || 4) ? 'text-primary' : 'text-red-500'
                  )}>
                    {todayHours.toFixed(1)}h
                    {todayHours >= (currentShiftInfo?.minHours || 4) && <CheckCircle2 className="w-4 h-4 sm:w-6 sm:h-6" />}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No check-in today</p>
              <p className="text-xs text-muted-foreground mt-1">Use the header button to check in</p>
            </div>
          )}
        </CardContent>
      </Card>
      {/* Shift Info Card */}
      <Card className="border-primary/5 rounded-[2rem] shadow-premium hover:shadow-premium-hover transition-all duration-300">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-black tracking-tight flex items-center gap-3">
            <div className={cn(
              "p-2.5 rounded-2xl shadow-lg",
              userShift === 'Morning' ? "bg-yellow-500 shadow-yellow-500/20" : "bg-primary shadow-primary/20"
            )}>
              {userShift === 'Morning' ? <Sun className="w-5 h-5 text-white" /> : <Moon className="w-5 h-5 text-white" />}
            </div>
            {userShift || 'No'} Shift Assigned
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-muted/30 border border-primary/5 p-4 rounded-2xl space-y-3">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-6 w-24" />
                </div>
              ))}
            </div>
          ) : currentShiftInfo ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div className="bg-muted/30 border border-primary/5 p-4 rounded-2xl group hover:border-primary/20 transition-colors">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1.5">Timing</p>
                <p className="font-bold text-base tracking-tight">{currentShiftInfo.start} - {currentShiftInfo.end}</p>
              </div>
              <div className="bg-muted/30 border border-primary/5 p-4 rounded-2xl group hover:border-yellow-500/20 transition-colors">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1.5">Late After</p>
                <p className="font-bold text-base tracking-tight text-yellow-600">{currentShiftInfo.lateAfter}</p>
              </div>
              <div className="bg-muted/30 border border-primary/5 p-4 rounded-2xl group hover:border-orange-500/20 transition-colors">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1.5">Early Leave Before</p>
                <p className="font-bold text-base tracking-tight text-orange-600">{currentShiftInfo.earlyLeaveBefore}</p>
              </div>
              <div className="bg-muted/30 border border-primary/5 p-4 rounded-2xl group hover:border-primary/20 transition-colors">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1.5">Min Hours</p>
                <p className="font-bold text-base tracking-tight text-primary">{currentShiftInfo.minHours}h</p>
              </div>
            </div>
          ) : shiftTiming ? (
            <div className="bg-primary/5 border border-primary/10 p-4 rounded-2xl flex items-center gap-3">
              <Clock className="w-5 h-5 text-primary" />
              <p className="font-bold text-base tracking-tight">{shiftTiming.start} - {shiftTiming.end}</p>
            </div>
          ) : (
            <div className="bg-muted/30 border border-primary/5 p-5 rounded-2xl flex items-center gap-3 text-muted-foreground">
              <Info className="w-5 h-5" />
              <p className="text-sm font-medium">Contact admin to assign your shift</p>
            </div>
          )}
        </CardContent>
      </Card>



      {/* History with Tabs */}
      <Card className="border-primary/5 rounded-[2rem] shadow-premium hover:shadow-premium-hover transition-all duration-300">
        <CardHeader className="pb-3 px-6 sm:px-8 pt-6 sm:pt-8">
          <CardTitle className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-2xl font-black tracking-tight">Attendance History</span>
            <div className="flex gap-2">
              <Badge variant="secondary" className="h-8 px-4 rounded-xl bg-primary/10 text-primary font-black shadow-soft">Total: {totalHours.toFixed(1)}h</Badge>
              <Badge variant="outline" className="h-8 px-4 rounded-xl border-primary/20 font-bold shadow-soft">{pagination.total} records</Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="calendar" className="w-full">
            <TabsList className="grid w-full grid-cols-2 p-1 bg-muted/30 rounded-2xl h-14 mb-6">
              <TabsTrigger value="calendar" className="gap-2 rounded-xl font-bold transition-all data-[state=active]:shadow-soft data-[state=active]:bg-primary data-[state=active]:text-white">
                <CalendarDays className="w-4 h-4" />
                Calendar
              </TabsTrigger>
              <TabsTrigger value="table" className="gap-2 rounded-xl font-bold transition-all data-[state=active]:shadow-soft data-[state=active]:bg-primary data-[state=active]:text-white">
                <TableIcon className="w-4 h-4" />
                Table
              </TabsTrigger>
            </TabsList>

            <TabsContent value="calendar" className="animate-in fade-in-50 duration-500">
              {user?._id && <AttendanceCalendar userId={user._id} />}
            </TabsContent>

            <TabsContent value="table" className="animate-in fade-in-50 duration-500">
              {isHistoryLoading ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-4 px-2">
                    <Skeleton className="h-10 w-[200px] rounded-xl" />
                    <Skeleton className="h-10 w-[100px] rounded-xl" />
                  </div>
                  <div className="rounded-[2rem] border border-primary/5 overflow-hidden shadow-soft">
                    <div className="h-14 bg-muted/30 border-b border-primary/5 px-6 flex items-center">
                      <Skeleton className="h-4 w-full rounded-full" />
                    </div>
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-20 border-b border-primary/5 px-6 flex items-center gap-6">
                        <Skeleton className="h-4 w-28 rounded-full" />
                        <Skeleton className="h-4 w-24 rounded-full" />
                        <Skeleton className="h-4 w-28 rounded-full" />
                        <Skeleton className="h-4 w-28 rounded-full" />
                        <Skeleton className="h-4 w-20 rounded-full" />
                        <Skeleton className="h-8 w-24 rounded-full" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-20 bg-muted/10 rounded-3xl border border-dashed border-primary/10">
                  <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                  <p className="text-lg font-bold text-muted-foreground/50">No records found</p>
                </div>
              ) : (
                <div className="rounded-3xl border border-primary/5 overflow-hidden shadow-soft">
                  <Table
                    columns={columns}
                    dataSource={history.map(item => ({ ...item, key: item._id }))}
                    pagination={{
                      current: pagination.current,
                      pageSize: pagination.pageSize,
                      total: pagination.total,
                      showSizeChanger: false,
                      className: "px-6 py-4"
                    }}
                    onChange={handleTableChange}
                    size="middle"
                    scroll={{ x: 600 }}
                    className="attendance-table"
                  />
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Attendance;