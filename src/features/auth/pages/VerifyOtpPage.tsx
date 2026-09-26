import { useRef, useState } from 'react'
import { MailCheck } from 'lucide-react'
import { Trans, useTranslation } from 'react-i18next'
import { Link, Navigate, useNavigate } from 'react-router'

import { useCountdown } from '@/hooks/use-countdown'
import { errorMessage } from '@/lib/errors'
import { ApiError } from '@/lib/http'

import { useResendOtp, useVerifyOtp } from '../api'
import { AuthLayout } from '../components/AuthLayout'
import { AuthTitle, FormAlert, SubmitButton } from '../components/FormParts'
import { AuthIcon, OtpCodeInput, ResendCode, StatusNote } from '../components/OtpParts'
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
      <AuthIcon>
        <MailCheck />
      </AuthIcon>
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
        <OtpCodeInput
          inputRef={inputRef}
          autoFocus
          value={otp}
          onChange={(value) => {
            setOtp(value)
            if (verify.isError && !locked) verify.reset()
          }}
          onComplete={submit}
          disabled={verify.isPending || locked}
          invalid={verify.isError}
          expiresIn={expiresIn}
        />

        <FormAlert>{formError}</FormAlert>
        <StatusNote>{resent ? t('verify.resent') : null}</StatusNote>

        <SubmitButton
          pending={verify.isPending}
          disabled={locked || otp.length !== OTP_LENGTH}
          label={t('verify.submit')}
          pendingLabel={t('verify.submitting')}
        />
      </form>

      <ResendCode resendIn={resendIn} pending={resend.isPending} onResend={onResend} />
    </AuthLayout>
  )
}
