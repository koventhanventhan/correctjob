import React from 'react';
import { LuFolderOpen } from 'react-icons/lu';

export interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: React.ReactNode;
    className?: string;
}

export function EmptyState({
    icon,
    title,
    description,
    action,
    className = '',
}: EmptyStateProps) {
    return (
        <div className={`text-center py-12 px-4 flex flex-col items-center justify-center ${className}`}>
            <div className="w-14 h-14 rounded-full bg-peach/40 text-orange flex items-center justify-center mb-4 text-2xl border border-peach">
                {icon || <LuFolderOpen className="w-7 h-7" />}
            </div>
            <h3 className="text-base sm:text-lg font-bold font-display text-charcoal mb-1.5">
                {title}
            </h3>
            {description && (
                <p className="text-xs sm:text-sm text-gray-500 max-w-sm mx-auto mb-5">
                    {description}
                </p>
            )}
            {action && (
                <div className="flex items-center justify-center gap-3">
                    {action}
                </div>
            )}
        </div>
    );
}

export default EmptyState;
