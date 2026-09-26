import { useMutation } from '@tanstack/react-query'

import { http } from '@/lib/http'
import { useSession } from '@/stores/session'
import type { AuthResponse, RegisterRequest, RegisterResponse } from '@/types/api'

import { usePendingRegistration } from './pending-registration'
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

export function useRegister() {
  const setPending = usePendingRegistration((s) => s.setPending)
  return useMutation({
    mutationFn: (input: RegisterRequest) =>
      http<RegisterResponse>('/auth/register', { method: 'POST', body: input, anonymous: true }),
    onSuccess: setPending,
  })
}

export function useResendOtp() {
  const setPending = usePendingRegistration((s) => s.setPending)
  return useMutation({
    mutationFn: (email: string) =>
      http<RegisterResponse>('/auth/register/resend-otp', { method: 'POST', body: { email }, anonymous: true }),
    onSuccess: setPending,
  })
}

export function useVerifyOtp() {
  const setSession = useSession((s) => s.setSession)
  const clearPending = usePendingRegistration((s) => s.clearPending)
  return useMutation({
    mutationFn: (input: { email: string; otp: string }) =>
      http<AuthResponse>('/auth/register/verify', { method: 'POST', body: input, anonymous: true }),
    onSuccess: (auth) => {
      setSession(auth)
      clearPending()
    },
  })
}
