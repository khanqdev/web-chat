export const fieldClass = 'h-[46px] rounded-[14px] text-sm'

/** Thuộc tính aria cho input đi kèm FormField */
export function fieldAria(id: string, error?: string) {
  return {
    id,
    'aria-invalid': !!error,
    'aria-describedby': error ? `${id}-error` : undefined,
  }
}
