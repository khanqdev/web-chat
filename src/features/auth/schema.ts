import { z } from 'zod'

// Thông báo lỗi là khoá i18n trong namespace `auth`
export const loginSchema = z.object({
  email: z.string().trim().min(1, 'validation.emailRequired').pipe(z.email('validation.emailInvalid')),
  password: z.string().min(8, 'validation.passwordMin'),
})

export type LoginInput = z.infer<typeof loginSchema>
