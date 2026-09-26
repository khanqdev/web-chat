import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router'

import { Input } from '@/components/ui/input'
import { errorMessage } from '@/lib/errors'

import { useLogin } from '../api'
import { AuthLayout, BrandMark } from '../components/AuthLayout'
import { AuthTitle, FormAlert, FormField, GoogleButton, OrDivider, SubmitButton } from '../components/FormParts'
import { fieldAria, fieldClass } from '../components/form-utils'
import { PasswordInput } from '../components/PasswordInput'
import { loginSchema, type LoginInput } from '../schema'
import { useGoogleSignIn } from '../use-google-sign-in'

export function LoginPage() {
  const { t } = useTranslation('auth')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const login = useLogin()
  const google = useGoogleSignIn()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    // Điền sẵn email khi chuyển từ trang đăng ký (email đã tồn tại); dùng state để email không nằm trên URL
    defaultValues: { email: (location.state as { email?: string } | null)?.email ?? '', password: '' },
  })

  const onSubmit = handleSubmit((values) => {
    google.reset()
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
    google.start()
  }

  const formError = login.isError ? errorMessage(login.error) : google.error

  return (
    <AuthLayout>
      <BrandMark />
      <AuthTitle>{t('login.title')}</AuthTitle>

      <GoogleButton onClick={onGoogle} />
      <OrDivider />

      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-3.5">
        <FormField id="email" label={t('login.email')} error={errors.email?.message}>
          <Input
            type="email"
            autoComplete="email"
            placeholder={t('login.emailPlaceholder')}
            className={fieldClass}
            {...fieldAria('email', errors.email?.message)}
            {...register('email')}
          />
        </FormField>

        <FormField id="password" label={t('login.password')} error={errors.password?.message}>
          <PasswordInput
            autoComplete="current-password"
            placeholder={t('login.passwordPlaceholder')}
            className={fieldClass}
            {...fieldAria('password', errors.password?.message)}
            {...register('password')}
          />
        </FormField>

        <div className="flex justify-end text-[13px]">
          <Link to="/forgot-password" className="text-accent-ink hover:underline">
            {t('login.forgotPassword')}
          </Link>
        </div>

        <FormAlert>{formError}</FormAlert>

        <SubmitButton pending={login.isPending} label={t('login.submit')} pendingLabel={t('login.submitting')} />
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
