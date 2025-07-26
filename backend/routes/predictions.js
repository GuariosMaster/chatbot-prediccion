const express = require('express');
const axios = require('axios');
const router = express.Router();
const { talentoOperations } = require('../config/industrialCSV');

// Endpoint para predicción de fallos
router.post('/failure', async (req, res) => {
  try {
    const { sensorData } = req.body;
    
    // Llamar al servicio ML
    const mlResponse = await axios.post('http://localhost:8000/predict', {
      data: sensorData
    });
    
    const prediction = mlResponse.data;
    
    res.json({
      success: true,
      prediction: prediction,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error en predicción:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error en el servicio de predicción' 
    });
  }
});

// Obtener datos históricos del CSV
router.get('/historical-data', async (req, res) => {
  try {
    const data = await talentoOperations.getAllData();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obtener estadísticas de eficiencia
router.get('/efficiency-stats', async (req, res) => {
  try {
    const stats = await talentoOperations.getEfficiencyStats();
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// NUEVAS RUTAS FALTANTES:

// Obtener datos por máquina
router.get('/machine/:machineId', async (req, res) => {
  try {
    const { machineId } = req.params;
    const data = await talentoOperations.getDataByMachine(machineId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obtener solo fallos
router.get('/failures', async (req, res) => {
  try {
    const data = await talentoOperations.getFailureData();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obtener lista de máquinas únicas
router.get('/machines', async (req, res) => {
  try {
    const allData = await talentoOperations.getAllData();
    const machines = [...new Set(allData.map(record => record.maquina_id))].filter(Boolean);
    res.json({ success: true, machines });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obtener lista de operadores únicos
router.get('/operators', async (req, res) => {
  try {
    const allData = await talentoOperations.getAllData();
    const operators = [...new Set(allData.map(record => record.operador_id))].filter(Boolean);
    res.json({ success: true, operators });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;