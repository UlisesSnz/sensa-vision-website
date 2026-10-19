# Publicación e invalidación de Sanity

## Diagnóstico

El [issue #6](https://github.com/UlisesSnz/sensa-website/issues/6) documenta contenido publicado que permaneció antiguo en la web hasta invalidar su etiqueta. La publicación en Content Lake estaba correcta. La dependencia de sesiones conectadas para invalidar es una hipótesis consistente con la implementación anterior, no una causa histórica confirmada: los registros de Vercel del incidente exceden su retención.

`defineLive` de next-sanity 13 mantiene datos publicados en la caché de Next con las etiquetas `sanity:<syncTag>` devueltas por Sanity. La consulta de `siteSettings` comparte navegación y configuración del footer. Se conserva `cacheComponents: false` y las consultas existentes.

## Flujo

1. Content Lake emite `sync-tag-invalidate` para el dataset del stack.
2. La función envía las etiquetas originales a `POST /api/revalidate-tags` con `Authorization: Bearer <secreto privado>`.
3. El endpoint valida y deduplica; expira solamente `sanity:<tag>` mediante `revalidateTag(tag, { expire: 0 })`.
4. Solo tras verificar `{ revalidated: <cantidad> }`, la función llama `done(tags)`.
5. Con el interruptor activo, `SanityLive` espera `function` y refresca las sesiones conectadas. Las nuevas visitas no necesitan una sesión previa para obtener datos frescos.

El endpoint tiene 5 s de timeout por intento; `done` tiene 3 s. Ambos reintentan un máximo de tres veces ante errores de red, 429 o 5xx, con esperas de 500 y 1000 ms. El runtime limita cada ejecución a 30 s. Los registros incluyen etapa, etiquetas, cantidad y duración, nunca credenciales ni cuerpos de error. El objetivo de aceptación es observar el contenido publicado antes de 30 s en condiciones normales; los errores externos se reportan, no se confirman como éxito.

Draft Mode siempre refresca sin invalidar la caché publicada. Con el interruptor desactivado se conserva la invalidación local por eventos para desarrollo y reversión.

Se corrigió además el enlace de salida de Draft Mode: ahora es un enlace HTML sin precarga. El `Link` anterior podía precargar el GET de desactivación y borrar la cookie antes de que el editor pulsara el botón. Este fallo se reprodujo durante la validación de borradores.

## Configuración por entorno

Aplicación (Node 22.20 o compatible con `engines`):

- `SANITY_REVALIDATE_TAGS_SECRET`: secreto privado, distinto en staging y producción.
- `SANITY_SERVER_REVALIDATION_ENABLED`: `false` durante preparación; `true` después de verificar la función.

Sanity Function (Node 24):

- `REVALIDATE_URL`: origen exacto de la aplicación más `/api/revalidate-tags`, sin query string.
- `REVALIDATE_SECRET`: el mismo secreto del endpoint de ese entorno.
- `VERCEL_AUTOMATION_BYPASS_SECRET`: solo para el Preview protegido; se envía como cabecera y no se expone al navegador público.

`sanity.blueprint.ts` exige `SANITY_FUNCTION_DATASET=staging` o `production`. El stack debe corresponder al dataset elegido. Nunca desplegar la configuración de un dataset sobre el stack del otro.

```powershell
$env:SANITY_FUNCTION_DATASET = 'staging'
npx sanity blueprints plan --stack <stack-staging> --project-id e07b8hy0
npx sanity blueprints deploy --stack <stack-staging> --project-id e07b8hy0
```

Configurar los secretos mediante el gestor de variables de Sanity Functions o `sanity functions env add`, evitando historial de shell y registros con sus valores.

## Validación reproducible

Los scripts de QA fijan el proyecto `e07b8hy0` y el dataset `staging`; no aceptan producción como argumento. Los documentos `qa-cache-*` son sintéticos. El archivo ignorado `.env.cache-qa.local` contiene la credencial necesaria para acceder al Preview.

```powershell
npx sanity exec scripts/sanity-cache-qa.mjs --with-user-token -- seed
npx sanity exec tests/integration/sanity-cache.mjs --with-user-token -- baseline https://<preview-anterior>.vercel.app
npx sanity exec tests/integration/sanity-cache.mjs --with-user-token -- verify https://<preview-corregido>.vercel.app
npm run check
```

La prueba HTTP calienta tres rutas, publica una etiqueta visible y cambia el espaciado del footer, consulta sin navegadores conectados y registra la primera respuesta actualizada. Comprueba también aislamiento de inglés. Los informes quedan en `output/playwright/cache-*.json`, sin secretos. Complementar con una sesión, varias pestañas, un borrador y Presentation. No usar purgas manuales, redeploys ni republicaciones durante una medición.

## Activación y reversión

Desplegar primero el endpoint con el interruptor apagado. Crear/configurar la función del dataset, verificar los registros y la cadena publicación → endpoint → lectura; después activar el interruptor y desplegar esa configuración. Validar staging antes de producción. No publicar contenido de prueba en producción.

Para revertir, desactivar primero `SANITY_SERVER_REVALIDATION_ENABLED` y desplegar; después retirar la función. La invalidación por eventos de sesiones vuelve a quedar disponible. No hace falta migrar contenido ni vaciar toda la caché.

## Evidencia de esta entrega

- `npm run check`: 203 pruebas pasan; lint sin errores (20 advertencias anteriores), tipos y build correctos con Node 22.20.0 y npm 10.9.3.
- Dataset staging creado con datos sintéticos en español e inglés; stack `ST-tf5qy276dw` (`sensa-website-staging`).
- Reproducción sobre `82923f1`: tres rutas mantuvieron contenido antiguo durante más de 35 s, con respuestas `HIT` y cero navegadores.
- Función staging: etiquetas reales `s1:L7mrrA,s1:EfDTYA,s1:cKdyUQ`; invalidación y confirmación registradas en 1070 ms en la primera ejecución satisfactoria.
- Publicación sin navegadores: las tres rutas (`/es`, `/es/descargas`, `/es/blog/cache-qa`) actualizadas en **4286 ms**, incluyendo navegación y footer. Inglés sin cambios. El cronómetro monotónico comienza antes de enviar la publicación para evitar diferencias entre relojes.
- Una pestaña: **3651 ms**. Tres pestañas: **4132 ms**, sin recargar manualmente. Draft Mode: **2652 ms**, contenido público aislado y salida manual comprobada. Sin errores de JavaScript.
- Preview probado: rama `codex/corregir-cache-sanity`, commit `dba31a7`; `SANITY_SERVER_REVALIDATION_ENABLED=true`. Informes reproducibles en `output/playwright/cache-verify.json` y `cache-browser.json`.
- Producción: endpoint y función pendientes de activar en la secuencia documentada; el interruptor está preparado en `false`.

Referencias: [integración oficial de Sanity](https://www.sanity.io/docs/functions/sync-tag-function-quickstart), [migración next-sanity 13](https://github.com/sanity-io/next-sanity/blob/main/packages/next-sanity/MIGRATE-v12-to-v13.md), [revalidateTag](https://nextjs.org/docs/app/api-reference/functions/revalidateTag).
