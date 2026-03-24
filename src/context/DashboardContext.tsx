import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  createAsyncLocalStorageDataSource,
  type AsyncDataSource,
} from '../lib/dataSource'
import { defaultData } from '../lib/defaultData'
import { newId } from '../lib/id'
import { migrateAppData } from '../lib/migrate'
import { createSupabaseAsyncDataSource } from '../lib/supabaseAsyncDataSource'
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabaseClient'
import type {
  AppData,
  BigProjectStatus,
  Priority,
  SmallProject,
  TaskSection,
} from '../lib/types'

function getOrCreateAsyncSource(): AsyncDataSource {
  if (isSupabaseConfigured()) {
    return createSupabaseAsyncDataSource(getSupabaseClient())
  }
  return createAsyncLocalStorageDataSource()
}

export type DashboardContextValue = {
  data: AppData
  selectedBigProjectIdx: number
  setSelectedBigProjectIdx: (i: number) => void
  toast: (msg: string) => void
  toastMessage: string | null
  exportJson: () => void
  importJsonFromFile: (file: File) => void
  exportMarkdown: () => void
  addTask: (
    section: 'today' | 'active' | 'someday',
    title: string,
    opts?: {
      priority?: Priority
      due?: string
      note?: string
      departmentId?: string | null
      assignee?: string
    },
  ) => void
  updateTaskAssignee: (
    section: TaskSection,
    taskId: string,
    assignee: string | undefined,
  ) => void
  updateTaskDepartment: (
    section: TaskSection,
    taskId: string,
    departmentId: string | null,
  ) => void
  addDepartment: (name: string) => void
  renameDepartment: (id: string, name: string) => void
  removeDepartment: (id: string) => void
  addDepartmentKpi: (
    departmentId: string,
    kpi: { name: string; target: string; current: string; note?: string },
  ) => void
  updateDepartmentKpi: (
    departmentId: string,
    kpiId: string,
    patch: Partial<{
      name: string
      target: string
      current: string
      note: string
    }>,
  ) => void
  removeDepartmentKpi: (departmentId: string, kpiId: string) => void
  toggleTask: (section: TaskSection, id: string) => void
  removeTask: (section: TaskSection, id: string) => void
  clearDone: () => void
  addWaiting: (raw: string) => void
  removeWaiting: (id: string) => void
  addSmallProject: (p: {
    name: string
    due?: string
    owner?: string
    departmentId?: string | null
    participants?: string[]
  }) => void
  updateSmallProject: (
    id: string,
    patch: Partial<
      Pick<
        SmallProject,
        'name' | 'due' | 'owner' | 'departmentId' | 'participants' | 'progress'
      >
    >,
  ) => void
  updateSmallProjectProgress: (id: string, progress: number) => void
  removeSmallProject: (id: string) => void
  addDeadline: (title: string, date: string, owner: string) => void
  removeDeadline: (id: string) => void
  updateMeetingNotes: (v: string) => void
  acknowledgeMeetingNotesSaved: () => void
  patchWeeklyReview: (partial: Partial<AppData['weeklyReview']>) => void
  acknowledgeWeeklySaved: () => void
  addBigProject: (fields: {
    name: string
    goal: string
    due: string
    pm: string
    desc: string
    departmentId?: string | null
  }) => void
  removeBigProject: (id: string) => void
  updateBigProjectStatus: (id: string, status: BigProjectStatus) => void
  updateBigProjectProgress: (id: string, progress: number) => void
  updateBigProjectDepartment: (id: string, departmentId: string | null) => void
  addMilestone: (
    projectId: string,
    m: { title: string; date: string; owner: string },
  ) => void
  toggleMilestone: (projectId: string, milestoneId: string) => void
  removeMilestone: (projectId: string, milestoneId: string) => void
  addTeamMember: (
    projectId: string,
    m: { name: string; role: string; tasks: string },
  ) => void
  removeTeamMember: (projectId: string, memberId: string) => void
  addSubtask: (
    projectId: string,
    s: { title: string; owner: string; due: string },
  ) => void
  toggleSubtask: (projectId: string, subtaskId: string) => void
  removeSubtask: (projectId: string, subtaskId: string) => void
  addRisk: (
    projectId: string,
    r: {
      title: string
      level: 'high' | 'mid' | 'low'
      desc: string
      owner: string
    },
  ) => void
  removeRisk: (projectId: string, riskId: string) => void
}

