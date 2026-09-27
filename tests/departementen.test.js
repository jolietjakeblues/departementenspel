const test = require('node:test');
const assert = require('node:assert/strict');
const game = require('../game.js');

test('er zijn 96 departementen op het vasteland/Corsica en 5 overzee', () => {
  assert.equal(game.METRO.length, 96);
  assert.equal(game.OUTRE_MER.length, 5);
  assert.equal(new Set(game.DEPARTEMENTEN.map(d => d.code)).size, 101);
});

test('normalize herkent diverse schrijfwijzen', () => {
  assert.equal(game.normalize('1').code, '01');
  assert.equal(game.normalize(' 13 ').item.naam, 'Bouches-du-Rhône');
  assert.equal(game.normalize('2a').code, '2A');
  assert.equal(game.normalize('02b').code, '2B');
  assert.equal(game.normalize('974').item.naam, 'La Réunion');
  assert.equal(game.normalize('20').type, 'bonus');
  assert.equal(game.normalize('tt').type, 'bonus');
  assert.equal(game.normalize('96').type, 'onbekend');
  assert.equal(game.normalize('').type, 'onbekend');
});

test('gridRows: 1-10, 11-19 met 2A/2B, ..., 91-95, overzee', () => {
  const rows = game.gridRows();
  assert.deepEqual(rows[0], ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10']);
  assert.deepEqual(rows[1], ['11', '12', '13', '14', '15', '16', '17', '18', '19', '2A', '2B']);
  assert.deepEqual(rows[2].slice(0, 2), ['21', '22']);
  assert.deepEqual(rows[9], ['91', '92', '93', '94', '95']);
  assert.deepEqual(rows[10], ['971', '972', '973', '974', '976']);
  assert.equal(rows.flat().length, 101);
});

test('bingokaart is deterministisch, uniek en zonder overzee', () => {
  const a = game.makeBingoCard('ABC123', 16);
  const b = game.makeBingoCard('abc123', 16);
  assert.deepEqual(a.cells, b.cells);
  assert.equal(new Set(a.cells).size, 16);
  assert.ok(a.cells.every(c => c.length === 2));
  assert.notDeepEqual(game.makeBingoCard('XYZ789', 16).cells, a.cells);
  assert.equal(game.makeBingoCard('ABC123', 20).cells.length, 20);
  assert.throws(() => game.makeBingoCard('ABC123', 7));
});

test('bingoStatus vindt rijen, kolommen en diagonalen', () => {
  const card = game.makeBingoCard('TEST', 16);
  const row = new Set(card.cells.slice(4, 8));
  assert.deepEqual(game.bingoStatus(card, row).lines, [{ soort: 'rij', index: 1 }]);
  const col = new Set([0, 4, 8, 12].map(i => card.cells[i]));
  assert.deepEqual(game.bingoStatus(card, col).lines, [{ soort: 'kolom', index: 0 }]);
  const diag = new Set([0, 5, 10, 15].map(i => card.cells[i]));
  assert.deepEqual(game.bingoStatus(card, diag).lines, [{ soort: 'diagonaal', index: 0 }]);
  assert.equal(game.bingoStatus(card, new Set(card.cells)).vol, true);
  const rect = game.makeBingoCard('TEST', 12);
  assert.equal(game.bingoStatus(rect, new Set([0, 5, 10].map(i => rect.cells[i]))).lines.length, 0);
});

test('bingokaart volgt de mix van vaak, gemiddeld en zelden', () => {
  for (const size of [12, 16, 20]) {
    for (const code of ['AAAAAA', 'QWERTY', 'Z9Z9Z9']) {
      const card = game.makeBingoCard(code, size);
      const n = f => card.cells.filter(c => game.frequentie(c) === f).length;
      assert.deepEqual([n('vaak'), n('gemiddeld'), n('zelden')], game.MIX[size]);
      assert.equal(new Set(card.cells).size, size);
    }
  }
});

test('statistieken over meerdere reizen', () => {
  const dag = 86400000;
  const reizen = [
    { start: 0, eind: 2 * dag, vondsten: { '13': 1, '75': 2 }, bonus: { TT: 1 } },
    { start: 10 * dag, eind: 11 * dag, vondsten: { '75': 1, '2A': 2, '974': 3 }, bonus: {} }
  ];
  const s = game.statistieken(reizen);
  assert.equal(s.reizen, 2);
  assert.equal(s.totaalDagen, 3);
  assert.equal(s.gemiddeld, 2.5);
  assert.equal(s.beste.aantal, 3);
  assert.equal(s.ooit, 4);
  assert.equal(s.nooit.length, 97);
  assert.deepEqual(s.vaakst[0], ['75', 2]);
  assert.deepEqual(s.bonus, ['TT']);
  assert.equal(s.regios.find(r => r.regio === 'Corse').ooit, 1);
  assert.equal(game.statistieken([]).beste, null);
});

test('klassement telt vondsten per speler, per reis en over reizen', () => {
  const spelers = [{ id: 'a', naam: 'Anna' }, { id: 'b', naam: 'Bram' }];
  const r1 = { vondsten: { '13': 1, '75': 2, '69': 3 }, bonus: { TT: 4 }, door: { '13': 'a', '75': 'b', '69': 'b', TT: 'a' } };
  const r2 = { vondsten: { '33': 1 }, bonus: {}, door: { '33': 'a', '44': 'a' } };
  assert.deepEqual(game.klassement(r1, spelers).map(s => [s.naam, s.aantal, s.bonus]), [['Bram', 2, 0], ['Anna', 1, 1]]);
  // 44 staat wel in door maar is niet (meer) gevonden: telt niet mee.
  assert.deepEqual(game.klassement([r1, r2], spelers).map(s => [s.naam, s.aantal]), [['Anna', 2], ['Bram', 2]]);
  assert.deepEqual(game.klassement({ vondsten: {} }, []), []);
});

test('back-up: maken en weer inlezen geeft dezelfde gegevens', () => {
  const state = {
    reizen: [{ id: 'x', start: 1, eind: null, vondsten: { '13': 5 }, bonus: { TT: 6 }, door: { '13': 'a' } }],
    spelers: [{ id: 'a', naam: 'Anna' }],
    actiefId: 'x',
    bingo: { code: 'ABC', size: 16, gemarkeerd: ['13'], geroepen: ['13', '75'] }
  };
  const terug = game.valideerBackup(JSON.parse(JSON.stringify(game.maakBackup(state, 99))));
  assert.deepEqual(terug, state);
});

test('back-up: oude gegevens zonder spelers of door worden aangevuld', () => {
  const terug = game.valideerBackup({ reizen: [{ id: 'x', start: 1, eind: 2, vondsten: { '13': 5 }, bonus: {} }], actiefId: 'x', bingo: { code: 'A', size: 16, gemarkeerd: [] } });
  assert.deepEqual(terug.spelers, []);
  assert.deepEqual(terug.reizen[0].door, {});
  assert.equal(terug.actiefId, null); // reis is al afgelopen
  assert.deepEqual(terug.bingo.geroepen, []);
});

test('back-up: verkeerde bestanden worden geweigerd', () => {
  for (const fout of [null, [], 'tekst', {}, { reizen: 'x' }, { reizen: [{ id: 1 }] }, { app: 'departementenspel', data: null }]) {
    assert.throws(() => game.valideerBackup(fout), /geen geldig back-upbestand/);
  }
  assert.equal(game.valideerBackup({ reizen: [], bingo: { code: 'A', size: 7 } }).bingo, null);
});

test('prijzen: regio compleet, extra prijzen en mijlpalen', () => {
  const ids = game.PRIJZEN.map(p => p.id);
  assert.equal(new Set(ids).size, ids.length);
  // 13 regio's op het vasteland + Corsica, plus outre-mer
  assert.equal(game.PRIJZEN.filter(p => p.soort === 'regio').length, 14);
  const vind = codes => ({ vondsten: Object.fromEntries(codes.map((c, i) => [c, i + 1])) });
  const bretagne = ['22', '29', '35', '56'];
  const p = game.prijzen(vind(bretagne));
  assert.equal(p.find(x => x.id === 'regio:Bretagne').behaald, true);
  assert.equal(p.find(x => x.id === 'regio:Normandie').behaald, false);
  assert.deepEqual([p.find(x => x.id === 'regio:Normandie').gevonden, p.find(x => x.id === 'regio:Normandie').nodig], [0, 5]);
  assert.equal(p.find(x => x.id === 'regio:Corse').titel, 'L’île de beauté');
  assert.equal(game.prijzen(vind(['75', '92', '93', '94'])).find(x => x.id === 'petite-couronne').behaald, true);
  const zeldzaam = game.prijzen(vind(['48', '23', '05', '15', '09', '90']));
  assert.deepEqual([zeldzaam.find(x => x.id === 'zelden').gevonden, zeldzaam.find(x => x.id === 'zelden').behaald], [5, true]);
  const alles = game.prijzen(vind(game.DEPARTEMENTEN.map(d => d.code)));
  assert.ok(alles.every(x => x.behaald));
  assert.equal(game.prijzen(null).filter(x => x.behaald).length, 0);
});

test('nieuwePrijzen geeft alleen wat er net bij is gekomen', () => {
  const voor = { vondsten: { '22': 1, '29': 2, '35': 3 } };
  const na = { vondsten: { ...voor.vondsten, '56': 4 } };
  assert.deepEqual(game.nieuwePrijzen(voor, na).map(p => p.id), ['regio:Bretagne']);
  assert.deepEqual(game.nieuwePrijzen(na, na), []);
  const negen = { vondsten: Object.fromEntries(game.METRO.slice(0, 9).map((d, i) => [d.code, i + 1])) };
  const tien = { vondsten: { ...negen.vondsten, [game.METRO[9].code]: 10 } };
  assert.ok(game.nieuwePrijzen(negen, tien).some(p => p.id === 'mijlpaal:10'));
});

test('back-up: onbekende codes en te lange teksten worden eruit gefilterd', () => {
  const terug = game.valideerBackup({
    reizen: [{ id: 'x', start: 1, eind: 2, vondsten: { '<img>': 5, '13': 6 }, bonus: { ZZ: 1, TT: 2, '13': 3 }, door: { '13': 's1', onzin: 's1' } }],
    spelers: [{ id: 's1', naam: 'x'.repeat(100) }],
    bingo: { code: 'y'.repeat(100), size: 16, gemarkeerd: ['13', '13', '974', '<i>'], geroepen: ['99', '75', 7] }
  });
  assert.deepEqual(terug.reizen[0].vondsten, { '13': 6 });
  assert.deepEqual(terug.reizen[0].bonus, { TT: 2 });
  assert.deepEqual(terug.reizen[0].door, { '13': 's1' });
  assert.equal(terug.spelers[0].naam.length, 20);
  assert.equal(terug.bingo.code.length, 12);
  assert.deepEqual(terug.bingo.gemarkeerd, ['13']); // overzee en onzin doen niet mee in bingo
  assert.deepEqual(terug.bingo.geroepen, ['75']);
});
