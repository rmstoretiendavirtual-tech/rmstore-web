# RM STORE | Web V1

Primera versión estática para GitHub Pages.

## Archivos
- `index.html`: estructura principal.
- `assets/styles.css`: diseño responsive.
- `assets/app.js`: catálogo, filtros y WhatsApp.

## Antes de publicar
Abre `assets/app.js` y cambia:
`const WHATSAPP_NUMBER = "51999999999";`
por el número real de RM STORE, en formato internacional, sin `+`, espacios ni guiones.

Ejemplo Perú:
`51987654321`

## Publicar en GitHub
1. Entra al repositorio `rmstore-web`.
2. Usa **Add file > Upload files**.
3. Sube TODO el contenido de esta carpeta, manteniendo la carpeta `assets`.
4. Haz clic en **Commit changes**.
5. Ve a **Settings > Pages**.
6. En **Build and deployment / Source**, elige **Deploy from a branch**.
7. Branch: `main`; Folder: `/ (root)`.
8. Guarda.
9. GitHub mostrará la dirección temporal de la página.

## Importante
No conectes `rmstore.pe` todavía. Primero revisa la web en la dirección temporal de GitHub Pages.

## Productos
Los productos incluidos son de demostración. Se editan en el arreglo `products` dentro de `assets/app.js`.

## Fotos
Esta V1 usa un marcador visual en lugar de fotos. En la V2 se agregan las fotos reales de cada equipo.
