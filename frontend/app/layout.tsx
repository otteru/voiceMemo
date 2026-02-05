import React from "react"
import type { Metadata, Viewport } from 'next'
import { Noto_Sans_KR } from 'next/font/google'
import { Toaster } from "@/components/ui/sonner"

import './globals.css'

const notoSansKR = Noto_Sans_KR({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-noto-sans-kr'
})

export const metadata: Metadata = {
  title: 'LectureNote AI - 강의 녹음 자동 정리',
  description: '강의를 녹음하고 AI가 자동으로 정리해서 노션에 저장합니다',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <body className={`${notoSansKR.variable} font-sans antialiased bg-background text-foreground`}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
