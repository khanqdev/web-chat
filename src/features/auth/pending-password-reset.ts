import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { RegisterResponse } from '@/types/api'

type PendingPasswordResetState = {
  /** Yêu cầu đặt lại mật khẩu đang chờ nhập OTP */
  pending: RegisterResponse | null
  setPending: (value: RegisterResponse) => void
  clearPending: () => void
}

// sessionStorage: tải lại trang vẫn ở bước nhập mã, đóng tab thì xoá
export const usePendingPasswordReset = create<PendingPasswordResetState>()(
  persist(
    (set) => ({
      pending: null,
      setPending: (pending) => set({ pending }),
      clearPending: () => set({ pending: null }),
    }),
    { name: 'pending-password-reset', storage: createJSONStorage(() => sessionStorage) },
  ),
)
