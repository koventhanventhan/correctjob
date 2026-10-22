import React from 'react';
import { LuChevronLeft, LuChevronRight } from 'react-icons/lu';

export interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    className?: string;
}

export function Pagination({
    currentPage,
    totalPages,
    onPageChange,
    className = '',
}: PaginationProps) {
    if (totalPages <= 1) return null;

    // Generate page numbers to show
    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const maxPagesToShow = 5;

        if (totalPages <= maxPagesToShow) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            pages.push(1);
            if (currentPage > 3) {
                pages.push('...');
            }

            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }

            if (currentPage < totalPages - 2) {
                pages.push('...');
            }
            pages.push(totalPages);
        }
        return pages;
    };

    return (
        <nav 
            className={`flex items-center justify-center gap-1.5 py-4 ${className}`}
            aria-label="Pagination"
        >
            <button
                type="button"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="min-h-[40px] min-w-[40px] px-3 py-2 flex items-center justify-center rounded-md border border-gray-300 bg-white text-sm font-medium text-charcoal hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                aria-label="Previous page"
            >
                <LuChevronLeft className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Prev</span>
            </button>

            {getPageNumbers().map((page, index) => {
                if (page === '...') {
                    return (
                        <span 
                            key={`ellipsis-${index}`}
                            className="min-h-[40px] min-w-[40px] flex items-center justify-center text-sm text-gray-400 select-none"
                        >
                            ...
                        </span>
                    );
                }

                const pageNum = Number(page);
                const isActive = pageNum === currentPage;

                return (
                    <button
                        key={pageNum}
                        type="button"
                        onClick={() => onPageChange(pageNum)}
                        aria-current={isActive ? 'page' : undefined}
                        className={`
                            min-h-[40px] min-w-[40px] px-3 py-2 flex items-center justify-center rounded-md text-sm font-semibold transition-colors cursor-pointer
                            ${isActive
                                ? 'bg-orange text-white border border-orange shadow-xs'
                                : 'bg-white text-charcoal border border-gray-300 hover:bg-gray-50'
                            }
                        `}
                    >
                        {pageNum}
                    </button>
                );
            })}

            <button
                type="button"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="min-h-[40px] min-w-[40px] px-3 py-2 flex items-center justify-center rounded-md border border-gray-300 bg-white text-sm font-medium text-charcoal hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                aria-label="Next page"
            >
                <span className="hidden sm:inline">Next</span>
                <LuChevronRight className="w-4 h-4 ml-1" />
            </button>
        </nav>
    );
}

export default Pagination;
