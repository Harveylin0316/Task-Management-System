/** 在非安全情境（例如部分 file://）下 randomUUID 可能不可用 */
export function newId(): string {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID()
    }
  } catch {
    /* ignore */
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}
