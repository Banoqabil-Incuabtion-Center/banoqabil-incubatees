import React, { useEffect, useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Sun, Moon, Clock, CheckCircle2, XCircle, AlertCircle,
    ChevronLeft, ChevronRight, CalendarDays
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { attRepo, HistoryRecord, CalendarStats } from "@/repositories/attRepo"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface Props {
    userId: string
}

const AttendanceCalendar: React.FC<Props> = ({ userId }) => {
    const [records, setRecords] = useState<HistoryRecord[]>([])
    const [stats, setStats] = useState<CalendarStats | null>(null)
    const [startDate, setStartDate] = useState<Date | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [selectedRecord, setSelectedRecord] = useState<HistoryRecord | null>(null)
    const [dialogOpen, setDialogOpen] = useState(false)

    const [workingDays, setWorkingDays] = useState<number[]>([1, 2, 3, 4, 5]) // Default Mon-Fri

    const fetchCalendarData = async (month?: number, year?: number) => {
        if (!userId) return
        setIsLoading(true)
        try {
            const res = await attRepo.getCalendarHistory(userId, month, year)
            setRecords(res.records)
            setStats(res.stats)
            if (res.user?.workingDays) {
                setWorkingDays(res.user.workingDays)
            }
            if (res.startDate) {
                setStartDate(new Date(res.startDate))
            }
        } catch (err) {
            console.error("Error fetching calendar data:", err)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchCalendarData(currentMonth.getMonth() + 1, currentMonth.getFullYear())
    }, [userId, currentMonth])

    // Create a map of date -> record for quick lookup
    const recordMap = useMemo(() => {
        const map = new Map<string, HistoryRecord>()
        records.forEach(record => {
            const dateKey = new Date(record.createdAt).toDateString()
            map.set(dateKey, record)
        })
        return map
    }, [records])

    // Get status color for a date - using backend status directly
    const getStatusColor = (status: string): string => {
        if (!status) return 'bg-gray-400'
        if (status === 'Present') return 'bg-green-500'
        if (status === 'Late') return 'bg-yellow-500'
        if (status === 'Early Leave') return 'bg-orange-500'
        if (status === 'Late + Early Leave') return 'bg-red-500'
        if (status.includes('No Checkout')) return 'bg-red-500'
        if (status === 'Incomplete') return 'bg-gray-500'
        if (status === 'Absent') return 'bg-red-500'
        return 'bg-green-500'
    }

    const handlePreviousMonth = () => {
        setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
    }

    const handleNextMonth = () => {
        const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
        if (nextMonth <= new Date()) {
            setCurrentMonth(nextMonth)
        }
    }

    const formatTime = (dateStr: string | null) => {
        if (!dateStr) return "—"
        return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("en-GB", {
            weekday: 'long',
            day: "2-digit",
            month: "long",
            year: "numeric"
        })
    }

    // Generate calendar days
    const generateCalendarDays = () => {
        const year = currentMonth.getFullYear()
        const month = currentMonth.getMonth()

        // First day of month
        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)

        // Day of week for first day (0 = Sunday)
        const startDayOfWeek = firstDay.getDay()

        const days: (Date | null)[] = []

        // Add empty cells for days before first day of month
        for (let i = 0; i < startDayOfWeek; i++) {
            days.push(null)
        }

        // Add all days of month
        for (let d = 1; d <= lastDay.getDate(); d++) {
            days.push(new Date(year, month, d))
        }

        return days
    }

    const calendarDays = generateCalendarDays()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const handleDayClick = (day: Date) => {
        const dateKey = day.toDateString()
        const record = recordMap.get(dateKey)
        if (record) {
            setSelectedRecord(record)
            setDialogOpen(true)
        }
    }

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-8 w-32" />
                    <div className="flex gap-2">
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                    </div>
                </div>
                <Skeleton className="h-[350px] w-full rounded-lg" />
                <div className="grid grid-cols-4 gap-2">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-16 rounded-lg" />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Calendar Header */}
            <div className="flex items-center justify-between px-2">
                <h3 className="text-xl font-black tracking-tight flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-primary/10 text-primary shadow-soft">
                        <CalendarDays className="w-5 h-5" />
                    </div>
                    {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </h3>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 rounded-xl border-primary/10 shadow-soft hover:bg-primary/5 hover:text-primary transition-all active:scale-95"
                        onClick={handlePreviousMonth}
                        disabled={startDate && currentMonth <= startDate}
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 rounded-xl border-primary/10 shadow-soft hover:bg-primary/5 hover:text-primary transition-all active:scale-95"
                        onClick={handleNextMonth}
                        disabled={currentMonth.getMonth() === new Date().getMonth() && currentMonth.getFullYear() === new Date().getFullYear()}
                    >
                        <ChevronRight className="w-5 h-5" />
                    </Button>
                </div>
            </div>

            {/* Custom Calendar Grid */}
            <Card className="border-primary/5 rounded-[2rem] shadow-premium overflow-hidden">
                <CardContent className="p-4 sm:p-8">
                    {/* Weekday headers */}
                    <div className="grid grid-cols-7 mb-4">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="text-center text-xs font-black uppercase tracking-widest text-muted-foreground/40 py-2">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar days */}
                    <div className="grid grid-cols-7 gap-2 sm:gap-4">
                        {calendarDays.map((day, index) => {
                            if (!day) {
                                return <div key={`empty-${index}`} className="aspect-square" />
                            }

                            const dateKey = day.toDateString()
                            const record = recordMap.get(dateKey)
                            const isToday = day.toDateString() === new Date().toDateString()
                            const isFuture = day > today
                            const isWorkingDay = workingDays.includes(day.getDay())

                            return (
                                <button
                                    key={dateKey}
                                    onClick={() => handleDayClick(day)}
                                    disabled={isFuture || (!record && !isWorkingDay)}
                                    className={cn(
                                        "aspect-square flex flex-col items-center justify-center rounded-[1.5rem] text-sm sm:text-base transition-all duration-300 relative border group",
                                        isToday ? "ring-2 ring-primary ring-offset-2 border-primary bg-primary/5" : "border-transparent",
                                        isFuture ? "text-muted-foreground/20 cursor-default" : "text-foreground",
                                        record
                                            ? "cursor-pointer hover:bg-primary/10 hover:border-primary/20 hover:shadow-soft"
                                            : !isWorkingDay && !isFuture
                                                ? "bg-muted/30 text-muted-foreground/40 cursor-default border-dashed border-muted-foreground/10" // Visual for Off Day
                                                : "cursor-default"
                                    )}
                                >
                                    <span className={cn(
                                        "font-black tracking-tight",
                                        isToday ? "text-primary" : ""
                                    )}>
                                        {day.getDate()}
                                    </span>
                                    {record && record.status === 'Absent' ? (
                                        <span className="text-[9px] font-bold uppercase text-red-500 mt-1">Absent</span>
                                    ) : record && (
                                        <div className={cn(
                                            "w-1.5 h-1.5 rounded-full mt-1.5 shadow-sm group-hover:scale-125 transition-transform",
                                            getStatusColor(record.status)
                                        )} />
                                    )}
                                    {!record && !isWorkingDay && !isFuture && (
                                        <span className="text-[9px] font-bold uppercase text-muted-foreground/30 mt-0.5">Off</span>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 justify-center py-2">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/5 rounded-full border border-green-500/10">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-sm shadow-green-500/20"></span>
                    <span className="text-[11px] font-black uppercase tracking-tight text-green-700/70">Present</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/5 rounded-full border border-yellow-500/10">
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 shadow-sm shadow-yellow-500/20"></span>
                    <span className="text-[11px] font-black uppercase tracking-tight text-yellow-700/70">Late</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/5 rounded-full border border-orange-500/10">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-sm shadow-orange-500/20"></span>
                    <span className="text-[11px] font-black uppercase tracking-tight text-orange-700/70">Early</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/5 rounded-full border border-red-500/10">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500/20"></span>
                    <span className="text-[11px] font-black uppercase tracking-tight text-red-700/70">Absent/Missing</span>
                </div>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-md rounded-[2rem] border-primary/5 p-8 shadow-premium animate-in zoom-in-95 duration-300">
                    <DialogHeader className="mb-6">
                        <DialogTitle className="flex items-center gap-3 text-2xl font-black tracking-tight">
                            <div className="p-2.5 rounded-2xl bg-primary/10 text-primary shadow-soft">
                                <CalendarDays className="w-6 h-6" />
                            </div>
                            <span className="leading-tight">{selectedRecord && formatDate(selectedRecord.createdAt)}</span>
                        </DialogTitle>
                    </DialogHeader>
                    {selectedRecord && (
                        <div className="space-y-4">
                            {/* Shift */}
                            <div className="flex items-center gap-3 bg-muted/30 p-4 rounded-2xl border border-primary/5">
                                <div className={cn(
                                    "p-2 rounded-xl shadow-md",
                                    selectedRecord.shift === 'Morning' ? "bg-yellow-500 shadow-yellow-500/20" : "bg-primary shadow-primary/20"
                                )}>
                                    {selectedRecord.shift === 'Morning' ? (
                                        <Sun className="w-5 h-5 text-white" />
                                    ) : (
                                        <Moon className="w-5 h-5 text-white" />
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Assigned Shift</span>
                                    <span className="font-bold text-lg leading-none">{selectedRecord.shift} Shift</span>
                                </div>
                            </div>

                            {/* Times */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-green-50/50 dark:bg-green-900/10 p-5 rounded-2xl text-center border border-green-100 dark:border-green-900/20 shadow-soft">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-green-600/60 dark:text-green-400/60 mb-1.5">Check In</p>
                                    <p className="font-black text-xl text-green-700 dark:text-green-300 flex items-center justify-center gap-2">
                                        {formatTime(selectedRecord.checkInTime)}
                                        {selectedRecord.isLate && <AlertCircle className="w-4 h-4 text-yellow-500" />}
                                    </p>
                                </div>
                                <div className={cn(
                                    "p-5 rounded-2xl text-center border shadow-soft",
                                    selectedRecord.checkOutTime ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/20' : 'bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-900/20'
                                )}>
                                    <p className={cn(
                                        "text-[10px] font-black uppercase tracking-widest mb-1.5",
                                        selectedRecord.checkOutTime ? "text-blue-600/60 dark:text-blue-400/60" : "text-red-600/60 dark:text-red-400/60"
                                    )}>Check Out</p>
                                    <p className={cn(
                                        "font-black text-xl flex items-center justify-center gap-2",
                                        selectedRecord.checkOutTime ? 'text-blue-700 dark:text-blue-300' : 'text-red-600'
                                    )}>
                                        {selectedRecord.checkOutTime ? formatTime(selectedRecord.checkOutTime) : 'Missing'}
                                        {selectedRecord.isEarlyLeave && <AlertCircle className="w-4 h-4 text-orange-500" />}
                                    </p>
                                </div>
                            </div>

                            {/* Hours & Status */}
                            <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10 shadow-soft">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/20 rounded-lg">
                                        <Clock className="w-4 h-4 text-primary" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">Duration</span>
                                        <span className={cn(
                                            "font-black text-lg leading-none",
                                            (selectedRecord.hoursWorked || 0) >= 4 ? 'text-primary' : 'text-red-600'
                                        )}>
                                            {(selectedRecord.hoursWorked || 0).toFixed(1)}h
                                        </span>
                                    </div>
                                </div>
                                <Badge className={cn(
                                    "h-8 px-4 rounded-xl font-bold tracking-tight shadow-soft",
                                    getStatusColor(selectedRecord.status)
                                )}>
                                    {selectedRecord.status}
                                </Badge>
                            </div>

                            {/* Flags */}
                            <div className="flex flex-wrap gap-2 pt-2">
                                {selectedRecord.isLate && (
                                    <Badge variant="outline" className="h-7 px-3 rounded-lg border-yellow-200 bg-yellow-50 text-yellow-700 font-bold shadow-soft">
                                        <AlertCircle className="w-3.5 h-3.5 mr-1.5" /> Late Arrival
                                    </Badge>
                                )}
                                {selectedRecord.isEarlyLeave && (
                                    <Badge variant="outline" className="h-7 px-3 rounded-lg border-orange-200 bg-orange-50 text-orange-700 font-bold shadow-soft">
                                        <XCircle className="w-3.5 h-3.5 mr-1.5" /> Early Leave
                                    </Badge>
                                )}
                                {!selectedRecord.isLate && !selectedRecord.isEarlyLeave && selectedRecord.status === 'Present' && (
                                    <Badge variant="outline" className="h-7 px-3 rounded-lg border-green-200 bg-green-50 text-green-700 font-bold shadow-soft">
                                        <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Perfect Attendance
                                    </Badge>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default AttendanceCalendar
