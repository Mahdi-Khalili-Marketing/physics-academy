// Persian digits & date helpers

const FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']

export function toFa(input: number | string): string {
  return String(input).replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)])
}

export function toFaNumber(n: number, decimals = 0): string {
  return toFa(n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }))
}

export function formatToman(amount: number): string {
  return `${toFa(amount.toLocaleString('en-US'))} تومان`
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${toFa(h)}:${toFa(String(m).padStart(2, '0'))}:${toFa(String(s).padStart(2, '0'))}`
  return `${toFa(m)}:${toFa(String(s).padStart(2, '0'))}`
}

export function relativeTime(date: Date): string {
  const diff = Date.now() - date.getTime()
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return 'لحظاتی پیش'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${toFa(min)} دقیقه پیش`
  const hour = Math.floor(min / 60)
  if (hour < 24) return `${toFa(hour)} ساعت پیش`
  const day = Math.floor(hour / 24)
  if (day < 30) return `${toFa(day)} روز پیش`
  const month = Math.floor(day / 30)
  if (month < 12) return `${toFa(month)} ماه پیش`
  return `${toFa(Math.floor(month / 12))} سال پیش`
}

export function faDate(date: Date): string {
  try {
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date)
  } catch {
    return date.toISOString().slice(0, 10)
  }
}
