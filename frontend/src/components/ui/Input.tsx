import React, { InputHTMLAttributes, forwardRef } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    helper?: string;
    error?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
    label,
    helper,
    error,
    leftIcon,
    rightIcon,
    className = '',
    id,
    disabled,
    ...props
}, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
        <div className="w-full flex flex-col gap-1.5 text-left">
            {label && (
                <label 
                    htmlFor={inputId} 
                    className="text-xs font-semibold text-charcoal tracking-wide uppercase"
                >
                    {label} {props.required && <span className="text-red-500">*</span>}
                </label>
            )}
            <div className="relative flex items-center">
                {leftIcon && (
                    <div className="absolute left-3 pointer-events-none text-gray-400">
                        {leftIcon}
                    </div>
                )}
                <input
                    ref={ref}
                    id={inputId}
                    disabled={disabled}
                    className={`
                        w-full min-h-[40px] px-3.5 py-2 text-sm text-charcoal bg-white 
                        border rounded-md shadow-xs transition-colors
                        placeholder:text-gray-400
                        focus:outline-none focus:ring-1 focus:ring-orange focus:border-orange
                        disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed
                        ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 hover:border-gray-400'}
                        ${leftIcon ? 'pl-10' : ''}
                        ${rightIcon ? 'pr-10' : ''}
                        ${className}
                    `}
                    {...props}
                />
                {rightIcon && (
                    <div className="absolute right-3 pointer-events-none text-gray-400">
                        {rightIcon}
                    </div>
                )}
            </div>
            {error ? (
                <p className="text-xs text-red-600 font-medium">{error}</p>
            ) : helper ? (
                <p className="text-xs text-gray-500">{helper}</p>
            ) : null}
        </div>
    );
});

Input.displayName = 'Input';

export default Input;
