import autocannon from 'autocannon';

/**
 * Sesión 30 · Medición de Carga Básica
 * Pregunta: ¿Cómo responde la ruta pública GET /v1/courses bajo 10 conexiones concurrentes?
 * Parámetros:
 * - URL: http://localhost:3000/v1/courses
 * - Conexiones concurrentes: 10
 * - Duración: 5 segundos
 * - Límite de alerta: latencia p95 > 200ms o tasa de error > 1%
 */

const targetUrl = process.env.TARGET_URL || 'http://localhost:3000/v1/courses';

console.log('='.repeat(70));
console.log('📊 INICIANDO PRUEBA DE CARGA CONTROLADA (Sesión 30)');
console.log('='.repeat(70));
console.log(`🎯 Ruta observada:   ${targetUrl}`);
console.log(`⚡ Concurrencia:     10 conexiones simultáneas`);
console.log(`⏱️  Duración:         5 segundos`);
console.log(`🧪 Entorno:          Local autorizado de desarrollo`);
console.log('='.repeat(70));

const instance = autocannon(
  {
    url: targetUrl,
    connections: 10,
    duration: 5,
    headers: {
      'Accept': 'application/json',
    },
  },
  (err, result) => {
    if (err) {
      console.error('❌ Error durante la ejecución de la prueba:', err);
      process.exit(1);
    }

    console.log('\n📈 RESULTADOS DE LA MEDICIÓN:');
    console.log(`  • Peticiones totales:     ${result.requests.total}`);
    console.log(`  • Rendimiento medio:      ${result.requests.average} req/seg`);
    console.log(`  • Latencia Media:         ${result.latency.average} ms`);
    console.log(`  • Latencia p50 (Mediana): ${result.latency.p50} ms`);
    console.log(`  • Latencia p95:           ${result.latency.p95} ms`);
    console.log(`  • Latencia p99:           ${result.latency.p99} ms`);
    console.log(`  • Errores 4xx/5xx:        ${result.non2xx}`);
    console.log(`  • Timeouts:               ${result.timeouts}`);

    console.log('\n📋 EVALUACIÓN DE CRITERIOS:');
    const latencyPassed = result.latency.p95 < 200;
    const errorRatePassed = result.non2xx === 0 && result.timeouts === 0;

    console.log(`  [${latencyPassed ? '✓' : '✗'}] Latencia p95 < 200ms (${result.latency.p95}ms)`);
    console.log(`  [${errorRatePassed ? '✓' : '✗'}] Cero errores y timeouts (${result.non2xx} errores)`);

    if (latencyPassed && errorRatePassed) {
      console.log('\n🟢 CONCLUSIÓN: La ruta cumple los acuerdos de nivel de servicio bajo carga controlada.');
    } else {
      console.log('\n🟡 OBSERVACIÓN: Se recomienda investigar puntos de saturación o índices de base de datos.');
    }
    console.log('='.repeat(70));
  },
);

autocannon.track(instance, { renderProgressBar: true });
