(function () {
  'use strict';
  const G = window.DEP_GAME;
  const $ = id => document.getElementById(id);
  const STORAGE_KEY = 'departementenspel.v1';
  const TOTAAL = G.DEPARTEMENTEN.length;

  // ---------- Opslag ----------
  // state: { reizen: [{ id, start, eind, vondsten: {code: tijd}, bonus: {code: tijd} }], actiefId, bingo: {code, size, gemarkeerd: []} }
  function laad() {
    try {
      const s = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (s && Array.isArray(s.reizen)) return s;
    } catch (e) { /* geen of kapotte opslag: begin leeg */ }
    return { reizen: [], actiefId: null, bingo: null };
  }
  function bewaar() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* privévenster e.d. */ }
  }
  const state = laad();

  const actieveReis = () => state.reizen.find(r => r.id === state.actiefId) || null;
  // De reis die we tonen: de actieve, anders de laatste.
  const getoondeReis = () => actieveReis() || state.reizen[state.reizen.length - 1] || null;
  const alleVondsten = () => {
    const s = new Set();
    state.reizen.forEach(r => Object.keys(r.vondsten).forEach(c => s.add(c)));
    return s;
  };

  // ---------- Hulpjes ----------
  const fmtDatum = t => new Date(t).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' });
  const fmtTijd = t => new Date(t).toLocaleString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  let toastTimer;
  function toast(tekst) {
    const el = $('toast');
    el.textContent = tekst;
    el.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.add('hidden'), 2600);
  }
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
    window.scrollTo(0, 0);
  }

  // ---------- Reis ----------
  $('btnStart').addEventListener('click', () => {
    const reis = { id: Date.now().toString(36), start: Date.now(), eind: null, vondsten: {}, bonus: {} };
    state.reizen.push(reis);
    state.actiefId = reis.id;
    bewaar();
    toast('Bienvenue en France! Veel speurplezier.');
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
    toast(`Au revoir! Eindstand: ${n} / ${TOTAAL}`);
    render();
  });

  function vondstToggle(code, soort) {
    const reis = actieveReis();
    if (!reis) { toast('Start eerst een reis'); return false; }
    const lijst = soort === 'bonus' ? reis.bonus : reis.vondsten;
    if (lijst[code]) delete lijst[code];
    else lijst[code] = Date.now();
    bewaar();
    return !!lijst[code];
  }

  function voegToe(invoer) {
    const r = G.normalize(invoer);
    if (r.type === 'onbekend') { toast(`${invoer || '?'} is geen departement`); return; }
    const reis = actieveReis();
    if (!reis) { toast('Start eerst een reis'); return; }
    const lijst = r.type === 'bonus' ? reis.bonus : reis.vondsten;
    if (lijst[r.code]) { toast(`${r.code} ${r.item.naam} had je al`); return; }
    lijst[r.code] = Date.now();
    bewaar();
    const n = Object.keys(reis.vondsten).length;
    toast(r.type === 'bonus' ? `Bonus: ${r.item.naam}!` : `${r.code} ${r.item.naam}! (${n}/${TOTAAL})`);
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
    const totaal = alleVondsten().size;
    $('tellingSub').textContent = !reis ? 'nog geen reis gestart'
      : (actief ? 'deze reis' : 'laatste reis') + (state.reizen.length > 1 ? ` · alle reizen samen: ${totaal}` : '');
    $('reisStatus').textContent = actief ? `Onderweg sinds ${fmtTijd(actieveReis().start)}` : 'Geen reis actief';

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

    const lijst = $('reizen');
    lijst.textContent = '';
    const oud = state.reizen.filter(r => r.eind).slice().reverse();
    if (!oud.length) lijst.appendChild(el('li', { class: 'muted' }, 'Nog geen afgeronde reizen'));
    oud.forEach(r => {
      const li = el('li');
      li.appendChild(el('span', {}, `${fmtDatum(r.start)} – ${fmtDatum(r.eind)}`));
      li.appendChild(el('strong', {}, `${Object.keys(r.vondsten).length} / ${TOTAAL}`));
      lijst.appendChild(li);
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
    $('sheetGevonden').textContent = lijst[r.code] ? `Gevonden op ${fmtTijd(lijst[r.code])}` : 'Nog niet gevonden' + (reis ? '' : '.');
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
    const aan = vondstToggle(r.code, r.type === 'bonus' ? 'bonus' : 'dep');
    toast(aan ? `${r.item.naam} gevonden!` : `${r.item.naam} weer weggehaald`);
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
    state.bingo = { code, size, gemarkeerd: [] };
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
    melding.textContent = status.vol ? '🎉 VOLLE KAART! 🎉' : (status.lines.length ? '🎯 BINGO!' : '');

    const grid = $('bingoGrid');
    grid.style.gridTemplateColumns = `repeat(${kaart.cols}, 1fr)`;
    grid.textContent = '';
    kaart.cells.forEach((code, i) => {
      const v = el('button', { class: 'bingo-vak' + (aan.has(code) ? ' aan' : '') + (opLijn.has(i) ? ' lijn' : '') });
      v.appendChild(el('span', { class: 'nr' }, code));
      v.appendChild(el('span', { class: 'nm' }, G.BY_CODE.get(code).naam));
      v.addEventListener('click', () => {
        const had = status.lines.length;
        const idx = b.gemarkeerd.indexOf(code);
        if (idx >= 0) b.gemarkeerd.splice(idx, 1); else b.gemarkeerd.push(code);
        bewaar();
        renderBingo();
        const nu = G.bingoStatus(kaart, new Set(b.gemarkeerd));
        if (nu.lines.length > had) { toast(nu.vol ? 'VOLLE KAART!' : 'BINGO!'); if (navigator.vibrate) navigator.vibrate([100, 60, 200]); }
      });
      grid.appendChild(v);
    });
  }

  // ---------- Start ----------
  $('kentekenInfo').innerHTML = window.KENTEKEN_HTML;
  function render(nieuw) {
    renderSpel(nieuw);
    tekenKaartKleuren();
  }
  render();
  renderBingo();
  toonBuffer();
  laadKaart();

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
