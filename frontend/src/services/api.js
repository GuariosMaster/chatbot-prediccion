import axios from 'axios';

// Cambiar la URL base para que use el puerto correcto
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Crear instancia de axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token de autenticación
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

// Interceptor para manejar errores de respuesta
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

// Servicios de autenticación
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

// Servicios de chat
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

// Servicios de predicción
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

export default api;


## 🎉 **¡Excelente! Código subido exitosamente**

Perfecto, ahora que tu proyecto está en GitHub, es momento de desplegarlo para que esté disponible en línea.

---

## 🚀 **Próximos pasos: Despliegue**

### **1. Frontend en Netlify**

**Paso 1: Preparar el frontend**
Primero, actualiza la configuración para producción:
```javascript
// Cambiar la URL base para que sea dinámica
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
```


## 🌐 **Paso 2: Desplegar en Railway**

### **1. Ir a Railway**
- Ve a [railway.app](https://railway.app)
- Haz clic en **"Start a New Project"**

### **2. Conectar GitHub**
- Selecciona **"Deploy from GitHub repo"**
- Autoriza Railway para acceder a tu GitHub
- Busca y selecciona tu repositorio `chatbot-prediccion`

### **3. Configurar el proyecto**
- **Root Directory:** `backend`
- **Build Command:** `npm install` (se detecta automáticamente)
- **Start Command:** `npm start` (se detecta automáticamente)

### **4. Variables de entorno**
En Railway, ve a **Variables** y agrega:
- `NODE_ENV` = `production`
- `JWT_SECRET` = `tu-clave-super-secreta-123`
- `PORT` = `$PORT` (Railway lo maneja automáticamente)

### **5. Deploy**
- Haz clic en **"Deploy"**
- Railway automáticamente:
  - Clona tu repo
  - Instala dependencias
  - Ejecuta tu aplicación
  - Te da una URL pública

---

## 🎯 **Paso 3: Obtener la URL del backend**

Después del deploy exitoso:
1. Ve a tu proyecto en Railway
2. Haz clic en **"Settings"** > **"Domains"**
3. Copia la URL (algo como: `https://tu-proyecto.up.railway.app`)

---

## 🌐 **Paso 4: Desplegar Frontend en Netlify**

### **1. Actualizar API URL**
Primero, actualiza el frontend para usar la URL de Railway:
```javascript
// Cambiar esta línea:
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
```