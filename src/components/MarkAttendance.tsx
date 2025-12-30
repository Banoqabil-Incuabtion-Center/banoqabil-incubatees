import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { CheckCircle2, Clock, Sun, Moon, AlertCircle, XCircle, Loader2 } from "lucide-react"
import { attRepo, AttendanceStatus, AttendanceSettings } from "@/repositories/attRepo"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
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

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

interface Props {
  userId: string
}

const MarkAttendance: React.FC<Props> = ({ userId }) => {
  const queryClient = useQueryClient()

  const { data: attendance, isLoading: isFetching } = useQuery({
    queryKey: ['attendance', 'today', userId],
    queryFn: () => attRepo.getTodayStatus(userId),
    enabled: !!userId,
  })

  const { data: shiftInfo } = useQuery({
    queryKey: ['attendance', 'shift-info'],
    queryFn: () => attRepo.getShiftInfo(),
    enabled: !!userId,
  })

  const checkInMutation = useMutation({
    mutationFn: (uid: string) => attRepo.checkIn(uid),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
      toast.success(res.message || "Checked in successfully!")
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Check-in failed")
    }
  })

  const checkOutMutation = useMutation({
    mutationFn: (uid: string) => attRepo.checkOut(uid),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
      toast.success(res.message || "Checked out successfully!")
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Check-out failed")
    }
  })

  const handleCheckIn = () => checkInMutation.mutate(userId)
  const handleCheckOut = () => checkOutMutation.mutate(userId)

  const isLoading = checkInMutation.isPending || checkOutMutation.isPending

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
      <div className="flex gap-1 sm:gap-2 items-center order-2 md:order-1">
        {/* User Shift Info - shown on all screens but compact on mobile */}
        {userShift && (
          <div className="flex items-center gap-1.5 sm:gap-3 px-3 py-1.5 rounded-xl bg-primary/5 border border-primary/10 shadow-soft">
            <div className={cn(
              "p-1 rounded-lg",
              userShift === 'Morning' ? "bg-yellow-500/10" : "bg-primary/10"
            )}>
              {userShift === 'Morning' ? (
                <Sun className="w-3.5 h-3.5 text-yellow-500" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-primary" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-tight leading-none text-muted-foreground/60">{userShift} Shift</span>
              {shiftTiming && (
                <span className="text-[10px] sm:text-xs font-bold text-primary leading-none mt-0.5">{shiftTiming.start}-{shiftTiming.end}</span>
              )}
            </div>
          </div>
        )}
        {/* Warnings */}
        {!userShift && !isCheckedIn && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-yellow-500/5 border border-yellow-500/10">
            <AlertCircle className="w-3.5 h-3.5 text-yellow-600" />
            <p className="text-[10px] sm:text-xs font-bold text-yellow-700">No shift assigned</p>
          </div>
        )}
        {userShift && !canCheckIn && !isCheckedIn && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/30 border border-primary/5">
            <Clock className="w-3.5 h-3.5 text-muted-foreground/60" />
            <p className="text-[10px] sm:text-xs font-bold text-muted-foreground/60">
              <span className="hidden sm:inline">Check-in during shift hours only</span>
              <span className="sm:hidden">Shift hours only</span>
            </p>
          </div>
        )}
      </div>
      {/* Action Buttons */}
      <div className="flex gap-2 items-center flex-wrap order-1 md:order-2">
        {!isCheckedIn && (
          <Button
            onClick={handleCheckIn}
            disabled={isLoading || !canCheckIn}
            size="sm"
            className="h-10 px-5 rounded-xl gap-2 font-black tracking-tight shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-95 transition-all"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative rounded-full h-2 w-2 bg-white"></span>
            </span>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Check In"}
          </Button>
        )}

        {isCheckedIn && !isCheckedOut && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                disabled={isLoading}
                variant="destructive"
                size="sm"
                className="h-10 px-5 rounded-xl gap-2 font-black tracking-tight shadow-lg shadow-destructive/20 hover:shadow-destructive/30 active:scale-95 transition-all"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative rounded-full h-2 w-2 bg-white"></span>
                </span>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Check Out"}
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
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap ml-1">
            {attendance?.isLate && (
              <Badge className="h-7 px-3 bg-yellow-500 hover:bg-yellow-600 font-bold tracking-tight shadow-soft">
                <AlertCircle className="w-3 h-3 mr-1.5" />Late
              </Badge>
            )}

            {isCheckedOut && (
              <>
                {attendance?.isEarlyLeave && (
                  <Badge className="h-7 px-3 bg-orange-500 hover:bg-orange-600 font-bold tracking-tight shadow-soft">Early</Badge>
                )}

                <Badge className={cn(
                  "h-7 px-3 font-bold tracking-tight shadow-soft",
                  getStatusColor(attendance?.status || '')
                )}>
                  {attendance?.status}
                </Badge>

                {attendance?.hoursWorked !== undefined && (
                  <Badge variant="outline" className="h-7 px-3 rounded-lg border-primary/20 bg-primary/5 text-primary font-bold tracking-tight flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    {attendance.hoursWorked.toFixed(1)}h
                  </Badge>
                )}
              </>
            )}

            {!isCheckedOut && attendance?.status?.includes('No Checkout') && (
              <Badge className="h-7 px-3 bg-red-500 hover:bg-red-600 font-bold tracking-tight shadow-soft">
                <XCircle className="w-3 h-3 mr-1.5" />No Checkout
              </Badge>
            )}
          </div>
        )}

        {isCheckedOut && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-xl">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="text-green-700 text-xs font-black uppercase tracking-tight">Shift Done</span>
          </div>
        )}
      </div>


    </div>
  )
}

export default MarkAttendance
