import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { RegisterResponse } from '@/types/api'

type PendingRegistrationState = {
  /** Đăng ký đang chờ xác minh OTP; không lưu mật khẩu */
  pending: RegisterResponse | null
  setPending: (value: RegisterResponse) => void
  clearPending: () => void
}

// sessionStorage: tải lại trang ở bước OTP không mất email, đóng tab thì xoá
export const usePendingRegistration = create<PendingRegistrationState>()(
  persist(
    (set) => ({
      pending: null,
      setPending: (pending) => set({ pending }),
      clearPending: () => set({ pending: null }),
    }),
    { name: 'pending-registration', storage: createJSONStorage(() => sessionStorage) },
  ),
)
