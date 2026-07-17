'use client'

import { create } from 'zustand'
import type { Role, Grade } from '@prisma/client'

export type AuthUser = {
  id: string
  name: string
  phone: string
  role: Role
  avatarColor: string
  grade: Grade
  parentPhone?: string | null
  referralCode?: string | null
}

type AppState = {
  user: AuthUser | null
  loading: boolean
  setUser: (u: AuthUser | null) => void
  setLoading: (b: boolean) => void
  fetchMe: () => Promise<void>
  logout: () => Promise<void>
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  loading: true,
  setUser: (u) => set({ user: u }),
  setLoading: (b) => set({ loading: b }),
  fetchMe: async () => {
    try {
      const res = await fetch('/api/auth/me')
      const data = await res.json()
      set({ user: data.user || null, loading: false })
    } catch {
      set({ user: null, loading: false })
    }
  },
  logout: async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    set({ user: null })
  },
}))
