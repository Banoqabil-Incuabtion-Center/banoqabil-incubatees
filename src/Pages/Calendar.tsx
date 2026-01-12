import React, { useEffect, useState } from "react";
import { Calendar, Badge, Modal, Card as AntCard } from "antd";
import type { CalendarProps } from "antd";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import { calendarRepo } from "@/repositories/calendarRepo";
import type { CalendarEntry } from "@/repositories/calendarRepo";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { IconCalendarEvent } from "@tabler/icons-react";
import { toast } from "sonner";
import { useAuthStore } from "@/hooks/store/authStore";

const CalendarPage: React.FC = () => {
    const [entries, setEntries] = useState<CalendarEntry[]>([]);
    const [workingDays, setWorkingDays] = useState<number[]>([1, 2, 3, 4, 5]); // Default Mon-Fri
    const [selectedEntry, setSelectedEntry] = useState<CalendarEntry | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { user } = useAuthStore();

    const fetchEntries = async () => {
        try {
            const res = await calendarRepo.getEntries();
            setEntries(res.data);
            if (res.workingDays) {
                setWorkingDays(res.workingDays);
            }
        } catch (error) {
            toast.error("Failed to fetch calendar entries");
        }
    };

    const fetchSettings = async () => {
        try {
            const res = await calendarRepo.getSettings();
            if (res.data?.workingDays) {
                setWorkingDays(res.data.workingDays);
            }
        } catch (error) {
            console.error("Failed to fetch calendar settings", error);
        }
    };

    useEffect(() => {
        fetchEntries();
        fetchSettings();
    }, []);

    const getListData = (value: Dayjs) => {
        return entries.filter((entry) => {
            const start = dayjs(entry.startDate).startOf("day");
            const end = dayjs(entry.endDate).endOf("day");
            return value.isAfter(start.subtract(1, 'day')) && value.isBefore(end.add(1, 'day'));
        });
    };

    // Note: Ant Design Calendar 0=Sun, 1=Mon...6=Sat
    const isWeekend = (value: Dayjs) => {
        // If workingDays contains the day index, it is a working day.
        // Otherwise it is a non-working day (weekend/off).
        return !workingDays.includes(value.day());
    };

    const onSelectEntry = (entry: CalendarEntry) => {
        setSelectedEntry(entry);
        setIsModalOpen(true);
    };

    const dateCellRender = (value: Dayjs) => {
        const listData = getListData(value);
        const weekend = isWeekend(value);

        return (
            <div className={`h-full ${weekend ? "bg-red-50/50 dark:bg-red-950/10 -m-1 p-1" : ""}`}>
                <ul className="events m-0 p-0 list-none">
                    {listData.map((item) => (
                        <li key={item._id} onClick={(e) => {
                            e.stopPropagation();
                            onSelectEntry(item);
                        }}>
                            <Badge
                                color={item.color}
                                text={item.title}
                                className="w-full overflow-hidden text-ellipsis whitespace-nowrap text-[10px] cursor-pointer hover:font-bold transition-all"
                            />
                        </li>
                    ))}
                    {weekend && listData.length === 0 && (
                        <span className="text-[9px] text-red-500 font-medium block mt-1">Off</span>
                    )}
                </ul>
            </div>
        );
    };

    const cellRender: CalendarProps<Dayjs>['cellRender'] = (current, info) => {
        if (info.type === 'date') return dateCellRender(current);
        return info.originNode;
    };

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
                    <p className="text-muted-foreground mt-1">View holidays, events, and important dates.</p>
                </div>
                <div className="flex gap-2">
                    {/* Placeholder for any future actions or legend */}
                </div>
            </div>

            <Card className="border-none shadow-sm h-full">
                <CardContent className="p-4">
                    <div className="overflow-x-auto">
                        <Calendar cellRender={cellRender} className="p-2 min-w-[600px]" />
                    </div>
                </CardContent>
            </Card>

            <Modal
                title={null}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                destroyOnClose
                centered
                width={400}
                className="rounded-2xl overflow-hidden"
            >
                {selectedEntry && (
                    <div className="p-2">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-3 h-10 rounded-full" style={{ backgroundColor: selectedEntry.color }}></div>
                            <div>
                                <h3 className="text-xl font-bold">{selectedEntry.title}</h3>
                                <Badge color={selectedEntry.color} text={selectedEntry.type} className="mt-1" />
                            </div>
                        </div>

                        <div className="space-y-3 text-sm">
                            <div className="grid grid-cols-[80px_1fr] gap-2">
                                <span className="text-muted-foreground font-medium">Date:</span>
                                <span>{dayjs(selectedEntry.startDate).format("MMM D, YYYY")}
                                    {selectedEntry.startDate !== selectedEntry.endDate && ` - ${dayjs(selectedEntry.endDate).format("MMM D, YYYY")}`}
                                </span>
                            </div>

                            {selectedEntry.location && (
                                <div className="grid grid-cols-[80px_1fr] gap-2">
                                    <span className="text-muted-foreground font-medium">Location:</span>
                                    <span>{selectedEntry.location}</span>
                                </div>
                            )}

                            {selectedEntry.description && (
                                <div className="mt-4 pt-4 border-t">
                                    <p className="whitespace-pre-wrap text-muted-foreground">{selectedEntry.description}</p>
                                </div>
                            )}

                            <div className="grid grid-cols-[80px_1fr] gap-2 pt-2">
                                <span className="text-muted-foreground font-medium">Status:</span>
                                <span className={
                                    selectedEntry.status === "Upcoming" ? "text-blue-500 font-medium" :
                                        selectedEntry.status === "Completed" ? "text-green-500 font-medium" :
                                            "text-red-500 font-medium"
                                }>{selectedEntry.status}</span>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default CalendarPage;
