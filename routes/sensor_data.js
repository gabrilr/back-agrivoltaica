// routes/sensor_data.js
import express from 'express';
import { db } from '../database/db.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { Worker } from 'worker_threads'; // Importar el módulo Worker
import path from 'path';

const router = express.Router();

// Ruta para obtener datos promedio por día para los últimos 100 días
router.post('/', async (req, res) => {
  const { mac } = req.body;

  if (!mac) {
    return res.status(400).json({ message: 'La "mac" es requerida.' });
  }

  try {
    const [dailyAverages] = await db.query(`
      SELECT 
        DATE_FORMAT(timestamp, '%Y-%m-%d') AS day,
        ROUND(AVG(iluminacion), 2) AS avg_iluminacion,
        ROUND(AVG(humedad_suelo), 2) AS avg_humedad_suelo,
        ROUND(AVG(humedad_aire), 2) AS avg_humedad_aire,
        ROUND(AVG(temp), 2) AS avg_temp
      FROM sensor_data 
      WHERE mac = ?
      GROUP BY DATE(timestamp)
      ORDER BY day ASC;
    `, [mac]);
    res.json(dailyAverages);

  } catch (err) {
    res.status(500).json({ message: 'Error en la consulta a la base de datos', error: err });
  }
});

// Endpoint para obtener el rango óptimo
router.post('/rango-optimo', async (req, res) => {
  try {
    const { mac, temp_optima, humedad_suelo_optima, humedad_aire_optima, iluminacion_optima, rango } = req.body;
    const valoresOptimos = {
      temp: parseFloat(temp_optima),
      humedad_suelo: parseFloat(humedad_suelo_optima),
      humedad_aire: parseFloat(humedad_aire_optima),
      iluminacion: parseFloat(iluminacion_optima),
    };

    const N = parseInt(rango, 10);

    // Consulta a la base de datos
    const [rows] = await db.query(`
      SELECT 
        DATE_FORMAT(timestamp, '%Y-%m-%d') AS day,
        ROUND(AVG(iluminacion), 2) AS avg_iluminacion,
        ROUND(AVG(humedad_suelo), 2) AS avg_humedad_suelo,
        ROUND(AVG(humedad_aire), 2) AS avg_humedad_aire,
        ROUND(AVG(temp), 2) AS avg_temp
      FROM sensor_data 
      WHERE mac = ?
      GROUP BY DATE(timestamp)
      ORDER BY day ASC;
    `, [mac]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'No se encontraron datos para el rango solicitado.' });
    }

    // Crear un Worker y enviarle los datos
    const worker = new Worker(path.resolve('./routes/workerRangoOptimo.js'));
    worker.postMessage({ datos: rows, valoresOptimos, N });

    // Escuchar el resultado del Worker
    worker.on('message', (resultado) => {
      res.json(resultado); // Enviar respuesta al cliente
    });

    // Manejar errores del Worker
    worker.on('error', (error) => {
      console.error('Error en el Worker:', error);
      res.status(500).json({ error: 'Error en el cálculo del rango óptimo' });
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el rango óptimo' });
  }
});

// Otras rutas...
export default router;