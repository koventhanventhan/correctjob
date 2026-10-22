/**
 * Currency and Salary formatting utilities
 * Uses Sri Lankan Rupee (LKR) across the application.
 */

export function formatCurrency(amount: number | string | null | undefined): string {
    if (amount === null || amount === undefined || amount === '') {
        return '';
    }
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '';
    return `LKR ${num.toLocaleString('en-LK', { maximumFractionDigits: 0 })}`;
}

export function formatSalary(
    min?: number | string | null, 
    max?: number | string | null,
    period: string = 'month'
): string {
    const minNum = min !== null && min !== undefined && min !== '' ? Number(min) : null;
    const maxNum = max !== null && max !== undefined && max !== '' ? Number(max) : null;

    const periodSuffix = period ? ` / ${period}` : '';

    if (minNum !== null && !isNaN(minNum) && maxNum !== null && !isNaN(maxNum)) {
        if (minNum === maxNum) {
            return `LKR ${minNum.toLocaleString('en-LK')}${periodSuffix}`;
        }
        return `LKR ${minNum.toLocaleString('en-LK')} - ${maxNum.toLocaleString('en-LK')}${periodSuffix}`;
    }

    if (minNum !== null && !isNaN(minNum)) {
        return `LKR ${minNum.toLocaleString('en-LK')}+${periodSuffix}`;
    }

    if (maxNum !== null && !isNaN(maxNum)) {
        return `Up to LKR ${maxNum.toLocaleString('en-LK')}${periodSuffix}`;
    }

    return 'Salary undisclosed';
}

export function formatSalaryCompact(
    min?: number | string | null, 
    max?: number | string | null
): string {
    const minNum = min !== null && min !== undefined && min !== '' ? Number(min) : null;
    const maxNum = max !== null && max !== undefined && max !== '' ? Number(max) : null;

    const toK = (val: number) => {
        if (val >= 1000000) {
            return `${(val / 1000000).toFixed(val % 1000000 === 0 ? 0 : 1)}M`;
        }
        if (val >= 1000) {
            return `${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 0)}k`;
        }
        return val.toLocaleString('en-LK');
    };

    if (minNum !== null && !isNaN(minNum) && maxNum !== null && !isNaN(maxNum)) {
        return `LKR ${toK(minNum)} - ${toK(maxNum)}`;
    }
    if (minNum !== null && !isNaN(minNum)) {
        return `LKR ${toK(minNum)}+`;
    }
    if (maxNum !== null && !isNaN(maxNum)) {
        return `Up to LKR ${toK(maxNum)}`;
    }
    return 'Competitive';
}
