import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { AuroraBackground } from '@/components/common/AuroraBackground'
import { GlassPanel } from '@/components/common/GlassPanel'
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher'
import { ThemeToggle } from '@/components/common/ThemeToggle'

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-20">
      <AuroraBackground />
      <div className="absolute top-4 right-4 flex gap-2 sm:top-6 sm:right-6">
        <ThemeToggle />
        <LanguageSwitcher />
      </div>
      <GlassPanel className="relative flex w-full max-w-[420px] flex-col gap-3.5 px-6 py-8 sm:px-10 sm:py-9">
        {children}
      </GlassPanel>
    </div>
  )
}

export function BrandMark() {
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid size-[42px] place-items-center rounded-[14px] bg-accent-gradient text-lg font-bold text-white">
        W
      </div>
      <span className="text-base font-semibold">{t('appName')}</span>
    </div>
  )
}
