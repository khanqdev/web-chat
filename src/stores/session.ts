import { create } from 'zustand'

import type { AuthResponse, Me } from '@/types/api'

type SessionState = {
  // Chỉ giữ trong bộ nhớ; refresh token là cookie httpOnly do server đặt
  accessToken: string | null
  user: Me | null
  setSession: (auth: AuthResponse) => void
  clearSession: () => void
}

export const useSession = create<SessionState>()((set) => ({
  accessToken: null,
  user: null,
  setSession: (auth) => set({ accessToken: auth.accessToken, user: auth.user }),
  clearSession: () => set({ accessToken: null, user: null }),
}))
