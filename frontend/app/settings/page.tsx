"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, AlertCircle, ExternalLink, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { notionConfigSchema, safeValidate } from "@/lib/validations"

export default function SettingsPage() {
  const [notionToken, setNotionToken] = useState("")
  const [notionDatabaseId, setNotionDatabaseId] = useState("")
  const [isSaved, setIsSaved] = useState(false)
  const [isNotionConnected, setIsNotionConnected] = useState(false)
  const [saveMessage, setSaveMessage] = useState("")

  // Load saved settings
  useEffect(() => {
    const savedToken = localStorage.getItem("notion_token")
    const savedDatabaseId = localStorage.getItem("notion_database_id")
    
    if (savedToken) setNotionToken(savedToken)
    if (savedDatabaseId) setNotionDatabaseId(savedDatabaseId)
    
    setIsNotionConnected(!!savedToken && !!savedDatabaseId)
  }, [])

  const handleSave = useCallback(() => {
    // Zod 검증
    const validation = safeValidate(notionConfigSchema, {
      token: notionToken,
      databaseId: notionDatabaseId,
    })

    if (!validation.success) {
      setSaveMessage(validation.error)
      setIsSaved(false)
      toast.error(validation.error)
      return
    }

    // 검증된 데이터 사용
    const { token, databaseId } = validation.data

    localStorage.setItem("notion_token", token)
    localStorage.setItem("notion_database_id", databaseId)

    setIsSaved(true)
    setIsNotionConnected(true)
    setSaveMessage("설정이 저장되었습니다")
    toast.success("설정이 저장되었습니다")

    setTimeout(() => {
      setIsSaved(false)
      setSaveMessage("")
    }, 3000)
  }, [notionToken, notionDatabaseId])

  const handleDisconnect = useCallback(() => {
    localStorage.removeItem("notion_token")
    localStorage.removeItem("notion_database_id")
    setNotionToken("")
    setNotionDatabaseId("")
    setIsNotionConnected(false)
    setSaveMessage("노션 연결이 해제되었습니다")
    toast.info("노션 연결이 해제되었습니다")

    setTimeout(() => {
      setSaveMessage("")
    }, 3000)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Header isNotionConnected={isNotionConnected} />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">설정</h1>
            <p className="text-muted-foreground">
              노션 연동 및 앱 설정을 관리합니다
            </p>
          </div>

          {/* Notion Integration Card */}
          <Card className="border-border bg-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <svg className="h-5 w-5" viewBox="0 0 100 100" fill="none">
                      <path d="M6.017 4.313l55.333 -4.087c6.797 -0.583 8.543 -0.19 12.817 2.917l17.663 12.443c2.913 2.14 3.883 2.723 3.883 5.053v68.243c0 4.277 -1.553 6.807 -6.99 7.193L24.467 99.967c-4.08 0.193 -6.023 -0.39 -8.16 -3.113L3.3 79.94c-2.333 -3.113 -3.3 -5.443 -3.3 -8.167V11.113c0 -3.497 1.553 -6.413 6.017 -6.8z" fill="currentColor"/>
                      <path d="M61.35 0.227l-55.333 4.087C1.553 4.7 0 7.617 0 11.113v60.66c0 2.723 0.967 5.053 3.3 8.167l13.007 16.913c2.137 2.723 4.08 3.307 8.16 3.113l64.257 -3.89c5.433 -0.387 6.99 -2.917 6.99 -7.193V20.64c0 -2.21 -0.873 -2.847 -3.443 -4.733L74.167 3.143c-4.273 -3.107 -6.02 -3.5 -12.817 -2.917zM25.92 19.523c-5.247 0.353 -6.437 0.433 -9.417 -1.99L8.927 11.507c-0.77 -0.78 -0.383 -1.753 1.557 -1.947l53.193 -3.887c4.467 -0.39 6.793 1.167 8.54 2.527l9.123 6.61c0.39 0.197 1.36 1.36 0.193 1.36l-54.933 3.307 -0.68 0.047zM19.803 88.3V30.367c0 -2.53 0.777 -3.697 3.103 -3.893L86 22.78c2.14 -0.193 3.107 1.167 3.107 3.693v57.547c0 2.53 -0.39 4.67 -3.883 4.863l-60.377 3.5c-3.493 0.193 -5.043 -0.97 -5.043 -4.083zm59.6 -54.827c0.387 1.75 0 3.5 -1.75 3.7l-2.91 0.577v42.773c-2.527 1.36 -4.853 2.137 -6.797 2.137 -3.107 0 -3.883 -0.973 -6.21 -3.887l-19.03 -29.94v28.967l6.02 1.363s0 3.5 -4.857 3.5l-13.39 0.777c-0.39 -0.78 0 -2.723 1.357 -3.11l3.497 -0.97v-38.3L30.48 40.667c-0.39 -1.75 0.58 -4.277 3.3 -4.473l14.367 -0.967 19.8 30.327v-26.83l-5.047 -0.58c-0.39 -2.143 1.163 -3.7 3.103 -3.89l13.4 -0.78z" fill="white"/>
                    </svg>
                    노션 연동
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    강의 요약을 저장할 노션 계정을 연결하세요
                  </CardDescription>
                </div>
                {isNotionConnected && (
                  <div className="flex items-center gap-2 text-green-400 text-sm">
                    <Check className="h-4 w-4" />
                    연결됨
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Instructions */}
              <div className="rounded-lg bg-muted/50 p-4 space-y-3">
                <h4 className="font-medium text-foreground text-sm">연동 방법</h4>
                <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                  <li>
                    <a 
                      href="https://www.notion.so/my-integrations" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      Notion Integrations 페이지
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    에서 새 Integration을 생성하세요
                  </li>
                  <li>생성된 Integration의 Internal Integration Secret을 복사하세요</li>
                  <li>노션에서 강의록을 저장할 데이터베이스를 만들고 Integration을 연결하세요</li>
                  <li>데이터베이스 URL에서 Database ID를 복사하세요</li>
                </ol>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="notion-token" className="text-foreground">
                    Notion Integration Token
                  </Label>
                  <Input
                    id="notion-token"
                    type="password"
                    placeholder="secret_xxxxxxxxxxxxxxxxxxxx"
                    value={notionToken}
                    onChange={(e) => setNotionToken(e.target.value)}
                    className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
                  />
                  <p className="text-xs text-muted-foreground">
                    Integration 설정에서 찾을 수 있는 Internal Integration Secret
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notion-database" className="text-foreground">
                    Notion Database ID
                  </Label>
                  <Input
                    id="notion-database"
                    type="text"
                    placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    value={notionDatabaseId}
                    onChange={(e) => setNotionDatabaseId(e.target.value)}
                    className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
                  />
                  <p className="text-xs text-muted-foreground">
                    데이터베이스 URL에서 복사: notion.so/[Database ID]?v=...
                  </p>
                </div>
              </div>

              {/* Save Message */}
              {saveMessage && (
                <div className={cn(
                  "flex items-center gap-2 text-sm p-3 rounded-lg",
                  isSaved 
                    ? "bg-green-500/10 text-green-400" 
                    : "bg-destructive/10 text-destructive"
                )}>
                  {isSaved ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  {saveMessage}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={handleSave}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  설정 저장
                </Button>
                {isNotionConnected && (
                  <Button
                    variant="outline"
                    onClick={handleDisconnect}
                    className="border-destructive text-destructive bg-transparent hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    연결 해제
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Additional Settings Card */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">앱 설정</CardTitle>
              <CardDescription className="text-muted-foreground">
                기타 앱 설정을 관리합니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <p className="text-foreground font-medium">자동 저장</p>
                  <p className="text-sm text-muted-foreground">녹음 완료 후 자동으로 노션에 저장</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-foreground font-medium">음성 품질</p>
                  <p className="text-sm text-muted-foreground">녹음 음질 설정</p>
                </div>
                <select className="bg-muted border border-border rounded-lg px-3 py-2 text-foreground text-sm">
                  <option value="high">높음</option>
                  <option value="medium">보통</option>
                  <option value="low">낮음</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
