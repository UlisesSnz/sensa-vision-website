# Hero · Template Screen

En Studio, abre una página y añade el bloque **Hero · Template Screen**. Puedes preparar el texto, hasta dos botones y las plantillas de cada idioma en su propia página. Los botones admiten enlaces y descargas de SensaVision Desktop.

**Hero 1** y **Hero · Template Screen** comparten el campo **Layout**. Elige **Text above** para centrar el texto y los botones arriba. En ese modo, **Text width** controla solo el copy: **Default** usa todo el ancho disponible y **Narrow** lo limita a 48rem; la imagen de Hero 1 o la escena animada sigue ocupando todo el ancho del contenido de la página. En escritorio, la escena de **Hero · Template Screen** compensa su margen visual superior para que el borde de la pantalla siga el mismo ritmo que la imagen de Hero 1; en móvil conserva su composición natural. **Side by side** sitúa el texto a la izquierda en escritorio y arriba en móvil. Es la composición predeterminada, también para los bloques creados antes de añadir el campo.

Cuando cualquiera de los dos Hero es el primer bloque de la página, comienza con 64 px
de espacio superior, u 80 px desde `xl`; el espacio inferior permanece en 80 px. Los
Hero que aparecen después conservan su espaciado anterior para marcar la separación
entre secciones.

1. **Default scene** define el ambiente que heredan las plantillas. El bloque nuevo ya trae *Office or reception*.
2. En **Templates**, añade una imagen y describe su mensaje en **Alt text**. Para publicar el bloque hace falta al menos una plantilla con imagen y texto alternativo.
3. Para una página de farmacias, elige *Pharmacy* una vez en el bloque. Cada plantilla mostrará **Use default (Pharmacy)**. Para abrir la portada con *Home*, abre la primera fila de **Templates** y elige **Home** en **Scene**. Cada fila admite su propio ambiente.
4. Arrastra las filas para cambiar el orden. Reemplazar la imagen de una fila conserva su posición. En vista previa, reordenar conserva la plantilla que estás viendo. Si la eliminas, la pantalla pasa a la primera disponible.

La pantalla horizontal muestra la plantilla completa. Mientras la plantilla se ve, en recepción se mecen las hojas, en la tienda oscila una etiqueta y en la farmacia un pulso recorre el mostrador. En la cafetería sube vapor de la taza y en el escaparate se desplaza un reflejo sobre el cristal. Cada ambiente tiene su propio Lottie local, que se carga al reproducirse y adopta los colores del tema.

<picture>
  <source media="(prefers-reduced-motion: reduce)" srcset="hero-screen/ambientes.webp">
  <img src="hero-screen/movimiento.webp" alt="Detalle de las hojas, la etiqueta, el pulso, el vapor y el reflejo de los cinco ambientes">
</picture>

| Ambiente en Studio | Detalle animado |
| --- | --- |
| Home | Un pulso recorre el cable desde la regleta del estante hasta el televisor. El HDMI se pierde en el margen izquierdo. |
| Education | El globo terráqueo gira junto a los pupitres. |
| Manufacturing | Un brazo articulado mueve su pinza sobre una cinta de embalaje. |
| Healthcare | Una gota cae en la cámara de suero junto a la camilla. |

<picture>
  <source media="(prefers-reduced-motion: reduce)" srcset="hero-screen/nuevos-ambientes.webp">
  <img src="hero-screen/nuevos-ambientes-animados.webp" alt="Los ambientes Home, Education, Manufacturing y Healthcare en el hero con tema oscuro">
</picture>

Con varias plantillas, la imagen cambia cada cinco segundos. La plantilla anterior y la siguiente se mezclan durante 700 ms. Si cambia el ambiente, el mobiliario se desvanece al mismo ritmo. Dos plantillas del mismo negocio comparten la animación en curso. Con una sola plantilla, la imagen permanece fija y el ambiente se anima en bucle mientras está a la vista. Un botón de pausa en el margen derecho evita añadir una fila a la escena.

En escritorio, **Side by side** centra el bloque de texto y botones con la escena. Los controles aparecen al acercar el ratón al texto o a la escena y al navegar por el hero con teclado. En móvil y pantallas táctiles permanecen visibles. El contador queda entre las flechas y reserva el mismo ancho para todas las posiciones. Los controles usan el idioma de la página.

Pasar el puntero por la escena mantiene la plantilla visible mientras se mueve el ambiente. **Pausar** detiene tanto el dibujo como el carrusel. **Reproducir** los reanuda aunque el puntero siga sobre el botón. Si el puntero sale y vuelve a entrar, la plantilla se mantiene visible otra vez. Al entrar con teclado, la reproducción espera a que se pulse **Reproducir**. Con movimiento reducido se muestra la ilustración fija, el avance empieza pausado y los cambios son instantáneos. Si una imagen falla, se conserva la última disponible. Si faltan todas, aparece **Pantalla en reposo**.

## Verificación local

Con Node en el rango del proyecto y Chromium de Playwright instalado:

```sh
npm run check
npm run test:hero-screen
```

La prueba de navegador utiliza plantillas sintéticas, el componente real, los estilos del sitio y la consulta de páginas. El formulario de Studio usa referencias de imágenes locales y guarda el documento en el navegador. La vista previa recibe las ediciones en otra pestaña. El cargador de imágenes de prueba sustituye el servicio remoto de optimización.

Para recorrer la demostración a mano, ejecuta `npx vite --config tests/browser/hero-screen/vite.config.mts --port 4184`. Puedes añadir `theme=dark` y `locale=en` a la URL. [Recorrido de nueve ambientes](http://127.0.0.1:4184/?scenario=tour) · [Home](http://127.0.0.1:4184/?scene=home) · [Farmacia con tres plantillas](http://127.0.0.1:4184/).

Para ver el texto arriba, abre las demos de [Hero 1](http://127.0.0.1:4184/?hero=1&layout=vertical) y del [hero con pantalla](http://127.0.0.1:4184/?layout=vertical&scenario=tour).

![Hero 1 y Hero · Template Screen con el texto y los enlaces centrados sobre la imagen y la escena](hero-screen/text-above.webp)

Las capturas reproducibles de los ocho cruces de idioma, tema y tamaño y de los nueve ambientes quedan en `output/playwright/hero-screen/`.

En los ocho casos, el marco y los controles conservaron sus coordenadas. Playwright comprueba que cada dibujo cambie de fotograma mientras la plantilla sigue fija, que responda a la pausa y que conserve el color del tema. Si falla un Lottie, queda visible el dibujo estático y se puede avanzar al siguiente ambiente. Las pruebas también cubren imágenes verticales o fallidas y la persistencia del orden al reabrir el formulario de Studio.

![Cinco ambientes con la misma pantalla mural](hero-screen/ambientes.webp)

| Idioma y tema | Escritorio, 1440 px | Móvil, 375 px |
| --- | --- | --- |
| Español claro | [Escritorio](hero-screen/desktop-light-es.webp) | [Móvil](hero-screen/mobile-light-es.webp) |
| Español oscuro | [Escritorio](hero-screen/desktop-dark-es.webp) | [Móvil](hero-screen/mobile-dark-es.webp) |
| Inglés claro | [Escritorio](hero-screen/desktop-light-en.webp) | [Móvil](hero-screen/mobile-light-en.webp) |
| Inglés oscuro | [Escritorio](hero-screen/desktop-dark-en.webp) | [Móvil](hero-screen/mobile-dark-en.webp) |
