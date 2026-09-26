import type { ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

import { fieldClass } from './form-utils'
import { GoogleIcon } from './GoogleIcon'

export function AuthTitle({ children }: { children: ReactNode }) {
  return <h1 className="mt-2 text-[26px] leading-tight font-bold tracking-[-0.01em]">{children}</h1>
}

type FormFieldProps = {
  id: string
  label: string
  /** Khoá i18n (namespace auth) của lỗi validate */
  error?: string
  children: ReactNode
}

export function FormField({ id, label, error, children }: FormFieldProps) {
  const { t } = useTranslation('auth')
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-[13px] text-danger">
          {t(error as 'validation.emailInvalid')}
        </p>
      )}
    </div>
  )
}

/** Vùng báo lỗi chung của form; luôn render để trình đọc màn hình đọc khi nội dung thay đổi */
export function FormAlert({ children }: { children?: ReactNode }) {
  return (
    <div role="alert" aria-live="assertive" className="empty:hidden">
      {children && (
        <div className="rounded-[14px] bg-danger-soft px-3.5 py-2.5 text-[13px] text-danger">{children}</div>
      )}
    </div>
  )
}

export function GoogleButton({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation('auth')
  return (
    <Button type="button" variant="outline" className={`${fieldClass} gap-2.5`} onClick={onClick}>
      <GoogleIcon className="size-[18px]" />
      {t('login.google')}
    </Button>
  )
}

export function OrDivider() {
  const { t } = useTranslation('auth')
  return (
    <div className="flex items-center gap-3 text-[13px] text-muted-foreground">
      <div className="h-px grow bg-line" />
      {t('login.or')}
      <div className="h-px grow bg-line" />
    </div>
  )
}

type SubmitButtonProps = { pending: boolean; label: string; pendingLabel: string; disabled?: boolean }

export function SubmitButton({ pending, label, pendingLabel, disabled }: SubmitButtonProps) {
  return (
    <Button
      type="submit"
      variant="gradient"
      disabled={pending || disabled}
      aria-busy={pending}
      className="h-12 rounded-[14px] text-[15px] font-semibold"
    >
      {pending && <Loader2 className="animate-spin" />}
      {pending ? pendingLabel : label}
    </Button>
  )
}
