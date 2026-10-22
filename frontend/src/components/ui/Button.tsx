import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { LuLoader } from 'react-icons/lu';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
    children,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon,
    rightIcon,
    className = '',
    disabled,
    type = 'button',
    ...props
}, ref) => {
    const baseStyles = "inline-flex items-center justify-center font-semibold rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer";

    const variantStyles = {
        primary: "bg-orange hover:bg-orange/90 text-white shadow-xs active:bg-orange/95",
        secondary: "bg-white hover:bg-gray-50 text-charcoal border border-gray-300 shadow-xs",
        outline: "bg-transparent hover:bg-orange/10 text-orange border border-orange",
        danger: "bg-red-600 hover:bg-red-700 text-white shadow-xs",
        ghost: "bg-transparent hover:bg-gray-100 text-gray-700 hover:text-charcoal",
    };

    const sizeStyles = {
        sm: "min-h-[36px] text-xs px-3 py-1.5 gap-1.5",
        md: "min-h-[40px] text-sm px-4 py-2 gap-2",
        lg: "min-h-[46px] text-base px-6 py-2.5 gap-2.5",
    };

    return (
        <button
            ref={ref}
            type={type}
            disabled={disabled || isLoading}
            className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
            {...props}
        >
            {isLoading ? (
                <>
                    <LuLoader className="w-4 h-4 animate-spin shrink-0" />
                    <span>{children}</span>
                </>
            ) : (
                <>
                    {leftIcon && <span className="shrink-0">{leftIcon}</span>}
                    {children}
                    {rightIcon && <span className="shrink-0">{rightIcon}</span>}
                </>
            )}
        </button>
    );
});

Button.displayName = 'Button';

export default Button;
