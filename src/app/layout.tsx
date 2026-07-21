import type { Metadata, Viewport } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { PwaRegister } from "@/components/shared/PwaRegister";

const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  variable: "--font-fa",
  display: "swap",
});

export const metadata: Metadata = {
  title: "آموزشگاه فیزیک — پلتفرم آموزشی هوشمند",
  description:
    "سیستم هوشمند تشخیص ضعف و مسیر تسلط برای دانش‌آموزان کنکور فیزیک — مکمل کلاس‌های حضوری.",
  keywords: ["فیزیک", "کنکور", "آزمونک", "تحلیل هوشمند", "آموزشگاه"],
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "آموزشگاه فیزیک",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#175A8C",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body
        className={`${vazirmatn.variable} antialiased bg-background text-foreground`}
        style={{ fontFamily: "var(--font-fa), system-ui, sans-serif" }}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <PwaRegister />
          <Toaster />
          <SonnerToaster position="top-center" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
