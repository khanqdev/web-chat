import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { GOOGLE_CLIENT_ID, loadGoogleIdentity, setGoogleCredentialHandler } from '@/lib/google-identity'
import { useIsDark } from '@/lib/theme'
import { cn } from '@/lib/utils'

import { fieldClass } from './form-utils'
import { GoogleIcon } from './GoogleIcon'

export type GoogleUnavailableReason = 'notConfigured' | 'loadFailed'

type Props = {
  /** Chữ trên nút của Google: "Tiếp tục với Google" hoặc "Đăng ký với Google" */
  context: 'signin' | 'signup'
  pending: boolean
  onCredential: (idToken: string) => void
  onUnavailable: (reason: GoogleUnavailableReason) => void
}

/**
 * Nút chính thức của Google Identity Services (bắt buộc để lấy ID token trong popup).
 * Trong lúc tải script, hoặc khi thiếu client id / bị chặn, hiện nút giả cùng kích thước để bố cục không nhảy.
 */
export function GoogleSignInButton({ context, pending, onCredential, onUnavailable }: Props) {
  const { t, i18n } = useTranslation('auth')
  const isDark = useIsDark()
  const containerRef = useRef<HTMLDivElement>(null)
  const onCredentialRef = useRef(onCredential)
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>(GOOGLE_CLIENT_ID ? 'loading' : 'failed')
  const [attempt, setAttempt] = useState(0)
  const language = i18n.resolvedLanguage === 'en' ? 'en' : 'vi'

  useEffect(() => {
    onCredentialRef.current = onCredential
  })

  useEffect(() => {
    setGoogleCredentialHandler((idToken) => onCredentialRef.current(idToken))
    return () => setGoogleCredentialHandler(null)
  }, [])

  // Vẽ lại nút khi đổi theme / ngôn ngữ vì GIS không tự cập nhật
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return
    let cancelled = false
    loadGoogleIdentity().then(
      (gsi) => {
        const el = containerRef.current
        if (cancelled || !el) return
        el.replaceChildren()
        gsi.renderButton(el, {
          type: 'standard',
          theme: isDark ? 'filled_black' : 'outline',
          size: 'large',
          text: context === 'signup' ? 'signup_with' : 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'center',
          // GIS giới hạn chiều rộng 200–400px
          width: Math.min(400, Math.max(200, Math.round(el.getBoundingClientRect().width))),
          locale: language,
        })
        setStatus('ready')
      },
      () => {
        if (!cancelled) setStatus('failed')
      },
    )
    return () => {
      cancelled = true
    }
  }, [isDark, language, context, attempt])

  const onFallbackClick = () => {
    if (!GOOGLE_CLIENT_ID) return onUnavailable('notConfigured')
    // Script bị chặn hoặc mất mạng: báo lỗi và thử tải lại
    onUnavailable('loadFailed')
    setStatus('loading')
    setAttempt((n) => n + 1)
  }

  return (
    <div className="relative h-[46px]" aria-busy={pending}>
      <div
        ref={containerRef}
        className={cn(
          'flex h-full w-full items-center justify-center [color-scheme:normal]',
          status !== 'ready' && 'invisible',
          pending && 'pointer-events-none opacity-60',
        )}
      />
      {status !== 'ready' && (
        <Button
          type="button"
          variant="outline"
          disabled={status === 'loading'}
          className={cn(fieldClass, 'absolute inset-0 w-full gap-2.5')}
          onClick={onFallbackClick}
        >
          <GoogleIcon className="size-[18px]" />
          {t(context === 'signup' ? 'register.google' : 'login.google')}
        </Button>
      )}
    </div>
  )
}
