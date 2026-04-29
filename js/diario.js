// ============================================================
//  CONFIGURAZIONE TABELLA
// ============================================================

const GIORNI = [
  { chiave: 'L',  etichetta: 'L',  nome: 'Lunedì'    },
  { chiave: 'MA', etichetta: 'M',  nome: 'Martedì'   },
  { chiave: 'ME', etichetta: 'M',  nome: 'Mercoledì' },
  { chiave: 'G',  etichetta: 'G',  nome: 'Giovedì'   },
  { chiave: 'V',  etichetta: 'V',  nome: 'Venerdì'   },
  { chiave: 'S',  etichetta: 'S',  nome: 'Sabato'    },
  { chiave: 'D',  etichetta: 'D',  nome: 'Domenica'  },
];

const ATTIVITA = [
  { chiave: 'forza',      label: 'Forza'      },
  { chiave: 'pattini',    label: 'Pattini'    },
  { chiave: 'marcia',     label: 'Marcia'     },
  { chiave: 'bici',       label: 'Bici'       },
  { chiave: 'corsa',      label: 'Corsa'      },
  { chiave: 'skiroll_cl', label: 'Skiroll CL' },
  { chiave: 'skiroll_sk', label: 'Skiroll SK' },
  { chiave: 'sci_cl',     label: 'Sci CL'     },
  { chiave: 'sci_sk',     label: 'Sci SK'     },
];

const INTENSITA = [
  { chiave: 'i1', label: 'I1' },
  { chiave: 'i2', label: 'I2' },
  { chiave: 'i3', label: 'I3' },
  { chiave: 'i4', label: 'I4' },
  { chiave: 'i5', label: 'I5' },
];

const TUTTI_CAMPI = [...ATTIVITA, ...INTENSITA];

let diarioCorrenteId = null;
let utenteCorrente   = null;

// ============================================================
//  COSTRUZIONE TABELLA
// ============================================================

function costruisciTabella() {
  const tbody = document.getElementById('corpoTabella');
  tbody.innerHTML = GIORNI.map(g => righeGiorno(g)).join('');

  const tfoot = document.getElementById('pieTabella');
  const celleKm  = TUTTI_CAMPI.map(f => `<td class="cella-tot" id="tot_km_${f.chiave}">-</td>`).join('');
  const celleOre = TUTTI_CAMPI.map(f => `<td class="cella-tot" id="tot_ore_${f.chiave}">-</td>`).join('');

  tfoot.innerHTML = `
    <tr class="riga-tot">
      <td colspan="2" class="etichetta-tot">TOT Km</td>
      ${celleKm}
      <td class="cella-tot" id="tot_km_settimana">-</td>
      <td class="cella-prog" id="prog_km_totale">-</td>
    </tr>
    <tr class="riga-tot">
      <td colspan="2" class="etichetta-tot">TOT Ore</td>
      ${celleOre}
      <td class="cella-tot" id="tot_ore_settimana">-</td>
      <td class="cella-prog" id="prog_ore_totale">-</td>
    </tr>
  `;
}

function righeGiorno(giorno) {
  const d = giorno.chiave;
  const lbl = giorno.etichetta;

  const inputsKm = TUTTI_CAMPI.map(f =>
    `<td><input type="number" id="${d}_${f.chiave}_km" min="0" step="0.1" oninput="aggiornaTotali()"></td>`
  ).join('');

  const inputsOre = TUTTI_CAMPI.map(f =>
    `<td><input type="number" id="${d}_${f.chiave}_ore" min="0" step="0.05" oninput="aggiornaTotali()"></td>`
  ).join('');

  return `
    <tr>
      <td rowspan="3" class="etichetta-giorno" title="${giorno.nome}">${lbl}</td>
      <td colspan="17" class="cella-note">
        <div class="note-interne">
          <textarea id="${d}_note" placeholder="Note allenamento ${giorno.nome.toLowerCase()}..." rows="2"></textarea>
          <div class="rpe-box">
            <span>RPE:</span>
            <input type="number" id="${d}_rpe" min="1" max="10" step="0.5" placeholder="-">
          </div>
        </div>
      </td>
    </tr>
    <tr>
      <td class="etichetta-sub km-lbl">Km</td>
      ${inputsKm}
      <td class="cella-tot" id="${d}_tot_km">-</td>
      <td class="cella-prog" id="${d}_prog_km">-</td>
    </tr>
    <tr>
      <td class="etichetta-sub ore-lbl">Ore</td>
      ${inputsOre}
      <td class="cella-tot" id="${d}_tot_ore">-</td>
      <td class="cella-prog" id="${d}_prog_ore">-</td>
    </tr>
  `;
}

