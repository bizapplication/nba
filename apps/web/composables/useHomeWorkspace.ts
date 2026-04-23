import type {
  HomeAttachment,
  HomeAttachmentType,
  HomeChatMessage,
  HomeChatThread,
  HomeModelOption,
  HomePromptGroup,
  HomeRun,
  HomeRunStatus
} from '~/types/home'

const homeModelOptions: HomeModelOption[] = [
  { value: 'openai-gpt-5-4', label: 'OpenAI · GPT-5.4', note: '适合复杂拆解、跨模块分析与长上下文整理。' },
  { value: 'google-gemini-3-1', label: 'Google · Gemini 3.1', note: '适合多来源归纳、经营摘要与长文整理。' },
  { value: 'kimi-kimi-2-6', label: 'Kimi · Kimi 2.6', note: '适合中文材料梳理、会议纪要和草稿写作。' },
  { value: 'minimax-2-7', label: 'MiniMax · MiniMax 2.7', note: '适合快速探索、轻量问答与首版草稿生成。' }
]

const homePromptGroups: HomePromptGroup[] = [
  {
    title: '通用问答',
    presets: [
      {
        id: 'general-weekly-brief',
        label: '整理本周重点',
        prompt: '请结合我即将上传的资料，整理本周需要向管理层汇报的重点、风险和下一步动作。'
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
        prompt: '请站在经营分析视角，梳理本月关账差异、潜在成因，以及需要 Finance 优先核对的清单。'
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
        id: 'task-draft-mail',
        label: '起草协同邮件',
        prompt: '请起草一封内部协同邮件，向采购、财务和 HR 同步当前待处理事项、优先级和需要补充的数据。'
      },
      {
        id: 'task-prepare-report',
        label: '生成汇报提纲',
        prompt: '请把当前任务整理成一份适合老板快速浏览的汇报提纲，强调业务影响、处理策略和需决策事项。'
      }
    ]
  }
]

const fallbackModel: HomeModelOption = homeModelOptions[0] ?? {
  value: 'openai-gpt-5-4',
  label: 'OpenAI · GPT-5.4',
  note: '适合复杂拆解、跨模块分析与长上下文整理。'
}

const HOME_UNIMPLEMENTED_REPLY = '当前功能未实现'

const seedRuns: HomeRun[] = [
  {
    id: 'run-quarter-close-20260421',
    title: '核对 3 月关账差异',
    status: 'running',
    model: 'OpenAI · GPT-5.4',
    promptPreview: '对比总账、付款和收款回流记录，解释当前差异来源并列出优先处理顺序。',
    createdAt: '2026-04-21 09:40',
    updatedAt: '2026-04-21 09:40',
    attachmentCount: 2,
    summary: '正在拆解差异成因，预计会输出一份面向 Finance 的核对清单。'
  },
  {
    id: 'run-procurement-forecast-20260421',
    title: '预测未来两周采购付款压力',
    status: 'completed',
    model: 'Google · Gemini 3.1',
    promptPreview: '结合采购订单、供应商发票和付款节奏，给出未来两周的现金占用预估。',
    createdAt: '2026-04-21 08:25',
    updatedAt: '2026-04-21 08:25',
    attachmentCount: 1,
    summary: '已形成付款优先级建议，并归纳出两项需要业务负责人决策的节点。'
  },
  {
    id: 'run-expense-risk-20260420',
    title: '扫描报销单执行风险',
    status: 'blocked',
    model: 'Kimi · Kimi 2.6',
    promptPreview: '帮我筛出当前报销执行中最可能影响月底结算的异常项，并说明缺口。',
    createdAt: '2026-04-20 16:10',
    updatedAt: '2026-04-20 16:10',
    attachmentCount: 3,
    summary: '发现员工归属与付款账户信息缺失，已标记为需补资料的阻塞项。'
  }
]

