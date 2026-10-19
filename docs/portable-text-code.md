# Código en Portable Text

El campo compartido `block-content` admite bloques nativos de `@sanity/code-input@7.3.13` en artículos y en los demás módulos que ya usan Portable Text. La implementación toma como referencia los lenguajes y los temas de Portfolio Next.js V2. No requiere migración: conserva `_type`, `_key`, `code`, `language`, `filename` y `highlightedLines`.

## Edición

En el editor, abrir el menú de inserción (los tres puntos cuando falta espacio) y elegir **Código / Code**. Seleccionar lenguaje, escribir el código y, opcionalmente, el nombre del archivo. El editor nativo permite marcar líneas. El contenido vacío no se muestra durante la edición y bloquea la publicación hasta completarlo.

Lenguajes: texto, JavaScript, TypeScript, TSX, HTML, CSS, Bash, npm, Yarn, pnpm, Python y JSON. Los gestores de paquetes usan la gramática de shell. Los valores desconocidos se muestran como texto escapado. Esta entrega no añade código en línea ni ejecuta ejemplos.

## Renderizado y accesibilidad

`shiki@4.5.0` se inicializa sincrónicamente una sola vez por instancia de servidor, con el motor JavaScript, ocho gramáticas y los temas `one-light` / `one-dark-pro`. Ambos temas comparten el mismo HTML mediante variables CSS. Si el resaltador falla, React conserva el texto escapado y las líneas destacadas.

El botón de copiar es un componente cliente pequeño con estados accesibles en español e inglés. Copia el contenido original, incluidos espacios y saltos, tras retirar las anotaciones invisibles de Sanity. Los bloques largos tienen desplazamiento local y foco visible. Dentro de un carrusel, las flechas y el arrastre sobre el código pertenecen al bloque.

Lottie y Timeline reciben el contenido ya renderizado desde componentes de servidor; solo la reproducción y las animaciones permanecen en el cliente. Video puede renderizarse en servidor. Las tarjetas con código separan el enlace de sus controles, y los carruseles no truncan bloques de código ni tablas.

## Validación reproducible

Usar Node 22.20.0 o una versión del rango declarado, npm 10.9.3 y un navegador Edge instalado. `PLAYWRIGHT_MODULE_PATH` puede apuntar al `index.mjs` de una instalación disponible de Playwright.

```powershell
npx sanity exec scripts/sanity-code-qa.mjs --with-user-token
node tests/integration/portable-text-code.mjs http://localhost:3000
npm run check
```

Para el servidor local, establecer `NEXT_PUBLIC_SANITY_DATASET=staging`, `ENABLED_LOCALES=es,en` y `NEXT_PUBLIC_SITE_ENV=development`. El generador de datos está fijado a staging y solo crea documentos sintéticos `qa-code-*`. Nunca ejecuta publicaciones en producción. Para un Preview protegido, la prueba lee la credencial de acceso desde `.env.cache-qa.local`, ignorado por Git.

La prueba de navegador cubre español e inglés, 1440 y 390 píxeles, ambos temas, copia y su error, HTML literal, lenguaje desconocido, líneas destacadas, FAQ, tarjetas, carrusel, montaje de video/Lottie y animación de Timeline. Los informes y capturas quedan en `output/playwright/code-*`. El iframe de video utiliza un identificador sintético: se verifica su montaje y configuración, no reproducción desde YouTube.

Resultado: **226 pruebas unitarias**, lint sin errores (19 advertencias existentes), tipos y build correctos. La prueba de navegador pasó sus ocho combinaciones sin errores de JavaScript ni desbordamiento horizontal de la página. Se comprobó en el Studio real la inserción de un bloque TSX, edición, publicación, reapertura y bloqueo de publicación de un bloque vacío.

Presentation mostró los 14 bloques del artículo de prueba y actualizó una edición sin publicar dentro de su iframe. La lectura pública conservó la versión publicada y el botón de salida de Draft Mode permaneció oculto dentro de Presentation.

La compilación pública no contiene `createHighlighterCore`, `ShikiError` ni `oniguruma-to-es` en `.next/static/chunks`, ni referencias a `highlight-code` en los manifiestos cliente. El entorno local de pruebas de tablas sí importa deliberadamente el renderer para probar el mismo marcado; no es una ruta pública de la aplicación.
