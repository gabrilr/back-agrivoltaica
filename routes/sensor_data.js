import express from 'express';
import { db } from '../database/db.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

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

router.get('/last-data', authenticateToken, async (req, res) => {
  const query = `
    SELECT 
      p.id AS parcela_id, 
      p.nombre AS parcela_nombre, 
      p.mac AS parcela_mac, 
      sd.id AS id, 
      sd.iluminacion, 
      sd.humedad_suelo, 
      sd.iluminacion_2, 
      sd.humedad_suelo_2, 
       
      sd.timestamp 
    FROM parcelas p
    LEFT JOIN sensor_data sd 
      ON p.mac = sd.mac
    WHERE sd.timestamp = (
      SELECT MAX(timestamp) 
      FROM sensor_data 
      WHERE sensor_data.mac = p.mac
    );
  `;
  //sd.temp, 
  //sd.humedad_aire,
  
  try {
    const [results] = await db.query(query);
    res.json(results); // Enviar resultados en la respuesta
  } catch (err) {
    console.error('Error al obtener el último dato de cada parcela:', err);
    res.status(500).json({ error: 'Error al obtener datos', details: err });
  }
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
