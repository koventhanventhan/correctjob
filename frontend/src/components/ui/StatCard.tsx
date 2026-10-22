import React from 'react';

export interface StatCardProps {
    title: string;
    value: string | number;
    icon?: React.ReactNode;
    subtitle?: string;
    trend?: {
        value: string | number;
        isPositive?: boolean;
        label?: string;
    };
    variant?: 'default' | 'orange' | 'blue' | 'green' | 'amber';
    className?: string;
}

export function StatCard({
    title,
    value,
    icon,
    subtitle,
    trend,
    variant = 'default',
    className = '',
}: StatCardProps) {
    const iconStyles = {
        default: 'bg-gray-100 text-charcoal border-gray-200',
        orange: 'bg-orange/10 text-orange border-orange/20',
        blue: 'bg-blue-50 text-blue-600 border-blue-200',
        green: 'bg-emerald-50 text-emerald-600 border-emerald-200',
        amber: 'bg-amber-50 text-amber-600 border-amber-200',
    };

    return (
        <div className={`bg-white border border-gray-200 rounded-lg p-5 shadow-sm flex flex-col justify-between transition-all hover:border-gray-300 ${className}`}>
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                        {title}
                    </p>
                    <h4 className="text-2xl font-bold font-display text-charcoal tracking-tight">
                        {value}
                    </h4>
                </div>
                {icon && (
                    <div className={`w-11 h-11 rounded-md border flex items-center justify-center shrink-0 text-xl ${iconStyles[variant]}`}>
                        {icon}
                    </div>
                )}
            </div>

            {(subtitle || trend) && (
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                    {subtitle && <span>{subtitle}</span>}
                    {trend && (
                        <span className={`inline-flex items-center font-semibold ${trend.isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                            {trend.isPositive ? '+' : ''}{trend.value}
                            {trend.label && <span className="text-gray-400 font-normal ml-1">{trend.label}</span>}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}

export default StatCard;
