import { useMutation } from '@tanstack/react-query'

import { http } from '@/lib/http'
import { useSession } from '@/stores/session'
import type { AuthResponse } from '@/types/api'

import type { LoginInput } from './schema'

export function useLogin() {
  const setSession = useSession((s) => s.setSession)
  return useMutation({
    mutationFn: (input: LoginInput) =>
      http<AuthResponse>('/auth/login', { method: 'POST', body: input, anonymous: true }),
    onSuccess: setSession,
  })
}

export function useLogout() {
  const clearSession = useSession((s) => s.clearSession)
  return useMutation({
    mutationFn: () => http<void>('/auth/logout', { method: 'POST' }),
    onSettled: clearSession,
  })
}
