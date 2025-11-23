import * as React from 'react'
import clsx from 'clsx'

type Variant = 'primary' | 'secondary' | 'outline' | 'danger' | 'pill'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  loading?: boolean
}

const base = 'inline-flex items-center justify-center font-semibold text-sm focus-visible:outline-none rounded-xl transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed'

const styles: Record<Variant, string> = {
  primary: 'bg-primary text-white hover:bg-primaryHover active:bg-primaryActive',
  secondary: 'bg-accentSunny text-neutral-900 hover:brightness-105 active:brightness-95',
  outline: 'border border-neutral-300 text-neutral-700 hover:bg-neutral-50',
  danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
  pill: 'rounded-full bg-accentMint text-white px-5 py-2 hover:brightness-110',
}

export function Button({ variant = 'primary', loading, className, children, ...rest }: ButtonProps) {
  return (
    <button
      className={clsx(base, styles[variant], 'px-4 py-2', className)}
      {...rest}
    >
      {loading ? '...' : children}
    </button>
  )
}

export default Button