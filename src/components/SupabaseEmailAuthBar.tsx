import { useState, type FormEvent } from 'react'
import { getSupabaseClient } from '../lib/supabaseClient'

type Props = { visible: boolean; toast: (msg: string) => void }

function formatAuthError(prefix: string, message: string): string {
  if (
    /rate limit exceeded|over_email_send_rate_limit|email rate limit/i.test(
      message,
    )
  ) {
    return `${prefix}：Supabase 寄信頻率已達上限（測試時連續註冊常觸發）。請隔約 30～60 分鐘再試，或帳號若已建立請直接按「登入」。可到 Dashboard → Authentication → Rate Limits 查看說明。`
  }
  return `${prefix}：${message}`
}

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
          toast(formatAuthError('登入失敗', error.message))
          return
        }
        toast('已登入，正在同步雲端…')
        return
      }
      const { data, error } = await client.auth.signUp({ email: em, password: pw })
      if (error) {
        toast(formatAuthError('註冊失敗', error.message))
        return
      }
      if (data.session) {
        toast('註冊並登入成功，正在同步…')
        return
      }
      // 關閉 Confirm email 後，部分專案 signUp 仍不帶 session，改試立即登入
      const { error: signInErr } = await client.auth.signInWithPassword({
        email: em,
        password: pw,
      })
      if (!signInErr) {
        toast('註冊成功，已登入並同步雲端…')
        return
      }
      toast(
        `帳號已建立。請按「登入」試一次；若後台仍開「信箱確認」，再查驗證信（含垃圾信匣）。`,
      )
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
        <form
          className="cloud-email-bar-form"
          onSubmit={(e: FormEvent<HTMLFormElement>) => {
            e.preventDefault()
            void run('signin')
          }}
        >
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
            type="submit"
            className="btn btn-primary cloud-email-btn"
            disabled={busy}
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
        </form>
        <p className="cloud-email-bar-hint">
          請在 Supabase → Authentication → Providers 開啟 <strong>Email</strong>
          。若已關閉「Confirm email」，註冊後通常會直接登入；若沒有，請按「登入」。
        </p>
      </div>
    </div>
  )
}
