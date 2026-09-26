import { delay, http, HttpResponse } from 'msw'

import type { AuthResponse, Me, RegisterRequest, RegisterResponse } from '@/types/api'

import { DEMO_ACCOUNT, demoUser, makeUser, MOCK_OTP } from './data'

const BASE = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'
const SEC = 1000
const MIN = 60 * SEC

// Quy tắc theo docs/plan/05-api-contract.md mục 2.1
const LOGIN_MAX_FAILED = 5
const LOCK_MS = 15 * MIN
const OTP_TTL_MS = 5 * MIN
const OTP_MAX_FAILED = 5
const RESEND_GAP_MS = 60 * SEC
const RESEND_MAX_PER_HOUR = 5

type Account = { password: string; user: Me }
type PendingSignup = {
  request: RegisterRequest
  otpExpiresAt: number
  failed: number
  lockedUntil: number
  sentAt: number[]
}

// Trạng thái nằm trong bộ nhớ của service worker client: tải lại trang là mất
const accounts = new Map<string, Account>([[DEMO_ACCOUNT.email, { password: DEMO_ACCOUNT.password, user: demoUser }]])
const pendingSignups = new Map<string, PendingSignup>()
let loginFailed = 0
let loginLockedUntil = 0

const error = (status: number, code: string, details?: Record<string, unknown>) =>
  HttpResponse.json({ error: { code, message: code, details } }, { status })

const authResponse = (user: Me): AuthResponse => ({
  accessToken: `mock.${crypto.randomUUID()}`,
  accessTokenExpiresIn: 900,
  user,
})

function sendOtp(email: string, signup: PendingSignup): RegisterResponse {
  const now = Date.now()
  signup.otpExpiresAt = now + OTP_TTL_MS
  signup.failed = 0
  signup.sentAt = [...signup.sentAt.filter((t) => now - t < 60 * MIN), now]
  console.info(`[MSW] OTP cho ${email}: ${MOCK_OTP}`)
  return {
    email,
    otpExpiresAt: new Date(signup.otpExpiresAt).toISOString(),
    resendAvailableAt: new Date(now + RESEND_GAP_MS).toISOString(),
  }
}

export const handlers = [
  http.post(`${BASE}/auth/login`, async ({ request }) => {
    await delay(600)
    const now = Date.now()
    if (loginLockedUntil > now) {
      return error(423, 'AUTH_LOCKED', { retryAfterSec: Math.ceil((loginLockedUntil - now) / SEC) })
    }

    const { email, password } = (await request.json()) as { email: string; password: string }
    const account = accounts.get(email.trim().toLowerCase())
    if (!account || account.password !== password) {
      loginFailed += 1
      if (loginFailed >= LOGIN_MAX_FAILED) {
        loginFailed = 0
        loginLockedUntil = now + LOCK_MS
        return error(423, 'AUTH_LOCKED', { retryAfterSec: LOCK_MS / SEC })
      }
      return error(401, 'AUTH_INVALID_CREDENTIALS')
    }

    loginFailed = 0
    return HttpResponse.json(authResponse(account.user))
  }),

  http.post(`${BASE}/auth/register`, async ({ request }) => {
    await delay(700)
    const body = (await request.json()) as RegisterRequest
    const email = body.email.trim().toLowerCase()
    const displayName = body.displayName.trim()

    const fields = [
      ...(displayName.length < 2 || displayName.length > 50 ? ['displayName'] : []),
      ...(body.password.length < 8 ? ['password'] : []),
    ]
    if (fields.length) return error(400, 'VALIDATION_FAILED', { fields })
    if (accounts.has(email)) return error(409, 'EMAIL_TAKEN')

    const signup: PendingSignup = pendingSignups.get(email) ?? {
      request: body,
      otpExpiresAt: 0,
      failed: 0,
      lockedUntil: 0,
      sentAt: [],
    }
    signup.request = { ...body, email, displayName }
    pendingSignups.set(email, signup)
    return HttpResponse.json(sendOtp(email, signup), { status: 202 })
  }),

  http.post(`${BASE}/auth/register/resend-otp`, async ({ request }) => {
    await delay(500)
    const { email: raw } = (await request.json()) as { email: string }
    const email = raw.trim().toLowerCase()
    const signup = pendingSignups.get(email)
    if (!signup) return error(404, 'NOT_FOUND')

    const now = Date.now()
    const recent = signup.sentAt.filter((t) => now - t < 60 * MIN)
    const last = recent.at(-1) ?? 0
    if (now - last < RESEND_GAP_MS) {
      return error(429, 'RATE_LIMITED', { retryAfterSec: Math.ceil((RESEND_GAP_MS - (now - last)) / SEC) })
    }
    if (recent.length >= RESEND_MAX_PER_HOUR) {
      return error(429, 'RATE_LIMITED', { retryAfterSec: Math.ceil((recent[0] + 60 * MIN - now) / SEC) })
    }
    return HttpResponse.json(sendOtp(email, signup), { status: 202 })
  }),

  http.post(`${BASE}/auth/register/verify`, async ({ request }) => {
    await delay(600)
    const { email: raw, otp } = (await request.json()) as { email: string; otp: string }
    const email = raw.trim().toLowerCase()
    const signup = pendingSignups.get(email)
    if (!signup) return error(410, 'OTP_EXPIRED')

    const now = Date.now()
    if (signup.lockedUntil > now) return error(423, 'OTP_LOCKED')
    if (signup.otpExpiresAt <= now) return error(410, 'OTP_EXPIRED')

    if (otp !== MOCK_OTP) {
      signup.failed += 1
      if (signup.failed >= OTP_MAX_FAILED) {
        signup.lockedUntil = now + LOCK_MS
        return error(423, 'OTP_LOCKED')
      }
      return error(400, 'OTP_INVALID', { attemptsLeft: OTP_MAX_FAILED - signup.failed })
    }

    const { request: req } = signup
    const user = makeUser(crypto.randomUUID().replaceAll('-', '').slice(0, 24), email, req.displayName, req.language)
    accounts.set(email, { password: req.password, user })
    pendingSignups.delete(email)
    return HttpResponse.json({ ...authResponse(user), isNewUser: true }, { status: 201 })
  }),

  // Mock không giữ cookie refresh: tải lại trang sẽ quay về /login
  http.post(`${BASE}/auth/refresh`, () => error(401, 'TOKEN_EXPIRED')),

  http.post(`${BASE}/auth/logout`, () => new HttpResponse(null, { status: 204 })),
]
