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
import { SupabaseEmailAuthBar } from '../components/SupabaseEmailAuthBar'
import {
  createAsyncLocalStorageDataSource,
  readPersistedLocalAppData,
  type AsyncDataSource,
} from '../lib/dataSource'
import { defaultData, emptyBossWeeklyReport } from '../lib/defaultData'
import { toISODateLocal } from '../lib/dateUtils'
import { newId } from '../lib/id'
import {
  isAssigneeInDepartmentRoster,
  reconcileSubtaskAssigneesToDepartment,
} from '../lib/taskAssignment'
import { migrateAppData } from '../lib/migrate'
import { exampleBossWeeklyReportHen20260318 } from '../lib/bossWeeklyReportExampleData'
import { appendDoneTasksToAccomplished } from '../lib/weeklyAccomplished'
import { prepareAppDataForPersist } from '../lib/persistPayload'
import { reconcileAppDataRoster } from '../lib/rosterReconcile'
import {
  createSupabaseAsyncDataSource,
  isSupabaseAsyncDataSource,
} from '../lib/supabaseAsyncDataSource'
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabaseClient'
import type {
  AppData,
  AppUiPrefs,
  BigProjectStatus,
  Priority,
  SmallProject,
  TaskItem,
  TaskSection,
  TaskSubtask,
  WaitingItem,
} from '../lib/types'

function getOrCreateAsyncSource(): AsyncDataSource {
  if (isSupabaseConfigured()) {
    return createSupabaseAsyncDataSource(getSupabaseClient())
  }
  return createAsyncLocalStorageDataSource()
}

