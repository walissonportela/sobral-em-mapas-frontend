import axios from 'axios';

const api = axios.create({
  // URL do seu container Laravel
  baseURL: 'http://localhost:8080/api',
});

export default api;