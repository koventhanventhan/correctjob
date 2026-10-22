'use client';
import React, { useEffect, useRef } from 'react';
import { LuX } from 'react-icons/lu';

export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: React.ReactNode;
    description?: React.ReactNode;
    children: React.ReactNode;
    footer?: React.ReactNode;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export function Modal({
    isOpen,
    onClose,
    title,
    description,
    children,
    footer,
    maxWidth = 'md',
}: ModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const maxWidthClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
    };

    return (
        <div 
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
            role="dialog"
            aria-modal="true"
        >
            <div
                ref={modalRef}
                className={`
                    bg-white rounded-lg shadow-lg border border-gray-200 w-full my-8
                    max-h-[90vh] flex flex-col overflow-hidden text-left
                    ${maxWidthClasses[maxWidth]}
                `}
            >
                {/* Modal Header */}
                {(title || description) && (
                    <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between gap-4">
                        <div className="flex-1">
                            {title && (
                                <h3 className="text-lg font-bold font-display text-charcoal">
                                    {title}
                                </h3>
                            )}
                            {description && (
                                <p className="text-xs text-gray-500 mt-1">
                                    {description}
                                </p>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-gray-400 hover:text-charcoal p-1.5 rounded-md hover:bg-gray-100 transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                            aria-label="Close modal"
                        >
                            <LuX className="w-5 h-5" />
                        </button>
                    </div>
                )}

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto flex-1">
                    {children}
                </div>

                {/* Modal Footer */}
                {footer && (
                    <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/70 flex items-center justify-end gap-3">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Modal;
