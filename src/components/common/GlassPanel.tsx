import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

/** Khung nền kính (liquid glass). Chỉ dùng cho khung lớn, không dùng cho từng bubble tin nhắn. */
export function GlassPanel({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('glass rounded-[28px]', className)} {...props} />
}
