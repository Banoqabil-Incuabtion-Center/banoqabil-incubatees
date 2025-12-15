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

    const fetchCalendarData = async (month?: number, year?: number) => {
        if (!userId) return
        setIsLoading(true)
        try {
            const res = await attRepo.getCalendarHistory(userId, month, year)
            setRecords(res.records)
            setStats(res.stats)
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
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <CalendarDays className="w-5 h-5" />
                    {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </h3>
                <div className="flex gap-1">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handlePreviousMonth}
                        disabled={startDate && currentMonth <= startDate}
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleNextMonth}
                        disabled={currentMonth.getMonth() === new Date().getMonth() && currentMonth.getFullYear() === new Date().getFullYear()}
                    >
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Custom Calendar Grid */}
            <Card>
                <CardContent className="p-2 sm:p-4">
                    {/* Weekday headers */}
                    <div className="grid grid-cols-7 mb-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="text-center text-xs sm:text-sm text-muted-foreground font-medium py-2">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar days */}
                    <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map((day, index) => {
                            if (!day) {
                                return <div key={`empty-${index}`} className="aspect-square" />
                            }

                            const dateKey = day.toDateString()
                            const record = recordMap.get(dateKey)
                            const isToday = day.toDateString() === new Date().toDateString()
                            const isFuture = day > today

                            return (
                                <button
                                    key={dateKey}
                                    onClick={() => handleDayClick(day)}
                                    disabled={isFuture || !record}
                                    className={`
                    aspect-square flex flex-col items-center justify-center rounded-lg text-sm
                    transition-all duration-200 relative
                    ${isToday ? 'ring-2 ring-primary ring-offset-1' : ''}
                    ${isFuture ? 'text-muted-foreground/40 cursor-default' : ''}
                    ${record ? 'cursor-pointer hover:bg-accent' : 'cursor-default'}
                  `}
                                >
                                    <span className={`font-medium ${isToday ? 'text-primary' : ''}`}>
                                        {day.getDate()}
                                    </span>
                                    {record && (
                                        <span className={`w-2 h-2 rounded-full mt-0.5 ${getStatusColor(record.status)}`} />
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 justify-center text-xs sm:text-sm">
                <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-green-500"></span>
                    <span>Present</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                    <span>Late</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                    <span>Early Leave</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-500"></span>
                    <span>Absent/No Checkout</span>
                </div>
            </div>

            {/* Detail Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CalendarDays className="w-5 h-5" />
                            {selectedRecord && formatDate(selectedRecord.createdAt)}
                        </DialogTitle>
                    </DialogHeader>
                    {selectedRecord && (
                        <div className="space-y-4">
                            {/* Shift */}
                            <div className="flex items-center gap-2 text-sm">
                                {selectedRecord.shift === 'Morning' ? (
                                    <Sun className="w-5 h-5 text-yellow-500" />
                                ) : (
                                    <Moon className="w-5 h-5 text-blue-500" />
                                )}
                                <span className="font-medium">{selectedRecord.shift} Shift</span>
                            </div>

                            {/* Times */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg text-center">
                                    <p className="text-xs text-muted-foreground mb-1">Check In</p>
                                    <p className="font-bold text-green-600 flex items-center justify-center gap-1">
                                        {formatTime(selectedRecord.checkInTime)}
                                        {selectedRecord.isLate && <AlertCircle className="w-3 h-3 text-yellow-500" />}
                                    </p>
                                </div>
                                <div className={`p-3 rounded-lg text-center ${selectedRecord.checkOutTime ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                                    <p className="text-xs text-muted-foreground mb-1">Check Out</p>
                                    <p className={`font-bold ${selectedRecord.checkOutTime ? 'text-blue-600' : 'text-red-600'} flex items-center justify-center gap-1`}>
                                        {selectedRecord.checkOutTime ? formatTime(selectedRecord.checkOutTime) : 'Missing'}
                                        {selectedRecord.isEarlyLeave && <AlertCircle className="w-3 h-3 text-orange-500" />}
                                    </p>
                                </div>
                            </div>

                            {/* Hours & Status */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm">
                                        Hours: <span className={`font-bold ${(selectedRecord.hoursWorked || 0) >= 4 ? 'text-green-600' : 'text-red-600'}`}>
                                            {(selectedRecord.hoursWorked || 0).toFixed(1)}h
                                        </span>
                                    </span>
                                </div>
                                <Badge className={`${getStatusColor(selectedRecord.status)}`}>
                                    {selectedRecord.status}
                                </Badge>
                            </div>

                            {/* Flags */}
                            <div className="flex flex-wrap gap-2">
                                {selectedRecord.isLate && (
                                    <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                                        <AlertCircle className="w-3 h-3 mr-1" /> Late Arrival
                                    </Badge>
                                )}
                                {selectedRecord.isEarlyLeave && (
                                    <Badge variant="outline" className="text-orange-600 border-orange-300">
                                        <XCircle className="w-3 h-3 mr-1" /> Early Leave
                                    </Badge>
                                )}
                                {!selectedRecord.isLate && !selectedRecord.isEarlyLeave && selectedRecord.status === 'Present' && (
                                    <Badge variant="outline" className="text-green-600 border-green-300">
                                        <CheckCircle2 className="w-3 h-3 mr-1" /> Perfect Attendance
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
