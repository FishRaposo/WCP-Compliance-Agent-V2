export interface CheckResult {
  id: string
  type: string
  status: 'pass' | 'fail' | 'warning'
  severity?: 'critical' | 'high' | 'medium' | 'low'
  regulation?: string
  message: string
  details?: Record<string, unknown>
}

export interface DeterministicReport {
  role?: string
  hours?: number
  wage?: number
  fringe?: number
  grossPay?: number
  dbwdRate?: { base: number; fringe: number; total: number }
  checks: CheckResult[]
  score: number
  extractedFields?: Record<string, unknown>
}

export interface LLMVerdict {
  status: 'Approved' | 'Revise' | 'Reject' | 'Pending Human Review'
  rationale: string
  referencedCheckIds: string[]
  citations?: string[]
  confidence?: number
  selfReportedConfidence?: number
  reasoningTrace?: string
  model?: string
  tokenUsage?: { prompt: number; completion: number; total: number }
  mockMode?: boolean
}

export interface TrustScore {
  score: number
  band: 'auto' | 'flag_for_review' | 'require_human'
  components?: {
    deterministic?: number
    classification?: number
    llmSelf?: number
    agreement?: number
  }
  reasons?: string[]
}

export interface HumanReview {
  required: boolean
  status?: 'pending' | 'approved' | 'rejected' | 'escalated'
  queuedAt?: string
}

export interface AnalysisResult {
  finalStatus: 'Approved' | 'Revise' | 'Reject' | 'Pending Human Review'
  deterministic: DeterministicReport
  verdict: LLMVerdict
  trust: TrustScore
  humanReview?: HumanReview
  auditTrail?: Array<{ layer: string; timestamp: string; event: string; data?: unknown }>
  traceId?: string
  requestId?: string
  timestamp?: string
  mockMode?: boolean
}
