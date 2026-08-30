'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { LandingPage } from '@/components/marketing/LandingPage'

export default function Home() {
  const { fetchMe } = useAppStore()

  useEffect(() => {
    fetchMe()
  }, [fetchMe])

  return <LandingPage />
}
