import { useMemo, type CSSProperties } from 'react'
import { useDashboard } from '../context/DashboardContext'
import {
  composeBossWeeklyReportEmailHtml,
  composeBossWeeklyReportText,
  copyBossWeeklyReportForEmail,
  downloadBossWeeklyReportHtml,
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
  const emailHtml = useMemo(() => composeBossWeeklyReportEmailHtml(b), [b])

  const copyEmailFormat = async () => {
    const mode = await copyBossWeeklyReportForEmail(b)
    if (mode === 'html') {
      toast('已複製 Email 格式（含 HTML 表格）— 在信件中直接 Ctrl+V / ⌘V 貼上')
    } else if (mode === 'plain-only') {
      toast('此瀏覽器僅複製了純文字版；請改用 Chrome／Edge 或下載 .html 檔')
    } else {
      toast('複製失敗，請改下載 .html 後從瀏覽器全選複製')
    }
  }

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

  const downloadHtml = () => {
    const base =
      b.titleLine.trim().replace(/^GM TW Weekly Progress Report\s*-\s*/i, '') ||
      'boss-weekly-email'
    downloadBossWeeklyReportHtml(emailHtml, base)
    toast('已下載 .html（可雙擊用瀏覽器開啟後全選複製到郵件）')
  }

  return (
    <>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <div className="card-title">📨 給老闆／總部週報</div>
        </div>
        <div className="card-body" style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          <p style={{ margin: '0 0 8px' }}>
            格式對齊你上一封 <strong>GM TW Weekly Progress Report</strong>：六大段以{' '}
            <strong>Tab</strong> 編輯；寄信時請用{' '}
            <strong>複製 Email 格式</strong>
            ，會產出<strong>HTML 表格</strong>（Gmail／Outlook 貼上後即為表格式）。純文字版仍可用於試算表或備份。
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <button
              type="button"
              className="btn"
              onClick={applyBossWeeklyReportExampleHen20260318}
            >
              載入 2026/03/18 參考範例（Hen）
            </button>
            <button type="button" className="btn" onClick={clearBossWeeklyReport}>
              清空草稿
            </button>
            <button type="button" className="btn btn-primary" onClick={copyEmailFormat}>
              複製 Email 格式（HTML 表格）
            </button>
            <button type="button" className="btn" onClick={copyAll}>
              複製純文字（Tab）
            </button>
            <button type="button" className="btn" onClick={downloadTxt}>
              下載 .txt
            </button>
            <button type="button" className="btn" onClick={downloadHtml}>
              下載 .html
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

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <div className="card-title">Email 預覽（HTML 表格）</div>
        </div>
        <div className="card-body">
          <p className="text-muted" style={{ fontSize: 12, margin: '0 0 10px' }}>
            與「複製 Email 格式」相同排版；實際郵件外觀可能因信箱略為不同。
          </p>
          <iframe
            title="週報 HTML 預覽"
            srcDoc={emailHtml}
            sandbox="allow-same-origin"
            style={{
              width: '100%',
              height: 480,
              border: '1px solid var(--border, #ddd)',
              borderRadius: 8,
              background: '#fff',
            }}
          />
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">純文字預覽（Tab）</div>
        </div>
        <div className="card-body">
          <textarea
            className="input review-input"
            readOnly
            style={{ ...taStyle, minHeight: 200, opacity: 0.95 }}
            value={composed}
            aria-label="完整週報純文字預覽"
          />
        </div>
      </div>
    </>
  )
}
