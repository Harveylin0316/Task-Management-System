/** 將「小明, 小華、小李」等字串拆成參與者名單 */
export function parseParticipantNames(raw: string): string[] {
  return raw
    .split(/[,，、\n\r]+/)
    .map((s) => s.trim())
    .filter(Boolean)
}
