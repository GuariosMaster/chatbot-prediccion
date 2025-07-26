const express = require('express');
const axios = require('axios');
const { db } = require('../config/database'); // Cambiar pool por db
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

// Función helper para promisificar consultas SQLite
const runQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(query, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ lastID: this.lastID, changes: this.changes });
      }
    });
  });
};

const allQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

// POST /api/predictions/failure
router.post('/failure', authenticateToken, async (req, res) => {
  try {
    const { sensorData } = req.body;
    const userId = req.user.userId;
    
    if (!sensorData) {
      return res.status(400).json({ error: 'Datos de sensores son requeridos' });
    }
    
    // Validar estructura de datos
    const requiredFields = ['temperatura', 'vibracion', 'humedad', 'tiempo_ciclo', 'eficiencia_porcentual', 'consumo_energia'];
    const missingFields = requiredFields.filter(field => !(field in sensorData));
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: `Campos faltantes: ${missingFields.join(', ')}` 
      });
    }
    
    // Llamar al microservicio de ML
    const mlResponse = await axios.post(`${ML_SERVICE_URL}/predict`, {
      data: sensorData
    });
    
    const prediction = mlResponse.data;
    
    // Guardar predicción en la base de datos SQLite
    await runQuery(
      'INSERT INTO predictions (user_id, sensor_data, prediction_result) VALUES (?, ?, ?)',
      [
        userId,
        JSON.stringify(sensorData),
        JSON.stringify(prediction)
      ]
    );
    
    res.json({
      prediction: prediction.result,
      confidence: prediction.confidence,
      recommendations: prediction.recommendations || [],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error en predicción:', error);
    
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ 
        error: 'Servicio de ML no disponible' 
      });
    }
    
    res.status(500).json({ error: 'Error interno del servidor', details: error.message });
  }
});

// GET /api/predictions/history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 20 } = req.query;
    
    const predictions = await allQuery(
      'SELECT * FROM predictions WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
      [userId, limit]
    );
    
    res.json({ predictions });
  } catch (error) {
    console.error('Error al obtener historial de predicciones:', error);
    res.status(500).json({ error: 'Error interno del servidor', details: error.message });
  }
});

module.exports = router;