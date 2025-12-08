import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

export const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

// Verificar la conexión al iniciar la aplicación
export const verifyConnection = async () => {
    try {
        const connection = await db.getConnection();
        console.log('✅ Conectado a la base de datos MySQL');
        connection.release();
    } catch (error) {
        console.error('❌ Error al conectar a la base de datos MySQL:', error.message);
        process.exit(1); // Salir de la aplicación si no se puede conectar
    }
};