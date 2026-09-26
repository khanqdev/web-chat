import type { Me } from '@/types/api'

/** Tài khoản mẫu cho MSW (chỉ dùng khi VITE_USE_MOCKS=true) */
export const DEMO_ACCOUNT = {
  email: 'demo@webchat.test',
  password: 'matkhau123',
}

export const demoUser: Me = {
  id: '66f5a1b2c3d4e5f601234567',
  displayName: 'Demo',
  avatarUrl: null,
  email: DEMO_ACCOUNT.email,
  emailVerified: true,
  bio: null,
  authProviders: ['password'],
  settings: { language: 'vi', theme: 'system', whoCanMessage: 'everyone', soundEnabled: true },
  createdAt: '2026-09-26T00:00:00Z',
}
