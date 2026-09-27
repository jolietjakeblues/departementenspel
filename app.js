(function () {
  'use strict';
  const G = window.DEP_GAME;
  const $ = id => document.getElementById(id);
  const STORAGE_KEY = 'departementenspel.v1';
  const TOTAAL = G.DEPARTEMENTEN.length;

  // ---------- Opslag ----------
  // state: { reizen: [{ id, start, eind, vondsten: {code: tijd}, bonus: {code: tijd}, door: {code: spelerId} }],
  //          spelers: [{ id, naam }], actiefId, bingo: { code, size, gemarkeerd: [], geroepen: [] } }
  function laad() {
    try {
      const s = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (s) return G.valideerBackup(s);
    } catch (e) { /* geen of kapotte opslag: begin leeg */ }
    return { reizen: [], spelers: [], actiefId: null, bingo: null };
  }
  function bewaar() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* privévenster e.d. */ }
  }
  const state = laad();

  const actieveReis = () => state.reizen.find(r => r.id === state.actiefId) || null;
  // De reis die we tonen: de actieve, anders de laatste.
  const getoondeReis = () => actieveReis() || state.reizen[state.reizen.length - 1] || null;
  const spelerNaam = id => (state.spelers.find(s => s.id === id) || {}).naam;

  // ---------- Hulpjes ----------
  const fmtDatum = t => new Date(t).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' });
  const fmtTijd = t => new Date(t).toLocaleString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  let toastTimer;
  let toastFn = null;
  // actie: optioneel { label, fn }, bv. een knop "Ongedaan".
  function toast(tekst, actie) {
    $('toastTekst').textContent = tekst;
    const knop = $('toastActie');
    toastFn = actie ? actie.fn : null;
    knop.textContent = actie ? actie.label : '';
    knop.classList.toggle('hidden', !actie);
    $('toast').classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $('toast').classList.add('hidden'), actie ? 5000 : 2600);
  }
  $('toastActie').addEventListener('click', () => {
    const fn = toastFn;
    toastFn = null;
    $('toast').classList.add('hidden');
    if (fn) fn();
  });
  function el(tag, attrs = {}, tekst) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    if (tekst != null) e.textContent = tekst;
    return e;
  }

  // ---------- Tabs ----------
  document.querySelectorAll('.tabs button').forEach(b => b.addEventListener('click', () => toonView(b.dataset.view)));
  function toonView(naam) {
    document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('active', b.dataset.view === naam));
    document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + naam));
    if (naam === 'kaart') tekenKaartKleuren();
    if (naam === 'stats') renderStats();
    window.scrollTo(0, 0);
  }

  // ---------- Reis ----------
  $('btnStart').addEventListener('click', () => {
    const reis = { id: Date.now().toString(36), start: Date.now(), eind: null, vondsten: {}, bonus: {}, door: {} };
    state.reizen.push(reis);
    state.actiefId = reis.id;
    bewaar();
    toast('Bienvenue en France ! Veel speurplezier.');
    render();
  });
  $('btnStop').addEventListener('click', () => {
    const reis = actieveReis();
    if (!reis) return;
    const n = Object.keys(reis.vondsten).length;
    if (!confirm(`Reis stoppen? Je hebt ${n} van de ${TOTAAL} departementen gevonden.`)) return;
    reis.eind = Date.now();
    state.actiefId = null;
    bewaar();
    toast(`Au revoir ! Eindstand: ${n} / ${TOTAAL}`);
    render();
  });

  function vondstToggle(code, soort) {
    const reis = actieveReis();
    if (!reis) { toast('Start eerst een reis'); return false; }
    const lijst = soort === 'bonus' ? reis.bonus : reis.vondsten;
    if (lijst[code]) { delete lijst[code]; delete reis.door[code]; }
    else lijst[code] = Date.now();
    bewaar();
    return !!lijst[code];
  }

  function voegToe(invoer, spelerId) {
    const r = G.normalize(invoer);
    if (r.type === 'onbekend') { toast(`${invoer || '?'} is geen departement`); return; }
    const reis = actieveReis();
    if (!reis) { toast('Start eerst een reis'); return; }
    const lijst = r.type === 'bonus' ? reis.bonus : reis.vondsten;
    if (lijst[r.code]) {
      const wie = spelerNaam(reis.door[r.code]);
      toast(`Déjà vu ! ${r.code} ${r.item.naam} had ${wie ? wie + ' al gevonden' : 'je al'}`);
      return;
    }
    const voor = { vondsten: { ...reis.vondsten } };
    lijst[r.code] = Date.now();
    if (spelerId) reis.door[r.code] = spelerId;
    bewaar();
    const n = Object.keys(reis.vondsten).length;
    const wie = spelerId ? ` voor ${spelerNaam(spelerId)}` : '';
    const zeldzaam = r.type === 'dep' && G.frequentie(r.code) === 'zelden';
    const tekst = r.type === 'bonus' ? `Formidable ! Bonus${wie}: ${r.item.naam}`
      : zeldzaam ? `Rareté${wie} ! ${r.code} ${r.item.naam} zie je niet vaak (${n}/${TOTAAL})`
      : `Bravo${wie} ! ${r.code} ${r.item.naam} (${n}/${TOTAAL})`;
    if (zeldzaam && navigator.vibrate) navigator.vibrate([60, 40, 60]);
    vier(G.nieuwePrijzen(voor, reis));
    toast(tekst, {
      label: 'Ongedaan',
      fn: () => {
        delete lijst[r.code];
        delete reis.door[r.code];
        bewaar();
        toast(`${r.code} ${r.item.naam} weer weggehaald`);
        render();
      }
    });
    render(r.code);
  }

  // ---------- Toetsenbord ----------
  let buffer = '';
  function toonBuffer() {
    $('invoer').innerHTML = buffer ? buffer : '&nbsp;';
    const naam = $('invoerNaam');
    const r = G.normalize(buffer);
    naam.classList.toggle('ok', r.type !== 'onbekend');
    if (!buffer) naam.textContent = 'Toets het nummer van het kenteken';
    else if (r.type === 'dep') naam.textContent = r.item.naam;
    else if (r.type === 'bonus') naam.textContent = r.item.naam + ' (bonus)';
    else naam.textContent = buffer === '2' ? '… of 2A / 2B voor Corsica' : '…';
  }
  $('keypad').addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    const k = b.dataset.k;
    if (k === 'del') buffer = buffer.slice(0, -1);
    else if (k === 'ok') { if (buffer) voegToe(buffer); buffer = ''; }
    else if (k === 'bonus') { document.querySelector('#bonus').scrollIntoView({ behavior: 'smooth' }); return; }
    else if (buffer.length < 3) buffer += b.textContent.trim();
    toonBuffer();
  });
  $('spelerKnoppen').addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (!buffer) { toast('Toets eerst het nummer'); return; }
    voegToe(buffer, b.dataset.id);
    buffer = '';
    toonBuffer();
  });

  // ---------- Prijzen vieren ----------
  const vieringRij = [];
  function vier(nieuw) {
    if (!nieuw.length) return;
    vieringRij.push(...nieuw);
    if ($('viering').classList.contains('hidden')) toonViering();
  }
  function toonViering() {
    const p = vieringRij.shift();
    if (!p) { $('viering').classList.add('hidden'); return; }
    $('vieringTitel').textContent = p.titel;
    $('vieringUitleg').textContent = p.uitleg;
    $('vieringMeer').textContent = vieringRij.length ? `Nog ${vieringRij.length} ${vieringRij.length === 1 ? 'prijs' : 'prijzen'}!` : '';
    $('viering').classList.remove('hidden');
    if (navigator.vibrate) navigator.vibrate([120, 60, 120, 60, 240]);
  }
  $('vieringOk').addEventListener('click', toonViering);
  $('viering').addEventListener('click', e => { if (e.target.id === 'viering') toonViering(); });

  // ---------- Spelers ----------
  function renderSpelers() {
    const knoppen = $('spelerKnoppen');
    knoppen.textContent = '';
    state.spelers.forEach(sp => knoppen.appendChild(el('button', { class: 'speler-knop', 'data-id': sp.id }, sp.naam)));
    $('spelerKeuze').classList.toggle('hidden', !state.spelers.length);
    $('spelersAantal').textContent = state.spelers.length ? `(${state.spelers.length})` : '';

    const lijst = $('spelersLijst');
    lijst.textContent = '';
    if (!state.spelers.length) lijst.appendChild(el('li', { class: 'muted' }, 'Nog geen spelers. Zonder spelers tellen vondsten voor iedereen samen.'));
    state.spelers.forEach(sp => {
      const li = el('li');
      li.appendChild(el('span', {}, sp.naam));
      const weg = el('button', { class: 'link-knop', 'aria-label': `${sp.naam} verwijderen` }, 'verwijder');
      weg.addEventListener('click', () => {
        if (!confirm(`${sp.naam} verwijderen? Vondsten blijven staan, maar tellen niet meer mee in het klassement.`)) return;
        state.spelers = state.spelers.filter(x => x.id !== sp.id);
        bewaar();
        render();
      });
      li.appendChild(weg);
      lijst.appendChild(li);
    });
  }
  $('spelerNieuw').addEventListener('submit', e => {
    e.preventDefault();
    const naam = $('spelerNaam').value.trim();
    if (!naam) return;
    if (state.spelers.some(s => s.naam.toLowerCase() === naam.toLowerCase())) { toast(`${naam} speelt al mee`); return; }
    state.spelers.push({ id: 's' + Date.now().toString(36), naam });
    $('spelerNaam').value = '';
    bewaar();
    render();
  });

  // Fysiek toetsenbord (handig op tablet of laptop).
  document.addEventListener('keydown', e => {
    if (!$('view-spel').classList.contains('active') || !actieveReis() || e.target.tagName === 'INPUT') return;
    if (/^[0-9abAB]$/.test(e.key) && buffer.length < 3) buffer += e.key.toUpperCase();
    else if (e.key === 'Backspace') buffer = buffer.slice(0, -1);
    else if (e.key === 'Enter') { if (buffer) voegToe(buffer); buffer = ''; }
    else return;
    toonBuffer();
  });

  // ---------- Spelscherm ----------
  function renderSpel(nieuw) {
    const reis = getoondeReis();
    const actief = !!actieveReis();
    $('startBlok').classList.toggle('hidden', actief);
    $('invoerBlok').classList.toggle('hidden', !actief);
    $('stopBlok').classList.toggle('hidden', !actief);

    const gevonden = reis ? reis.vondsten : {};
    const n = Object.keys(gevonden).length;
    $('telling').textContent = `${n} / ${TOTAAL}`;
    $('balk').style.width = (100 * n / TOTAAL) + '%';
    const aantalPrijzen = reis ? G.prijzen(reis).filter(p => p.behaald).length : 0;
    $('tellingSub').textContent = !reis ? 'nog geen reis gestart'
      : (actief ? 'deze reis' : 'laatste reis') + (aantalPrijzen ? ` · 🏆 ${aantalPrijzen}` : '');
    $('reisStatus').textContent = actief ? `Onderweg sinds ${fmtTijd(actieveReis().start)}` : 'Geen reis actief';
    const mini = $('miniKlassement');
    mini.textContent = '';
    if (reis && state.spelers.length) {
      G.klassement(reis, state.spelers).forEach((sp, i) =>
        mini.appendChild(el('span', {}, `${i === 0 && sp.aantal ? '🥇 ' : ''}${sp.naam} ${sp.aantal}`)));
    }

    const tabel = $('tabel');
    tabel.textContent = '';
    G.gridRows().forEach(rij => {
      const r = el('div', { class: 'rij' + (rij[0].length === 3 ? ' rij-overzee' : '') });
      rij.forEach(code => {
        const b = el('button', { class: 'cel', 'data-code': code, title: G.BY_CODE.get(code).naam }, code);
        if (gevonden[code]) b.classList.add('gevonden');
        if (code === nieuw) b.classList.add('nieuw');
        b.addEventListener('click', () => openSheet(code));
        r.appendChild(b);
      });
      tabel.appendChild(r);
    });

    const bonus = $('bonus');
    bonus.textContent = '';
    const bonusGevonden = reis ? reis.bonus : {};
    G.BONUS.forEach(b => {
      const c = el('button', { class: 'chip' + (bonusGevonden[b.code] ? ' gevonden' : '') }, (b.soort === 'code' ? b.code + ' · ' : '') + b.naam);
      c.addEventListener('click', () => openSheet(b.code));
      bonus.appendChild(c);
    });

  }

  // ---------- Infovenster ----------
  let sheetCode = null;
  function openSheet(code) {
    sheetCode = code;
    const r = G.normalize(code);
    const item = r.item;
    const reis = getoondeReis();
    const lijst = reis ? (r.type === 'bonus' ? reis.bonus : reis.vondsten) : {};
    $('sheetCode').textContent = r.code;
    $('sheetTitel').textContent = item.naam;
    const meta = $('sheetMeta');
    meta.textContent = '';
    if (r.type === 'dep') {
      [['Prefectuur', item.prefectuur], ['Regio', item.regio]].forEach(([k, v]) => {
        meta.appendChild(el('dt', {}, k));
        meta.appendChild(el('dd', {}, v));
      });
    }
    $('sheetTekst').textContent = item.toelichting;
    const wie = reis && spelerNaam(reis.door[r.code]);
    $('sheetGevonden').textContent = lijst[r.code]
      ? `Gevonden${wie ? ' door ' + wie : ''} op ${fmtTijd(lijst[r.code])}` : 'Nog niet gevonden';
    const knop = $('sheetToggle');
    knop.classList.toggle('hidden', !actieveReis());
    knop.textContent = lijst[r.code] ? 'Toch niet gevonden' : 'Markeer als gevonden';
    markeerOpKaart(r.type === 'dep' ? r.code : null);
    $('sheet').classList.remove('hidden');
  }
  function sluitSheet() {
    $('sheet').classList.add('hidden');
    markeerOpKaart(null);
  }
  $('sheetClose').addEventListener('click', sluitSheet);
  $('sheet').addEventListener('click', e => { if (e.target.id === 'sheet') sluitSheet(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') sluitSheet(); });
  $('sheetToggle').addEventListener('click', () => {
    const r = G.normalize(sheetCode);
    const reis = actieveReis();
    const voor = reis ? { vondsten: { ...reis.vondsten } } : null;
    const aan = vondstToggle(r.code, r.type === 'bonus' ? 'bonus' : 'dep');
    if (aan && reis) vier(G.nieuwePrijzen(voor, reis));
    toast(aan ? `Bravo ! ${r.item.naam} gevonden` : `${r.item.naam} weer weggehaald`);
    sluitSheet();
    render(aan ? r.code : null);
  });

  // ---------- Kaart ----------
  const SVGNS = 'http://www.w3.org/2000/svg';
  const paden = new Map(); // code -> [path, text?]
  let geo = null;

  function projectie(bbox, breedte) {
    const [minX, minY, maxX, maxY] = bbox;
    const k = Math.cos(((minY + maxY) / 2) * Math.PI / 180);
    const schaal = breedte / ((maxX - minX) * k);
    return {
      p: ([x, y]) => [(x - minX) * k * schaal, (maxY - y) * schaal],
      hoogte: (maxY - minY) * schaal
    };
  }
  function bboxVan(features) {
    const b = [Infinity, Infinity, -Infinity, -Infinity];
    features.forEach(f => f.geometry.coordinates.forEach(poly => poly[0].forEach(([x, y]) => {
      if (x < b[0]) b[0] = x; if (y < b[1]) b[1] = y;
      if (x > b[2]) b[2] = x; if (y > b[3]) b[3] = y;
    })));
    return b;
  }
  function padData(feature, p) {
    return feature.geometry.coordinates.map(poly => poly.map(ring =>
      'M' + ring.map(pt => p(pt).map(v => v.toFixed(1)).join(',')).join('L') + 'Z').join('')).join('');
  }
  // Label op het midden van de grootste ring (gemiddelde van de punten is goed genoeg).
  // Voor sikkelvormige departementen valt het gemiddelde buiten de vorm; die krijgen een vaste plek.
  const LABEL_PLEK = { '92': [2.215, 48.84] };
  function labelPunt(feature, p) {
    if (LABEL_PLEK[feature.properties.code]) return p(LABEL_PLEK[feature.properties.code]);
    let groot = feature.geometry.coordinates[0][0];
    feature.geometry.coordinates.forEach(poly => { if (poly[0].length > groot.length) groot = poly[0]; });
    const pts = groot.map(p);
    return [pts.reduce((s, q) => s + q[0], 0) / pts.length, pts.reduce((s, q) => s + q[1], 0) / pts.length];
  }
  function maakPad(svg, f, p, metLabel) {
    const code = f.properties.code;
    const pad = document.createElementNS(SVGNS, 'path');
    pad.setAttribute('d', padData(f, p));
    pad.dataset.code = code;
    const titel = document.createElementNS(SVGNS, 'title');
    titel.textContent = `${code} ${G.BY_CODE.get(code).naam}`;
    pad.appendChild(titel);
    svg.appendChild(pad);
    const set = [pad];
    if (metLabel) {
      const [x, y] = labelPunt(f, p);
      const t = document.createElementNS(SVGNS, 'text');
      t.setAttribute('x', x.toFixed(1));
      t.setAttribute('y', y.toFixed(1));
      t.textContent = code;
      set.push(t);
      svg.appendChild(t);
    }
    paden.set(code, (paden.get(code) || []).concat(set));
  }

  async function laadKaart() {
    try {
      const res = await fetch('departements.geojson');
      geo = await res.json();
    } catch (e) {
      $('kaart').outerHTML = '<p class="muted">Kaart kon niet geladen worden.</p>';
      return;
    }
    const metro = geo.features.filter(f => f.properties.code.length === 2);
    const svg = $('kaart');
    const W = 400;
    const { p, hoogte } = projectie(bboxVan(metro), W);
    svg.setAttribute('viewBox', `-4 -4 ${W + 8} ${Math.ceil(hoogte) + 8}`);
    const labels = document.createElementNS(SVGNS, 'g');
    const KLEIN = new Set(['75', '92', '93', '94']); // te klein voor een label; zie de uitvergroting
    metro.forEach(f => maakPad(svg, f, p, !KLEIN.has(f.properties.code)));
    // Labels na alle paden, zodat ze niet onder buurdepartementen verdwijnen.
    svg.querySelectorAll('text').forEach(t => labels.appendChild(t));
    svg.appendChild(labels);
    svg.addEventListener('click', e => { if (e.target.dataset.code) openSheet(e.target.dataset.code); });

    const overzee = $('overzee');
    geo.features.filter(f => f.properties.code.length === 3).forEach(f => {
      const fig = el('figure');
      const mini = document.createElementNS(SVGNS, 'svg');
      mini.setAttribute('class', 'kaart');
      const pr = projectie(bboxVan([f]), 100);
      mini.setAttribute('viewBox', `-2 -2 104 ${Math.ceil(pr.hoogte) + 4}`);
      mini.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      maakPad(mini, f, pr.p, false);
      fig.appendChild(mini);
      fig.appendChild(el('figcaption', {}, `${f.properties.code} ${G.BY_CODE.get(f.properties.code).naam}`));
      fig.addEventListener('click', () => openSheet(f.properties.code));
      overzee.appendChild(fig);
    });

    // Uitvergroting van Parijs en omgeving.
    const IDF = ['75', '92', '93', '94'];
    const idf = metro.filter(f => IDF.includes(f.properties.code));
    const fig = el('figure');
    const mini = document.createElementNS(SVGNS, 'svg');
    mini.setAttribute('class', 'kaart');
    const pr = projectie(bboxVan(idf), 200);
    mini.setAttribute('viewBox', `-4 -4 208 ${Math.ceil(pr.hoogte) + 4}`);
    idf.forEach(f => maakPad(mini, f, pr.p, true));
    mini.addEventListener('click', e => { if (e.target.dataset.code) openSheet(e.target.dataset.code); });
    fig.appendChild(mini);
    fig.appendChild(el('figcaption', {}, 'Parijs en de petite couronne'));
    $('idf').appendChild(fig);
    tekenKaartKleuren();
  }
  function tekenKaartKleuren() {
    const reis = getoondeReis();
    const gevonden = reis ? reis.vondsten : {};
    paden.forEach((els, code) => els.forEach(e => e.classList.toggle('gevonden', !!gevonden[code])));
  }
  function markeerOpKaart(code) {
    paden.forEach((els, c) => els[0].classList.toggle('actief', c === code));
  }

  // ---------- Bingo ----------
  function startBingo(code, size) {
    state.bingo = { code, size, gemarkeerd: [], geroepen: [] };
    bewaar();
    renderBingo();
  }
  $('btnBingoNieuw').addEventListener('click', () => startBingo(G.randomCardCode(), +$('bingoGrootte').value));
  $('btnBingoCode').addEventListener('click', () => {
    const code = $('bingoCode').value.trim().toUpperCase();
    if (!code) { toast('Vul een code in'); return; }
    startBingo(code, +$('bingoGrootte').value);
  });
  $('btnBingoStop').addEventListener('click', () => {
    if (!confirm('Deze bingokaart weggooien en een nieuwe maken?')) return;
    state.bingo = null;
    bewaar();
    renderBingo();
  });

  function bingoMarkeer(code) {
    const b = state.bingo;
    const kaart = G.makeBingoCard(b.code, b.size);
    const had = G.bingoStatus(kaart, new Set(b.gemarkeerd)).lines.length;
    const idx = b.gemarkeerd.indexOf(code);
    if (idx >= 0) b.gemarkeerd.splice(idx, 1);
    else {
      b.gemarkeerd.push(code);
      if (!b.geroepen.includes(code)) b.geroepen.push(code);
    }
    bewaar();
    renderBingo();
    const nu = G.bingoStatus(kaart, new Set(b.gemarkeerd));
    if (nu.lines.length > had) {
      toast(nu.vol ? 'Carton plein ! Volle kaart!' : 'BINGO ! Félicitations !');
      if (navigator.vibrate) navigator.vibrate([100, 60, 200]);
    }
  }
  $('bingoRoep').addEventListener('submit', e => {
    e.preventDefault();
    const invoer = $('bingoRoepInvoer');
    const r = G.normalize(invoer.value);
    invoer.value = '';
    if (!state.bingo || r.type !== 'dep') { toast('Geen geldig departement'); return; }
    // Elk geroepen nummer komt in de lijst, ook als het niet op je eigen kaart staat.
    if (!state.bingo.geroepen.includes(r.code)) { state.bingo.geroepen.push(r.code); bewaar(); renderBingo(); }
    const kaart = G.makeBingoCard(state.bingo.code, state.bingo.size);
    if (!kaart.cells.includes(r.code)) { toast(`${r.code} ${r.item.naam} staat niet op je kaart`); return; }
    if (state.bingo.gemarkeerd.includes(r.code)) { toast(`${r.code} had je al afgestreept`); return; }
    bingoMarkeer(r.code);
    if ($('toast').classList.contains('hidden') || !/BINGO|Carton/.test($('toast').textContent)) toast(`${r.code} ${r.item.naam} afgestreept`);
  });

  function renderBingo() {
    const b = state.bingo;
    $('bingoNieuw').classList.toggle('hidden', !!b);
    $('bingoSpel').classList.toggle('hidden', !b);
    if (!b) return;
    const kaart = G.makeBingoCard(b.code, b.size);
    const aan = new Set(b.gemarkeerd);
    const status = G.bingoStatus(kaart, aan);
    $('bingoCodeToon').textContent = `${kaart.code} · ${kaart.size}`;
    $('bingoTelling').textContent = `${status.aantal} / ${kaart.size}`;

    // Welke vakjes liggen op een volle lijn?
    const opLijn = new Set();
    status.lines.forEach(l => {
      for (let i = 0; i < kaart.cells.length; i++) {
        const r = Math.floor(i / kaart.cols), c = i % kaart.cols;
        if ((l.soort === 'rij' && r === l.index) || (l.soort === 'kolom' && c === l.index) ||
            (l.soort === 'diagonaal' && (l.index === 0 ? r === c : r + c === kaart.cols - 1))) opLijn.add(i);
      }
    });
    const melding = $('bingoMelding');
    melding.classList.toggle('hidden', !status.lines.length);
    melding.textContent = status.vol ? 'Carton plein ! Volle kaart!' : (status.lines.length ? 'BINGO !' : '');

    const grid = $('bingoGrid');
    grid.style.gridTemplateColumns = `repeat(${kaart.cols}, 1fr)`;
    grid.textContent = '';
    kaart.cells.forEach((code, i) => {
      const v = el('button', { class: 'bingo-vak' + (aan.has(code) ? ' aan' : '') + (opLijn.has(i) ? ' lijn' : '') });
      v.appendChild(el('span', { class: 'nr' }, code));
      v.appendChild(el('span', { class: 'nm' }, G.BY_CODE.get(code).naam));
      v.addEventListener('click', () => bingoMarkeer(code));
      grid.appendChild(v);
    });

    const geroepen = $('geroepen');
    geroepen.textContent = '';
    $('geroepenAantal').textContent = b.geroepen.length ? `(${b.geroepen.length})` : '';
    if (!b.geroepen.length) geroepen.appendChild(el('span', { class: 'muted' }, 'Nog niets geroepen'));
    b.geroepen.slice().reverse().forEach(code => geroepen.appendChild(
      el('span', { class: kaart.cells.includes(code) ? 'op-kaart' : '', title: G.BY_CODE.get(code).naam }, code)));
  }

  // ---------- Statistieken ----------
  const fmtGetal = (n, d = 1) => n.toLocaleString('nl-NL', { maximumFractionDigits: d });
  function fmtDuur(ms) {
    const uur = ms / 3600000;
    if (uur < 1) return `${Math.round(ms / 60000)} min`;
    return uur < 48 ? `${fmtGetal(uur)} uur` : `${fmtGetal(uur / 24)} dagen`;
  }
  function kaartje(titel) {
    const c = el('div', { class: 'card' });
    c.appendChild(el('h2', {}, titel));
    return c;
  }
  function kerncijfers(paren) {
    const g = el('div', { class: 'kerncijfers' });
    paren.forEach(([waarde, label]) => {
      const k = el('div', { class: 'kerncijfer' });
      k.appendChild(el('div', { class: 'waarde' }, waarde));
      k.appendChild(el('div', { class: 'label' }, label));
      g.appendChild(k);
    });
    return g;
  }

  function renderStats() {
    const root = $('stats');
    root.textContent = '';
    if (!state.reizen.length) {
      const c = kaartje('Nog geen statistieken');
      c.appendChild(el('p', { class: 'muted' }, 'Start een reis op het tabblad Spel. Na je eerste vondsten verschijnen hier de cijfers.'));
      root.appendChild(c);
      root.appendChild(backupKaart());
      return;
    }
    const st = G.statistieken(state.reizen);

    // Huidige of laatste reis
    const reis = getoondeReis();
    const tijden = Object.values(reis.vondsten).sort((a, b) => a - b);
    const duur = (reis.eind || Date.now()) - reis.start;
    const c1 = kaartje(actieveReis() ? 'Deze reis' : 'Laatste reis');
    c1.appendChild(kerncijfers([
      [`${tijden.length} / ${TOTAAL}`, 'departementen'],
      [fmtDuur(duur), actieveReis() ? 'onderweg' : 'duur'],
      [duur > 3600000 ? fmtGetal(tijden.length / (duur / 3600000)) : '–', 'vondsten per uur'],
      [`${Object.keys(reis.bonus).length}`, 'bijzondere vondsten']
    ]));
    if (tijden.length) {
      const eerste = Object.entries(reis.vondsten).sort((a, b) => a[1] - b[1]);
      const [c0, t0] = eerste[0];
      const [cN, tN] = eerste[eerste.length - 1];
      c1.appendChild(el('p', { class: 'muted klein-tekst' },
        `Eerste: ${c0} ${G.BY_CODE.get(c0).naam} (${fmtTijd(t0)}). Laatste: ${cN} ${G.BY_CODE.get(cN).naam} (${fmtTijd(tN)}).`));
    }
    root.appendChild(c1);

    // Prijzen
    const lijstPrijzen = G.prijzen(reis);
    const behaald = lijstPrijzen.filter(p => p.behaald).length;
    const ooit = new Set();
    state.reizen.forEach(rs => G.prijzen(rs).forEach(p => { if (p.behaald) ooit.add(p.id); }));
    const cp = kaartje(`Prijzen ${actieveReis() ? 'deze reis' : 'laatste reis'}: ${behaald} / ${lijstPrijzen.length}`);
    if (state.reizen.length > 1) cp.appendChild(el('p', { class: 'muted klein-tekst' }, `Over alle reizen ooit behaald: ${ooit.size} / ${lijstPrijzen.length}`));
    // Behaalde prijzen eerst, daarna de vier waar je het dichtst bij zit; de rest achter "Toon alle".
    const gesorteerd = lijstPrijzen.slice().sort((a, b) => b.behaald - a.behaald || b.gevonden / b.nodig - a.gevonden / a.nodig);
    const zichtbaar = behaald + 4;
    const grid = el('div', { class: 'prijzen' });
    const rest = el('div', { class: 'prijzen' });
    gesorteerd.forEach((p, i) => {
      const d = el('div', { class: 'prijs' + (p.behaald ? ' behaald' : '') });
      d.appendChild(el('div', { class: 'titel' }, (p.behaald ? '🏆 ' : '') + p.titel));
      d.appendChild(el('div', { class: 'uitleg' }, p.uitleg));
      const b = el('div', { class: 'balk' });
      const vul = el('div');
      vul.style.width = (100 * p.gevonden / p.nodig) + '%';
      b.appendChild(vul);
      d.appendChild(b);
      d.appendChild(el('div', { class: 'stand' }, p.behaald ? 'Behaald !' : `${p.gevonden} / ${p.nodig}`));
      (i < zichtbaar ? grid : rest).appendChild(d);
    });
    cp.appendChild(grid);
    if (rest.children.length) {
      const meer = el('details', { class: 'meer-prijzen' });
      meer.appendChild(el('summary', {}, `Toon alle ${lijstPrijzen.length} prijzen`));
      meer.appendChild(rest);
      cp.appendChild(meer);
    }
    root.appendChild(cp);

    // Klassement
    if (state.spelers.length) {
      const ck = kaartje('Klassement');
      const lijstje = (titel, rij) => {
        ck.appendChild(el('h3', { class: 'kop' }, titel));
        const ol = el('ol', { class: 'klassement' });
        rij.forEach(sp => ol.appendChild(el('li', {}, `${sp.naam}: ${sp.aantal}${sp.bonus ? ` (+${sp.bonus} bonus)` : ''}`)));
        ck.appendChild(ol);
      };
      lijstje(actieveReis() ? 'Deze reis' : 'Laatste reis', G.klassement(reis, state.spelers));
      if (state.reizen.length > 1) lijstje('Alle reizen samen', G.klassement(state.reizen, state.spelers));
      root.appendChild(ck);
    }

    // Alle reizen
    const c2 = kaartje('Alle reizen samen');
    c2.appendChild(kerncijfers([
      [`${st.reizen}`, st.reizen === 1 ? 'reis' : 'reizen'],
      [fmtDuur(st.totaalDagen * 86400000), 'in Frankrijk'],
      [fmtGetal(st.gemiddeld), 'gemiddeld per reis'],
      [st.beste ? `${st.beste.aantal}` : '–', st.beste ? `record (${fmtDatum(st.beste.start)})` : 'record'],
      [`${st.ooit} / ${TOTAAL}`, 'ooit gevonden'],
      [`${st.bonus.length}`, 'soorten bonus ooit']
    ]));
    root.appendChild(c2);

    // Vaakst gevonden
    if (st.vaakst.length) {
      const c3 = kaartje('Vaakst gevonden');
      const ol = el('ol', { class: 'lijst-vaakst' });
      st.vaakst.forEach(([code, n]) => ol.appendChild(el('li', {}, `${code} ${G.BY_CODE.get(code).naam}: ${n} van ${st.reizen} ${st.reizen === 1 ? 'reis' : 'reizen'}`)));
      c3.appendChild(ol);
      root.appendChild(c3);
    }

    // Per regio
    const c4 = kaartje('Per regio (ooit gevonden)');
    st.regios.forEach(g => {
      const r = el('div', { class: 'regio' });
      r.appendChild(el('span', {}, g.regio));
      r.appendChild(el('span', { class: 'muted' }, `${g.ooit} / ${g.totaal}`));
      const b = el('div', { class: 'balk' });
      const vul = el('div');
      vul.style.width = (100 * g.ooit / g.totaal) + '%';
      b.appendChild(vul);
      r.appendChild(b);
      c4.appendChild(r);
    });
    root.appendChild(c4);

    // Nog nooit gezien
    const c5 = kaartje(`Nog nooit gezien (${st.nooit.length})`);
    const codes = el('div', { class: 'codes' });
    st.nooit.forEach(code => {
      const sp = el('span', { title: G.BY_CODE.get(code).naam }, code);
      codes.appendChild(sp);
    });
    if (!st.nooit.length) c5.appendChild(el('p', {}, 'Allemaal gevonden. Chapeau !'));
    else c5.appendChild(codes);
    root.appendChild(c5);

    // Reizen
    const c6 = kaartje('Alle reizen');
    const ul = el('ul', { class: 'reizen' });
    state.reizen.slice().reverse().forEach(r => {
      const li = el('li');
      li.appendChild(el('span', {}, `${fmtDatum(r.start)} – ${r.eind ? fmtDatum(r.eind) : 'nu'}`));
      const acties = el('span', { class: 'acties' });
      acties.appendChild(el('strong', {}, `${Object.keys(r.vondsten).length} / ${TOTAAL}`));
      if (r.eind) {
        const weg = el('button', { class: 'link-knop', 'aria-label': 'Reis verwijderen' }, 'verwijder');
        weg.addEventListener('click', () => {
          if (!confirm(`Reis van ${fmtDatum(r.start)} verwijderen? Dit kan niet ongedaan worden.`)) return;
          state.reizen = state.reizen.filter(x => x.id !== r.id);
          bewaar();
          render();
          renderStats();
        });
        acties.appendChild(weg);
      }
      li.appendChild(acties);
      ul.appendChild(li);
    });
    c6.appendChild(ul);
    root.appendChild(c6);
    root.appendChild(backupKaart());
  }

  // ---------- Back-up ----------
  function backupKaart() {
    const c = kaartje('Back-up');
    c.appendChild(el('p', { class: 'muted klein-tekst' },
      'Alles staat alleen op deze telefoon. Maak af en toe een back-up, bijvoorbeeld naar je mail of Drive, zodat je niets kwijtraakt bij een nieuwe telefoon.'));
    const knoppen = el('div', { class: 'backup-knoppen' });
    const exp = el('button', { class: 'btn primary' }, 'Exporteer');
    exp.addEventListener('click', exporteer);
    const imp = el('button', { class: 'btn' }, 'Importeer');
    const bestand = el('input', { type: 'file', accept: '.json,application/json', class: 'hidden' });
    imp.addEventListener('click', () => bestand.click());
    bestand.addEventListener('change', () => { if (bestand.files[0]) importeer(bestand.files[0]); });
    knoppen.append(exp, imp, bestand);
    c.appendChild(knoppen);
    return c;
  }

  async function exporteer() {
    const datum = new Date().toISOString().slice(0, 10);
    const naam = `departementenspel-${datum}.json`;
    const inhoud = JSON.stringify(G.maakBackup(state), null, 1);
    const bestand = new File([inhoud], naam, { type: 'application/json' });
    // Op de telefoon liefst via het deelmenu (mail, Drive, WhatsApp), anders gewoon downloaden.
    if (navigator.canShare && navigator.canShare({ files: [bestand] })) {
      try {
        await navigator.share({ files: [bestand], title: 'Back-up departementenspel' });
        return;
      } catch (e) {
        if (e.name === 'AbortError') return;
      }
    }
    const url = URL.createObjectURL(bestand);
    const a = el('a', { href: url, download: naam });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('Back-up opgeslagen');
  }

  async function importeer(bestand) {
    let nieuw;
    try {
      nieuw = G.valideerBackup(JSON.parse(await bestand.text()));
    } catch (e) {
      toast(e instanceof SyntaxError ? 'Dit bestand kan niet gelezen worden' : e.message);
      return;
    }
    const n = nieuw.reizen.length;
    if (!confirm(`Back-up met ${n} ${n === 1 ? 'reis' : 'reizen'} en ${nieuw.spelers.length} spelers terugzetten? Wat nu op deze telefoon staat, wordt vervangen.`)) return;
    Object.assign(state, nieuw);
    bewaar();
    render();
    renderBingo();
    renderStats();
    toast('Back-up teruggezet');
  }

  // ---------- Start ----------
  $('kentekenInfo').innerHTML = window.KENTEKEN_HTML;
  function render(nieuw) {
    renderSpelers();
    renderSpel(nieuw);
    tekenKaartKleuren();
  }
  render();
  renderBingo();
  toonBuffer();
  laadKaart();

  // ---------- Nieuwe versie ----------
  // Een nieuwe service worker wacht tot de speler op "Ververs" tikt, zodat een update nooit
  // midden in het spel de pagina herlaadt.
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    let herladen = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (herladen) return;
      herladen = true;
      location.reload();
    });
    navigator.serviceWorker.register('sw.js').then(reg => {
      const toonUpdate = sw => {
        $('updateBalk').classList.remove('hidden');
        $('btnUpdate').onclick = () => sw.postMessage('SKIP_WAITING');
      };
      if (reg.waiting && navigator.serviceWorker.controller) toonUpdate(reg.waiting);
      reg.addEventListener('updatefound', () => {
        const sw = reg.installing;
        sw.addEventListener('statechange', () => {
          if (sw.state === 'installed' && navigator.serviceWorker.controller) toonUpdate(sw);
        });
      });
      // Bij terugkeren naar de app even kijken of er een nieuwe versie is.
      document.addEventListener('visibilitychange', () => { if (!document.hidden) reg.update().catch(() => {}); });
    }).catch(() => {});
  }
})();
