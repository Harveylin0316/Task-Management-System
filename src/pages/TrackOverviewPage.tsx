import { useMemo } from 'react'
import { useDashboard } from '../context/DashboardContext'
import type { AppData, TaskItem, TaskSection } from '../lib/types'

function collectOpenTasks(
  data: AppData,
  departmentId: string | null,
): { task: TaskItem; section: TaskSection }[] {
  const sections: TaskSection[] = ['today', 'active', 'someday']
  const out: { task: TaskItem; section: TaskSection }[] = []
  for (const sec of sections) {
    for (const t of data[sec]) {
      const match =
        departmentId === null
          ? t.departmentId == null
          : t.departmentId === departmentId
      if (match && !t.done) out.push({ task: t, section: sec })
    }
  }
  return out
}

function groupByAssignee(
  items: { task: TaskItem; section: TaskSection }[],
): Map<string, number> {
  const m = new Map<string, number>()
  for (const { task } of items) {
    const key = task.assignee?.trim() || '（未指定負責人）'
    m.set(key, (m.get(key) ?? 0) + 1)
  }
  return m
}

export function TrackOverviewPage() {
  const { data } = useDashboard()

  const personalOpen = useMemo(
    () => collectOpenTasks(data, null),
    [data],
  )

  const sections = useMemo(() => {
    const deptCols = data.departments.map((d) => ({
      type: 'dept' as const,
      dept: d,
      openTasks: collectOpenTasks(data, d.id),
      projects: data.projects.filter((p) => p.departmentId === d.id),
      bigProjects: data.bigProjects.filter((p) => p.departmentId === d.id),
    }))
    return deptCols
  }, [data])

  return (
    <div className="track-overview">
      <p className="track-intro">
        由上而下檢視：<strong>部門 KPI</strong> → <strong>專案</strong>（參與者）→{' '}
        <strong>任務負責人</strong>分布，方便對齊進度與更新。
      </p>

      <section className="card section-gap">
        <div className="card-header">
          <div className="card-title">👤 個人（未掛部門）</div>
        </div>
        <div className="card-body">
          <div className="track-assignee-row">
            <span className="track-label">進行中任務</span>
            <strong>{personalOpen.length}</strong> 件 · 依負責人：
            {Array.from(groupByAssignee(personalOpen).entries()).map(
              ([name, n]) => (
                <span key={name} className="tag tag-plan">
                  {name} {n}
                </span>
              ),
            )}
            {!personalOpen.length ? (
              <span className="text-muted">尚無未完成的個人任務</span>
            ) : null}
          </div>
        </div>
      </section>

      {sections.map(({ dept, openTasks, projects, bigProjects }) => (
        <section key={dept.id} className="waterfall-dept card section-gap">
          <div className="card-header">
            <div className="card-title">🏢 {dept.name}</div>
          </div>
          <div className="card-body">
            <div className="waterfall-step">
              <h3 className="waterfall-h">① 部門 KPI</h3>
              {!dept.kpis.length ? (
                <p className="text-muted" style={{ fontSize: 13 }}>
                  尚未設定 KPI。至「部門與KPI管理」分頁在該部門欄位下方新增。
                </p>
              ) : (
                <ul className="kpi-track-list">
                  {dept.kpis.map((k) => (
                    <li key={k.id} className="kpi-track-item">
                      <div className="kpi-track-name">{k.name}</div>
                      <div className="kpi-track-values">
                        <span>目標：{k.target || '—'}</span>
                        <span>現況：{k.current || '—'}</span>
                      </div>
                      {k.note ? (
                        <div className="kpi-track-note">{k.note}</div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="waterfall-step">
              <h3 className="waterfall-h">② 專案（看板＋大型）</h3>
              {!projects.length && !bigProjects.length ? (
                <p className="text-muted" style={{ fontSize: 13 }}>
                  此部門尚無掛載專案。
                </p>
              ) : (
                <ul className="proj-track-list">
                  {projects.map((p) => (
                    <li key={p.id}>
                      <span className="proj-track-pill">看板</span>
                      <strong>{p.name}</strong>
                      <span className="text-muted"> {p.progress}%</span>
                      {p.owner ? (
                        <span className="text-muted"> · 負責 {p.owner}</span>
                      ) : null}
                      {p.participants.length ? (
                        <div className="proj-participants">
                          參與：{p.participants.join('、')}
                        </div>
                      ) : null}
                    </li>
                  ))}
                  {bigProjects.map((p) => (
                    <li key={p.id}>
                      <span className="proj-track-pill proj-track-pill-lg">
                        大型
                      </span>
                      <strong>{p.name}</strong>
                      <span className="text-muted"> {p.progress}%</span>
                      {p.pm ? (
                        <span className="text-muted"> · PM {p.pm}</span>
                      ) : null}
                      {p.team.length ? (
                        <div className="proj-participants">
                          團隊：
                          {p.team.map((m) => m.name).join('、')}
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="waterfall-step">
              <h3 className="waterfall-h">③ 任務 × 負責人（今日／進行中／日後）</h3>
              <div className="track-assignee-row">
                共 <strong>{openTasks.length}</strong> 件未完成
                {openTasks.length ? ' · ' : null}
                {Array.from(groupByAssignee(openTasks).entries()).map(
                  ([name, n]) => (
                    <span key={name} className="tag tag-waiting">
                      {name} {n}
                    </span>
                  ),
                )}
              </div>
            </div>
          </div>
        </section>
      ))}
    </div>
  )
}
