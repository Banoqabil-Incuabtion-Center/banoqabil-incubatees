import React, { useEffect, useState, useMemo } from "react";
import dayjs from "dayjs";
import { calendarRepo } from "@/repositories/calendarRepo";
import type { CalendarEntry } from "@/repositories/calendarRepo";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    CalendarDays,
    Info,
    MapPin,
    Clock,
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    AlertCircle,
    CheckCircle2,
    XCircle
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// Define event types and colors map for Badge variants or styles
const EVENT_TYPES = {
    Holiday: "destructive", // Red
    Event: "default",      // Primary
    Meeting: "secondary",  // Gray
    "Working Day": "outline", // Outline
    Other: "secondary",
} as const;

const UserCalendar: React.FC = () => {
    const [entries, setEntries] = useState<CalendarEntry[]>([]);
    const [workingDays, setWorkingDays] = useState<number[]>([1, 2, 3, 4, 5]);
    const [currentMonth, setCurrentMonth] = useState(dayjs());
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedEntry, setSelectedEntry] = useState<CalendarEntry | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch entries
    const fetchEntries = async () => {
        setIsLoading(true);
        try {
            const res = await calendarRepo.getEntries();
            setEntries(res.data);
            if (res.workingDays) {
                setWorkingDays(res.workingDays);
            }
        } catch (error) {
            toast.error("Failed to fetch calendar entries");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchSettings = async () => {
        try {
            const res = await calendarRepo.getSettings();
            if (res.data?.workingDays) {
                setWorkingDays(res.data.workingDays);
            }
        } catch (error) {
            console.error("Failed to fetch settings", error);
        }
    }

    useEffect(() => {
        fetchEntries();
        fetchSettings();
    }, []);

    // Create a map of date -> entries for quick lookup
    const entryMap = useMemo(() => {
        const map = new Map<string, CalendarEntry[]>();
        entries.forEach(entry => {
            const dateKey = dayjs(entry.startDate).format("YYYY-MM-DD");
            if (!map.has(dateKey)) {
                map.set(dateKey, []);
            }
            map.get(dateKey)?.push(entry);
        });
        return map;
    }, [entries]);

    const handlePreviousMonth = () => {
        setCurrentMonth(prev => prev.subtract(1, 'month'));
    };

    const handleNextMonth = () => {
        setCurrentMonth(prev => prev.add(1, 'month'));
    };

    const generateCalendarDays = () => {
        const startOfMonth = currentMonth.startOf('month');
        const endOfMonth = currentMonth.endOf('month');
        const startDayOfWeek = startOfMonth.day();

        const days: (dayjs.Dayjs | null)[] = [];

        // Add empty cells for days before first day of month
        for (let i = 0; i < startDayOfWeek; i++) {
            days.push(null);
        }

        // Add all days of month
        for (let d = 1; d <= endOfMonth.date(); d++) {
            days.push(startOfMonth.date(d));
        }

        return days;
    };

    const calendarDays = generateCalendarDays();
    const today = dayjs().startOf('day');

    const handleDayClick = (day: dayjs.Dayjs) => {
        const dateKey = day.format("YYYY-MM-DD");
        const dayEntries = entryMap.get(dateKey);
        if (dayEntries && dayEntries.length > 0) {
            setSelectedEntry(dayEntries[0]); // Default to first entry for simple click
            setIsDialogOpen(true);
        }
    };

    const handleViewEntry = (entry: CalendarEntry) => {
        setSelectedEntry(entry);
        setIsDialogOpen(true);
    };

    const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="flex flex-col gap-5 p-4 sm:p-6 max-w-7xl mx-auto animate-in fade-in duration-500 pb-20">

            {/* Working Days Card */}
            <Card className="border-primary/5 rounded-2xl sm:rounded-[2rem] shadow-premium hover:shadow-premium-hover transition-all duration-300">
                <CardHeader className="pb-3 px-6 pt-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-primary/10 text-primary shadow-soft">
                            <Info className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-black tracking-tight">Working Days</CardTitle>
                            <CardDescription className="font-medium">Official working days for this month.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                    <div className="flex flex-wrap gap-2 items-center">
                        {DAYS_OF_WEEK.map((label, index) => (
                            <div
                                key={label}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                    workingDays.includes(index)
                                        ? "bg-primary/10 text-primary border border-primary/20 shadow-soft"
                                        : "bg-muted text-muted-foreground/40 border border-transparent opacity-50"
                                )}
                            >
                                {label}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Calendar Main Section */}
            <div className="space-y-4">
                {/* Custom Header */}
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-2xl font-black tracking-tight flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-primary/10 text-primary shadow-soft">
                            <CalendarDays className="w-6 h-6" />
                        </div>
                        {currentMonth.format("MMMM YYYY")}
                    </h3>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-11 w-11 rounded-xl border-primary/10 shadow-soft hover:bg-primary/5 hover:text-primary transition-all active:scale-95"
                            onClick={handlePreviousMonth}
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-11 w-11 rounded-xl border-primary/10 shadow-soft hover:bg-primary/5 hover:text-primary transition-all active:scale-95"
                            onClick={handleNextMonth}
                        >
                            <ChevronRight className="w-5 h-5" />
                        </Button>
                    </div>
                </div>

                <Card className="border-primary/5 rounded-[2rem] shadow-premium overflow-hidden">
                    <CardContent className="p-4 sm:p-8">
                        {isLoading ? (
                            <div className="space-y-6">
                                <div className="grid grid-cols-7 gap-4">
                                    {[...Array(7)].map((_, i) => (
                                        <Skeleton key={i} className="h-4 w-full rounded-full" />
                                    ))}
                                </div>
                                <div className="grid grid-cols-7 gap-4">
                                    {[...Array(35)].map((_, i) => (
                                        <Skeleton key={i} className="aspect-square rounded-[1.5rem]" />
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Weekday headers */}
                                <div className="grid grid-cols-7 mb-6">
                                    {DAYS_OF_WEEK.map(day => (
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

                                        const dateKey = day.format("YYYY-MM-DD");
                                        const dayEntries = entryMap.get(dateKey) || [];
                                        const isToday = day.isSame(today, 'day');
                                        const isWorkingDay = workingDays.includes(day.day());

                                        return (
                                            <div
                                                key={dateKey}
                                                onClick={() => dayEntries.length > 0 && handleDayClick(day)}
                                                className={cn(
                                                    "aspect-square flex flex-col items-center justify-center rounded-[1.5rem] text-sm sm:text-lg transition-all duration-300 relative border group",
                                                    isToday ? "ring-2 ring-primary ring-offset-2 border-primary bg-primary/5" : "border-transparent",
                                                    dayEntries.length > 0
                                                        ? "cursor-pointer hover:bg-primary/10 hover:border-primary/20 hover:shadow-soft"
                                                        : !isWorkingDay
                                                            ? "bg-muted/30 text-muted-foreground/40 cursor-default border-dashed border-muted-foreground/10"
                                                            : "cursor-default text-foreground/80"
                                                )}
                                            >
                                                <span className={cn(
                                                    "font-black tracking-tight",
                                                    isToday ? "text-primary" : ""
                                                )}>
                                                    {day.date()}
                                                </span>

                                                {/* Entry Dots */}
                                                <div className="flex gap-1 mt-2">
                                                    {dayEntries.map((entry, i) => (
                                                        <div
                                                            key={entry._id}
                                                            className={cn(
                                                                "w-1.5 h-1.5 rounded-full shadow-sm group-hover:scale-125 transition-transform",
                                                                entry.type === 'Holiday' ? "bg-destructive" : "bg-primary"
                                                            )}
                                                        />
                                                    ))}
                                                </div>

                                                {!isWorkingDay && dayEntries.length === 0 && (
                                                    <span className="absolute bottom-2 text-[8px] font-black uppercase text-muted-foreground/30">Off</span>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Legend */}
                <div className="flex flex-wrap gap-4 justify-center py-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 rounded-full border border-primary/10 shadow-soft">
                        <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
                        <span className="text-[11px] font-black uppercase tracking-tight text-primary/70">Event / Meeting</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-destructive/5 rounded-full border border-destructive/10 shadow-soft">
                        <span className="w-2.5 h-2.5 rounded-full bg-destructive"></span>
                        <span className="text-[11px] font-black uppercase tracking-tight text-destructive/70">Holiday</span>
                    </div>
                </div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-md rounded-[2.5rem] border-primary/5 p-8 shadow-premium animate-in zoom-in-95 duration-300">
                    <DialogHeader className="mb-6">
                        <DialogTitle className="flex items-center gap-3 text-2xl font-black tracking-tight">
                            <div className="p-2.5 rounded-2xl bg-primary/10 text-primary shadow-soft">
                                <CalendarIcon className="w-6 h-6" />
                            </div>
                            <span className="leading-tight">Event Details</span>
                        </DialogTitle>
                    </DialogHeader>

                    {selectedEntry && (
                        <div className="space-y-6">
                            {/* Header Info */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Badge
                                        variant={EVENT_TYPES[selectedEntry.type as keyof typeof EVENT_TYPES] as any || "default"}
                                        className="rounded-full px-4 h-7 text-[10px] font-black uppercase tracking-widest shadow-soft"
                                    >
                                        {selectedEntry.type}
                                    </Badge>
                                    <Badge variant="outline" className="rounded-full px-4 h-7 text-[10px] font-bold text-muted-foreground shadow-soft border-muted-foreground/20">
                                        {selectedEntry.status}
                                    </Badge>
                                </div>
                                <h1 className="text-2xl font-black tracking-tight leading-tight">{selectedEntry.title}</h1>
                            </div>

                            {/* Detail Cards */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-2xl border border-primary/5 shadow-soft">
                                    <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                                        <Clock className="w-5 h-5" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Date & Time</span>
                                        <div className="flex flex-col text-sm font-bold">
                                            <span>{dayjs(selectedEntry.startDate).format("MMM D, YYYY")}</span>
                                            <span className="text-primary">{dayjs(selectedEntry.startDate).format("h:mm A")} - {dayjs(selectedEntry.endDate).format("h:mm A")}</span>
                                        </div>
                                    </div>
                                </div>

                                {selectedEntry.location && (
                                    <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-2xl border border-primary/5 shadow-soft">
                                        <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                                            <MapPin className="w-5 h-5" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Location</span>
                                            <span className="text-sm font-bold">{selectedEntry.location}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Description */}
                            {selectedEntry.description && (
                                <div className="space-y-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-2">Description</span>
                                    <div className="bg-primary/5 p-5 rounded-3xl border border-primary/10 shadow-soft">
                                        <p className="text-sm text-foreground/80 leading-relaxed font-medium">
                                            {selectedEntry.description}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Flags */}
                            <div className="flex flex-wrap gap-2">
                                {selectedEntry.recurrence !== 'None' && (
                                    <Badge variant="outline" className="h-7 px-3 rounded-lg border-primary/20 bg-primary/5 text-primary font-bold shadow-soft">
                                        <CalendarIcon className="w-3.5 h-3.5 mr-1.5" /> {selectedEntry.recurrence}
                                    </Badge>
                                )}
                                {selectedEntry.status === 'Completed' ? (
                                    <Badge variant="outline" className="h-7 px-3 rounded-lg border-green-200 bg-green-50 text-green-700 font-bold shadow-soft">
                                        <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Event Finished
                                    </Badge>
                                ) : selectedEntry.status === 'Upcoming' ? (
                                    <Badge variant="outline" className="h-7 px-3 rounded-lg border-blue-200 bg-blue-50 text-blue-700 font-bold shadow-soft">
                                        <AlertCircle className="w-3.5 h-3.5 mr-1.5" /> Scheduled
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="h-7 px-3 rounded-lg border-red-200 bg-red-50 text-red-700 font-bold shadow-soft">
                                        <XCircle className="w-3.5 h-3.5 mr-1.5" /> Cancelled
                                    </Badge>
                                )}
                            </div>
                        </div>
                    )}

                    <DialogFooter className="mt-8">
                        <Button
                            type="button"
                            onClick={() => setIsDialogOpen(false)}
                            className="w-full h-12 rounded-2xl font-black tracking-tight shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
                        >
                            Confirm & Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default UserCalendar;
