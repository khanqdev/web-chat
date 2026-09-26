/** Đọc phần payload của JWT mà không kiểm chữ ký (chỉ để hiển thị; server mới là nơi xác thực) */
export function decodeJwtPayload<T = Record<string, unknown>>(token: string): T | null {
  const part = token.split('.')[1]
  if (!part) return null
  try {
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(part.length / 4) * 4, '=')
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
    return JSON.parse(new TextDecoder().decode(bytes)) as T
  } catch {
    return null
  }
}
