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
    return `
      <div class="atleta-riga" onclick="apriAtleta('${a.id}', '${nome.replace(/'/g, "\\'")}')">
        <div>
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
            onclick="mostraDiario(${d.id}, this)">
      Sett. ${d.settimana_n}
    </button>
  `).join('');

  await mostraDiario(diari[0].id, tabs.querySelector('.tab-sett'));
}

function chiudiModale() {
  document.getElementById('overlay').classList.add('nascosto');
}

// ============================================================
//  VISUALIZZA DIARIO (sola lettura)
// ============================================================

async function mostraDiario(diarioId, tabEl) {
  document.querySelectorAll('.tab-sett').forEach(t => t.classList.remove('attivo'));
  if (tabEl) tabEl.classList.add('attivo');

  const { data: diario } = await db.from('diari').select('*').eq('id', diarioId).single();
  const { data: allenamenti } = await db.from('allenamenti').select('*').eq('diario_id', diarioId);

  const dal = diario.data_dal ? new Date(diario.data_dal).toLocaleDateString('it-IT') : '-';
  const al  = diario.data_al  ? new Date(diario.data_al).toLocaleDateString('it-IT')  : '-';

  const mappa = {};
  (allenamenti || []).forEach(a => { mappa[a.giorno] = a; });

  const righe = GIORNI_ALL.map(g => {
    const d = g.chiave;
    const a = mappa[d] || {};
    const note = a.note || '';
    const rpe  = a.rpe  != null ? a.rpe : '-';

    const celleKm  = CAMPI_ALL.map(f => {
      const v = a[`${f.chiave}_km`];
      return `<td>${v && v > 0 ? v : ''}</td>`;
    }).join('');

    const celleOre = CAMPI_ALL.map(f => {
      const v = a[`${f.chiave}_ore`];
      return `<td>${v && v > 0 ? fmtOre(v) : ''}</td>`;
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
            <textarea readonly rows="2">${note}</textarea>
            <div class="rpe-box">
              <span>RPE:</span>
              <input type="number" value="${rpe !== '-' ? rpe : ''}" readonly>
            </div>
          </div>
        </td>
      </tr>
      <tr>
        <td class="etichetta-sub km-lbl">Km</td>
        ${celleKm}
        <td class="cella-tot">${totKm > 0 ? totKm.toFixed(1) : '-'}</td>
        <td class="cella-prog">-</td>
      </tr>
      <tr>
        <td class="etichetta-sub ore-lbl">Ore</td>
        ${celleOre}
        <td class="cella-tot">${totOre > 0 ? fmtOre(totOre) : '-'}</td>
        <td class="cella-prog">-</td>
      </tr>
    `;
  }).join('');

  // TOT Km / TOT Ore colonne
  const totKmCols  = CAMPI_ALL.map(f => {
    let s = 0;
    GIORNI_ALL.forEach(g => { s += parseFloat((mappa[g.chiave] || {})[`${f.chiave}_km`]) || 0; });
    return `<td class="cella-tot">${s > 0 ? s.toFixed(1) : '-'}</td>`;
  }).join('');

  const totOreCols = CAMPI_ALL.map(f => {
    let s = 0;
    GIORNI_ALL.forEach(g => { s += parseFloat((mappa[g.chiave] || {})[`${f.chiave}_ore`]) || 0; });
    return `<td class="cella-tot">${s > 0 ? fmtOre(s) : '-'}</td>`;
  }).join('');

  document.getElementById('contenutoModale').innerHTML = `
    <div class="info-diario">
      Settimana <strong>${diario.settimana_n}</strong> &nbsp;|&nbsp; ${dal} → ${al}
    </div>
    <div class="tabella-wrapper">
      <table class="tabella tabella-readonly">
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
            <td class="cella-tot">-</td>
            <td class="cella-prog">-</td>
          </tr>
          <tr class="riga-tot">
            <td colspan="2" class="etichetta-tot">TOT Ore</td>
            ${totOreCols}
            <td class="cella-tot">-</td>
            <td class="cella-prog">-</td>
          </tr>
        </tfoot>
      </table>
    </div>
  `;
}

// ============================================================
//  CREA NUOVO ATLETA
// ============================================================

const DOMINIO = '@wintersc.it';

async function creaAtleta(e) {
  e.preventDefault();
  const btn = document.getElementById('btnCrea');
  btn.textContent = 'Creazione...';
  btn.disabled = true;

  const nome     = document.getElementById('nuovoNome').value.trim();
  const cognome  = document.getElementById('nuovoCognome').value.trim();
  const username = document.getElementById('nuovaEmail').value.trim().toLowerCase();
  const email    = username + DOMINIO;
  const password = document.getElementById('nuovaPassword').value;

  const { data, error } = await db.auth.signUp({
    email,
    password,
    options: { data: { nome, cognome, ruolo: 'atleta' } }
  });

  if (error) {
    document.getElementById('msgCrea').textContent = 'Errore: ' + error.message;
    document.getElementById('msgCrea').className = 'msg-errore';
    document.getElementById('msgCrea').classList.remove('nascosto');
    btn.textContent = '➕ Crea Atleta';
    btn.disabled = false;
    return;
  }

  // Se Supabase ha auto-confirm disabilitato, l'utente esiste ma il profilo
  // viene creato dal trigger. Se è abilitato, il profilo è già pronto.
  const userId = data.user?.id;
  if (userId) {
    await db.from('profiles').upsert({
      id: userId, nome, cognome, ruolo: 'atleta'
    });
  }

  document.getElementById('msgCrea').textContent = `✅ Atleta ${nome} ${cognome} creato! Username: ${username}`;
  document.getElementById('msgCrea').className = 'msg-ok';
  document.getElementById('msgCrea').classList.remove('nascosto');
  document.getElementById('formCrea').reset();
  btn.textContent = '➕ Crea Atleta';
  btn.disabled = false;

  await caricaAtleti();
  setTimeout(() => document.getElementById('msgCrea').classList.add('nascosto'), 6000);
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
