# Actualización local de Sanity 6

Verificación local realizada el 7 de octubre de 2026, sin incluir un despliegue
ni la validación de un entorno desplegado.

## Versiones instaladas

| Dependencia | Versión |
| --- | --- |
| `sanity`, `@sanity/vision` | `6.18.0` |
| `@sanity/document-internationalization` | `6.2.39` |
| `react`, `react-dom` | `19.2.8` |
| `sanity-plugin-internationalized-array` (transitiva) | `5.3.2` |
| `@sanity/language-filter` (transitiva) | `5.0.19` |

Se mantienen Next.js `16.3.8`, `next-sanity` `13.1.1`, `@sanity/client`
`7.23.1`, `@sanity/orderable-document-list` `2.0.12` y `@sanity/ui` `3.3.5`.
El lockfile conserva las versiones de las demás dependencias directas.
La UI 4 requerida internamente por Sanity coexiste con la UI 3 de los
componentes personalizados.

El árbol resuelto incorpora `@sanity/cli@8.14.0` y `skills@1.7.1`;
este último exige Node `>=22.20.0`. Por ello se actualizan `.nvmrc` y
`engines.node` a Node `22.20.0` y `>=22.20 <23`, respectivamente.
Las comprobaciones se ejecutaron con Node `22.20.0` y npm `10.9.3`,
mediante un runtime en la caché de npm; no se reemplazó el Node global.

La instalación se realizó retirando primero el plugin antiguo de
internacionalización y reinstalando la combinación prevista con versiones
exactas. No se usaron `--force`, `--legacy-peer-deps` ni overrides.

## Internacionalización y contenido

Los elementos nuevos de `translations[]` incluyen `language` y una `_key`
independiente del idioma. Al reutilizar un elemento, el script conserva su
clave y los atributos de su referencia. La lectura admite el formato anterior
y conserva referencias incluso cuando su documento no se puede resolver.
La lógica está aislada en `scripts/lib/translation-metadata.mjs` para probarla
sin ejecutar la migración.

Se conservan las protecciones de confirmación y respaldo del script.
No se ejecutó `migrate-i18n.mjs`, ni siquiera en modo dry-run, ni se generó
contenido en inglés. Las consultas públicas, las rutas, el método de
autenticación por token, Strict Mode y la versión de la API no cambiaron.
El Studio utiliza la búsqueda predeterminada de Sanity 6 (`groq2024`).

Antes de instalar se confirmó que `production` contenía cero documentos
`translation.metadata`. La verificación final también encontró cero metadatos
y cero documentos con `language == "en"`.

Para QA se creó únicamente el borrador español
`drafts.80d86409-3283-4677-b61c-2d0e59ef12b9`, titulado
“QA Sanity 6 temporal”. Nunca se publicó y se eliminó desde el Studio al
terminar. La consulta final confirmó que no existe ni su ID de borrador ni
su ID publicado. Los 79 documentos de contenido originales conservan los
mismos `_id` y `_rev` que antes de la prueba.

## Validación

- `npm ci`: instalación limpia correcta con el nuevo runtime.
- Árbol instalado: sin dependencias peer incompatibles no opcionales.
- `npm run check`: correcto; TypeScript y `next build` pasan, con 26 páginas
  estáticas generadas. ESLint conserva 20 advertencias, sin errores.
- Pruebas: 134 aprobadas en 15 archivos, incluidas seis pruebas nuevas de
  compatibilidad de metadatos, conservación de referencias y estabilidad de claves.
- Navegador Edge: sesión autenticada existente, estructura por idioma,
  listado ordenable, búsqueda de “Métricas” y Vision comprobados.
- Borrador: Portable Text con negritas, selección de una imagen existente,
  guardado, recarga y persistencia comprobados. Una ancla inválida bloqueó
  Publish y la corrección eliminó ese bloqueo, sin pulsar Publish.
- Componente personalizado de enlace opcional: agregar y quitar enlace
  comprobados dentro de una tarjeta del borrador.
- Presentation: apertura del borrador, selección visual del título y
  actualización en vivo comprobadas.
