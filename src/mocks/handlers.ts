import { delay, http, HttpResponse } from 'msw'

import type { AuthResponse } from '@/types/api'

import { DEMO_ACCOUNT, demoUser } from './data'

const BASE = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'
const MAX_FAILED = 5
const LOCK_MS = 15 * 60 * 1000

let failedAttempts = 0
let lockedUntil = 0

const error = (status: number, code: string, details?: Record<string, unknown>) =>
  HttpResponse.json({ error: { code, message: code, details } }, { status })

const authResponse = (): AuthResponse => ({
  accessToken: `mock.${crypto.randomUUID()}`,
  accessTokenExpiresIn: 900,
  user: demoUser,
})

export const handlers = [
  http.post(`${BASE}/auth/login`, async ({ request }) => {
    await delay(600)
    const now = Date.now()
    if (lockedUntil > now) {
      return error(423, 'AUTH_LOCKED', { retryAfterSec: Math.ceil((lockedUntil - now) / 1000) })
    }

    const { email, password } = (await request.json()) as { email: string; password: string }
    if (email.toLowerCase() !== DEMO_ACCOUNT.email || password !== DEMO_ACCOUNT.password) {
      failedAttempts += 1
      if (failedAttempts >= MAX_FAILED) {
        failedAttempts = 0
        lockedUntil = now + LOCK_MS
        return error(423, 'AUTH_LOCKED', { retryAfterSec: LOCK_MS / 1000 })
      }
      return error(401, 'AUTH_INVALID_CREDENTIALS')
    }

    failedAttempts = 0
    return HttpResponse.json(authResponse())
  }),

  // Mock không giữ cookie refresh: tải lại trang sẽ quay về /login
  http.post(`${BASE}/auth/refresh`, () => error(401, 'TOKEN_EXPIRED')),

  http.post(`${BASE}/auth/logout`, () => new HttpResponse(null, { status: 204 })),
]
