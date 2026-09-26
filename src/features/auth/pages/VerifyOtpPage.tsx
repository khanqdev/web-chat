import { useRef, useState } from 'react'
import { REGEXP_ONLY_DIGITS } from 'input-otp'
import { MailCheck } from 'lucide-react'
import { Trans, useTranslation } from 'react-i18next'
import { Link, Navigate, useNavigate } from 'react-router'

import { Button } from '@/components/ui/button'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { formatMmSs, useCountdown } from '@/hooks/use-countdown'
import { errorMessage } from '@/lib/errors'
import { ApiError } from '@/lib/http'

import { useResendOtp, useVerifyOtp } from '../api'
import { AuthLayout } from '../components/AuthLayout'
import { AuthTitle, FormAlert, SubmitButton } from '../components/FormParts'
import { usePendingRegistration } from '../pending-registration'
import { OTP_LENGTH } from '../schema'

export function VerifyOtpPage() {
  const { t } = useTranslation('auth')
  const navigate = useNavigate()
  const pending = usePendingRegistration((s) => s.pending)
  const verify = useVerifyOtp()
  const resend = useResendOtp()
  const [otp, setOtp] = useState('')
  const [resent, setResent] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const expiresIn = useCountdown(pending?.otpExpiresAt)
  const resendIn = useCountdown(pending?.resendAvailableAt)

  // Vào thẳng trang này mà chưa đăng ký → quay lại form đăng ký
  if (!pending) return <Navigate to="/register" replace />

  const locked = verify.error instanceof ApiError && verify.error.code === 'OTP_LOCKED'
  const expired = expiresIn === 0

  const submit = (code: string) => {
    if (code.length !== OTP_LENGTH || verify.isPending || locked) return
    setResent(false)
    verify.mutate(
      { email: pending.email, otp: code },
      {
        onSuccess: () => void navigate('/', { replace: true }),
        onError: () => {
          // Xoá mã sai để nhập lại ngay
          setOtp('')
          inputRef.current?.focus()
        },
      },
    )
  }

  const onResend = () => {
    verify.reset()
    setResent(false)
    resend.mutate(pending.email, {
      onSuccess: () => {
        setOtp('')
        setResent(true)
        inputRef.current?.focus()
      },
    })
  }

  const formError = verify.isError ? errorMessage(verify.error) : resend.isError ? errorMessage(resend.error) : null

  return (
    <AuthLayout>
      <div className="grid size-[42px] place-items-center rounded-[14px] bg-accent-gradient text-white">
        <MailCheck className="size-5" />
      </div>
      <AuthTitle>{t('verify.title')}</AuthTitle>
      <p className="-mt-1.5 text-sm text-muted-foreground">
        <Trans
          t={t}
          i18nKey="verify.description"
          values={{ email: pending.email, length: OTP_LENGTH }}
          components={{ b: <strong className="font-semibold [overflow-wrap:anywhere] text-foreground" /> }}
        />{' '}
        <Link to="/register" className="font-medium text-accent-ink hover:underline">
          {t('verify.changeEmail')}
        </Link>
      </p>

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          submit(otp)
        }}
        className="flex flex-col gap-3.5"
      >
        <div className="flex flex-col items-center gap-2 py-1">
          <InputOTP
            ref={inputRef}
            autoFocus
            maxLength={OTP_LENGTH}
            pattern={REGEXP_ONLY_DIGITS}
            inputMode="numeric"
            autoComplete="one-time-code"
            aria-label={t('verify.otpLabel')}
            value={otp}
            onChange={(value) => {
              setOtp(value)
              if (verify.isError && !locked) verify.reset()
            }}
            onComplete={submit}
            disabled={verify.isPending || locked}
            containerClassName="justify-center"
          >
            <InputOTPGroup className="gap-1.5 sm:gap-2">
              {Array.from({ length: OTP_LENGTH }, (_, i) => (
                <InputOTPSlot key={i} index={i} aria-invalid={verify.isError} className="size-10 sm:size-12" />
              ))}
            </InputOTPGroup>
          </InputOTP>

          <p className={expired ? 'text-[13px] text-danger' : 'text-[13px] text-muted-foreground'}>
            {expired ? t('verify.expired') : t('verify.expiresIn', { time: formatMmSs(expiresIn) })}
          </p>
        </div>

        <FormAlert>{formError}</FormAlert>
        <p role="status" className="text-center text-[13px] text-accent-ink empty:hidden">
          {resent ? t('verify.resent') : null}
        </p>

        <SubmitButton
          pending={verify.isPending}
          disabled={locked || otp.length !== OTP_LENGTH}
          label={t('verify.submit')}
          pendingLabel={t('verify.submitting')}
        />
      </form>

      <div className="flex flex-wrap items-center justify-center gap-x-1 text-sm text-muted-foreground">
        {t('verify.notReceived')}
        {resendIn > 0 ? (
          <span className="tabular-nums">{t('verify.resendIn', { time: formatMmSs(resendIn) })}</span>
        ) : (
          <Button
            type="button"
            variant="link"
            className="h-auto p-0 text-sm font-semibold"
            disabled={resend.isPending}
            onClick={onResend}
          >
            {resend.isPending ? t('verify.resending') : t('verify.resend')}
          </Button>
        )}
      </div>
    </AuthLayout>
  )
}
