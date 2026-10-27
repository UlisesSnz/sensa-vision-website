# Inter local

`inter-latin.woff2` es la misma fuente Inter Latin variable que Next descargó para
el layout del sitio y que se conservó en la regresión visual de Split Row. No se
ha modificado el archivo. Ahora el sitio y esa regresión comparten esta copia.

- Familia: Inter; estilo normal; eje de peso de 100 a 900.
- El layout declara el rango 400–800 utilizado por el sitio y `display: swap`.
- El subconjunto Latin incluye los caracteres acentuados, la ñ y los signos de
  apertura del español; cubre los idiomas actuales, español e inglés.
- SHA-256: `c940764593d0fe5d596be327ca7558855e018039fb78509aa21921fd3644c3e4`.
- Licencia SIL Open Font License 1.1 en [Inter-LICENSE.txt](Inter-LICENSE.txt),
  obtenida del [proyecto Inter](https://github.com/rsms/inter/blob/master/LICENSE.txt).

Se carga mediante `next/font/local` para que la compilación no dependa de la
respuesta de Google Fonts ni del resolutor de Google de Turbopack. Next conserva
la precarga y el ajuste de la fuente de respaldo. La variable CSS `--font-sans`
permanece igual.

Al actualizar la fuente, conservar su licencia y comprobar caracteres, pesos y
regresión visual. Si se añaden idiomas con caracteres fuera de Latin, incluir
los archivos correspondientes antes de habilitarlos.
