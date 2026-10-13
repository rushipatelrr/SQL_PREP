import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

export type ButtonVariant = 'primary' | 'ghost' | 'purple';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  // bg-amber text on dark ink — matches .btn-run/.btn-primary in the original CSS.
  primary: 'bg-amber text-[#1a1305]',
  ghost: 'bg-transparent border border-line text-text-dim hover:text-text hover:border-text-dim',
  purple: 'bg-purple text-[#160f36]',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', disabled, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled}
      className={cn(
        'rounded-[7px] px-4 py-2 text-[13.5px] font-semibold transition-transform duration-75',
        'active:scale-[.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan focus-visible:outline-offset-2',
        disabled && 'cursor-not-allowed opacity-40',
        VARIANT_CLASSES[variant],
        className
      )}
      {...props}
    />
  );
});