const seedThreads: HomeChatThread[] = [
  {
    runId: 'run-quarter-close-20260421',
    title: '核对 3 月关账差异',
    status: 'running',
    model: 'OpenAI · GPT-5.4',
    createdAt: '2026-04-21 09:40',
    updatedAt: '2026-04-21 09:40',
    promptPreview: '对比总账、付款和收款回流记录，解释当前差异来源并列出优先处理顺序。',
    summary: '正在拆解差异成因，预计会输出一份面向 Finance 的核对清单。',
    attachments: [
      { id: 'att-close-ledger', name: 'march-close-ledger.xlsx', type: 'sheet', sizeLabel: '2.4 MB' },
      { id: 'att-close-notes', name: 'close-notes.pdf', type: 'document', sizeLabel: '640 KB' }
    ],
    messages: [
      {
        id: 'msg-close-user',
        role: 'user',
        content: '对比总账、付款和收款回流记录，解释当前差异来源并列出优先处理顺序。',
        createdAt: '2026-04-21 09:40'
      },
      {
        id: 'msg-close-assistant',
        role: 'assistant',
        content: HOME_UNIMPLEMENTED_REPLY,
        createdAt: '2026-04-21 09:42'
      }
    ],
    outputs: [
      { id: 'out-close-checklist', label: '核对清单草稿', description: '面向 Finance 的差异核对步骤，包含优先级与建议负责人。' },
      { id: 'out-close-risk', label: '风险摘要', description: '列出若本周不处理，可能影响月底对账的三个风险点。' }
    ]
  },
  {
    runId: 'run-procurement-forecast-20260421',
    title: '预测未来两周采购付款压力',
    status: 'completed',
    model: 'Google · Gemini 3.1',
    createdAt: '2026-04-21 08:25',
    updatedAt: '2026-04-21 08:25',
    promptPreview: '结合采购订单、供应商发票和付款节奏，给出未来两周的现金占用预估。',
    summary: '已形成付款优先级建议，并归纳出两项需要业务负责人决策的节点。',
    attachments: [
      { id: 'att-proc-forecast', name: 'vendor-payment-forecast.xlsx', type: 'sheet', sizeLabel: '1.8 MB' }
    ],
    messages: [
      {
        id: 'msg-proc-user',
        role: 'user',
        content: '结合采购订单、供应商发票和付款节奏，给出未来两周的现金占用预估。',
        createdAt: '2026-04-21 08:25'
      },
      {
        id: 'msg-proc-assistant',
        role: 'assistant',
        content: HOME_UNIMPLEMENTED_REPLY,
        createdAt: '2026-04-21 08:27'
      }
    ],
    outputs: [
      { id: 'out-proc-brief', label: '付款优先级建议', description: '按金额、供应风险和交付依赖排序的建议列表。' },
      { id: 'out-proc-summary', label: '经营摘要', description: '适合转发给老板的两段式结论摘要。' }
    ]
  },
  {
    runId: 'run-expense-risk-20260420',
    title: '扫描报销单执行风险',
    status: 'blocked',
    model: 'Kimi · Kimi 2.6',
    createdAt: '2026-04-20 16:10',
    updatedAt: '2026-04-20 16:10',
    promptPreview: '帮我筛出当前报销执行中最可能影响月底结算的异常项，并说明缺口。',
    summary: '发现员工归属与付款账户信息缺失，已标记为需补资料的阻塞项。',
    attachments: [
      { id: 'att-expense-claims', name: 'expense-claims.csv', type: 'sheet', sizeLabel: '780 KB' },
      { id: 'att-expense-policy', name: 'expense-policy.pdf', type: 'document', sizeLabel: '420 KB' },
      { id: 'att-expense-mail', name: 'pending-approvals.msg', type: 'brief', sizeLabel: '96 KB' }
    ],
    messages: [
      {
        id: 'msg-expense-user',
        role: 'user',
        content: '帮我筛出当前报销执行中最可能影响月底结算的异常项，并说明缺口。',
        createdAt: '2026-04-20 16:10'
      },
      {
        id: 'msg-expense-assistant',
        role: 'assistant',
        content: HOME_UNIMPLEMENTED_REPLY,
        createdAt: '2026-04-20 16:12'
      }
    ],
    outputs: [
      { id: 'out-expense-gap', label: '资料缺口列表', description: '列出需要 HR 和 Finance 补齐的信息项。' }
    ]
  }
]

function cloneAttachment(attachment: HomeAttachment): HomeAttachment {
  return { ...attachment }
}

function cloneRun(run: HomeRun): HomeRun {
  return { ...run }
}

function cloneMessage(message: HomeChatMessage): HomeChatMessage {
  return { ...message }
}

