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
      {/* Shift Info Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            {userShift === 'Morning' ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-blue-500" />}
            {userShift || 'No'} Shift Assigned
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-muted/50 p-3 rounded-lg space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-5 w-24" />
                </div>
              ))}
            </div>
          ) : currentShiftInfo ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-muted-foreground text-xs mb-1">Timing</p>
                <p className="font-semibold">{currentShiftInfo.start} - {currentShiftInfo.end}</p>
              </div>
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-muted-foreground text-xs mb-1">Late After</p>
                <p className="font-semibold text-yellow-600">{currentShiftInfo.lateAfter}</p>
              </div>
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-muted-foreground text-xs mb-1">Early Leave Before</p>
                <p className="font-semibold text-orange-600">{currentShiftInfo.earlyLeaveBefore}</p>
              </div>
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-muted-foreground text-xs mb-1">Min Hours</p>
                <p className="font-semibold text-green-600">{currentShiftInfo.minHours}h</p>
              </div>
            </div>
          ) : shiftTiming ? (
            <p className="text-sm">
              <Clock className="w-4 h-4 inline mr-2" />
              {shiftTiming.start} - {shiftTiming.end}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Info className="w-4 h-4" /> Contact admin to assign your shift
            </p>
          )}
        </CardContent>
      </Card>

      {/* Today's Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Today's Attendance
          </CardTitle>
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
                  <div key={i} className="p-3 sm:p-4 rounded-lg bg-muted/50 space-y-2 flex flex-col items-center">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                ))}
              </div>
            </div>
          ) : isCheckedIn ? (
            <div className="space-y-4">
              {/* Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="gap-1">
                  {attendance?.shift === 'Morning' ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
                  {attendance?.shift}
                </Badge>
                {attendance?.isLate && <Badge className="bg-yellow-500"><AlertCircle className="w-3 h-3 mr-1" />Late</Badge>}
                {attendance?.isEarlyLeave && <Badge className="bg-orange-500">Early Leave</Badge>}
                {!isCheckedOut && attendance?.status?.includes('No Checkout') && (
                  <Badge className="bg-red-500"><XCircle className="w-3 h-3 mr-1" />No Checkout</Badge>
                )}
                <Badge className={`${attendance?.status === 'Present' ? 'bg-green-500' :
                  attendance?.status?.includes('Late') ? 'bg-yellow-500' :
                    attendance?.status?.includes('Early') ? 'bg-orange-500' :
                      attendance?.status?.includes('No Checkout') ? 'bg-red-500' :
                        'bg-gray-500'
                  }`}>
                  {attendance?.status}
                </Badge>
              </div>

              {/* Time Cards */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="bg-green-50 dark:bg-green-900/20 p-3 sm:p-4 rounded-lg text-center">
                  <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Check In</p>
                  <p className="text-sm sm:text-lg font-bold">
                    {attendance?.checkInTime
                      ? new Date(attendance.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : "—"}
                  </p>
                </div>

                <div className={`p-3 sm:p-4 rounded-lg text-center ${isCheckedOut ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-yellow-50 dark:bg-yellow-900/20'}`}>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Check Out</p>
                  <p className={`text-sm sm:text-lg font-bold ${!isCheckedOut ? 'text-yellow-600' : ''}`}>
                    {attendance?.checkOutTime
                      ? new Date(attendance.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : "Pending"}
                  </p>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/20 p-3 sm:p-4 rounded-lg text-center">
                  <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Hours</p>
                  <p className={`text-sm sm:text-lg font-bold flex items-center justify-center gap-1 ${todayHours >= 4 ? 'text-green-600' : 'text-red-500'
                    }`}>
                    {todayHours.toFixed(1)}h
                    {todayHours >= 4 && <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4" />}
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

      {/* History with Tabs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span>Attendance History</span>
            <div className="flex gap-2">
              <Badge variant="secondary" className="text-sm">Total: {totalHours.toFixed(1)}h</Badge>
              <Badge variant="outline" className="text-sm">{pagination.total} records</Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="calendar" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="calendar" className="gap-2">
                <CalendarDays className="w-4 h-4" />
                Calendar
              </TabsTrigger>
              <TabsTrigger value="table" className="gap-2">
                <TableIcon className="w-4 h-4" />
                Table
              </TabsTrigger>
            </TabsList>

            <TabsContent value="calendar">
              {user?._id && <AttendanceCalendar userId={user._id} />}
            </TabsContent>

            <TabsContent value="table">
              {isHistoryLoading ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-4">
                    <Skeleton className="h-8 w-[250px]" />
                    <Skeleton className="h-8 w-[100px]" />
                  </div>
                  <div className="rounded-md border">
                    <div className="h-12 border-b px-4 flex items-center">
                      <Skeleton className="h-4 w-full" />
                    </div>
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-16 border-b px-4 flex items-center gap-4">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-6 w-20 rounded-full" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : history.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No records found</p>
              ) : (
                <Table
                  columns={columns}
                  dataSource={history.map(item => ({ ...item, key: item._id }))}
                  pagination={{
                    current: pagination.current,
                    pageSize: pagination.pageSize,
                    total: pagination.total,
                    showSizeChanger: false
                  }}
                  onChange={handleTableChange}
                  size="small"
                  scroll={{ x: 600 }}
                />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Attendance;