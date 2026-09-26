import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { errorMessage } from '@/lib/errors'
import { ApiError } from '@/lib/http'
import { decodeJwtPayload } from '@/lib/jwt'
import type { AuthResponse } from '@/types/api'

import { useGoogleLogin } from './api'
import type { GoogleUnavailableReason } from './components/GoogleSignInButton'

/** Nhận ID token từ nút Google, gửi POST /auth/google và gom lỗi thành một thông báo cho FormAlert */
export function useGoogleSignIn(onSuccess: (auth: AuthResponse) => void) {
  const { t } = useTranslation(['auth', 'errors'])
  const mutation = useGoogleLogin()
  const [unavailable, setUnavailable] = useState<GoogleUnavailableReason | null>(null)

  const signIn = (idToken: string) => {
    setUnavailable(null)
    mutation.mutate(idToken, { onSuccess })
  }

  const linkRequired = mutation.error instanceof ApiError && mutation.error.code === 'ACCOUNT_LINK_REQUIRED'
  // Email Google trùng tài khoản mật khẩu: lấy email trong token để điền sẵn form đăng nhập
  const linkEmail = linkRequired && mutation.variables ? decodeJwtPayload<{ email?: string }>(mutation.variables)?.email : undefined

  let error: string | null = null
  if (mutation.isError) error = errorMessage(mutation.error)
  else if (unavailable === 'notConfigured') error = t('googleNotConfigured')
  else if (unavailable === 'loadFailed') error = t('errors:GOOGLE_UNAVAILABLE')

  return {
    signIn,
    pending: mutation.isPending,
    error,
    linkRequired,
    linkEmail,
    onUnavailable: setUnavailable,
    reset: () => {
      mutation.reset()
      setUnavailable(null)
    },
  }
}
