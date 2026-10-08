# Tablas nativas de Portable Text

Implementación del [issue #3](https://github.com/UlisesSnz/sensa-website/issues/3) sobre Sanity 6.18.0. Utiliza la [edición oficial de tablas](https://www.sanity.io/docs/studio/portable-text-editor-configuration#table-editing), habilitada exclusivamente en `block-content`.

## Contenido y edición

- Se conserva el modelo nativo: `table.headerRows`, `table.caption` y `rows[].cells[].value[]`, con claves estables en cada nivel.
- La inserción de Studio mantiene las tres filas, tres columnas y primera fila de encabezados del editor nativo. El menú permite alternar `headerRows` entre 0 y 1.
- Las celdas admiten párrafos, saltos de línea, negritas, cursivas y enlaces relativos o con protocolos `http`, `https`, `mailto` y `tel`.
- Se reutilizan los controles oficiales de filas, columnas, selección, eliminación y navegación. El único control adicional es el caption: una operación `set` sobre su propia ruta, que participa en el historial y respeta solo lectura.
- Los errores de estructura y contenido se registran mediante la validación de Sanity, con rutas a los elementos afectados. Las celdas individuales vacías son válidas; una tabla completamente vacía o un encabezado vacío no lo son.

`sanity/components/portable-text-table.tsx` contiene la extensión de Studio. Las dependencias directas son las versiones oficiales ya presentes: `@portabletext/editor@8.2.3` y `@portabletext/plugin-table@2.0.16`. El callback del contenedor devuelve un componente React para mantener sus hooks aislados durante cambios y desmontajes del editor.

## Render del sitio

`PortableTextRenderer` utiliza `components/portable-text-table.tsx` tanto en el sitio como en Presentation. El renderer utiliza HTML semántico (`caption`, `thead`, `tbody`, `th scope="col"`), conserva las anotaciones de texto de vista previa y localiza los enlaces internos.

Cada tabla tiene una región de desplazamiento con nombre accesible, entrada por teclado y foco visible hacia el interior, incluso dentro de una FAQ con `overflow-hidden`. Las tablas inválidas se omiten y los bloques vecinos siguen visibles. Las tarjetas con tablas tienen enlaces independientes en su título y CTA. Los testimonios con tablas no se recortan a cuatro líneas.

Las consultas existentes conservan íntegramente `body` y `excerpt`; no necesitan nuevas proyecciones. Las bibliotecas de edición solo se importan desde Studio y el entorno de pruebas. No hay cambios al modelo del contenido existente ni migraciones.

## Verificación automatizada

Con Node 22 compatible con el requisito `>=22.20 <23`:

```sh
npm run check
```

El runtime local utilizado fue Node **22.23.2**. `check` ejecuta ESLint, TypeScript, Vitest y la compilación de Next.js. Esta última consulta contenido publicado de Sanity para generar páginas estáticas y necesita acceso de lectura a la red.

Resultado local del 7 de octubre de 2026: 176 pruebas en 16 archivos, TypeScript y compilación correctos. ESLint conserva las 20 advertencias previas del repositorio y no presenta errores.

`tests/unit/portable-text-table.test.tsx` cubre matrices inválidas, claves faltantes o duplicadas, encabezados, formato y enlaces, celdas vacías, HTML accesible, anotaciones Stega, tarjetas sin enlaces anidados y regresiones en español e inglés. También ejecuta la validación real de un esquema compilado de Sanity y evalúa las consultas GROQ de páginas, tarjetas, FAQ y publicaciones con datos locales.

## Entorno de navegador con persistencia simulada

```sh
npm run test:tables:browser
```

Abrir `http://127.0.0.1:4173/`. El entorno vive en `tests/browser/tables/`, fuera de las rutas de producción. Convierte el esquema real mediante `@portabletext/sanity-bridge`, monta `EditorProvider`, el plugin oficial, sus controles de tabla y la extensión real del caption. El sitio se representa con sus componentes reales `PortableTextRenderer`, `GridCard` y `FAQs`.

Los botones externos al editor son utilidades locales para insertar, aplicar formato, mover la tabla, deshacer y rehacer mediante las operaciones oficiales del editor. `Guardar local` serializa el valor en `localStorage`; `Reabrir` crea una nueva instancia desde ese JSON. Vite y el conversor del esquema están declarados como dependencias de desarrollo para reproducir esta prueba.

El entorno utiliza identificadores sintéticos y no carga `.env.local` ni un cliente de contenido. **Esta evidencia no verifica guardado, colaboración, publicación ni reapertura contra Sanity remoto, ni el shell autenticado completo de Studio.**

Flujos comprobados en navegador:

1. Insertar 3 × 3 entre dos párrafos; escribir encabezados y cuerpo con Tab entre celdas.
2. Aplicar negrita, cursiva y enlace; insertar saltos de línea y varios párrafos en una celda.
3. Editar y deshacer el caption; alternar encabezados y deshacer/rehacer.
4. Añadir y eliminar filas y columnas; arrastrar ambos ejes conservando claves, texto y anotaciones.
5. Mover y quitar la tabla completa; restaurarla con deshacer y conservar los párrafos vecinos.
6. Guardar y reabrir con igualdad del JSON; alternar tablas pequeñas y anchas y comprobar el desmontaje del editor.
7. Activar solo lectura: caption de solo lectura, controles de tabla ausentes y comandos deshabilitados.
8. Revisar tablas de dos y ocho columnas, texto largo, tarjetas y FAQ; español e inglés; temas claro y oscuro; vistas de 390 × 844 y 1280 × 1000.
9. En móvil, confirmar que el documento no crece horizontalmente y que cada tabla mantiene su propio desplazamiento. Flecha derecha desplaza la región enfocada y conserva un foco visible de 2 px.

Las capturas locales se guardan en `output/playwright/` (ignorado por Git). La prueba no realiza escrituras al CMS ni despliegues.

## Auditoría breve de Next.js y Sanity

Revisión del 7 de octubre de 2026:

- Se conserva el límite de cliente en la extensión de Studio. El renderer público puede ejecutarse en servidor y no importa las bibliotecas de edición, siguiendo la [composición de componentes de Next.js](https://nextjs.org/docs/app/getting-started/server-and-client-components#reducing-js-bundle-size).
- El esquema, `headerRows`, activación por campo y extensión del contenedor siguen la [API oficial de tablas de Sanity](https://www.sanity.io/docs/studio/portable-text-editor-configuration#table-editing). El caption usa una operación del editor sobre su ruta; las claves y los controles nativos se conservan.
- Se estabilizó el objeto de contenedores del plugin a nivel de módulo para evitar volver a registrarlo al renderizar. Las funciones de render de Portable Text y de las celdas también se reutilizan por idioma, conforme a la recomendación de `@portabletext/react` de conservar su identidad.
- Comprobación adicional en navegador: editar el caption conserva el desplazamiento de 40 px; deshacerlo con la tabla enfocada conserva el foco, su contorno de 2 px y el desplazamiento de 80 px. No se registraron errores ni advertencias de consola.
- La validación comparte las mismas reglas entre Studio y web, devuelve rutas de los errores, rechaza formatos/protocolos no admitidos y omite tablas inválidas sin afectar los bloques vecinos. Las consultas conservan datos y anotaciones completos.

No se identificaron hallazgos bloqueantes pendientes dentro del alcance implementado. La validación de persistencia remota continúa fuera de la evidencia local descrita arriba.
