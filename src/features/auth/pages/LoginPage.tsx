import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useSearchParams } from 'react-router'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { errorMessage } from '@/lib/errors'

import { useLogin } from '../api'
import { AuthLayout, BrandMark } from '../components/AuthLayout'
import { GoogleIcon } from '../components/GoogleIcon'
import { PasswordInput } from '../components/PasswordInput'
import { loginSchema, type LoginInput } from '../schema'

const fieldClass = 'h-[46px] rounded-[14px] text-sm'

export function LoginPage() {
  const { t } = useTranslation('auth')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const login = useLogin()
  const [googleError, setGoogleError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = handleSubmit((values) => {
    setGoogleError(null)
    login.mutate(values, {
      onSuccess: () => {
        // Chỉ nhận đường dẫn nội bộ để tránh open redirect
        const from = searchParams.get('from')
        const target = from?.startsWith('/') && !from.startsWith('//') ? from : '/'
        void navigate(target, { replace: true })
      },
    })
  })

  const onGoogle = () => {
    login.reset()
    // TODO(M1-08): tích hợp Google Identity Services, gửi idToken tới POST /auth/google
    if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) setGoogleError(t('googleNotConfigured'))
  }

  const formError = login.isError ? errorMessage(login.error) : googleError

  return (
    <AuthLayout>
      <BrandMark />
      <h1 className="mt-2 text-[26px] leading-tight font-bold tracking-[-0.01em]">{t('login.title')}</h1>

      <Button type="button" variant="outline" className={`${fieldClass} gap-2.5`} onClick={onGoogle}>
        <GoogleIcon className="size-[18px]" />
        {t('login.google')}
      </Button>

      <div className="flex items-center gap-3 text-[13px] text-muted-foreground">
        <div className="h-px grow bg-line" />
        {t('login.or')}
        <div className="h-px grow bg-line" />
      </div>

      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-3.5">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">{t('login.email')}</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder={t('login.emailPlaceholder')}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
            className={fieldClass}
            {...register('email')}
          />
          {errors.email?.message && (
            <p id="email-error" className="text-[13px] text-danger">
              {t(errors.email.message as 'validation.emailInvalid')}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">{t('login.password')}</Label>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            placeholder={t('login.passwordPlaceholder')}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'password-error' : undefined}
            className={fieldClass}
            {...register('password')}
          />
          {errors.password?.message && (
            <p id="password-error" className="text-[13px] text-danger">
              {t(errors.password.message as 'validation.passwordMin')}
            </p>
          )}
        </div>

        <div className="flex justify-end text-[13px]">
          <Link to="/forgot-password" className="text-accent-ink hover:underline">
            {t('login.forgotPassword')}
          </Link>
        </div>

        <div role="alert" aria-live="assertive" className="empty:hidden">
          {formError && (
            <div className="rounded-[14px] bg-danger-soft px-3.5 py-2.5 text-[13px] text-danger">{formError}</div>
          )}
        </div>

        <Button
          type="submit"
          variant="gradient"
          disabled={login.isPending}
          aria-busy={login.isPending}
          className="h-12 rounded-[14px] text-[15px] font-semibold"
        >
          {login.isPending && <Loader2 className="animate-spin" />}
          {login.isPending ? t('login.submitting') : t('login.submit')}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {t('login.noAccount')}{' '}
        <Link to="/register" className="font-semibold text-accent-ink hover:underline">
          {t('login.register')}
        </Link>
      </p>
    </AuthLayout>
  )
}