export type DashboardContextValue = {
  data: AppData
  /** 首次載入完成（可讀寫雲端／本機資料後） */
  hydrated: boolean
  /** 合併寫入 payload.ui，undefined 的值會移除該欄位 */
  updateUiPrefs: (partial: Partial<AppUiPrefs>) => void
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
      weeklyCommit?: boolean
      smallProjectId?: string
    },
  ) => boolean
  updateTaskMeta: (
    section: TaskSection,
    taskId: string,
    patch: { title?: string; note?: string },
  ) => void
  updateTaskDue: (
    section: TaskSection,
    taskId: string,
    due: string | undefined,
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
  toggleTaskWeeklyCommit: (section: TaskSection, taskId: string) => void
  updateTaskSmallProject: (
    section: TaskSection,
    taskId: string,
    smallProjectId: string | null,
  ) => void
  addTaskSubtask: (section: TaskSection, taskId: string, title: string) => boolean
  removeTaskSubtask: (
    section: TaskSection,
    taskId: string,
    subtaskId: string,
  ) => void
  toggleTaskSubtask: (
    section: TaskSection,
    taskId: string,
    subtaskId: string,
  ) => void
  updateTaskSubtask: (
    section: TaskSection,
    taskId: string,
    subtaskId: string,
    patch: Partial<Pick<TaskSubtask, 'title' | 'due' | 'assignee'>>,
  ) => void
  addDepartment: (name: string) => void
  renameDepartment: (id: string, name: string) => void
  removeDepartment: (id: string) => void
  addTeamRosterMember: (
    name: string,
    role?: string,
    departmentId?: string | null,
  ) => void
  updateTeamRosterMember: (
    id: string,
    patch: Partial<{ name: string; role: string; departmentId: string | null }>,
  ) => void
  removeTeamRosterMember: (id: string) => void
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
  updateWaitingItem: (
    id: string,
    patch: Partial<Pick<WaitingItem, 'who' | 'title' | 'since' | 'expectedBy'>>,
  ) => void
  appendDoneToWeeklyAccomplished: () => void
  addSmallProject: (p: {
    name: string
    due?: string
    owner?: string
    departmentId?: string | null
    participants?: string[]
    /** 建立專案時一併建立之任務（建議填寫，專案應至少有一項任務） */
    initialTaskTitle?: string
    initialTaskSection?: 'today' | 'active' | 'someday'
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
  patchBossWeeklyReport: (partial: Partial<AppData['bossWeeklyReport']>) => void
  /** 載入 Hen 2026/03/18 格式參考範例（有內容時會先確認） */
  applyBossWeeklyReportExampleHen20260318: () => void
  clearBossWeeklyReport: () => void
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

  /** 僅在資料來源成功載入（或從本機備份復原）後才自動存檔，避免載入失敗時用空白狀態覆寫雲端 */
  const mayPersistRef = useRef(false)
  /** 首次已成功套用遠端／備援資料後才為 true；避免 SIGNED_IN 早於此時觸發 save 用預設空白覆寫雲端 */
  const initialDataLoadedRef = useRef(false)
  const [authSubscriptionReady, setAuthSubscriptionReady] = useState(false)

  const [data, setData] = useState<AppData>(() => defaultData())
  const [hydrated, setHydrated] = useState(false)
  const [cloudNeedsEmail, setCloudNeedsEmail] = useState(false)
  const [selectedBigProjectIdx, setSelectedBigProjectIdx] = useState(0)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const toastT = useRef(0)

  const toast = useCallback((msg: string) => {
    setToastMessage(msg)
    window.clearTimeout(toastT.current)
    toastT.current = window.setTimeout(() => setToastMessage(null), 4500)
  }, [])

  const dataRef = useRef(data)
  dataRef.current = data
  const hydratedRef = useRef(hydrated)
  hydratedRef.current = hydrated
  const toastRef = useRef(toast)
  toastRef.current = toast

  const updateUiPrefs = useCallback((partial: Partial<AppUiPrefs>) => {
    setData((prev) => {
      const nextUi: AppUiPrefs = { ...prev.ui }
      for (const [k, v] of Object.entries(partial) as [
        keyof AppUiPrefs,
        AppUiPrefs[keyof AppUiPrefs],
      ][]) {
        if (v === undefined) delete nextUi[k]
        else (nextUi as Record<string, unknown>)[k as string] = v
      }
      return { ...prev, ui: nextUi }
    })
  }, [])

  const reloadFromRemote = useCallback(async () => {
    try {
      const src = sourceRef.current!
      if (
        hydratedRef.current &&
        mayPersistRef.current &&
        initialDataLoadedRef.current
      ) {
        try {
          const repaired = await src.save(dataRef.current)
          if (repaired != null) setData(repaired)
        } catch {
          /* 先存再拉失敗時仍嘗試載入雲端 */
        }
      }
      const loaded = await src.load()
      setData((p) => reconcileAppDataRoster(p, loaded))
      mayPersistRef.current = isSupabaseAsyncDataSource(src)
        ? src.allowAutoSaveAfterLoad()
        : true
      if (isSupabaseAsyncDataSource(src) && src.needsEmailToReachCloud()) {
        setCloudNeedsEmail(true)
      } else {
        setCloudNeedsEmail(false)
      }
    } catch (e) {
      console.error('重新載入雲端失敗', e)
      toast('重新載入雲端資料失敗')
    }
  }, [toast])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const loaded = await sourceRef.current!.load()
        if (cancelled) return
        setData((p) => reconcileAppDataRoster(p, loaded))
        initialDataLoadedRef.current = true
        const src = sourceRef.current!
        mayPersistRef.current = isSupabaseAsyncDataSource(src)
          ? src.allowAutoSaveAfterLoad()
          : true
        if (isSupabaseAsyncDataSource(src) && src.needsEmailToReachCloud()) {
          setCloudNeedsEmail(true)
        } else {
          setCloudNeedsEmail(false)
        }
      } catch (e) {
        console.error('載入資料失敗', e)
        if (!cancelled) {
          const recovered = readPersistedLocalAppData()
          if (recovered) {
            setData((p) => reconcileAppDataRoster(p, recovered))
            initialDataLoadedRef.current = true
            mayPersistRef.current = true
            toast(
              '雲端載入失敗，已改顯示瀏覽器本機備份。請確認網路後重新整理，並盡快使用「匯出 JSON」備份。',
            )
          } else {
            setData(defaultData())
            mayPersistRef.current = false
            toast(
              '載入失敗，已顯示空白資料且未寫入雲端（避免覆寫您的資料）。請重新整理或檢查 Supabase／網路設定。',
            )
          }
        }
      } finally {
        if (!cancelled) {
          setHydrated(true)
          setAuthSubscriptionReady(true)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured() || !authSubscriptionReady) return
    const client = getSupabaseClient()
    const { data } = client.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        void reloadFromRemote()
      }
    })
    return () => data.subscription.unsubscribe()
  }, [authSubscriptionReady, reloadFromRemote])

  const selectedBigProjectIdxSafe = useMemo(() => {
    const n = data.bigProjects.length
    if (n === 0) return 0
    return Math.min(Math.max(0, selectedBigProjectIdx), n - 1)
  }, [data.bigProjects, selectedBigProjectIdx])

  /**
   * 所有會改動 AppData 的邏輯都應經由本檔的 setData / updateUiPrefs（各頁僅用表單用 useState）。
   * 此 effect 依 [data] 立即呼叫 source.save；勿在頁面另做 debounce 或直寫 localStorage／Supabase。
   */
  useEffect(() => {
    if (!hydrated || !mayPersistRef.current || !initialDataLoadedRef.current)
      return
    const src = sourceRef.current!
    const snap = dataRef.current
    void src
      .save(snap)
      .then((repaired) => {
        if (repaired != null) setData(repaired)
      })
      .catch((err) => {
        console.error('儲存失敗', err)
        const msg =
          err instanceof Error ? err.message : typeof err === 'string' ? err : ''
        toastRef.current(
          msg
            ? `雲端儲存失敗：${msg}`
            : '雲端儲存失敗，請開開發者工具 Console 查看原因',
        )
      })
  }, [data, hydrated])

  /** 關閉分頁／重新整理前再 flush 一次，確保離開前最後狀態有送出 */
  useEffect(() => {
    const flush = () => {
      if (
        !hydratedRef.current ||
        !mayPersistRef.current ||
        !initialDataLoadedRef.current
      )
        return
      const src = sourceRef.current!
      const snap = dataRef.current
      void src
        .save(snap)
        .then((repaired) => {
          if (repaired != null) setData(repaired)
        })
        .catch((err) => {
          console.error('離開頁面前儲存失敗', err)
        })
    }
    const onVis = () => {
      if (document.visibilityState === 'hidden') flush()
    }
    window.addEventListener('pagehide', flush)
    document.addEventListener('visibilitychange', onVis)
    return () => {
      window.removeEventListener('pagehide', flush)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  const exportJson = useCallback(() => {
    const blob = new Blob(
      [JSON.stringify(prepareAppDataForPersist(data), null, 2)],
      { type: 'application/json' },
    )
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
          const m = migrateAppData(parsed)
          const ui = { ...m.ui }
          if (m.teamRoster.length === 0) ui.teamRosterClearedByUser = true
          else delete ui.teamRosterClearedByUser
          setData({ ...m, ui })
          initialDataLoadedRef.current = true
          mayPersistRef.current = true
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
        weeklyCommit?: boolean
        smallProjectId?: string
      },
    ): boolean => {
      const t = title.trim()
      if (!t) return false

      const prev = dataRef.current
      const toastT = toastRef.current

      let dept: string | null =
        opts?.departmentId === undefined
          ? null
          : opts.departmentId === '' || opts.departmentId == null
            ? null
            : opts.departmentId
      let linkedProjectId: string | undefined

      if (opts?.smallProjectId) {
        const proj = prev.projects.find((x) => x.id === opts.smallProjectId)
        if (proj) {
          linkedProjectId = proj.id
          if (proj.departmentId != null) dept = proj.departmentId
        }
      }

      const assigneeRaw = opts?.assignee?.trim() ?? ''

      if (dept == null) {
        toastT('請選擇部門')
        return false
      }
      if (
        assigneeRaw &&
        !isAssigneeInDepartmentRoster(prev.teamRoster, dept, assigneeRaw)
      ) {
        toastT('負責人須為該部門名冊成員，請至「部門與 KPI」維護名冊')
        return false
      }

      const assignee = assigneeRaw || undefined
      const due =
        opts?.due != null && opts.due.trim() !== ''
          ? opts.due.trim()
          : undefined

      setData((p) => {
        const row: TaskItem = {
          id: newId(),
          title: t,
          done: false,
          priority: opts?.priority ?? 'mid',
          created: new Date().toLocaleDateString('zh-TW'),
          departmentId: dept,
          assignee,
          due,
          note: opts?.note,
          ...(opts?.weeklyCommit === true ? { weeklyCommit: true } : {}),
          ...(linkedProjectId ? { smallProjectId: linkedProjectId } : {}),
        }
        return {
          ...p,
          [section]: [...p[section], row],
        }
      })
      return true
    },
    [],
  )

  const updateTaskMeta = useCallback(
    (
      section: TaskSection,
      taskId: string,
      patch: { title?: string; note?: string },
    ) => {
      setData((prev) => ({
        ...prev,
        [section]: prev[section].map((task) => {
          if (task.id !== taskId) return task
          const next = { ...task }
          if (patch.title !== undefined) {
            const tt = patch.title.trim()
            if (tt) next.title = tt
          }
          if (patch.note !== undefined) {
            const n = patch.note.trim()
            next.note = n || undefined
          }
          return next
        }),
      }))
    },
    [],
  )

  const updateTaskDue = useCallback(
    (section: TaskSection, taskId: string, due: string | undefined) => {
      const v =
        due != null && due.trim() !== '' ? due.trim() : undefined
      setData((prev) => ({
        ...prev,
        [section]: prev[section].map((t) =>
          t.id === taskId ? { ...t, due: v } : t,
        ),
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
        [section]: prev[section].map((t) => {
          if (t.id !== taskId) return t
          if (t.departmentId == null) {
            toastRef.current('請先選擇部門')
            return t
          }
          if (!a) {
            return { ...t, assignee: undefined }
          }
          if (
            !isAssigneeInDepartmentRoster(
              prev.teamRoster,
              t.departmentId,
              a,
            )
          ) {
            toastRef.current('負責人須為該部門名冊成員')
            return t
          }
          return { ...t, assignee: a }
        }),
      }))
    },
    [],
  )

  const updateTaskDepartment = useCallback(
    (section: TaskSection, taskId: string, departmentId: string | null) => {
      if (departmentId == null) {
        toastRef.current('請選擇部門')
        return
      }
      setData((prev) => ({
        ...prev,
        [section]: prev[section].map((t) => {
          if (t.id !== taskId) return t
          let assignee = t.assignee
          if (
            departmentId != null &&
            assignee &&
            !isAssigneeInDepartmentRoster(
              prev.teamRoster,
              departmentId,
              assignee,
            )
          ) {
            assignee = undefined
          }
          const next: TaskItem = { ...t, departmentId, assignee }
          if (t.smallProjectId) {
            const p = prev.projects.find((x) => x.id === t.smallProjectId)
            if (
              p &&
              p.departmentId != null &&
              p.departmentId !== departmentId
            ) {
              delete next.smallProjectId
            }
          }
          const subs = reconcileSubtaskAssigneesToDepartment(
            next.subtasks,
            departmentId,
            prev.teamRoster,
          )
          if (subs !== next.subtasks) next.subtasks = subs
          return next
        }),
      }))
    },
    [],
  )

  const toggleTaskWeeklyCommit = useCallback(
    (section: TaskSection, taskId: string) => {
      setData((prev) => ({
        ...prev,
        [section]: prev[section].map((t) =>
          t.id === taskId
            ? { ...t, weeklyCommit: !t.weeklyCommit }
            : t,
        ),
      }))
    },
    [],
  )

  const updateTaskSmallProject = useCallback(
    (section: TaskSection, taskId: string, smallProjectId: string | null) => {
      setData((prev) => {
        const proj = smallProjectId
          ? prev.projects.find((p) => p.id === smallProjectId)
          : null
        if (smallProjectId && !proj) return prev
        return {
          ...prev,
          [section]: prev[section].map((t) => {
            if (t.id !== taskId) return t
            const next: TaskItem = { ...t }
            if (proj) {
              next.smallProjectId = proj.id
              if (proj.departmentId != null) {
                next.departmentId = proj.departmentId
                const asn = next.assignee
                if (
                  asn &&
                  !isAssigneeInDepartmentRoster(
                    prev.teamRoster,
                    proj.departmentId,
                    asn,
                  )
                ) {
                  delete next.assignee
                }
                const subs = reconcileSubtaskAssigneesToDepartment(
                  next.subtasks,
                  next.departmentId,
                  prev.teamRoster,
                )
                if (subs !== next.subtasks) next.subtasks = subs
              }
            } else {
              delete next.smallProjectId
            }
            return next
          }),
        }
      })
    },
    [],
  )

  const addTaskSubtask = useCallback(
    (section: TaskSection, taskId: string, title: string) => {
      const t = title.trim()
      if (!t) return false
      setData((prev) => ({
        ...prev,
        [section]: prev[section].map((task) => {
          if (task.id !== taskId) return task
          const subs = task.subtasks ?? []
          return {
            ...task,
            subtasks: [...subs, { id: newId(), title: t, done: false }],
          }
        }),
      }))
      return true
    },
    [],
  )

  const removeTaskSubtask = useCallback(
    (section: TaskSection, taskId: string, subtaskId: string) => {
      setData((prev) => ({
        ...prev,
        [section]: prev[section].map((task) => {
          if (task.id !== taskId) return task
          const subs = (task.subtasks ?? []).filter((s) => s.id !== subtaskId)
          const next: TaskItem = { ...task }
          if (subs.length === 0) delete next.subtasks
          else next.subtasks = subs
          return next
        }),
      }))
    },
    [],
  )

  const toggleTaskSubtask = useCallback(
    (section: TaskSection, taskId: string, subtaskId: string) => {
      setData((prev) => ({
        ...prev,
        [section]: prev[section].map((task) => {
          if (task.id !== taskId) return task
          const subs = task.subtasks ?? []
          return {
            ...task,
            subtasks: subs.map((s) =>
              s.id === subtaskId ? { ...s, done: !s.done } : s,
            ),
          }
        }),
      }))
    },
    [],
  )

  const updateTaskSubtask = useCallback(
    (
      section: TaskSection,
      taskId: string,
      subtaskId: string,
      patch: Partial<Pick<TaskSubtask, 'title' | 'due' | 'assignee'>>,
    ) => {
      setData((prev) => ({
        ...prev,
        [section]: prev[section].map((task) => {
          if (task.id !== taskId) return task
          const subs = task.subtasks ?? []
          return {
            ...task,
            subtasks: subs.map((s) => {
              if (s.id !== subtaskId) return s
              const next = { ...s }
              if (patch.title !== undefined) {
                const tt = patch.title.trim()
                if (tt) next.title = tt
              }
              if (patch.due !== undefined) {
                const d = patch.due.trim()
                next.due = d || undefined
              }
              if (patch.assignee !== undefined) {
                const raw = (patch.assignee ?? '').trim()
                if (!raw) {
                  delete next.assignee
                } else {
                  if (task.departmentId == null) {
                    toastRef.current(
                      '請先為主任務選擇部門，才能指定子任務負責人',
                    )
                    return s
                  }
                  if (
                    !isAssigneeInDepartmentRoster(
                      prev.teamRoster,
                      task.departmentId,
                      raw,
                    )
                  ) {
                    toastRef.current('子任務負責人須為該部門名冊成員')
                    return s
                  }
                  next.assignee = raw
                }
              }
              return next
            }),
          }
        }),
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

  const addTeamRosterMember = useCallback(
    (name: string, role?: string, departmentId?: string | null) => {
      const n = name.trim()
      if (!n) return
      const r = role?.trim()
      const dept =
        departmentId === undefined || departmentId === '' || departmentId == null
          ? null
          : departmentId
      setData((prev) => {
        const nextUi = { ...prev.ui }
        delete nextUi.teamRosterClearedByUser
        return {
          ...prev,
          ui: nextUi,
          teamRoster: [
            ...prev.teamRoster,
            {
              id: newId(),
              name: n,
              departmentId: dept,
              role: r && r.length > 0 ? r : undefined,
            },
          ],
        }
      })
      toast('團隊成員已新增')
    },
    [toast],
  )

  const updateTeamRosterMember = useCallback(
    (
      id: string,
      patch: Partial<{
        name: string
        role: string
        departmentId: string | null
      }>,
    ) => {
      setData((prev) => ({
        ...prev,
        teamRoster: prev.teamRoster.map((m) => {
          if (m.id !== id) return m
          let name = m.name
          let role = m.role
          let departmentId = m.departmentId
          if (patch.name !== undefined) {
            const n = patch.name.trim()
            if (n) name = n
          }
          if (patch.role !== undefined) {
            const r = patch.role.trim()
            role = r.length > 0 ? r : undefined
          }
          if (patch.departmentId !== undefined) {
            departmentId =
              patch.departmentId === '' || patch.departmentId == null
                ? null
                : patch.departmentId
          }
          return { ...m, name, role, departmentId }
        }),
      }))
    },
    [],
  )

  const removeTeamRosterMember = useCallback((id: string) => {
    setData((prev) => {
      const next = prev.teamRoster.filter((m) => m.id !== id)
      const nextUi = { ...prev.ui }
      if (next.length === 0) nextUi.teamRosterClearedByUser = true
      else delete nextUi.teamRosterClearedByUser
      return { ...prev, teamRoster: next, ui: nextUi }
    })
    toast('已從名冊移除')
  }, [toast])

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
    setData((prev) => {
      const stripDept = (t: TaskItem): TaskItem => {
        if (t.departmentId !== id) return t
        const next: TaskItem = { ...t, departmentId: null }
        const subs = reconcileSubtaskAssigneesToDepartment(
          next.subtasks,
          null,
          prev.teamRoster,
        )
        if (subs !== next.subtasks) next.subtasks = subs
        return next
      }
      return {
      ...prev,
      departments: prev.departments.filter((d) => d.id !== id),
      today: prev.today.map(stripDept),
      active: prev.active.map(stripDept),
      someday: prev.someday.map(stripDept),
      done: prev.done.map(stripDept),
      projects: prev.projects.map((p) =>
        p.departmentId === id ? { ...p, departmentId: null } : p,
      ),
      bigProjects: prev.bigProjects.map((p) =>
        p.departmentId === id ? { ...p, departmentId: null } : p,
      ),
      teamRoster: prev.teamRoster.map((m) =>
        m.departmentId === id ? { ...m, departmentId: null } : m,
      ),
    }
    })
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
            since: toISODateLocal(),
          },
        ],
      }))
    },
    [],
  )

  const updateWaitingItem = useCallback(
    (
      id: string,
      patch: Partial<Pick<WaitingItem, 'who' | 'title' | 'since' | 'expectedBy'>>,
    ) => {
      setData((prev) => ({
        ...prev,
        waiting: prev.waiting.map((w) =>
          w.id === id ? { ...w, ...patch } : w,
        ),
      }))
    },
    [],
  )

  const appendDoneToWeeklyAccomplished = useCallback(() => {
    let merged = false
    let emptyDone = false
    setData((prev) => {
      const wr = prev.weeklyReview || {}
      const acc = wr.accomplished || ''
      if (!prev.done.length) {
        emptyDone = true
        return prev
      }
      const next = appendDoneTasksToAccomplished(acc, prev.done)
      if (next === acc) return prev
      merged = true
      return {
        ...prev,
        weeklyReview: { ...wr, accomplished: next },
      }
    })
    if (emptyDone) toast('尚無已完成任務可帶入')
    else if (!merged) toast('完成清單已在文字框中，無新增列')
    else toast('已將完成任務併入「本週完成」')
  }, [toast])

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
      initialTaskTitle?: string
      initialTaskSection?: 'today' | 'active' | 'someday'
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
      const taskTitle = p.initialTaskTitle?.trim()
      const sec = p.initialTaskSection ?? 'active'
      setData((prev) => {
        const pid = newId()
        const proj: SmallProject = {
          id: pid,
          name: n,
          due: (p.due ?? '').trim(),
          owner: (p.owner ?? '').trim(),
          progress: 0,
          departmentId: dept,
          participants,
        }
        const next: AppData = {
          ...prev,
          projects: [...prev.projects, proj],
        }
        if (!taskTitle) return next
        const ownerName = (p.owner ?? '').trim()
        const task: TaskItem = {
          id: newId(),
          title: taskTitle,
          done: false,
          priority: 'mid',
          created: new Date().toLocaleDateString('zh-TW'),
          departmentId: dept,
          smallProjectId: pid,
          ...(dept &&
          ownerName &&
          isAssigneeInDepartmentRoster(prev.teamRoster, dept, ownerName)
            ? { assignee: ownerName }
            : {}),
        }
        return {
          ...next,
          [sec]: [...next[sec], task],
        }
      })
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
    const clearPid = (t: TaskItem): TaskItem => {
      if (t.smallProjectId !== id) return t
      const next = { ...t }
      delete next.smallProjectId
      return next
    }
    setData((prev) => ({
      ...prev,
      projects: prev.projects.filter((p) => p.id !== id),
      today: prev.today.map(clearPid),
      active: prev.active.map(clearPid),
      someday: prev.someday.map(clearPid),
      done: prev.done.map(clearPid),
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
    toast('已記錄本週檢視（內容早已自動同步雲端）')
  }, [toast])

  const patchBossWeeklyReport = useCallback(
    (partial: Partial<AppData['bossWeeklyReport']>) => {
      setData((prev) => ({
        ...prev,
        bossWeeklyReport: { ...prev.bossWeeklyReport, ...partial },
      }))
    },
    [],
  )

  const applyBossWeeklyReportExampleHen20260318 = useCallback(() => {
    const cur = dataRef.current.bossWeeklyReport
    const dirty = Object.values(cur).some((v) => String(v).trim() !== '')
    if (dirty && !window.confirm('目前草稿有內容，確定覆寫為參考範例？')) return
    setData((prev) => ({
      ...prev,
      bossWeeklyReport: exampleBossWeeklyReportHen20260318(),
    }))
    toast('已載入參考範例（可依本週再改）')
  }, [toast])

  const clearBossWeeklyReport = useCallback(() => {
    if (!window.confirm('確定清空「給老闆週報」全部欄位？')) return
    setData((prev) => ({
      ...prev,
      bossWeeklyReport: emptyBossWeeklyReport(),
    }))
    toast('已清空')
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
      hydrated,
      updateUiPrefs,
      selectedBigProjectIdx: selectedBigProjectIdxSafe,
      setSelectedBigProjectIdx,
      toast,
      toastMessage,
      exportJson,
      importJsonFromFile,
      exportMarkdown,
      addTask,
      updateTaskMeta,
      updateTaskDue,
      updateTaskAssignee,
      updateTaskDepartment,
      toggleTaskWeeklyCommit,
      updateTaskSmallProject,
      addTaskSubtask,
      removeTaskSubtask,
      toggleTaskSubtask,
      updateTaskSubtask,
      addDepartment,
      addDepartmentKpi,
      updateDepartmentKpi,
      removeDepartmentKpi,
      renameDepartment,
      removeDepartment,
      addTeamRosterMember,
      updateTeamRosterMember,
      removeTeamRosterMember,
      toggleTask,
      removeTask,
      clearDone,
      addWaiting,
      removeWaiting,
      updateWaitingItem,
      appendDoneToWeeklyAccomplished,
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
      patchBossWeeklyReport,
      applyBossWeeklyReportExampleHen20260318,
      clearBossWeeklyReport,
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
      hydrated,
      updateUiPrefs,
      selectedBigProjectIdxSafe,
      toast,
      toastMessage,
      exportJson,
      importJsonFromFile,
      exportMarkdown,
      addTask,
      updateTaskMeta,
      updateTaskDue,
      updateTaskAssignee,
      updateTaskDepartment,
      toggleTaskWeeklyCommit,
      updateTaskSmallProject,
      addTaskSubtask,
      removeTaskSubtask,
      toggleTaskSubtask,
      updateTaskSubtask,
      addDepartment,
      addDepartmentKpi,
      updateDepartmentKpi,
      removeDepartmentKpi,
      renameDepartment,
      removeDepartment,
      addTeamRosterMember,
      updateTeamRosterMember,
      removeTeamRosterMember,
      toggleTask,
      removeTask,
      clearDone,
      addWaiting,
      removeWaiting,
      updateWaitingItem,
      appendDoneToWeeklyAccomplished,
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
      patchBossWeeklyReport,
      applyBossWeeklyReportExampleHen20260318,
      clearBossWeeklyReport,
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
        <>
          {cloudNeedsEmail && isSupabaseConfigured() ? (
            <SupabaseEmailAuthBar visible toast={toast} />
          ) : null}
          {children}
        </>
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