// ============================================================
//  CALCOLO TOTALI
// ============================================================

function leggiNum(id) {
  return parseFloat(document.getElementById(id)?.value) || 0;
}

function formattaOre(h) {
  const ore = Math.floor(h);
  const min = Math.round((h - ore) * 60);
  return `${ore}:${min.toString().padStart(2, '0')}`;
}

function aggiornaTotali() {
  let totKmSett = 0, totOreSett = 0;

  GIORNI.forEach(g => {
    const d = g.chiave;
    let kmGiorno = 0, oreGiorno = 0;

    // Solo le attività contano per il totale (I1-I5 sono zone di intensità, non si sommano)
    ATTIVITA.forEach(f => {
      kmGiorno  += leggiNum(`${d}_${f.chiave}_km`);
      oreGiorno += leggiNum(`${d}_${f.chiave}_ore`);
    });

    const elKm  = document.getElementById(`${d}_tot_km`);
    const elOre = document.getElementById(`${d}_tot_ore`);
    if (elKm)  elKm.textContent  = kmGiorno  > 0 ? kmGiorno.toFixed(1)   : '-';
    if (elOre) elOre.textContent = oreGiorno > 0 ? formattaOre(oreGiorno) : '-';

    totKmSett  += kmGiorno;
    totOreSett += oreGiorno;
  });

  // Totali colonna per attività
  TUTTI_CAMPI.forEach(f => {
    let colKm = 0, colOre = 0;
    GIORNI.forEach(g => {
      colKm  += leggiNum(`${g.chiave}_${f.chiave}_km`);
      colOre += leggiNum(`${g.chiave}_${f.chiave}_ore`);
    });
    const elKm  = document.getElementById(`tot_km_${f.chiave}`);
    const elOre = document.getElementById(`tot_ore_${f.chiave}`);
    if (elKm)  elKm.textContent  = colKm  > 0 ? colKm.toFixed(1)    : '-';
    if (elOre) elOre.textContent = colOre > 0 ? formattaOre(colOre) : '-';
  });

  const elTotKm  = document.getElementById('tot_km_settimana');
  const elTotOre = document.getElementById('tot_ore_settimana');
  if (elTotKm)  elTotKm.textContent  = totKmSett  > 0 ? totKmSett.toFixed(1)   : '-';
  if (elTotOre) elTotOre.textContent = totOreSett > 0 ? formattaOre(totOreSett) : '-';
}

// ============================================================
//  CARICA / PULISCI MODULO
// ============================================================

function pulisciModulo() {
  GIORNI.forEach(g => {
    const d = g.chiave;
    const elNote = document.getElementById(`${d}_note`);
    const elRpe  = document.getElementById(`${d}_rpe`);
    if (elNote) elNote.value = '';
    if (elRpe)  elRpe.value  = '';
    TUTTI_CAMPI.forEach(f => {
      const elKm  = document.getElementById(`${d}_${f.chiave}_km`);
      const elOre = document.getElementById(`${d}_${f.chiave}_ore`);
      if (elKm)  elKm.value  = '';
      if (elOre) elOre.value = '';
    });
  });
  aggiornaTotali();
}

