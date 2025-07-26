const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Crear base de datos SQLite
const dbPath = path.join(__dirname, '../chatbot.db');
const db = new sqlite3.Database(dbPath);

// Función para inicializar la base de datos
const initializeDatabase = () => {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Tabla de usuarios
            db.run(`CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`, (err) => {
                if (err) {
                    console.error('Error creando tabla users:', err);
                    return reject(err);
                }
            });
            
            // Tabla de conversaciones
            db.run(`CREATE TABLE IF NOT EXISTS conversations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )`, (err) => {
                if (err) {
                    console.error('Error creando tabla conversations:', err);
                    return reject(err);
                }
            });
            
            // Tabla de mensajes
            db.run(`CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                conversation_id INTEGER NOT NULL,
                content TEXT NOT NULL,
                sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'bot')),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (conversation_id) REFERENCES conversations (id)
            )`, (err) => {
                if (err) {
                    console.error('Error creando tabla messages:', err);
                    return reject(err);
                }
            });
            
            // Tabla de predicciones
            db.run(`CREATE TABLE IF NOT EXISTS predictions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                sensor_data TEXT NOT NULL,
                prediction_result TEXT NOT NULL,
                model_version TEXT DEFAULT '1.0',
                confidence_score REAL DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )`, (err) => {
                if (err) {
                    console.error('Error creando tabla predictions:', err);
                    return reject(err);
                }
                console.log('✅ Base de datos SQLite inicializada exitosamente');
                resolve();
            });
        });
    });
};

console.log('✅ Base de datos SQLite conectada exitosamente');
module.exports = { db, initializeDatabase };