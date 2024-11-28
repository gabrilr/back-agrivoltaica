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
      res.json(dailyAverages); // Devolvemos los resultados de la consulta

  } catch (err) {
    res.status(500).json({ message: 'Error en la consulta a la base de datos', error: err });
  }
});

function rangoOptimoMultivariable(datos, valoresOptimos, N) {
  let mejorInicio = 0;
  let menorScore = Infinity;
  let mejorRango = [];

  for (let i = 0; i <= datos.length - N; i++) {
    const ventana = datos.slice(i, i + N);
    let distancia = 0;

    // Calcula el score usando la distancia euclidiana
    for (const { avg_temp, avg_humedad_suelo, avg_humedad_aire, avg_iluminacion } of ventana) {
      const { temp, humedad_suelo, humedad_aire, iluminacion } = valoresOptimos;
      // Usamos la distancia euclidiana (cuadrado de las diferencias)
      distancia += Math.pow(avg_temp - temp, 2);            // (avg_temp - temp)^2
      distancia += Math.pow(avg_humedad_suelo - humedad_suelo, 2); // (avg_humedad_suelo - humedad_suelo)^2
      distancia += Math.pow(avg_humedad_aire - humedad_aire, 2);  // (avg_humedad_aire - humedad_aire)^2
      distancia += Math.pow(avg_iluminacion - iluminacion, 2);      // (avg_iluminacion - iluminacion)^2
    }

    // Aplica la raíz cuadrada para obtener la distancia euclidiana total
    distancia = Math.sqrt(distancia);

    // Actualiza el mejor rango si el score es menor que el anterior
    if (distancia < menorScore) {
      menorScore = distancia;
      mejorInicio = i;
      mejorRango = ventana;
    }
  }

  // Regresa los días de inicio y final del mejor rango
  const diaInicio = datos[mejorInicio].day;
  const diaFinal = datos[mejorInicio + N - 1].day;
  return { diaInicio, diaFinal, mejorRango };
}


// Endpoint para obtener el rango óptimo
router.post('/rango-optimo', async (req, res) => {
  try {
    // Parámetros de entrada (valores óptimos y tamaño del rango)
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

    // Lógica para encontrar el rango óptimo
    const { diaInicio, diaFinal, mejorRango } = rangoOptimoMultivariable(rows, valoresOptimos, N);
  
    // Respuesta al cliente
    res.json({ diaInicio, diaFinal, mejorRango });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el rango óptimo' });
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
