import axios from 'axios';

// ඔයාගේ VPS IP එක හෝ Domain එක මෙතනට දාන්න
// Localhost නම්: http://localhost:8095
// VPS නම්: https://myguru.lumi-automation.com/api (Nginx හරහා)
const API_URL = 'https://myguru.lumi-automation.com/api/admin'; 

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});