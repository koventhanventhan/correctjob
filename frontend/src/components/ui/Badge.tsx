import React, { HTMLAttributes } from 'react';

export type BadgeVariant = 'green' | 'amber' | 'red' | 'blue' | 'orange' | 'gray';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    variant?: BadgeVariant;
    size?: 'sm' | 'md';
    dot?: boolean;
}

export function Badge({
    children,
    variant = 'gray',
    size = 'md',
    dot = false,
    className = '',
    ...props
}: BadgeProps) {
    const variantStyles: Record<BadgeVariant, { bg: string; dot: string }> = {
        green: {
            bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            dot: 'bg-emerald-500'
        },
        amber: {
            bg: 'bg-amber-50 text-amber-700 border-amber-200',
            dot: 'bg-amber-500'
        },
        red: {
            bg: 'bg-red-50 text-red-700 border-red-200',
            dot: 'bg-red-500'
        },
        blue: {
            bg: 'bg-blue-50 text-blue-700 border-blue-200',
            dot: 'bg-blue-500'
        },
        orange: {
            bg: 'bg-orange/10 text-orange border-orange/20',
            dot: 'bg-orange'
        },
        gray: {
            bg: 'bg-gray-100 text-gray-700 border-gray-200',
            dot: 'bg-gray-400'
        }
    };

    const sizeStyles = {
        sm: 'text-[11px] px-2 py-0.5 gap-1',
        md: 'text-xs px-2.5 py-1 gap-1.5'
    };

    const currentVariant = variantStyles[variant] || variantStyles.gray;

    return (
        <span
            className={`
                inline-flex items-center font-medium rounded-full border
                ${currentVariant.bg}
                ${sizeStyles[size]}
                ${className}
            `}
            {...props}
        >
            {dot && <span className={`w-1.5 h-1.5 rounded-full ${currentVariant.dot} shrink-0`} />}
            {children}
        </span>
    );
}

export default Badge;
