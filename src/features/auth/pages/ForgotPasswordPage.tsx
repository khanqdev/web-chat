import { zodResolver } from '@hookform/resolvers/zod'
import { KeyRound } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate } from 'react-router'

import { Input } from '@/components/ui/input'
import { errorMessage } from '@/lib/errors'

import { useForgotPassword } from '../api'
import { AuthLayout } from '../components/AuthLayout'
import { AuthTitle, FormAlert, FormField, SubmitButton } from '../components/FormParts'
import { fieldAria, fieldClass } from '../components/form-utils'
import { AuthIcon } from '../components/OtpParts'
import { usePendingPasswordReset } from '../pending-password-reset'
import { forgotPasswordSchema, type ForgotPasswordInput } from '../schema'

/** Bước 1: nhập email để nhận mã đặt lại mật khẩu */
export function ForgotPasswordPage() {
  const { t } = useTranslation('auth')
  const navigate = useNavigate()
  const location = useLocation()
  const forgot = useForgotPassword()
  const pendingEmail = usePendingPasswordReset((s) => s.pending?.email)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    // Điền sẵn email từ trang đăng nhập hoặc lần yêu cầu trước
    defaultValues: { email: (location.state as { email?: string } | null)?.email ?? pendingEmail ?? '' },
  })

  const onSubmit = handleSubmit(({ email }) => {
    forgot.mutate(email, { onSuccess: () => void navigate('/forgot-password/reset') })
  })

  return (
    <AuthLayout>
      <AuthIcon>
        <KeyRound />
      </AuthIcon>
      <AuthTitle>{t('forgot.title')}</AuthTitle>
      <p className="-mt-1.5 text-sm text-muted-foreground">{t('forgot.subtitle')}</p>

      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-3.5">
        <FormField id="email" label={t('login.email')} error={errors.email?.message}>
          <Input
            type="email"
            autoComplete="email"
            autoFocus
            placeholder={t('login.emailPlaceholder')}
            className={fieldClass}
            {...fieldAria('email', errors.email?.message)}
            {...register('email')}
          />
        </FormField>

        <FormAlert>{forgot.isError ? errorMessage(forgot.error) : null}</FormAlert>

        <SubmitButton pending={forgot.isPending} label={t('forgot.submit')} pendingLabel={t('forgot.submitting')} />
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {t('forgot.remembered')}{' '}
        <Link to="/login" className="font-semibold text-accent-ink hover:underline">
          {t('register.signIn')}
        </Link>
      </p>
    </AuthLayout>
  )
}