async function aggiornaProgressivi(settimana_n) {
  if (!settimana_n || !utenteCorrente) return;

  const { data: diari } = await db
    .from('diari')
    .select('id')
    .eq('atleta_id', utenteCorrente.id)
    .lte('settimana_n', settimana_n);

  const ids = (diari || []).map(d => d.id);
  if (!ids.length) return;

  const { data: tuttiAll } = await db
    .from('allenamenti')
    .select('*')
    .in('diario_id', ids);

  let progKm = 0, progOre = 0;
  (tuttiAll || []).forEach(a => {
    ATTIVITA.forEach(f => {
      progKm  += parseFloat(a[`${f.chiave}_km`])  || 0;
      progOre += parseFloat(a[`${f.chiave}_ore`]) || 0;
    });
  });

  GIORNI.forEach(g => {
    const elKm  = document.getElementById(`${g.chiave}_prog_km`);
    const elOre = document.getElementById(`${g.chiave}_prog_ore`);
    if (elKm)  elKm.textContent  = progKm  > 0 ? progKm.toFixed(1)    : '-';
    if (elOre) elOre.textContent = progOre > 0 ? formattaOre(progOre) : '-';
  });

  const elKmTot  = document.getElementById('prog_km_totale');
  const elOreTot = document.getElementById('prog_ore_totale');
  if (elKmTot)  elKmTot.textContent  = progKm  > 0 ? progKm.toFixed(1)    : '-';
  if (elOreTot) elOreTot.textContent = progOre > 0 ? formattaOre(progOre) : '-';
}

async function caricaDiario(diarioId, settimana_n) {
  if (!diarioId) { pulisciModulo(); return; }

  const { data: allenamenti } = await db
    .from('allenamenti')
    .select('*')
    .eq('diario_id', diarioId);

  pulisciModulo();
  if (!allenamenti) return;

  allenamenti.forEach(a => {
    const d = a.giorno;
    const elNote = document.getElementById(`${d}_note`);
    const elRpe  = document.getElementById(`${d}_rpe`);
    if (elNote) elNote.value = a.note || '';
    if (elRpe)  elRpe.value  = a.rpe  != null ? a.rpe : '';

    TUTTI_CAMPI.forEach(f => {
      const elKm  = document.getElementById(`${d}_${f.chiave}_km`);
      const elOre = document.getElementById(`${d}_${f.chiave}_ore`);
      if (elKm)  elKm.value  = a[`${f.chiave}_km`]  || '';
      if (elOre) elOre.value = a[`${f.chiave}_ore`] || '';
    });
  });

  aggiornaTotali();
  await aggiornaProgressivi(settimana_n);
}

// ============================================================
//  SALVATAGGIO
// ============================================================

async function salvaDiario() {
  const btn = document.getElementById('btnSalva');
  btn.textContent = 'Salvataggio...';
  btn.disabled = true;

  const settimana_n = parseInt(document.getElementById('settimana_n').value);
  const data_dal    = document.getElementById('data_dal').value;
  const data_al     = document.getElementById('data_al').value;

  if (!settimana_n) {
    mostraMsg('Inserisci il numero di settimana.', 'errore');
    btn.textContent = '💾 Salva Diario';
    btn.disabled = false;
    return;
  }

  let diarioId = diarioCorrenteId;

  if (!diarioId) {
    const { data, error } = await db.from('diari').insert({
      atleta_id:   utenteCorrente.id,
      settimana_n,
      data_dal:    data_dal || null,
      data_al:     data_al  || null,
    }).select().single();

    if (error) {
      mostraMsg('Errore: ' + error.message, 'errore');
      btn.textContent = '💾 Salva Diario';
      btn.disabled = false;
      return;
    }
    diarioId = data.id;
    diarioCorrenteId = diarioId;
  } else {
    await db.from('diari').update({
      settimana_n,
      data_dal:    data_dal || null,
      data_al:     data_al  || null,
      updated_at:  new Date().toISOString(),
    }).eq('id', diarioId);
  }

  for (const giorno of GIORNI) {
    const d = giorno.chiave;
    const note = document.getElementById(`${d}_note`)?.value || '';
    const rpe  = parseFloat(document.getElementById(`${d}_rpe`)?.value) || null;

    const riga = { diario_id: diarioId, giorno: d, note, rpe };

    TUTTI_CAMPI.forEach(f => {
      riga[`${f.chiave}_km`]  = parseFloat(document.getElementById(`${d}_${f.chiave}_km`)?.value)  || 0;
      riga[`${f.chiave}_ore`] = parseFloat(document.getElementById(`${d}_${f.chiave}_ore`)?.value) || 0;
    });

    await db.from('allenamenti').upsert(riga, { onConflict: 'diario_id,giorno' });
  }

  mostraMsg('✅ Diario salvato con successo!', 'ok');
  btn.textContent = '💾 Salva Diario';
  btn.disabled = false;
  await caricaListaDiari();
}

