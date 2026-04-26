// src/api/axios.js
import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api' + 'https://entity-recognition-uyqq.onrender.com/api', 
  timeout: 30000,
});

export default API;
