import autocannon from 'autocannon';
import { spawn } from 'child_process';
import http from 'http';

/**
 * Sesión 30 · Medición de Carga Básica
 * Pregunta: ¿Cómo responde la ruta pública GET /v1/courses bajo 10 conexiones concurrentes?
 * Parámetros:
 * - URL: http://localhost:3000/v1/courses
 * - Conexiones concurrentes: 10
 * - Duración: 5 segundos
 * - Límite de alerta: latencia p97.5 > 200ms o tasa de error > 1%
 */

const targetUrl = process.env.TARGET_URL || 'http://localhost:3000/v1/courses';

function probe(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1500, () => {
      req.destroy();
      resolve(false);
    });
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log('='.repeat(70));
  console.log('📊 PRUEBA DE CARGA CONTROLADA (Sesión 30)');
  console.log('='.repeat(70));
  console.log(`🎯 Ruta observada:   ${targetUrl}`);
  console.log(`⚡ Concurrencia:     10 conexiones simultáneas`);
  console.log(`⏱️  Duración:         5 segundos`);
  console.log(`🧪 Entorno:          Local autorizado de desarrollo`);
  console.log('='.repeat(70));

  let spawnedProcess = null;
  const isRunning = await probe(targetUrl);

  if (!isRunning) {
    console.log('ℹ️  Servidor no detectado en puerto 3000. Levantando instancia temporal...');
    spawnedProcess = spawn('node', ['dist/main.js'], {
      stdio: 'ignore',
      detached: false,
    });

    let ready = false;
    for (let i = 0; i < 15; i++) {
      await sleep(1000);
      ready = await probe(targetUrl);
      if (ready) break;
    }

    if (!ready) {
      console.error('❌ No se pudo conectar al servidor. Verifica que tu base de datos PostgreSQL esté activa.');
      if (spawnedProcess) spawnedProcess.kill();
      process.exit(1);
    }
    console.log('✅ Servidor temporal listo en http://localhost:3000\n');
  } else {
    console.log('✅ Servidor activo detectado en http://localhost:3000\n');
  }

  console.log('⏳ Ejecutando carga controlada (5 segundos)...');

  autocannon(
    {
      url: targetUrl,
      connections: 10,
      duration: 5,
      headers: {
        Accept: 'application/json',
      },
    },
    (err, result) => {
      if (spawnedProcess) {
        spawnedProcess.kill();
      }

      if (err) {
        console.error('❌ Error durante la ejecución de la prueba:', err);
        process.exit(1);
      }

      console.log('\n' + autocannon.printResult(result));

      const p97 = result.latency['p97_5'] ?? result.latency.p99 ?? result.latency.average ?? 0;
      const latencyPassed = p97 < 200;
      const errorRatePassed = result.non2xx === 0 && result.timeouts === 0 && result.errors === 0;

      console.log('='.repeat(70));
      console.log('📋 EVALUACIÓN DE CRITERIOS DE CALIDAD:');
      console.log(`  [${latencyPassed ? '✓' : '✗'}] Latencia percentil 97.5% < 200ms (${p97} ms)`);
      console.log(`  [${errorRatePassed ? '✓' : '✗'}] Cero errores y timeouts (${result.non2xx} errores, ${result.timeouts} timeouts)`);
      console.log(`  [✓] Peticiones completadas: ${result.requests.total} (${result.requests.average} req/seg)`);

      if (latencyPassed && errorRatePassed && result.requests.total > 0) {
        console.log('\n🟢 CONCLUSIÓN: La ruta pública cumple los acuerdos de nivel de servicio (SLA) bajo carga controlada.');
      } else {
        console.log('\n🟡 OBSERVACIÓN: Se recomienda investigar puntos de saturación o índices de base de datos.');
      }
      console.log('='.repeat(70));
      process.exit(0);
    },
  );
}

main();
