/**
 * Helper to validate passwords matching ASP.NET Core Identity default rules:
 * - Minimum 6 characters
 * - At least one uppercase letter (A-Z)
 * - At least one lowercase letter (a-z)
 * - At least one digit (0-9)
 * - At least one non-alphanumeric / symbol
 */
export function validatePassword(password: string): string | null {
    if (!password || password.length < 6) {
        return 'Password must be at least 6 characters long.';
    }
    if (!/[A-Z]/.test(password)) {
        return 'Password must contain at least one uppercase letter (A-Z).';
    }
    if (!/[a-z]/.test(password)) {
        return 'Password must contain at least one lowercase letter (a-z).';
    }
    if (!/[0-9]/.test(password)) {
        return 'Password must contain at least one digit (0-9).';
    }
    if (!/[^a-zA-Z0-9]/.test(password)) {
        return 'Password must contain at least one special character / symbol (e.g. !@#$%^&*).';
    }
    return null;
}

/**
 * Extracts human-readable error messages from backend Identity error arrays or ModelState dictionaries
 */
export function formatIdentityErrors(error: any, fallbackMessage = 'Failed to change password.'): string {
    if (!error) return fallbackMessage;

    const data = error.response?.data;
    if (!data) {
        return error.message || fallbackMessage;
    }

    // ASP.NET Core Identity returns an array of IdentityError: [{ code, description }]
    if (Array.isArray(data)) {
        const descriptions = data
            .map((item: any) => item.description || item.message || (typeof item === 'string' ? item : ''))
            .filter(Boolean);
        if (descriptions.length > 0) {
            return descriptions.join(' ');
        }
    }

    // Model state validation error dictionary: { errors: { Field: ['error1', 'error2'] } }
    if (data.errors && typeof data.errors === 'object') {
        const allErrors = Object.values(data.errors)
            .flat()
            .map((e: any) => (typeof e === 'string' ? e : e?.description || ''))
            .filter(Boolean);
        if (allErrors.length > 0) {
            return allErrors.join(' ');
        }
    }

    if (typeof data === 'string') {
        return data;
    }

    if (data.message) {
        return data.message;
    }

    if (data.title) {
        return data.title;
    }

    return fallbackMessage;
}
