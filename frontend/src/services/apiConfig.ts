export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const createGithubAuthorizationHeader = (token: string) => `token ${token}`;
