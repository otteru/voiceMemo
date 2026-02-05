"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface HeaderProps {
  isNotionConnected?: boolean
}

export function Header({ isNotionConnected = false }: HeaderProps) {
  const pathname = usePathname()

  const navItems = [
    { href: "/", label: "대시보드" },
    { href: "/recordings", label: "녹음 기록" },
    { href: "/settings", label: "설정" },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-primary" />
            <span className="text-lg font-semibold tracking-tight text-foreground">
              LectureNote AI
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-foreground",
                  pathname === item.href
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              isNotionConnected
                ? "border-green-500/50 text-green-400 hover:bg-green-500/10"
                : "border-muted-foreground/30 text-muted-foreground hover:bg-muted"
            )}
          >
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                isNotionConnected ? "bg-green-500" : "bg-muted-foreground"
              )}
            />
            {isNotionConnected ? "노션 연결됨" : "노션 연결 필요"}
          </Link>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-medium text-foreground">
            김
          </div>
        </div>
      </div>
    </header>
  )
}
