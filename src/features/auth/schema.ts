import { z } from 'zod'

// Thông báo lỗi là khoá i18n trong namespace `auth`
const email = z.string().trim().min(1, 'validation.emailRequired').pipe(z.email('validation.emailInvalid'))
const password = z.string().min(8, 'validation.passwordMin')

export const loginSchema = z.object({ email, password })

export type LoginInput = z.infer<typeof loginSchema>

export const registerSchema = z
  .object({
    displayName: z.string().trim().min(2, 'validation.displayNameLength').max(50, 'validation.displayNameLength'),
    email,
    password,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: 'validation.passwordMismatch',
    path: ['confirmPassword'],
  })

export type RegisterInput = z.infer<typeof registerSchema>

export const forgotPasswordSchema = z.object({ email })

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>

export const resetPasswordSchema = z
  .object({ newPassword: password, confirmPassword: z.string() })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: 'validation.passwordMismatch',
    path: ['confirmPassword'],
  })

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>

export const OTP_LENGTH = 6
