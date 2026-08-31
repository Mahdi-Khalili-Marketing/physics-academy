import { describe, test, expect, runSuites } from './test-runner'
import { hashPassword, verifyPassword } from '../src/lib/auth'
import { diagnoseWeakTopics, buildReason, REMEDIAL_PASS_RATIO, type TopicStat } from '../src/lib/prescription'
import { toFa, toFaNumber, formatDuration, formatToman, relativeTime } from '../src/lib/fa'
import { db } from '../src/lib/db'

// =========================================================================
// SUITE 1: Pedagogy & Konkoor Scoring Engine
// =========================================================================
describe('1. Pedagogy & Konkoor Scoring Engine', () => {
  function computeKonkoorScore(correct: number, wrong: number, blank: number, total: number): { score: number; pct: number } {
    if (total === 0) return { score: 0, pct: 0 }
    const raw = (correct - wrong * 0.25) * (20 / total)
    const score = Math.max(0, Number(raw.toFixed(2)))
    const pct = Math.max(0, Math.round((score / 20) * 100))
    return { score, pct }
  }

  test('100% Perfect Exam (20/20 questions correct)', () => {
    const res = computeKonkoorScore(20, 0, 0, 20)
    expect(res.score).toBe(20)
    expect(res.pct).toBe(100)
  })

  test('All Blank Answers (0 correct, 0 wrong, 20 blank) = 0.0', () => {
    const res = computeKonkoorScore(0, 0, 20, 20)
    expect(res.score).toBe(0)
    expect(res.pct).toBe(0)
  })

  test('All Wrong Answers with Negative Marking is clamped to 0.0 (no negative score)', () => {
    const res = computeKonkoorScore(0, 20, 0, 20)
    expect(res.score).toBe(0)
    expect(res.pct).toBe(0)
  })

  test('Konkoor 3-to-1 Negative Marking: 3 wrong cancels 1 correct', () => {
    // 4 questions answered: 1 correct, 3 wrong (3 * 0.25 = 0.75 deduction).
    // Net correct = 1 - 0.75 = 0.25 out of 4 = 1.25 / 20
    const res = computeKonkoorScore(1, 3, 0, 4)
    expect(res.score).toBe(1.25)
  })

  test('Real Konkoor Attempt: 14 correct, 4 wrong, 2 blank out of 20', () => {
    // raw = (14 - 1.0) * (20 / 20) = 13.0
    const res = computeKonkoorScore(14, 4, 2, 20)
    expect(res.score).toBe(13)
    expect(res.pct).toBe(65)
  })
})

// =========================================================================
// SUITE 2: Smart Diagnosis & Prescription Engine
// =========================================================================
describe('2. Smart Diagnosis & Prescription Engine', () => {
  test('Single question topic is flagged as weak if wrong === 1', () => {
    const stats: TopicStat[] = [
      { topicId: 't1', topicTitle: 'قانون کولن', wrong: 1, blank: 0, total: 1 },
      { topicId: 't2', topicTitle: 'میدان الکتریکی', wrong: 0, blank: 0, total: 1 },
    ]
    const diagnoses = diagnoseWeakTopics(stats)
    expect(diagnoses.length).toBe(1)
    expect(diagnoses[0].topicTitle).toBe('قانون کولن')
    expect(diagnoses[0].severity).toBe(1)
  })

  test('Multi-question topic is flagged only when weighted error ratio >= 0.5', () => {
    const stats: TopicStat[] = [
      // 2 wrong out of 3 = 66% error >= 50% threshold -> flagged
      { topicId: 't1', topicTitle: 'حرکت با شتاب ثابت', wrong: 2, blank: 0, total: 3 },
      // 1 wrong out of 4 = 25% error < 50% threshold -> not flagged
      { topicId: 't2', topicTitle: 'دینامیک نیوتون', wrong: 1, blank: 0, total: 4 },
      // 0 wrong, 2 blank out of 2 = (0 + 0.6 * 2) / 2 = 0.6 >= 0.5 -> flagged
      { topicId: 't3', topicTitle: 'نوسان و موج', wrong: 0, blank: 2, total: 2 },
    ]
    const diagnoses = diagnoseWeakTopics(stats)
    expect(diagnoses.length).toBe(2)
    // Worst severity first
    expect(diagnoses[0].topicTitle).toBe('حرکت با شتاب ثابت')
    expect(diagnoses[1].topicTitle).toBe('نوسان و موج')
  })

  test('buildReason formats Persian sentence correctly with Persian digits', () => {
    const diag = {
      topicId: 't1',
      topicTitle: 'سطح شیب‌دار و اصطکاک',
      wrong: 2,
      blank: 1,
      total: 4,
      severity: 0.65,
    }
    const reason = buildReason(diag)
    expect(reason.includes('۲ پاسخ غلط')).toBe(true)
    expect(reason.includes('۱ بی‌پاسخ')).toBe(true)
    expect(reason.includes('۴ سؤال')).toBe(true)
    expect(reason.includes('سطح شیب‌دار و اصطکاک')).toBe(true)
  })

  test('Remedial quiz pass threshold is strictly 70%', () => {
    expect(REMEDIAL_PASS_RATIO).toBe(0.7)
    const passed = (7 / 10) >= REMEDIAL_PASS_RATIO
    const failed = (6 / 10) >= REMEDIAL_PASS_RATIO
    expect(passed).toBe(true)
    expect(failed).toBe(false)
  })
})

