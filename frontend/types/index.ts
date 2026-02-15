/**
 * 애플리케이션 전역 타입 정의
 */

// ========================================
// App State Types
// ========================================

/** 애플리케이션 상태 */
export type AppState = "idle" | "recording" | "processing" | "complete"

/** 처리 단계 */
export type ProcessingStep = "idle" | "stt" | "ai" | "notion" | "complete"

// ========================================
// Recording Types
// ========================================

/** 녹음 기록 (Backend RecordingResponse 매칭) */
export interface Recording {
  id: string
  title: string
  duration: number
  sttText: string | null
  summary: string | null
  notionUrl: string | null
  status: string
  progress: number
  createdAt: string
  updatedAt: string
}

/** 녹음 생성 요청 */
export interface CreateRecordingRequest {
  audioBlob: Blob
  title?: string
}

/** 녹음 생성 응답 (Backend RecordingCreateResponse 매칭) */
export interface RecordingCreateResponse {
  id: string
  status: string
  message: string
}

/** 녹음 처리 상태 응답 (Backend RecordingStatusResponse 매칭) */
export interface RecordingStatusResponse {
  status: string
  progress: number
}

// ========================================
// Notion Types
// ========================================

/** Notion 설정 */
export interface NotionConfig {
  token: string
  pageUrl: string
}

/** Notion 연결 상태 */
export interface NotionStatus {
  isConnected: boolean
  lastChecked?: Date
}

/** Notion 저장 요청 */
export interface SaveToNotionRequest {
  recordingId: string
  summary: string
  title: string
}

// ========================================
// API Response Types
// ========================================

/** API 성공 응답 */
export interface ApiSuccessResponse<T = any> {
  success: true
  data: T
  message?: string
}

/** API 에러 응답 */
export interface ApiErrorResponse {
  success: false
  error: string
  details?: string
}

/** API 응답 (성공 또는 실패) */
export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse

// ========================================
// Component Props Types
// ========================================

/** 헤더 Props */
export interface HeaderProps {
  isNotionConnected?: boolean
}

/** 녹음 버튼 Props */
export interface RecordButtonProps {
  isRecording: boolean
  onClick: () => void
}

/** 오디오 파형 Props */
export interface AudioWaveformProps {
  isActive: boolean
}

/** 처리 상태 Props */
export interface ProcessingStatusProps {
  currentStep: ProcessingStep
}

/** 요약 미리보기 Props */
export interface SummaryPreviewProps {
  summary: string
  notionUrl: string
  onReset: () => void
}

/** 기능 카드 Props */
export interface FeatureCardProps {
  icon: React.ComponentType<{ className?: string }>
  iconColor: string
  iconBgColor: string
  title: string
  description: string
}

// ========================================
// Report Types (실시간 모드 보고서)
// ========================================

/** 점진적 보고서 요청 */
export interface ProgressiveReportRequest {
  transcriptChunk: string
  previousReport: string | null
  chunkIndex: number
}

/** 점진적 보고서 응답 */
export interface ProgressiveReportResponse {
  report: string
  chunkIndex: number
}

/** 보고서 청크 (이력 추적용) */
export interface ReportChunk {
  index: number
  report: string
  timestamp: number
}

// ========================================
// Settings Types
// ========================================

/** 앱 설정 */
export interface AppSettings {
  autoSave: boolean
  audioQuality: "high" | "medium" | "low"
}
