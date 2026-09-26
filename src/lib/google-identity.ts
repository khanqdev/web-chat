// Google Identity Services (GIS): nút "Sign in with Google" trả về ID token (JWT)
// https://developers.google.com/identity/gsi/web/reference/js-reference

export type GoogleCredentialResponse = { credential: string; select_by?: string }

type GsiButtonConfiguration = {
  type?: 'standard' | 'icon'
  theme?: 'outline' | 'filled_blue' | 'filled_black'
  size?: 'large' | 'medium' | 'small'
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
  shape?: 'rectangular' | 'pill' | 'circle' | 'square'
  logo_alignment?: 'left' | 'center'
  width?: number
  locale?: string
}

type GoogleAccountsId = {
  initialize: (config: {
    client_id: string
    callback: (response: GoogleCredentialResponse) => void
    ux_mode?: 'popup' | 'redirect'
    context?: 'signin' | 'signup' | 'use'
    auto_select?: boolean
    cancel_on_tap_outside?: boolean
    itp_support?: boolean
    use_fedcm_for_button?: boolean
  }) => void
  renderButton: (parent: HTMLElement, options: GsiButtonConfiguration) => void
  disableAutoSelect: () => void
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } }
  }
}

export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() ?? ''

const SCRIPT_SRC = 'https://accounts.google.com/gsi/client'

let loading: Promise<GoogleAccountsId> | null = null
let currentCallback: ((response: GoogleCredentialResponse) => void) | null = null

/** Tải script GIS một lần và initialize một lần cho cả app */
export function loadGoogleIdentity(): Promise<GoogleAccountsId> {
  loading ??= new Promise<GoogleAccountsId>((resolve, reject) => {
    const done = () => {
      const id = window.google?.accounts.id
      if (!id) return reject(new Error('GIS unavailable'))
      id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        // Mỗi trang đăng ký callback riêng qua setGoogleCallback
        callback: (response) => currentCallback?.(response),
        ux_mode: 'popup',
        itp_support: true,
      })
      resolve(id)
    }

    if (window.google?.accounts.id) return done()
    const script = document.createElement('script')
    // Chữ trên nút GIS theo ngôn ngữ lúc tải script; `locale` của renderButton chỉ áp cho nút cá nhân hoá
    script.src = `${SCRIPT_SRC}?hl=${document.documentElement.lang || 'vi'}`
    script.async = true
    script.defer = true
    script.onload = done
    script.onerror = () => reject(new Error('GIS script failed to load'))
    document.head.appendChild(script)
  }).catch((error: unknown) => {
    loading = null // cho phép thử lại lần sau
    throw error
  })
  return loading
}

export function setGoogleCallback(callback: ((response: GoogleCredentialResponse) => void) | null) {
  currentCallback = callback
}

/** Đọc phần payload của ID token (không xác minh chữ ký; chỉ dùng để hiển thị/điền sẵn) */
export function decodeIdToken(token: string): { email?: string; name?: string; picture?: string } {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(
      atob(payload)
        .split('')
        .map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join(''),
    )
    return JSON.parse(json) as { email?: string; name?: string; picture?: string }
  } catch {
    return {}
  }
}
