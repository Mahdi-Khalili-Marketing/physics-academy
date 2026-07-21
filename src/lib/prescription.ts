import { db } from './db'

// ============================ PRESCRIPTION ENGINE ============================
// The "doctor" behind every exam: diagnose weak topics from a finished attempt,
// prescribe the best matching video clip, and track recovery through a
// remedial quiz (PENDING → WATCHED → RECOVERED).

/** Remedial quiz pass threshold (correct / total questions). */
export const REMEDIAL_PASS_RATIO = 0.7

/** Blank answers signal weakness too, but weaker than an actively wrong pick. */
const BLANK_WEIGHT = 0.6

/** A topic is weak when its weighted error ratio crosses this. */
const WEAK_THRESHOLD = 0.5

/** Prefer "short clip" videos at or under this duration (the 4-minute fix). */
const CLIP_PREFERRED_SEC = 10 * 60

export type TopicStat = {
  topicId: string
  topicTitle: string
  wrong: number
  blank: number
  total: number
}

export type Diagnosis = TopicStat & {
  /** 0..1 weighted error ratio — used for ordering, worst first. */
  severity: number
}

const FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
function faNum(n: number): string {
  return String(n).replace(/\d/g, (d) => FA_DIGITS[Number(d)])
}

/**
 * Diagnose weak topics from per-topic answer stats.
 * - blanks count as partial weakness (student skipped = didn't know)
 * - single-question topics count only when actively answered wrong
 */
export function diagnoseWeakTopics(stats: TopicStat[]): Diagnosis[] {
  return stats
    .map((s) => ({
      ...s,
      severity: s.total > 0 ? (s.wrong + BLANK_WEIGHT * s.blank) / s.total : 0,
    }))
    .filter((s) =>
      s.total >= 2 ? s.severity >= WEAK_THRESHOLD : s.wrong === 1,
    )
    .sort((a, b) => b.severity - a.severity)
}

/** Persian diagnosis sentence with the actual numbers. */
export function buildReason(d: Diagnosis): string {
  const parts: string[] = []
  if (d.wrong > 0) parts.push(`${faNum(d.wrong)} پاسخ غلط`)
  if (d.blank > 0) parts.push(`${faNum(d.blank)} بی‌پاسخ`)
  return `${parts.join(' و ')} از ${faNum(d.total)} سؤال «${d.topicTitle}»`
}

/**
 * Pick the best published video for a weak topic:
 * 1) topic-matched videos — short clips (≤10 min) first, then shortest overall
 * 2) fallback: any video of the topic's chapter, shortest first
 */
export async function pickVideoForTopic(topicId: string, chapterId: string) {
  const topicVideos = await db.video.findMany({
    where: { topicId, isPublished: true },
    orderBy: { durationSec: 'asc' },
  })
  if (topicVideos.length > 0) {
    return topicVideos.find((v) => v.durationSec <= CLIP_PREFERRED_SEC) ?? topicVideos[0]
  }
  return db.video.findFirst({
    where: { chapterId, isPublished: true },
    orderBy: { durationSec: 'asc' },
  })
}

export type PrescriptionResult = {
  id: string
  topicId: string
  topicTitle: string
  videoId: string | null
  videoTitle: string | null
  videoDurationSec: number | null
  reason: string
  status: 'PENDING' | 'WATCHED' | 'RECOVERED'
}

/**
 * Persist prescriptions for a finished attempt.
 * Any older unrecovered prescription for the same topic is replaced — the new
 * attempt is fresher evidence of the same weakness.
 */
export async function prescribeForAttempt(
  userId: string,
  attemptId: string,
  diagnoses: Diagnosis[],
): Promise<PrescriptionResult[]> {
  const results: PrescriptionResult[] = []
  for (const d of diagnoses) {
    const topic = await db.topic.findUnique({ where: { id: d.topicId } })
    if (!topic) continue
    const video = await pickVideoForTopic(d.topicId, topic.chapterId)

    await db.prescription.deleteMany({
      where: { userId, topicId: d.topicId, status: { not: 'RECOVERED' } },
    })
    const row = await db.prescription.create({
      data: {
        userId,
        attemptId,
        topicId: d.topicId,
        videoId: video?.id ?? null,
        reason: buildReason(d),
        wrongCount: d.wrong,
        blankCount: d.blank,
        totalCount: d.total,
      },
    })
    results.push({
      id: row.id,
      topicId: d.topicId,
      topicTitle: d.topicTitle,
      videoId: video?.id ?? null,
      videoTitle: video?.title ?? null,
      videoDurationSec: video?.durationSec ?? null,
      reason: row.reason,
      status: row.status,
    })
  }
  return results
}
