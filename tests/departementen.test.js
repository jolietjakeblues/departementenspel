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
