# Guida Setup – Winter SC Subiaco

## PASSO 1 – Crea account Supabase

1. Vai su **supabase.com**
2. Clicca "Start your project" e registrati con la Gmail del club
3. Crea un nuovo progetto:
   - Nome: `winter-sc-subiaco`
   - Password database: scegli una password sicura (salvala!)
   - Regione: Europe (West)

---

## PASSO 2 – Crea le tabelle del database

Nel pannello Supabase vai su **SQL Editor** e incolla ed esegui questo codice:

```sql
-- Profili utenti (collegati all'autenticazione)
CREATE TABLE profiles (
  id       UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nome     TEXT,
  cognome  TEXT,
  ruolo    TEXT NOT NULL DEFAULT 'atleta',  -- 'atleta' oppure 'allenatrice'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Diari settimanali
CREATE TABLE diari (
  id          BIGSERIAL PRIMARY KEY,
  atleta_id   UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  settimana_n INTEGER NOT NULL,
  data_dal    DATE,
  data_al     DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Allenamenti giornalieri
CREATE TABLE allenamenti (
  id          BIGSERIAL PRIMARY KEY,
  diario_id   BIGINT REFERENCES diari(id) ON DELETE CASCADE,
  giorno      TEXT NOT NULL,  -- 'L', 'MA', 'ME', 'G', 'V', 'S', 'D'
  note        TEXT,
  rpe         NUMERIC(3,1),

  -- Km per attività
  forza_km      NUMERIC(6,2) DEFAULT 0,
  pattini_km    NUMERIC(6,2) DEFAULT 0,
  marcia_km     NUMERIC(6,2) DEFAULT 0,
  bici_km       NUMERIC(6,2) DEFAULT 0,
  corsa_km      NUMERIC(6,2) DEFAULT 0,
  skiroll_cl_km NUMERIC(6,2) DEFAULT 0,
  skiroll_sk_km NUMERIC(6,2) DEFAULT 0,
  sci_cl_km     NUMERIC(6,2) DEFAULT 0,
  sci_sk_km     NUMERIC(6,2) DEFAULT 0,
  i1_km NUMERIC(6,2) DEFAULT 0,
  i2_km NUMERIC(6,2) DEFAULT 0,
  i3_km NUMERIC(6,2) DEFAULT 0,
  i4_km NUMERIC(6,2) DEFAULT 0,
  i5_km NUMERIC(6,2) DEFAULT 0,

  -- Ore per attività
  forza_ore      NUMERIC(5,2) DEFAULT 0,
  pattini_ore    NUMERIC(5,2) DEFAULT 0,
  marcia_ore     NUMERIC(5,2) DEFAULT 0,
  bici_ore       NUMERIC(5,2) DEFAULT 0,
  corsa_ore      NUMERIC(5,2) DEFAULT 0,
  skiroll_cl_ore NUMERIC(5,2) DEFAULT 0,
  skiroll_sk_ore NUMERIC(5,2) DEFAULT 0,
  sci_cl_ore     NUMERIC(5,2) DEFAULT 0,
  sci_sk_ore     NUMERIC(5,2) DEFAULT 0,
  i1_ore NUMERIC(5,2) DEFAULT 0,
  i2_ore NUMERIC(5,2) DEFAULT 0,
  i3_ore NUMERIC(5,2) DEFAULT 0,
  i4_ore NUMERIC(5,2) DEFAULT 0,
  i5_ore NUMERIC(5,2) DEFAULT 0,

  UNIQUE(diario_id, giorno)
);

-- Trigger: crea profilo automaticamente quando si registra un utente
CREATE OR REPLACE FUNCTION public.crea_profilo_utente()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, cognome, ruolo)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'nome',
    NEW.raw_user_meta_data->>'cognome',
    COALESCE(NEW.raw_user_meta_data->>'ruolo', 'atleta')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.crea_profilo_utente();

-- Sicurezza: ogni utente vede solo i propri dati
ALTER TABLE profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE diari       ENABLE ROW LEVEL SECURITY;
ALTER TABLE allenamenti ENABLE ROW LEVEL SECURITY;

-- Profili: ognuno vede il proprio + l'allenatrice vede tutti
CREATE POLICY "Profilo proprio" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Allenatrice vede tutti i profili" ON profiles FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND ruolo = 'allenatrice'));

-- Diari: atleta gestisce i propri, allenatrice li legge tutti
CREATE POLICY "Atleta gestisce propri diari" ON diari FOR ALL USING (atleta_id = auth.uid());
CREATE POLICY "Allenatrice vede tutti i diari" ON diari FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND ruolo = 'allenatrice'));

-- Allenamenti: stesso schema dei diari
CREATE POLICY "Atleta gestisce propri allenamenti" ON allenamenti FOR ALL
  USING (EXISTS (SELECT 1 FROM diari WHERE id = diario_id AND atleta_id = auth.uid()));
CREATE POLICY "Allenatrice vede tutti gli allenamenti" ON allenamenti FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND ruolo = 'allenatrice'));
```

---

## PASSO 3 – Ottieni le credenziali API

1. Nel pannello Supabase vai su **Settings → API**
2. Copia:
   - **Project URL** (inizia con `https://...supabase.co`)
   - **anon public key** (lunga stringa)
3. Apri il file `js/config.js` e incolla i valori:

```javascript
const SUPABASE_URL = 'https://xxxxx.supabase.co';  // ← il tuo URL
const SUPABASE_ANON_KEY = 'eyJhbGc...';             // ← la tua chiave
```

---

## PASSO 4 – Crea l'account dell'allenatrice

1. Nel pannello Supabase vai su **Authentication → Users**
2. Clicca **"Invite user"** e inserisci l'email dell'allenatrice
3. Dopo che l'allenatrice ha confermato l'email e impostato la password,
   vai su **Table Editor → profiles** e cambia il campo `ruolo` da `atleta` a `allenatrice`

---

## PASSO 5 – Deploy su Cloudflare Pages

1. Carica il progetto su GitHub (nuovo repository)
2. Vai su **pages.cloudflare.com** e accedi con la Gmail del club
3. Clicca **"Create a project"** → **"Connect to Git"**
4. Seleziona il repository, lascia le impostazioni di default
5. Clicca **"Save and Deploy"**
6. Il sito sarà online su `winter-sc-subiaco.pages.dev` (o nome simile)

---

## Aggiunta atleti

Dopo il deploy, l'allenatrice può aggiungere nuovi atleti direttamente
dalla dashboard dell'app (sezione "Aggiungi Nuovo Atleta").
L'atleta riceverà un'email con il link di conferma, poi potrà accedere.

> **Nota:** Su Supabase, per evitare la conferma via email durante i test,
> vai su **Authentication → Settings** e disabilita "Enable email confirmations".
