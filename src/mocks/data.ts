import type { Me } from '@/types/api'

/** Tài khoản mẫu cho MSW (chỉ dùng khi VITE_USE_MOCKS=true) */
export const DEMO_ACCOUNT = {
  email: 'demo@webchat.test',
  password: 'matkhau123',
}

/** Mã OTP cố định của mock khi đăng ký */
export const MOCK_OTP = '123456'

export const makeUser = (id: string, email: string, displayName: string, language: 'vi' | 'en' = 'vi'): Me => ({
  id,
  displayName,
  avatarUrl: null,
  email,
  emailVerified: true,
  bio: null,
  authProviders: ['password'],
  settings: { language, theme: 'system', whoCanMessage: 'everyone', soundEnabled: true },
  createdAt: new Date().toISOString(),
})

export const demoUser: Me = makeUser('66f5a1b2c3d4e5f601234567', DEMO_ACCOUNT.email, 'Demo')
