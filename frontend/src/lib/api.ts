import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';
const CORE_AI_URL = import.meta.env.VITE_CORE_AI_URL || 'http://localhost:3003';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const aiApi = axios.create({
  baseURL: CORE_AI_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('vortex44-auth');
  if (token) {
    const parsed = JSON.parse(token);
    if (parsed.state?.token) {
      config.headers.Authorization = `Bearer ${parsed.state.token}`;
    }
  }
  return config;
});

aiApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('vortex44-auth');
  if (token) {
    const parsed = JSON.parse(token);
    if (parsed.state?.token) {
      config.headers.Authorization = `Bearer ${parsed.state.token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('vortex44-auth');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

aiApi.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('AI API Error:', error);
    return Promise.reject(error);
  }
);

export { aiApi };
export default api;
