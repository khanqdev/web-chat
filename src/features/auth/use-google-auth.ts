import { useState } from 'react'
import { useNavigate } from 'react-router'

import { errorMessage } from '@/lib/errors'
import { decodeIdToken } from '@/lib/google-identity'
import { ApiError } from '@/lib/http'

import { useGoogleLogin } from './api'

type Options = {
  /** Đường dẫn chuyển tới sau khi đăng nhập thành công */
  redirectTo?: () => string
  /** Email Google trùng tài khoản mật khẩu (409 ACCOUNT_LINK_REQUIRED) */
  onLinkRequired?: (email: string) => void
}

/** Gửi ID token của Google lên /auth/google và gom lỗi để hiển thị ở vùng báo lỗi của form */
export function useGoogleAuth({ redirectTo, onLinkRequired }: Options = {}) {
  const navigate = useNavigate()
  const googleLogin = useGoogleLogin()
  const [localError, setLocalError] = useState<string | null>(null)

  const signIn = (idToken: string) => {
    setLocalError(null)
    googleLogin.mutate(idToken, {
      onSuccess: () => void navigate(redirectTo?.() ?? '/', { replace: true }),
      onError: (error) => {
        if (error instanceof ApiError && error.code === 'ACCOUNT_LINK_REQUIRED') {
          const { email } = decodeIdToken(idToken)
          if (email) onLinkRequired?.(email)
        }
      },
    })
  }

  const showError = (message: string) => {
    googleLogin.reset()
    setLocalError(message)
  }

  const reset = () => {
    googleLogin.reset()
    setLocalError(null)
  }

  return {
    signIn,
    showError,
    reset,
    isPending: googleLogin.isPending,
    error: googleLogin.isError ? errorMessage(googleLogin.error) : localError,
  }
}
