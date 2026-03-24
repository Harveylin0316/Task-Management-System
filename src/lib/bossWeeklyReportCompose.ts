import type { BossWeeklyReport } from './types'

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
