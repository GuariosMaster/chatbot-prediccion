import React from 'react';

const Message = ({ message, isUser }) => {
  // Función para formatear fecha de manera segura
  const formatTimestamp = (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (error) {
      console.error('Error al formatear fecha:', error);
      return '';
    }
  };

  return (
    <div className={`message ${isUser ? 'user' : 'bot'}`}>
      <div className="message-content">
        {message.content}
      </div>
      <div className="message-timestamp">
        {formatTimestamp(message.created_at)}
      </div>
    </div>
  );
};

export default Message;