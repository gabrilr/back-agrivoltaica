// routes/workerRangoOptimo.js
import { parentPort } from 'worker_threads';

// Función para calcular el rango óptimo
function rangoOptimoMultivariable(datos, valoresOptimos, N) {
  let mejorInicio = 0;
  let menorScore = Infinity;
  let mejorRango = [];

  for (let i = 0; i <= datos.length - N; i++) {
    const ventana = datos.slice(i, i + N);
    let distancia = 0;

    for (const { avg_temp, avg_humedad_suelo, avg_humedad_aire, avg_iluminacion } of ventana) {
      const { temp, humedad_suelo, humedad_aire, iluminacion } = valoresOptimos;
      distancia += Math.pow(avg_temp - temp, 2);
      distancia += Math.pow(avg_humedad_suelo - humedad_suelo, 2);
      distancia += Math.pow(avg_humedad_aire - humedad_aire, 2);
      distancia += Math.pow(avg_iluminacion - iluminacion, 2);
    }

    distancia = Math.sqrt(distancia);

    if (distancia < menorScore) {
      menorScore = distancia;
      mejorInicio = i;
      mejorRango = ventana;
    }
  }

  const diaInicio = datos[mejorInicio].day;
  const diaFinal = datos[mejorInicio + N - 1].day;
  return { diaInicio, diaFinal, mejorRango };
}

// Escuchar mensajes del hilo principal
parentPort.on('message', (message) => {
  console.log('Worker recibió datos:', message); // Verifica que el Worker recibe los datos
  const { datos, valoresOptimos, N } = message;
  const resultado = rangoOptimoMultivariable(datos, valoresOptimos, N);
  console.log('Worker calculó el resultado:', resultado); // Verifica el resultado calculado
  parentPort.postMessage(resultado);
});