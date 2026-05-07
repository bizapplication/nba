import type {
  HomeActionRequest,
  HomeAttachment,
  HomeAttachmentType,
  HomeChatOutput,
  HomeChatThread,
  HomeModelOption,
  HomePromptGroup,
  HomeRun,
  HomeRunStatus
} from '~/types/home'

const homeModelOptions: HomeModelOption[] = [
  { value: 'deepseek/deepseek-v4-flash', label: 'DeepSeek · V4 Flash', note: '默认连接本地 OpenClaw sidecar，使用 DEEPSEEK_API_KEY 即可开箱启动。' },
  { value: 'openclaw/nba-demo-readonly', label: 'OpenClaw · Readonly', note: '只读阶段会先调 CRM / ERP 工具，再生成答复或审批请求。' }
]

const fallbackModel: HomeModelOption = homeModelOptions[0] ?? {
  value: 'deepseek/deepseek-v4-flash',
  label: 'DeepSeek · V4 Flash',
  note: '默认连接本地 OpenClaw sidecar，使用 DEEPSEEK_API_KEY 即可开箱启动。'
}

const homePromptGroups: HomePromptGroup[] = [
  {
    title: '通用问答',
    presets: [
      {
        id: 'general-weekly-brief',
        label: '整理本周重点',
        prompt: '请结合当前 CRM 和 ERP 数据，整理本周需要向管理层汇报的重点、风险和下一步动作。'
      },
      {
        id: 'general-meeting-summary',
        label: '生成会议纪要',
        prompt: '请把当前信息整理成一份高可读的会议纪要，包含结论、待办、负责人和时间节点。'
      }
    ]
  },
  {
    title: '企业查询',
    presets: [
      {
        id: 'business-close-check',
        label: '核对关账差异',
        prompt: '请读取 ERP 财务账户和交易数据，梳理本月关账差异、潜在成因，以及需要 Finance 优先核对的清单。'
      },
      {
        id: 'business-cash-risk',
        label: '现金流风险扫描',
        prompt: '请从现金流和采购付款压力出发，识别未来两周最需要提前处理的风险点。'
      }
    ]
  },
  {
    title: '任务执行',
    presets: [
      {
        id: 'task-file-change',
        label: '生成文件审批',
        prompt: '请在 demo-files/agent-note.txt 写一行本地 Agent demo 已连通，先生成待审批文件操作。'
      },
      {
        id: 'task-browser-check',
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

function statusWeight(status: HomeRunStatus) {
  switch (status) {
    case 'running':
      return 0
    case 'queued':
      return 1
    case 'blocked':
      return 2
    default:
      return 3
  }
}

function fileId(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`
}

function normalizeRun(input: Record<string, unknown>): HomeRun {
  return {
    id: String(input.id),
    title: String(input.title ?? '未命名会话'),
    status: String(input.status ?? 'completed') as HomeRunStatus,
    model: String(input.model ?? fallbackModel.value),
    promptPreview: String(input.promptPreview ?? ''),
    createdAt: String(input.createdAt ?? ''),
    updatedAt: String(input.updatedAt ?? input.createdAt ?? ''),
    attachmentCount: Number(input.attachmentCount ?? 0),
    summary: String(input.summary ?? '')
  }
}

function normalizeDedupeText(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function timestampValue(value: string) {
  const timestamp = Date.parse(value)
  return Number.isNaN(timestamp) ? 0 : timestamp
}

function dedupeAccidentalRuns(items: HomeRun[]) {
  const sorted = [...items].sort((left, right) => timestampValue(right.createdAt) - timestampValue(left.createdAt))
  const deduped: HomeRun[] = []

  for (const run of sorted) {
    const duplicatedByFastSubmit = deduped.some((existing) => {
      const samePrompt = normalizeDedupeText(existing.promptPreview) === normalizeDedupeText(run.promptPreview)
      const sameModel = existing.model === run.model
      const createdDelta = Math.abs(timestampValue(existing.createdAt) - timestampValue(run.createdAt))

      return samePrompt && sameModel && createdDelta <= 15_000
    })

    if (!duplicatedByFastSubmit) {
      deduped.push(run)
    }
  }

  return deduped.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
}

function normalizeAttachment(input: Record<string, unknown>): HomeAttachment {
  const name = String(input.name ?? 'attachment')

  return {
    id: String(input.id ?? name),
    name,
    type: fileTypeFromName(name),
    sizeLabel: String(input.sizeLabel ?? '')
  }
}

function normalizeAction(input: Record<string, unknown>, runId: string): HomeActionRequest {
  return {
    id: String(input.id),
    runId,
    kind: String(input.kind ?? 'file') as HomeActionRequest['kind'],
    status: String(input.status ?? 'pending') as HomeActionRequest['status'],
    title: String(input.title ?? '待审批动作'),
    summary: String(input.summary ?? ''),
    target: input.target ? String(input.target) : null,
    requestedAt: String(input.requestedAt ?? ''),
    updatedAt: String(input.updatedAt ?? input.requestedAt ?? ''),
    resultSummary: input.resultSummary ? String(input.resultSummary) : null,
    errorMessage: input.errorMessage ? String(input.errorMessage) : null,
    payload: (input.payload as Record<string, unknown>) || {}
  }
}

function buildOutputs(thread: HomeChatThread): HomeChatOutput[] {
  if (thread.actionRequests.length > 0) {
    return thread.actionRequests.map((action) => ({
      id: action.id,
      label: action.title,
      description: action.resultSummary || action.errorMessage || action.summary
    }))
  }

  const assistantMessage = [...thread.messages].reverse().find((message) => message.role === 'assistant')

  if (!assistantMessage) {
    return []
  }

  return [
    {
      id: `${thread.runId}-assistant-output`,
      label: '最新答复',
      description: assistantMessage.content
    }
  ]
}

function normalizeThread(input: Record<string, unknown>): HomeChatThread {
  const run = normalizeRun(input)
  const messages = Array.isArray(input.messages)
    ? input.messages.map((item) => {
        const message = item as Record<string, unknown>
        return {
          id: String(message.id),
          role: String(message.role ?? 'assistant') as HomeChatThread['messages'][number]['role'],
          content: String(message.content ?? ''),
          createdAt: String(message.createdAt ?? '')
        }
      })
    : []
  const attachments = Array.isArray(input.attachments)
    ? input.attachments.map((item) => normalizeAttachment(item as Record<string, unknown>))
    : []
  const actionRequests = Array.isArray(input.actionRequests)
    ? input.actionRequests.map((item) => normalizeAction(item as Record<string, unknown>, run.id))
    : []
  const thread: HomeChatThread = {
    runId: run.id,
    title: run.title,
    status: run.status,
    model: run.model,
    createdAt: run.createdAt,
    updatedAt: run.updatedAt,
    promptPreview: run.promptPreview,
    summary: run.summary,
    attachments,
    messages,
    actionRequests,
    outputs: []
  }

  thread.outputs = buildOutputs(thread)

  return thread
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

function normalizePrompt(prompt: string, hasFiles: boolean) {
  const trimmed = prompt.trim()

  if (trimmed.length > 0) {
    return trimmed
  }

  if (hasFiles) {
    return '请结合我刚上传的资料继续处理。'
  }

  return '请告诉我接下来应该关注什么。'
}

export function useHomeWorkspace() {
  const runs = useState<HomeRun[]>('home-runs', () => [])
  const threads = useState<Record<string, HomeChatThread>>('home-threads', () => ({}))
  const selectedModel = useState('home-selected-model', () => fallbackModel.value)
  const draftPrompt = useState('home-draft-prompt', () => '')
  const draftFiles = useState<File[]>('home-draft-files', () => [])
  const isLoadingRuns = useState('home-runs-loading', () => false)
  const isSubmittingRun = useState('home-submit-loading', () => false)
  const isSendingMessage = useState('home-message-loading', () => false)
  const pendingActionId = useState<string | null>('home-action-pending-id', () => null)

  const modelOptions = homeModelOptions
  const promptGroups = homePromptGroups
  const dashboardTrend = [
    { label: 'Mon', value: 38 },
    { label: 'Tue', value: 52 },
    { label: 'Wed', value: 44 },
    { label: 'Thu', value: 66 },
    { label: 'Fri', value: 61 },
    { label: 'Sat', value: 47 },
    { label: 'Sun', value: 58 }
  ]
  const workflowShortcuts = [
    {
      title: '生成经营汇报提纲',
      description: '从问题、结论、风险和行动四段式整理输出。',
      prompt: '请帮我生成一份适合老板快速浏览的经营汇报提纲。'
    },
    {
      title: '整理跨部门同步纪要',
      description: '把采购、财务、HR 的最新动作收成一页式纪要。',
      prompt: '请把当前跨部门同步内容整理成纪要，并按负责人拆分待办。'
    },
    {
      title: '扫描月底结算风险',
      description: '聚焦关账、付款和报销执行的阻塞点。',
      prompt: '请从月底结算视角扫描风险，并给出建议的处理顺序。'
    }
  ]

  const currentModel = computed(() => {
    return modelOptions.find((option) => option.value === selectedModel.value) ?? fallbackModel
  })

  const draftAttachments = computed<HomeAttachment[]>(() => {
    return draftFiles.value.map((file) => ({
      id: fileId(file),
      name: file.name,
      type: fileTypeFromName(file.name),
      sizeLabel: formatFileSize(file.size)
    }))
  })

  const orderedRuns = computed(() => {
    return [...runs.value].sort((left, right) => {
      const statusDelta = statusWeight(left.status) - statusWeight(right.status)
      if (statusDelta !== 0) {
        return statusDelta
      }

      return right.updatedAt.localeCompare(left.updatedAt)
    })
  })

  const recentConversations = computed(() => {
    return [...runs.value].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
  })

  const pendingActionRequests = computed(() => {
    return Object.values(threads.value)
      .flatMap((thread) => thread.actionRequests.map((action) => ({ ...action, runTitle: thread.title })))
      .filter((action) => action.status === 'pending')
  })

  const workspaceFiles = computed(() => {
    return orderedRuns.value.flatMap((run) => {
      const thread = threads.value[run.id]
      return (thread?.attachments ?? []).map((attachment) => ({
        ...attachment,
        runId: run.id,
        runTitle: run.title
      }))
    }).slice(0, 6)
  })

  const workspaceReports = computed(() => {
    return orderedRuns.value.flatMap((run) => {
      const thread = threads.value[run.id]
      return (thread?.outputs ?? []).map((output) => ({
        ...output,
        runId: run.id,
        runTitle: run.title,
        status: run.status
      }))
    }).slice(0, 5)
  })

  const workspaceChats = computed(() => {
    return recentConversations.value.slice(0, 5)
  })

  const dashboardKpis = computed(() => [
    { label: '已保存 run', value: `${runs.value.length} 条`, hint: '本地 Agent API 持久化的真实运行记录', tone: 'primary' },
    { label: '待审批动作', value: `${pendingActionRequests.value.length} 项`, hint: '文件、命令和浏览器动作会先等待放行', tone: 'warning' },
    { label: '已完成 run', value: `${runs.value.filter((run) => run.status === 'completed').length} 条`, hint: '已经形成答复或执行完成的任务', tone: 'success' },
    { label: '阻塞 run', value: `${runs.value.filter((run) => run.status === 'blocked').length} 条`, hint: '通常表示等待审批或执行失败', tone: 'neutral' }
  ])

  const dashboardRiskAlerts = computed(() => {
    return pendingActionRequests.value.slice(0, 3).map((action) => ({
      title: action.title,
      level: action.kind === 'command' ? '高优先级' : '待审批',
      description: `${action.runTitle}：${action.summary}`
    }))
  })

  const dashboardTodos = computed(() => {
    return orderedRuns.value.slice(0, 3).map((run) => ({
      title: run.title,
      owner: run.model,
      dueAt: run.updatedAt
    }))
  })

  function setPrompt(prompt: string) {
    draftPrompt.value = prompt
  }

  function setSelectedModel(value: string) {
    selectedModel.value = value
  }

  function removeDraftAttachment(id: string) {
    draftFiles.value = draftFiles.value.filter((file) => fileId(file) !== id)
  }

  function clearDraft() {
    draftPrompt.value = ''
    draftFiles.value = []
  }

  function addDraftFiles(files: File[] | FileList) {
    const incoming = Array.from(files)

    if (incoming.length > 0) {
      draftFiles.value = [...draftFiles.value, ...incoming]
    }
  }

  function upsertThread(input: Record<string, unknown>) {
    const thread = normalizeThread(input)
    threads.value = {
      ...threads.value,
      [thread.runId]: thread
    }
    runs.value = dedupeAccidentalRuns([
      normalizeRun(input),
      ...runs.value.filter((run) => run.id !== thread.runId)
    ])
    return thread
  }

  async function refreshRuns() {
    isLoadingRuns.value = true

    try {
      const response = await $fetch<{ data: Record<string, unknown>[] }>('/api/agent/runs')
      runs.value = dedupeAccidentalRuns(response.data.map((item) => normalizeRun(item)))
    } finally {
      isLoadingRuns.value = false
    }
  }

  async function ensureThread(runId: string) {
    const response = await $fetch<Record<string, unknown>>(`/api/agent/runs/${runId}`)
    return upsertThread(response)
  }

  async function createMockRun(payload?: { prompt?: string }) {
    if (isSubmittingRun.value) {
      return null
    }

    isSubmittingRun.value = true

    try {
      const prompt = normalizePrompt(payload?.prompt ?? draftPrompt.value, draftFiles.value.length > 0)
      const response = await postFormData('/api/agent/runs', {
        prompt,
        model: selectedModel.value,
        files: draftFiles.value
      })
      const thread = upsertThread(response)
      clearDraft()
      return normalizeRun(response)
    } finally {
      isSubmittingRun.value = false
    }
  }

  async function sendMessageToThread(runId: string, payload?: { prompt?: string }) {
    if (isSendingMessage.value) {
      return getThread(runId)
    }

    isSendingMessage.value = true

    try {
      const prompt = normalizePrompt(payload?.prompt ?? draftPrompt.value, draftFiles.value.length > 0)
      const response = await postFormData(`/api/agent/runs/${runId}/messages`, {
        prompt,
        files: draftFiles.value
      })
      const thread = upsertThread(response)
      clearDraft()
      return thread
    } finally {
      isSendingMessage.value = false
    }
  }

  async function approveAction(runId: string, requestId: string) {
    pendingActionId.value = requestId

    try {
      const response = await $fetch<Record<string, unknown>>(`/api/agent/runs/${runId}/action-requests/${requestId}/approve`, {
        method: 'POST'
      })
      return upsertThread(response)
    } finally {
      pendingActionId.value = null
    }
  }

  async function rejectAction(runId: string, requestId: string) {
    pendingActionId.value = requestId

    try {
      const response = await $fetch<Record<string, unknown>>(`/api/agent/runs/${runId}/action-requests/${requestId}/reject`, {
        method: 'POST'
      })
      return upsertThread(response)
    } finally {
      pendingActionId.value = null
    }
  }

  function getThread(runId: string) {
    return threads.value[runId] ?? null
  }

  return {
    currentModel,
    dashboardKpis,
    dashboardRiskAlerts,
    dashboardTodos,
    dashboardTrend,
    draftAttachments,
    draftPrompt,
    isLoadingRuns,
    isSendingMessage,
    isSubmittingRun,
    modelOptions,
    orderedRuns,
    pendingActionId,
    pendingActionRequests,
    promptGroups,
    recentConversations,
    selectedModel,
    workflowShortcuts,
    workspaceChats,
    workspaceFiles,
    workspaceReports,
    addDraftFiles,
    approveAction,
    clearDraft,
    createMockRun,
    ensureThread,
    getThread,
    refreshRuns,
    rejectAction,
    removeDraftAttachment,
    sendMessageToThread,
    setPrompt,
    setSelectedModel
  }
}
