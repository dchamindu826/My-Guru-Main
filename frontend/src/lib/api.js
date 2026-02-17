import axios from 'axios';

// 🔥 VPS එකේදි කෙලින්ම Domain එක දාන්න
const BASE_URL = 'https://myguru.lumi-automation.com/api';

console.log('🔗 API Connected to:', BASE_URL);

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});