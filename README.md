# Osservatorio Aetheris

Sito pubblico dell'Osservatorio Aetheris, Dalmine (BG).

- Sito: https://botribor.github.io/osservatorio-aetheris/
- Weathercloud: https://app.weathercloud.net/d0069384413
- Weather Underground: https://www.wunderground.com/dashboard/pws/IDALMI6

## Attivare la dashboard automatica

1. Crea una **API Key** per la tua stazione in https://www.wunderground.com/member/api-keys (diversa dalla Station Key usata dalla console Bresser).
2. Apri GitHub → **Settings → Secrets and variables → Actions → New repository secret**.
3. Nome del secret: `WU_API_KEY`. Valore: la chiave API ottenuta da Weather Underground. **Non inserirla in file, commit, issue o chat.**
4. Apri **Actions → Aggiorna dati meteo Aetheris → Run workflow** per il primo aggiornamento.
5. In seguito il workflow tenta un aggiornamento ogni circa **20 minuti** (la pianificazione GitHub non è garantita al minuto).

Il workflow `.github/workflows/weather.yml` esegue `scripts/fetch_weather.py` e pubblica nel repository soltanto `data/latest.json`: temperatura, umidità, pressione, vento, pioggia, UV, radiazione solare e punto di rugiada. La chiave API non viene pubblicata.

La dashboard aggiorna il JSON quando è disponibile e segnala se i dati sono assenti o troppo vecchi. Il widget Weathercloud resta indipendente.

## Archivio

I CSV esportati da Weathercloud vengono elaborati soltanto nel browser; conserva sempre una copia dei CSV originali. I riepiloghi salvati nel browser non costituiscono un archivio permanente.

Le rilevazioni sono amatoriali e non sostituiscono i bollettini ufficiali o gli avvisi di Protezione Civile.
