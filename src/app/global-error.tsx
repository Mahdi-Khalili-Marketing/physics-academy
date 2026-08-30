'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="fa" dir="rtl">
      <body className="bg-background text-foreground min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full p-6 border rounded-2xl bg-card text-center space-y-4 shadow-xl">
          <h2 className="text-lg font-bold text-red-600">خطای بارگذاری سراسری</h2>
          <pre className="text-xs bg-muted p-3 rounded font-mono dir-ltr overflow-auto max-h-40">{error.message || String(error)}</pre>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => reset()}
              className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold"
            >
              تلاش مجدد
            </button>
            <button
              onClick={() => { window.location.href = '/login' }}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-xl text-xs"
            >
              صفحه ورود
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
