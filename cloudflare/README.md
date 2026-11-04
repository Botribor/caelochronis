# Caelochronis — raccolta meteo con Cloudflare Workers

Questa cartella contiene un **Cloudflare Worker** progettato per chiedere a GitHub di avviare la raccolta dei dati meteorologici IDALMI6 **ogni 10 minuti**. Il sito rimane gratuito su GitHub Pages; i campioni sono salvati da `scripts/fetch_weather.py` in `data/latest.json` e nello storico mensile. La chiave Weather Underground **WU_API_KEY rimane segreta su GitHub** e non va trasferita su Cloudflare.

## Preparazione GitHub

1. Aprire https://github.com/settings/personal-access-tokens/new e creare un **Fine-grained personal access token**.
2. Come *Resource owner* scegliere `Botribor`; limitare l'accesso al **solo repository `caelochronis`**.
3. Abilitare **Repository permissions → Actions: Read and write** (Metadata: Read è automatico).
4. Scegliere una scadenza e impostare un promemoria per il rinnovo. **Non incollare mai il token nel codice o in ChatGPT.**
5. Il token verrà salvato su Cloudflare come **Secret** chiamato esattamente `GITHUB_ACTIONS_TOKEN`.

Il permesso Actions write serve a richiamare l'endpoint GitHub REST `POST /repos/Botribor/caelochronis/actions/workflows/weather.yml/dispatches`, che avvia il workflow esistente su `main`.

## Attivazione su Cloudflare (interfaccia)

1. Aprire https://dash.cloudflare.com/ → **Workers & Pages** → **Create**, quindi creare il Worker `caelochronis-meteo-scheduler`.
2. In **Edit code** sostituire il codice iniziale con il contenuto di [src/worker.mjs](src/worker.mjs), poi eseguire il deploy. Il codice contiene un handler `scheduled` e un endpoint HTTP non utilizzabile (risponde 404).
3. In **Settings → Variables and Secrets**, aggiungere il **Secret** `GITHUB_ACTIONS_TOKEN` con il valore del token creato al punto precedente. Non aggiungerlo come variabile pubblica.
4. In **Settings → Triggers → Cron Triggers** inserire `2,12,22,32,42,52 * * * *` (UTC). Pianifica una richiesta ogni 10 minuti.
5. Attendere la propagazione della pianificazione e verificare le esecuzioni del Worker nei log Cloudflare.

I nomi delle voci di Cloudflare possono variare. In alternativa è possibile usare Wrangler (dalla directory `cloudflare`):

```bash
npx wrangler login
npx wrangler deploy
npx wrangler secret put GITHUB_ACTIONS_TOKEN
```

Il file [wrangler.jsonc](wrangler.jsonc) contiene già il nome del Worker e i Cron Triggers. Per i test locali: `node --test test/worker.test.mjs`.

## Controllo del funzionamento

- Aprire https://github.com/Botribor/caelochronis/actions/workflows/weather.yml e verificare nuove esecuzioni con evento **workflow_dispatch** a intervalli di circa 10 minuti.
- Controllare che `data/latest.json` venga aggiornato con nuove date di osservazione.
- Aprire https://botribor.github.io/caelochronis/ e verificare l'orario di acquisizione.
- Un **HTTP 204** significa che GitHub ha accettato l'avvio del workflow, **non** che la rilevazione sia stata pubblicata. Controllare anche l'esito del workflow e di GitHub Pages.
- In caso di HTTP 401/403 controllare scadenza token, repository selezionato e Actions write.

## Sicurezza, costi e fallback

- Il Worker non riceve la chiave Weather Underground, non espone un comando HTTP pubblico e non stampa il token nei log.
- Cloudflare Workers Cron Triggers e GitHub Actions rimangono soggetti a limiti di piano e possibili ritardi. Dieci minuti è l'obiettivo di avvio, non una garanzia di pubblicazione al minuto.
- Il workflow GitHub programmato resta **attivo come fallback** finché non avremo verificato l'operatività del Worker in produzione. Dopo il collaudo si potrà ridurre la sua frequenza per limitare esecuzioni duplicate.
- L'archivio conserva circa un campione per ora: avviare più spesso il workflow rende più attuali i dati live, **non** aumenta automaticamente la risoluzione dello storico.
- Documentazione: https://developers.cloudflare.com/workers/configuration/cron-triggers/ e https://docs.github.com/en/rest/actions/workflows#create-a-workflow-dispatch-event .
