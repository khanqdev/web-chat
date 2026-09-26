import i18n from '@/lib/i18n'
import { ApiError } from '@/lib/http'

/** Dịch lỗi API theo `code`; thiếu bản dịch thì dùng errors.INTERNAL_ERROR */
export function errorMessage(error: unknown): string {
  const code = error instanceof ApiError ? error.code : 'INTERNAL_ERROR'
  const details = error instanceof ApiError ? error.details : {}
  const retryAfterSec = Number(details.retryAfterSec ?? 0)

  const key = `errors:${code}`
  if (!i18n.exists(key)) return i18n.t('errors:INTERNAL_ERROR')

  return i18n.t(key as 'errors:INTERNAL_ERROR', {
    ...details,
    seconds: retryAfterSec,
    minutes: Math.max(1, Math.ceil(retryAfterSec / 60)),
  })
}
