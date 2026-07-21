'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/lib/store'
import { AuthScreen } from '@/components/auth/AuthScreen'
import { Skeleton } from '@/components/ui/skeleton'

export default function LoginPage() {
  const router = useRouter()
  const { user, loading, fetchMe } = useAppStore()

  useEffect(() => {
    fetchMe()
  }, [fetchMe])

  useEffect(() => {
    if (!loading && user) router.replace('/app')
  }, [loading, user, router])

  if (loading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Skeleton className="h-96 w-96" />
      </div>
    )
  }

  return <AuthScreen />
}
