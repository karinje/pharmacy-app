export const APP_NAME = 'NDC Calculator';
export const APP_VERSION = '1.0.0';
export const APP_DESCRIPTION = 'AI-powered NDC packaging and quantity calculator';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  CALCULATOR: '/calculator',
  HISTORY: '/history',
  PROFILE: '/profile'
} as const;

export const CACHE_DURATION = {
  RXNORM: 7 * 24 * 60 * 60 * 1000, // 7 days
  FDA_NDC: 24 * 60 * 60 * 1000, // 24 hours
  CALCULATION: 30 * 24 * 60 * 60 * 1000 // 30 days
} as const;

export const API_TIMEOUT = 30000; // 30 seconds

export const MAX_CALCULATION_HISTORY = 100;

