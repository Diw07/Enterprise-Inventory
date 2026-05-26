import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

// Attach Clerk session token to every request
api.interceptors.request.use(async (config) => {
  // The Clerk session token is fetched from the global Clerk instance
  // This is set by ClerkProvider in main.jsx
  if (window.Clerk) {
    try {
      const token = await window.Clerk.session?.getToken();
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch {
      // Token fetch failed, proceed without auth header
    }
  }
  return config;
});

export default api;
