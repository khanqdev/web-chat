// Google Identity Services (GIS): tải script một lần và khởi tạo một lần cho cả app.
// Tài liệu: https://developers.google.com/identity/gsi/web/reference/js-reference

const GSI_SRC = 'https://accounts.google.com/gsi/client'

export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() || undefined

type CredentialResponse = { credential: string }

export type GoogleButtonOptions = {
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
    callback: (response: CredentialResponse) => void
    ux_mode?: 'popup' | 'redirect'
    auto_select?: boolean
    cancel_on_tap_outside?: boolean
  }) => void
  renderButton: (parent: HTMLElement, options: GoogleButtonOptions) => void
  disableAutoSelect: () => void
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } }
  }
}

let ready: Promise<GoogleAccountsId> | null = null
// GIS chỉ nhận một callback lúc initialize; trang nào đang hiện nút thì đăng ký handler của trang đó
let credentialHandler: ((idToken: string) => void) | null = null

function loadScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = GSI_SRC
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => {
      script.remove()
      reject(new Error('GSI_LOAD_FAILED'))
    }
    document.head.appendChild(script)
  })
}

/** Tải GIS và gọi initialize (chỉ một lần). Lỗi mạng hoặc bị chặn thì lần gọi sau thử lại. */
export function loadGoogleIdentity(): Promise<GoogleAccountsId> {
  if (!GOOGLE_CLIENT_ID) return Promise.reject(new Error('GOOGLE_NOT_CONFIGURED'))
  ready ??= loadScript()
    .then(() => {
      const gsi = window.google?.accounts.id
      if (!gsi) throw new Error('GSI_LOAD_FAILED')
      gsi.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: ({ credential }) => credentialHandler?.(credential),
        ux_mode: 'popup',
        auto_select: false,
      })
      return gsi
    })
    .catch((error: unknown) => {
      ready = null
      throw error
    })
  return ready
}

export function setGoogleCredentialHandler(handler: ((idToken: string) => void) | null) {
  credentialHandler = handler
}

/** Gọi khi đăng xuất để Google không tự chọn lại tài khoản cũ */
export function disableGoogleAutoSelect() {
  window.google?.accounts.id.disableAutoSelect()
}
