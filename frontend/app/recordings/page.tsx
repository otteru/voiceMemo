"use client"

import { useState, useEffect, useCallback } from "react"
import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink, Calendar, Clock, FileText, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { recordingsApi, notionApi } from "@/lib/api"
import type { Recording } from "@/types"

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
}

export default function RecordingsPage() {
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [isNotionConnected, setIsNotionConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadRecordings = useCallback(async () => {
    try {
      const data = await recordingsApi.list()
      setRecordings(data)
    } catch {
      toast.error("녹음 목록을 불러오지 못했습니다")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadRecordings()
    notionApi.checkConnection()
      .then(({ connected }) => setIsNotionConnected(connected))
      .catch(() => setIsNotionConnected(false))
  }, [loadRecordings])

  const handleDelete = useCallback(async (id: string) => {
    setDeletingId(id)
    try {
      await recordingsApi.delete(id)
      setRecordings((prev) => prev.filter((r) => r.id !== id))
      toast.success("녹음이 삭제되었습니다")
    } catch {
      toast.error("삭제에 실패했습니다")
    } finally {
      setDeletingId(null)
    }
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

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              {recordings.map((recording) => (
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
                            {formatDate(recording.createdAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {formatDuration(recording.duration)}
                          </span>
                          {recording.status !== "complete" && (
                            <span className="text-yellow-500">
                              {recording.status === "stt" && "STT 처리 중..."}
                              {recording.status === "ai" && "AI 요약 중..."}
                              {recording.status === "idle" && "대기 중"}
                            </span>
                          )}
                        </div>
                        {recording.summary && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {recording.summary}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {recording.notionUrl && (
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
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(recording.id)}
                          disabled={deletingId === recording.id}
                          className="border-destructive text-destructive bg-transparent hover:bg-destructive/10"
                        >
                          {deletingId === recording.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!isLoading && recordings.length === 0 && (
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
