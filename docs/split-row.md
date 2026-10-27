# Split Row: características con imagen completa

Implementación del [issue #11](https://github.com/UlisesSnz/sensa-website/issues/11).
La entrega amplía los bloques existentes. No migra ni publica documentos de Sanity.

## Opciones editoriales

Cada **Split Row** conserva color y padding y añade un **Anchor ID** opcional.
El ancla pertenece al bloque entero. Si una característica necesita su propio enlace,
crear otro Split Row en lugar de repetir el identificador en sus unidades.

Cada **Split Column** admite:

| Control en Studio | Campo | Opciones | Predeterminado |
| --- | --- | --- | --- |
| Layout | `layout` | Horizontal / Vertical | Horizontal |
| Image display | `imageFit` | Fill the space / Show the whole image | Fill the space |
| Heading | `headingLevel` | Subheading / Section heading | Subheading |
| Section width | `sectionWidth` | Default / Narrow | Default |
| Text width | `contentWidth` | Default / Narrow | Narrow |
| Text alignment | `stackAlign` | Left / Center | Left |

Los controles y sus ayudas están en inglés y describen cómo organizar el contenido.
Los valores técnicos se documentan aquí, sin mostrarlos en las ayudas de Studio.

En vertical, el orden es etiqueta, título, descripción, enlace opcional e imagen.
El ancho del conjunto afecta al texto y a la imagen. El ancho del texto puede limitar
adicionalmente su contenido. **Narrow** centra un máximo de 48 rem; **Default**
ocupa el ancho disponible. La alineación izquierda/centrada no cambia esos anchos.
Studio muestra estos tres controles únicamente en vertical. `position` sigue
controlando el lado del texto en horizontal y se conserva al cambiar de disposición.

**Show the whole image** utiliza el asset original, sin aplicar crop/hotspot, y su
proporción natural con ancho adaptable y altura automática. Si sus dimensiones no
son enteros positivos, utiliza el marco responsive existente con `object-contain`.
Se conservan el texto alternativo, el placeholder borroso disponible y la carga
diferida de Next Image. En horizontal, cuando están disponibles las dimensiones,
el texto y la imagen completa comparten el centro vertical: la imagen queda
centrada respecto al bloque de texto, tanto si es más alto como si es más corto,
y en ambos lados. **Fill the space** conserva las alturas, el centrado del
texto y `object-cover` anteriores. En móvil se conserva la imagen antes del texto.

H2 es una elección explícita para una sección principal y usa la tipografía de
Section Header. H3 sigue siendo el valor predeterminado, incluso en vertical.
La descripción conserva Portable Text, sus listas, formato y enlaces localizados.
El enlace de la característica es opcional y sus campos están siempre visibles.
Completar **Text** y **URL** muestra el enlace; vaciar ambos lo oculta y es válido,
sin pulsar botones para agregarlo o quitarlo. Completar solo uno señala lo que
falta. Tanto el campo ausente como los objetos Link vacíos anteriores son válidos
sin necesidad de limpiarlos ni migrarlos.
Las opciones de estilo no obligan a mostrar un enlace.

La validación opcional está limitada al campo de Split Column y conserva el objeto
existente al editarlo. El título, la descripción, la imagen y el ancla se conservan
al vaciar el enlace. Las validaciones de los CTA y otros consumidores del tipo Link
compartido mantienen sus requisitos. Los campos respetan el modo de solo lectura.

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
reales en Vite/Chromium. Comprueba completar, editar, vaciar y reabrir enlaces, rechaza
enlaces incompletos y URLs inválidas, permite Desktop sin URL y respeta solo lectura.
Incluye objetos vacíos antiguos sin errores ni cambios automáticos, comprueba que
no aparezcan controles para agregar o quitar y verifica que el resto del documento
no cambie. También permite revisar los controles editoriales en inglés.
El documento se persiste exclusivamente en `localStorage`; los permisos y las
fuentes de Studio tienen respuestas locales. Se bloquea cualquier otra petición
de API o externa, sin cargar la configuración ni las credenciales de producción.
Las capturas y resultados quedan en `output/playwright/split-editor/`.

Los tests unitarios complementan el formulario con la inicialización y validación
reales de Sanity, los enlaces en la ruta anidada de Split Row y controles de regresión
para Grid Card, CTA y Desktop. La regresión de la página incluye la combinación
horizontal con H2 e imagen completa, texto corto y largo, y texto a ambos lados.
Este arnés comprueba el comportamiento del editor y
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

### Verificación de la revisión editorial y horizontal, 27 de octubre de 2026

- `npm run check`: aprobado; TypeScript, 325 pruebas en 24 archivos y build de
  producción con 28 páginas. ESLint terminó sin errores, con 18 advertencias previas.
- `npm run test:split:studio`: 14 escenarios aprobados, sin errores de navegador
  ni peticiones imprevistas. Se inspeccionaron los campos siempre visibles, el
  enlace vacío sin errores y las ayudas del editor en inglés.
- `npm run test:split`: 20 escenarios aprobados, sin errores de navegador ni
  solicitudes externas. Incluye H2 horizontal con imagen completa, texto corto
  y largo y ambas posiciones; comprueba que imagen y contenido compartan el centro
  vertical, también con etiqueta y enlace. Se revisaron las capturas de escritorio
  y móvil.
- `git diff --check`: aprobado.

El informe del editor está en `output/playwright/split-editor/results.json`; las
capturas horizontales están en `output/playwright/split/horizontal-design-*.png`.
El resultado general y su registro están en
`output/playwright/split-editor-revision/check-result.json` y `check.log`.
El borrador de Sanity no se modificó: completar, vaciar y reabrir se verificó con
almacenamiento local y la validación real de Studio, sin publicar contenido.

Después del ajuste de centrado se repitieron las 31 pruebas del renderer de Split
Row, los 20 escenarios visuales y ESLint sobre los archivos modificados, sin errores.
