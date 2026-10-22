import React from 'react';

export interface Column<T> {
    header: string;
    accessorKey?: keyof T;
    render?: (row: T, index: number) => React.ReactNode;
    className?: string;
    hideOnMobile?: boolean;
}

export interface ResponsiveTableProps<T> {
    columns: Column<T>[];
    data: T[];
    keyExtractor: (row: T, index: number) => string | number;
    emptyMessage?: string;
    className?: string;
    onRowClick?: (row: T) => void;
}

export function ResponsiveTable<T>({
    columns,
    data,
    keyExtractor,
    emptyMessage = 'No records found.',
    className = '',
    onRowClick,
}: ResponsiveTableProps<T>) {
    if (!data || data.length === 0) {
        return (
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-sm text-gray-500 shadow-sm">
                {emptyMessage}
            </div>
        );
    }

    return (
        <div className={`bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden ${className}`}>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                    <thead className="bg-gray-50/80">
                        <tr>
                            {columns.map((col, idx) => (
                                <th
                                    key={idx}
                                    scope="col"
                                    className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 ${col.className || ''}`}
                                >
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                        {data.map((row, rowIdx) => (
                            <tr
                                key={keyExtractor(row, rowIdx)}
                                onClick={() => onRowClick?.(row)}
                                className={`transition-colors ${onRowClick ? 'cursor-pointer hover:bg-gray-50' : 'hover:bg-gray-50/50'}`}
                            >
                                {columns.map((col, colIdx) => (
                                    <td
                                        key={colIdx}
                                        className={`px-4 py-3.5 text-charcoal whitespace-nowrap ${col.className || ''}`}
                                    >
                                        {col.render
                                            ? col.render(row, rowIdx)
                                            : col.accessorKey
                                            ? String(row[col.accessorKey] ?? '')
                                            : null}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-200">
                {data.map((row, rowIdx) => (
                    <div
                        key={keyExtractor(row, rowIdx)}
                        onClick={() => onRowClick?.(row)}
                        className={`p-4 space-y-2.5 transition-colors ${onRowClick ? 'cursor-pointer hover:bg-gray-50 active:bg-gray-100' : ''}`}
                    >
                        {columns.map((col, colIdx) => {
                            if (col.hideOnMobile) return null;
                            const content = col.render
                                ? col.render(row, rowIdx)
                                : col.accessorKey
                                ? String(row[col.accessorKey] ?? '')
                                : null;

                            return (
                                <div key={colIdx} className="flex items-center justify-between gap-2 text-sm">
                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                        {col.header}
                                    </span>
                                    <div className="text-charcoal font-medium text-right">
                                        {content}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ResponsiveTable;
