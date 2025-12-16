import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL =
  import.meta.env.VITE_API_URL || 'https://orderq-backend.onrender.com/api';

// Create Axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Set Authorization header if token exists in localStorage
const storedToken = localStorage.getItem('sessionToken');
if (storedToken) {
  api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
}

// Response interceptor to handle expired/invalid session
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Session expired or invalid
      localStorage.removeItem('sessionToken');
      api.defaults.headers.common['Authorization'] = '';
      toast.error('Session expired. Please scan the QR code again.');

      // Redirect to home
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;
