// Utility functions for authentication
export const AUTH_TOKEN = 'ca876cb231f819f96bc5ab4b29dfa88186291f28';

export const getAuthHeaders = () => {
  return {
    'Authorization': `Token ${AUTH_TOKEN}`,
    'Content-Type': 'application/json',
  };
};

export const isAuthenticated = () => {
  // For development, always return true with admin token
  return true;
};