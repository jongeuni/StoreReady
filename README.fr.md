# StoreReady

> Présentez votre app à votre façon, simplement — captures pour l’App Store.

[English](README.md) · [한국어](README.ko.md) · [日本語](README.ja.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [Español](README.es.md) · **Français** · [Deutsch](README.de.md) · [Português (Brasil)](README.pt-BR.md)

**https://app-ready.store**

StoreReady est un éditeur gratuit, dans le navigateur, pour les captures promotionnelles de l’App Store. Placez un titre, un sous-titre et des maquettes d’appareils (téléphones, tablettes, montres), ajoutez vos propres captures et exportez des PNG exacts aux tailles de l’App Store. Sans compte ni backend : votre travail reste dans votre navigateur.

## Deux façons de terminer

1. **Tout faire vous-même** — Placez appareils, textes, formes et arrière-plans, importez vos vraies captures et exportez. Vous pouvez créer seul une page promo d’app entièrement conçue, sans IA.
2. **Confier le design à une IA** — Placez des téléphones, nommez chaque écran et générez un prompt contenant la spécification exacte de la mise en page (positions, couleurs, polices). Collez-le dans Claude Code, Cursor ou tout agent de code IA pour obtenir les images finies.

## Fonctionnalités

- Plusieurs pages, modifiables séparément
- Maquettes de téléphone/tablette/montre à modèle au choix, et un téléphone 3D incliné
- Modèles scindés : un grand téléphone à cheval sur deux captures
- Plusieurs captures dans un même téléphone, découpées en bandes diagonales avec un trait de séparation
- Couleur lettre par lettre, formes, arrière-plans unis ou en dégradé
- Export PNG / ZIP exact aux tailles de l’App Store
- 17 langues, dont l’arabe (de droite à gauche)

## Démarrage

```bash
npm install
npm run dev      # start the Vite dev server
npm run build    # type-check and build for production
npm run preview  # preview the production build
npm run lint     # run Oxlint
```

## Technologies

React + TypeScript, Konva / react-konva pour le canevas, Zustand (+ Immer) pour l’état, IndexedDB pour la sauvegarde locale, Tailwind CSS et framer-motion. L’éditeur n’a pas de backend.

## Made with StoreReady (Références)

La [page Reference](https://app-ready.store/reference) présente des apps réelles dont les captures ont été faites avec StoreReady. Ajouter votre app se fait par une pull request qui n’ajoute qu’un dossier, sans toucher au code :

1. Créez `src/reference/apps/<votre-app>/`.
2. Ajoutez `app.json` (`name` obligatoire ; `tagline` et `link` facultatifs), une `icon.svg` (ou png/webp) et vos captures finales dans `screenshots/` (`1.png`, `2.png`, …).
3. Vérifiez le rendu sur `/reference` avec `npm run dev`, puis ouvrez la pull request.

Guide complet : [`src/reference/README.md`](src/reference/README.md). Ne soumettez que des apps dont vous êtes propriétaire ou que vous avez le droit de présenter.

## Contribuer

Les rapports de bugs et les idées sont les bienvenus dans les [GitHub Issues](https://github.com/jongeuni/StoreReady/issues). Les pull requests aussi ; pour tout ce qui dépasse un petit correctif, ouvrez d’abord une issue afin de s’accorder sur l’approche.

## Sponsors

StoreReady est gratuit. Les soutiens sur Buy Me a Coffee sont listés en bas de la page Reference, et le sponsoring peut inclure une mise en avant d’app sur la page principale (voir ci-dessous).

### Configuration (pour le déploiement)

La liste des sponsors est lue sur Buy Me a Coffee par une petite fonction serverless, `api/sponsors.js` (style Vercel). Définissez la variable d’environnement `BMC_ACCESS_TOKEN` chez votre hébergeur ; sans elle, la liste reste vide. Définissez `SPONSOR_URL` dans `src/config.ts` pour afficher le bouton « Devenir sponsor ».

## Collaboration et contact

Vous voulez voir votre app sur la page principale, ou avez une idée de partenariat, de sponsoring ou de publicité ? Écrivez à **hello@app-ready.store**. Pour les bugs et demandes de fonctionnalités, utilisez les GitHub Issues.
