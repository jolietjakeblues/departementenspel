// Informatie over Franse kentekentypen. Statische inhoud voor het tabblad "Kentekens".
(function (root) {
  const siv = (tekst, dep) =>
    `<span class="plaat"><span class="eu">★<br>F</span><span class="tekst">${tekst}</span><span class="dep">▲<b>${dep}</b></span></span>`;

  root.KENTEKEN_HTML = `
  <div class="card">
    <h2>Het huidige kenteken (SIV, sinds 2009)</h2>
    ${siv('AB-123-CD', '13')}
    <p>Wit, vorm <strong>AB-123-CD</strong>. Links een blauwe band met de Europese sterren en de F. Rechts een blauwe band met het logo van de regio en het <strong>departementnummer</strong>. Dat nummer toets je in het spel in.</p>
    <p class="let-op">Let op: sinds 2009 kiest de eigenaar het departement op de plaat zelf. Het hoeft dus niet te kloppen met de woonplaats. Veel mensen kiezen hun geboortestreek, en leaseauto's staan vaak op 75 of 92. Het kenteken zelf blijft een leven lang bij de auto.</p>
  </div>

  <div class="card">
    <h2>Motoren, scooters en brommers</h2>
    <span class="plaat moto"><span class="eu">★<br>F</span><span class="tekst">AB-123<br>CD</span><span class="dep">▲<b>13</b></span></span>
    <p class="muted klein-tekst">Schematisch voorbeeld.</p>
    <p>Dit werkt hetzelfde als bij een auto: hetzelfde soort nummer, en rechts het <strong>departementnummer</strong>. Het verschil is dat een tweewieler alleen <strong>achterop</strong> een plaat heeft. Die is kleiner (21 × 13 cm), met het nummer over twee regels. Sinds juli 2017 geldt dit ene formaat voor motoren, scooters, quads en driewielers. Sinds 2015 krijgen ook brommers (50 cc) een gewoon kenteken uit dezelfde reeks.</p>
    <p>Tip: je leest ze het best als je achter de motor rijdt of hem inhaalt.</p>
  </div>

  <div class="card">
    <h2>Aanhangers, caravans en opleggers</h2>
    <p>Een aanhanger of caravan van <strong>meer dan 500 kg</strong> heeft een eigen kenteken. Dat geldt ook voor de oplegger van een vrachtwagen. Het departement kan dus anders zijn dan dat van de auto of trekker ervoor. Een <strong>lichte aanhanger</strong> (tot 500 kg) draagt een kopie van het kenteken van de auto die hem trekt.</p>
    <p>Volgens de <a href="handleiding.html#regels">standaard spelregels</a> tellen aanhangers, caravans en opleggers niet mee: alleen het voertuig zelf telt.</p>
  </div>

  <div class="card">
    <h2>Het oude kenteken (FNI, 1950 tot 2009)</h2>
    <span class="plaat"><span class="tekst">1234 AB 56</span></span>
    <span class="plaat geel"><span class="tekst">1234 AB 56</span></span>
    <p>Vorm <strong>cijfers, letters, departement</strong>. Hier was het laatste getal wél het departement waar de auto stond ingeschreven. Na een verhuizing kreeg de auto een nieuw kenteken. Achterop zat vaak een gele plaat. Bij een eigenaarswissel moest de auto over naar het nieuwe systeem, dus je ziet ze steeds minder.</p>
  </div>

  <div class="card">
    <h2>Zwarte plaat: oldtimer</h2>
    <span class="plaat zwart"><span class="tekst">123 AB 45</span></span>
    <p>Witte tekens op een zwarte plaat. Alleen toegestaan voor oldtimers met een collectiekenteken (carte grise collection). Een zwarte plaat met <strong>20</strong> erop komt nog van vóór de splitsing van Corsica in 1976: een topvondst.</p>
  </div>

  <div class="card">
    <h2>Rode plaat met datum: TT (Transit Temporaire)</h2>
    <span class="plaat rood"><span class="tekst">AB-123-CD</span><span class="datum">03<br>27</span></span>
    <p>Witte tekens op een rode plaat, met een gewoon nummer zoals <strong>AB-123-CD</strong>. De letters TT staan er dus niet op. Rechts staat de <strong>vervaldatum</strong> (maand/jaar) in plaats van een departement. Voor auto's die maar tijdelijk in Frankrijk rijden, bijvoorbeeld gekocht door iemand die buiten de EU woont, of die worden uitgevoerd. De plaat geldt van enkele weken tot zes maanden.</p>
  </div>

  <div class="card">
    <h2>Groene plaat: diplomaten</h2>
    <span class="plaat groen"><span class="tekst">123 CD 45</span></span>
    <p>Groen met oranje tekens (<strong>CD</strong>, <strong>CMD</strong>) of witte tekens (<strong>C</strong>, <strong>K</strong>). <strong>CD</strong> = corps diplomatique, <strong>CMD</strong> = hoofd van een diplomatieke missie, <strong>C</strong> = consulair, <strong>K</strong> = technisch of administratief personeel. Het eerste nummer staat voor het land of de internationale organisatie. Geen departement.</p>
  </div>

  <div class="card">
    <h2>Roze platen: W garage en WW</h2>
    <span class="plaat roze"><span class="eu">★<br>F</span><span class="tekst">W-123-AB</span></span>
    <span class="plaat roze"><span class="eu">★<br>F</span><span class="tekst">WW-123-AB</span><span class="datum">06<br>26</span></span>
    <p>Sinds 1 januari 2026 hebben deze platen <strong>zwarte tekens op een roze plaat</strong>. Oudere exemplaren kunnen nog wit zijn.</p>
    <p><strong>W garage</strong> (W-123-AB): handelaarskenteken van een garage of autobedrijf, om auto's zonder eigen inschrijving te laten rijden. <strong>WW</strong> (WW-123-AB): tijdelijk kenteken, bijvoorbeeld voor een geïmporteerde auto die nog op de definitieve inschrijving wacht. Rechts staat de vervaldatum (maand/jaar) in plaats van een departement.</p>
  </div>

  <div class="card">
    <h2>Overige</h2>
    <p><strong>Leger</strong>: Franse vlag op de plaat, alleen cijfers. <strong>Monaco</strong> (MC) en <strong>Andorra</strong> (AND) zijn andere landen en tellen niet mee.</p>
  </div>

  <div class="card">
    <h2>Overzee</h2>
    <p>Auto's uit Guadeloupe (971), Martinique (972), Guyane (973), La Réunion (974) en Mayotte (976) hebben een gewoon kenteken, met dat nummer rechts op de plaat.</p>
    <p>De andere overzeese gebieden hebben een <strong>eigen systeem</strong>, en hun nummer staat <strong>niet</strong> op de plaat. Je herkent ze zo:</p>
    <ul>
      <li><strong>975 Saint-Pierre-et-Miquelon</strong>: begint met SPM (SPM 123 A)</li>
      <li><strong>977 Saint-Barthélemy</strong>: het wapen van het eiland, dan cijfers en letters (123 AB)</li>
      <li><strong>978 Saint-Martin</strong>: vier cijfers en drie letters (1234-ABC)</li>
      <li><strong>986 Wallis-et-Futuna</strong>: eindigt op WF (1234 WF)</li>
      <li><strong>987 Frans-Polynesië</strong>: eindigt op P (123456 P)</li>
      <li><strong>988 Nieuw-Caledonië</strong>: eindigt op NC (123456 NC)</li>
    </ul>
    <p>Zie je er een, toets dan het nummer in, bijvoorbeeld 988. Het telt als bonusvondst.</p>
    <p class="muted klein-tekst">Vormen en voorbeelden zijn schematisch. Kleuren en datums volgen het Franse besluit over kentekenplaten (arrêté du 9 février 2009, bijgewerkt voor 2026).</p>
  </div>`;
})(this);
