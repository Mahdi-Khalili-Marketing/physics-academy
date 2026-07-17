'use client'

import { useEffect, useState, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  PlayCircle,
  Clock,
  Search,
  ChevronRight,
  CheckCircle2,
  Lock,
  ShieldCheck,
  Smartphone,
} from 'lucide-react'
import { toFa, formatDuration, relativeTime } from '@/lib/fa'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type VideoList = {
  videos: {
    id: string
    title: string
    description: string | null
    durationSec: number
    hlsUrl: string
    chapter: { id: string; title: string; slug: string }
    topic: { id: string; title: string; slug: string } | null
    view: {
      watchSec: number
      completed: boolean
      lastPosition: number
    } | null
  }[]
}

type Chapters = {
  chapters: {
    id: string
    title: string
    slug: string
    topics: { id: string; title: string; slug: string }[]
  }[]
}

export function VideoLibrary({ initialVideoId, onBack }: { initialVideoId?: string; onBack: () => void }) {
  const { user } = useAppStore()
  const [videos, setVideos] = useState<VideoList['videos']>([])
  const [chapters, setChapters] = useState<Chapters['chapters']>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [chapterFilter, setChapterFilter] = useState<string>('all')
  const [activeVideo, setActiveVideo] = useState<string | null>(initialVideoId || null)

  useEffect(() => {
    Promise.all([
      fetch('/api/videos').then((r) => r.json()),
      fetch('/api/chapters').then((r) => r.json()),
    ])
      .then(([v, c]: [VideoList, Chapters]) => {
        setVideos(v.videos)
        setChapters(c.chapters)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Skeleton className="h-96" />

  if (activeVideo) {
    const v = videos.find((x) => x.id === activeVideo)
    if (v) return <VideoPlayer video={v} user={user} onBack={() => setActiveVideo(null)} />
  }

  const filtered = videos.filter((v) => {
    if (chapterFilter !== 'all' && v.chapter.slug !== chapterFilter) return false
    if (search && !v.title.includes(search) && !v.description?.includes(search)) return false
    return true
  })

  const grouped: Record<string, typeof filtered> = {}
  for (const v of filtered) {
    const k = v.chapter.title
    if (!grouped[k]) grouped[k] = []
    grouped[k].push(v)
  }

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">کتابخانه ویدیویی محافظت‌شده</h1>
          <p className="text-muted-foreground text-sm mt-1">ویدیوهای تدوین‌شده و دسته‌بندی‌شده — با واترمارک هویتی</p>
        </div>
        <Button variant="ghost" onClick={onBack}>بازگشت</Button>
      </div>

      {/* Security strip */}
      <div className="grid sm:grid-cols-3 gap-3">
        <SecurityChip icon={<ShieldCheck className="h-4 w-4" />} text="پخش امن، بدون امکان دانلود" />
        <SecurityChip icon={<Smartphone className="h-4 w-4" />} text="محدودیت ۲ دستگاه برای هر حساب" />
        <SecurityChip icon={<Lock className="h-4 w-4" />} text="واترمارک هویتی متحرک روی هر ویدیو" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جست‌و‌جوی ویدیو…"
            className="pr-10"
          />
        </div>
        <Select value={chapterFilter} onValueChange={setChapterFilter}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="همه فصول" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه فصول</SelectItem>
            {chapters.map((c) => (
              <SelectItem key={c.id} value={c.slug}>{c.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Video grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">ویدیویی یافت نشد.</div>
      ) : (
        Object.entries(grouped).map(([chapter, vids]) => (
          <div key={chapter} className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground border-b pb-2">{chapter}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {vids.map((v) => (
                <Card
                  key={v.id}
                  className="hover-lift cursor-pointer overflow-hidden"
                  onClick={() => setActiveVideo(v.id)}
                >
                  <div className="aspect-video relative bg-gradient-to-br from-teal-500/20 via-teal-600/10 to-purple-500/20 flex items-center justify-center">
                    <PlayCircle className="h-12 w-12 text-white drop-shadow-lg" />
                    <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                      {formatDuration(v.durationSec)}
                    </div>
                    {v.view?.completed && (
                      <div className="absolute top-2 right-2 bg-emerald-500 text-white p-1 rounded-full">
                        <CheckCircle2 className="h-3 w-3" />
                      </div>
                    )}
                    {v.view && !v.view.completed && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40">
                        <div
                          className="h-full bg-teal-500"
                          style={{ width: `${Math.min(100, (v.view.lastPosition / v.durationSec) * 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-3 space-y-1.5">
                    <div className="font-medium text-sm leading-snug line-clamp-2">{v.title}</div>
                    <div className="text-xs text-muted-foreground line-clamp-1">{v.topic?.title || v.chapter.title}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

function SecurityChip({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border text-xs">
      <span className="text-teal-600">{icon}</span>
      <span>{text}</span>
    </div>
  )
}

// ============ Video Player ============
function VideoPlayer({
  video,
  user,
  onBack,
}: {
  video: VideoList['videos'][number]
  user: { name: string; phone: string } | null
  onBack: () => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [watchSec, setWatchSec] = useState(0)
  const [lastPosition, setLastPosition] = useState(video.view?.lastPosition || 0)
  const [completed, setCompleted] = useState(video.view?.completed || false)
  const lastReport = useRef(Date.now())

  // Periodically report progress to backend
  useEffect(() => {
    const interval = setInterval(async () => {
      const v = videoRef.current
      if (!v) return
      const elapsed = Math.floor((Date.now() - lastReport.current) / 1000)
      if (elapsed < 5) return
      lastReport.current = Date.now()
      const isCompleted = v.ended || (v.duration && v.currentTime / v.duration > 0.95)
      setWatchSec((s) => s + elapsed)
      setLastPosition(Math.floor(v.currentTime))
      if (isCompleted) setCompleted(true)
      await fetch(`/api/videos/${video.id}/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          watchSec: elapsed,
          lastPosition: Math.floor(v.currentTime),
          completed: !!isCompleted,
        }),
      })
    }, 8000)
    return () => clearInterval(interval)
  }, [video.id])

  // Try resuming from last position
  useEffect(() => {
    const v = videoRef.current
    if (v && video.view?.lastPosition) {
      const t = setTimeout(() => {
        try { v.currentTime = video.view!.lastPosition } catch {}
      }, 400)
      return () => clearTimeout(t)
    }
  }, [video.view])

  // Build watermark text: user's name + phone (last 4 digits)
  const wmText = user ? `${user.name} · ${user.phone.slice(-4)}` : 'کاربر'

  return (
    <div className="space-y-4 page-enter max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="gap-1">
          <ChevronRight className="h-4 w-4" /> بازگشت به کتابخانه
        </Button>
      </div>

      <div className="relative bg-black rounded-xl overflow-hidden aspect-video shadow-2xl">
        {/* Watermark overlay */}
        <div className="watermark-overlay">
          <span style={{ animationDelay: '0s' }}>{wmText}</span>
          <span style={{ animationDelay: '-4s', animationDuration: '18s' }}>{wmText}</span>
          <span style={{ animationDelay: '-8s', animationDuration: '16s' }}>{wmText}</span>
        </div>

        <video
          ref={videoRef}
          src={video.hlsUrl}
          className="w-full h-full"
          controls
          controlsList="nodownload noremoteplayback noplaybackrate"
          onContextMenu={(e) => e.preventDefault()}
          playsInline
          poster=""
        >
          مرورگر شما از پخش ویدیو پشتیبانی نمی‌کند.
        </video>
      </div>

      <Card>
        <CardContent className="p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold">{video.title}</h1>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline">{video.chapter.title}</Badge>
                {video.topic && <Badge variant="secondary">{video.topic.title}</Badge>}
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {formatDuration(video.durationSec)}
                </span>
              </div>
            </div>
            {completed && (
              <Badge className="bg-emerald-500 gap-1">
                <CheckCircle2 className="h-3 w-3" /> تکمیل شد
              </Badge>
            )}
          </div>
          {video.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">{video.description}</p>
          )}
          <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 text-xs text-muted-foreground">
            <Lock className="h-3 w-3 inline ml-1 text-amber-600" />
            این ویدیو با نام و شماره موبایل شما واترمارک شده است. هرگونه انتشار غیرمجاز قابل ردیابی است.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
