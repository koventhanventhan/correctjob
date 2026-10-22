import React from 'react';
import { LuInfo, LuCircleCheck, LuCircleAlert, LuCircleX, LuX } from 'react-icons/lu';

export type AlertVariant = 'info' | 'success' | 'warning' | 'error';

export interface AlertProps {
    variant?: AlertVariant;
    title?: string;
    children: React.ReactNode;
    onClose?: () => void;
    className?: string;
}

export function Alert({
    variant = 'info',
    title,
    children,
    onClose,
    className = '',
}: AlertProps) {
    const config = {
        info: {
            bg: 'bg-blue-50 border-blue-200 text-blue-900',
            icon: <LuInfo className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />,
            closeColor: 'text-blue-500 hover:text-blue-700 hover:bg-blue-100',
        },
        success: {
            bg: 'bg-emerald-50 border-emerald-200 text-emerald-900',
            icon: <LuCircleCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />,
            closeColor: 'text-emerald-500 hover:text-emerald-700 hover:bg-emerald-100',
        },
        warning: {
            bg: 'bg-amber-50 border-amber-200 text-amber-900',
            icon: <LuCircleAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />,
            closeColor: 'text-amber-500 hover:text-amber-700 hover:bg-amber-100',
        },
        error: {
            bg: 'bg-red-50 border-red-200 text-red-900',
            icon: <LuCircleX className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />,
            closeColor: 'text-red-500 hover:text-red-700 hover:bg-red-100',
        },
    };

    const current = config[variant];

    return (
        <div className={`border rounded-md p-4 flex items-start gap-3 text-sm shadow-xs ${current.bg} ${className}`} role="alert">
            {current.icon}
            <div className="flex-1 min-w-0">
                {title && <p className="font-bold text-sm mb-0.5 leading-snug">{title}</p>}
                <div className="text-xs sm:text-sm leading-relaxed">{children}</div>
            </div>
            {onClose && (
                <button
                    type="button"
                    onClick={onClose}
                    className={`p-1 rounded-md transition-colors cursor-pointer shrink-0 min-h-[32px] min-w-[32px] flex items-center justify-center ${current.closeColor}`}
                    aria-label="Dismiss alert"
                >
                    <LuX className="w-4 h-4" />
                </button>
            )}
        </div>
    );
}

export default Alert;
