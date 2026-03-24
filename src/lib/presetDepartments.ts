import type { Department } from './types'

/** 穩定 id，便於報表與匯入資料對齊 */
export const DEPT_MARKETING_ID = 'dept-marketing'
export const DEPT_BD_ID = 'dept-bd'

export function createDefaultDepartments(): Department[] {
  return [
    { id: DEPT_MARKETING_ID, name: '行銷', kpis: [] },
    { id: DEPT_BD_ID, name: 'BD業務', kpis: [] },
  ]
}
