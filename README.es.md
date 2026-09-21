# StoreReady

> Muestra tu app a tu manera, de forma sencilla — capturas para el App Store.

[English](README.md) · [한국어](README.ko.md) · [日本語](README.ja.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · **Español** · [Français](README.fr.md) · [Deutsch](README.de.md) · [Português (Brasil)](README.pt-BR.md)

**https://app-ready.store**

StoreReady es un editor gratuito, en el navegador, para capturas promocionales del App Store. Coloca un titular, un subtítulo y maquetas de dispositivos (teléfonos, tabletas, relojes), añade tus propias capturas y exporta PNG exactos con los tamaños del App Store. Sin cuenta ni backend: tu trabajo se queda en tu navegador.

## Dos formas de terminarlo

1. **Hazlo todo tú mismo** — Coloca dispositivos, textos, formas y fondos, sube tus capturas reales y exporta. Puedes crear tú solo una página promocional de tu app completamente diseñada, sin IA.
2. **Deja el diseño en manos de una IA** — Coloca marcadores de teléfono, ponle nombre a cada pantalla y genera un prompt con la especificación exacta del diseño (posiciones, colores, fuentes). Pégalo en Claude Code, Cursor o cualquier agente de código con IA para obtener las imágenes terminadas.

## Características

- Varias páginas, cada una editable por separado
- Maquetas de teléfono/tableta/reloj con modelos a elegir y un teléfono 3D inclinado
- Plantillas divididas: un teléfono grande que cruza dos capturas
- Varias capturas en un mismo teléfono, divididas en bandas diagonales con línea divisoria
- Color por letra, formas y fondos sólidos o en degradado
- Exportación exacta a PNG / ZIP con los tamaños del App Store
- 17 idiomas, incluido el árabe (de derecha a izquierda)

## Primeros pasos

```bash
npm install
npm run dev      # start the Vite dev server
npm run build    # type-check and build for production
npm run preview  # preview the production build
npm run lint     # run Oxlint
```

## Tecnologías

React + TypeScript, Konva / react-konva para el lienzo, Zustand (+ Immer) para el estado, IndexedDB para el guardado local, Tailwind CSS y framer-motion. El editor no tiene backend.

## Made with StoreReady (Referencia)

La [página Reference](https://app-ready.store/reference) muestra apps reales cuyas capturas se hicieron con StoreReady. Añadir tu app es un pull request que solo agrega una carpeta, sin tocar código:

1. Crea `src/reference/apps/<tu-app>/`.
2. Añade `app.json` (`name` obligatorio; `tagline` y `link` opcionales), un `icon.svg` (o png/webp) y tus capturas terminadas en `screenshots/` (`1.png`, `2.png`, …).
3. Compruébalo en `/reference` con `npm run dev` y abre el pull request.

Guía completa: [`src/reference/README.md`](src/reference/README.md). Envía solo apps que sean tuyas o que tengas permiso para mostrar.

## Contribuir

Los reportes de errores y las ideas son bienvenidos en [GitHub Issues](https://github.com/jongeuni/StoreReady/issues). Los pull requests también; para algo más que un arreglo pequeño, abre antes un issue para acordar el enfoque.

## Patrocinadores

StoreReady es gratis. Quienes apoyan en Buy Me a Coffee aparecen al final de la página Reference, y el patrocinio puede incluir un espacio de app destacada en la página principal (ver abajo).

### Configuración (para quien despliega)

La lista de patrocinadores la lee de Buy Me a Coffee una pequeña función serverless, `api/sponsors.js` (estilo Vercel). Define la variable de entorno `BMC_ACCESS_TOKEN` en tu hosting; sin ella la lista queda vacía. Define `SPONSOR_URL` en `src/config.ts` para mostrar el botón «Hazte patrocinador».

## Colaboración y consultas

¿Quieres que tu app aparezca en la página principal o tienes una idea de colaboración, patrocinio o publicidad? Escribe a **hello@app-ready.store**. Para errores y sugerencias, usa GitHub Issues.
