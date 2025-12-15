import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { CheckCircle2, Clock, Sun, Moon, AlertCircle, XCircle, Loader2 } from "lucide-react"
import { attRepo, AttendanceStatus, AttendanceSettings } from "@/repositories/attRepo"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface Props {
  userId: string
}

const MarkAttendance: React.FC<Props> = ({ userId }) => {
  const [attendance, setAttendance] = useState<AttendanceStatus | null>(null)
  const [shiftInfo, setShiftInfo] = useState<AttendanceSettings | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return

      try {
        setIsFetching(true)
        const [statusRes, shiftRes] = await Promise.all([
          attRepo.getTodayStatus(userId),
          attRepo.getShiftInfo()
        ])
        setAttendance(statusRes)
        setShiftInfo(shiftRes)
      } catch (err) {
        console.error("Error fetching attendance:", err)
      } finally {
        setIsFetching(false)
      }
    }
    fetchData()
  }, [userId])

  const handleCheckIn = async () => {
    setIsLoading(true)
    try {
      const res = await attRepo.checkIn(userId)
      setAttendance(prev => ({
        ...prev,
        ...res.att,
        canCheckIn: false
      }))
      toast.success(res.message || "Checked in successfully!")
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Check-in failed")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCheckOut = async () => {
    setIsLoading(true)
    try {
      const res = await attRepo.checkOut(userId)
      setAttendance(prev => ({
        ...prev,
        ...res.att
      }))
      toast.success(res.message || "Checked out successfully!")
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Check-out failed")
    } finally {
      setIsLoading(false)
    }
  }

  const isCheckedIn = Boolean(attendance?.checkInTime)
  const isCheckedOut = Boolean(attendance?.checkOutTime)
  const userShift = attendance?.userShift
  const canCheckIn = attendance?.canCheckIn ?? true
  const shiftTiming = attendance?.shiftTiming

  const getStatusColor = (status: string) => {
    if (status === 'Present') return 'bg-green-500'
    if (status.includes('Late')) return 'bg-yellow-500'
    if (status.includes('Early')) return 'bg-orange-500'
    if (status.includes('No Checkout')) return 'bg-red-500'
    if (status === 'Incomplete') return 'bg-gray-500'
    return 'bg-blue-500'
  }

  if (isFetching) {
    return (
      <div className="flex gap-2 items-center">
        <Skeleton className="h-8 w-20 rounded-md" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
    )
  }

  return (
    <div className="flex gap-1 sm:gap-2 flex-wrap items-center">
      <div className="flex gap-1 sm:gap-2 items-center">
        {/* User Shift Info - shown on all screens but compact on mobile */}
        {userShift && (
          <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground">
            {userShift === 'Morning' ? (
              <Sun className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-yellow-500" />
            ) : (
              <Moon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-500" />
            )}
            <span className="hidden sm:inline">{userShift}</span>
            {shiftTiming && (
              <span className="text-muted-foreground">{shiftTiming.start}-{shiftTiming.end}</span>
            )}
          </div>
        )}
        {/* Warnings */}
        {!userShift && !isCheckedIn && (
          <p className="text-[10px] sm:text-xs text-yellow-600">No shift</p>
        )}
        {userShift && !canCheckIn && !isCheckedIn && (
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            <span className="hidden sm:inline">Check-in during shift</span>
            <span className="sm:hidden">Shift hours only</span>
          </p>
        )}
      </div>
      {/* Action Buttons */}
      <div className="flex gap-2 items-center  flex-wrap">
        {!isCheckedIn && (
          <Button
            onClick={handleCheckIn}
            disabled={isLoading || !canCheckIn}
            size="sm"
            className="gap-1.5"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute h-full w-full rounded-full bg-green-300 opacity-75"></span>
              <span className="relative rounded-full h-2 w-2 bg-green-300"></span>
            </span>
            {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Check In"}
          </Button>
        )}

        {isCheckedIn && !isCheckedOut && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                disabled={isLoading}
                variant="destructive"
                size="sm"
                className="gap-1.5"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute h-full w-full rounded-full bg-red-300 opacity-75"></span>
                  <span className="relative rounded-full h-2 w-2 bg-red-300"></span>
                </span>
                {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Check Out"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Check Out</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to check out? This action will mark your attendance for today as complete.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleCheckOut} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Yes, Check Out
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {/* Status Badges */}
        {isCheckedIn && (
          <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
            {attendance?.shift && (
              <Badge variant="outline" className="text-[10px] sm:text-xs gap-0.5 sm:gap-1 py-0 px-1 sm:px-2">
                {attendance.shift === 'Morning' ? <Sun className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> : <Moon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
                <span className="hidden xs:inline">{attendance.shift}</span>
              </Badge>
            )}

            {attendance?.isLate && (
              <Badge className="bg-yellow-500 text-[10px] sm:text-xs py-0 px-1 sm:px-2">
                <AlertCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5" />Late
              </Badge>
            )}

            {isCheckedOut && (
              <>
                {attendance?.isEarlyLeave && (
                  <Badge className="bg-orange-500 text-[10px] sm:text-xs py-0 px-1 sm:px-2">Early</Badge>
                )}

                <Badge className={`${getStatusColor(attendance?.status || '')} text-[10px] sm:text-xs py-0 px-1 sm:px-2`}>
                  {attendance?.status}
                </Badge>

                {attendance?.hoursWorked !== undefined && (
                  <Badge variant="outline" className="text-[10px] sm:text-xs py-0 px-1 sm:px-2 gap-0.5 sm:gap-1">
                    <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    {attendance.hoursWorked.toFixed(1)}h
                  </Badge>
                )}
              </>
            )}

            {!isCheckedOut && attendance?.status?.includes('No Checkout') && (
              <Badge className="bg-red-500 text-[10px] sm:text-xs py-0 px-1 sm:px-2">
                <XCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5" />No Checkout
              </Badge>
            )}
          </div>
        )}

        {isCheckedOut && (
          <span className="text-green-600 text-xs flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Done
          </span>
        )}
      </div>


    </div>
  )
}

export default MarkAttendance
