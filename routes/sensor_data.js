import express from 'express';
import { db } from '../database/db.js';

const router = express.Router();

// Ruta para obtener datos de los últimos 100 días
router.get('/', (req, res) => {
    const query = `
      SELECT * FROM sensores_data
      WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 100 DAY)
      ORDER BY timestamp ASC
    `;
  
    db.query(query, (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Error en la consulta a la base de datos', error: err });
      }
  
      res.json(results);
    });
});

// Ruta para obtener datos por rango de fechas
router.get('/inrange', (req, res) => {
  const { startDate, endDate } = req.query;

  // Validar que se envíen las fechas
  if (!startDate || !endDate) {
    return res.status(400).json({ message: 'Se requieren startDate y endDate en formato YYYY-MM-DD' });
  }

  // Consulta SQL para filtrar por rango de fechas
  const query = `
    SELECT * FROM sensores_data
    WHERE timestamp BETWEEN ? AND ?
    ORDER BY timestamp ASC
  `;

  db.query(query, [startDate, endDate], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Error en la consulta a la base de datos', error: err });
    }

    res.json(results);
  });
});

export default router;
