import React, { SelectHTMLAttributes, forwardRef } from 'react';
import { LuChevronDown } from 'react-icons/lu';

export interface SelectOption {
    value: string | number;
    label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    helper?: string;
    error?: string;
    options?: SelectOption[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({
    label,
    helper,
    error,
    options,
    children,
    className = '',
    id,
    disabled,
    ...props
}, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
        <div className="w-full flex flex-col gap-1.5 text-left">
            {label && (
                <label 
                    htmlFor={selectId} 
                    className="text-xs font-semibold text-charcoal tracking-wide uppercase"
                >
                    {label} {props.required && <span className="text-red-500">*</span>}
                </label>
            )}
            <div className="relative flex items-center">
                <select
                    ref={ref}
                    id={selectId}
                    disabled={disabled}
                    className={`
                        w-full min-h-[40px] px-3.5 py-2 pr-10 text-sm text-charcoal bg-white 
                        border rounded-md shadow-xs transition-colors appearance-none cursor-pointer
                        focus:outline-none focus:ring-1 focus:ring-orange focus:border-orange
                        disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed
                        ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 hover:border-gray-400'}
                        ${className}
                    `}
                    {...props}
                >
                    {options 
                        ? options.map(opt => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))
                        : children
                    }
                </select>
                <div className="absolute right-3 pointer-events-none text-gray-500">
                    <LuChevronDown className="w-4 h-4" />
                </div>
            </div>
            {error ? (
                <p className="text-xs text-red-600 font-medium">{error}</p>
            ) : helper ? (
                <p className="text-xs text-gray-500">{helper}</p>
            ) : null}
        </div>
    );
});

Select.displayName = 'Select';

export default Select;
