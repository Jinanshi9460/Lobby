import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  withCredentials: true
});

const token = localStorage.getItem('lobby_token');
if (token) {
  api.defaults.headers.common.Authorization = `Bearer ${token}`;
}

api.interceptors.response.use(
  response => response,
  error => {
    const status = error.response?.status;
    if (status === 401) {
      localStorage.removeItem('lobby_token');
      delete api.defaults.headers.common.Authorization;
    }
    return Promise.reject(error.response?.data || error);
  }
);

export default api;
