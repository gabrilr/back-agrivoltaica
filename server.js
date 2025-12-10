import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import authRoutes from './routes/auth.js';
import cultivosRoutes from './routes/cultivos.js';
import parcelasRoutes from './routes/parcela.js';
import sensor_dataRoutes from './routes/sensor_data.js';

// Cargar variables de entorno
dotenv.config();
const app = express();
// ===== CONFIGURACIÓN DE CORS (PERMISIVO) =====
app.use(cors({
  origin: '*', // Permitir cualquier origen
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Métodos permitidos
  allowedHeaders: ['Content-Type', 'Authorization'], // Cabeceras permitidas
}));

// Middlewares
app.use(morgan('dev'));
app.use(express.json());

// ===== CONEXIÓN AUTOMÁTICA A MQTT =====
// const MQTT_BROKER = process.env.MQTT_BROKER || 'mqtt://localhost:1883';
// const MQTT_OPTIONS = {
//   clientId: 'server_' + Math.random().toString(16).substr(2, 8),
//   reconnectPeriod: 5000, // Reconecta c/5 segundos si se pierde la conexión
// };

let mqttClient = null;

// const connectMqtt = () => {
//   mqttClient = mqtt.connect(MQTT_BROKER, MQTT_OPTIONS);

//   // Manejar eventos de conexión
//   mqttClient.on('connect', () => {
//     console.log('✅ Conectado al broker MQTT:', MQTT_BROKER);
//     // Suscribirse a temas necesarios (opcional)
//     mqttClient.subscribe('sensores/#', (err) => {
//       if (!err) console.log('Suscrito a sensores/#');
//     });
//   });

//   // Manejar errores y reconexión automática
//   mqttClient.on('error', (err) => {
//     console.error('❌ Error en MQTT:', err.message);
//   });

//   mqttClient.on('close', () => {
//     console.log('🔌 Conexión MQTT cerrada. Intentando reconectar...');
//   });

//   mqttClient.on('offline', () => {
//     console.log('📴 MQTT offline. Intentando reconectar...');
//   });
// };

// Iniciar conexión MQTT al arrancar el servidor
// connectMqtt();

// Opcional: Publicar un mensaje de prueba cada minuto
// setInterval(() => {
//   if (mqttClient?.connected) {
//     mqttClient.publish('server/status', 'Servidor activo');
//   }
// }, 60000);

// ===== RUTAS =====
app.use('/auth', authRoutes);
app.use('/cultivos', cultivosRoutes);
app.use('/parcelas', parcelasRoutes);
app.use('/sensores', sensor_dataRoutes);

// Middleware para exponer MQTT en rutas (opcional)
// app.use((req, res, next) => {
//   req.mqttClient = mqttClient; // Pasar el cliente MQTT a las rutas
//   next();
// });

// ===== INICIAR SERVIDOR =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});