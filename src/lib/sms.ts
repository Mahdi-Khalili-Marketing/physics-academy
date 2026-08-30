// ============================ IRANIAN SMS GATEWAY SYSTEM ============================
// Supported Providers:
// 1. 'kavenegar' : Kavenegar Pattern Verification (lookup.json) & Direct Send
// 2. 'farazsms' / 'ippanel' : IPPanel / FarazSMS Pattern Send
// 3. 'smsir' : SMS.ir UltraFast / Verify API
// 4. 'mock' : Default local mock logger for development & demo

export type SmsProvider = 'kavenegar' | 'farazsms' | 'ippanel' | 'smsir' | 'mock'

const SMS_PROVIDER = (process.env.SMS_PROVIDER || 'mock') as SmsProvider
const SMS_API_KEY = process.env.SMS_API_KEY || ''
const SMS_SENDER = process.env.SMS_SENDER || '10008000'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3005'

export type SendSmsResult = {
  success: boolean
  messageId?: string
  provider: string
  mock?: boolean
  error?: string
}

/**
 * Sends an SMS to parents using the configured Iranian SMS Gateway.
 */
export async function sendSms(opts: {
  receptor: string
  message: string
  patternCode?: string
  patternValues?: Record<string, string>
}): Promise<SendSmsResult> {
  const { receptor, message, patternCode, patternValues } = opts

  // Format Iranian mobile numbers (ensure 09xxxxxxxxx format)
  const cleanReceptor = receptor.trim().replace(/^\+98/, '0').replace(/^0098/, '0')

  // 1. Mock / Console Mode (Default if no API key)
  if (SMS_PROVIDER === 'mock' || !SMS_API_KEY) {
    console.log(`\n📨 [MOCK SMS GATEWAY] To: ${cleanReceptor}`)
    console.log(`📝 Content: ${message}`)
    if (patternCode) {
      console.log(`🏷️ Pattern Code: ${patternCode}, Values:`, patternValues)
    }
    console.log(`--------------------------------------------------\n`)
    return {
      success: true,
      messageId: `mock_${Date.now()}`,
      provider: 'mock',
      mock: true,
    }
  }

  try {
    // 2. Kavenegar Gateway
    if (SMS_PROVIDER === 'kavenegar') {
      if (patternCode && patternValues) {
        // Pattern lookup mode (Bypasses telecom Blacklist)
        const params = new URLSearchParams({
          receptor: cleanReceptor,
          template: patternCode,
          token: patternValues.token || '',
          token2: patternValues.token2 || '',
          token3: patternValues.token3 || '',
          token10: patternValues.token10 || '',
          token20: patternValues.token20 || '',
        })
        const res = await fetch(`https://api.kavenegar.com/v1/${SMS_API_KEY}/verify/lookup.json?${params.toString()}`)
        const data = await res.json()
        if (data.return?.status === 200) {
          return { success: true, messageId: String(data.entries?.[0]?.messageid), provider: 'kavenegar' }
        }
        return { success: false, error: data.return?.message || 'خطا در کاوه‌نگار', provider: 'kavenegar' }
      } else {
        // Simple direct SMS
        const params = new URLSearchParams({
          receptor: cleanReceptor,
          sender: SMS_SENDER,
          message,
        })
        const res = await fetch(`https://api.kavenegar.com/v1/${SMS_API_KEY}/sms/send.json?${params.toString()}`)
        const data = await res.json()
        if (data.return?.status === 200) {
          return { success: true, messageId: String(data.entries?.[0]?.messageid), provider: 'kavenegar' }
        }
        return { success: false, error: data.return?.message || 'خطا در ارسال مستقیم کاوه‌نگار', provider: 'kavenegar' }
      }
    }

    // 3. FarazSMS / IPPanel Gateway
    if (SMS_PROVIDER === 'farazsms' || SMS_PROVIDER === 'ippanel') {
      const res = await fetch('https://ippanel.com/patterns/pattern', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `AccessKey ${SMS_API_KEY}`,
        },
        body: JSON.stringify({
          pattern_code: patternCode || process.env.SMS_PATTERN_REPORT || '',
          originator: SMS_SENDER,
          recipient: cleanReceptor,
          values: patternValues || { text: message },
        }),
      })
      const data = await res.json()
      if (res.ok && data.code === 200) {
        return { success: true, messageId: String(data.data?.message_id), provider: 'ippanel' }
      }
      return { success: false, error: data.message || 'خطا در فراز اس‌ام‌اس', provider: 'ippanel' }
    }

    // 4. SMS.ir Gateway
    if (SMS_PROVIDER === 'smsir') {
      const res = await fetch('https://api.sms.ir/v1/send/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': SMS_API_KEY,
        },
        body: JSON.stringify({
          mobile: cleanReceptor,
          templateId: Number(patternCode || 100000),
          parameters: Object.entries(patternValues || {}).map(([name, value]) => ({ name, value })),
        }),
      })
      const data = await res.json()
      if (data.status === 1) {
        return { success: true, messageId: String(data.data?.messageId), provider: 'smsir' }
      }
      return { success: false, error: data.message || 'خطا در SMS.ir', provider: 'smsir' }
    }

    return { success: false, error: 'درگاه پیامک تعریف‌نشده است', provider: SMS_PROVIDER }
  } catch (err: any) {
    console.error('SMS Gateway Dispatch Error:', err)
    return { success: false, error: err.message || 'خطای اتصال به درگاه پیامک', provider: SMS_PROVIDER }
  }
}

/**
 * Builds the official zero-login Parent Report SMS text and dispatches it.
 */
export async function sendParentReportNotification(opts: {
  parentPhone: string
  studentName: string
  examTitle: string
  score: number
  unresolvedWeaknesses: number
  reportToken: string
}): Promise<SendSmsResult> {
  const { parentPhone, studentName, examTitle, score, unresolvedWeaknesses, reportToken } = opts
  const reportUrl = `${APP_URL}/p/${reportToken}`

  const message = `ولی گرامی ${studentName}،\nکارنامه آزمونک فیزیک (${examTitle}) صادر شد.\n🔹 نمره: ${score} از ۲۰\n🔹 مباحث نیازمند تمرین: ${unresolvedWeaknesses} مورد\n📊 مشاهده گزارش تحلیلی کامل و توصیه مشاور:\n${reportUrl}\nآموزشگاه تخصصی فیزیک کنکور`

  return sendSms({
    receptor: parentPhone,
    message,
    patternCode: process.env.SMS_PATTERN_REPORT,
    patternValues: {
      token: studentName.replace(/\s+/g, '-'),
      token2: String(score),
      token3: reportUrl,
    },
  })
}
