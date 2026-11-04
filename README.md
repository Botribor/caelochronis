# Caelochronis — Stazione Meteorologica Indipendente

Sito pubblico di Caelochronis, stazione meteorologica indipendente a Dalmine (BG).

- Sito: https://botribor.github.io/caelochronis/
- Weathercloud: https://app.weathercloud.net/d0069384413
- Weather Underground: https://www.wunderground.com/dashboard/pws/IDALMI6

## Attivare la dashboard automatica

1. Crea una **API Key** per la tua stazione in https://www.wunderground.com/member/api-keys (diversa dalla Station Key usata dalla console Bresser).
2. Apri GitHub → **Settings → Secrets and variables → Actions → New repository secret**.
3. Nome del secret: `WU_API_KEY`. Valore: la chiave API ottenuta da Weather Underground. **Non inserirla in file, commit, issue o chat.**
4. Apri **Actions → Aggiorna dati meteo Caelochronis → Run workflow** per il primo aggiornamento.
5. In seguito il workflow tenta un aggiornamento ogni circa **20 minuti** (la pianificazione GitHub non è garantita al minuto).

Il workflow `.github/workflows/weather.yml` esegue `scripts/fetch_weather.py` e pubblica nel repository `data/latest.json` e un archivio mensile in `data/history/YYYY-MM.json`, contenenti esclusivamente osservazioni meteorologiche pubbliche. La chiave API non viene pubblicata.

La dashboard aggiorna il JSON quando è disponibile e segnala se i dati sono assenti o troppo vecchi. Il widget Weathercloud resta indipendente.

## Grafici storici automatici

La sezione **Grafici** legge soltanto i campioni reali di IDALMI6 dall'archivio mensile e permette il confronto su **24 ore, 7 giorni e 30 giorni** per temperatura, umidità, pressione, vento e pioggia giornaliera cumulata. Non vengono inventati campioni mancanti e i grafici iniziano dal primo campione effettivamente salvato. Lo storico conserva circa un campione all'ora, mentre la dashboard utilizza osservazioni più recenti quando disponibili.

## Archivio

I CSV esportati da Weathercloud vengono elaborati soltanto nel browser; conserva sempre una copia dei CSV originali. I riepiloghi salvati nel browser non costituiscono un archivio permanente.

Le rilevazioni sono amatoriali e non sostituiscono i bollettini ufficiali o gli avvisi di Protezione Civile.

## Identità grafica

Marchio pubblico: **Caelochronis — Stazione Meteorologica Indipendente**. Motto: *Il cielo, un dato alla volta.*
Il nuovo emblema e la favicon sono in `assets/logo-caelochronis.webp` e `assets/favicon-caelochronis.webp`.
Gli identificativi tecnici IDALMI6 e Weathercloud d0069384413 rimangono invariati.

Il repository deve essere rinominato da `osservatorio-aetheris` a `caelochronis` in **Settings → General → Repository name**. I file del sito e lo storico rimangono nel medesimo repository. Al termine, verificare GitHub Pages in **Settings → Pages** e il workflow in **Actions**. Gli indirizzi Weathercloud e Weather Underground utilizzano ID tecnici e non vanno modificati.
