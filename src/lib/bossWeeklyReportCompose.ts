import type { BossWeeklyReport } from './types'

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function cellInner(c: string): string {
  return escapeHtml(c).replace(/\n/g, '<br/>')
}

const TD =
  'border:1px solid #ddd;padding:10px 12px;vertical-align:top;font-size:14px;line-height:1.5;color:#222'
const TH = `${TD};background:#f0f3f7;font-weight:600`

/** 單一區塊：依空行拆成多張表（如 Partnerships 兩段表）；tab 分欄，首列為表頭 */
function singleChunkToHtml(chunk: string): string {
  const lines = chunk.split('\n').map((l) => l.trimEnd()).filter((l) => l.length > 0)
  if (!lines.length) return ''
  const rows = lines.map((line) => line.split('\t'))
  const maxCols = Math.max(1, ...rows.map((r) => r.length))
  const pad = (r: string[]) => {
    const x = [...r]
    while (x.length < maxCols) x.push('')
    return x
  }
  const padded = rows.map(pad)

  if (maxCols === 1) {
    return padded
      .map(([c]) => `<p style="margin:0 0 10px;line-height:1.55">${cellInner(c)}</p>`)
      .join('')
  }

  let out =
    '<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;max-width:920px;margin:0 0 22px;border:1px solid #ccc">'
  padded.forEach((cells, ri) => {
    const isHead = ri === 0
    out += '<tr>'
    for (const c of cells) {
      const tag = isHead ? 'th' : 'td'
      const st = isHead ? TH : TD
      out += `<${tag} style="${st}">${cellInner(c)}</${tag}>`
    }
    out += '</tr>'
  })
  out += '</table>'
  return out
}

function tabSectionToEmailHtml(sectionBody: string): string {
  const chunks = sectionBody.split(/\n\s*\n/).map((c) => c.trim()).filter(Boolean)
  if (!chunks.length) {
    return '<p style="margin:0;color:#888;font-size:14px">（無）</p>'
  }
  return chunks.map(singleChunkToHtml).join('')
}

/**
 * 完整 HTML 文件，適合貼入 Gmail / Outlook 等（表格為內嵌 style，相容多數郵件客戶端）。
 */
export function composeBossWeeklyReportEmailHtml(b: BossWeeklyReport): string {
  const sections: { title: string; body: string }[] = [
    {
      title: 'I. Financial Performance (TWD, after VAT)',
      body: b.sectionFinancial,
    },
    { title: 'II. Metrics - Marketing BU', body: b.sectionMarketingBu },
    { title: 'III. Metrics - Sales BU', body: b.sectionSalesBu },
    { title: 'IV. Strategic Partnerships', body: b.sectionPartnerships },
    { title: 'V. Marketing Campaigns', body: b.sectionCampaigns },
    { title: 'VI. Key issues', body: b.sectionKeyIssues },
  ]

  const parts: string[] = []
  parts.push(
    '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>',
  )
  parts.push(
    '<body style="margin:20px;font-family:\'Segoe UI\',Roboto,\'Helvetica Neue\',Arial,sans-serif;font-size:15px;color:#1a1a1a;line-height:1.5">',
  )
  parts.push(
    `<h1 style="font-size:20px;font-weight:600;margin:0 0 16px;line-height:1.35">${cellInner(b.titleLine.trim() || 'Weekly Progress Report')}</h1>`,
  )
  parts.push(
    `<div style="margin:0 0 24px;line-height:1.55;white-space:pre-wrap">${escapeHtml(b.opening)}</div>`,
  )

  for (const { title, body } of sections) {
    parts.push(
      `<h2 style="font-size:16px;font-weight:600;margin:28px 0 12px;padding-bottom:8px;border-bottom:2px solid #e8ecf1;color:#111">${escapeHtml(title)}</h2>`,
    )
    parts.push(tabSectionToEmailHtml(body))
  }

  parts.push('</body></html>')
  return parts.join('')
}

/**
 * 複製到剪貼簿：同時提供 text/html 與 text/plain，貼到 Email 通常會保留表格。
 * 不支援 ClipboardItem 時改為僅純文字。
 */
export async function copyBossWeeklyReportForEmail(
  b: BossWeeklyReport,
): Promise<'html' | 'plain-only' | 'fail'> {
  const html = composeBossWeeklyReportEmailHtml(b)
  const plain = composeBossWeeklyReportText(b)
  try {
    if (typeof ClipboardItem !== 'undefined') {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([plain], { type: 'text/plain' }),
        }),
      ])
      return 'html'
    }
  } catch {
    /* 權限或瀏覽器限制 */
  }
  try {
    await navigator.clipboard.writeText(plain)
    return 'plain-only'
  } catch {
    return 'fail'
  }
}

export function downloadBossWeeklyReportHtml(
  content: string,
  filenameBase: string,
): void {
  const safe = filenameBase.replace(/[^\w.\-]+/g, '_').slice(0, 80) || 'boss-weekly'
  const blob = new Blob([content], { type: 'text/html;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${safe}.html`
  a.click()
  URL.revokeObjectURL(a.href)
}

/** 組成可貼入 Email／Google Doc 的純文字週報（保留換行與表格內 tab） */
export function composeBossWeeklyReportText(b: BossWeeklyReport): string {
  const t = (s: string) => s.trimEnd()
  const blocks = [
    t(b.titleLine),
    '',
    t(b.opening),
    '',
    'I. Financial Performance (TWD, after VAT)',
    t(b.sectionFinancial),
    '',
    'II. Metrics - Marketing BU',
    t(b.sectionMarketingBu),
    '',
    'III. Metrics - Sales BU',
    t(b.sectionSalesBu),
    '',
    'IV. Strategic Partnerships',
    t(b.sectionPartnerships),
    '',
    'V. Marketing Campaigns',
    t(b.sectionCampaigns),
    '',
    'VI. Key issues',
    t(b.sectionKeyIssues),
  ]
  return blocks.join('\n').trim() + '\n'
}

export function downloadBossWeeklyReportTxt(
  content: string,
  filenameBase: string,
): void {
  const safe = filenameBase.replace(/[^\w.\-]+/g, '_').slice(0, 80) || 'boss-weekly'
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${safe}.txt`
  a.click()
  URL.revokeObjectURL(a.href)
}
