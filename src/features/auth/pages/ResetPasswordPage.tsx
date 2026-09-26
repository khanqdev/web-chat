import { useEffect, useRef, useState, type FormEvent } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { KeyRound } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Trans, useTranslation } from 'react-i18next'
import { Link, Navigate, useNavigate } from 'react-router'

import { useCountdown } from '@/hooks/use-countdown'
import { errorMessage } from '@/lib/errors'
import { ApiError } from '@/lib/http'

import { useForgotPassword, useResetPassword } from '../api'
import { AuthLayout } from '../components/AuthLayout'
import { AuthTitle, FormAlert, FormField, SubmitButton } from '../components/FormParts'
import { fieldAria, fieldClass } from '../components/form-utils'
import { AuthIcon, OtpCodeInput, ResendCode, StatusNote } from '../components/OtpParts'
import { PasswordInput } from '../components/PasswordInput'
import { usePendingPasswordReset } from '../pending-password-reset'
import { OTP_LENGTH, resetPasswordSchema, type ResetPasswordInput } from '../schema'

const OTP_ERRORS = ['OTP_INVALID', 'OTP_EXPIRED', 'OTP_LOCKED']

/** Bước 2: nhập mã OTP trong email + mật khẩu mới */
export function ResetPasswordPage() {
  const { t } = useTranslation('auth')
  const navigate = useNavigate()
  const pending = usePendingPasswordReset((s) => s.pending)
  const reset = useResetPassword()
  const resend = useForgotPassword()
  const [otp, setOtp] = useState('')
  const [otpMissing, setOtpMissing] = useState(false)
  const [resent, setResent] = useState(false)
  const otpRef = useRef<HTMLInputElement>(null)
  // Tăng lên khi cần focus lại ô OTP; focus trong effect vì lúc onError ô còn bị disable
  const [refocusOtp, setRefocusOtp] = useState(0)
  useEffect(() => {
    if (refocusOtp) otpRef.current?.focus()
  }, [refocusOtp])

  const expiresIn = useCountdown(pending?.otpExpiresAt)
  const resendIn = useCountdown(pending?.resendAvailableAt)

  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  })

  // Vào thẳng trang này mà chưa yêu cầu mã → quay lại bước nhập email
  if (!pending) return <Navigate to="/forgot-password" replace />

  const apiError = reset.error instanceof ApiError ? reset.error : null
  const locked = apiError?.code === 'OTP_LOCKED'
  const otpError = !!apiError && OTP_ERRORS.includes(apiError.code)

  const submitValues = ({ newPassword }: ResetPasswordInput) => {
    if (otp.length !== OTP_LENGTH) {
      setOtpMissing(true)
      otpRef.current?.focus()
      return
    }
    setResent(false)
    reset.mutate(
      { email: pending.email, otp, newPassword },
      {
        onSuccess: () =>
          void navigate('/login', { replace: true, state: { email: pending.email, notice: 'passwordReset' } }),
        onError: (error) => {
          if (!(error instanceof ApiError)) return
          if (OTP_ERRORS.includes(error.code)) {
            // Xoá mã sai để nhập lại ngay, giữ nguyên mật khẩu mới đã nhập
            setOtp('')
            setRefocusOtp((n) => n + 1)
          } else if (error.code === 'VALIDATION_FAILED') {
            setError('newPassword', { message: 'validation.passwordMin' })
          }
        },
      },
    )
  }

  // Gọi handleSubmit trong event handler (không gọi lúc render) vì callback có dùng ref
  const onSubmit = (e: FormEvent<HTMLFormElement>) => void handleSubmit(submitValues)(e)

  const onResend = () => {
    reset.reset()
    setResent(false)
    resend.mutate(pending.email, {
      onSuccess: () => {
        setOtp('')
        setResent(true)
        otpRef.current?.focus()
      },
    })
  }

  const formError = otpMissing
    ? t('forgot.otpRequired')
    : reset.isError && apiError?.code !== 'VALIDATION_FAILED'
      ? errorMessage(reset.error)
      : resend.isError
        ? errorMessage(resend.error)
        : null

  return (
    <AuthLayout>
      <AuthIcon>
        <KeyRound />
      </AuthIcon>
      <AuthTitle>{t('reset.title')}</AuthTitle>
      <p className="-mt-1.5 text-sm text-muted-foreground">
        <Trans
          t={t}
          i18nKey="verify.description"
          values={{ email: pending.email, length: OTP_LENGTH }}
          components={{ b: <strong className="font-semibold [overflow-wrap:anywhere] text-foreground" /> }}
        />{' '}
        <Link to="/forgot-password" className="font-medium text-accent-ink hover:underline">
          {t('verify.changeEmail')}
        </Link>
      </p>

      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-3.5">
        <OtpCodeInput
          inputRef={otpRef}
          autoFocus
          value={otp}
          onChange={(value) => {
            setOtp(value)
            setOtpMissing(false)
            if (otpError && !locked) reset.reset()
          }}
          // Nhập đủ mã thì chuyển sang ô mật khẩu mới
          onComplete={() => setFocus('newPassword')}
          disabled={reset.isPending || locked}
          invalid={otpError || otpMissing}
          expiresIn={expiresIn}
        />

        <FormField id="newPassword" label={t('reset.newPassword')} error={errors.newPassword?.message}>
          <PasswordInput
            autoComplete="new-password"
            placeholder={t('login.passwordPlaceholder')}
            className={fieldClass}
            {...fieldAria('newPassword', errors.newPassword?.message)}
            {...register('newPassword')}
          />
        </FormField>

        <FormField id="confirmPassword" label={t('register.confirmPassword')} error={errors.confirmPassword?.message}>
          <PasswordInput
            autoComplete="new-password"
            placeholder={t('register.confirmPasswordPlaceholder')}
            className={fieldClass}
            {...fieldAria('confirmPassword', errors.confirmPassword?.message)}
            {...register('confirmPassword')}
          />
        </FormField>

        <FormAlert>{formError}</FormAlert>
        <StatusNote>{resent ? t('verify.resent') : null}</StatusNote>

        <SubmitButton
          pending={reset.isPending}
          disabled={locked}
          label={t('reset.submit')}
          pendingLabel={t('reset.submitting')}
        />
      </form>

      <ResendCode resendIn={resendIn} pending={resend.isPending} onResend={onResend} />
    </AuthLayout>
  )
}
