import { useState } from 'react'
import { getSupabaseClient } from '../lib/supabaseClient'

type Props = { visible: boolean; toast: (msg: string) => void }

export function SupabaseEmailAuthBar({ visible, toast }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  if (!visible) return null

  const run = async (mode: 'signin' | 'signup') => {
    const em = email.trim()
    const pw = password
    if (!em || !pw) {
      toast('請輸入 Email 與密碼')
      return
    }
    if (pw.length < 6) {
      toast('密碼至少 6 字元（Supabase 預設）')
      return
    }
    setBusy(true)
    try {
      const client = getSupabaseClient()
      if (mode === 'signin') {
        const { error } = await client.auth.signInWithPassword({
          email: em,
          password: pw,
        })
        if (error) {
          toast(`登入失敗：${error.message}`)
          return
        }
        toast('已登入，正在同步雲端…')
        return
      }
      const { data, error } = await client.auth.signUp({ email: em, password: pw })
      if (error) {
        toast(`註冊失敗：${error.message}`)
        return
      }
      if (data.session) {
        toast('註冊並登入成功，正在同步…')
      } else {
        toast('請至信箱點驗證信後重新整理（或關閉 Email 確認以立即登入）')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="cloud-email-bar" role="region" aria-label="雲端 Email 登入">
      <div className="cloud-email-bar-inner">
        <p className="cloud-email-bar-title">
          此專案匿名登入被 Auth API 拒絕（<code>anonymous_provider_disabled</code>
          ）。請用 Email 登入後，資料會寫入 Supabase；登入前仍暫存本機。
        </p>
        <div className="cloud-email-bar-form">
          <input
            type="email"
            autoComplete="email"
            placeholder="Email"
            className="cloud-email-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={busy}
          />
          <input
            type="password"
            autoComplete="current-password"
            placeholder="密碼（至少 6 字）"
            className="cloud-email-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={busy}
          />
          <button
            type="button"
            className="btn btn-primary cloud-email-btn"
            disabled={busy}
            onClick={() => void run('signin')}
          >
            登入
          </button>
          <button
            type="button"
            className="btn cloud-email-btn"
            disabled={busy}
            onClick={() => void run('signup')}
          >
            註冊
          </button>
        </div>
        <p className="cloud-email-bar-hint">
          Supabase → Authentication → Providers 請開啟 <strong>Email</strong>
          ，並建議關閉「Confirm email」以便立即取得 session（僅個人專案適用）。
        </p>
      </div>
    </div>
  )
}
