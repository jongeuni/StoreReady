# StoreReady

> Zeige deine App, wie du willst — ganz einfach: App-Store-Screenshots.

[English](README.md) · [한국어](README.ko.md) · [日本語](README.ja.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [Español](README.es.md) · [Français](README.fr.md) · **Deutsch** · [Português (Brasil)](README.pt-BR.md)

**https://app-ready.store**

StoreReady ist ein kostenloser Browser-Editor für App-Store-Marketing-Screenshots. Platziere Überschrift, Unterüberschrift und Geräte-Mockups (Smartphones, Tablets, Uhren), füge deine eigenen Screenshots ein und exportiere pixelgenaue PNGs in den App-Store-Größen. Kein Konto, kein Backend – deine Arbeit bleibt in deinem Browser.

## Zwei Wege zum fertigen Ergebnis

1. **Alles selbst machen** — Platziere Geräte, Texte, Formen und Hintergründe, lade deine echten Screenshots hoch und exportiere. Du kannst eine komplett gestaltete App-Werbeseite ganz allein erstellen – ohne KI.
2. **Das Design einer KI überlassen** — Platziere Smartphone-Platzhalter, benenne jeden Bildschirm und erzeuge einen Prompt mit der exakten Layout-Spezifikation (Positionen, Farben, Schriften). Füge ihn in Claude Code, Cursor oder einen anderen KI-Coding-Agenten ein, um die fertigen Bilder zu erhalten.

## Funktionen

- Mehrere Seiten, jeweils einzeln bearbeitbar
- Smartphone-/Tablet-/Uhr-Mockups mit wählbaren Modellen und ein geneigtes 3D-Smartphone
- Geteilte Vorlagen: ein großes Smartphone über zwei Screenshots
- Mehrere Screenshots in einem Smartphone, in diagonale Streifen mit Trennlinie geteilt
- Farbe pro Buchstabe, Formen, einfarbige und Verlaufshintergründe
- Exakter PNG-/ZIP-Export in App-Store-Größen
- 17 Sprachen, einschließlich Arabisch (von rechts nach links)

## Erste Schritte

```bash
npm install
npm run dev      # start the Vite dev server
npm run build    # type-check and build for production
npm run preview  # preview the production build
npm run lint     # run Oxlint
```

## Technologie

React + TypeScript, Konva / react-konva für die Arbeitsfläche, Zustand (+ Immer) für den Zustand, IndexedDB für lokale Speicherung, Tailwind CSS und framer-motion. Der Editor hat kein Backend.

## Made with StoreReady (Referenzen)

Die [Reference-Seite](https://app-ready.store/reference) zeigt echte Apps, deren Screenshots mit StoreReady erstellt wurden. Deine App hinzuzufügen ist ein Pull Request, der nur einen Ordner ergänzt – ohne Codeänderungen:

1. Lege `src/reference/apps/<deine-app>/` an.
2. Füge `app.json` (`name` Pflicht; `tagline` und `link` optional), ein `icon.svg` (oder png/webp) und deine fertigen Screenshots in `screenshots/` (`1.png`, `2.png`, …) hinzu.
3. Prüfe das Ergebnis mit `npm run dev` unter `/reference` und öffne dann den Pull Request.

Vollständige Anleitung: [`src/reference/README.md`](src/reference/README.md). Reiche bitte nur Apps ein, die dir gehören oder die du zeigen darfst.

## Mitwirken

Fehlerberichte und Ideen sind in den [GitHub Issues](https://github.com/jongeuni/StoreReady/issues) willkommen. Pull Requests ebenfalls; bei allem, was über eine kleine Korrektur hinausgeht, eröffne bitte zuerst ein Issue, um den Ansatz abzustimmen.

## Sponsoren

StoreReady ist kostenlos. Unterstützer auf Buy Me a Coffee werden unten auf der Reference-Seite aufgeführt; ein Sponsoring kann einen hervorgehobenen App-Platz auf der Startseite beinhalten (siehe unten).

### Konfiguration (für Deployer)

Die Sponsorenliste liest eine kleine Serverless-Funktion, `api/sponsors.js` (Vercel-Stil), von Buy Me a Coffee. Setze die Umgebungsvariable `BMC_ACCESS_TOKEN` bei deinem Hoster; ohne sie bleibt die Liste leer. Setze `SPONSOR_URL` in `src/config.ts`, um die Schaltfläche „Sponsor werden“ anzuzeigen.

## Zusammenarbeit & Anfragen

Du möchtest deine App auf der Startseite zeigen oder hast eine Idee für Kooperation, Sponsoring oder Werbung? Schreib an **hello@app-ready.store**. Für Fehler und Feature-Wünsche nutze bitte die GitHub Issues.
