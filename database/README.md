# Configurazione del database locale

Questa guida descrive come ripristinare il database applicativo locale a partire da `database.sql` e configurare il backend per utilizzarlo. Il database Supabase online rimane separato e non viene modificato.

## Architettura

- Il backend Express si collega a PostgreSQL tramite Supavisor.
- Supabase self-hosted viene eseguito localmente con Docker Compose.
- Il dump viene importato in un database PostgreSQL dedicato, denominato `mobility_app`.
- Il frontend Angular comunica con il backend locale su `http://localhost:3000`.

Il database interno `postgres` dello stack Supabase e il database Supabase online non sono destinazioni per il dump.

## Prerequisiti

Sul computer devono essere disponibili:

- Docker Engine o Docker Desktop con Docker Compose;
- Node.js e npm;
- il repository dell’applicazione, contenente `backend/` e `frontend/`;
- il progetto Supabase self-hosted, contenente `docker-compose.yml`, `run.sh`, `volumes/` ed `.env.example`;
- il file `database.sql`.

Il repository applicativo e il dump SQL non includono lo stack Supabase. Procurarsi separatamente i file del progetto self-hosted. Creare i file `.env` sul nuovo computer e generare credenziali locali; non riutilizzare o trasferire segreti di altri ambienti.

Il dump contiene dati applicativi e hash di password. Conservarlo e trasferirlo in modo sicuro.

## Struttura delle directory

Gli esempi seguenti assumono una struttura simile a questa:

```text
workspace/
├── Taw-project/
│   ├── backend/
│   └── frontend/
├── supabase-project/
│   ├── docker-compose.yml
│   ├── run.sh
│   └── .env
└── database.sql
```

Adattare i percorsi dei comandi se la struttura locale è diversa. Conservare il dump fuori da `frontend/public`.

## Configurazione dello stack Supabase

Aprire un terminale nella directory dello stack:

```bash
cd ~/workspace/supabase-project
cp .env.example .env
```

Se `.env` esiste già, non sovrascriverlo. Configurare almeno le variabili seguenti nel file, mantenendo anche tutte le altre impostazioni richieste dallo stack:

```dotenv
POSTGRES_PASSWORD=<password-locale-forte>
POSTGRES_DB=postgres
POSTGRES_PORT=5432
POSTGRES_PORT_HOST=5433
POOLER_TENANT_ID=your-tenant-id
```

Impostare un valore per `POOLER_TENANT_ID` e generare i segreti richiesti dallo stack con gli strumenti previsti dal progetto Supabase. Non inserire nel file credenziali del database online.

Validare la configurazione Compose. L’output può contenere segreti e non deve essere condiviso senza oscurarli:

```bash
docker compose config
```

## Avvio dello stack locale

Avviare i servizi Supabase:

```bash
docker compose up --pull always -d
```

Verificarne lo stato:

```bash
docker compose ps
```

Lo stack utilizzato per questa configurazione pubblica Supavisor sulla porta host `5433` e inoltra le connessioni a PostgreSQL sulla porta interna `5432`. Il backend eseguito sull’host si connette quindi a `localhost:5433`. Il nome host `db` è utilizzabile dai container appartenenti alla rete Compose, non dal backend eseguito direttamente sull’host.

Se la porta host `5433` è occupata, configurare una porta libera in `.env` e utilizzare la stessa porta nel `DATABASE_URL` del backend.

## Creazione del database applicativo

Verificare che `mobility_app` non esista già:

```bash
docker exec supabase-db psql -U postgres -d postgres -Atc \
  "SELECT datname FROM pg_database WHERE datname = 'mobility_app';"
```

Se la query non restituisce righe, creare il database vuoto:

```bash
docker exec supabase-db createdb -U postgres -T template0 mobility_app
```

Se il database esiste già, verificarne il contenuto prima di procedere. Il dump non è una migrazione incrementale; importarlo in un database popolato può provocare errori o sovrascrivere dati.

## Importazione del dump

Il database appena creato contiene uno schema `public` vuoto. Poiché `database.sql` include `CREATE SCHEMA public`, rimuovere lo schema vuoto dal solo database `mobility_app` appena creato:

```bash
docker exec supabase-db psql -U postgres -d mobility_app -v ON_ERROR_STOP=1 \
  -c 'DROP SCHEMA public CASCADE;'
```

> **Attenzione:** `DROP SCHEMA public CASCADE` elimina lo schema `public` e tutti gli oggetti contenuti nel database specificato. Eseguirlo esclusivamente sul database locale `mobility_app` nuovo e vuoto. Non eseguirlo sul database `postgres` né sul database online.

Dalla directory `supabase-project`, importare il dump:

```bash
cat ../database.sql | \
  docker exec -i supabase-db psql -U postgres -d mobility_app -v ON_ERROR_STOP=1
```

Adattare il percorso se `database.sql` si trova in un’altra directory. L’opzione `ON_ERROR_STOP=1` interrompe l’esecuzione al primo errore SQL. In caso di errore, considerare il ripristino incompleto e controllare l’output prima di procedere.

## Verifica dei dati

