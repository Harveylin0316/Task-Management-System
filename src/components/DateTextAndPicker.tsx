import type { CSSProperties } from 'react'
import { toDateInputValue } from '../lib/dateUtils'

type Props = {
  id?: string
  value: string
  onChange: (v: string) => void
  className?: string
  style?: CSSProperties
  textPlaceholder?: string
}

/** 可手打日期／說明文字，亦可點右側日曆選 ISO 日期 */
export function DateTextAndPicker({
  id,
  value,
  onChange,
  className = 'input',
  style,
  textPlaceholder = '可打字（例：2026/6/30）或右側選日',
}: Props) {
  const v = value ?? ''
  return (
    <div className="date-text-picker-wrap" style={style}>
      <input
        id={id}
        type="text"
        className={`${className} date-text-picker-text`}
        value={v}
        onChange={(e) => onChange(e.target.value)}
        placeholder={textPlaceholder}
        autoComplete="off"
      />
      <input
        type="date"
        className={`${className} date-text-picker-cal`}
        value={toDateInputValue(v)}
        onChange={(e) => onChange(e.target.value)}
        title="點選日期"
        aria-label="日曆選日期"
      />
    </div>
  )
}
