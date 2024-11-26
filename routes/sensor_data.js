import express from 'express';
import { db } from '../database/db.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Ruta para obtener datos promedio por día para los últimos 100 días
router.post('/', async (req, res) => {
  const { mac } = req.body; // Recibimos la 'mac' desde el cuerpo de la solicitud

  if (!mac) {
    return res.status(400).json({ message: 'La "mac" es requerida.' });
  }

  try {
    const [dailyAverages] = await db.query(`
      SELECT 
        DATE(timestamp) AS day,
        ROUND(AVG(iluminacion), 2) AS avg_iluminacion,
        ROUND(AVG(humedad_suelo), 2) AS avg_humedad_suelo,
        ROUND(AVG(humedad_aire), 2) AS avg_humedad_aire,
        ROUND(AVG(temp), 2) AS avg_temp
      FROM sensor_data 
      WHERE mac = ?
      GROUP BY DATE(timestamp)
      ORDER BY day ASC;
    `, [mac]);
      res.json(dailyAverages); // Devolvemos los resultados de la consulta

  } catch (err) {
    res.status(500).json({ message: 'Error en la consulta a la base de datos', error: err });
  }
});

//OBTENEMOS EL MEJOR RANGO POSIBLE DE TODOS LOS DIAS
router.post('/rango-optimo', async (req, res) => {
  const { rango, mac, iluminacion_optima, humedad_suelo_optima, humedad_aire_optima, temp_optima } = req.body;

  if (!rango || !mac || !iluminacion_optima || !humedad_suelo_optima || !humedad_aire_optima || !temp_optima) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  const valoresOptimos = {
    iluminacion: parseFloat(iluminacion_optima),
    humedad_suelo: parseFloat(humedad_suelo_optima),
    humedad_aire: parseFloat(humedad_aire_optima),
    temp: parseFloat(temp_optima),
  };

  const ponderaciones = {
    iluminacion: 0.4,
    humedad_suelo: 0.3,
    humedad_aire: 0.2,
    temp: 0.1,
  };

  try {
    const [dailyAverages] = await db.query(`
      SELECT 
        DATE(timestamp) AS day,
        ROUND(AVG(iluminacion), 2) AS avg_iluminacion,
        ROUND(AVG(humedad_suelo), 2) AS avg_humedad_suelo,
        ROUND(AVG(humedad_aire), 2) AS avg_humedad_aire,
        ROUND(AVG(temp), 2) AS avg_temp
      FROM sensor_data 
      WHERE mac = ?
      GROUP BY DATE(timestamp)
      ORDER BY day ASC;
    `, [mac]);

    if (dailyAverages.length === 0) {
      return res.status(404).json({ error: 'No se encontraron datos para la MAC proporcionada' });
    }

    const scores = dailyAverages.map(dayData => {
      const score =
        ponderaciones.iluminacion * (1 - Math.abs(dayData.avg_iluminacion - valoresOptimos.iluminacion) / valoresOptimos.iluminacion) +
        ponderaciones.humedad_suelo * (1 - Math.abs(dayData.avg_humedad_suelo - valoresOptimos.humedad_suelo) / valoresOptimos.humedad_suelo) +
        ponderaciones.humedad_aire * (1 - Math.abs(dayData.avg_humedad_aire - valoresOptimos.humedad_aire) / valoresOptimos.humedad_aire) +
        ponderaciones.temp * (1 - Math.abs(dayData.avg_temp - valoresOptimos.temp) / valoresOptimos.temp);

      return { ...dayData, score };
    });

    let bestRange = null;
    let maxScore = -Infinity;

    for (let i = 0; i <= scores.length - rango; i++) {
      const range = scores.slice(i, i + rango);
      const isConsecutive = range.every((day, index) => {
        if (index === 0) return true;
        const prevDate = new Date(range[index - 1].day);
        const currDate = new Date(day.day);
        return (currDate - prevDate) === 86400000;
      });

      if (!isConsecutive) continue;

      const rangeScore = range.reduce((sum, day) => sum + day.score, 0);

      if (rangeScore > maxScore) {
        maxScore = rangeScore;
        bestRange = range;
      }
    }

    if (!bestRange) {
      return res.status(404).json({ error: 'No se encontró un rango consecutivo óptimo' });
    }

    res.json({
      rango: {
        inicio: bestRange[0].day.toISOString().split('T')[0],
        fin: bestRange[bestRange.length - 1].day.toISOString().split('T')[0],
      },
      detalles: bestRange.map(day => ({
        ...day,
        day: day.day.toISOString().split('T')[0] // Ajustar el formato de fecha
      })),
    });
  } catch (err) {
    console.error('Error al calcular el rango óptimo:', err);
    res.status(500).json({ error: 'Error al calcular el rango óptimo', details: err });
  }
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
      sd.temp, 
      sd.humedad_aire, 
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
