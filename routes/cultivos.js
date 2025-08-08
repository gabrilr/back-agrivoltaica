import express from 'express';
import { db } from '../database/db.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Obtener todos los cultivos
router.get('/', authenticateToken, async (req, res) => {
    const query = 'SELECT * FROM cultivos';
    
    try {
        const [results] = await db.query(query);
        res.json(results);
    } catch (err) {
        console.error('Error al obtener cultivos:', err);
        res.status(500).json({ error: 'Error al obtener cultivos', details: err });
    }
});

// Crear cultivo
router.post('/', authenticateToken, async (req, res) => {
    const { nombre, temp, iluminosidad, humedad_suelo, humedad_aire } = req.body;

    // Validación básica
    if (!nombre || !temp || !iluminosidad || !humedad_suelo || !humedad_aire) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    try {
        const query = 'INSERT INTO cultivos (nombre, temp, iluminosidad, humedad_suelo, humedad_aire) VALUES (?, ?, ?, ?, ?)';
        const [result] = await db.query(query, [nombre, temp, iluminosidad, humedad_suelo, humedad_aire]);
        res.json({ id: result.insertId, nombre, temp, iluminosidad, humedad_suelo, humedad_aire });
    } catch (err) {
        console.error('Error al insertar cultivo:', err);
        res.status(500).json({ error: 'Error al insertar cultivo', details: err });
    }
});

// Actualizar cultivo
router.put('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { nombre, temp, iluminosidad, humedad_suelo, humedad_aire } = req.body;

    // Validación básica
    if (!nombre || !temp || !iluminosidad || !humedad_suelo || !humedad_aire) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    try {
        const query = 'UPDATE cultivos SET nombre = ?, temp = ?, iluminosidad = ?, humedad_suelo = ?, humedad_aire = ? WHERE id = ?';
        await db.query(query, [nombre, temp, iluminosidad, humedad_suelo, humedad_aire, id]);
        res.json({ message: 'Cultivo actualizado correctamente' });
    } catch (err) {
        console.error('Error al actualizar cultivo:', err);
        res.status(500).json({ error: 'Error al actualizar cultivo', details: err });
    }
});

// Eliminar cultivo
router.delete('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;

    try {
        const query = 'DELETE FROM cultivos WHERE id = ?';
        await db.query(query, [id]);
        res.json({ message: 'Cultivo eliminado correctamente' });
    } catch (err) {
        console.error('Error al eliminar cultivo:', err);
        res.status(500).json({ error: 'Error al eliminar cultivo', details: err });
    }
});

export default router;