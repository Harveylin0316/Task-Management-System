import { useDashboard } from '../context/DashboardContext'
import { mergeWeeklyReviewDraft } from '../lib/weeklyReviewDraft'

export function WeeklyPage() {
  const {
    data,
    patchWeeklyReview,
    acknowledgeWeeklySaved,
    exportMarkdown,
    appendDoneToWeeklyAccomplished,
    toast,
  } = useDashboard()
  const wr = data.weeklyReview || {}

  const done = data.done.length
  const active = data.active.length
  const waiting = data.waiting.length
  const total = done + active
  const rate = total > 0 ? Math.round((done / total) * 100) : 0

  const applyDraft = () => {
    patchWeeklyReview(mergeWeeklyReviewDraft(data.weeklyReview, data))
    toast('已從任務與清單帶入；本週完成會合併已完成項目，其餘空白欄已填草稿')
  }

  return (
    <>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body" style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          <p style={{ margin: '0 0 10px' }}>
            週報欄位會<strong>隨編輯自動同步雲端</strong>。不必從零打字：點下方按鈕可從「已完成」「今日／進行中」「等待回覆」自動產生草稿，再微調即可。
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={applyDraft}
            >
              ✨ 從儀表板帶入週報草稿
            </button>
            <span className="text-muted" style={{ fontSize: 12 }}>
              本週完成會併入清單；下週／阻礙／反思僅在目前為空白時填入
            </span>
          </div>
        </div>
      </div>

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
                僅合併「已完成」到下方文字框
              </button>
            ) : null}
          </div>
          <textarea
            className="review-input"
            placeholder="可點上方「帶入週報草稿」，或手動填寫…"
            style={{ minHeight: 100, marginTop: 10 }}
            value={wr.accomplished || ''}
            onChange={(e) =>
              patchWeeklyReview({ accomplished: e.target.value })
            }
          />
        </div>
        <div className="review-section">
          <h3>🎯 下週計畫</h3>
          <p className="text-muted" style={{ fontSize: 12, margin: '0 0 8px' }}>
            草稿會依「今日」與「進行中」任務列出（優先顯示高優先序）。
          </p>
          <textarea
            className="review-input"
            placeholder="點「帶入週報草稿」自動產生，或手動填寫…"
            value={wr.next || ''}
            onChange={(e) => patchWeeklyReview({ next: e.target.value })}
          />
        </div>
        <div className="review-section">
          <h3>🚧 阻礙 & 待解決</h3>
          <p className="text-muted" style={{ fontSize: 12, margin: '0 0 8px' }}>
            草稿會帶入「等待回覆」清單每一筆。
          </p>
          <textarea
            className="review-input"
            placeholder="點「帶入週報草稿」自動產生，或手動填寫…"
            value={wr.blockers || ''}
            onChange={(e) => patchWeeklyReview({ blockers: e.target.value })}
          />
        </div>
        <div className="review-section">
          <h3>💭 本週反思</h3>
          <p className="text-muted" style={{ fontSize: 12, margin: '0 0 8px' }}>
            草稿會先寫本週完成率等摘要，你只要補幾句心得。
          </p>
          <textarea
            className="review-input"
            placeholder="點「帶入週報草稿」自動產生摘要，再補寫…"
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

      <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          type="button"
          className="btn"
          style={{ padding: '10px 24px', fontSize: 14 }}
          onClick={acknowledgeWeeklySaved}
        >
          ✓ 完成本週檢視
        </button>
        <button
          type="button"
          className="btn btn-primary"
          style={{ padding: '10px 24px', fontSize: 14 }}
          onClick={exportMarkdown}
        >
          📤 匯出 Markdown
        </button>
        <span className="text-muted" style={{ fontSize: 12 }}>
          內容已即時存於雲端；「完成檢視」僅為確認提示。
        </span>
      </div>
    </>
  )
}
