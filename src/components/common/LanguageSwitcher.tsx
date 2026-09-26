import { useTranslation } from 'react-i18next'

import { LANGUAGES } from '@/lib/i18n'
import { cn } from '@/lib/utils'

export function LanguageSwitcher({ className }: { className?: string }) {
  const { t, i18n } = useTranslation()

  return (
    <div
      role="group"
      aria-label={t('language')}
      className={cn('glass flex gap-1 rounded-[14px] p-1 shadow-none', className)}
    >
      {LANGUAGES.map((lng) => {
        const active = i18n.resolvedLanguage === lng
        return (
          <button
            key={lng}
            type="button"
            aria-pressed={active}
            onClick={() => void i18n.changeLanguage(lng)}
            className={cn(
              'h-8 cursor-pointer rounded-[10px] px-3 text-[13px] uppercase transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring',
              active ? 'bg-glass-strong font-semibold' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {lng}
          </button>
        )
      })}
    </div>
  )
}
