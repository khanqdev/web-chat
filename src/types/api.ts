// Tạm viết tay theo docs/plan/05-api-contract.md; sẽ thay bằng api.gen.ts sinh từ OpenAPI

export type UserSettings = {
  language: 'vi' | 'en'
  theme: 'light' | 'dark' | 'system'
  whoCanMessage: 'everyone' | 'friends'
  soundEnabled: boolean
}

export type Me = {
  id: string
  displayName: string
  avatarUrl: string | null
  email: string
  emailVerified: boolean
  bio: string | null
  authProviders: ('password' | 'google')[]
  settings: UserSettings
  createdAt: string
}

export type AuthResponse = {
  accessToken: string
  accessTokenExpiresIn: number
  user: Me
  isNewUser?: boolean
}

export type ApiErrorBody = {
  error: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
}
