import cn from 'classnames';
import React, { ButtonHTMLAttributes } from 'react';
import { twMerge } from 'tailwind-merge';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  variant?: 'normal' | 'outline' | 'custom';
  size?: 'big' | 'medium' | 'small';
  active?: boolean;
  loading?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
}

const classes = {
  root: 'inline-flex items-center justify-center flex-shrink-0 font-semibold leading-none rounded-xl outline-none transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-accent-400/40 focus:ring-offset-2',
  normal:
    'bg-accent text-white border border-transparent shadow-soft hover:bg-accent-hover hover:shadow-card active:scale-[0.98]',
  custom: 'border border-transparent',
  outline:
    'border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50 hover:border-gray-400 hover:text-accent',
  loading:
    'h-4 w-4 ms-2 rounded-full border-2 border-transparent border-t-2 animate-spin',
  disabled:
    'border border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed shadow-none',
  disabledOutline: 'border border-gray-200 text-gray-400 cursor-not-allowed',
  small: 'px-3.5 py-0 h-9 text-sm',
  medium: 'px-5 py-0 h-11',
  big: 'px-8 py-0 h-12',
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (props, ref) => {
    const {
      className,
      variant = 'normal',
      size = 'medium',
      active,
      children,
      loading = false,
      disabled = false,
      ...rest
    } = props;
    const classesName = cn(
      classes.root,
      {
        [classes.normal]: !disabled && variant === 'normal',
        [classes.disabled]: disabled && variant === 'normal',
        [classes.outline]: !disabled && variant === 'outline',
        [classes.disabledOutline]: disabled && variant === 'outline',
        [classes.small]: size === 'small',
        [classes.medium]: size === 'medium',
        [classes.big]: size === 'big',
      },
      className,
    );

    return (
      <button
        aria-pressed={active}
        data-variant={variant}
        ref={ref}
        className={twMerge(classesName)}
        disabled={disabled}
        {...rest}
      >
        {children}
        {loading && (
          <span
            className={classes.loading}
            style={{
              borderTopColor:
                variant === 'outline' ? 'currentColor' : '#ffffff',
            }}
          />
        )}
      </button>
    );
  },
);

Button.displayName = 'Button';

export default Button;