Controllare i conteggi delle tabelle principali:

```bash
docker exec supabase-db psql -U postgres -d mobility_app -c \
  "SELECT
    (SELECT count(*) FROM public.application_states) AS stati,
    (SELECT count(*) FROM public.countries) AS paesi,
    (SELECT count(*) FROM public.universities) AS universita,
    (SELECT count(*) FROM public.courses_list) AS corsi,
    (SELECT count(*) FROM public.users) AS utenti,
    (SELECT count(*) FROM public.applications) AS domande;"
```

Per la versione del dump utilizzata nella procedura, i conteggi attesi sono 12 stati, 23 paesi, 45 università, 137 corsi, 16 utenti e 8 domande. I valori possono cambiare se viene distribuito un dump aggiornato.

Verificare i nomi degli stati applicativi:

```bash
docker exec supabase-db psql -U postgres -d mobility_app -c \
  "SELECT state_id, name FROM public.application_states ORDER BY state_id;"
```

## Configurazione del backend

Creare `backend/.env` con i parametri seguenti:

```dotenv
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres.<POOLER_TENANT_ID>:<PASSWORD_POSTGRES_LOCALE>@localhost:5433/mobility_app
DB_SSL=false
JWT_SECRET=<SEGRETO_JWT_NUOVO>
```

Sostituire i segnaposto:

- `<POOLER_TENANT_ID>` con il valore `POOLER_TENANT_ID` dello stack locale;
- `<PASSWORD_POSTGRES_LOCALE>` con `POSTGRES_PASSWORD` dello stack locale;
- `<SEGRETO_JWT_NUOVO>` con un segreto generato sul computer, ad esempio con `openssl rand -hex 32`.

Se la porta host Supavisor è stata modificata, aggiornare la porta nell’URL. Codificare i caratteri riservati URL presenti nella password, ad esempio `@`, `:`, `/`, `#` e `%`.

Per la connessione locale senza TLS, impostare `DB_SSL=false`. Il backend richiede `DATABASE_URL` e utilizza `DB_SSL` per determinare la configurazione TLS. `backend/.gitignore` esclude `.env`: non committare il file né inserirne i valori reali nel codice o in immagini container.

Il `DATABASE_URL` deve puntare a `localhost:<porta-host>/mobility_app`, non al database online.

## Verifica della connessione

Installare le dipendenze del backend:

```bash
cd ~/workspace/Taw-project/backend
npm ci
```

Verificare la connessione e il nome del database selezionato senza stampare credenziali:

```bash
node - <<'NODE'
require('dotenv').config({ quiet: true });
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});
pool.query('SELECT current_database() AS database, count(*) AS states FROM public.application_states')
  .then(({ rows }) => console.log(rows[0]))
  .catch((error) => { console.error(error.message); process.exitCode = 1; })
  .finally(() => pool.end());
NODE
```

Il risultato deve indicare `mobility_app` e un conteggio degli stati coerente con il dump. L’errore `no tenant identifier provided` indica in genere che il nome utente non include il tenant, nel formato `postgres.<POOLER_TENANT_ID>`. In caso di errore di autenticazione, verificare la password locale e il tenant configurato in Supavisor.

## Avvio dell’applicazione

Dalla directory `backend`, compilare e avviare il servizio in modalità sviluppo:

```bash
npm run build
npm run dev
```

Verificare i messaggi di avvio:

```text
Application states loaded successfully.
Server running on port 3000
```

Swagger UI è disponibile su `http://localhost:3000/api-docs`.

In un secondo terminale, avviare il frontend:

```bash
cd ~/workspace/Taw-project/frontend
npm ci
npm start
```

Aprire `http://localhost:4200`. `frontend/src/environments/environment.ts` configura l’API base URL come `http://localhost:3000`.

## Verifica finale

Verificare che:

1. `docker compose ps` mostri attivi i servizi Supabase locali;
2. `mobility_app` contenga le tabelle e i dati importati;
3. il test di connessione restituisca `mobility_app` e non `postgres`;
4. il backend abbia caricato gli stati e sia in ascolto sulla porta `3000`;
5. il frontend sia disponibile su `http://localhost:4200` e usi l’API locale.

Questi controlli confermano che l’applicazione usa la copia PostgreSQL locale. Non eseguire operazioni di restore sull’istanza online.

## File non inclusi nel dump

Il dump SQL contiene schema e dati, incluse le righe della tabella `documents`, ma non i file PDF o altri file binari. Per ripristinare i documenti, trasferire separatamente `backend/uploads/` mantenendo la struttura dei percorsi. I file `.env` non sono inclusi: generare le configurazioni e i segreti locali sul computer di destinazione.

## Arresto e riavvio dello stack

Per arrestare i servizi senza rimuovere i dati persistenti, eseguire dalla directory dello stack:

```bash
docker compose down
```

Per riavviare lo stack:

```bash
cd ~/workspace/supabase-project
sh run.sh start
```

Non utilizzare `docker compose down -v` o rimuovere i volumi durante il normale arresto: tali operazioni possono eliminare i dati persistenti dello stack.
