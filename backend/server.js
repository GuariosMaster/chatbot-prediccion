const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const predictionRoutes = require('./routes/predictions');
const { initializeDatabase } = require('./config/database');
const { initializeTalentoCSV } = require('./config/industrialCSV');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware de seguridad
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // límite de 100 requests por ventana
});
app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/predictions', predictionRoutes);

// Socket.io para chat en tiempo real
io.on('connection', (socket) => {
  console.log('Usuario conectado:', socket.id);
  
  socket.on('join_room', (userId) => {
    socket.join(`user_${userId}`);
  });
  
  socket.on('send_message', async (data) => {
    // Procesar mensaje y enviar a la sala correspondiente
    io.to(`user_${data.userId}`).emit('new_message', data);
  });
  
  socket.on('disconnect', () => {
    console.log('Usuario desconectado:', socket.id);
  });
});

// Inicializar base de datos SQLite y CSV
initializeDatabase().then(() => {
  console.log('Base de datos SQLite inicializada');
  
  // Inicializar CSV para predicciones
  initializeTalentoCSV();
  console.log('Sistema CSV inicializado');
  
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`Servidor ejecutándose en puerto ${PORT}`);
  });
}).catch(err => {
  console.error('Error al inicializar:', err);
});