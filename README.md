# Reminder Fidanzamento 💕

App con icona nella **System Tray** di Windows che ricorda mesiversario e anniversario del fidanzamento.

## Cosa fa

- Dal menu della tray imposti la **data di inizio fidanzamento** con un **date picker a calendario**.
- Ogni mese, lo stesso giorno → popup di auguri per il **mesiversario** (es. "18 mesi insieme").
- Ogni anno, lo stesso giorno → popup per l'**anniversario** (con cuoricini animati).
- I popup compaiono **al centro dello schermo**.
- Se un mese è più corto del giorno scelto (es. il 31), la ricorrenza scatta l'ultimo giorno del mese.
- Opzione **"Avvio automatico con Windows"** (voce di menu con spunta).

## Impostazioni (dal menu della tray)

Spunte rapide nel menu + finestra **"Impostazioni…"**:

- **Ricorda il mesiversario** / **Ricorda l'anniversario** — abilita/disabilita i due tipi.
- **Avviso a mezzanotte / di notte** — con orario personalizzabile (default `00:00`).
- **Avviso al mattino** — mostrato al primo avvio del PC dopo l'orario scelto (default `08:00`).
- **Suono** di notifica on/off.

Se il PC è acceso durante la notte, l'augurio compare all'orario notturno; se era spento,
compare al primo controllo dopo l'orario mattutino. Mostrato una sola volta al giorno.

## Installazione

```powershell
cd C:\Users\AlessandroPetrocco\Desktop\tets
pip install -r requirements.txt
```

## Avvio

Senza finestra della console:

```powershell
pythonw main.py
```

Al primo avvio ti chiede la data. Poi trovi l'icona a forma di cuore vicino all'orologio;
clic destro per il menu.

## Creare l'eseguibile (.exe)

```powershell
pip install -r requirements-build.txt
python build.py
```

Produce `dist\FidanzamentoReminder.exe` (unico file, senza console, con icona a cuore).
`build.py` genera anche `icon.ico` e installa PyInstaller se manca.
L'.exe è portabile: copialo dove vuoi ed eseguilo, parte in tray. La configurazione resta
sempre in `%APPDATA%\FidanzamentoReminder\config.json`.

## Avvio con Windows

Attivalo dal menu della tray: **"Avvio automatico con Windows"** — funziona sia con lo
script che con l'.exe (nel registro viene messo il percorso giusto in automatico).
Crea/rimuove la chiave in `HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run`
usando `pythonw.exe` (nessuna finestra nera all'avvio).

## Dati

La configurazione è in `%APPDATA%\FidanzamentoReminder\config.json`.

## Note

- Il controllo dell'orario gira ogni 30 secondi; l'augurio viene mostrato una sola volta al giorno.
- "Mostra augurio di prova" nel menu serve a vedere l'aspetto del popup.
