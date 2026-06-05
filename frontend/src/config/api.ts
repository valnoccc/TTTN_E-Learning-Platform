export const API_BASE_URL =
    import.meta.env.VITE_API_URL || 'https://tttn-e-learning-platform.onrender.com';

export function toAbsoluteApiUrl(path?: string | null) {
    if (!path) {
        return null;
    }

    if (/^https?:\/\//i.test(path)) {
        return path;
    }

    if (path.startsWith('/')) {
        return `${API_BASE_URL}${path}`;
    }

    return `${API_BASE_URL}/${path}`;
}
