// store/authStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  _id: string
  name: string
  email: string
  bq_id: string
  incubation_id?: string
  phone: string
  CNIC: string
  course: string
  shift?: 'Morning' | 'Evening'
  workingDays?: number[]
  avatar?: string
  bio?: string
  status?: string
  cardSettings?: {
    theme?: string
    accentColor?: string
    borderRadius?: string
    showStatus?: boolean
    backgroundColor?: string
    textColor?: string
    gradient?: string
  }
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
          isLoading: false,
        }),
      setLoading: (loading) => set({ isLoading: loading }),
      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        }),
    }),
    {
      name: 'auth-storage',
    }
  )
)