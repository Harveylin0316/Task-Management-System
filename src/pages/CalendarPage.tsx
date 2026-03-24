import { useDashboard } from '../context/DashboardContext'
import { Modal } from '../components/Modal'
import { useEffect, useMemo, useState, type FormEvent } from 'react'

export function CalendarPage() {
  const {
    data,
    addDeadline,
    removeDeadline,
    updateMeetingNotes,
    acknowledgeMeetingNotesSaved,
  } = useDashboard()
  const [deadOpen, setDeadOpen] = useState(false)
  const [dTitle, setDTitle] = useState('')
  const [dDate, setDDate] = useState('')
  const [dOwner, setDOwner] = useState('')
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(t)
  }, [])

  const calStrip = useMemo(() => {
    const today = new Date()
    const days = ['日', '一', '二', '三', '四', '五', '六']
    const cells: { d: Date; isToday: boolean; hasDue: boolean }[] = []
    for (let i = -1; i <= 5; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() + i)
      const isToday = i === 0
      const hasDue = data.deadlines.some(
        (dl) => new Date(dl.date).toDateString() === d.toDateString(),
      )
      cells.push({ d, isToday, hasDue })
    }
    return cells.map(({ d, isToday, hasDue }) => (
      <div
        key={d.toISOString()}
        className={`cal-day ${isToday ? 'today' : ''}`}
      >
        <div className="day-name">{days[d.getDay()]}</div>
        <div className="day-num">{d.getDate()}</div>
        <div className="day-dot-wrap">
          {hasDue ? <div className="day-dot" /> : null}
        </div>
      </div>
    ))
  }, [data.deadlines])

  const sortedDeadlines = useMemo(() => {
    return [...data.deadlines].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    )
  }, [data.deadlines])

  const submitDeadline = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    addDeadline(dTitle, dDate, dOwner)
    setDTitle('')
    setDDate('')
    setDOwner('')
    setDeadOpen(false)
  }

  return (
    <>
      <div className="cal-strip">{calStrip}</div>
      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div className="card-title">🚨 截止日追蹤</div>
            <button
              type="button"
              className="card-action"
              onClick={() => setDeadOpen(true)}
            >
              ＋ 新增
            </button>
          </div>
          <div className="card-body">
            {sortedDeadlines.map((d) => {
              const dt = new Date(d.date)
              const diff = Math.ceil(
                (dt.getTime() - now.getTime()) / 86400000,
              )
              const month = dt.toLocaleDateString('zh-TW', { month: 'short' })
              const day = dt.getDate()
              const urgCls =
                diff <= 1 ? 'urgent' : diff <= 3 ? 'soon' : ''
              const tag =
                diff < 0 ? (
                  <span className="tag tag-urgent">已過期</span>
                ) : diff === 0 ? (
                  <span className="tag tag-urgent">今天</span>
                ) : diff <= 3 ? (
                  <span className="tag tag-waiting">{diff} 天後</span>
                ) : (
                  <span className="tag tag-plan">{diff} 天後</span>
                )
              return (
                <div key={d.id} className="deadline-item">
                  <div className="deadline-date-box">
                    <div className="deadline-month">{month}</div>
                    <div className={`deadline-day ${urgCls}`}>{day}</div>
                  </div>
                  <div className="deadline-info">
                    <div className="deadline-title">{d.title}</div>
                    <div className="deadline-who">{d.owner}</div>
                  </div>
                  {tag}
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => removeDeadline(d.id)}
                  >
                    ×
                  </button>
                </div>
              )
            })}
            {!data.deadlines.length ? (
              <div className="empty">
                <div className="empty-icon">🗓</div>
                沒有即將到來的截止日
              </div>
            ) : null}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">📝 今日會議備忘</div>
          </div>
          <div className="card-body">
            <textarea
              className="review-input"
              placeholder={
                '記錄今天的會議重點、決議、行動項目…\n\n例：\n• 10:00 團隊週會 → 決議：Q2目標調整'
              }
              style={{ minHeight: 200 }}
              value={data.meetingNotes}
              onChange={(e) => updateMeetingNotes(e.target.value)}
            />
            <button
              type="button"
              className="btn btn-primary"
              style={{ marginTop: 8, width: '100%' }}
              onClick={acknowledgeMeetingNotesSaved}
            >
              儲存備忘
            </button>
          </div>
        </div>
      </div>

      <Modal
        open={deadOpen}
        title="新增截止日"
        onClose={() => setDeadOpen(false)}
        footer={
          <div className="modal-btns">
            <button type="button" className="btn" onClick={() => setDeadOpen(false)}>
              取消
            </button>
            <button
              type="submit"
              form="wm-form-calendar-deadline"
              className="btn btn-primary"
            >
              新增
            </button>
          </div>
        }
      >
        <form id="wm-form-calendar-deadline" onSubmit={submitDeadline}>
          <div className="modal-field">
            <label htmlFor="dl-title">事項</label>
            <input
              id="dl-title"
              className="input"
              style={{ width: '100%' }}
              value={dTitle}
              onChange={(e) => setDTitle(e.target.value)}
            />
          </div>
          <div className="modal-field">
            <label htmlFor="dl-date">日期</label>
            <input
              id="dl-date"
              className="input"
              style={{ width: '100%' }}
              value={dDate}
              onChange={(e) => setDDate(e.target.value)}
              placeholder="例：2026-04-15"
            />
          </div>
          <div className="modal-field">
            <label htmlFor="dl-owner">負責人（可留空）</label>
            <input
              id="dl-owner"
              className="input"
              style={{ width: '100%' }}
              value={dOwner}
              onChange={(e) => setDOwner(e.target.value)}
            />
          </div>
        </form>
      </Modal>
    </>
  )
}
