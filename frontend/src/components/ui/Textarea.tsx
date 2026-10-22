import React, { TextareaHTMLAttributes, forwardRef } from 'react';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    helper?: string;
    error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
    label,
    helper,
    error,
    className = '',
    id,
    disabled,
    rows = 4,
    ...props
}, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
        <div className="w-full flex flex-col gap-1.5 text-left">
            {label && (
                <label 
                    htmlFor={textareaId} 
                    className="text-xs font-semibold text-charcoal tracking-wide uppercase"
                >
                    {label} {props.required && <span className="text-red-500">*</span>}
                </label>
            )}
            <textarea
                ref={ref}
                id={textareaId}
                rows={rows}
                disabled={disabled}
                className={`
                    w-full px-3.5 py-2.5 text-sm text-charcoal bg-white 
                    border rounded-md shadow-xs transition-colors
                    placeholder:text-gray-400
                    focus:outline-none focus:ring-1 focus:ring-orange focus:border-orange
                    disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed
                    ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 hover:border-gray-400'}
                    ${className}
                `}
                {...props}
            />
            {error ? (
                <p className="text-xs text-red-600 font-medium">{error}</p>
            ) : helper ? (
                <p className="text-xs text-gray-500">{helper}</p>
            ) : null}
        </div>
    );
});

Textarea.displayName = 'Textarea';

export default Textarea;
