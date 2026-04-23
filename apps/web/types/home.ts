export type HomeRunStatus = 'queued' | 'running' | 'completed' | 'blocked'
export type HomeAttachmentType = 'document' | 'sheet' | 'image' | 'brief'
export type HomeMessageRole = 'system' | 'user' | 'assistant'

export interface HomeRun {
  id: string
  title: string
  status: HomeRunStatus
  model: string
  promptPreview: string
  createdAt: string
  updatedAt: string
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

export interface HomeChatThread {
  runId: string
  title: string
  status: HomeRunStatus
  model: string
  createdAt: string
  updatedAt: string
  promptPreview: string
  summary: string
  attachments: HomeAttachment[]
  messages: HomeChatMessage[]
  outputs: HomeChatOutput[]
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
