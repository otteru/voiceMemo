"use client"

import { useEffect, useState } from "react"

interface AudioWaveformProps {
  isActive: boolean
}

export function AudioWaveform({ isActive }: AudioWaveformProps) {
  const [bars, setBars] = useState<number[]>(Array(40).fill(0.1))

  useEffect(() => {
    if (!isActive) {
      setBars(Array(40).fill(0.1))
      return
    }

    const interval = setInterval(() => {
      setBars(
        Array(40)
          .fill(0)
          .map(() => Math.random() * 0.8 + 0.2)
      )
    }, 100)

    return () => clearInterval(interval)
  }, [isActive])

  return (
    <div className="flex h-16 items-center justify-center gap-1">
      {bars.map((height, index) => (
        <div
          key={index}
          className="w-1 rounded-full bg-primary transition-all duration-100"
          style={{
            height: `${height * 100}%`,
            opacity: isActive ? 1 : 0.3,
          }}
        />
      ))}
    </div>
  )
}
