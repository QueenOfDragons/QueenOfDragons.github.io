"use strict";

const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

document.getElementById("oggi").textContent = new Intl.DateTimeFormat("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date());

function avviso(testo, tipo = "ok") {
  const box = document.getElementById("avvisi");
  box.innerHTML = `<div class="avviso ${tipo}">${esc(testo)}<button onclick="this.parentElement.remove()">Chiudi</button></div>`;
}

function riquadro(s) {
  const attiva = s.stato === "attiva";
  const numeri = (s.riepilogo || []).slice(0, 4).map((r) => `<div><b>${esc(r.valore)}</b><span>${esc(r.etichetta)}</span></div>`).join("");
  const dentro = `<div class="icona">${esc(s.icona || "•")}</div>
    ${attiva ? "" : `<span class="pill tono-grigio stato">In arrivo</span>`}
    <h2>${esc(s.nome)}</h2>
    <p>${esc(s.descrizione || "")}</p>
    ${numeri ? `<div class="numeri">${numeri}</div>` : attiva ? `<span class="vai">Apri →</span>` : `<p class="vai" style="color:var(--inchiostro-tenue)">La costruiremo nei prossimi passi.</p>`}`;
  return attiva
    ? `<a class="riquadro colore-${esc(s.colore)}" href="s/${esc(s.id)}/index.html">${dentro}</a>`
    : `<div class="riquadro in-arrivo colore-${esc(s.colore)}">${dentro}</div>`;
}

function infoCellulare(dati) {
  const box = document.getElementById("info-cellulare");
  if (dati.cellulare && dati.indirizzi.length) {
    box.innerHTML = `<h3>Dal cellulare</h3><p>Con il telefono collegato allo stesso Wi-Fi di casa, apri il browser e scrivi: <code>${esc(dati.indirizzi[0])}</code></p><p>Ti verrà chiesto il PIN scritto nel file <code>impostazioni.json</code>.</p>`;
  } else {
    box.innerHTML = `<h3>E dal cellulare?</h3><p>Nel programma vero il sito si apre solo dal computer di casa, per sicurezza. Se si vuole, si attiva anche l'uso dal telefono (in casa, con lo stesso Wi-Fi), protetto da un PIN. Questa versione dimostrativa invece si prova da qualsiasi computer o telefono.</p>`;
  }
}

async function carica() {
  try {
    const risposta = await fetch("/api/sistema/sezioni");
    const dati = await risposta.json();
    document.getElementById("riquadri").innerHTML = dati.sezioni.map(riquadro).join("");
    infoCellulare(dati);
  } catch {
    avviso("Non riesco a leggere le sezioni. Il sito è acceso? Prova a richiudere e riaprire con il doppio clic.", "errore");
  }
}

document.getElementById("backup").addEventListener("click", async () => {
  try {
    const r = await fetch("/api/sistema/backup", { method: "POST" });
    const d = await r.json();
    if (!r.ok) throw new Error(d.errore);
    avviso(d.messaggio || `Copia di sicurezza fatta: backup\\${d.file}`);
  } catch (e) {
    avviso(`Copia non riuscita: ${e.message || e}`, "errore");
  }
});

carica();

// ---------------------------------------------------------------- agenda del mese con i foglietti
const TIPI_NOTI = { colloquio: "Colloquio", scadenza: "Scadenza", sollecito: "Sollecito", promemoria: "Promemoria", prossima: "Da fare", pagamento: "Pagamento o rata", incasso: "Incasso", disdetta: "Disdetta", visita: "Visita", cura: "Cura di sé", controllo: "Controllo da prenotare", farmaco: "Farmaci", studio: "Formazione (corsi ed esami)" };
const agenda = { mese: new Date(new Date().getFullYear(), new Date().getMonth(), 1), scelto: "", eventi: [] };
const giornoChiave = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const classeTipo = (t) => `tipo-${TIPI_NOTI[t] ? t : "altro"}`;

async function caricaAgenda() {
  const primo = agenda.mese;
  const inizio = new Date(primo.getFullYear(), primo.getMonth(), 1 - ((primo.getDay() + 6) % 7));
  const fine = new Date(inizio.getFullYear(), inizio.getMonth(), inizio.getDate() + 41);
  try {
    const r = await fetch(`/api/sistema/agenda?da=${giornoChiave(inizio)}&a=${giornoChiave(fine)}`);
    agenda.eventi = (await r.json()).eventi || [];
  } catch {
    agenda.eventi = [];
  }
  if (!agenda.scelto || !agenda.scelto.startsWith(giornoChiave(primo).slice(0, 7))) {
    const oggi = giornoChiave(new Date());
    const delMese = agenda.eventi.filter((e) => e.data.startsWith(giornoChiave(primo).slice(0, 7)));
    agenda.scelto = oggi.startsWith(giornoChiave(primo).slice(0, 7)) ? oggi : (delMese[0]?.data || giornoChiave(primo));
  }
  disegnaAgenda();
}

function foglietto(e, grande = false) {
  const classi = `postit ${classeTipo(e.tipo)} contesto-${esc(e.colore_contesto)} ${e.fatto ? "fatto" : ""}`;
  // sigla facoltativa (per esempio il cassetto delle spese: Società, Ditta, Personale)
  const sigla = e.sigla ? `<b class="sigla sigla-${esc(e.colore_sigla || "grigio")}">${esc(e.sigla)}</b>` : "";
  const iniziale = e.sigla ? `<b class="sigla sigla-${esc(e.colore_sigla || "grigio")}">${esc(e.sigla.charAt(0))}</b>` : ""; // nei quadratini piccoli basta l'iniziale
  const suggerimento = `${e.sigla ? `[${e.sigla}] ` : ""}${e.nome_tipo}${e.ora ? ` ore ${e.ora}` : ""}: ${e.titolo}${e.sotto ? ` (${e.sotto})` : ""}`;
  if (!grande) return `<a class="${classi}" href="${esc(e.link)}" title="${esc(suggerimento)}"><span class="riga1">${iniziale}${esc(e.ora ? `${e.ora} ` : "")}${esc(e.titolo)}</span></a>`;
  return `<a class="${classi}" href="${esc(e.link)}"><span class="ora">${sigla}${esc(e.nome_tipo)}${e.ora ? ` · ore ${esc(e.ora)}` : ""}${e.fatto ? " · fatto" : ""}</span><span class="riga1">${esc(e.titolo)}</span><p>${esc(e.sotto)}${e.luogo ? `<br>${esc(e.luogo)}` : ""}</p><span class="contesto">${esc(e.contesto)}</span></a>`;
}

function disegnaAgenda() {
  const box = document.getElementById("agenda");
  const m = agenda.mese;
  const inizio = new Date(m.getFullYear(), m.getMonth(), 1 - ((m.getDay() + 6) % 7));
  const giorni = Array.from({ length: 42 }, (_, i) => new Date(inizio.getFullYear(), inizio.getMonth(), inizio.getDate() + i));
  const oggi = giornoChiave(new Date());
  const perGiorno = new Map();
  agenda.eventi.forEach((e) => { if (!perGiorno.has(e.data)) perGiorno.set(e.data, []); perGiorno.get(e.data).push(e); });
  const tipiPresenti = [...new Set(["colloquio", "scadenza", "sollecito", "promemoria", "prossima", ...agenda.eventi.map((e) => e.tipo)])];
  const contesti = [...new Map(agenda.eventi.map((e) => [e.contesto, e.colore_contesto])).entries()];
  const ordineSigle = ["Società", "Ditta", "Personale"];
  const posizione = (nome) => (ordineSigle.includes(nome) ? ordineSigle.indexOf(nome) : 99);
  const sigle = [...new Map(agenda.eventi.filter((e) => e.sigla).map((e) => [e.sigla, e.colore_sigla])).entries()].sort((a, b) => posizione(a[0]) - posizione(b[0]));
  const scelti = perGiorno.get(agenda.scelto) || [];
  const nomeScelto = new Intl.DateTimeFormat("it-IT", { weekday: "long", day: "numeric", month: "long" }).format(new Date(`${agenda.scelto}T12:00:00`));
  box.innerHTML = `
    <div class="agenda-testa">
      <h2>${esc(new Intl.DateTimeFormat("it-IT", { month: "long", year: "numeric" }).format(m))}</h2>
      <div class="comandi">
        <button class="btn chiaro piccolo" data-mese="-1">← Mese prima</button>
        <button class="btn chiaro piccolo" data-mese="0">Oggi</button>
        <button class="btn chiaro piccolo" data-mese="1">Mese dopo →</button>
      </div>
    </div>
    <div class="legenda">
      <span class="titolo-legenda">Colore del foglietto:</span>
      ${tipiPresenti.map((t) => `<span><i class="${classeTipo(t)}"></i>${esc(TIPI_NOTI[t] || t)}</span>`).join("")}
      ${sigle.length ? `<span class="titolo-legenda">Etichetta:</span>${sigle.map(([nome, colore]) => `<span><b class="sigla sigla-${esc(colore)}">${esc(nome.charAt(0))}</b>${esc(nome)}</span>`).join("")}` : ""}
      ${contesti.length ? `<span class="titolo-legenda">Striscia in alto:</span>${contesti.map(([nome, colore]) => `<span><b style="background:var(--${["lavanda", "terracotta", "cielo"].includes(colore) ? colore : "salvia"})"></b>${esc(nome)}</span>`).join("")}` : ""}
    </div>
    <div class="mese-casa">
      ${["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"].map((g) => `<div class="nome-giorno">${g}</div>`).join("")}
      ${giorni.map((d) => {
        const k = giornoChiave(d);
        const ev = perGiorno.get(k) || [];
        const classi = ["cella", d.getMonth() !== m.getMonth() ? "fuori" : "", k === oggi ? "oggi" : "", k === agenda.scelto ? "scelta" : ""].join(" ");
        return `<div class="${classi}" data-giorno="${k}" role="button" tabindex="0" aria-label="${esc(k)}"><b>${d.getDate()}</b>
          ${ev.slice(0, 2).map((e) => foglietto(e)).join("")}${ev.length > 2 ? `<small>+${ev.length - 2} altri</small>` : ""}
          <span class="puntini">${ev.map((e) => `<i class="${classeTipo(e.tipo)}"></i>`).join("")}</span></div>`;
      }).join("")}
    </div>
    <div class="giorno-scelto">
      <h3>${esc(nomeScelto)}</h3>
      ${scelti.length ? `<div class="foglietti">${scelti.map((e) => foglietto(e, true)).join("")}</div>` : `<p class="nessuno">Niente in programma per questo giorno. Clicca un altro giorno del calendario per vedere i suoi foglietti.</p>`}
    </div>`;
}

document.getElementById("agenda").addEventListener("click", (evento) => {
  if (evento.target.closest("a.postit")) return; // il foglietto apre la sezione
  const bottone = evento.target.closest("[data-mese]");
  if (bottone) {
    const passo = Number(bottone.dataset.mese);
    const adesso = new Date();
    agenda.mese = passo === 0 ? new Date(adesso.getFullYear(), adesso.getMonth(), 1) : new Date(agenda.mese.getFullYear(), agenda.mese.getMonth() + passo, 1);
    agenda.scelto = passo === 0 ? giornoChiave(adesso) : "";
    caricaAgenda();
    return;
  }
  const cella = evento.target.closest("[data-giorno]");
  if (cella) { agenda.scelto = cella.dataset.giorno; disegnaAgenda(); }
});
document.getElementById("agenda").addEventListener("keydown", (evento) => {
  const cella = evento.target.closest("[data-giorno]");
  if (cella && (evento.key === "Enter" || evento.key === " ")) { evento.preventDefault(); agenda.scelto = cella.dataset.giorno; disegnaAgenda(); }
});

caricaAgenda();