// ============================================================
//  LISTA DIARI (SELECT)
// ============================================================

async function caricaListaDiari() {
  const { data: diari } = await db
    .from('diari')
    .select('id, settimana_n, data_dal, data_al')
    .eq('atleta_id', utenteCorrente.id)
    .order('settimana_n', { ascending: false });

  const sel = document.getElementById('diarioSelect');
  sel.innerHTML = '<option value="">➕ Nuova settimana</option>';

  (diari || []).forEach(d => {
    const opt = document.createElement('option');
    opt.value = d.id;
    const dal = d.data_dal ? new Date(d.data_dal).toLocaleDateString('it-IT') : '';
    const al  = d.data_al  ? new Date(d.data_al).toLocaleDateString('it-IT')  : '';
    opt.textContent = `Sett. ${d.settimana_n}${dal ? `  (${dal} → ${al})` : ''}`;
    if (d.id === diarioCorrenteId) opt.selected = true;
    sel.appendChild(opt);
  });
}

// ============================================================
//  MESSAGGI
// ============================================================

function mostraMsg(testo, tipo) {
  const el = document.getElementById('msgSalva');
  el.textContent = testo;
  el.className = tipo === 'errore' ? 'msg-errore' : 'msg-ok';
  el.classList.remove('nascosto');
  setTimeout(() => el.classList.add('nascosto'), 4000);
}

// ============================================================
//  INIZIALIZZAZIONE
// ============================================================

window.addEventListener('DOMContentLoaded', async () => {
  const auth = await checkAuth('atleta');
  if (!auth) return;

  utenteCorrente = auth.session.user;

  const nome = auth.profile?.nome
    ? `${auth.profile.nome} ${auth.profile.cognome || ''}`.trim()
    : auth.session.user.email;

  document.getElementById('nomeUtente').textContent = nome;

  costruisciTabella();
  await caricaListaDiari();

  document.getElementById('diarioSelect').addEventListener('change', async (e) => {
    const id = e.target.value ? parseInt(e.target.value) : null;
    diarioCorrenteId = id;

    if (id) {
      const { data: diario } = await db.from('diari').select('*').eq('id', id).single();
      if (diario) {
        document.getElementById('settimana_n').value = diario.settimana_n || '';
        document.getElementById('data_dal').value    = diario.data_dal    || '';
        document.getElementById('data_al').value     = diario.data_al     || '';
      }
      await caricaDiario(id, diario?.settimana_n);
    } else {
      document.getElementById('settimana_n').value = '';
      document.getElementById('data_dal').value    = '';
      document.getElementById('data_al').value     = '';
      pulisciModulo();
    }
  });

  document.getElementById('btnSalva').addEventListener('click', salvaDiario);
  document.getElementById('btnEsci').addEventListener('click', logout);
});
