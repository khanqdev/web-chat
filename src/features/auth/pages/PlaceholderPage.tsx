import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { AuthLayout, BrandMark } from '../components/AuthLayout'

/** Trang tạm cho /forgot-password, sẽ thay ở story M1-04 */
export function PlaceholderPage({ titleKey }: { titleKey: 'forgot.title' }) {
  const { t } = useTranslation(['auth', 'common'])
  return (
    <AuthLayout>
      <BrandMark />
      <h1 className="mt-2 text-[26px] leading-tight font-bold tracking-[-0.01em]">{t(titleKey)}</h1>
      <p className="text-muted-foreground">{t('common:comingSoon')}</p>
      <Link to="/login" className="text-sm font-semibold text-accent-ink hover:underline">
        {t('common:backToLogin')}
      </Link>
    </AuthLayout>
  )
}
