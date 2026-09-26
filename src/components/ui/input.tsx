import * as React from 'react'

import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'h-9 w-full min-w-0 rounded-lg border border-line bg-field px-3.5 text-sm text-foreground transition-[color,box-shadow] outline-none placeholder:text-muted-foreground/80 disabled:cursor-not-allowed disabled:opacity-60',
        'focus-visible:border-primary/60 focus-visible:ring-[3px] focus-visible:ring-ring',
        'aria-invalid:border-danger aria-invalid:ring-danger/20',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
