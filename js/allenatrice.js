// ============================================================
//  DASHBOARD ALLENATRICE
// ============================================================

const GIORNI_ALL = [
  { chiave: 'L',  etichetta: 'L',  nome: 'Lunedì'    },
  { chiave: 'MA', etichetta: 'M',  nome: 'Martedì'   },
  { chiave: 'ME', etichetta: 'M',  nome: 'Mercoledì' },
  { chiave: 'G',  etichetta: 'G',  nome: 'Giovedì'   },
  { chiave: 'V',  etichetta: 'V',  nome: 'Venerdì'   },
  { chiave: 'S',  etichetta: 'S',  nome: 'Sabato'    },
  { chiave: 'D',  etichetta: 'D',  nome: 'Domenica'  },
];

const CAMPI_ALL = [
  { chiave: 'forza',      label: 'Forza'      },
  { chiave: 'pattini',    label: 'Pattini'    },
  { chiave: 'marcia',     label: 'Marcia'     },
  { chiave: 'bici',       label: 'Bici'       },
  { chiave: 'corsa',      label: 'Corsa'      },
  { chiave: 'skiroll_cl', label: 'Skiroll CL' },
  { chiave: 'skiroll_sk', label: 'Skiroll SK' },
  { chiave: 'sci_cl',     label: 'Sci CL'     },
  { chiave: 'sci_sk',     label: 'Sci SK'     },
  { chiave: 'i1', label: 'I1' },
  { chiave: 'i2', label: 'I2' },
  { chiave: 'i3', label: 'I3' },
  { chiave: 'i4', label: 'I4' },
  { chiave: 'i5', label: 'I5' },
];

function fmtOre(h) {
  const ore = Math.floor(h);
  const min = Math.round((h - ore) * 60);
  return `${ore}:${min.toString().padStart(2, '0')}`;
}

// ============================================================
//  CARICA ATLETI
// ============================================================

async function caricaAtleti() {
  const { data: atleti } = await db
    .from('profiles')
    .select('id, nome, cognome')
    .eq('ruolo', 'atleta')
    .order('cognome');

  const lista = document.getElementById('listaAtleti');
  const contatore = document.getElementById('contatoreAtleti');

  if (!atleti || atleti.length === 0) {
    lista.innerHTML = '<div class="stato-vuoto">Nessun atleta registrato ancora.</div>';
    if (contatore) contatore.textContent = '0';
    return;
  }

  if (contatore) contatore.textContent = atleti.length;

  lista.innerHTML = atleti.map(a => {
    const nome = [a.nome, a.cognome].filter(Boolean).join(' ') || 'Nome non impostato';
    const iniziali = [a.nome?.[0], a.cognome?.[0]].filter(Boolean).join('').toUpperCase() || '?';
    return `
      <div class="atleta-riga" onclick="apriAtleta('${a.id}', '${nome.replace(/'/g, "\\'")}')">
        <div class="atleta-riga-sx">
          <div class="atleta-avatar">${iniziali}</div>
          <div class="atleta-nome">${nome}</div>
        </div>
        <span class="badge badge-verde">Attivo</span>
      </div>
    `;
  }).join('');
}

// ============================================================
//  MODALE ATLETA
// ============================================================

async function apriAtleta(atletaId, nome) {
  document.getElementById('titoloModale').textContent = nome;
  document.getElementById('overlay').classList.remove('nascosto');
  document.getElementById('contenutoModale').innerHTML = '<div class="stato-vuoto">Caricamento...</div>';
  document.getElementById('tabSettimane').innerHTML = '';

  const { data: diari } = await db
    .from('diari')
    .select('id, settimana_n, data_dal, data_al')
    .eq('atleta_id', atletaId)
    .order('settimana_n', { ascending: false });

  if (!diari || diari.length === 0) {
    document.getElementById('contenutoModale').innerHTML =
      '<div class="stato-vuoto">Nessun diario compilato ancora.</div>';
    return;
  }

  const tabs = document.getElementById('tabSettimane');
  tabs.innerHTML = diari.map((d, i) => `
    <button class="tab-sett ${i === 0 ? 'attivo' : ''}"
            onclick="mostraDiario(${d.id}, this, '${atletaId}')">
      Sett. ${d.settimana_n}
    </button>
  `).join('');

  await mostraDiario(diari[0].id, tabs.querySelector('.tab-sett'), atletaId);
}

function chiudiModale() {
  document.getElementById('overlay').classList.add('nascosto');
}

// ============================================================
//  VISUALIZZA DIARIO (sola lettura)
// ============================================================

