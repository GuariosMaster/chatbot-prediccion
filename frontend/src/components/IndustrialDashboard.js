import React, { useState, useEffect } from 'react';
import { industrialService } from '../services/api';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer,
  AreaChart, Area, ScatterChart, Scatter
} from 'recharts';
import './IndustrialDashboard.css';

const IndustrialDashboard = () => {
  const [data, setData] = useState([]);
  const [stats, setStats] = useState(null);
  const [machines, setMachines] = useState([]);
  const [selectedMachine, setSelectedMachine] = useState('all');
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('data'); // 'data', 'failures', 'stats', 'charts'
  const [error, setError] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [dataRes, statsRes, machinesRes] = await Promise.all([
        industrialService.getAllData(),
        industrialService.getStats(),
        industrialService.getMachines()
      ]);
      
      setData(dataRes.data.data || []);
      setStats(statsRes.data.stats);
      setMachines(machinesRes.data.machines || []);
    } catch (error) {
      console.error('Error cargando datos:', error);
      setError('Error al cargar los datos industriales');
    } finally {
      setLoading(false);
    }
  };

  const handleMachineFilter = async (machineId) => {
    setSelectedMachine(machineId);
    try {
      if (machineId === 'all') {
        const response = await industrialService.getAllData();
        setData(response.data.data || []);
      } else {
        const response = await industrialService.getDataByMachine(machineId);
        setData(response.data.data || []);
      }
    } catch (error) {
      console.error('Error filtrando por máquina:', error);
    }
  };

  const loadFailures = async () => {
    try {
      const response = await industrialService.getFailures();
      setData(response.data.data || []);
      setView('failures');
    } catch (error) {
      console.error('Error cargando fallos:', error);
    }
  };

  // Preparar datos para gráficas
  const prepareChartData = () => {
    if (!data.length) return [];
    
    return data.slice(0, 50).map((record, index) => ({
      timestamp: new Date(record.timestamp).toLocaleDateString(),
      temperatura: parseFloat(record.temperatura) || 0,
      vibracion: parseFloat(record.vibración) || 0,
      humedad: parseFloat(record.humedad) || 0,
      eficiencia: parseFloat(record.eficiencia_porcentual) || 0,
      fallo: record.fallo_detectado ? 1 : 0,
      maquina: record.maquina_id,
      index: index
    }));
  };

  const prepareMachineData = () => {
    const machineStats = {};
    data.forEach(record => {
      const machine = record.maquina_id;
      if (!machineStats[machine]) {
        machineStats[machine] = {
          name: machine,
          fallos: 0,
          total: 0,
          eficiencia_promedio: 0,
          temperatura_promedio: 0
        };
      }
      machineStats[machine].total++;
      if (record.fallo_detectado) machineStats[machine].fallos++;
      machineStats[machine].eficiencia_promedio += parseFloat(record.eficiencia_porcentual) || 0;
      machineStats[machine].temperatura_promedio += parseFloat(record.temperatura) || 0;
    });
    
    return Object.values(machineStats).map(machine => ({
      ...machine,
      eficiencia_promedio: (machine.eficiencia_promedio / machine.total).toFixed(2),
      temperatura_promedio: (machine.temperatura_promedio / machine.total).toFixed(2),
      porcentaje_fallos: ((machine.fallos / machine.total) * 100).toFixed(2)
    }));
  };

  const chartData = prepareChartData();
  const machineData = prepareMachineData();
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  if (loading) {
    return (
      <div className="industrial-dashboard">
        <div className="loading">Cargando datos industriales...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="industrial-dashboard">
        <div className="error">
          <h2>❌ Error</h2>
          <p>{error}</p>
          <button onClick={loadInitialData}>Reintentar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="industrial-dashboard">
      <div className="dashboard-content">
        <h1>📊 Dashboard Industrial</h1>
        
        {/* Navegación */}
        <div className="dashboard-nav">
          <button 
            className={view === 'data' ? 'active' : ''}
            onClick={() => { setView('data'); loadInitialData(); }}
          >
            📈 Datos Generales
          </button>
          <button 
            className={view === 'charts' ? 'active' : ''}
            onClick={() => setView('charts')}
          >
            📊 Gráficas
          </button>
          <button 
            className={view === 'failures' ? 'active' : ''}
            onClick={loadFailures}
          >
            ⚠️ Fallos Detectados
          </button>
          <button 
            className={view === 'stats' ? 'active' : ''}
            onClick={() => setView('stats')}
          >
            📊 Estadísticas
          </button>
        </div>

        {/* Filtros */}
        {view !== 'stats' && view !== 'charts' && (
          <div className="filters">
            <label>Filtrar por máquina:</label>
            <select 
              value={selectedMachine} 
              onChange={(e) => handleMachineFilter(e.target.value)}
            >
              <option value="all">Todas las máquinas</option>
              {machines.map(machine => (
                <option key={machine} value={machine}>{machine}</option>
              ))}
            </select>
          </div>
        )}

        {/* Vista de Gráficas */}
        {view === 'charts' && (
          <div className="charts-section">
            <h2>📊 Análisis Gráfico de Datos Industriales</h2>
            
            {/* Gráfica de Temperatura y Eficiencia en el Tiempo */}
            <div className="chart-container">
              <h3>🌡️ Temperatura y Eficiencia vs Tiempo</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="temperatura" stroke="#ff7300" name="Temperatura (°C)" />
                  <Line yAxisId="right" type="monotone" dataKey="eficiencia" stroke="#387908" name="Eficiencia (%)" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Gráfica de Vibración y Humedad */}
            <div className="chart-container">
              <h3>💨 Vibración y Humedad</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="vibracion" stackId="1" stroke="#8884d8" fill="#8884d8" name="Vibración" />
                  <Area type="monotone" dataKey="humedad" stackId="2" stroke="#82ca9d" fill="#82ca9d" name="Humedad (%)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Gráfica de Barras por Máquina */}
            <div className="chart-container">
              <h3>🏭 Eficiencia Promedio por Máquina</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={machineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="eficiencia_promedio" fill="#8884d8" name="Eficiencia Promedio (%)" />
                  <Bar dataKey="temperatura_promedio" fill="#82ca9d" name="Temperatura Promedio (°C)" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Gráfica de Pastel - Distribución de Fallos */}
            <div className="chart-container">
              <h3>⚠️ Distribución de Fallos por Máquina</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={machineData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({name, porcentaje_fallos}) => `${name}: ${porcentaje_fallos}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="fallos"
                  >
                    {machineData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Gráfica de Dispersión - Temperatura vs Eficiencia */}
            <div className="chart-container">
              <h3>🎯 Correlación Temperatura vs Eficiencia</h3>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart data={chartData}>
                  <CartesianGrid />
                  <XAxis dataKey="temperatura" name="Temperatura" unit="°C" />
                  <YAxis dataKey="eficiencia" name="Eficiencia" unit="%" />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter name="Datos" data={chartData} fill="#8884d8" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Contenido de Estadísticas */}
        {view === 'stats' && stats && (
          <div className="stats-section">
            <h2>📊 Estadísticas de Eficiencia</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Eficiencia Promedio</h3>
                <p className="stat-value">{stats.promedio?.toFixed(2)}%</p>
              </div>
              <div className="stat-card">
                <h3>Eficiencia Máxima</h3>
                <p className="stat-value">{stats.maximo?.toFixed(2)}%</p>
              </div>
              <div className="stat-card">
                <h3>Eficiencia Mínima</h3>
                <p className="stat-value">{stats.minimo?.toFixed(2)}%</p>
              </div>
              <div className="stat-card">
                <h3>Total Registros</h3>
                <p className="stat-value">{stats.total_registros}</p>
              </div>
              <div className="stat-card">
                <h3>Total Fallos</h3>
                <p className="stat-value">{stats.total_fallos}</p>
              </div>
            </div>
          </div>
        )}

        {view !== 'stats' && view !== 'charts' && (
          <div className="data-section">
            <h2>
              {view === 'failures' ? '⚠️ Fallos Detectados' : '📈 Datos Industriales'}
              <span className="count">({data.length} registros)</span>
            </h2>
            
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Máquina</th>
                    <th>Operador</th>
                    <th>Temperatura</th>
                    <th>Vibración</th>
                    <th>Humedad</th>
                    <th>Eficiencia</th>
                    <th>Fallo</th>
                    <th>Tipo Fallo</th>
                  </tr>
                </thead>
                <tbody>
                  {data.slice(0, 100).map((record, index) => (
                    <tr key={index} className={record.fallo_detectado ? 'failure-row' : ''}>
                      <td>{new Date(record.timestamp).toLocaleString()}</td>
                      <td>{record.maquina_id}</td>
                      <td>{record.operador_id}</td>
                      <td>{record.temperatura}°C</td>
                      <td>{record.vibración}</td>
                      <td>{record.humedad}%</td>
                      <td>{record.eficiencia_porcentual}%</td>
                      <td>
                        <span className={`status ${record.fallo_detectado ? 'failure' : 'ok'}`}>
                          {record.fallo_detectado ? '❌' : '✅'}
                        </span>
                      </td>
                      <td>{record.tipo_fallo || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {data.length > 100 && (
              <p className="note">Mostrando los primeros 100 registros de {data.length} total</p>
            )}
          </div>
        )}
        
        {/* Botón para volver arriba */}
        <div 
          className="scroll-indicator"
          onClick={() => document.querySelector('.industrial-dashboard').scrollTo({top: 0, behavior: 'smooth'})}
          title="Volver arriba"
        >
          ↑
        </div>
      </div>
    </div>
  );
};

export default IndustrialDashboard;