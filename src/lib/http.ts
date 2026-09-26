import { useSession } from '@/stores/session'
import type { ApiErrorBody, AuthResponse } from '@/types/api'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details: Record<string, unknown>

  constructor(status: number, code: string, details: Record<string, unknown> = {}, message = code) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown
  /** Không gắn token và không tự refresh (dùng cho /auth/*) */
  anonymous?: boolean
}

async function toApiError(res: Response): Promise<ApiError> {
  let body: Partial<ApiErrorBody> | null = null
  try {
    body = (await res.json()) as ApiErrorBody
  } catch {
    // body không phải JSON
  }
  const details = { ...(body?.error?.details ?? {}) }
  const retryAfter = res.headers.get('Retry-After')
  if (retryAfter && details.retryAfterSec === undefined) details.retryAfterSec = Number(retryAfter)
  return new ApiError(res.status, body?.error?.code ?? 'INTERNAL_ERROR', details, body?.error?.message)
}

async function send(path: string, { body, anonymous, headers, ...init }: RequestOptions) {
  const token = useSession.getState().accessToken
  try {
    return await fetch(`${BASE_URL}${path}`, {
      ...init,
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(!anonymous && token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR')
  }
}

// Single-flight: mọi request gặp 401 cùng chờ một lần refresh
let refreshing: Promise<AuthResponse> | null = null

export function refreshSession(): Promise<AuthResponse> {
  refreshing ??= (async () => {
    try {
      const res = await send('/auth/refresh', { method: 'POST', anonymous: true })
      if (!res.ok) throw await toApiError(res)
      const auth = (await res.json()) as AuthResponse
      useSession.getState().setSession(auth)
      return auth
    } catch (error) {
      useSession.getState().clearSession()
      throw error
    } finally {
      refreshing = null
    }
  })()
  return refreshing
}

export async function http<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let res = await send(path, options)

  if (res.status === 401 && !options.anonymous) {
    await refreshSession()
    res = await send(path, options)
  }

  if (!res.ok) throw await toApiError(res)
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}
