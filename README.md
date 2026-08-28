# RM STORE WEB V2

Sitio web estático para GitHub Pages conectado a Supabase.

## Archivos principales

- `index.html` — tienda pública.
- `admin.html` — panel privado.
- `assets/config.js` — URL del proyecto, Publishable Key y WhatsApp.
- `assets/app.js` — catálogo público.
- `assets/admin.js` — login, CRUD y carga de fotografías.
- `assets/styles.css` — diseño.

## Publicación en GitHub Pages

Reemplaza los archivos de la V1 en el repositorio `rmstore-web` por los de esta carpeta y realiza un commit.
GitHub Pages publicará los cambios automáticamente desde `main`.

El panel administrativo quedará en:

`/admin.html`

## Seguridad

La Publishable Key puede estar en el navegador. La seguridad depende de RLS en Supabase.
No colocar nunca Secret Key / service_role ni contraseñas en estos archivos.

## Fotografías

El panel convierte las imágenes a WebP y limita el lado mayor a 1600 px antes de subirlas al bucket `productos`.
La base de datos guarda las rutas internas del bucket en la columna `imagenes`.

## WhatsApp

El número está en `assets/config.js`.
