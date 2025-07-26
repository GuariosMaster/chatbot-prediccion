import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { chatService } from '../services/api';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import '../styles/chatbot.css';

const ChatsPage = () => {
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]); // Already correct
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [loading, setLoading] = useState(false);
  const { user, logout } = useAuth();

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const response = await chatService.getHistory();
      // Add additional safety check
      setConversations(Array.isArray(response.conversations) ? response.conversations : []);
    } catch (error) {
      console.error('Error al cargar conversaciones:', error);
      // Agregar manejo de error para evitar que el componente se rompa
      setConversations([]);
    }
  };

  const loadMessages = async (conversationId) => {
    try {
      setLoading(true);
      const response = await chatService.getHistory(conversationId);
      setMessages(response.messages || []);
      setCurrentConversationId(conversationId);
    } catch (error) {
      console.error('Error al cargar mensajes:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (messageText) => {
    try {
      const response = await chatService.sendMessage(messageText, currentConversationId);
      
      // Agregar mensajes a la lista
      const newMessages = [response.userMessage, response.botMessage];
      setMessages(prev => [...prev, ...newMessages]);
      
      // Actualizar ID de conversación si es nueva
      if (!currentConversationId) {
        setCurrentConversationId(response.conversationId);
        loadConversations(); // Recargar lista de conversaciones
      }
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
    }
  };

  const startNewConversation = () => {
    setMessages([]);
    setCurrentConversationId(null);
  };

  // Función helper para formatear fechas de manera segura
  const formatDate = (dateString) => {
    if (!dateString) return 'Sin fecha';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  return (
    <div className="chat-container">
      {/* Sidebar con conversaciones */}
      <div className="chat-sidebar">
        <div className="chat-header">
          <h3>Conversaciones</h3>
          <button onClick={startNewConversation} className="new-chat-btn">
            + Nueva
          </button>
        </div>
        
        <div className="conversations-list">
          {Array.isArray(conversations) && conversations.map(conv => (
            <div 
              key={conv.id}
              className={`conversation-item ${currentConversationId === conv.id ? 'active' : ''}`}
              onClick={() => loadMessages(conv.id)}
            >
              <div className="conversation-title">{conv.title || 'Sin título'}</div>
              <div className="conversation-date">
                {formatDate(conv.last_message_at)}
              </div>
            </div>
          ))}
        </div>
        
        <div className="user-info">
          <span>Hola, {user?.username || 'Usuario'}</span>
          <button onClick={logout} className="logout-btn">Salir</button>
        </div>
      </div>
      
      {/* Área principal de chat */}
      <div className="chat-main">
        <div className="chat-header">
          <h2 className="chat-title">Chatbot de Predicción de Fallos</h2>
          <div className="chat-actions">
            <button 
              onClick={() => window.location.href = '/predictions'}
              className="prediction-btn"
            >
              📊 Predicciones
            </button>
            <button 
              onClick={() => window.location.href = '/dashboard'}
              className="dashboard-btn"
            >
              🏭 Dashboard Industrial
            </button>
          </div>
        </div>
        
        {loading ? (
          <div className="loading">Cargando mensajes...</div>
        ) : (
          <MessageList messages={messages} />
        )}
        
        <MessageInput onSendMessage={handleSendMessage} />
      </div>
    </div>
  );
};

export default ChatsPage;