const DashboardContext = createContext<DashboardContextValue | null>(null)

export function DashboardProvider({ children }: { children: ReactNode }) {
  const sourceRef = useRef<AsyncDataSource | null>(null)
  if (!sourceRef.current) sourceRef.current = getOrCreateAsyncSource()

  const [data, setData] = useState<AppData>(() => defaultData())
  const [hydrated, setHydrated] = useState(false)
  const [selectedBigProjectIdx, setSelectedBigProjectIdx] = useState(0)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const toastT = useRef(0)

  useEffect(() => {
    let cancelled = false
    const src = sourceRef.current!
    ;(async () => {
      try {
        const loaded = await src.load()
        if (cancelled) return
        setData(migrateAppData(loaded))
      } catch (e) {
        console.error('載入資料失敗，已使用空白資料', e)
        if (!cancelled) setData(defaultData())
      } finally {
        if (!cancelled) setHydrated(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const selectedBigProjectIdxSafe = useMemo(() => {
    const n = data.bigProjects.length
    if (n === 0) return 0
    return Math.min(Math.max(0, selectedBigProjectIdx), n - 1)
  }, [data.bigProjects, selectedBigProjectIdx])

  const toast = useCallback((msg: string) => {
    setToastMessage(msg)
    window.clearTimeout(toastT.current)
    toastT.current = window.setTimeout(() => setToastMessage(null), 2500)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    const src = sourceRef.current!
    const t = window.setTimeout(() => {
      void src.save(data).catch((err) => {
        console.error('儲存失敗', err)
      })
    }, 450)
    return () => window.clearTimeout(t)
  }, [data, hydrated])

  const exportJson = useCallback(() => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'data.json'
    a.click()
    URL.revokeObjectURL(a.href)
    toast('已匯出 data.json')
  }, [data, toast])

  const importJsonFromFile = useCallback(
    (file: File) => {
      const reader = new FileReader()
      reader.onload = () => {
        try {
          const parsed = JSON.parse(String(reader.result))
          setData(migrateAppData(parsed))
          setSelectedBigProjectIdx(0)
          toast('資料已匯入')
        } catch {
          toast('檔案格式錯誤')
        }
      }
      reader.readAsText(file)
    },
    [toast],
  )

  const exportMarkdown = useCallback(() => {
    const wr = data.weeklyReview || {}
    const now = new Date().toLocaleDateString('zh-TW')
    const doneList =
      (data.done || []).map((t) => `- [x] ${t.title}`).join('\n') || '（無）'
    const md =
      `# 週報 ${now}\n\n` +
      `## 本週完成\n${doneList}\n\n` +
      `## 下週計畫\n${wr.next || ''}\n\n` +
      `## 阻礙 & 待解決\n${wr.blockers || ''}\n\n` +
      `## 反思\n${wr.reflection || ''}\n\n` +
      `---\n_Generated by 工作管理儀表板_`
    const blob = new Blob([md], { type: 'text/markdown' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `週報_${now.replace(/\//g, '-')}.md`
    a.click()
    URL.revokeObjectURL(a.href)
    toast('週報已匯出')
  }, [data, toast])

  const addTask = useCallback(
    (
      section: 'today' | 'active' | 'someday',
      title: string,
      opts?: {
        priority?: Priority
        due?: string
        note?: string
        departmentId?: string | null
        assignee?: string
      },
    ) => {
      const t = title.trim()
      if (!t) return
      const dept =
        opts?.departmentId === undefined
          ? null
          : opts.departmentId === '' || opts.departmentId == null
            ? null
            : opts.departmentId
      const assignee =
        opts?.assignee != null && opts.assignee.trim() !== ''
          ? opts.assignee.trim()
          : undefined
      setData((prev) => ({
        ...prev,
        [section]: [
          ...prev[section],
          {
            id: newId(),
            title: t,
            done: false,
            priority: opts?.priority ?? 'mid',
            created: new Date().toLocaleDateString('zh-TW'),
            departmentId: dept,
            assignee,
            due: opts?.due,
            note: opts?.note,
          },
        ],
      }))
    },
    [],
  )

  const updateTaskAssignee = useCallback(
    (section: TaskSection, taskId: string, assignee: string | undefined) => {
      const a =
        assignee != null && assignee.trim() !== ''
          ? assignee.trim()
          : undefined
      setData((prev) => ({
        ...prev,
        [section]: prev[section].map((t) =>
          t.id === taskId ? { ...t, assignee: a } : t,
        ),
      }))
    },
    [],
  )

  const updateTaskDepartment = useCallback(
    (section: TaskSection, taskId: string, departmentId: string | null) => {
      setData((prev) => ({
        ...prev,
        [section]: prev[section].map((t) =>
          t.id === taskId ? { ...t, departmentId } : t,
        ),
      }))
    },
    [],
  )

  const addDepartment = useCallback((name: string) => {
    const n = name.trim()
    if (!n) return
    setData((prev) => ({
      ...prev,
      departments: [...prev.departments, { id: newId(), name: n, kpis: [] }],
    }))
  }, [])

  const addDepartmentKpi = useCallback(
    (
      departmentId: string,
      kpi: { name: string; target: string; current: string; note?: string },
    ) => {
      const name = kpi.name.trim()
      if (!name) return
      setData((prev) => ({
        ...prev,
        departments: prev.departments.map((d) =>
          d.id === departmentId
            ? {
                ...d,
                kpis: [
                  ...d.kpis,
                  {
                    id: newId(),
                    name,
                    target: kpi.target.trim(),
                    current: kpi.current.trim(),
                    note: kpi.note?.trim() || undefined,
                  },
                ],
              }
            : d,
        ),
      }))
    },
    [],
  )

  const updateDepartmentKpi = useCallback(
    (
      departmentId: string,
      kpiId: string,
      patch: Partial<{
        name: string
        target: string
        current: string
        note: string
      }>,
    ) => {
      setData((prev) => ({
        ...prev,
        departments: prev.departments.map((d) =>
          d.id === departmentId
            ? {
                ...d,
                kpis: d.kpis.map((k) =>
                  k.id === kpiId ? { ...k, ...patch } : k,
                ),
              }
            : d,
        ),
      }))
    },
    [],
  )

  const removeDepartmentKpi = useCallback(
    (departmentId: string, kpiId: string) => {
      setData((prev) => ({
        ...prev,
        departments: prev.departments.map((d) =>
          d.id === departmentId
            ? { ...d, kpis: d.kpis.filter((k) => k.id !== kpiId) }
            : d,
        ),
      }))
    },
    [],
  )

  const renameDepartment = useCallback((id: string, name: string) => {
    const n = name.trim()
    if (!n) return
    setData((prev) => ({
      ...prev,
      departments: prev.departments.map((d) =>
        d.id === id ? { ...d, name: n } : d,
      ),
    }))
  }, [])

  const removeDepartment = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      departments: prev.departments.filter((d) => d.id !== id),
      today: prev.today.map((t) =>
        t.departmentId === id ? { ...t, departmentId: null } : t,
      ),
      active: prev.active.map((t) =>
        t.departmentId === id ? { ...t, departmentId: null } : t,
      ),
      someday: prev.someday.map((t) =>
        t.departmentId === id ? { ...t, departmentId: null } : t,
      ),
      done: prev.done.map((t) =>
        t.departmentId === id ? { ...t, departmentId: null } : t,
      ),
      projects: prev.projects.map((p) =>
        p.departmentId === id ? { ...p, departmentId: null } : p,
      ),
      bigProjects: prev.bigProjects.map((p) =>
        p.departmentId === id ? { ...p, departmentId: null } : p,
      ),
    }))
  }, [])

  const toggleTask = useCallback((section: TaskSection, id: string) => {
    setData((prev) => {
      const next = structuredClone(prev)
      const list = next[section]
      const i = list.findIndex((x) => x.id === id)
      if (i < 0) return prev
      const task = { ...list[i] }
      task.done = !task.done
      if (task.done && section !== 'done') {
        list.splice(i, 1)
        task.completedAt = new Date().toLocaleDateString('zh-TW')
        next.done.unshift(task)
      } else {
        list[i] = task
      }
      return next
    })
  }, [])

  const removeTask = useCallback((section: TaskSection, id: string) => {
    setData((prev) => ({
      ...prev,
      [section]: prev[section].filter((t) => t.id !== id),
    }))
  }, [])

  const clearDone = useCallback(() => {
    setData((prev) => ({ ...prev, done: [] }))
    toast('已清除已完成')
  }, [toast])

  const addWaiting = useCallback(
    (raw: string) => {
      const val = raw.trim()
      if (!val) return
      let who = ''
      let title = val
      const m = val.match(/^(.{1,10})[：:](.*)/)
      if (m) {
        who = m[1].trim()
        title = m[2].trim()
      }
      setData((prev) => ({
        ...prev,
        waiting: [
          ...prev.waiting,
          {
            id: newId(),
            title,
            who,
            since: new Date().toLocaleDateString('zh-TW'),
          },
        ],
      }))
    },
    [],
  )

  const removeWaiting = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      waiting: prev.waiting.filter((w) => w.id !== id),
    }))
  }, [])

  const addSmallProject = useCallback(
    (p: {
      name: string
      due?: string
      owner?: string
      departmentId?: string | null
      participants?: string[]
    }) => {
      const n = p.name.trim()
      if (!n) return
      const participants = (p.participants ?? [])
        .map((x) => String(x).trim())
        .filter(Boolean)
      const dept =
        p.departmentId === undefined || p.departmentId === ''
          ? null
          : p.departmentId
      setData((prev) => ({
        ...prev,
        projects: [
          ...prev.projects,
          {
            id: newId(),
            name: n,
            due: (p.due ?? '').trim(),
            owner: (p.owner ?? '').trim(),
            progress: 0,
            departmentId: dept,
            participants,
          },
        ],
      }))
    },
    [],
  )

  const updateSmallProject = useCallback(
    (
      id: string,
      patch: Partial<
        Pick<
          SmallProject,
          'name' | 'due' | 'owner' | 'departmentId' | 'participants' | 'progress'
        >
      >,
    ) => {
      setData((prev) => ({
        ...prev,
        projects: prev.projects.map((x) =>
          x.id === id ? { ...x, ...patch } : x,
        ),
      }))
    },
    [],
  )

  const updateSmallProjectProgress = useCallback((id: string, progress: number) => {
    const p = Math.min(100, Math.max(0, progress))
    setData((prev) => ({
      ...prev,
      projects: prev.projects.map((x) =>
        x.id === id ? { ...x, progress: p } : x,
      ),
    }))
  }, [])

  const removeSmallProject = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      projects: prev.projects.filter((p) => p.id !== id),
    }))
  }, [])

  const addDeadline = useCallback(
    (title: string, date: string, owner: string) => {
      const t = title.trim()
      const d = date.trim()
      if (!t || !d) return
      setData((prev) => ({
        ...prev,
        deadlines: [
          ...prev.deadlines,
          {
            id: newId(),
            title: t,
            date: d,
            owner: owner.trim(),
          },
        ],
      }))
    },
    [],
  )

  const removeDeadline = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      deadlines: prev.deadlines.filter((x) => x.id !== id),
    }))
  }, [])

  const updateMeetingNotes = useCallback((v: string) => {
    setData((prev) => ({ ...prev, meetingNotes: v }))
  }, [])

  const acknowledgeMeetingNotesSaved = useCallback(() => {
    toast('備忘已儲存')
  }, [toast])

  const patchWeeklyReview = useCallback(
    (partial: Partial<AppData['weeklyReview']>) => {
      setData((prev) => ({
        ...prev,
        weeklyReview: { ...prev.weeklyReview, ...partial },
      }))
    },
    [],
  )

  const acknowledgeWeeklySaved = useCallback(() => {
    toast('週報已儲存')
  }, [toast])

  const addBigProject = useCallback(
    (fields: {
      name: string
      goal: string
      due: string
      pm: string
      desc: string
      departmentId?: string | null
    }) => {
      const name = fields.name.trim()
      if (!name) return
      const id = newId()
      let newIndex = 0
      const dept =
        fields.departmentId === undefined || fields.departmentId === ''
          ? null
          : fields.departmentId
      setData((prev) => {
        const bigProjects = [
          ...prev.bigProjects,
          {
            id,
            name,
            goal: fields.goal.trim(),
            due: fields.due.trim(),
            pm: fields.pm.trim(),
            desc: fields.desc.trim(),
            departmentId: dept,
            status: 'active' as const,
            progress: 0,
            milestones: [],
            team: [],
            subtasks: [],
            risks: [],
          },
        ]
        newIndex = bigProjects.length - 1
        return { ...prev, bigProjects }
      })
      setSelectedBigProjectIdx(newIndex)
      toast('大型專案已建立')
    },
    [toast],
  )

  const removeBigProject = useCallback(
    (id: string) => {
      setData((prev) => ({
        ...prev,
        bigProjects: prev.bigProjects.filter((p) => p.id !== id),
      }))
      setSelectedBigProjectIdx(0)
      toast('專案已刪除')
    },
    [toast],
  )

  const updateBigProjectStatus = useCallback(
    (id: string, status: BigProjectStatus) => {
      setData((prev) => ({
        ...prev,
        bigProjects: prev.bigProjects.map((p) =>
          p.id === id ? { ...p, status } : p,
        ),
      }))
    },
    [],
  )

  const updateBigProjectProgress = useCallback((id: string, progress: number) => {
    const p = Math.min(100, Math.max(0, progress))
    setData((prev) => ({
      ...prev,
      bigProjects: prev.bigProjects.map((x) =>
        x.id === id ? { ...x, progress: p } : x,
      ),
    }))
  }, [])

  const updateBigProjectDepartment = useCallback(
    (id: string, departmentId: string | null) => {
      const dept =
        departmentId === '' || departmentId == null ? null : departmentId
      setData((prev) => ({
        ...prev,
        bigProjects: prev.bigProjects.map((p) =>
          p.id === id ? { ...p, departmentId: dept } : p,
        ),
      }))
    },
    [],
  )

  const addMilestone = useCallback(
    (
      projectId: string,
      m: { title: string; date: string; owner: string },
    ) => {
      const title = m.title.trim()
      if (!title) return
      setData((prev) => ({
        ...prev,
        bigProjects: prev.bigProjects.map((p) =>
          p.id === projectId
            ? {
                ...p,
                milestones: [
                  ...p.milestones,
                  {
                    id: newId(),
                    title,
                    date: m.date.trim(),
                    owner: m.owner.trim(),
                    done: false,
                  },
                ],
              }
            : p,
        ),
      }))
      toast('里程碑已新增')
    },
    [toast],
  )

  const toggleMilestone = useCallback((projectId: string, milestoneId: string) => {
    setData((prev) => ({
      ...prev,
      bigProjects: prev.bigProjects.map((p) =>
        p.id === projectId
          ? {
              ...p,
              milestones: p.milestones.map((m) =>
                m.id === milestoneId ? { ...m, done: !m.done } : m,
              ),
            }
          : p,
      ),
    }))
  }, [])

  const removeMilestone = useCallback((projectId: string, milestoneId: string) => {
    setData((prev) => ({
      ...prev,
      bigProjects: prev.bigProjects.map((p) =>
        p.id === projectId
          ? {
              ...p,
              milestones: p.milestones.filter((m) => m.id !== milestoneId),
            }
          : p,
      ),
    }))
  }, [])

  const addTeamMember = useCallback(
    (
      projectId: string,
      m: { name: string; role: string; tasks: string },
    ) => {
      const name = m.name.trim()
      if (!name) return
      setData((prev) => ({
        ...prev,
        bigProjects: prev.bigProjects.map((p) =>
          p.id === projectId
            ? {
                ...p,
                team: [
                  ...p.team,
                  {
                    id: newId(),
                    name,
                    role: m.role.trim(),
                    tasks: m.tasks.trim(),
                  },
                ],
              }
            : p,
      ),
      }))
      toast('成員已新增')
    },
    [toast],
  )

  const removeTeamMember = useCallback((projectId: string, memberId: string) => {
    setData((prev) => ({
      ...prev,
      bigProjects: prev.bigProjects.map((p) =>
        p.id === projectId
          ? { ...p, team: p.team.filter((t) => t.id !== memberId) }
          : p,
      ),
    }))
  }, [])

  const addSubtask = useCallback(
    (projectId: string, s: { title: string; owner: string; due: string }) => {
      const title = s.title.trim()
      if (!title) return
      setData((prev) => ({
        ...prev,
        bigProjects: prev.bigProjects.map((p) => {
          if (p.id !== projectId) return p
          const subtasks = [
            ...p.subtasks,
            {
              id: newId(),
              title,
              owner: s.owner.trim(),
              due: s.due.trim(),
              done: false,
            },
          ]
          const progress = subtasks.length
            ? Math.round(
                (subtasks.filter((x) => x.done).length / subtasks.length) * 100,
              )
            : p.progress
          return { ...p, subtasks, progress }
        }),
      }))
      toast('子任務已新增')
    },
    [toast],
  )

  const toggleSubtask = useCallback((projectId: string, subtaskId: string) => {
    setData((prev) => ({
      ...prev,
      bigProjects: prev.bigProjects.map((p) => {
        if (p.id !== projectId) return p
        const subtasks = p.subtasks.map((s) =>
          s.id === subtaskId ? { ...s, done: !s.done } : s,
        )
        const progress = subtasks.length
          ? Math.round(
              (subtasks.filter((s) => s.done).length / subtasks.length) * 100,
            )
          : p.progress
        return { ...p, subtasks, progress }
      }),
    }))
  }, [])

  const removeSubtask = useCallback((projectId: string, subtaskId: string) => {
    setData((prev) => ({
      ...prev,
      bigProjects: prev.bigProjects.map((p) => {
        if (p.id !== projectId) return p
        const subtasks = p.subtasks.filter((s) => s.id !== subtaskId)
        const progress = subtasks.length
          ? Math.round(
              (subtasks.filter((s) => s.done).length / subtasks.length) * 100,
            )
          : p.progress
        return { ...p, subtasks, progress }
      }),
    }))
  }, [])

  const addRisk = useCallback(
    (
      projectId: string,
      r: {
        title: string
        level: 'high' | 'mid' | 'low'
        desc: string
        owner: string
      },
    ) => {
      const title = r.title.trim()
      if (!title) return
      setData((prev) => ({
        ...prev,
        bigProjects: prev.bigProjects.map((p) =>
          p.id === projectId
            ? {
                ...p,
                risks: [
                  ...p.risks,
                  {
                    id: newId(),
                    title,
                    level: r.level,
                    desc: r.desc.trim(),
                    owner: r.owner.trim(),
                  },
                ],
              }
            : p,
        ),
      }))
      toast('風險已記錄')
    },
    [toast],
  )

  const removeRisk = useCallback((projectId: string, riskId: string) => {
    setData((prev) => ({
      ...prev,
      bigProjects: prev.bigProjects.map((p) =>
        p.id === projectId
          ? { ...p, risks: p.risks.filter((r) => r.id !== riskId) }
          : p,
      ),
    }))
  }, [])

  const value = useMemo(
    () => ({
      data,
      selectedBigProjectIdx: selectedBigProjectIdxSafe,
      setSelectedBigProjectIdx,
      toast,
      toastMessage,
      exportJson,
      importJsonFromFile,
      exportMarkdown,
      addTask,
      updateTaskAssignee,
      updateTaskDepartment,
      addDepartment,
      addDepartmentKpi,
      updateDepartmentKpi,
      removeDepartmentKpi,
      renameDepartment,
      removeDepartment,
      toggleTask,
      removeTask,
      clearDone,
      addWaiting,
      removeWaiting,
      addSmallProject,
      updateSmallProject,
      updateSmallProjectProgress,
      removeSmallProject,
      addDeadline,
      removeDeadline,
      updateMeetingNotes,
      acknowledgeMeetingNotesSaved,
      patchWeeklyReview,
      acknowledgeWeeklySaved,
      addBigProject,
      removeBigProject,
      updateBigProjectStatus,
      updateBigProjectProgress,
      updateBigProjectDepartment,
      addMilestone,
      toggleMilestone,
      removeMilestone,
      addTeamMember,
      removeTeamMember,
      addSubtask,
      toggleSubtask,
      removeSubtask,
      addRisk,
      removeRisk,
    }),
    [
      data,
      selectedBigProjectIdxSafe,
      toast,
      toastMessage,
      exportJson,
      importJsonFromFile,
      exportMarkdown,
      addTask,
      updateTaskAssignee,
      updateTaskDepartment,
      addDepartment,
      addDepartmentKpi,
      updateDepartmentKpi,
      removeDepartmentKpi,
      renameDepartment,
      removeDepartment,
      toggleTask,
      removeTask,
      clearDone,
      addWaiting,
      removeWaiting,
      addSmallProject,
      updateSmallProject,
      updateSmallProjectProgress,
      removeSmallProject,
      addDeadline,
      removeDeadline,
      updateMeetingNotes,
      acknowledgeMeetingNotesSaved,
      patchWeeklyReview,
      acknowledgeWeeklySaved,
      addBigProject,
      removeBigProject,
      updateBigProjectStatus,
      updateBigProjectProgress,
      updateBigProjectDepartment,
      addMilestone,
      toggleMilestone,
      removeMilestone,
      addTeamMember,
      removeTeamMember,
      addSubtask,
      toggleSubtask,
      removeSubtask,
      addRisk,
      removeRisk,
    ],
  )

  return (
    <DashboardContext.Provider value={value}>
      {!hydrated ? (
        <div className="app-loading" role="status">
          載入中…
        </div>
      ) : (
        children
      )}
      {hydrated && toastMessage ? (
        <div className="toast" role="status">
          {toastMessage}
        </div>
      ) : null}
    </DashboardContext.Provider>
  )
}

/* Provider 與 hook 同檔，方便維護 */
/* eslint-disable react-refresh/only-export-components */
export function useDashboard() {
  const ctx = useContext(DashboardContext)
  if (!ctx) {
    throw new Error('useDashboard must be used within DashboardProvider')
  }
  return ctx
}
