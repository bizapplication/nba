export type HomeRunStatus = 'queued' | 'running' | 'completed' | 'blocked'
export type HomeAttachmentType = 'document' | 'sheet' | 'image' | 'brief'
export type HomeMessageRole = 'system' | 'user' | 'assistant'
export type HomeActionKind = 'file' | 'command' | 'browser'
export type HomeActionStatus = 'pending' | 'approved' | 'rejected' | 'completed' | 'failed'

export interface HomeRun {
  id: string
  title: string
  status: HomeRunStatus
  model: string
  promptPreview: string
  createdAt: string
  attachmentCount: number
  summary: string
}

export interface HomeAttachment {
  id: string
  name: string
  type: HomeAttachmentType
  sizeLabel: string
}

export interface HomeChatMessage {
  id: string
  role: HomeMessageRole
  content: string
  createdAt: string
}

export interface HomeChatOutput {
  id: string
  label: string
  description: string
}

export interface HomeActionRequest {
  id: string
  kind: HomeActionKind
  status: HomeActionStatus
  title: string
  summary: string
  target: string | null
  requestedAt: string
  updatedAt: string
  resultSummary: string | null
  errorMessage: string | null
  payload: Record<string, unknown>
}

export interface HomeChatThread {
  id: string
  title: string
  status: HomeRunStatus
  model: string
  createdAt: string
  promptPreview: string
  summary: string
  attachmentCount: number
  attachments: HomeAttachment[]
  messages: HomeChatMessage[]
  actionRequests: HomeActionRequest[]
}

export interface HomeModelOption {
  value: string
  label: string
  note: string
}

export interface HomePromptPreset {
  id: string
  label: string
  prompt: string
}

export interface HomePromptGroup {
  title: string
  presets: HomePromptPreset[]
}