async function mostraDiario(diarioId, tabEl, atletaId) {
  document.querySelectorAll('.tab-sett').forEach(t => t.classList.remove('attivo'));
  if (tabEl) tabEl.classList.add('attivo');

  const { data: diario } = await db.from('diari').select('*').eq('id', diarioId).single();
  const { data: allenamenti } = await db.from('allenamenti').select('*').eq('diario_id', diarioId);

  const dal = diario.data_dal ? new Date(diario.data_dal).toLocaleDateString('it-IT') : '-';
  const al  = diario.data_al  ? new Date(diario.data_al).toLocaleDateString('it-IT')  : '-';

  const mappa = {};
  (allenamenti || []).forEach(a => { mappa[a.giorno] = a; });

  // Totali progressivi stagione (tutte le settimane fino a questa inclusa)
  let progKm = 0, progOre = 0;
  if (atletaId) {
    const { data: dariPrec } = await db
      .from('diari')
      .select('id')
      .eq('atleta_id', atletaId)
      .lte('settimana_n', diario.settimana_n);

    const ids = (dariPrec || []).map(d => d.id);
    if (ids.length > 0) {
      const { data: tuttiAll } = await db
        .from('allenamenti')
        .select('*')
        .in('diario_id', ids);

      (tuttiAll || []).forEach(a => {
        CAMPI_ALL.forEach(f => {
          progKm  += parseFloat(a[`${f.chiave}_km`])  || 0;
          progOre += parseFloat(a[`${f.chiave}_ore`]) || 0;
        });
      });
    }
  }

  // Totale settimana corrente (per tfoot)
  let settKm = 0, settOre = 0;
  GIORNI_ALL.forEach(g => {
    CAMPI_ALL.forEach(f => {
      settKm  += parseFloat((mappa[g.chiave] || {})[`${f.chiave}_km`])  || 0;
      settOre += parseFloat((mappa[g.chiave] || {})[`${f.chiave}_ore`]) || 0;
    });
  });

  const fmtProg = (v) => v > 0 ? v.toFixed(1) : '-';

  const righe = GIORNI_ALL.map(g => {
    const d = g.chiave;
    const a = mappa[d] || {};
    const note = a.note || '';
    const rpe  = a.rpe  != null ? a.rpe : '';

    const celleKm  = CAMPI_ALL.map(f => {
      const v = a[`${f.chiave}_km`];
      return `<td><input type="number" id="mod_${d}_${f.chiave}_km" min="0" step="0.1" value="${v && v > 0 ? v : ''}" oninput="aggiornaTotaliMod()"></td>`;
    }).join('');

    const celleOre = CAMPI_ALL.map(f => {
      const v = a[`${f.chiave}_ore`];
      return `<td><input type="number" id="mod_${d}_${f.chiave}_ore" min="0" step="0.05" value="${v && v > 0 ? v : ''}" oninput="aggiornaTotaliMod()"></td>`;
    }).join('');

    let totKm = 0, totOre = 0;
    CAMPI_ALL.forEach(f => {
      totKm  += parseFloat(a[`${f.chiave}_km`])  || 0;
      totOre += parseFloat(a[`${f.chiave}_ore`]) || 0;
    });

    return `
      <tr>
        <td rowspan="3" class="etichetta-giorno" title="${g.nome}">${g.etichetta}</td>
        <td colspan="17" class="cella-note">
          <div class="note-interne">
            <textarea id="mod_${d}_note" rows="2" placeholder="Note...">${note}</textarea>
            <div class="rpe-box">
              <span>RPE:</span>
              <input type="number" id="mod_${d}_rpe" min="1" max="10" step="0.5" value="${rpe}">
            </div>
          </div>
        </td>
      </tr>
      <tr>
        <td class="etichetta-sub km-lbl">Km</td>
        ${celleKm}
        <td class="cella-tot" id="mod_${d}_tot_km">${totKm > 0 ? totKm.toFixed(1) : '-'}</td>
        <td class="cella-prog">${fmtProg(progKm)}</td>
      </tr>
      <tr>
        <td class="etichetta-sub ore-lbl">Ore</td>
        ${celleOre}
        <td class="cella-tot" id="mod_${d}_tot_ore">${totOre > 0 ? fmtOre(totOre) : '-'}</td>
        <td class="cella-prog">${progOre > 0 ? fmtOre(progOre) : '-'}</td>
      </tr>
    `;
  }).join('');

  // TOT Km / TOT Ore colonne
  const totKmCols  = CAMPI_ALL.map(f => {
    let s = 0;
    GIORNI_ALL.forEach(g => { s += parseFloat((mappa[g.chiave] || {})[`${f.chiave}_km`]) || 0; });
    return `<td class="cella-tot" id="mod_tot_km_${f.chiave}">${s > 0 ? s.toFixed(1) : '-'}</td>`;
  }).join('');

  const totOreCols = CAMPI_ALL.map(f => {
    let s = 0;
    GIORNI_ALL.forEach(g => { s += parseFloat((mappa[g.chiave] || {})[`${f.chiave}_ore`]) || 0; });
    return `<td class="cella-tot" id="mod_tot_ore_${f.chiave}">${s > 0 ? fmtOre(s) : '-'}</td>`;
  }).join('');

  document.getElementById('contenutoModale').innerHTML = `
    <div class="info-diario">
      Settimana <strong>${diario.settimana_n}</strong> &nbsp;|&nbsp; ${dal} → ${al}
    </div>
    <div class="tabella-wrapper">
      <table class="tabella">
        <thead>
          <tr>
            <th class="col-giorno">Giorno</th>
            <th class="col-sub"></th>
            <th class="col-att">Forza</th>
            <th class="col-att">Pattini</th>
            <th class="col-att">Marcia</th>
            <th class="col-att">Bici</th>
            <th class="col-att">Corsa</th>
            <th class="col-att">Skiroll<br>CL</th>
            <th class="col-att">Skiroll<br>SK</th>
            <th class="col-att">Sci<br>CL</th>
            <th class="col-att">Sci<br>SK</th>
            <th class="col-int">I1</th>
            <th class="col-int">I2</th>
            <th class="col-int">I3</th>
            <th class="col-int">I4</th>
            <th class="col-int">I5</th>
            <th class="col-tot">Tot.<br>Sett.</th>
            <th class="col-tot">Tot.<br>Prog.</th>
          </tr>
        </thead>
        <tbody>${righe}</tbody>
        <tfoot>
          <tr class="riga-tot">
            <td colspan="2" class="etichetta-tot">TOT Km</td>
            ${totKmCols}
            <td class="cella-tot" id="mod_tot_km_settimana">${settKm > 0 ? settKm.toFixed(1) : '-'}</td>
            <td class="cella-prog">${fmtProg(progKm)}</td>
          </tr>
          <tr class="riga-tot">
            <td colspan="2" class="etichetta-tot">TOT Ore</td>
            ${totOreCols}
            <td class="cella-tot" id="mod_tot_ore_settimana">${settOre > 0 ? fmtOre(settOre) : '-'}</td>
            <td class="cella-prog">${progOre > 0 ? fmtOre(progOre) : '-'}</td>
          </tr>
        </tfoot>
      </table>
    </div>
    <div class="area-salva">
      <div id="msgSalvaMod" class="nascosto"></div>
      <button class="btn btn-pieno" id="btnSalvaMod">💾 Salva Modifiche</button>
    </div>
  `;

  document.getElementById('btnSalvaMod').onclick = () => salvaDiarioMod(diarioId, atletaId);
}

