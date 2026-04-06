import axios from 'axios';

// Local test කරන්න මේක දාගන්න
//const BASE_URL = 'http://localhost:5000/api'; 
const BASE_URL = 'https://myguru.lumi-automation.com/api'; // Production

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 🔥 අලුතින් එකතු කරපු කෑල්ල (Interceptor)
// මේකෙන් කරන්නේ API එකට මොනවා හරි යවන්න කලින්, LocalStorage එකේ තියෙන Token එක අරගෙන Auto Header එකට දාලා යවන එකයි.
api.interceptors.request.use(
  (config) => {
    // adminToken හරි token හරි දෙකෙන් එකක් තියෙනවද බලනවා
    const token = localStorage.getItem('adminToken') || localStorage.getItem('token') || localStorage.getItem('accessToken');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);