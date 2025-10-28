import axios from 'axios';

const api = axios.create({
  baseURL: '/',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  config => {
    // Можно добавить токен авторизации
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  response => response,
  error => {
    if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
      console.warn('Network error detected, switching to offline mode');
    }
    return Promise.reject(error);
  }
);

export default api;