// ============================================================
//  RICALCOLO TOTALI LIVE (modifica)
// ============================================================

function aggiornaTotaliMod() {
  let totKmSett = 0, totOreSett = 0;

  GIORNI_ALL.forEach(g => {
    const d = g.chiave;
    let kmGiorno = 0, oreGiorno = 0;

    CAMPI_ALL.forEach(f => {
      kmGiorno  += parseFloat(document.getElementById(`mod_${d}_${f.chiave}_km`)?.value)  || 0;
      oreGiorno += parseFloat(document.getElementById(`mod_${d}_${f.chiave}_ore`)?.value) || 0;
    });

    const elKm  = document.getElementById(`mod_${d}_tot_km`);
    const elOre = document.getElementById(`mod_${d}_tot_ore`);
    if (elKm)  elKm.textContent  = kmGiorno  > 0 ? kmGiorno.toFixed(1) : '-';
    if (elOre) elOre.textContent = oreGiorno > 0 ? fmtOre(oreGiorno)   : '-';

    totKmSett  += kmGiorno;
    totOreSett += oreGiorno;
  });

  CAMPI_ALL.forEach(f => {
    let colKm = 0, colOre = 0;
    GIORNI_ALL.forEach(g => {
      colKm  += parseFloat(document.getElementById(`mod_${g.chiave}_${f.chiave}_km`)?.value)  || 0;
      colOre += parseFloat(document.getElementById(`mod_${g.chiave}_${f.chiave}_ore`)?.value) || 0;
    });
    const elKm  = document.getElementById(`mod_tot_km_${f.chiave}`);
    const elOre = document.getElementById(`mod_tot_ore_${f.chiave}`);
    if (elKm)  elKm.textContent  = colKm  > 0 ? colKm.toFixed(1) : '-';
    if (elOre) elOre.textContent = colOre > 0 ? fmtOre(colOre)   : '-';
  });

  const elKmTot  = document.getElementById('mod_tot_km_settimana');
  const elOreTot = document.getElementById('mod_tot_ore_settimana');
  if (elKmTot)  elKmTot.textContent  = totKmSett  > 0 ? totKmSett.toFixed(1) : '-';
  if (elOreTot) elOreTot.textContent = totOreSett > 0 ? fmtOre(totOreSett)   : '-';
}