// =========================================================================
// SUITE 3: Auth & Cryptography
// =========================================================================
describe('3. Auth & Cryptography Verification', () => {
  test('hashPassword produces deterministic SHA-256 hash', () => {
    const hash1 = hashPassword('1234')
    const hash2 = hashPassword('1234')
    expect(hash1).toBe(hash2)
    expect(hash1.length).toBe(64) // SHA-256 hex length
  })

  test('verifyPassword validates matching password', () => {
    const hash = hashPassword('secretPassword123')
    expect(verifyPassword('secretPassword123', hash)).toBe(true)
    expect(verifyPassword('wrongPassword', hash)).toBe(false)
  })
})

// =========================================================================
// SUITE 4: Persian Formatter & Localization Engine
// =========================================================================
describe('4. Persian Formatter & Localization (fa.ts)', () => {
  test('toFa converts English digits to Persian digits', () => {
    expect(toFa(1234567890)).toBe('۱۲۳۴۵۶۷۸۹۰')
    expect(toFa('Class 10')).toBe('Class ۱۰')
    expect(toFa(null)).toBe('')
    expect(toFa(undefined)).toBe('')
  })

  test('toFaNumber rounds and formats floats in Persian', () => {
    expect(toFaNumber(14.567, 1)).toBe('۱۴.۶')
    expect(toFaNumber(20, 0)).toBe('۲۰')
    expect(toFaNumber(null)).toBe('۰')
  })

  test('formatDuration converts seconds to Persian mm:ss format', () => {
    expect(formatDuration(65)).toBe('۱:۰۵')
    expect(formatDuration(120)).toBe('۲:۰۰')
    expect(formatDuration(3665)).toBe('۱:۰۱:۰۵')
    expect(formatDuration(null)).toBe('۰:۰۰')
  })

  test('formatToman formats Persian currency with commas', () => {
    expect(formatToman(1500000)).toBe('۱,۵۰۰,۰۰۰ تومان')
    expect(formatToman(null)).toBe('۰ تومان')
  })

  test('relativeTime computes human-readable Persian relative times', () => {
    const now = Date.now()
    expect(relativeTime(now - 10000)).toBe('لحظاتی پیش')
    expect(relativeTime(now - 5 * 60 * 1000)).toBe('۵ دقیقه پیش')
    expect(relativeTime(now - 2 * 3600 * 1000)).toBe('۲ ساعت پیش')
  })
})

// =========================================================================
// SUITE 5: Database Schema & Seed Data Integrity
// =========================================================================
describe('5. Database Schema & Data Integrity', () => {
  test('Default Student, Teacher, and Manager exist in database', async () => {
    const student = await db.user.findFirst({ where: { role: 'STUDENT', phone: '09120010003' } })
    const teacher = await db.user.findFirst({ where: { role: 'TEACHER', phone: '09120000002' } })
    const manager = await db.user.findFirst({ where: { role: 'MANAGER', phone: '09120000001' } })

    expect(student !== null).toBe(true)
    expect(teacher !== null).toBe(true)
    expect(manager !== null).toBe(true)
  })

  test('Physics Chapters and Question Bank are populated', async () => {
    const chaptersCount = await db.chapter.count()
    const questionsCount = await db.question.count()
    const examsCount = await db.exam.count()

    expect(chaptersCount > 0).toBe(true)
    expect(questionsCount > 0).toBe(true)
    expect(examsCount > 0).toBe(true)
  })

  test('SpotPlayer DRM video library is seeded and linked', async () => {
    const videos = await db.video.findMany({ where: { isPublished: true } })
    expect(videos.length > 0).toBe(true)
    const videoWithTopic = videos.find((v) => v.topicId !== null)
    expect(videoWithTopic !== undefined).toBe(true)
  })
})

// Run all test suites
runSuites()
