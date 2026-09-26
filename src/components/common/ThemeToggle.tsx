import { Moon, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { setTheme, useIsDark } from '@/lib/theme'
import { cn } from '@/lib/utils'

export function ThemeToggle({ className }: { className?: string }) {
  const { t } = useTranslation()
  const dark = useIsDark()

  return (
    <button
      type="button"
      aria-label={t('theme.toggle')}
      title={t('theme.toggle')}
      onClick={() => setTheme(dark ? 'light' : 'dark')}
      className={cn(
        'glass grid size-10 cursor-pointer place-items-center rounded-[14px] text-muted-foreground shadow-none transition-colors outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring',
        className,
      )}
    >
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  )
}
