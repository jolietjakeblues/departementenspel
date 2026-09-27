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
    <h2>Het oude kenteken (FNI, 1950 tot 2009)</h2>
    <span class="plaat"><span class="tekst">1234 AB 56</span></span>
    <span class="plaat geel"><span class="tekst">1234 AB 56</span></span>
    <p>Vorm <strong>cijfers, letters, departement</strong>. Hier was het laatste getal wél het departement waar de auto stond ingeschreven. Na een verhuizing kreeg de auto een nieuw kenteken. Achterop zat vaak een gele plaat. Bij een eigenaarswissel moest de auto over naar het nieuwe systeem, dus je ziet ze steeds minder.</p>
  </div>

  <div class="card">
    <h2>Zwarte plaat: oldtimer</h2>
    <span class="plaat zwart"><span class="tekst">123 AB 45</span></span>
    <p>Zwart met zilveren of witte tekens. Alleen toegestaan voor oldtimers met een collectiekenteken (carte grise collection). Een zwarte plaat met <strong>20</strong> erop komt nog van vóór de splitsing van Corsica in 1976: een topvondst.</p>
  </div>

  <div class="card">
    <h2>Rode plaat met datum: TT (Transit Temporaire)</h2>
    <span class="plaat rood"><span class="tekst">TT 123 AB</span><span class="datum">03<br>27</span></span>
    <p>Rood met witte tekens en in het rechtervak een <strong>vervaldatum</strong> (maand en jaar). Voor auto's die in Frankrijk zijn gekocht door iemand die buiten de EU woont, of die naar het buitenland worden uitgevoerd. De plaat geldt maar tijdelijk. Er staat geen departement op.</p>
  </div>

  <div class="card">
    <h2>Groene plaat: diplomaten</h2>
    <span class="plaat groen"><span class="tekst">123 CD 45</span></span>
    <p>Groen met oranje of witte tekens. <strong>CD</strong> = corps diplomatique, <strong>C</strong> = consulair, <strong>K</strong> = technisch of administratief personeel. Het eerste nummer staat voor het land of de internationale organisatie. Geen departement.</p>
  </div>

  <div class="card">
    <h2>W garage en WW</h2>
    ${siv('W-123-AB', '69')}
    ${siv('WW-123-AB', '33')}
    <p><strong>W garage</strong>: handelaarskenteken van een garage of autobedrijf, om auto's zonder eigen inschrijving te laten rijden. <strong>WW</strong>: tijdelijk kenteken, bijvoorbeeld voor een geïmporteerde auto die nog op de definitieve inschrijving wacht.</p>
  </div>

  <div class="card">
    <h2>Overige</h2>
    <p><strong>Leger</strong>: Franse vlag op de plaat, alleen cijfers. <strong>Overzee</strong>: auto's uit Guadeloupe (971), Martinique (972), Guyane (973), La Réunion (974) en Mayotte (976) hebben gewoon een SIV-kenteken met dat nummer. Nieuw-Caledonië en Frans-Polynesië hebben een eigen systeem. <strong>Monaco</strong> (MC) en <strong>Andorra</strong> (AND) zijn andere landen en tellen niet mee.</p>
    <p class="muted klein-tekst">Vormen en voorbeelden zijn schematisch. De officiële regels staan op service-public.fr.</p>
  </div>`;
})(this);
