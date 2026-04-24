import type {
  HomeActionRequest,
  HomeAttachment,
  HomeAttachmentType,
  HomeChatThread,
  HomeModelOption,
  HomePromptGroup,
  HomeRun
} from '~/types/home'

const homeModelOptions: HomeModelOption[] = [
  { value: 'openai/gpt-5.4', label: 'OpenAI · GPT-5.4', note: '默认连接 OpenClaw sidecar，适合复杂拆解与多轮追问。' },
  { value: 'demo/openclaw-readonly', label: 'OpenClaw · Readonly', note: '只读阶段会先调 CRM / ERP 工具，再生成答复或审批请求。' }
]

const fallbackModelOption: HomeModelOption = homeModelOptions[0] ?? {
  value: 'openai/gpt-5.4',
  label: 'OpenAI · GPT-5.4',
  note: '默认连接 OpenClaw sidecar，适合复杂拆解与多轮追问。'
}

const homePromptGroups: HomePromptGroup[] = [
  {
    title: '业务查询',
    presets: [
      {
        id: 'crm-summary',
        label: 'CRM 概览',
        prompt: '请读取当前 CRM 的客户、商机和订单数据，整理一个适合业务负责人看的概览。'
      },
      {
        id: 'erp-finance',
        label: 'ERP 财务概览',
        prompt: '请读取当前 ERP 财务账户和交易数据，帮我做一份简要经营摘要。'
      }
    ]
  },
  {
    title: '工作区操作',
    presets: [
      {
        id: 'file-change',
        label: '生成文件审批',
        prompt: '请帮我修改当前仓库里的 README，先生成一个待审批的文件操作请求。'
      },
      {
        id: 'browser-open',
        label: '浏览器审批',
        prompt: '请打开 http://127.0.0.1:3000/home 并检查首页是否正常加载，先生成浏览器操作审批。'
      }
    ]
  }
]

function fileTypeFromName(name: string): HomeAttachmentType {
  const lowerName = name.toLowerCase()

  if (lowerName.endsWith('.xls') || lowerName.endsWith('.xlsx') || lowerName.endsWith('.csv')) {
    return 'sheet'
  }

  if (lowerName.endsWith('.png') || lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg') || lowerName.endsWith('.webp')) {
    return 'image'
  }

  if (lowerName.endsWith('.msg') || lowerName.endsWith('.md') || lowerName.endsWith('.txt')) {
    return 'brief'
  }

  return 'document'
}

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`
  }

  if (size >= 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`
  }

  return `${Math.max(1, size)} B`
}

function normalizeRun(input: Record<string, unknown>): HomeRun {
  return {
    id: String(input.id),
    title: String(input.title),
    status: String(input.status) as HomeRun['status'],
    model: String(input.model),
    promptPreview: String(input.promptPreview),
    createdAt: String(input.createdAt),
    attachmentCount: Number(input.attachmentCount ?? 0),
    summary: String(input.summary ?? '')
  }
}

function normalizeThread(input: Record<string, unknown>): HomeChatThread {
  return {
    id: String(input.id),
    title: String(input.title),
    status: String(input.status) as HomeChatThread['status'],
    model: String(input.model),
    createdAt: String(input.createdAt),
    promptPreview: String(input.promptPreview),
    summary: String(input.summary ?? ''),
    attachmentCount: Number(input.attachmentCount ?? 0),
    attachments: Array.isArray(input.attachments)
      ? input.attachments.map((item) => {
          const attachment = item as Record<string, unknown>
          return {
            id: String(attachment.id),
            name: String(attachment.name),
            type: fileTypeFromName(String(attachment.name)),
            sizeLabel: String(attachment.sizeLabel ?? '')
          } satisfies HomeAttachment
        })
      : [],
    messages: Array.isArray(input.messages)
      ? input.messages.map((item) => {
          const message = item as Record<string, unknown>
          return {
            id: String(message.id),
            role: String(message.role) as HomeChatThread['messages'][number]['role'],
            content: String(message.content ?? ''),
            createdAt: String(message.createdAt)
          }
        })
      : [],
    actionRequests: Array.isArray(input.actionRequests)
      ? input.actionRequests.map((item) => {
          const action = item as Record<string, unknown>
          return {
            id: String(action.id),
            kind: String(action.kind) as HomeActionRequest['kind'],
            status: String(action.status) as HomeActionRequest['status'],
            title: String(action.title),
            summary: String(action.summary),
            target: action.target ? String(action.target) : null,
            requestedAt: String(action.requestedAt),
            updatedAt: String(action.updatedAt),
            resultSummary: action.resultSummary ? String(action.resultSummary) : null,
            errorMessage: action.errorMessage ? String(action.errorMessage) : null,
            payload: (action.payload as Record<string, unknown>) || {}
          }
        })
      : []
  }
}

async function postFormData(url: string, input: { prompt: string, model?: string, files?: File[] }) {
  const formData = new FormData()
  formData.set('prompt', input.prompt)

  if (input.model) {
    formData.set('model', input.model)
  }

  for (const file of input.files ?? []) {
    formData.append('files', file)
  }

  return $fetch<Record<string, unknown>>(url, {
    method: 'POST',
    body: formData
  })
}

