import type { ReactNode, Ref } from 'react'
import { REGEXP_ONLY_DIGITS } from 'input-otp'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { formatMmSs } from '@/hooks/use-countdown'

import { OTP_LENGTH } from '../schema'

type OtpCodeInputProps = {
  value: string
  onChange: (value: string) => void
  onComplete?: (value: string) => void
  inputRef?: Ref<HTMLInputElement>
  disabled?: boolean
  invalid?: boolean
  autoFocus?: boolean
  /** Số giây còn lại trước khi mã hết hạn */
  expiresIn: number
}

/** 6 ô nhập mã OTP (chỉ nhận số, dán được, tự điền từ SMS/email trên điện thoại) + dòng đếm ngược hết hạn */
export function OtpCodeInput({
  value,
  onChange,
  onComplete,
  inputRef,
  disabled,
  invalid,
  autoFocus,
  expiresIn,
}: OtpCodeInputProps) {
  const { t } = useTranslation('auth')
  const expired = expiresIn === 0

  return (
    <div className="flex flex-col items-center gap-2 py-1">
      <InputOTP
        ref={inputRef}
        autoFocus={autoFocus}
        maxLength={OTP_LENGTH}
        pattern={REGEXP_ONLY_DIGITS}
        inputMode="numeric"
        autoComplete="one-time-code"
        aria-label={t('verify.otpLabel')}
        value={value}
        onChange={onChange}
        onComplete={onComplete}
        disabled={disabled}
        containerClassName="justify-center"
      >
        <InputOTPGroup className="gap-1.5 sm:gap-2">
          {Array.from({ length: OTP_LENGTH }, (_, i) => (
            <InputOTPSlot key={i} index={i} aria-invalid={invalid} className="size-10 sm:size-12" />
          ))}
        </InputOTPGroup>
      </InputOTP>

      <p className={expired ? 'text-[13px] text-danger' : 'text-[13px] text-muted-foreground'}>
        {expired ? t('verify.expired') : t('verify.expiresIn', { time: formatMmSs(expiresIn) })}
      </p>
    </div>
  )
}

type ResendCodeProps = {
  /** Số giây còn phải chờ trước khi được gửi lại */
  resendIn: number
  pending: boolean
  onResend: () => void
}

export function ResendCode({ resendIn, pending, onResend }: ResendCodeProps) {
  const { t } = useTranslation('auth')
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-1 text-sm text-muted-foreground">
      {t('verify.notReceived')}
      {resendIn > 0 ? (
        <span className="tabular-nums">{t('verify.resendIn', { time: formatMmSs(resendIn) })}</span>
      ) : (
        <Button
          type="button"
          variant="link"
          className="h-auto p-0 text-sm font-semibold"
          disabled={pending}
          onClick={onResend}
        >
          {pending ? t('verify.resending') : t('verify.resend')}
        </Button>
      )}
    </div>
  )
}

/** Thông báo trạng thái (không phải lỗi), ví dụ "Đã gửi mã mới" */
export function StatusNote({ children }: { children?: string | null }) {
  return (
    <p role="status" className="text-center text-[13px] text-accent-ink empty:hidden">
      {children}
    </p>
  )
}

export function AuthIcon({ children }: { children: ReactNode }) {
  return (
    <div className="grid size-[42px] place-items-center rounded-[14px] bg-accent-gradient text-white [&_svg]:size-5">
      {children}
    </div>
  )
}
