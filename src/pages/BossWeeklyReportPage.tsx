import { useMemo, type CSSProperties } from 'react'
import { useDashboard } from '../context/DashboardContext'
import {
  composeBossWeeklyReportText,
  downloadBossWeeklyReportTxt,
} from '../lib/bossWeeklyReportCompose'

const taStyle: CSSProperties = {
  width: '100%',
  minHeight: 120,
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  fontSize: 12,
  lineHeight: 1.45,
}

export function BossWeeklyReportPage() {
  const {
    data,
    patchBossWeeklyReport,
    applyBossWeeklyReportExampleHen20260318,
    clearBossWeeklyReport,
    toast,
  } = useDashboard()
  const b = data.bossWeeklyReport

  const composed = useMemo(() => composeBossWeeklyReportText(b), [b])

  const copyAll = async () => {
    const text = composeBossWeeklyReportText(b)
    try {
      await navigator.clipboard.writeText(text)
      toast('已複製完整週報（可貼到 Email 或 Google Doc）')
    } catch {
      toast('複製失敗，請改用手動全選預覽區')
    }
  }

  const downloadTxt = () => {
    const base =
      b.titleLine.trim().replace(/^GM TW Weekly Progress Report\s*-\s*/i, '') ||
      'boss-weekly'
    downloadBossWeeklyReportTxt(composeBossWeeklyReportText(b), base)
    toast('已下載 .txt')
  }

  return (
    <>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <div className="card-title">📨 給老闆／總部週報</div>
        </div>
        <div className="card-body" style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          <p style={{ margin: '0 0 8px' }}>
            格式對齊你上一封 <strong>GM TW Weekly Progress Report</strong>：六大段表格以{' '}
            <strong>Tab</strong> 分隔，貼到試算表可自動分欄；編輯後會與其他資料一併同步雲端。
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={applyBossWeeklyReportExampleHen20260318}
            >
              載入 2026/03/18 參考範例（Hen）
            </button>
            <button type="button" className="btn" onClick={clearBossWeeklyReport}>
              清空草稿
            </button>
            <button type="button" className="btn" onClick={copyAll}>
              複製完整週報
            </button>
            <button type="button" className="btn" onClick={downloadTxt}>
              下載 .txt
            </button>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <div className="card-title">標題與開頭</div>
        </div>
        <div className="card-body" style={{ display: 'grid', gap: 12 }}>
          <label className="text-muted" style={{ fontSize: 12 }}>
            標題行
            <input
              className="input"
              style={{ marginTop: 6, width: '100%' }}
              value={b.titleLine}
              onChange={(e) => patchBossWeeklyReport({ titleLine: e.target.value })}
              placeholder="GM TW Weekly Progress Report - 2026.03.25"
            />
          </label>
          <label className="text-muted" style={{ fontSize: 12 }}>
            開頭（問候、區間、署名）
            <textarea
              className="input review-input"
              style={{ ...taStyle, marginTop: 6, minHeight: 72 }}
              value={b.opening}
              onChange={(e) => patchBossWeeklyReport({ opening: e.target.value })}
              placeholder={'Hi Joe, plz check …\n3/9-3/15 Reported by: …'}
            />
          </label>
        </div>
      </div>

      {(
        [
          ['I. Financial Performance', 'sectionFinancial', 'TWD、Cover Fee、GMV…'],
          ['II. Marketing BU', 'sectionMarketingBu', 'Bookings、LINE、內容…'],
          ['III. Sales BU', 'sectionSalesBu', '新簽、流失、Offers…'],
          ['IV. Strategic Partnerships', 'sectionPartnerships', '既有／新開發夥伴表'],
          ['V. Marketing Campaigns', 'sectionCampaigns', '檔期與進度'],
          ['VI. Key issues', 'sectionKeyIssues', 'Issue / Description / status'],
        ] as const
      ).map(([title, key, hint]) => (
        <div key={key} className="card" style={{ marginBottom: 16 }}>
          <div className="card-header">
            <div className="card-title">{title}</div>
          </div>
          <div className="card-body">
            <p className="text-muted" style={{ fontSize: 12, margin: '0 0 8px' }}>
              {hint} — 使用 Tab 對齊欄位；換行可放在儲存格內（與 Email 貼上相同）。
            </p>
            <textarea
              className="input review-input"
              style={{ ...taStyle, minHeight: key === 'sectionPartnerships' ? 220 : 160 }}
              value={b[key]}
              onChange={(e) =>
                patchBossWeeklyReport({ [key]: e.target.value } as Partial<
                  typeof b
                >)
              }
            />
          </div>
        </div>
      ))}

      <div className="card">
        <div className="card-header">
          <div className="card-title">匯出預覽（只讀）</div>
        </div>
        <div className="card-body">
          <textarea
            className="input review-input"
            readOnly
            style={{ ...taStyle, minHeight: 200, opacity: 0.95 }}
            value={composed}
            aria-label="完整週報預覽"
          />
        </div>
      </div>
    </>
  )
}
