import React, { HTMLAttributes } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
    hoverable?: boolean;
}

export function Card({
    children,
    hoverable = false,
    className = '',
    ...props
}: CardProps) {
    return (
        <div
            className={`
                bg-white border border-gray-200 rounded-lg shadow-sm
                ${hoverable ? 'hover:border-gray-300 hover:shadow-md transition-all' : ''}
                ${className}
            `}
            {...props}
        >
            {children}
        </div>
    );
}

export function CardHeader({
    children,
    className = '',
    ...props
}: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={`px-6 py-4 border-b border-gray-100 flex flex-col gap-1 ${className}`}
            {...props}
        >
            {children}
        </div>
    );
}

export function CardTitle({
    children,
    className = '',
    ...props
}: HTMLAttributes<HTMLHeadingElement>) {
    return (
        <h3
            className={`text-lg font-semibold text-charcoal tracking-tight ${className}`}
            {...props}
        >
            {children}
        </h3>
    );
}

export function CardDescription({
    children,
    className = '',
    ...props
}: HTMLAttributes<HTMLParagraphElement>) {
    return (
        <p className={`text-sm text-gray-500 ${className}`} {...props}>
            {children}
        </p>
    );
}

export function CardContent({
    children,
    className = '',
    ...props
}: HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={`p-6 ${className}`} {...props}>
            {children}
        </div>
    );
}

export function CardFooter({
    children,
    className = '',
    ...props
}: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={`px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-lg flex items-center justify-between gap-3 ${className}`}
            {...props}
        >
            {children}
        </div>
    );
}

export default Card;
