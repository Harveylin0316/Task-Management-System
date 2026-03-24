import { useDashboard } from '../context/DashboardContext'

export function WeeklyPage() {
  const {
    data,
    patchWeeklyReview,
    acknowledgeWeeklySaved,
    exportMarkdown,
    appendDoneToWeeklyAccomplished,
  } = useDashboard()
  const wr = data.weeklyReview || {}

  const done = data.done.length
  const active = data.active.length
  const waiting = data.waiting.length
  const total = done + active
  const rate = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <>
      <div className="week-grid">
        <div className="review-section">
          <h3>🏆 本週完成了什麼</h3>
          <div>
            {(data.done || []).slice(0, 6).map((item) => (
              <div key={item.id} className="review-item">
                <span>✅</span>
                <span>{item.title}</span>
              </div>
            ))}
            {!data.done.length ? (
              <div className="empty" style={{ padding: '16px 0' }}>
                尚無完成項目
              </div>
            ) : null}
            {data.done.length ? (
              <button
                type="button"
                className="btn"
                style={{ marginTop: 10 }}
                onClick={appendDoneToWeeklyAccomplished}
              >
                將上方已完成任務併入「本週完成」文字框
              </button>
            ) : null}
          </div>
          <textarea
            className="review-input"
            placeholder="本週完成的重要事項…"
            style={{ minHeight: 100, marginTop: 10 }}
            value={wr.accomplished || ''}
            onChange={(e) =>
              patchWeeklyReview({ accomplished: e.target.value })
            }
          />
        </div>
        <div className="review-section">
          <h3>🎯 下週計畫</h3>
          <textarea
            className="review-input"
            placeholder={'下週最重要的 3 件事：\n1. \n2. \n3. '}
            value={wr.next || ''}
            onChange={(e) => patchWeeklyReview({ next: e.target.value })}
          />
        </div>
        <div className="review-section">
          <h3>🚧 阻礙 & 待解決</h3>
          <textarea
            className="review-input"
            placeholder="目前遇到的阻礙、需要資源、需要決策的事…"
            value={wr.blockers || ''}
            onChange={(e) => patchWeeklyReview({ blockers: e.target.value })}
          />
        </div>
        <div className="review-section">
          <h3>💭 本週反思</h3>
          <textarea
            className="review-input"
            placeholder="什麼做得好？什麼可以改進？有什麼學到的？"
            value={wr.reflection || ''}
            onChange={(e) => patchWeeklyReview({ reflection: e.target.value })}
          />
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">📊 本週數字</div>
        </div>
        <div className="card-body weekly-stats">
          <div>
            <div className="weekly-stat-num" style={{ color: 'var(--green)' }}>
              {done}
            </div>
            <div className="weekly-stat-label">完成任務</div>
          </div>
          <div>
            <div className="weekly-stat-num" style={{ color: 'var(--blue)' }}>
              {active}
            </div>
            <div className="weekly-stat-label">進行中</div>
          </div>
          <div>
            <div className="weekly-stat-num" style={{ color: 'var(--orange)' }}>
              {waiting}
            </div>
            <div className="weekly-stat-label">等待回覆</div>
          </div>
          <div>
            <div className="weekly-stat-num" style={{ color: 'var(--accent)' }}>
              {rate}%
            </div>
            <div className="weekly-stat-label">完成率</div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          type="button"
          className="btn btn-primary"
          style={{ padding: '10px 24px', fontSize: 14 }}
          onClick={acknowledgeWeeklySaved}
        >
          💾 儲存週報
        </button>
        <button
          type="button"
          className="btn"
          style={{ padding: '10px 24px', fontSize: 14 }}
          onClick={exportMarkdown}
        >
          📤 匯出 Markdown
        </button>
      </div>
    </>
  )
}
