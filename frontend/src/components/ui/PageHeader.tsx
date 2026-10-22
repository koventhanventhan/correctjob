import React from 'react';

export interface PageHeaderProps {
    title: React.ReactNode;
    subtitle?: React.ReactNode;
    badge?: React.ReactNode;
    breadcrumb?: React.ReactNode;
    actions?: React.ReactNode;
    className?: string;
}

export function PageHeader({
    title,
    subtitle,
    badge,
    breadcrumb,
    actions,
    className = '',
}: PageHeaderProps) {
    return (
        <div className={`mb-6 pb-4 border-b border-gray-200/80 ${className}`}>
            {breadcrumb && (
                <div className="mb-2 text-xs font-medium text-gray-500">
                    {breadcrumb}
                </div>
            )}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="text-2xl md:text-3xl font-bold font-display text-charcoal tracking-tight">
                            {title}
                        </h1>
                        {badge && <div>{badge}</div>}
                    </div>
                    {subtitle && (
                        <p className="text-sm text-gray-600 font-sans">
                            {subtitle}
                        </p>
                    )}
                </div>
                {actions && (
                    <div className="flex items-center gap-2.5 flex-wrap shrink-0">
                        {actions}
                    </div>
                )}
            </div>
        </div>
    );
}

export default PageHeader;
