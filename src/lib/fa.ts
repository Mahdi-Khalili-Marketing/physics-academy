// Persian digits & date helpers

const FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']

export function toFa(input: number | string | undefined | null): string {
  if (input === undefined || input === null) return ''
  return String(input).replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)])
}

export function toFaNumber(n: number | undefined | null, decimals = 0): string {
  if (n === undefined || n === null || isNaN(Number(n))) return '۰'
  return toFa(Number(n).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }))
}

export function formatToman(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(Number(amount))) return '۰ تومان'
  return `${toFa(Number(amount).toLocaleString('en-US'))} تومان`
}

export function formatDuration(seconds: number | undefined | null): string {
  if (seconds === undefined || seconds === null || isNaN(Number(seconds))) return '۰:۰۰'
  const sec = Math.max(0, Math.floor(Number(seconds)))
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  if (h > 0) return `${toFa(h)}:${toFa(String(m).padStart(2, '0'))}:${toFa(String(s).padStart(2, '0'))}`
  return `${toFa(m)}:${toFa(String(s).padStart(2, '0'))}`
}

export function relativeTime(date: Date | string | number | undefined | null): string {
  if (!date) return 'اخیراً'
  const d = new Date(date)
  if (isNaN(d.getTime())) return 'اخیراً'
  const diff = Date.now() - d.getTime()
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

export function faDate(date: Date | string | number | undefined | null): string {
  if (!date) return ''
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  try {
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(d)
  } catch {
    return d.toISOString().slice(0, 10)
  }
}
