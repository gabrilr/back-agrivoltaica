import express from 'express';
import { db } from '../database/db.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
const router = express.Router();

// Obtener todos los cultivos
router.get('/', authenticateToken, async (req, res) => {
  const query = 'SELECT * FROM cultivos';
  
  try {
    const [results] = await db.query(query); // db.query devuelve una promesa
    res.json(results); // Enviar resultados en la respuesta
  } catch (err) {
    console.error('Error al obtener cultivos:', err);
    res.status(500).json({ error: 'Error al obtener cultivos', details: err });
  }
});

// Crear cultivo
router.post('/', authenticateToken, async (req, res) => {
  const { nombre, temp, iluminosidad, humedad_suelo, humedad_aire } = req.body;

  try {
    const query = 'INSERT INTO cultivos (nombre, temp, iluminosidad, humedad_suelo, humedad_aire) VALUES (?, ?, ?, ?, ?)';
    const [result] = await db.query(query, [nombre, temp, iluminosidad, humedad_suelo, humedad_aire]);

    // Enviar respuesta con los datos insertados
    res.json({ id: result.insertId, nombre, temp, iluminosidad, humedad_suelo, humedad_aire });
  } catch (err) {
    // Manejar errores y enviar la respuesta
    console.error('Error al insertar cultivo:', err);
    res.status(500).json({ error: 'Error al insertar cultivo', details: err });
  }
});


// // Actualizar cultivo
// router.put('/:id', authenticateToken, (req, res) => {
//   const { id } = req.params;
//   const { nombre, temp, iluminosidad, humedad_suelo, humedad_aire } = req.body;
//   const query = 'UPDATE cultivos SET nombre = ?, temp = ?, iluminosidad = ?, humedad_suelo = ?, humedad_aire = ? WHERE id = ?';
  
//   db.query(query, [nombre, temp, iluminosidad, humedad_suelo, humedad_aire, id], (err) => {
    
//     if (err) return res.status(500).json(err);
//     res.send('Cultivo actualizado');
//   });
// });

// Eliminar cultivo
router.delete('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM cultivos WHERE id = ?';
  
  db.query(query, [id], (err) => {
    
    if (err) return res.status(500).json(err);

    res.send('Cultivo eliminado');
  });
});

export default router;