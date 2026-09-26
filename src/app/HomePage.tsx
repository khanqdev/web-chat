import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

import { AuroraBackground } from '@/components/common/AuroraBackground'
import { GlassPanel } from '@/components/common/GlassPanel'
import { Button } from '@/components/ui/button'
import { useLogout } from '@/features/auth'
import { useSession } from '@/stores/session'

/** Màn tạm sau khi đăng nhập; sẽ thay bằng AppShell 3 cột */
export function HomePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const user = useSession((s) => s.user)
  const logout = useLogout()

  return (
    <div className="relative flex min-h-dvh items-center justify-center px-4">
      <AuroraBackground />
      <GlassPanel className="relative flex w-full max-w-[420px] flex-col gap-3 p-8">
        <h1 className="text-2xl font-bold">{t('home.title', { name: user?.displayName ?? '' })}</h1>
        <p className="text-muted-foreground">{t('home.description')}</p>
        <Button
          variant="outline"
          className="h-11 rounded-[14px]"
          disabled={logout.isPending}
          onClick={() => logout.mutate(undefined, { onSettled: () => void navigate('/login', { replace: true }) })}
        >
          {t('home.logout')}
        </Button>
      </GlassPanel>
    </div>
  )
}
