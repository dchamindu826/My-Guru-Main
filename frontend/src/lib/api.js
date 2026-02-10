import axios from 'axios';

export const api = axios.create({
  // 🔥 මෙතනින් තමයි localhost ද VPS ද කියලා තීරණය කරන්නේ
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5002/api',
  headers: {
    'Content-Type': 'application/json',
  },
});