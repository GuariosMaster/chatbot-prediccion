const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// Ruta a tu archivo específico
const DATA_DIR = path.join(__dirname, '../data');
const DATASET_TALENTO_FILE = path.join(DATA_DIR, 'Dataset_Talento.csv');
const USERS_FILE = path.join(DATA_DIR, 'users.csv');

// Headers de tu archivo (exactamente como los tienes)
const TALENTO_HEADERS = [
  'timestamp',
  'turno', 
  'operador_id',
  'maquina_id',
  'producto_id',
  'temperatura',
  'vibración',  // ← Nota: con tilde como en tu archivo
  'humedad',
  'tiempo_ciclo',
  'fallo_detectado',
  'tipo_fallo',
  'cantidad_producida',
  'unidades_defectuosas',
  'eficiencia_porcentual',
  'consumo_energia',
  'paradas_programadas',
  'paradas_imprevistas',
  'observaciones'
];

// Función para leer CSV
const readCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    if (!fs.existsSync(filePath)) {
      console.log(`Archivo no encontrado: ${filePath}`);
      return resolve([]);
    }
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        // Limpiar datos y convertir tipos
        const cleanData = {
          ...data,
          temperatura: parseFloat(data.temperatura) || 0,
          vibración: parseFloat(data.vibración) || 0,
          humedad: parseFloat(data.humedad) || 0,
          tiempo_ciclo: parseFloat(data.tiempo_ciclo) || 0,
          fallo_detectado: data.fallo_detectado === '1' || data.fallo_detectado === 'true',
          cantidad_producida: parseInt(data.cantidad_producida) || 0,
          unidades_defectuosas: parseInt(data.unidades_defectuosas) || 0,
          eficiencia_porcentual: parseFloat(data.eficiencia_porcentual) || 0,
          consumo_energia: parseFloat(data.consumo_energia) || 0,
          paradas_programadas: parseInt(data.paradas_programadas) || 0,
          paradas_imprevistas: parseInt(data.paradas_imprevistas) || 0
        };
        results.push(cleanData);
      })
      .on('end', () => {
        console.log(`✅ Leídos ${results.length} registros de ${path.basename(filePath)}`);
        resolve(results);
      })
      .on('error', (error) => {
        console.error(`Error leyendo ${filePath}:`, error);
        reject(error);
      });
  });
};

// Operaciones específicas para Dataset_Talento
const talentoOperations = {
  // Leer todos los datos
  getAllData: async () => {
    return await readCSV(DATASET_TALENTO_FILE);
  },
  
  // Obtener datos por máquina
  getDataByMachine: async (maquina_id) => {
    const data = await readCSV(DATASET_TALENTO_FILE);
    return data.filter(record => record.maquina_id === maquina_id.toString());
  },
  
  // Obtener datos por operador
  getDataByOperator: async (operador_id) => {
    const data = await readCSV(DATASET_TALENTO_FILE);
    return data.filter(record => record.operador_id === operador_id.toString());
  },
  
  // Obtener solo fallos
  getFailureData: async () => {
    const data = await readCSV(DATASET_TALENTO_FILE);
    return data.filter(record => record.fallo_detectado === true);
  },
  
  // Obtener datos por rango de fechas
  getDataByDateRange: async (startDate, endDate) => {
    const data = await readCSV(DATASET_TALENTO_FILE);
    return data.filter(record => {
      const recordDate = new Date(record.timestamp);
      return recordDate >= new Date(startDate) && recordDate <= new Date(endDate);
    });
  },
  
  // Estadísticas de eficiencia
  getEfficiencyStats: async (maquina_id = null) => {
    const data = await readCSV(DATASET_TALENTO_FILE);
    const filteredData = maquina_id ? 
      data.filter(record => record.maquina_id === maquina_id.toString()) : data;
    
    if (filteredData.length === 0) return null;
    
    const efficiencies = filteredData
      .map(record => record.eficiencia_porcentual)
      .filter(eff => !isNaN(eff) && eff > 0);
    
    return {
      promedio: efficiencies.reduce((a, b) => a + b, 0) / efficiencies.length,
      maximo: Math.max(...efficiencies),
      minimo: Math.min(...efficiencies),
      total_registros: filteredData.length,
      total_fallos: filteredData.filter(r => r.fallo_detectado).length
    };
  },
  
  // Datos para entrenamiento ML
  getMLTrainingData: async (limit = 1000) => {
    const data = await readCSV(DATASET_TALENTO_FILE);
    return data.slice(-limit);
  },
  
  // Obtener máquinas únicas
  getUniqueMachines: async () => {
    const data = await readCSV(DATASET_TALENTO_FILE);
    return [...new Set(data.map(record => record.maquina_id))];
  },
  
  // Obtener operadores únicos
  getUniqueOperators: async () => {
    const data = await readCSV(DATASET_TALENTO_FILE);
    return [...new Set(data.map(record => record.operador_id))];
  }
};

// Inicialización
const initializeTalentoCSV = () => {
  if (fs.existsSync(DATASET_TALENTO_FILE)) {
    console.log('✅ Dataset_Talento.csv encontrado y listo para usar');
  } else {
    console.error('❌ Dataset_Talento.csv no encontrado en:', DATASET_TALENTO_FILE);
  }
};

module.exports = { 
  initializeTalentoCSV, 
  talentoOperations,
  TALENTO_HEADERS,
  DATASET_TALENTO_FILE
};