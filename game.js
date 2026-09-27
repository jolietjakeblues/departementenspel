// Pure spellogica, zonder DOM, zodat hij in Node getest kan worden.
(function (root) {
  const data = (typeof module !== 'undefined' && module.exports) ? require('./data.js') : root.DEP_DATA;
  const { DEPARTEMENTEN, BONUS } = data;

  const BY_CODE = new Map(DEPARTEMENTEN.map(d => [d.code, d]));
  const BONUS_BY_CODE = new Map(BONUS.map(b => [b.code, b]));
  const METRO = DEPARTEMENTEN.filter(d => d.code.length === 2);
  const OUTRE_MER = DEPARTEMENTEN.filter(d => d.code.length === 3);

  // Zet invoer als "1", "01", "2a", " 13 " om naar de officiële code.
  // Retourneert { type: 'dep' | 'bonus' | 'onbekend', code, item }.
  function normalize(input) {
    const raw = String(input || '').trim().toUpperCase().replace(/\s+/g, '');
    if (!raw) return { type: 'onbekend', code: '' };
    let code = raw;
    if (/^\d$/.test(code)) code = '0' + code;
    if (/^0?2[AB]$/.test(code)) code = code.slice(-2);
    if (BY_CODE.has(code)) return { type: 'dep', code, item: BY_CODE.get(code) };
    if (BONUS_BY_CODE.has(code)) return { type: 'bonus', code, item: BONUS_BY_CODE.get(code) };
    return { type: 'onbekend', code };
  }

  // Rijen voor de grote tabel: 01-10, 11-19 + 2A/2B, 21-30, ..., 91-95, overzee.
  function gridRows() {
    const rows = [];
    let current = [];
    let bucket = 0;
    for (const d of METRO) {
      const n = d.code === '2A' || d.code === '2B' ? 20 : parseInt(d.code, 10);
      const b = Math.floor((n - 1) / 10);
      if (b !== bucket && current.length) { rows.push(current); current = []; }
      bucket = b;
      current.push(d.code);
    }
    if (current.length) rows.push(current);
    rows.push(OUTRE_MER.map(d => d.code));
    return rows;
  }

  // Deterministische random-generator, zodat een kaartcode altijd dezelfde bingokaart geeft.
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hashString(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  function randomCardCode(rand = Math.random) {
    let s = '';
    for (let i = 0; i < 6; i++) s += CODE_CHARS[Math.floor(rand() * CODE_CHARS.length)];
    return s;
  }

  const CARD_SIZES = { 12: [3, 4], 16: [4, 4], 20: [4, 5] };

  // Hoe vaak je een departement ziet, grofweg naar inwonertal. Sinds 2009 kiest de eigenaar
  // het nummer zelf, dus het blijft een schatting.
  const VAAK = ['59', '75', '13', '93', '92', '69', '33', '94', '62', '78', '31', '77', '44', '91', '06', '95', '76', '34', '35', '38', '67', '57'];
  const ZELDEN = ['48', '23', '05', '15', '09', '90', '52', '55', '04', '32', '46', '70', '58', '36', '19', '2A', '2B', '39', '65', '43'];
  function frequentie(code) {
    if (VAAK.includes(code)) return 'vaak';
    if (ZELDEN.includes(code)) return 'zelden';
    return 'gemiddeld';
  }
  // Verdeling per kaartgrootte: [vaak, gemiddeld, zelden].
  const MIX = { 12: [6, 4, 2], 16: [7, 6, 3], 20: [9, 7, 4] };

  function shuffle(arr, rand) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // Bingokaart: alleen departementen van het vasteland + Corsica, geen overzee.
  // Een vaste mix van vaak, gemiddeld en zelden geziene departementen houdt het spel spannend
  // zonder dat één zeldzaam nummer alles ophoudt.
  function makeBingoCard(cardCode, size = 16) {
    if (!CARD_SIZES[size]) throw new Error('Ongeldige kaartgrootte: ' + size);
    const rand = mulberry32(hashString(String(cardCode).toUpperCase() + ':' + size));
    const [nVaak, nGem, nZelden] = MIX[size];
    const uit = f => shuffle(METRO.map(d => d.code).filter(c => frequentie(c) === f), rand);
    const cells = shuffle([
      ...uit('vaak').slice(0, nVaak),
      ...uit('gemiddeld').slice(0, nGem),
      ...uit('zelden').slice(0, nZelden)
    ], rand);
    const [rows, cols] = CARD_SIZES[size];
    return { code: String(cardCode).toUpperCase(), size, rows, cols, cells };
  }

  // Controleert welke lijnen vol zijn. Diagonalen tellen alleen op een vierkante kaart.
  function bingoStatus(card, markedSet) {
    const { rows, cols, cells } = card;
    const at = (r, c) => markedSet.has(cells[r * cols + c]);
    const lines = [];
    for (let r = 0; r < rows; r++) {
      if ([...Array(cols).keys()].every(c => at(r, c))) lines.push({ soort: 'rij', index: r });
    }
    for (let c = 0; c < cols; c++) {
      if ([...Array(rows).keys()].every(r => at(r, c))) lines.push({ soort: 'kolom', index: c });
    }
    if (rows === cols) {
      if ([...Array(rows).keys()].every(i => at(i, i))) lines.push({ soort: 'diagonaal', index: 0 });
      if ([...Array(rows).keys()].every(i => at(i, cols - 1 - i))) lines.push({ soort: 'diagonaal', index: 1 });
    }
    const aantal = cells.filter(c => markedSet.has(c)).length;
    return { lines, aantal, vol: aantal === cells.length };
  }

  // Statistieken over alle reizen. reizen: [{ start, eind, vondsten: {code: tijd}, bonus: {code: tijd} }]
  function statistieken(reizen, nu = Date.now()) {
    const aantal = r => Object.keys(r.vondsten).length;
    const duur = r => Math.max(0, (r.eind || nu) - r.start);
    const telling = new Map(); // code -> aantal reizen waarin gevonden
    reizen.forEach(r => Object.keys(r.vondsten).forEach(c => telling.set(c, (telling.get(c) || 0) + 1)));
    const ooit = new Set(telling.keys());
    const beste = reizen.reduce((b, r) => (!b || aantal(r) > aantal(b) ? r : b), null);
    const regios = new Map();
    DEPARTEMENTEN.forEach(d => {
      const g = regios.get(d.regio) || { regio: d.regio, totaal: 0, ooit: 0 };
      g.totaal++;
      if (ooit.has(d.code)) g.ooit++;
      regios.set(d.regio, g);
    });
    const bonus = new Set();
    reizen.forEach(r => Object.keys(r.bonus || {}).forEach(c => bonus.add(c)));
    return {
      reizen: reizen.length,
      totaalDagen: reizen.reduce((s, r) => s + duur(r), 0) / 86400000,
      gemiddeld: reizen.length ? reizen.reduce((s, r) => s + aantal(r), 0) / reizen.length : 0,
      beste: beste ? { start: beste.start, aantal: aantal(beste) } : null,
      ooit: ooit.size,
      nooit: DEPARTEMENTEN.filter(d => !ooit.has(d.code)).map(d => d.code),
      vaakst: [...telling.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 10),
      regios: [...regios.values()].sort((a, b) => b.ooit / b.totaal - a.ooit / a.totaal || a.regio.localeCompare(b.regio)),
      bonus: [...bonus]
    };
  }

  const api = {
    DEPARTEMENTEN, BONUS, METRO, OUTRE_MER, BY_CODE, BONUS_BY_CODE,
    normalize, gridRows, makeBingoCard, bingoStatus, randomCardCode, CARD_SIZES, MIX, frequentie, statistieken
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.DEP_GAME = api;
})(this);
