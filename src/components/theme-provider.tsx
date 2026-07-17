'use client'

import { useEffect, useState, createContext, useContext } from 'react'

type Theme = 'light' | 'dark'

export function ThemeProvider({
  children,
  defaultTheme = 'light',
  enableSystem = true,
}: {
  children: React.ReactNode
  attribute?: string
  defaultTheme?: Theme
  enableSystem?: boolean
  disableTransitionOnChange?: boolean
}) {
  // Compute initial theme eagerly to avoid flashes
  const getInitial = (): Theme => {
    if (typeof window === 'undefined') return defaultTheme
    const stored = localStorage.getItem('theme') as Theme | null
    if (stored) return stored
    const prefersDark = enableSystem && window.matchMedia('(prefers-color-scheme: dark)').matches
    return prefersDark ? 'dark' : defaultTheme
  }
  const [theme, setTheme] = useState<Theme>(getInitial)

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
    localStorage.setItem('theme', theme)
  }, [theme])

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
}

const ThemeContext = createContext<{ theme: Theme; setTheme: (t: Theme) => void }>({
  theme: 'light',
  setTheme: () => {},
})
export function useTheme() {
  return useContext(ThemeContext)
}
