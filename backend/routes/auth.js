const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/database');
const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Validar datos
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }
    
    // Verificar si el usuario ya existe
    db.get(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username],
      async (err, existingUser) => {
        if (err) {
          console.error('Error verificando usuario:', err);
          return res.status(500).json({ error: 'Error interno del servidor' });
        }
        
        if (existingUser) {
          return res.status(400).json({ error: 'Usuario o email ya existe' });
        }
        
        try {
          // Hash de la contraseña
          const saltRounds = 10;
          const passwordHash = await bcrypt.hash(password, saltRounds);
          
          // Crear usuario
          db.run(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            [username, email, passwordHash],
            function(err) {
              if (err) {
                console.error('Error creando usuario:', err);
                return res.status(500).json({ error: 'Error interno del servidor' });
              }
              
              const userId = this.lastID;
              
              // Generar JWT
              const token = jwt.sign(
                { userId: userId, username: username },
                process.env.JWT_SECRET || 'secret_key',
                { expiresIn: '24h' }
              );
              
              res.status(201).json({
                message: 'Usuario creado exitosamente',
                user: { id: userId, username: username, email: email },
                token
              });
            }
          );
        } catch (hashError) {
          console.error('Error en hash:', hashError);
          res.status(500).json({ error: 'Error interno del servidor' });
        }
      }
    );
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }
    
    // Buscar usuario
    db.get(
      'SELECT id, username, email, password FROM users WHERE email = ?',
      [email],
      async (err, user) => {
        if (err) {
          console.error('Error buscando usuario:', err);
          return res.status(500).json({ error: 'Error interno del servidor' });
        }
        
        if (!user) {
          return res.status(401).json({ error: 'Credenciales inválidas' });
        }
        
        try {
          // Verificar contraseña
          const isValidPassword = await bcrypt.compare(password, user.password);
          
          if (!isValidPassword) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
          }
          
          // Generar JWT
          const token = jwt.sign(
            { userId: user.id, username: user.username },
            process.env.JWT_SECRET || 'secret_key',
            { expiresIn: '24h' }
          );
          
          res.json({
            message: 'Login exitoso',
            user: { id: user.id, username: user.username, email: user.email },
            token
          });
        } catch (compareError) {
          console.error('Error comparando contraseña:', compareError);
          res.status(500).json({ error: 'Error interno del servidor' });
        }
      }
    );
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;