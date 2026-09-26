import { useState, type ComponentProps } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export function PasswordInput({ className, ...props }: Omit<ComponentProps<'input'>, 'type'>) {
  const { t } = useTranslation('auth')
  const [visible, setVisible] = useState(false)
  const label = visible ? t('login.hidePassword') : t('login.showPassword')

  return (
    <div className="relative">
      <Input type={visible ? 'text' : 'password'} className={cn('pr-12', className)} {...props} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={label}
        aria-pressed={visible}
        title={label}
        className="absolute inset-y-0 right-1.5 my-auto grid size-9 cursor-pointer place-items-center rounded-[10px] text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring"
      >
        {visible ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
      </button>
    </div>
  )
}
