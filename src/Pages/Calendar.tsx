import React, { useEffect, useState } from "react";
import { Calendar, ConfigProvider, theme } from "antd";
import type { CalendarProps } from "antd";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
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
import { IconCalendarEvent, IconInfoCircle } from "@tabler/icons-react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

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

    // Cell Render Logic
    const getListData = (value: Dayjs) => {
        const events = entries.filter((entry) => {
            const date = dayjs(entry.startDate);
            return date.isSame(value, 'day');
        });
        return events;
    };

    const cellRender: CalendarProps<Dayjs>['cellRender'] = (current, info) => {
        if (info.type === 'date') {
            const listData = getListData(current);
            const isWorkingDay = workingDays.includes(current.day());

            return (
                <div className="h-full flex flex-col gap-1">
                    {!isWorkingDay && (
                        <div className="absolute top-0 right-0 p-1">
                            <span className="flex h-2 w-2 rounded-full bg-red-500" />
                        </div>
                    )}
                    <ul className="events p-0 m-0 list-none space-y-1">
                        {listData.map((item) => (
                            <li key={item._id} onClick={(e) => { e.stopPropagation(); handleView(item); }}>
                                {/* Using Shadcn Badge inside Antd Cell */}
                                <Badge
                                    variant={EVENT_TYPES[item.type as keyof typeof EVENT_TYPES] as any || "default"}
                                    className="cursor-pointer hover:opacity-80 text-[10px] px-1 py-0 h-auto w-full truncate block"
                                >
                                    {item.title}
                                </Badge>
                            </li>
                        ))}
                    </ul>
                </div>
            );
        }
        return info.originNode;
    };

    const handleView = (entry: CalendarEntry) => {
        setSelectedEntry(entry);
        setIsDialogOpen(true);
    };

    const onSelect = (date: Dayjs, info: { source: 'year' | 'month' | 'customize' | 'date' }) => {
        // Optional: Can verify if there's an event on this date to show something, 
        // but typically clicking the event itself is enough.
        // If users click the empty cell, maybe just show "No events" or nothing.
        // For now, let's do nothing on empty cell click unless user clicks an event.
    };

    const DAYS = [
        { value: 0, label: "Sun" },
        { value: 1, label: "Mon" },
        { value: 2, label: "Tue" },
        { value: 3, label: "Wed" },
        { value: 4, label: "Thu" },
        { value: 5, label: "Fri" },
        { value: 6, label: "Sat" },
    ];

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500 pb-20"> {/* pb-20 for bottom nav */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
                    <p className="text-muted-foreground mt-1">View holidays, events, and working days.</p>
                </div>
            </div>

            <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="px-0 pb-3 pt-0">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <IconInfoCircle className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">Working Days</CardTitle>
                            <CardDescription>Official working days are highlighted.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="px-0">
                    <div className="flex flex-wrap gap-2 items-center">
                        {DAYS.map((day) => (
                            <div
                                key={day.value}
                                className={`
                                    flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs font-medium transition-colors
                                    ${workingDays.includes(day.value)
                                        ? "bg-primary/10 border-primary/20 text-primary"
                                        : "bg-muted/50 border-transparent text-muted-foreground opacity-50"
                                    }
                                `}
                            >
                                {day.label}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <div className="bg-white dark:bg-card rounded-xl border shadow-sm p-4 overflow-hidden">
                <ConfigProvider
                    theme={{
                        token: {
                            colorPrimary: '#0f172a', // Slate 900
                            borderRadius: 8,
                        },
                    }}
                >
                    <Calendar
                        cellRender={cellRender}
                        onSelect={onSelect}
                        className="rounded-md"
                    />
                </ConfigProvider>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[425px] rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {selectedEntry && (
                                <Badge
                                    variant={selectedEntry.type ? (EVENT_TYPES[selectedEntry.type as keyof typeof EVENT_TYPES] as any) : "default"}
                                >
                                    {selectedEntry.type}
                                </Badge>
                            )}
                            <span>Event Details</span>
                        </DialogTitle>
                    </DialogHeader>

                    {selectedEntry && (
                        <div className="space-y-4 py-2">
                            <div>
                                <h3 className="text-lg font-bold leading-none">{selectedEntry.title}</h3>
                                {selectedEntry.location && (
                                    <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                                        📍 {selectedEntry.location}
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-3 p-3 bg-muted/50 rounded-lg text-sm">
                                <div className="grid grid-cols-[80px_1fr] gap-2">
                                    <span className="font-medium text-muted-foreground">Start:</span>
                                    <span>{dayjs(selectedEntry.startDate).format("MMM D, YYYY - h:mm A")}</span>
                                </div>
                                <div className="grid grid-cols-[80px_1fr] gap-2">
                                    <span className="font-medium text-muted-foreground">End:</span>
                                    <span>{dayjs(selectedEntry.endDate).format("MMM D, YYYY - h:mm A")}</span>
                                </div>
                                <div className="grid grid-cols-[80px_1fr] gap-2">
                                    <span className="font-medium text-muted-foreground">Status:</span>
                                    <span className={
                                        selectedEntry.status === "Upcoming" ? "text-blue-600 font-medium" :
                                            selectedEntry.status === "Completed" ? "text-green-600 font-medium" :
                                                "text-red-600 font-medium"
                                    }>{selectedEntry.status}</span>
                                </div>
                                <div className="grid grid-cols-[80px_1fr] gap-2">
                                    <span className="font-medium text-muted-foreground">Recurrence:</span>
                                    <span>{selectedEntry.recurrence}</span>
                                </div>
                            </div>

                            {selectedEntry.description && (
                                <div className="prose prose-sm max-w-none text-muted-foreground bg-muted/30 p-3 rounded-lg">
                                    <p className="whitespace-pre-wrap m-0">{selectedEntry.description}</p>
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="button" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto">
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default UserCalendar;
