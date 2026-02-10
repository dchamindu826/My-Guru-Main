import axios from 'axios';

// Node.js Backend URL එක (Localhost)
// අගට /admin කෑල්ල අයින් කළා, මොකද අපි පොදු /api එකක් පාවිච්චි කරන්නේ.
const API_URL = 'http://localhost:5000/api'; 

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});