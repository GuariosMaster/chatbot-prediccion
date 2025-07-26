import React, { useState, useEffect } from 'react';
import { predictionService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import '../styles/chatbot.css';

const PredictionPage = () => {
  const [sensorData, setSensorData] = useState({
    temperatura: '',
    vibracion: '',
    humedad: '',
    tiempo_ciclo: '',
    eficiencia_porcentual: '',
    consumo_energia: ''
  });
  const [prediction, setPrediction] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    loadPredictionHistory();
  }, []);

  const loadPredictionHistory = async () => {
    try {
      const response = await predictionService.getPredictionHistory();
      setHistory(response.predictions || []);
    } catch (error) {
      console.error('Error al cargar historial:', error);
    }
  };

  const handleInputChange = (e) => {
    setSensorData({
      ...sensorData,
      [e.target.name]: parseFloat(e.target.value) || ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await predictionService.predictFailure(sensorData);
      setPrediction(response);
      loadPredictionHistory(); // Recargar historial
    } catch (error) {
      setError(error.response?.data?.error || 'Error en la predicción');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="prediction-container">
      <div className="prediction-header">
        <h2>Predicción de Fallos</h2>
        <button 
          onClick={() => window.location.href = '/chat'}
          className="back-btn"
        >
          Volver al Chat
        </button>
      </div>
      
      <div className="prediction-content">
        {/* Formulario de datos de sensores */}
        <div className="sensor-form-section">
          <h3>Datos de Sensores</h3>
          
          {error && (
            <div className="error-message">{error}</div>
          )}
          
          <form onSubmit={handleSubmit} className="sensor-form">
            <div className="form-grid">
              <div className="form-group">
                <label>Temperatura (°C)</label>
                <input
                  type="number"
                  name="temperatura"
                  value={sensorData.temperatura}
                  onChange={handleInputChange}
                  step="0.1"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Vibración (mm/s)</label>
                <input
                  type="number"
                  name="vibracion"
                  value={sensorData.vibracion}
                  onChange={handleInputChange}
                  step="0.1"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Humedad (%)</label>
                <input
                  type="number"
                  name="humedad"
                  value={sensorData.humedad}
                  onChange={handleInputChange}
                  step="0.1"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Tiempo de Ciclo (min)</label>
                <input
                  type="number"
                  name="tiempo_ciclo"
                  value={sensorData.tiempo_ciclo}
                  onChange={handleInputChange}
                  step="0.1"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Eficiencia (%)</label>
                <input
                  type="number"
                  name="eficiencia_porcentual"
                  value={sensorData.eficiencia_porcentual}
                  onChange={handleInputChange}
                  step="0.1"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Consumo de Energía (kWh)</label>
                <input
                  type="number"
                  name="consumo_energia"
                  value={sensorData.consumo_energia}
                  onChange={handleInputChange}
                  step="0.1"
                  required
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              className="predict-btn"
              disabled={loading}
            >
              {loading ? 'Analizando...' : 'Predecir Fallo'}
            </button>
          </form>
        </div>
        
        {/* Resultado de predicción */}
        {prediction && (
          <div className="prediction-result">
            <h3>Resultado de Predicción</h3>
            <div className={`result-card ${prediction.prediction_binary === 1 ? 'failure' : 'normal'}`}>
              <div className="result-status">
                {prediction.result}
              </div>
              <div className="result-confidence">
                Confianza: {(prediction.confidence * 100).toFixed(2)}%
              </div>
              
              {prediction.recommendations && (
                <div className="recommendations">
                  <h4>Recomendaciones:</h4>
                  <ul>
                    {prediction.recommendations.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Historial de predicciones */}
        <div className="prediction-history">
          <h3>Historial de Predicciones</h3>
          <div className="history-list">
            {history.slice(0, 5).map((pred, index) => (
              <div key={pred.id} className="history-item">
                <div className="history-date">
                  {new Date(pred.created_at).toLocaleString()}
                </div>
                <div className={`history-result ${JSON.parse(pred.prediction_result).prediction_binary === 1 ? 'failure' : 'normal'}`}>
                  {JSON.parse(pred.prediction_result).result}
                </div>
                <div className="history-confidence">
                  {(pred.confidence_score * 100).toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PredictionPage;