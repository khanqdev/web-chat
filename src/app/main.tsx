import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router/dom'

import '@/styles/globals.css'
import '@/lib/i18n'

import { Providers } from './providers'
import { createAppRouter } from './router'

async function enableMocks() {
  if (import.meta.env.VITE_USE_MOCKS !== 'true') return
  try {
    const { worker } = await import('@/mocks/browser')
    await worker.start({ onUnhandledRequest: 'bypass' })
  } catch (error) {
    // Không đăng ký được service worker (trình duyệt chặn, chế độ riêng tư…): vẫn render app, gọi API thật
    console.warn('[MSW] Không bật được mock API, dùng backend thật.', error)
  }
}

void enableMocks().then(() => {
  const router = createAppRouter()
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <Providers>
        <RouterProvider router={router} />
      </Providers>
    </StrictMode>,
  )
})
