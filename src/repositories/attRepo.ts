import api from "../lib/axios"

export interface ShiftTiming {
  start: string
  end: string
  lateAfter: string
  earlyLeaveBefore: string
  minHours: number
}

export interface AttendanceSettings {
  currentTime: string
  timezone: string
  shifts: {
    Morning: ShiftTiming
    Evening: ShiftTiming
  }
}

export interface AttendanceStatus {
  status: string
  checkInTime: string | null
  checkOutTime: string | null
  shift?: string
  hoursWorked?: number
  isLate?: boolean
  isEarlyLeave?: boolean
  userShift?: string
  shiftTiming?: { start: string; end: string }
  canCheckIn?: boolean
}

export interface HistoryRecord {
  _id: string
  createdAt: string
  checkInTime: string | null
  checkOutTime: string | null
  status: string
  shift: string
  hoursWorked: number
  isLate: boolean
  isEarlyLeave: boolean
}

export interface CalendarStats {
  totalDays: number
  present: number
  late: number
  earlyLeave: number
  absent: number
  noCheckout: number
  incomplete: number
  totalHours: number
}

export interface CalendarHistoryResponse {
  user: {
    _id: string
    name: string
    email: string
    shift: string
  }
  records: HistoryRecord[]
  stats: CalendarStats
  startDate: string | null
}

export class AttRepo {
  async checkIn(userId: string) {
    const response = await api.post(`/api/attendance/checkin/${userId}`)
    return response.data
  }

  async checkOut(userId: string) {
    const response = await api.post(`/api/attendance/checkout/${userId}`)
    return response.data
  }

  async getTodayStatus(userId: string): Promise<AttendanceStatus> {
    const response = await api.get(`/api/attendance/status/${userId}`)
    return response.data
  }

  async getUserHistory(userId: string, page = 1, limit = 10): Promise<{ user: any; history: HistoryRecord[]; pagination: any; totalHours?: number }> {
    const response = await api.get(`/api/attendance/history/${userId}?page=${page}&limit=${limit}`)
    return response.data
  }

  async getCalendarHistory(userId: string, month?: number, year?: number): Promise<CalendarHistoryResponse> {
    let url = `/api/attendance/calendar/${userId}`
    if (month && year) {
      url += `?month=${month}&year=${year}`
    }
    const response = await api.get(url)
    return response.data
  }

  async getShiftInfo(): Promise<AttendanceSettings> {
    const response = await api.get(`/api/attendance/shifts`)
    return response.data
  }

  async getSettings() {
    const response = await api.get(`/api/attendance/settings`)
    return response.data
  }

  async updateSettings(settings: any) {
    const response = await api.put(`/api/attendance/settings`, settings)
    return response.data
  }
}

export const attRepo = new AttRepo()
