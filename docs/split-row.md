# Split Row: características con imagen completa

Implementación del [issue #11](https://github.com/UlisesSnz/sensa-website/issues/11).
La entrega amplía los bloques existentes. No migra ni publica documentos de Sanity.

## Opciones editoriales

Cada **Split Row** conserva color y padding y añade un **Anchor ID** opcional.
El ancla pertenece al bloque entero. Si una característica necesita su propio enlace,
crear otro Split Row en lugar de repetir el identificador en sus unidades.

Cada **Split Column** admite:

| Campo | Opciones | Predeterminado |
| --- | --- | --- |
| `layout` | `horizontal` / `vertical` | `horizontal` |
| `imageFit` | `cover` / `contain` | `cover` |
| `headingLevel` | `h2` / `h3` | `h3` |
| `sectionWidth` | `default` / `narrow` | `default` |
| `contentWidth` | `default` / `narrow` | `narrow` |
| `stackAlign` | `left` / `center` | `left` |

En vertical, el orden es etiqueta, título, descripción, enlace opcional e imagen.
El ancho del conjunto afecta al texto y a la imagen. El ancho del texto puede limitar
adicionalmente su contenido. **Estrecho** centra un máximo de 48 rem; **Normal**
ocupa el ancho disponible. La alineación izquierda/centrada no cambia esos anchos.
Studio muestra estos tres controles únicamente en vertical. `position` sigue
controlando el lado del texto en horizontal y se conserva al cambiar de disposición.

**Imagen completa** utiliza el asset original, sin aplicar crop/hotspot, y su
proporción natural con ancho adaptable y altura automática. Si sus dimensiones no
son enteros positivos, utiliza el marco responsive existente con `object-contain`.
Se conservan el texto alternativo, el placeholder borroso disponible y la carga
diferida de Next Image. **Recortar** conserva las alturas y `object-cover` anteriores.

H2 es una elección explícita para una sección principal y usa la tipografía de
Section Header. H3 sigue siendo el valor predeterminado, incluso en vertical.
La descripción conserva Portable Text, sus listas, formato y enlaces localizados.
El enlace de la característica es opcional. Las columnas nuevas empiezan sin un
objeto Link: **Agregar enlace** abre sus campos y **Quitar enlace** elimina solo
el enlace, conservando título, descripción, imagen y ancla. Un enlace URL activo
necesita título y destino válidos; el destino Desktop conserva sus reglas existentes.

Si una columna anterior contiene un Link vacío que marca `Title: Required` o
`La URL es obligatoria.`, usar **Quitar enlace**. Vaciar únicamente el texto y la URL
deja un enlace incompleto y sigue produciendo errores. Esta corrección del
[issue #12](https://github.com/UlisesSnz/sensa-website/issues/12) no limpia ni migra
documentos automáticamente. Los controles respetan el modo de solo lectura.

La separación texto/imagen vertical es 24 px, o 32 px desde `lg`. Las filas con
alguna unidad vertical visible separan sus unidades por 64 px, u 80 px desde `xl`.
Las filas exclusivamente horizontales mantienen sus espacios anteriores. El padding
exterior sigue dependiendo de los controles de Split Row; no se añade margen negativo.

## Compatibilidad y anclas

- Los campos ausentes, nulos o desconocidos utilizan los valores predeterminados
  al renderizar. Studio valida las opciones permitidas mediante sus listas.
- Los Split existentes conservan H3, recorte, alturas, lado del texto y orden móvil.
  Si falta imagen o texto, el contenido restante ocupa el ancho disponible. Se omiten
  títulos vacíos, botones incompletos, unidades sin contenido y filas vacías.
- La consulta conserva `_key` del bloque y de sus unidades. Se mantienen las
  anotaciones de edición del contenido; las opciones y URLs se interpretan sin ellas.
- `uid` sigue el formato de Section Header: minúsculas, números y guiones, sin `#`
  ni espacios. Es opcional; no se inventa a partir del título.
- La validación de `page.blocks` señala todos los `uid` repetidos entre Split Row y
  Section Header. El mismo identificador puede usarse en páginas diferentes.
- En el renderizado de la página se conserva la primera aparición válida y se omite
  el ID de las siguientes, sin ocultar su contenido ni generar sufijos. Una fila vacía
  no reserva el identificador. Cada asignación se calcula de nuevo por renderizado.
- Ambos renderers omiten IDs vacíos o inválidos y utilizan `scroll-mt-20` (80 px)
  para dejar espacio al encabezado fijo de 64 px.

## Consolidación posterior del borrador de Producto

Estos pasos quedan para una sesión editorial posterior, después de revisar el componente.
La referencia inspeccionada es el borrador español de Producto
(`drafts.6b6ac7b2-2166-4c8e-9f8b-c798ebbc7148`), slug `features`.

1. Crear un Split Row en el lugar de «Diseños con el estilo de tu negocio».
   Conservar `colorVariant=background` y activar padding superior e inferior.
2. Añadir una unidad con `layout=vertical`, `imageFit=contain`, `headingLevel=h2`,
   `sectionWidth=default`, `contentWidth=narrow` y `stackAlign=left`.
3. Copiar el título y la descripción completos del Section Header `bcb2537e88ae`.
   Convertir cada párrafo de la descripción en un párrafo de Body, conservando su texto
   y los saltos internos. No introducir la imagen dentro de Body.
4. Reutilizar en Image el asset del CTA `b666614f3281`:
   `image-f0336381866609645b1ac1d62a11eb7dfd5240be-3190x1654-png`.
   Mantener su texto alternativo: «Editor de Sensa Studio con una plantilla de agenda
   de clases de gimnasio y sus herramientas de diseño.». Dejar Link vacío.
5. Comprobar título, párrafos e imagen antes de retirar los bloques auxiliares.
   Al consolidar, transferir `diseno` del encabezado anterior al Split Row y retirar
   el encabezado y el CTA sustituidos. Evitar conservar dos anclas `diseno`.
6. Revisar `/es/features#diseno`, ambos temas y móvil/escritorio, junto con «Dale voz
   a tus mensajes» y «El contenido adecuado para cada horario». Mantener sus textos,
   orden y anclas. Mantener todo en borrador hasta su aprobación editorial.

## Pruebas reproducibles

```bash
npm run check
npm run test:split
npm run test:split:studio
npm run test:downloads
```

Usar Node `>=22.20 <23` y npm `10.9.3`. La regresión de Split usa Vite y Chromium,
componentes reales, CSS del sitio y copias locales de la captura y la fuente Inter.
Solo se sustituye el cargador de Next Image para servir el PNG local; no se certifica
el endpoint de optimización de imágenes de Next mediante este arnés. El resto de
solicitudes externas se bloquea y no se carga ningún cliente de Sanity.

El arnés comprueba 375/768/1024/1280/1440 px, ambos temas y enlaces en español/inglés:
20 escenarios, cada uno con las combinaciones de anchos y alineación, imágenes
completas/recortadas, unidades incompletas, filas mixtas y variantes horizontales.
También verifica orden, proporción, tipografía, espacios, ausencia de desbordamiento,
foco por teclado y navegación a `#diseno`, incluida la carga con fragmento.

Las capturas y el informe JSON quedan en `output/playwright/split/`. La regresión
de descargas verifica los consumidores existentes de Section Header. Los tests
unitarios incluyen el esquema real, consultas GROQ offline y el renderer Blocks.
El build completo sí puede leer Sanity. Las fuentes se incluyen localmente en el
repositorio y en el paquete `geist`, sin descargarlas de Google durante el build.

`test:split:studio` monta `FormBuilder`, los campos del esquema y el input opcional
reales en Vite/Chromium. Comprueba agregar, editar, quitar y reabrir enlaces, rechaza
enlaces incompletos y URLs inválidas, permite Desktop sin URL y respeta solo lectura.
Incluye objetos vacíos antiguos y verifica que el resto del documento no cambie.
El documento se persiste exclusivamente en `localStorage`; los permisos y las
fuentes de Studio tienen respuestas locales. Se bloquea cualquier otra petición
de API o externa, sin cargar la configuración ni las credenciales de producción.
Las capturas y resultados quedan en `output/playwright/split-editor/`.

Los tests unitarios complementan el formulario con la inicialización y validación
reales de Sanity, el borrado en la ruta anidada de Split Row y controles de regresión
para Grid Card, CTA y Desktop. Este arnés comprueba el comportamiento del editor y
su validación, no una publicación en el dataset ni la persistencia remota de Studio.

En el sandbox de Windows puede ser necesario apuntar `TEMP`/`TMP` a una carpeta
escribible dentro de `output/playwright/`, indicar `PLAYWRIGHT_BROWSERS_PATH` para el
Chromium instalado y permitir acceso a localhost para los arneses. Son ajustes del
proceso de pruebas, no cambios de configuración del sitio.

### Verificación realizada el 26 de octubre de 2026

- Node 22.23.2 (dentro del rango admitido) y npm 10.9.3.
- `npm run check`: aprobado; TypeScript, 304 pruebas en 23 archivos y build de
  producción con 27 páginas generadas. ESLint terminó sin errores, con 18
  advertencias preexistentes. Vitest conserva el aviso previo de configuración ESM.
- `npm run test:split`: 20 escenarios aprobados, sin errores de navegador ni
  solicitudes externas. Se inspeccionaron las capturas de la secuencia de Producto
  a 375 y 1280 px en ambos temas.
- `npm run test:downloads`: 32 escenarios aprobados, sin solicitudes externas.
- `git diff --check`: aprobado.

La comprobación visual corresponde a fixtures locales con el contenido de referencia;
no implica que el borrador de Sanity se haya consolidado ni que exista un despliegue nuevo.

### Verificación del issue #12 realizada el 27 de octubre de 2026

- `npm run check`: aprobado; TypeScript, 319 pruebas en 24 archivos (15 nuevas)
  y build de producción con 28 páginas. ESLint terminó sin errores.
- `npm run test:split:studio`: 13 escenarios aprobados, sin errores de navegador
  ni peticiones imprevistas. Se inspeccionaron las capturas del enlace completo
  y del enlace vacío antiguo después de retirarlo.
- `npm run test:split`: 20 escenarios aprobados, sin errores de navegador ni
  solicitudes externas.
- `git diff --check`: aprobado.

El informe del editor está en `output/playwright/split-editor/results.json` y el
resultado general en `check-result.json`, junto al registro `check.log`. El borrador
de Sanity no se modificó: agregar, quitar y reabrir se verificó con almacenamiento
local y la validación real de Studio, sin publicar contenido.
