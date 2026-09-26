import { useSyncExternalStore } from 'react'

export type Theme = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'theme'
const media = window.matchMedia('(prefers-color-scheme: dark)')
const listeners = new Set<() => void>()

function readTheme(): Theme {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    if (value === 'light' || value === 'dark' || value === 'system') return value
  } catch {
    // localStorage bị chặn
  }
  return 'system'
}

let current: Theme = readTheme()

function apply() {
  const dark = current === 'dark' || (current === 'system' && media.matches)
  document.documentElement.classList.toggle('dark', dark)
  listeners.forEach((listener) => listener())
}

media.addEventListener('change', () => {
  if (current === 'system') apply()
})

export function setTheme(theme: Theme) {
  current = theme
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // bỏ qua
  }
  apply()
}

export function isDarkApplied() {
  return document.documentElement.classList.contains('dark')
}

/** Trả về true khi giao diện tối đang được áp dụng */
export function useIsDark() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    isDarkApplied,
  )
}
