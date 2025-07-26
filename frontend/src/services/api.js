import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },
  
  register: async (username, email, password) => {
    const response = await api.post('/auth/register', { username, email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
  
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  }
};

export const chatService = {
  sendMessage: async (message, conversationId = null) => {
    const response = await api.post('/chat/send', { message, conversationId });
    return response.data;
  },
  
  getHistory: async (conversationId = null) => {
    const params = conversationId ? { conversationId } : {};
    const response = await api.get('/chat/history', { params });
    return response.data;
  }
};

export const predictionService = {
  predictFailure: async (sensorData) => {
    const response = await api.post('/predictions/failure', { sensorData });
    return response.data;
  },
  
  getPredictionHistory: async () => {
    const response = await api.get('/predictions/history');
    return response.data;
  }
};

// Agregar servicios para datos industriales
export const industrialService = {
  // Obtener todos los datos
  getAllData: () => api.get('/predictions/historical-data'),
  
  // Obtener datos por máquina
  getDataByMachine: (machineId) => api.get(`/predictions/machine/${machineId}`),
  
  // Obtener solo fallos
  getFailures: () => api.get('/predictions/failures'),
  
  // Obtener estadísticas
  getStats: () => api.get('/predictions/efficiency-stats'),
  
  // Obtener máquinas disponibles
  getMachines: () => api.get('/predictions/machines'),
  
  // Obtener operadores
  getOperators: () => api.get('/predictions/operators')
};