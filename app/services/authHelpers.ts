// Helper functions for authentication

/**
 * Parse and extract JWT token from URL
 */
export const parseToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  // Parse token from URL query params
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  
  if (token) {
    // Clean up URL after extracting token
    const newUrl = window.location.pathname;
    window.history.replaceState({}, document.title, newUrl);
    return token;
  }
  
  return null;
};

/**
 * Format error messages
 */
export const getErrorMessage = (error: any): string => {
  if (typeof error === 'string') return error;
  if (error?.response?.data?.error) return error.response.data.error;
  if (error?.message) return error.message;
  return 'An unknown error occurred';
};

/**
 * Get the API URL
 */
export const getApiUrl = (): string => {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
};

/**
 * Returns Google Auth URL for authentication
 */
export const getGoogleAuthUrl = (): string => {
  const apiUrl = getApiUrl();
  return `${apiUrl}/api/auth/login/google`;
};

/**
 * Get frontend URL (useful for callbacks)
 */
export const getFrontendUrl = (): string => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';
};
