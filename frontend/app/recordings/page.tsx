"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink, Calendar, Clock, FileText } from "lucide-react"

interface Recording {
  id: string
  title: string
  date: string
  duration: string
  summary: string
  notionUrl: string
}

const MOCK_RECORDINGS: Recording[] = [
  {
    id: "1",
    title: "머신러닝 기초 - 신경망 구조",
    date: "2026-02-05",
    duration: "45:32",
    summary: "머신러닝의 기본 원리와 지도학습/비지도학습의 차이점, 신경망 구조와 역전파 알고리즘...",
    notionUrl: "https://notion.so/example1",
  },
  {
    id: "2",
    title: "데이터 구조 - 트리와 그래프",
    date: "2026-02-04",
    duration: "52:18",
    summary: "이진 트리의 탐색 방법, 그래프 탐색 알고리즘(BFS, DFS), 최단 경로 알고리즘...",
    notionUrl: "https://notion.so/example2",
  },
  {
    id: "3",
    title: "운영체제 - 프로세스 관리",
    date: "2026-02-03",
    duration: "48:45",
    summary: "프로세스와 스레드의 차이, CPU 스케줄링 알고리즘, 동기화와 교착상태...",
    notionUrl: "https://notion.so/example3",
  },
]

export default function RecordingsPage() {
  const [isNotionConnected, setIsNotionConnected] = useState(false)

  useEffect(() => {
    const notionToken = localStorage.getItem("notion_token")
    const notionDatabaseId = localStorage.getItem("notion_database_id")
    setIsNotionConnected(!!notionToken && !!notionDatabaseId)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Header isNotionConnected={isNotionConnected} />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">녹음 기록</h1>
            <p className="text-muted-foreground">
              지금까지 녹음하고 정리된 강의 목록입니다
            </p>
          </div>

          <div className="space-y-4">
            {MOCK_RECORDINGS.map((recording) => (
              <Card key={recording.id} className="border-border bg-card hover:bg-card/80 transition-colors">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <h3 className="text-lg font-semibold text-foreground">
                        {recording.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {recording.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {recording.duration}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {recording.summary}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-border bg-transparent text-foreground hover:bg-muted"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        상세보기
                      </Button>
                      <Button
                        asChild
                        size="sm"
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        <a href={recording.notionUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          노션
                        </a>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {MOCK_RECORDINGS.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                아직 녹음 기록이 없습니다
              </h3>
              <p className="text-muted-foreground">
                강의를 녹음하면 여기에 표시됩니다
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
