import axios from 'axios';

// Local test කරන්න මේක දාගන්න
//const BASE_URL = 'http://localhost:5000/api'; 
 const BASE_URL = 'https://myguru.lumi-automation.com/api'; // (Production එකට දාද්දි මේක අන්-කමෙන්ට් කරන්න)

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});