- Sitio público: inicio y precios en escritorio; menú, blog y artículo en
  viewport móvil de 390 × 844. El artículo no presentó desbordamiento
  horizontal ni imágenes rotas. Se desactivó el modo borrador y se restableció
  el viewport al finalizar.
- Desktop releases: estructura accesible y lista vacía. No hubo pruebas de
  subida de instaladores ni operaciones de carga a R2.

### Avisos de desarrollo observados

La consola no queda libre de avisos. React informa de claves ausentes en los
listados de bloques y tarjetas. `components/blocks.tsx` y
`components/ui/grid/grid-row.tsx` utilizan `block._key`, pero las proyecciones
correspondientes omiten `_key`. Estos archivos ya tenían esa configuración y
permanecen sin cambios en esta actualización. También aparece el aviso de
Sanity sobre filtros de listas sin `apiVersion` explícita en `sanity/structure.ts`.

Durante la sesión de desarrollo aparecieron además advertencias de
styled-components sobre props reenviadas al DOM y de listeners de compresión
en Next, así como peticiones a `/favicon.ico` con respuesta 404. No impidieron
las comprobaciones funcionales descritas. No se ejecutó una comparación de
consola con Sanity 5; estos avisos quedan registrados para seguimiento.

## Auditoría previa al commit

La revisión del cambio no encontró problemas que bloqueen esta actualización.
Se contrastó con las guías oficiales de Next.js, Studio embebido, Sanity 5 a 6
y Document Internationalization 6:

- `/studio/[[...tool]]` conserva `NextStudio`, `force-static` y los exports
  oficiales de metadata y viewport. Su layout está separado del sitio público,
  sin montar `SanityLive` ni `VisualEditing` dentro del Studio.
- La configuración del Studio mantiene `use client`; el módulo de credenciales
  de lectura mantiene `server-only`. El nuevo helper de metadatos solo se
  importa desde el script de Node y las pruebas.
- No se utilizan los ajustes de autenticación o búsqueda retirados en Sanity 6.
  Se mantienen Strict Mode y la versión de API configurada.
- El helper escribe el nuevo contrato de `language`, conserva las claves al
  reutilizar elementos y mantiene los atributos de las referencias. La consulta
  conserva `value._ref` sin depender de que la referencia pueda resolverse.
- El manifiesto, el lockfile y las dependencias directas instaladas coinciden.
  Solo cambiaron las cinco dependencias directas previstas y no se encontraron
  relaciones de dependencia requeridas inválidas en el árbol instalado.
- Durante la auditoría volvieron a pasar la comprobación de sintaxis de ambos
  scripts y las seis pruebas de metadatos con Node `22.20.0`. Se conserva la
  evidencia anterior de `npm ci`, `npm run check` y QA en navegador; el código
  ejecutable no se modificó después de esas comprobaciones.

El dictamen se limita a esta actualización: no certifica una ejecución futura
de la migración de contenido ni elimina los avisos de desarrollo registrados
arriba. No se modificó contenido remoto durante la auditoría.

## Reversión y siguiente etapa

Como no hubo migración de datos y el borrador ya se eliminó, la reversión
consiste en recuperar las versiones anteriores de los archivos modificados,
retirar los archivos nuevos de esta actualización y ejecutar `npm ci`.
No requiere restaurar contenido. Si posteriormente se crean traducciones,
hay que reevaluar la compatibilidad de sus metadatos antes de revertir.

La instalación de `sanity-plugin-rich-table`, el esquema y renderizado de
tablas, la creación de contenido en inglés y el despliegue quedan para etapas
posteriores.

Referencias: [Sanity 5 a 6](https://www.sanity.io/docs/help/v5-to-v6),
[compatibilidad con UI 3](https://www.sanity.io/docs/changelog/studio-Ni45LjE),
[migración de internacionalización](https://github.com/sanity-io/plugins/tree/main/plugins/%40sanity/document-internationalization#upgrade),
[Studio embebido en Next.js](https://www.sanity.io/docs/nextjs/embedding-sanity-studio-in-nextjs),
[componentes de servidor y cliente de Next.js](https://nextjs.org/docs/app/getting-started/server-and-client-components).
