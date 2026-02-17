import axios from 'axios';

// 🔥 පරිසරය අනුව URL එක Auto මාරු වෙනවා
const BASE_URL = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL 
  : window.location.hostname === 'localhost' 
    ? 'http://localhost:5002/api' // Localhost වලදී
    : '[https://myguru.lumi-automation.com/api](https://myguru.lumi-automation.com/api)'; // VPS එකේදී

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Debugging (Console එකේ පෙන්නයි මොන URL එකද ගත්තේ කියලා)
console.log('🔗 API Connected to:', BASE_URL);