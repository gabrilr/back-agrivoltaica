import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export const authenticateToken = (req, res, next) => {
    // Intentar obtener el header de varias formas para asegurar compatibilidad
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];

    if (!authHeader) {
        console.log('❌ Header Authorization no encontrado');
        return res.status(401).json({ message: 'Token requerido' });
    }
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        console.log('❌ Token vacío después de extraer');
        return res.status(401).json({ message: 'Token requerido' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {

        if (err) {
            console.log('❌ Error verificando token:', err.message);
            return res.status(403).json({ message: 'Token no válido' });
        }
        req.user = user;
        next();
    });
};
