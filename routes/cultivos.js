const express = require('express');
const db = require('../batabase/db');
const authenticateToken = require('../middleware/auth');
const router = express.Router();

// Obtener todos los cultivos
router.get('/', authenticateToken, async (req, res) => {
  const query = 'SELECT * FROM cultivos';
  await db.query(query, (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });43
});

// Crear cultivo
router.post('/', authenticateToken, (req, res) => {
  const { nombre, temp, iluminosidad, humedad_suelo, humedad_aire } = req.body;
  const query = 'INSERT INTO cultivos (nombre, temp, iluminosidad, humedad_suelo, humedad_aire) VALUES (?, ?, ?, ?, ?)';
  db.query(query, [nombre, temp, iluminosidad, humedad_suelo, humedad_aire], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ id: result.insertId, nombre, temp, iluminosidad, humedad_suelo, humedad_aire });
  });
});

// Actualizar cultivo
router.put('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { nombre, temp, iluminosidad, humedad_suelo, humedad_aire } = req.body;
  const query = 'UPDATE cultivos SET nombre = ?, temp = ?, iluminosidad = ?, humedad_suelo = ?, humedad_aire = ? WHERE id = ?';
  db.query(query, [nombre, temp, iluminosidad, humedad_suelo, humedad_aire, id], (err) => {
    if (err) return res.status(500).json(err);
    res.send('Cultivo actualizado');
  });
});

// Eliminar cultivo
router.delete('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM cultivos WHERE id = ?';
  db.query(query, [id], (err) => {
    if (err) return res.status(500).json(err);
    res.send('Cultivo eliminado');
  });
});

module.exports = router;
