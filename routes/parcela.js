import express from 'express';
import { db } from '../database/db.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Obtener todas las parcelas
router.get('/', authenticateToken, async (req, res) => {
  const query = 'SELECT * FROM parcelas';
  
  try {
    const [results] = await db.query(query); // Obtener todas las parcelas
    if (!results) {
      res.json([]); // Enviar resultados en la respuesta
    }
    res.json(results); // Enviar resultados en la respuesta
  } catch (err) {
    console.error('Error al obtener parcelas:', err);
    res.status(500).json({ error: 'Error al obtener parcelas', details: err });
  }
});

// Crear parcela
router.post('/', authenticateToken, async (req, res) => {
  const { nombre, mac } = req.body;

  try {
    const query = 'INSERT INTO parcelas (nombre, mac) VALUES (?, ?)';
    const [result] = await db.query(query, [nombre, mac]); // Insertar nueva parcela

    // Enviar respuesta con los datos insertados
    res.json({ id: result.insertId, nombre, mac });
  } catch (err) {
    // Manejar errores y enviar la respuesta
    console.error('Error al insertar parcela:', err);
    res.status(500).json({ error: 'Error al insertar parcela', details: err });
  }
});

export default router;