function cloneThread(thread: HomeChatThread): HomeChatThread {
  return {
    ...thread,
    attachments: thread.attachments.map(cloneAttachment),
    messages: thread.messages.map(cloneMessage),
    outputs: thread.outputs.map((output) => ({ ...output }))
  }
}

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

function createThreadMap(threads: HomeChatThread[]) {
  return Object.fromEntries(threads.map((thread) => [thread.runId, cloneThread(thread)]))
}

export function useHomeWorkspace() {
  const runSequence = useState('home-run-sequence', () => 4)
  const conversationTick = useState('home-conversation-tick', () => 0)
  const runs = useState<HomeRun[]>('home-runs', () => seedRuns.map(cloneRun))
  const threads = useState<Record<string, HomeChatThread>>('home-threads', () => createThreadMap(seedThreads))
  const selectedModel = useState('home-selected-model', () => fallbackModel.value)
  const draftPrompt = useState('home-draft-prompt', () => '')
  const draftAttachments = useState<HomeAttachment[]>('home-draft-attachments', () => [])

  const modelOptions = homeModelOptions
  const promptGroups = homePromptGroups

  const currentModel = computed(() => {
    return modelOptions.find((option) => option.value === selectedModel.value) ?? fallbackModel
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
    { label: '本周经营摘要', value: '12 项', hint: '待管理层确认的经营动作', tone: 'primary' },
    { label: '高风险事项', value: '3 项', hint: '涉及付款、关账与报销处理', tone: 'warning' },
    { label: '关键待办', value: '7 项', hint: '跨 Finance / Procurement / HR 的联动项', tone: 'success' },
    { label: 'Agent run', value: `${runs.value.length} 条`, hint: '当前前端演示态中的最近执行记录', tone: 'neutral' }
  ])

  const dashboardTrend = [
    { label: 'Mon', value: 38 },
    { label: 'Tue', value: 52 },
    { label: 'Wed', value: 44 },
    { label: 'Thu', value: 66 },
    { label: 'Fri', value: 61 },
    { label: 'Sat', value: 47 },
    { label: 'Sun', value: 58 }
  ]

  const dashboardRiskAlerts = [
    {
      title: '采购付款窗口临近',
      level: '高优先级',
      description: '两笔供应商付款如果继续滞后，可能会影响下周收货排期和现金安排。'
    },
    {
      title: '关账差异待核对',
      level: '处理中',
      description: '当前 mock run 已指向 Finance 对账问题，需要进一步确认过账时间与业务时间差。'
    },
    {
      title: '报销资料缺口',
      level: '待补资料',
      description: '部分报销单缺少付款账户与员工归属信息，无法顺畅进入执行阶段。'
    }
  ]

  const dashboardTodos = [
    { title: '确认采购付款优先级', owner: '采购负责人', dueAt: '2026-04-22 10:00' },
    { title: '补齐报销资料缺口', owner: 'HR Ops', dueAt: '2026-04-22 15:00' },
    { title: '完成 Finance 差异核对', owner: 'Finance Lead', dueAt: '2026-04-23 12:00' }
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

  function nextId(prefix: string) {
    const value = runSequence.value
    runSequence.value += 1
    return `${prefix}-${value}`
  }

  function formatTimestamp(date: Date) {
    const year = date.getFullYear()
    const month = `${date.getMonth() + 1}`.padStart(2, '0')
    const day = `${date.getDate()}`.padStart(2, '0')
    const hour = `${date.getHours()}`.padStart(2, '0')
    const minute = `${date.getMinutes()}`.padStart(2, '0')
    return `${year}-${month}-${day} ${hour}:${minute}`
  }

  function nextTimestamp() {
    const date = new Date('2026-04-23T09:30:00')
    date.setMinutes(date.getMinutes() + conversationTick.value)
    conversationTick.value += 1
    return formatTimestamp(date)
  }

  function normalizePrompt(prompt: string) {
    const trimmed = prompt.trim()

    if (trimmed.length > 0) {
      return trimmed
    }

    if (draftAttachments.value.length > 0) {
      return '请结合我刚上传的资料继续处理。'
    }

    return '请告诉我接下来应该关注什么。'
  }

  function setPrompt(prompt: string) {
    draftPrompt.value = prompt
  }

  function setSelectedModel(value: string) {
    selectedModel.value = value
  }

  function removeDraftAttachment(id: string) {
    draftAttachments.value = draftAttachments.value.filter((attachment) => attachment.id !== id)
  }

  function clearDraft() {
    draftPrompt.value = ''
    draftAttachments.value = []
  }

  function addDraftFiles(files: File[] | FileList) {
    const nextAttachments = Array.from(files).map<HomeAttachment>((file) => ({
      id: nextId('attachment'),
      name: file.name,
      type: fileTypeFromName(file.name),
      sizeLabel: formatFileSize(file.size)
    }))

    if (nextAttachments.length > 0) {
      draftAttachments.value = [...draftAttachments.value, ...nextAttachments]
    }
  }

  function createMockRun(payload?: { prompt?: string }) {
    const safePrompt = normalizePrompt(payload?.prompt ?? draftPrompt.value)
    const createdAt = nextTimestamp()
    const title = safePrompt.length > 18 ? `${safePrompt.slice(0, 18)}…` : safePrompt
    const modelLabel = currentModel.value.label
    const attachmentSnapshot = draftAttachments.value.map(cloneAttachment)
    const runId = nextId('run-home')

    const run: HomeRun = {
      id: runId,
      title,
      status: 'completed',
      model: modelLabel,
      promptPreview: safePrompt,
      createdAt,
      updatedAt: createdAt,
      attachmentCount: attachmentSnapshot.length,
      summary: HOME_UNIMPLEMENTED_REPLY
    }

    const thread: HomeChatThread = {
      runId,
      title,
      status: run.status,
      model: modelLabel,
      createdAt,
      updatedAt: createdAt,
      promptPreview: safePrompt,
      summary: run.summary,
      attachments: attachmentSnapshot,
      messages: [
        {
          id: nextId('message'),
          role: 'user',
          content: safePrompt,
          createdAt
        },
        {
          id: nextId('message'),
          role: 'assistant',
          content: HOME_UNIMPLEMENTED_REPLY,
          createdAt
        }
      ],
      outputs: [
        {
          id: nextId('output'),
          label: '占位输出',
          description: HOME_UNIMPLEMENTED_REPLY
        }
      ]
    }

    runs.value = [run, ...runs.value]
    threads.value = {
      [runId]: thread,
      ...threads.value
    }
    clearDraft()

    return run
  }

  function sendMessageToThread(runId: string, payload?: { prompt?: string }) {
    const existingThread = threads.value[runId]

    if (!existingThread) {
      return null
    }

    const safePrompt = normalizePrompt(payload?.prompt ?? draftPrompt.value)
    const createdAt = nextTimestamp()
    const attachmentSnapshot = draftAttachments.value.map(cloneAttachment)
    const nextThread: HomeChatThread = {
      ...cloneThread(existingThread),
      updatedAt: createdAt,
      attachments: [...existingThread.attachments.map(cloneAttachment), ...attachmentSnapshot],
      messages: [
        ...existingThread.messages.map(cloneMessage),
        {
          id: nextId('message'),
          role: 'user',
          content: safePrompt,
          createdAt
        },
        {
          id: nextId('message'),
          role: 'assistant',
          content: HOME_UNIMPLEMENTED_REPLY,
          createdAt
        }
      ],
      summary: HOME_UNIMPLEMENTED_REPLY
    }

    threads.value = {
      ...threads.value,
      [runId]: nextThread
    }

    runs.value = runs.value.map((run) => {
      if (run.id !== runId) {
        return run
      }

      return {
        ...run,
        status: 'completed',
        updatedAt: createdAt,
        attachmentCount: run.attachmentCount + attachmentSnapshot.length,
        summary: HOME_UNIMPLEMENTED_REPLY
      }
    })

    clearDraft()

    return nextThread
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
    modelOptions,
    orderedRuns,
    promptGroups,
    recentConversations,
    selectedModel,
    workflowShortcuts,
    workspaceChats,
    workspaceFiles,
    workspaceReports,
    addDraftFiles,
    clearDraft,
    createMockRun,
    getThread,
    removeDraftAttachment,
    sendMessageToThread,
    setPrompt,
    setSelectedModel
  }
}
