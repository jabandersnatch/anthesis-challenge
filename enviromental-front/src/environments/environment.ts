/**
 * Production environment configuration
 * This file contains environment-specific settings for production builds
 */
export const environment = {
  production: true,
  apiUrl: 'http://localhost:8000/api',
  apiEndpoints: {
    emissions: '/emissions/',
  },
};
