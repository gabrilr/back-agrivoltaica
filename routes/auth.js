import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { db } from '../database/db.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Registro de usuario
router.post('/register', async (req, res) => {
    const {
        usuario,
        contrasena,
        categoria
    } = req.body;

    try {
        // Verificar si el usuario ya existe
        const [existingUser] = await db.query('SELECT * FROM usuarios WHERE usuario = ?', [usuario]);
        if (existingUser.length > 0) {
            return res.status(400).json({ message: 'El usuario ya existe' });
        }

        // Encriptar contraseña
        const hashedPassword = await bcrypt.hash(contrasena, 10);
        // Guardar usuario en la base de datos
        await db.query(
            'INSERT INTO usuarios (usuario, contrasena, categoria) VALUES (?, ?, ?)',
            [usuario, hashedPassword, categoria]
        );

        res.status(201).json({ message: 'Usuario registrado con éxito' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al registrar el usuario' });
    }
});

// Inicio de sesión
router.post('/login', async (req, res) => {
    const { usuario, contrasena } = req.body;


    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(contrasena, 10);
    try {
        // Buscar usuario
        const [users] = await db.query('SELECT * FROM usuarios WHERE usuario = ?', [usuario]);

        if (users.length === 0) {
            return res.status(400).json({ message: 'Usuario o contraseña incorrectos' });
        }

        const user = users[0];
        const passwordMatch = await bcrypt.compare(contrasena, user.contrasena);

        if (!passwordMatch) {
            return res.status(400).json({ message: 'Usuario o contraseña incorrectos' });
        }

        // Generar token JWT
        const token = jwt.sign(
            {
                idusuario: user.idusuario,
                usuario: user.usuario,
                categoria: user.categoria
            },
            process.env.JWT_SECRET, { expiresIn: '10h' }
        );
        res.json({ token });
        //res.json({ token, categoria: user.categoria });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al iniciar sesión' });
    }
});


export default router;
