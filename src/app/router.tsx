import { createBrowserRouter, redirect, type LoaderFunctionArgs } from 'react-router'

import { LoginPage, PlaceholderPage } from '@/features/auth'
import { refreshSession } from '@/lib/http'
import { useSession } from '@/stores/session'

import { HomePage } from './HomePage'

// Chưa có phiên → thử /auth/refresh (cookie httpOnly), lỗi thì về /login
async function requireAuth({ request }: LoaderFunctionArgs) {
  if (useSession.getState().accessToken) return null
  try {
    await refreshSession()
    return null
  } catch {
    const { pathname, search } = new URL(request.url)
    const from = pathname === '/' ? '' : `?from=${encodeURIComponent(pathname + search)}`
    return redirect(`/login${from}`)
  }
}

function guestOnly() {
  return useSession.getState().accessToken ? redirect('/') : null
}

// Tạo router sau khi MSW khởi động: createBrowserRouter chạy loader ngay khi được tạo
export const createAppRouter = () =>
  createBrowserRouter([
    {
      loader: guestOnly,
      children: [
        { path: '/login', element: <LoginPage /> },
        { path: '/register', element: <PlaceholderPage titleKey="register.title" /> },
        { path: '/forgot-password', element: <PlaceholderPage titleKey="forgot.title" /> },
      ],
    },
    {
      loader: requireAuth,
      children: [{ path: '/', element: <HomePage /> }],
    },
    { path: '*', loader: () => redirect('/') },
  ])