// ============================================================
//  SALVA MODIFICHE DIARIO (allenatrice)
// ============================================================

async function salvaDiarioMod(diarioId, atletaId) {
  const btn = document.getElementById('btnSalvaMod');
  const msg = document.getElementById('msgSalvaMod');
  btn.textContent = 'Salvataggio...';
  btn.disabled = true;

  let errore = null;

  for (const giorno of GIORNI_ALL) {
    const d = giorno.chiave;
    const note = document.getElementById(`mod_${d}_note`)?.value || '';
    const rpe  = parseFloat(document.getElementById(`mod_${d}_rpe`)?.value) || null;

    const riga = { diario_id: diarioId, giorno: d, note, rpe };

    CAMPI_ALL.forEach(f => {
      riga[`${f.chiave}_km`]  = parseFloat(document.getElementById(`mod_${d}_${f.chiave}_km`)?.value)  || 0;
      riga[`${f.chiave}_ore`] = parseFloat(document.getElementById(`mod_${d}_${f.chiave}_ore`)?.value) || 0;
    });

    const { error } = await db.from('allenamenti').upsert(riga, { onConflict: 'diario_id,giorno' });
    if (error) { errore = error; break; }
  }

  if (errore) {
    msg.textContent = 'Errore salvataggio: ' + errore.message;
    msg.className = 'msg-errore';
  } else {
    msg.textContent = '✅ Modifiche salvate!';
    msg.className = 'msg-ok';
  }
  msg.classList.remove('nascosto');

  btn.textContent = '💾 Salva Modifiche';
  btn.disabled = false;
  setTimeout(() => msg.classList.add('nascosto'), 4000);

  if (!errore) {
    const tabAttivo = document.querySelector('.tab-sett.attivo');
    await mostraDiario(diarioId, tabAttivo, atletaId);
  }
}

// ============================================================
//  CREA NUOVO ATLETA (via Cloudflare Worker)
// ============================================================

const WORKER_URL = 'https://crea-atleta.wintersc-subiaco.workers.dev';

async function creaAtleta(e) {
  e.preventDefault();
  const btn = document.getElementById('btnCrea');
  btn.textContent = 'Creazione...';
  btn.disabled = true;

  const nome     = document.getElementById('nuovoNome').value.trim();
  const cognome  = document.getElementById('nuovoCognome').value.trim();
  const username = document.getElementById('nuovaEmail').value.trim().toLowerCase();
  const password = document.getElementById('nuovaPassword').value;

  const msg = document.getElementById('msgCrea');

  try {
    const res = await fetch(WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, cognome, username, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      msg.textContent = 'Errore: ' + (data.error || 'sconosciuto');
      msg.className = 'msg-errore';
      msg.classList.remove('nascosto');
      btn.textContent = '➕ Crea Atleta';
      btn.disabled = false;
      return;
    }

    // Aggiorna il profilo con nome e cognome
    if (data.id) {
      await db.from('profiles').upsert({ id: data.id, nome, cognome, ruolo: 'atleta' });
    }

    msg.textContent = `✅ Atleta ${nome} ${cognome} creato! Username: ${username}`;
    msg.className = 'msg-ok';
    msg.classList.remove('nascosto');
    document.getElementById('formCrea').reset();
    await caricaAtleti();
    setTimeout(() => msg.classList.add('nascosto'), 6000);

  } catch (err) {
    msg.textContent = 'Errore di connessione al server.';
    msg.className = 'msg-errore';
    msg.classList.remove('nascosto');
  }

  btn.textContent = '➕ Crea Atleta';
  btn.disabled = false;
}

// ============================================================
//  INIZIALIZZAZIONE
// ============================================================

window.addEventListener('DOMContentLoaded', async () => {
  const auth = await checkAuth('allenatrice');
  if (!auth) return;

  const nome = auth.profile?.nome
    ? `${auth.profile.nome} ${auth.profile.cognome || ''}`.trim()
    : auth.session.user.email;

  document.getElementById('nomeAllenatrice').textContent = nome;
  document.getElementById('btnEsci').addEventListener('click', logout);
  document.getElementById('formCrea').addEventListener('submit', creaAtleta);
  document.getElementById('btnChiudiModale').addEventListener('click', chiudiModale);

  document.getElementById('overlay').addEventListener('click', (e) => {
    if (e.target === document.getElementById('overlay')) chiudiModale();
  });

  await caricaAtleti();
});
