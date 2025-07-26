const express = require('express');
const { db } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

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

const getQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
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

// POST /api/chat/send
router.post('/send', authenticateToken, async (req, res) => {
  try {
    const { message, conversationId } = req.body;
    const userId = req.user.userId;
    
    if (!message) {
      return res.status(400).json({ error: 'Mensaje es requerido' });
    }

    let currentConversationId = conversationId;
    
    // Si no hay conversación, crear una nueva
    if (!currentConversationId) {
      const result = await runQuery(
        'INSERT INTO conversations (user_id, title) VALUES (?, ?)',
        [userId, message.substring(0, 50) + '...']
      );
      currentConversationId = result.lastID;
    }
    
    // Verificar que currentConversationId no sea null o undefined
    if (!currentConversationId) {
      throw new Error('No se pudo crear o encontrar la conversación');
    }

    // Guardar mensaje del usuario
    const userResult = await runQuery(
      'INSERT INTO messages (conversation_id, content, sender_type) VALUES (?, ?, ?)',
      [currentConversationId, message, 'user']
    );
    
    // Obtener el mensaje del usuario insertado
    const userMessage = await getQuery(
      'SELECT * FROM messages WHERE id = ?',
      [userResult.lastID]
    );
    
    // Generar respuesta del bot
    let botResponse = 'Gracias por tu mensaje. ¿En qué más puedo ayudarte?';
    
    // Si el mensaje contiene palabras clave relacionadas con fallos, sugerir predicción
    if (message.toLowerCase().includes('fallo') || 
        message.toLowerCase().includes('predicción') || 
        message.toLowerCase().includes('mantenimiento')) {
      botResponse = 'Veo que estás interesado en predicción de fallos. ¿Te gustaría que analice algunos datos de sensores para predecir posibles fallos?';
    }
    
    // Guardar respuesta del bot
    const botResult = await runQuery(
      'INSERT INTO messages (conversation_id, content, sender_type) VALUES (?, ?, ?)',
      [currentConversationId, botResponse, 'bot']
    );
    
    // Obtener el mensaje del bot insertado
    const botMessage = await getQuery(
      'SELECT * FROM messages WHERE id = ?',
      [botResult.lastID]
    );
    
    res.json({
      conversationId: currentConversationId,
      userMessage: userMessage,
      botMessage: botMessage
    });
  } catch (error) {
    console.error('Error al enviar mensaje:', error);
    res.status(500).json({ error: 'Error interno del servidor', details: error.message });
  }
});

// GET /api/chat/history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { conversationId, limit = 50 } = req.query;
    
    if (conversationId) {
      // Obtener mensajes de una conversación específica
      const messages = await allQuery(`
        SELECT m.*, c.title as conversation_title 
        FROM messages m 
        JOIN conversations c ON m.conversation_id = c.id 
        WHERE c.user_id = ? AND m.conversation_id = ? 
        ORDER BY m.created_at ASC 
        LIMIT ?
      `, [userId, conversationId, limit]);
      
      res.json({ messages });
    } else {
      // Obtener todas las conversaciones del usuario
      const conversations = await allQuery(`
        SELECT c.*, 
               COUNT(m.id) as message_count,
               MAX(m.created_at) as last_message_at
        FROM conversations c 
        LEFT JOIN messages m ON c.id = m.conversation_id 
        WHERE c.user_id = ? 
        GROUP BY c.id 
        ORDER BY last_message_at DESC
      `, [userId]);
      
      res.json({ conversations });
    }
  } catch (error) {
    console.error('Error al obtener historial:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;