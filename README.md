# Reminder Fidanzamento 💕

App per la **system tray** di Windows che ricorda mesiversario e anniversario
del fidanzamento — costruita con **Electron**, **React + TypeScript** e
**Tailwind CSS**.

- **Electron** con `app.requestSingleInstanceLock()` per l'istanza singola e
  `app.setLoginItemSettings()` per l'avvio automatico con Windows.
- **React 18 + TypeScript** per le viste (riepilogo, calendario, impostazioni,
  popup d'augurio), con **Tailwind CSS** per lo stile e **Framer Motion** per
  le animazioni.
- Logica delle ricorrenze condivisa (`shared/dateLogic.ts`) tra scheduler
  (main process) e viste (renderer): mesiversario ogni mese, anniversario ogni
  anno, giorno "clampato" a fine mese se il mese è più corto.
- Configurazione in `%APPDATA%/Reminder Fidanzamento/config.json`, scrittura
  atomica (file temporaneo + rename).

## Sviluppo

```powershell
npm install
npm run dev
```

Apre l'app in modalità sviluppo (hot-reload sul renderer, riavvio automatico
del main process quando modifichi `electron/*.ts`). Alla prima esecuzione
chiede la data di inizio fidanzamento, poi trovi l'icona a cuore nella tray;
clic sinistro per il riepilogo, destro per il menu completo.

## Build dell'eseguibile

```powershell
npm run build
```

Compila renderer + main process e impacchetta con `electron-builder`,
producendo in `release/` sia un installer NSIS sia una versione portable
(icona presa da `resources/icon.ico`).

## Struttura

```
electron/    processo main: tray, finestre, scheduler, store di config
shared/      logica date condivisa (main + renderer)
src/         renderer React (una vista per hash: #summary, #set-date,
             #settings, #greeting)
resources/   icona dell'app (icon.ico, icon.svg sorgente)
```

Ogni finestra "dialogo" (riepilogo, calendario, impostazioni, augurio) è una
`BrowserWindow` frameless e trasparente separata, che carica la stessa
`index.html` con un hash diverso.

## Dati

La configurazione è in `%APPDATA%/Reminder Fidanzamento/config.json`.
