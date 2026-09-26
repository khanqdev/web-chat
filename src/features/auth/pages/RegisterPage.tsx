import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'

import { Input } from '@/components/ui/input'
import { errorMessage } from '@/lib/errors'
import { ApiError } from '@/lib/http'

import { useRegister } from '../api'
import { AuthLayout, BrandMark } from '../components/AuthLayout'
import { AuthTitle, FormAlert, FormField, OrDivider, SubmitButton } from '../components/FormParts'
import { fieldAria, fieldClass } from '../components/form-utils'
import { GoogleSignInButton } from '../components/GoogleSignInButton'
import { PasswordInput } from '../components/PasswordInput'
import { usePendingRegistration } from '../pending-registration'
import { registerSchema, type RegisterInput } from '../schema'
import { useGoogleAuth } from '../use-google-auth'

// Trường server báo lỗi trong VALIDATION_FAILED.details.fields → khoá bản dịch
const SERVER_FIELD_ERRORS: Partial<Record<keyof RegisterInput, string>> = {
  displayName: 'validation.displayNameLength',
  email: 'validation.emailInvalid',
  password: 'validation.passwordMin',
}

export function RegisterPage() {
  const { t, i18n } = useTranslation('auth')
  const navigate = useNavigate()
  const registerMutation = useRegister()
  const pendingEmail = usePendingRegistration((s) => s.pending?.email)

  const {
    register,
    handleSubmit,
    setError,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { displayName: '', email: pendingEmail ?? '', password: '', confirmPassword: '' },
  })

  // Tài khoản Google mới được tạo luôn ở /auth/google (isNewUser), không cần OTP
  const google = useGoogleAuth({ onLinkRequired: (email) => setValue('email', email) })

  const onSubmit = handleSubmit(({ displayName, email, password }) => {
    google.reset()
    registerMutation.mutate(
      { displayName, email, password, language: i18n.resolvedLanguage === 'en' ? 'en' : 'vi' },
      {
        onSuccess: () => void navigate('/register/verify'),
        onError: (error) => {
          if (!(error instanceof ApiError) || error.code !== 'VALIDATION_FAILED') return
          const fields = (error.details.fields ?? []) as string[]
          for (const field of fields) {
            const key = SERVER_FIELD_ERRORS[field as keyof RegisterInput]
            if (key) setError(field as keyof RegisterInput, { message: key })
          }
        },
      },
    )
  })

  const onGoogleCredential = (idToken: string) => {
    registerMutation.reset()
    google.signIn(idToken)
  }

  const apiError = registerMutation.error
  const emailTaken = apiError instanceof ApiError && apiError.code === 'EMAIL_TAKEN'
  // Lỗi từng trường đã hiện dưới input, không lặp lại ở vùng báo lỗi chung
  const showApiError = registerMutation.isError && !(apiError instanceof ApiError && apiError.code === 'VALIDATION_FAILED')

  return (
    <AuthLayout>
      <BrandMark />
      <AuthTitle>{t('register.title')}</AuthTitle>
      <p className="-mt-1.5 text-sm text-muted-foreground">{t('register.subtitle')}</p>

      <GoogleSignInButton
        onCredential={onGoogleCredential}
        onError={google.showError}
        disabled={google.isPending || registerMutation.isPending}
      />
      <OrDivider />

      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-3.5">
        <FormField id="displayName" label={t('register.displayName')} error={errors.displayName?.message}>
          <Input
            autoComplete="name"
            placeholder={t('register.displayNamePlaceholder')}
            className={fieldClass}
            {...fieldAria('displayName', errors.displayName?.message)}
            {...register('displayName')}
          />
        </FormField>

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
            autoComplete="new-password"
            placeholder={t('login.passwordPlaceholder')}
            className={fieldClass}
            {...fieldAria('password', errors.password?.message)}
            {...register('password')}
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

        <FormAlert>
          {showApiError ? (
            emailTaken ? (
              <>
                {t('register.emailTaken')}{' '}
                <Link
                  to="/login"
                  state={{ email: getValues('email') }}
                  className="font-semibold underline underline-offset-2"
                >
                  {t('register.goToLogin')}
                </Link>
              </>
            ) : (
              errorMessage(apiError)
            )
          ) : (
            google.error
          )}
        </FormAlert>

        <SubmitButton
          pending={registerMutation.isPending}
          label={t('register.submit')}
          pendingLabel={t('register.submitting')}
        />
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {t('register.haveAccount')}{' '}
        <Link to="/login" className="font-semibold text-accent-ink hover:underline">
          {t('register.signIn')}
        </Link>
      </p>
    </AuthLayout>
  )
}
