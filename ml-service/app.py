from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import pandas as pd
import joblib
import os
from datetime import datetime
import logging

app = Flask(__name__)
CORS(app)

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Cargar modelo (por ahora usaremos un modelo mock)
class MockModel:
    def __init__(self):
        self.model_version = "1.0"
        self.features = ['temperatura', 'vibracion', 'humedad', 'tiempo_ciclo', 'eficiencia_porcentual', 'consumo_energia']
    
    def predict(self, data):
        # Lógica de predicción mock basada en umbrales
        temperatura = data.get('temperatura', 0)
        vibracion = data.get('vibracion', 0)
        humedad = data.get('humedad', 0)
        eficiencia = data.get('eficiencia_porcentual', 100)
        
        # Calcular score de riesgo
        risk_score = 0
        
        if temperatura > 80:
            risk_score += 0.3
        if vibracion > 5:
            risk_score += 0.4
        if humedad > 70:
            risk_score += 0.2
        if eficiencia < 70:
            risk_score += 0.3
        
        # Determinar predicción
        prediction = 1 if risk_score > 0.5 else 0
        confidence = min(risk_score if prediction == 1 else (1 - risk_score), 0.95)
        
        return prediction, confidence
    
    def get_recommendations(self, data, prediction):
        recommendations = []
        
        if prediction == 1:
            if data.get('temperatura', 0) > 80:
                recommendations.append("Revisar sistema de refrigeración")
            if data.get('vibracion', 0) > 5:
                recommendations.append("Inspeccionar rodamientos y alineación")
            if data.get('humedad', 0) > 70:
                recommendations.append("Verificar sistema de ventilación")
            if data.get('eficiencia_porcentual', 100) < 70:
                recommendations.append("Programar mantenimiento preventivo")
        else:
            recommendations.append("Sistema funcionando normalmente")
        
        return recommendations

# Inicializar modelo
model = MockModel()

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'model_version': model.model_version,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/predict', methods=['POST'])
def predict_failure():
    try:
        data = request.json.get('data', {})
        
        # Validar datos de entrada
        required_fields = model.features
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            return jsonify({
                'error': f'Campos faltantes: {", ".join(missing_fields)}'
            }), 400
        
        # Realizar predicción
        prediction, confidence = model.predict(data)
        recommendations = model.get_recommendations(data, prediction)
        
        # Preparar respuesta
        result = {
            'result': 'Fallo Detectado' if prediction == 1 else 'Sin Fallo',
            'prediction_binary': prediction,
            'confidence': round(confidence, 4),
            'model_version': model.model_version,
            'recommendations': recommendations,
            'input_summary': {
                'temperatura': data['temperatura'],
                'vibracion': data['vibracion'],
                'humedad': data['humedad'],
                'eficiencia': data['eficiencia_porcentual']
            },
            'timestamp': datetime.now().isoformat()
        }
        
        logger.info(f"Predicción realizada: {result['result']} (confianza: {confidence:.4f})")
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error en predicción: {str(e)}")
        return jsonify({
            'error': 'Error interno del servidor',
            'details': str(e)
        }), 500

@app.route('/model/info', methods=['GET'])
def model_info():
    return jsonify({
        'model_version': model.model_version,
        'features': model.features,
        'model_type': 'Clasificación Binaria',
        'target': 'fallo_detectado',
        'description': 'Modelo para predicción de fallos en maquinaria industrial'
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    app.run(host='0.0.0.0', port=port, debug=True)