export function useHomeWorkspace() {
  const runs = useState<HomeRun[]>('home-runs', () => [])
  const threads = useState<Record<string, HomeChatThread>>('home-threads', () => ({}))
  const draftPrompt = useState('home-draft-prompt', () => '')
  const selectedModel = useState('home-selected-model', () => homeModelOptions[0]?.value ?? 'openai/gpt-5.4')
  const draftFiles = useState<File[]>('home-draft-files', () => [])
  const isLoadingRuns = useState('home-runs-loading', () => false)
  const isSubmittingRun = useState('home-submit-loading', () => false)

  const modelOptions = computed(() => homeModelOptions)
  const promptGroups = computed(() => homePromptGroups)
  const currentModel = computed(() => {
    return homeModelOptions.find((item) => item.value === selectedModel.value) ?? fallbackModelOption
  })

  const draftAttachments = computed(() => {
    return draftFiles.value.map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}`,
      name: file.name,
      type: fileTypeFromName(file.name),
      sizeLabel: formatFileSize(file.size)
    }) satisfies HomeAttachment)
  })

  const orderedRuns = computed(() => {
    return [...runs.value].sort((left, right) => {
      return Date.parse(right.createdAt) - Date.parse(left.createdAt)
    })
  })

  const pendingActionRequests = computed(() => {
    return Object.values(threads.value)
      .flatMap((thread) => thread.actionRequests.map((action) => ({ ...action, runId: thread.id, runTitle: thread.title })))
      .filter((action) => action.status === 'pending')
  })

  function setPrompt(prompt: string) {
    draftPrompt.value = prompt
  }

  function setSelectedModel(model: string | null) {
    if (model) {
      selectedModel.value = model
    }
  }

  function addDraftFiles(files: FileList | File[]) {
    const incoming = Array.from(files)
    draftFiles.value = [...draftFiles.value, ...incoming]
  }

  function removeDraftAttachment(id: string) {
    draftFiles.value = draftFiles.value.filter((file) => `${file.name}-${file.size}-${file.lastModified}` !== id)
  }

  function clearDraft() {
    draftPrompt.value = ''
    draftFiles.value = []
  }

  async function refreshRuns() {
    isLoadingRuns.value = true

    try {
      const response = await $fetch<{ data: Record<string, unknown>[] }>('/api/agent/runs')
      runs.value = response.data.map((item) => normalizeRun(item))
    } finally {
      isLoadingRuns.value = false
    }
  }

  async function ensureThread(runId: string) {
    if (threads.value[runId]) {
      return threads.value[runId]
    }

    const response = await $fetch<Record<string, unknown>>(`/api/agent/runs/${runId}`)
    const thread = normalizeThread(response)
    threads.value = {
      ...threads.value,
      [runId]: thread
    }
    runs.value = [
      normalizeRun(response),
      ...runs.value.filter((item) => item.id !== runId)
    ]
    return thread
  }

  async function createRunFromDraft() {
    isSubmittingRun.value = true

    try {
      const response = await postFormData('/api/agent/runs', {
        prompt: draftPrompt.value,
        model: selectedModel.value,
        files: draftFiles.value
      })
      const thread = normalizeThread(response)
      threads.value = {
        ...threads.value,
        [thread.id]: thread
      }
      runs.value = [normalizeRun(response), ...runs.value.filter((item) => item.id !== thread.id)]
      clearDraft()
      return thread
    } finally {
      isSubmittingRun.value = false
    }
  }

  async function sendMessage(runId: string, prompt: string, files: File[] = []) {
    const response = await postFormData(`/api/agent/runs/${runId}/messages`, {
      prompt,
      files
    })
    const thread = normalizeThread(response)
    threads.value = {
      ...threads.value,
      [runId]: thread
    }
    runs.value = [normalizeRun(response), ...runs.value.filter((item) => item.id !== runId)]
    return thread
  }

  async function approveAction(runId: string, requestId: string) {
    const response = await $fetch<Record<string, unknown>>(`/api/agent/runs/${runId}/action-requests/${requestId}/approve`, {
      method: 'POST'
    })
    const thread = normalizeThread(response)
    threads.value = {
      ...threads.value,
      [runId]: thread
    }
    runs.value = [normalizeRun(response), ...runs.value.filter((item) => item.id !== runId)]
    return thread
  }

  async function rejectAction(runId: string, requestId: string) {
    const response = await $fetch<Record<string, unknown>>(`/api/agent/runs/${runId}/action-requests/${requestId}/reject`, {
      method: 'POST'
    })
    const thread = normalizeThread(response)
    threads.value = {
      ...threads.value,
      [runId]: thread
    }
    runs.value = [normalizeRun(response), ...runs.value.filter((item) => item.id !== runId)]
    return thread
  }

  const dashboardMetrics = computed(() => {
    const allThreads = Object.values(threads.value)

    return {
      totalRuns: orderedRuns.value.length,
      completedRuns: orderedRuns.value.filter((run) => run.status === 'completed').length,
      blockedRuns: orderedRuns.value.filter((run) => run.status === 'blocked').length,
      pendingApprovals: allThreads.flatMap((thread) => thread.actionRequests).filter((action) => action.status === 'pending').length,
      attachments: orderedRuns.value.reduce((count, run) => count + run.attachmentCount, 0)
    }
  })

  return {
    clearDraft,
    currentModel,
    dashboardMetrics,
    draftAttachments,
    draftPrompt,
    isLoadingRuns,
    isSubmittingRun,
    modelOptions,
    orderedRuns,
    pendingActionRequests,
    promptGroups,
    selectedModel,
    addDraftFiles,
    approveAction,
    createRunFromDraft,
    ensureThread,
    refreshRuns,
    rejectAction,
    removeDraftAttachment,
    sendMessage,
    setPrompt,
    setSelectedModel
  }
}
