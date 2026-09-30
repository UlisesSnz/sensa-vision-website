# Reparación de publicación de sectores — issue #2

El esquema mantiene el idioma en el documento `siteSettings`. Los subenlaces
pertenecen al idioma de ese documento y conservan sus validaciones de etiqueta y
destino. Las tarjetas nuevas comienzan sin enlace; el editor permite agregarlo y
quitarlo sin eliminar la tarjeta. Los enlaces presentes siguen requiriendo título
y destino válido, incluido el contrato de descargas Desktop.

## Limpieza de los borradores existentes

`scripts/repair-sector-links.mjs` está limitado al proyecto `e07b8hy0`, dataset
`production`, y a las diez claves de tarjeta del
[issue #2](https://github.com/UlisesSnz/SV-Website/issues/2): dos en Tiendas, tres en
Farmacias, dos en Escaparates y tres en Recepciones.

La simulación usa `SANITY_API_READ_TOKEN`, respalda las versiones borrador y
publicada de las cuatro páginas y de Site Settings, y muestra los campos que
quitaría. El respaldo queda en `backups/`, excluido de Git. No sobrescribe un
respaldo existente.

```powershell
node --env-file=.env.local scripts/repair-sector-links.mjs --backup backups/issue-2-before.json
```

Después de revisar que la simulación contiene las diez eliminaciones esperadas,
la aplicación usa adicionalmente `SANITY_API_TOKEN`:

```powershell
node --env-file=.env.local scripts/repair-sector-links.mjs --apply --backup backups/issue-2-before.json
```

La operación aplica una única transacción con `unset` por claves `_key` y
precondiciones `ifRevisionID`. Aborta si los borradores cambiaron desde la
simulación o si un enlace contiene algo distinto de la forma vacía heredada
`{_type: "link", buttonVariant: "default"}`. La verificación posterior compara
todo el contenido y permite únicamente quitar esos campos. Ejecutarla de nuevo
sobre datos ya reparados no vuelve a modificarlos.

No modifica las versiones publicadas, Site Settings, inglés, blog, rutas,
imágenes o textos. Site Settings ya contiene `language: "es"`; su bloqueo se
resuelve al servir el esquema corregido, sin parchear sus subenlaces.

## Verificación

```powershell
npm run test:unit -- tests/unit/sanity-sector-editor.test.ts tests/unit/repair-sector-links.test.ts
npm run typecheck
npm run lint
npm run build
```

En el Studio que sirve el código actualizado, comprobar:

- Agregar y quitar un enlace cambia solamente ese campo; los demás datos de la
  tarjeta permanecen intactos y una tarjeta nueva no genera un enlace vacío.
- Los enlaces incompletos y las URLs inválidas siguen bloqueando la publicación.
- Las cuatro páginas no tienen los veinte errores de enlaces del issue.
- Site Settings no tiene los cuatro errores de idioma de los subenlaces.
- Publish queda habilitado si no existen otros errores en el documento.
- La vista previa mantiene los cuatro destinos sectoriales con un único prefijo
  `/es/`, tanto en escritorio como en móvil, y conserva la corrección de la
  segunda tarjeta de Recepciones.

La publicación del contenido es una operación editorial separada. Servir el
esquema nuevo en producción requiere desplegar el código del sitio.

## Resultado de la ejecución — 2026-09-30

Se quitaron los diez enlaces vacíos de los cuatro borradores. Los respaldos
locales `backups/issue-2-2026-09-30-before.json` y
`backups/issue-2-2026-09-30-final.json` permiten verificar que no cambiaron otros
campos de contenido, las versiones publicadas ni Site Settings. La simulación
final devuelve cero cambios pendientes.

La validación del esquema completo no reportó errores ni advertencias en los
cinco borradores. Con una sesión autenticada en el Studio local se comprobó
Publish habilitado en Tiendas, Farmacias, Escaparates, Recepciones y Site
Settings. Agregar un enlace vacío bloquea Publish; quitarlo restaura la tarjeta
sin enlace y habilita Publish de nuevo. La comparación final confirmó que esta
prueba no dejó cambios de contenido adicionales.

En Presentation se revisaron los cuatro destinos de Industrias en escritorio
y móvil, y se abrió Recepciones desde el menú móvil: el texto aprobado de su
segunda tarjeta permanece intacto. El código queda pendiente de despliegue y
el contenido no se publicó.

La suite completa pasó (102 pruebas), junto con TypeScript y la compilación de
producción. Después del ajuste final del botón se repitieron las 24 pruebas de
regresión, TypeScript y la compilación. ESLint no reporta errores; conserva 20
advertencias en archivos ajenos a esta reparación.

## Auditoría breve antes del commit

Sin hallazgos que bloqueen la entrega en los siete archivos de esta reparación:

- **Next.js:** el componente interactivo se registra dentro de la configuración
  cliente del Studio. Sus callbacks permanecen en ese árbol cliente; no se
  introducen tokens, módulos de Node ni solicitudes de datos en el navegador.
- **Sanity:** el control respeta `readOnly`, delega los campos existentes a
  `renderDefault` y emite parches `set`/`unset` limitados al enlace. La precedencia
  de `initialValue: { link: undefined }` evita crear objetos opcionales vacíos.
  Las reglas de título, URL y destino Desktop siguen intactas. El idioma reside
  en el documento, coherente con la consulta y la navegación existentes.
- **Reparación:** simulación por defecto, respaldo sin sobrescritura y excluido
  de Git, destinos explícitos por `_key`, control `ifRevisionID`, transacción
  única, comparación posterior e idempotencia. Los tokens solo se leen desde
  el entorno del script y no se incluyen en sus salidas.

Se contrastó el código con las referencias oficiales de
[límites cliente de Next.js](https://nextjs.org/docs/app/api-reference/directives/use-client),
[componentes de formulario de Sanity](https://www.sanity.io/docs/studio/form-components-reference),
[valores iniciales](https://www.sanity.io/docs/studio/initial-value-templates) y
[parches de formulario](https://www.sanity.io/docs/studio/from-input-components-to-real-time-safe-patches).
La auditoría reutiliza las pruebas y la verificación en navegador anteriores;
no fue necesario cambiar el código de aplicación.
