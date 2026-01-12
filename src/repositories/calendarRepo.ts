import api from "../lib/axios";

export interface CalendarEntry {
    _id?: string;
    title: string;
    description?: string;
    type: "Holiday" | "Event" | "Meeting" | "Working Day" | "Other";
    color: string;
    startDate: string;
    endDate: string;
    isFullDay: boolean;
    status: "Upcoming" | "Completed" | "Cancelled";
    location?: string;
    recurrence: "None" | "Daily" | "Weekly" | "Monthly" | "Yearly";
}

export interface CalendarSettings {
    _id?: string;
    workingDays: number[];
}

export class CalendarRepo {
    async getEntries(start?: string, end?: string, type?: string) {
        const params = new URLSearchParams();
        if (start) params.append("start", start);
        if (end) params.append("end", end);
        if (type) params.append("type", type);

        const response = await api.get(`/api/calendar?${params.toString()}`);
        return response.data;
    }

    // Calendar settings (working days)
    async getSettings() {
        const response = await api.get("/api/calendar/settings");
        return response.data;
    }
}

export const calendarRepo = new CalendarRepo();
