import { useState } from 'react'
import { useTranslation } from 'react-i18next'

/** Tạm thời: chỉ báo chưa cấu hình. TODO(M1-08): Google Identity Services → POST /auth/google */
export function useGoogleSignIn() {
  const { t } = useTranslation('auth')
  const [error, setError] = useState<string | null>(null)

  const start = () => {
    if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) setError(t('googleNotConfigured'))
  }

  return { start, error, reset: () => setError(null) }
}
