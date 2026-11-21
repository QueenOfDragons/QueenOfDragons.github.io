"use strict";

// Formazione su nuove competenze: competenze, corsi e certificazioni, ore di studio, materiali e appunti, testo per il CV.

const API = "/api/formazione";
const PER_PAGINA = 10;

// Le liste sono le stesse di modulo.py: se ne aggiungi un valore, aggiungilo in entrambi i posti.
const LIVELLI = [[0, "Da valutare"], [1, "Principiante"], [2, "Base"], [3, "Intermedio"], [4, "Avanzato"], [5, "Esperta"]];
const LIVELLI_EN = ["", "Beginner", "Basic", "Intermediate", "Advanced", "Expert"];
const LIVELLO_MINIMO_CV = 2; // nel CV va solo quello che sai usare: da "Base" in su
const STATI_COMP = [["attiva", "In crescita", "cielo"], ["in_pausa", "In pausa", "grigio"], ["raggiunta", "Obiettivo raggiunto", "salvia"]];
const TIPI_CORSO = [["corso_online", "Corso online", "🖥"], ["corso_aula", "Corso in aula", "🏫"], ["certificazione", "Certificazione", "🎓"], ["webinar", "Webinar o seminario", "🎤"], ["percorso", "Percorso di più corsi", "🧭"], ["master", "Master", "📜"], ["altro", "Altro", "✎"]];
const TIPI_CORSO_EN = { corso_online: "Online course", corso_aula: "Classroom course", certificazione: "Certification", webinar: "Webinar", percorso: "Learning path", master: "Master", altro: "" };
const STATI_CORSO = [["idea", "Da valutare", "grigio"], ["iscritta", "Iscritta, da iniziare", "lavanda"], ["in_corso", "In corso", "cielo"], ["in_pausa", "In pausa", "ambra"], ["completato", "Completato", "salvia"], ["abbandonato", "Lasciato", "grigio"]];
const GRUPPI_CORSI = [["percorso", "Il mio percorso", ["idea", "iscritta", "in_corso", "in_pausa"]], ["in_corso", "In corso", ["in_corso", "in_pausa"]], ["da_iniziare", "Da iniziare e idee", ["iscritta", "idea"]], ["completati", "Completati", ["completato"]], ["lasciati", "Lasciati", ["abbandonato"]], ["tutti", "Tutti", null]];
const TIPI_MAT = [["libro", "Libro", "📖"], ["video", "Video", "▶"], ["articolo", "Articolo", "📰"], ["sito", "Sito web", "🌐"], ["documentazione", "Documentazione", "📘"], ["podcast", "Podcast", "🎧"], ["esercizi", "Esercizi", "✍"], ["appunti", "Appunti miei", "🗒"], ["altro", "Altro", "•"]];
const STATI_MAT = [["da_vedere", "Da leggere o vedere", "lavanda"], ["in_corso", "In corso", "cielo"], ["finito", "Finito", "salvia"]];
const AREE = ["Intelligenza artificiale", "Programmazione", "Dati e Business Intelligence", "Lingue", "Strumenti di lavoro", "Comunicazione", "Altro"];
const AREE_EN = { "Intelligenza artificiale": "Artificial intelligence", Programmazione: "Programming", "Dati e Business Intelligence": "Data and Business Intelligence", Lingue: "Languages", "Strumenti di lavoro": "Work tools", Comunicazione: "Communication", Altro: "Other" };
const SI_NO = [["si", "Sì"], ["no", "No"]];
const VOTI = [[0, "Nessun voto"], [1, "★ Poco utile"], [2, "★★ Così così"], [3, "★★★ Utile"], [4, "★★★★ Molto utile"], [5, "★★★★★ Preziosissimo"]];
const MINUTI_RAPIDI = [15, 30, 45, 60, 90, 120];
const VISTE = [["panoramica", "Panoramica"], ["competenze", "Mappa delle competenze"], ["corsi", "Corsi e certificazioni"], ["studio", "Ore di studio"], ["materiali", "Materiali e appunti"], ["cv", "Per il CV"], ["impostazioni", "Impostazioni"], ["esporta", "Esporta e backup"]];
const CHIAVE_CRONOMETRO = "formazione_cronometro";

// ---------------------------------------------------------------- date
function chiaveGiorno(d = new Date()) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
function daChiave(k) { return new Date(`${k}T12:00:00`); }
function spostaGiorni(n, da = chiaveGiorno()) { const d = daChiave(da); d.setDate(d.getDate() + n); return chiaveGiorno(d); }
function lunediDi(k) { const d = daChiave(k); return spostaGiorni(-((d.getDay() + 6) % 7), k); }
function giorniTra(a, b) { return Math.round((daChiave(b) - daChiave(a)) / 86400000); }
function dataIt(k) { return k ? new Intl.DateTimeFormat("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" }).format(daChiave(k)) : ""; }
function dataMedia(k) { return new Intl.DateTimeFormat("it-IT", { weekday: "short", day: "numeric", month: "short" }).format(daChiave(k)); }
function meseAnno(k) { return k ? `${k.slice(5, 7)}/${k.slice(0, 4)}` : ""; }
function boxGiorno(k) { const d = daChiave(k); return `<div class="giorno"><b>${d.getDate()}</b><span>${esc(new Intl.DateTimeFormat("it-IT", { month: "short" }).format(d))}${d.getFullYear() !== new Date().getFullYear() ? ` ${String(d.getFullYear()).slice(2)}` : ""}</span></div>`; }

// ---------------------------------------------------------------- stato della pagina
function leggiCronometro() { try { return JSON.parse(localStorage.getItem(CHIAVE_CRONOMETRO) || "null"); } catch { return null; } }
function scriviCronometro(valore) { try { if (valore) localStorage.setItem(CHIAVE_CRONOMETRO, JSON.stringify(valore)); else localStorage.removeItem(CHIAVE_CRONOMETRO); } catch { /* il browser non permette di salvare: il cronometro vale finché la pagina resta aperta */ } }

const stato = {
  dati: { competenze: [], corsi: [], sessioni: [], materiali: [], impostazioni: { obiettivo_minuti: 180, giorni_avviso: 7 } },
  vista: location.hash.slice(1) || "panoramica",
  lunedi: lunediDi(chiaveGiorno()),
  pag: { corsi: 1, sessioni: 1, materiali: 1 },
  filtri: { gruppoComp: "attiva", gruppoCorsi: "percorso", testoCorsi: "", compCorsi: "", gruppoMat: "da_vedere", testoMat: "", tipoMat: "", compSess: "" },
  cv: { inCorso: false },
  documenti: [],
  cronometro: leggiCronometro(),
  avviso: null,
};
const app = document.getElementById("app");
const finestra = document.getElementById("finestra");

// ---------------------------------------------------------------- piccoli aiuti
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const etichetta = (lista, valore) => (lista.find((x) => String(x[0]) === String(valore)) || [valore, valore || "—"])[1];
const tono = (lista, valore) => (lista.find((x) => x[0] === valore) || [])[2] || "grigio";
const simbolo = (lista, valore) => (lista.find((x) => x[0] === valore) || [])[2] || "•";
const pill = (lista, valore) => `<span class="pill tono-${tono(lista, valore)}"><i></i>${esc(etichetta(lista, valore))}</span>`;
const pillTesto = (testo, colore = "grigio") => `<span class="pill tono-${colore}">${esc(testo)}</span>`;
const numeroIt = (v, dec = 1) => (v === null || v === undefined || v === "" ? "—" : new Intl.NumberFormat("it-IT", { maximumFractionDigits: dec }).format(Number(v)));
const euro = (v) => (v === null || v === undefined || v === "" ? "" : new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(Number(v)));
function oreMinuti(m) { m = Math.round(m || 0); const h = Math.floor(m / 60), r = m % 60; return h ? (r ? `${h} h ${String(r).padStart(2, "0")}` : `${h} h`) : `${r} min`; }
const fetta = (lista, pagina) => lista.slice((pagina - 1) * PER_PAGINA, pagina * PER_PAGINA);
function paginaValida(n, pagina) { return Math.min(Math.max(1, pagina), Math.max(1, Math.ceil(n / PER_PAGINA))); }
function paginazione(totale, pagina, chiave) {
  const pagine = Math.max(1, Math.ceil(totale / PER_PAGINA));
  if (pagine === 1) return "";
  return `<nav class="pagine"><button class="btn chiaro piccolo" data-azione="pagina" data-chiave="${chiave}" data-pagina="${pagina - 1}" ${pagina <= 1 ? "disabled" : ""}>← Precedenti</button><span>Pagina ${pagina} di ${pagine}</span><button class="btn chiaro piccolo" data-azione="pagina" data-chiave="${chiave}" data-pagina="${pagina + 1}" ${pagina >= pagine ? "disabled" : ""}>Successive →</button></nav>`;
}
function intro(titolo, testo, bottoni = "") { return `<section class="intro"><div><h2>${esc(titolo)}</h2><p>${esc(testo)}</p></div>${bottoni ? `<div class="bottoni">${bottoni}</div>` : ""}</section>`; }
function vuoto(titolo, testo, bottone = "") { return `<div class="vuoto"><h3>${esc(titolo)}</h3><p>${esc(testo)}</p>${bottone}</div>`; }
const opzioni = (lista, scelto) => lista.map(([v, n]) => `<option value="${esc(v)}" ${String(v) === String(scelto ?? "") ? "selected" : ""}>${esc(n)}</option>`).join("");
const campo = (nome, contenuto, aiuto = "") => `<label class="campo"><span>${esc(nome)}</span>${contenuto}${aiuto ? `<small>${esc(aiuto)}</small>` : ""}</label>`;
const dato = (nome, valore) => (valore || valore === 0 ? `<div><dt>${esc(nome)}</dt><dd>${valore}</dd></div>` : "");
const linkEsterno = (url, testo) => (url ? `<a href="${esc(/^https?:\/\//i.test(url) ? url : `https://${url}`)}" target="_blank" rel="noopener">${esc(testo || url)}</a>` : "");
function livelli(attuale, obiettivo, piccoli = false) {
  const pallini = [1, 2, 3, 4, 5].map((n) => `<i class="${n <= attuale ? "pieno" : n <= obiettivo ? "meta" : ""}"></i>`).join("");
  return `<div class="livelli ${piccoli ? "piccoli" : ""}" title="Livello attuale: ${esc(etichetta(LIVELLI, attuale))}. Obiettivo: ${esc(etichetta(LIVELLI, obiettivo))}.">${pallini}${piccoli ? "" : `<span>${esc(etichetta(LIVELLI, attuale))}</span>`}</div>`;
}
function avanzamento(c, grande = false) {
  if (!c.lezioni_totali) return c.stato === "completato" ? `<div class="avanza ${grande ? "grande" : ""}"><div class="binario pieno"><i style="width:100%"></i></div><span>Completato</span></div>` : "";
  const p = Math.round((100 * c.lezioni_fatte) / c.lezioni_totali);
  return `<div class="avanza ${grande ? "grande" : ""}"><div class="binario ${p >= 100 ? "pieno" : ""}"><i style="width:${p}%"></i></div><span>${c.lezioni_fatte} di ${c.lezioni_totali} lezioni · ${p}%</span></div>`;
}

// ---------------------------------------------------------------- calcoli
const compDi = (id) => stato.dati.competenze.find((c) => c.id === Number(id));
const corsoDi = (id) => stato.dati.corsi.find((c) => c.id === Number(id));
const materialeDi = (id) => stato.dati.materiali.find((m) => m.id === Number(id));
const nomeComp = (id) => compDi(id)?.nome || "";
// Il percorso: i corsi non ancora finiti né lasciati, nell'ordine scelto (1 = quello da fare adesso)
const percorso = () => stato.dati.corsi.filter((c) => !["completato", "abbandonato"].includes(c.stato)).sort((a, b) => (a.ordine || 0) - (b.ordine || 0) || a.id - b.id);
const numeroPercorso = (c) => { const i = percorso().findIndex((x) => x.id === c.id); return i < 0 ? 0 : i + 1; };
const pillNumero = (c) => (numeroPercorso(c) ? `<span class="pill tono-cielo">${numeroPercorso(c)}° nel percorso</span>` : "");
function minutiTra(da, a, filtro = () => true) { return stato.dati.sessioni.filter((s) => s.data >= da && s.data <= a && filtro(s)).reduce((t, s) => t + (s.minuti || 0), 0); }
const minutiComp = (id) => stato.dati.sessioni.filter((s) => s.competenza_id === id).reduce((t, s) => t + (s.minuti || 0), 0);
const minutiCorso = (id) => stato.dati.sessioni.filter((s) => s.corso_id === id).reduce((t, s) => t + (s.minuti || 0), 0);
function giorniDiFila() {
  const giorni = new Set(stato.dati.sessioni.map((s) => s.data));
  let k = giorni.has(chiaveGiorno()) ? chiaveGiorno() : spostaGiorni(-1);
  let n = 0;
  while (giorni.has(k)) { n += 1; k = spostaGiorni(-1, k); }
  return n;
}
function fraseSettimana(minuti, obiettivo) {
  const r = obiettivo ? minuti / obiettivo : 0;
  if (r === 0) return "Una nuova settimana di studio: anche 15 minuti sono un ottimo inizio.";
  if (r < 0.5) return "Hai già cominciato: ogni sessione aggiunge un mattoncino.";
  if (r < 1) return "Stai andando bene, il traguardo della settimana è vicino.";
  return "Traguardo della settimana raggiunto. Brava, Elena!";
}
// Date importanti dei corsi (le stesse che finiscono nell'agenda della pagina iniziale)
function dateCorsi() {
  const voci = [];
  stato.dati.corsi.forEach((c) => {
    if (c.stato === "abbandonato") return;
    if (c.esame_il && c.stato !== "completato") voci.push({ data: c.esame_il, ora: c.esame_ora, cosa: "Esame", c });
    if (c.fine_prevista && ["iscritta", "in_corso", "in_pausa"].includes(c.stato)) voci.push({ data: c.fine_prevista, cosa: "Fine corso prevista", c });
    if (c.inizio && c.stato === "iscritta") voci.push({ data: c.inizio, cosa: "Inizio corso", c });
    if (c.attestato_scade && c.stato === "completato") voci.push({ data: c.attestato_scade, cosa: "Attestato da rinnovare", c });
  });
  return voci.sort((a, b) => a.data.localeCompare(b.data));
}
const scadenzeVicine = () => dateCorsi().filter((v) => v.data <= spostaGiorni(stato.dati.impostazioni.giorni_avviso));

// ---------------------------------------------------------------- comunicazione con il server
async function chiama(percorso, opz = {}) {
  const risposta = await fetch(`${API}/${percorso}`, { headers: { "Content-Type": "application/json" }, ...opz });
  const dati = await risposta.json().catch(() => ({}));
  if (!risposta.ok) throw new Error(dati.errore || "Operazione non riuscita.");
  return dati;
}
async function ricarica() {
  try { stato.dati = await chiama("dati"); } catch (e) { avviso(`Non riesco a leggere i dati: ${e.message}. Il sito è acceso?`, "errore"); }
  disegna();
}
async function caricaDocumenti() {
  try {
    const r = await fetch("/api/sistema/documenti");
    stato.documenti = ((await r.json()).documenti || []).filter((d) => d.cartella.replace(/\\/g, "/") === "formazione");
  } catch { stato.documenti = []; }
}
async function salva(percorso, metodo, corpo, messaggio) {
  try {
    const r = await chiama(percorso, { method: metodo, body: corpo ? JSON.stringify(corpo) : undefined });
    await ricarica();
    if (messaggio) avviso(messaggio);
    return r;
  } catch (e) {
    if (finestra.querySelector(".errore-finestra")) avvisoFinestra(e.message);
    else avviso(e.message, "errore");
    throw e;
  }
}
function avviso(testo, tipo = "ok") {
  stato.avviso = { testo, tipo };
  disegna();
  if (tipo === "ok") setTimeout(() => { if (stato.avviso?.testo === testo) { stato.avviso = null; disegna(); } }, 3500);
}
function avvisoFinestra(testo) { const box = finestra.querySelector(".errore-finestra"); if (box) { box.hidden = false; box.textContent = testo; } }

// ---------------------------------------------------------------- struttura della pagina
function vai(vista) { stato.vista = vista; history.replaceState(null, "", `#${vista}`); disegna(); window.scrollTo(0, 0); }
function testoCronometro() {
  if (!stato.cronometro) return "";
  const minuti = Math.max(0, Math.floor((Date.now() - stato.cronometro.inizio) / 60000));
  const corso = corsoDi(stato.cronometro.corso_id);
  return `${oreMinuti(minuti)}${corso ? ` · ${corso.titolo.length > 28 ? `${corso.titolo.slice(0, 27)}…` : corso.titolo}` : ""}`;
}
function barraCronometro() {
  if (!stato.cronometro) return `<button class="btn chiaro" data-azione="avvia-cronometro" title="Fa partire il conteggio del tempo: quando hai finito premi Ferma e la sessione si compila da sola.">⏱ Avvia cronometro</button>`;
  return `<span class="cronometro" title="Il cronometro continua anche se chiudi la pagina.">⏱ <span class="tempo">${esc(testoCronometro())}</span><button class="btn pieno piccolo" data-azione="ferma-cronometro">Ferma e registra</button><button class="btn chiaro piccolo" data-azione="annulla-cronometro" title="Butta via questo conteggio">Annulla</button></span>`;
}
function disegna() {
  const posizione = window.scrollY;
  // chi sta scrivendo in una casella di ricerca non deve perderla quando la pagina si ridisegna
  const attivo = document.activeElement;
  const chiave = attivo && app.contains(attivo) && attivo.dataset.filtro ? `[data-filtro="${attivo.dataset.filtro}"]` : "";
  const cursore = chiave && "selectionStart" in attivo ? [attivo.selectionStart, attivo.selectionEnd] : null;
  const conteggi = {
    panoramica: scadenzeVicine().length || undefined,
    corsi: stato.dati.corsi.filter((c) => c.stato === "in_corso").length || undefined,
  };
  app.innerHTML = `
    <aside class="lato">
      <a class="torna" href="../../index.html">← Pagina iniziale</a>
      <div class="marchio"><div class="bussola">✎\uFE0E</div><div><h1>Formazione</h1><small>Imparare con costanza</small></div></div>
      ${VISTE.map(([id, nome]) => `<button class="voce ${stato.vista === id ? "attiva" : ""}" data-vai="${id}"><span>${esc(nome)}</span>${conteggi[id] !== undefined ? `<b class="${id === "panoramica" ? "allerta" : ""}" title="${id === "panoramica" ? "Esami e scadenze dei corsi vicini" : "Corsi in corso"}">${conteggi[id]}</b>` : ""}</button>`).join("")}
      <p class="privato">Versione dimostrativa: le tue prove restano solo in questo browser.</p>
    </aside>
    <section class="principale">
      <header class="barra">
        <span class="titolo-vista">${esc(etichetta(VISTE, stato.vista))}</span>
        <div class="azioni">${barraCronometro()}<button class="btn chiaro" data-azione="nuovo-corso">+ Corso</button><button class="btn pieno" data-azione="nuova-sessione">+ Ho studiato</button></div>
      </header>
      <div class="contenuto">
        ${stato.avviso ? `<div class="avviso ${stato.avviso.tipo}">${esc(stato.avviso.testo)}<button data-azione="chiudi-avviso">Chiudi</button></div>` : ""}
        ${disegnaVista()}
      </div>
    </section>`;
  window.scrollTo(0, posizione);
  if (chiave) {
    const di = app.querySelector(chiave);
    if (di) { di.focus({ preventScroll: true }); if (cursore) try { di.setSelectionRange(...cursore); } catch { /* le select non hanno cursore */ } }
  }
}
function disegnaVista() {
  switch (stato.vista) {
    case "competenze": return vistaCompetenze();
    case "corsi": return vistaCorsi();
    case "studio": return vistaStudio();
    case "materiali": return vistaMateriali();
    case "cv": return vistaCV();
    case "impostazioni": return vistaImpostazioni();
    case "esporta": return vistaEsporta();
    default: return vistaPanoramica();
  }
}

// ---------------------------------------------------------------- PANORAMICA
function rigaData(v) {
  const g = giorniTra(chiaveGiorno(), v.data);
  const quando = g < 0 ? `${-g} ${-g === 1 ? "giorno" : "giorni"} fa` : g === 0 ? "Oggi" : g === 1 ? "Domani" : `Tra ${g} giorni`;
  const classe = g < 0 ? "ritardo" : g <= stato.dati.impostazioni.giorni_avviso ? "vicina" : "";
  return `<button class="cosa ${classe}" data-azione="apri-corso" data-id="${v.c.id}">${boxGiorno(v.data)}<div><strong>${esc(v.cosa)}: ${esc(v.c.titolo)}</strong><small>${esc([v.ora && `ore ${v.ora}`, v.c.ente].filter(Boolean).join(" · "))}</small></div>${pillTesto(quando, classe === "ritardo" ? "terracotta" : classe === "vicina" ? "ambra" : "grigio")}</button>`;
}
function vistaPanoramica() {
  const d = stato.dati;
  const oggi = chiaveGiorno();
  const settimana = minutiTra(lunediDi(oggi), oggi);
  const obiettivo = d.impostazioni.obiettivo_minuti;
  const p = Math.min(100, Math.round((100 * settimana) / (obiettivo || 1)));
  const attivi = d.corsi.filter((c) => c.stato === "in_corso" || c.stato === "in_pausa").sort((a, b) => (a.stato === "in_corso" ? 0 : 1) - (b.stato === "in_corso" ? 0 : 1));
  const date = dateCorsi().filter((v) => v.data >= spostaGiorni(-30) && v.data <= spostaGiorni(90)).slice(0, 6);
  const ultime = d.sessioni.slice(0, 5);
  const crescita = d.competenze.filter((c) => c.stato === "attiva");
  return `
    <p class="frase-gentile">${esc(fraseSettimana(settimana, obiettivo))}</p>
    <div class="numeri">
      <button class="numero" data-vai="studio"><b>${esc(oreMinuti(settimana))}</b><span>studiate questa settimana, su ${esc(oreMinuti(obiettivo))}</span></button>
      <button class="numero" data-vai="studio"><b>${giorniDiFila()}</b><span>giorni di fila con un po' di studio</span></button>
      <button class="numero" data-azione="gruppo-corsi" data-gruppo="in_corso"><b>${d.corsi.filter((c) => c.stato === "in_corso").length}</b><span>corsi in corso</span></button>
      <button class="numero" data-vai="competenze"><b>${crescita.length}</b><span>competenze in crescita</span></button>
    </div>
    <section class="pannello"><h3>La mia settimana</h3><div class="avanza grande"><div class="binario ${p >= 100 ? "pieno" : ""}"><i style="width:${p}%"></i></div><span>${p}% del traguardo</span></div></section>
    <div class="spazio"></div>
    <div class="due-colonne">
      <section class="pannello"><h3>Corsi in corso</h3><p class="sotto">Premi "Ho studiato" alla fine di una sessione, oppure avvia il cronometro prima di cominciare.</p>
        ${attivi.length ? `<div class="corsi-attivi">${attivi.map((c) => `<div class="corso-attivo">
          <div class="testa"><button data-azione="apri-corso" data-id="${c.id}"><strong>${numeroPercorso(c) ? `<span class="numero-percorso piccolo">${numeroPercorso(c)}</span>` : esc(simbolo(TIPI_CORSO, c.tipo))} ${esc(c.titolo)}</strong><small>${esc([c.ente, nomeComp(c.competenza_id)].filter(Boolean).join(" · "))}</small></button>${pill(STATI_CORSO, c.stato)}</div>
          ${avanzamento(c)}
          <div class="pulsanti-rapidi" style="margin:0"><button class="btn chiaro piccolo" data-azione="nuova-sessione" data-corso="${c.id}">Ho studiato</button><button class="btn chiaro piccolo" data-azione="avvia-cronometro" data-corso="${c.id}">⏱ Cronometro</button>${c.lezioni_totali ? `<button class="btn chiaro piccolo" data-azione="lezione-piu" data-id="${c.id}">+1 lezione fatta</button>` : ""}</div>
        </div>`).join("")}</div>${prossimoNelPercorso()}` : vuoto("Nessun corso in corso", "Quando inizi un corso lo vedi qui, con il suo avanzamento.", `<button class="btn pieno" data-azione="nuovo-corso">+ Aggiungi un corso</button>`)}
      </section>
      <div>
        <section class="pannello"><h3>Esami e date dei corsi</h3><p class="sotto">Le stesse date compaiono nell'agenda della pagina iniziale.</p>
          ${date.length ? `<div class="elenco-breve">${date.map(rigaData).join("")}</div>` : `<p class="sotto" style="margin:0">Nessuna data nei prossimi tre mesi. Le date si scrivono nella scheda di ogni corso (inizio, fine prevista, esame).</p>`}
        </section>
        <div class="spazio"></div>
        <section class="pannello"><h3>Ultime sessioni di studio</h3>
          ${ultime.length ? `<div class="elenco-breve">${ultime.map((s) => `<button class="cosa" data-azione="modifica-sessione" data-id="${s.id}">${boxGiorno(s.data)}<div><strong>${esc(s.cosa || corsoDi(s.corso_id)?.titolo || nomeComp(s.competenza_id) || "Studio")}</strong><small>${esc([corsoDi(s.corso_id)?.titolo, nomeComp(s.competenza_id)].filter(Boolean).join(" · "))}</small></div><b>${esc(oreMinuti(s.minuti))}</b></button>`).join("")}</div>` : `<p class="sotto" style="margin:0">Ancora nessuna sessione. Premi "+ Ho studiato" in alto quando finisci di studiare.</p>`}
        </section>
      </div>
    </div>`;
}

// ---------------------------------------------------------------- MAPPA DELLE COMPETENZE
function schedaCompetenza(c) {
  const corsi = stato.dati.corsi.filter((x) => x.competenza_id === c.id);
  const materiali = stato.dati.materiali.filter((x) => x.competenza_id === c.id);
  return `<button class="competenza" data-azione="apri-competenza" data-id="${c.id}">
    <div class="testa"><h4>${esc(c.nome)}</h4>${c.nel_cv === "si" ? pillTesto("nel CV", "cielo") : ""}</div>
    ${livelli(c.livello, c.obiettivo)}
    <p class="perche">${esc(c.perche || "Obiettivo: " + etichetta(LIVELLI, c.obiettivo))}</p>
    <div class="numerini"><span><b>${corsi.length}</b> ${corsi.length === 1 ? "corso" : "corsi"}</span><span><b>${materiali.length}</b> materiali</span><span><b>${esc(oreMinuti(minutiComp(c.id)))}</b> di studio</span>${c.stato !== "attiva" ? pill(STATI_COMP, c.stato) : ""}</div>
  </button>`;
}
function vistaCompetenze() {
  const g = stato.filtri.gruppoComp;
  const elenco = stato.dati.competenze.filter((c) => g === "tutte" || c.stato === g);
  const aree = [...new Set(elenco.map((c) => c.area || "Senza area"))].sort((a, b) => {
    const ia = AREE.indexOf(a), ib = AREE.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b);
  });
  const conta = (s) => stato.dati.competenze.filter((c) => s === "tutte" || c.stato === s).length;
  return `${intro("Mappa delle competenze", "Le competenze che vuoi far crescere. I pallini pieni sono il livello di oggi, quelli tratteggiati la strada fino al tuo obiettivo.", `<button class="btn pieno" data-azione="nuova-competenza">+ Competenza</button>`)}
    <div class="schede-tab">${[...STATI_COMP.map(([v, n]) => [v, n]), ["tutte", "Tutte"]].map(([v, n]) => `<button class="btn piccolo ${g === v ? "scelta" : ""}" data-azione="gruppo-comp" data-gruppo="${v}">${esc(n)} (${conta(v)})</button>`).join("")}</div>
    ${elenco.length ? aree.map((a) => `<p class="area-titolo">${esc(a)}</p><div class="mappa">${elenco.filter((c) => (c.area || "Senza area") === a).map(schedaCompetenza).join("")}</div>`).join("")
      : vuoto("Nessuna competenza in questo gruppo", "Aggiungi una competenza che vuoi far crescere: per esempio un linguaggio, uno strumento o una lingua.", `<button class="btn pieno" data-azione="nuova-competenza">+ Competenza</button>`)}`;
}

// ---------------------------------------------------------------- CORSI E CERTIFICAZIONI
function corsiFiltrati() {
  const f = stato.filtri;
  const gruppo = GRUPPI_CORSI.find((x) => x[0] === f.gruppoCorsi)?.[2];
  const testo = f.testoCorsi.trim().toLowerCase();
  return stato.dati.corsi.filter((c) => (!gruppo || gruppo.includes(c.stato))
    && (!f.compCorsi || String(c.competenza_id) === f.compCorsi)
    && (!testo || [c.titolo, c.titolo_en, c.ente, c.note, nomeComp(c.competenza_id)].join(" ").toLowerCase().includes(testo)));
}
function prossimaDataCorso(c) {
  const v = dateCorsi().find((x) => x.c.id === c.id && x.data >= chiaveGiorno()) || dateCorsi().find((x) => x.c.id === c.id);
  if (c.stato === "completato") return `<small>Completato il</small>${esc(dataIt(c.completato_il) || "—")}`;
  return v ? `<small>${esc(v.cosa)}</small>${esc(dataIt(v.data))}` : `<small>Nessuna data</small>`;
}
function prossimoNelPercorso() {
  const dopo = percorso().find((c) => ["idea", "iscritta"].includes(c.stato));
  return dopo ? `<p class="dopo-percorso">Dopo, nel percorso: <button class="link" data-azione="apri-corso" data-id="${dopo.id}">${numeroPercorso(dopo)}. ${esc(dopo.titolo)}</button></p>` : "";
}
function rigaPercorso(c, i, totale) {
  return `<div class="riga percorso ${i === 0 ? "primo" : ""}">
    <span class="numero-percorso">${i + 1}</span>
    <button class="chi" data-azione="apri-corso" data-id="${c.id}"><strong>${esc(c.titolo)}</strong><span>${esc([c.ente, etichetta(TIPI_CORSO, c.tipo), nomeComp(c.competenza_id)].filter(Boolean).join(" · "))}</span></button>
    <div><div class="stati">${pill(STATI_CORSO, c.stato)}</div>${avanzamento(c)}</div>
    <div class="frecce"><button class="btn chiaro piccolo" data-azione="sposta-corso" data-id="${c.id}" data-passo="-1" ${i === 0 ? "disabled" : ""} aria-label="Più su" title="Più su">↑</button><button class="btn chiaro piccolo" data-azione="sposta-corso" data-id="${c.id}" data-passo="1" ${i === totale - 1 ? "disabled" : ""} aria-label="Più giù" title="Più giù">↓</button></div>
  </div>`;
}
function vistaPercorso() {
  const elenco = percorso();
  const testo = stato.filtri.testoCorsi.trim().toLowerCase();
  stato.pag.corsi = paginaValida(elenco.length, stato.pag.corsi);
  const inizio = (stato.pag.corsi - 1) * PER_PAGINA;
  const inCorso = elenco.filter((c) => c.stato === "in_corso").length;
  return `<p class="aiuto">Il numero 1 è il corso su cui lavorare adesso; gli altri aspettano il loro turno. Con le frecce cambi l'ordine. I corsi completati o lasciati escono dal percorso e li trovi nelle altre schede; un corso nuovo si mette in fondo.</p>
    ${inCorso > 1 ? `<p class="attenzione">Hai ${inCorso} corsi "In corso" insieme. Se ti pesa, metti in pausa quelli che non sono il numero 1.</p>` : ""}
    ${testo ? `<p class="conta">La ricerca non si applica al percorso: qui vedi sempre tutti i corsi da fare.</p>` : ""}
    ${elenco.length ? `<div class="righe">${fetta(elenco, stato.pag.corsi).map((c, k) => rigaPercorso(c, inizio + k, elenco.length)).join("")}</div>${paginazione(elenco.length, stato.pag.corsi, "corsi")}`
      : vuoto("Il percorso è vuoto", "Tutti i corsi sono completati o lasciati. Aggiungine uno nuovo quando sei pronta.", `<button class="btn pieno" data-azione="nuovo-corso">+ Corso</button>`)}`;
}
function vistaCorsi() {
  const f = stato.filtri;
  const elenco = corsiFiltrati();
  stato.pag.corsi = paginaValida(elenco.length, stato.pag.corsi);
  const conta = (stati) => stato.dati.corsi.filter((c) => !stati || stati.includes(c.stato)).length;
  return `${intro("Corsi e certificazioni", "Tutti i corsi: quelli da valutare, quelli in corso e quelli finiti, con le date, l'avanzamento e gli attestati.", `<button class="btn pieno" data-azione="nuovo-corso">+ Corso</button>`)}
    <div class="schede-tab">${GRUPPI_CORSI.map(([v, n, s]) => `<button class="btn piccolo ${f.gruppoCorsi === v ? "scelta" : ""}" data-azione="gruppo-corsi" data-gruppo="${v}">${esc(n)} (${conta(s)})</button>`).join("")}</div>
    ${f.gruppoCorsi === "percorso" ? vistaPercorso() : `<div class="filtri">
      ${campo("Cerca", `<input type="search" data-filtro="testoCorsi" value="${esc(f.testoCorsi)}" placeholder="Titolo, ente, note...">`)}
      ${campo("Competenza", `<select data-filtro="compCorsi"><option value="">Tutte</option>${opzioni(stato.dati.competenze.map((c) => [c.id, c.nome]), f.compCorsi)}</select>`)}
      <div class="campo"><span>&nbsp;</span><button class="btn chiaro" data-azione="azzera-corsi">Azzera i filtri</button></div>
    </div>
    <p class="conta">${elenco.length} ${elenco.length === 1 ? "corso" : "corsi"}</p>
    ${elenco.length ? `<div class="righe">${fetta(elenco, stato.pag.corsi).map((c) => `<button class="riga" data-azione="apri-corso" data-id="${c.id}">
        <span class="simbolo">${esc(simbolo(TIPI_CORSO, c.tipo))}</span>
        <div class="chi"><strong>${esc(c.titolo)}</strong><span>${esc([c.ente, etichetta(TIPI_CORSO, c.tipo)].filter(Boolean).join(" · "))}</span></div>
        <div><div class="stati">${pill(STATI_CORSO, c.stato)}${pillNumero(c)}${c.competenza_id ? pillTesto(nomeComp(c.competenza_id)) : ""}</div>${avanzamento(c)}</div>
        <div class="dopo">${prossimaDataCorso(c)}</div>
      </button>`).join("")}</div>${paginazione(elenco.length, stato.pag.corsi, "corsi")}`
      : vuoto("Nessun corso qui", "Cambia gruppo o filtri, oppure aggiungi un corso nuovo.", `<button class="btn pieno" data-azione="nuovo-corso">+ Corso</button>`)}`}`;
}

// ---------------------------------------------------------------- ORE DI STUDIO
function vistaStudio() {
  const d = stato.dati;
  const obiettivo = d.impostazioni.obiettivo_minuti;
  const lun = stato.lunedi, dom = spostaGiorni(6, lun), oggi = chiaveGiorno();
  const giorni = Array.from({ length: 7 }, (_, i) => spostaGiorni(i, lun));
  const perGiorno = giorni.map((k) => minutiTra(k, k));
  const totale = perGiorno.reduce((t, m) => t + m, 0);
  const massimo = Math.max(60, ...perGiorno);
  const settimane = Array.from({ length: 8 }, (_, i) => spostaGiorni(-7 * (7 - i), lunediDi(oggi)));
  const perSett = settimane.map((l) => minutiTra(l, spostaGiorni(6, l)));
  const massimoSett = Math.max(obiettivo, ...perSett);
  const compSess = stato.filtri.compSess;
  const sessioni = d.sessioni.filter((s) => !compSess || String(s.competenza_id) === compSess);
  stato.pag.sessioni = paginaValida(sessioni.length, stato.pag.sessioni);
  const perComp = d.competenze.map((c) => [c, minutiTra(lun, dom, (s) => s.competenza_id === c.id)]).filter(([, m]) => m > 0);
  const senza = minutiTra(lun, dom, (s) => !s.competenza_id);
  return `${intro("Ore di studio", "Il diario dello studio: quanto, quando e su cosa. Il traguardo settimanale si cambia in Impostazioni.", `<button class="btn pieno" data-azione="nuova-sessione">+ Ho studiato</button>`)}
    <div class="navigatore">
      <h2>Settimana dal ${esc(dataIt(lun).slice(0, 5))} al ${esc(dataIt(dom))}<small>${esc(oreMinuti(totale))} su ${esc(oreMinuti(obiettivo))} · ${totale >= obiettivo ? "traguardo raggiunto" : `mancano ${oreMinuti(obiettivo - totale)}`}</small></h2>
      <div class="comandi">
        <button class="btn chiaro piccolo" data-azione="settimana" data-passo="-1">← Settimana prima</button>
        ${lun !== lunediDi(oggi) ? `<button class="btn chiaro piccolo" data-azione="settimana" data-passo="0">Questa settimana</button>` : ""}
        <button class="btn chiaro piccolo" data-azione="settimana" data-passo="1" ${lun >= lunediDi(oggi) ? "disabled" : ""}>Settimana dopo →</button>
      </div>
    </div>
    <div class="due-colonne">
      <section class="pannello"><h3>Giorno per giorno</h3>
        <div class="grafico-barre">${giorni.map((k, i) => `<div class="${k === oggi ? "oggi" : ""}" title="${esc(dataMedia(k))}: ${esc(oreMinuti(perGiorno[i]))}"><span>${perGiorno[i] ? esc(oreMinuti(perGiorno[i])) : ""}</span><i style="height:${Math.round((perGiorno[i] / massimo) * 120)}px"></i><span>${esc(dataMedia(k).split(" ")[0])}</span></div>`).join("")}</div>
      </section>
      <section class="pannello"><h3>Su cosa, questa settimana</h3>
        ${perComp.length || senza ? `<div class="elenco-breve">${perComp.map(([c, m]) => `<div><div style="display:flex;justify-content:space-between;gap:10px"><span>${esc(c.nome)}</span><b>${esc(oreMinuti(m))}</b></div><div class="avanza"><div class="binario"><i style="width:${Math.round((100 * m) / totale)}%"></i></div><span>${Math.round((100 * m) / totale)}%</span></div></div>`).join("")}${senza ? `<div style="display:flex;justify-content:space-between"><span>Senza competenza</span><b>${esc(oreMinuti(senza))}</b></div>` : ""}</div>` : `<p class="sotto" style="margin:0">Nessuna sessione in questa settimana.</p>`}
      </section>
    </div>
    <div class="spazio"></div>
    <section class="pannello"><h3>Ultime 8 settimane</h3><p class="sotto">In verde le settimane in cui hai raggiunto il traguardo.</p>
      <div class="grafico-barre otto">${settimane.map((l, i) => `<div title="Settimana dal ${esc(dataIt(l))}: ${esc(oreMinuti(perSett[i]))}"><span>${perSett[i] ? esc(oreMinuti(perSett[i])) : ""}</span><i class="${perSett[i] >= obiettivo ? "raggiunto" : ""}" style="height:${Math.round((perSett[i] / massimoSett) * 120)}px"></i><span>${esc(dataIt(l).slice(0, 5))}</span></div>`).join("")}</div>
    </section>
    <div class="spazio"></div>
    <div class="intro" style="margin-bottom:12px"><div><h2 style="font-size:26px">Tutte le sessioni</h2></div>
      <label class="campo" style="min-width:240px"><span>Competenza</span><select data-filtro="compSess"><option value="">Tutte</option>${opzioni(d.competenze.map((c) => [c.id, c.nome]), compSess)}</select></label></div>
    ${sessioni.length ? `<div class="righe">${fetta(sessioni, stato.pag.sessioni).map((s) => `<button class="riga sessione" data-azione="modifica-sessione" data-id="${s.id}">
        ${boxGiorno(s.data)}
        <div class="chi"><strong>${esc(s.cosa || "Studio")}</strong><span>${esc([corsoDi(s.corso_id)?.titolo, nomeComp(s.competenza_id)].filter(Boolean).join(" · ") || "—")}</span></div>
        <div class="dopo">${s.lezioni ? `<small>Lezioni completate</small>${s.lezioni}` : s.note ? `<small>Note</small>${esc(s.note.slice(0, 60))}` : ""}</div>
        <span class="minuti">${esc(oreMinuti(s.minuti))}</span>
      </button>`).join("")}</div>${paginazione(sessioni.length, stato.pag.sessioni, "sessioni")}`
      : vuoto("Ancora nessuna sessione", "Quando finisci di studiare premi \"+ Ho studiato\", oppure usa il cronometro.", `<button class="btn pieno" data-azione="nuova-sessione">+ Ho studiato</button>`)}`;
}

// ---------------------------------------------------------------- MATERIALI E APPUNTI
function vistaMateriali() {
  const f = stato.filtri;
  const testo = f.testoMat.trim().toLowerCase();
  const elenco = stato.dati.materiali.filter((m) => (f.gruppoMat === "tutti" || m.stato === f.gruppoMat) && (!f.tipoMat || m.tipo === f.tipoMat)
    && (!testo || [m.titolo, m.autore, m.appunti, nomeComp(m.competenza_id), corsoDi(m.corso_id)?.titolo].join(" ").toLowerCase().includes(testo)));
  stato.pag.materiali = paginaValida(elenco.length, stato.pag.materiali);
  const conta = (s) => stato.dati.materiali.filter((m) => s === "tutti" || m.stato === s).length;
  return `${intro("Materiali e appunti", "Libri, video, siti e documentazione da studiare, con i tuoi appunti. La ricerca guarda anche dentro gli appunti.", `<button class="btn pieno" data-azione="nuovo-materiale">+ Materiale</button>`)}
    <div class="schede-tab">${[...STATI_MAT, ["tutti", "Tutti"]].map(([v, n]) => `<button class="btn piccolo ${f.gruppoMat === v ? "scelta" : ""}" data-azione="gruppo-mat" data-gruppo="${v}">${esc(n)} (${conta(v)})</button>`).join("")}</div>
    <div class="filtri">
      ${campo("Cerca", `<input type="search" data-filtro="testoMat" value="${esc(f.testoMat)}" placeholder="Titolo, autore, parole negli appunti...">`)}
      ${campo("Tipo", `<select data-filtro="tipoMat"><option value="">Tutti</option>${opzioni(TIPI_MAT, f.tipoMat)}</select>`)}
      <div class="campo"><span>&nbsp;</span><button class="btn chiaro" data-azione="azzera-mat">Azzera i filtri</button></div>
    </div>
    ${elenco.length ? `<div class="righe">${fetta(elenco, stato.pag.materiali).map((m) => `<button class="riga" data-azione="apri-materiale" data-id="${m.id}">
        <span class="simbolo">${esc(simbolo(TIPI_MAT, m.tipo))}</span>
        <div class="chi"><strong>${esc(m.titolo)}</strong><span>${esc([m.autore, etichetta(TIPI_MAT, m.tipo)].filter(Boolean).join(" · "))}</span></div>
        <div class="stati">${pill(STATI_MAT, m.stato)}${m.competenza_id ? pillTesto(nomeComp(m.competenza_id)) : ""}</div>
        <div class="dopo">${m.voto ? `<span class="stelle">${"★".repeat(m.voto)}</span>` : ""}${m.appunti ? `<small>${esc(m.appunti.slice(0, 70))}${m.appunti.length > 70 ? "…" : ""}</small>` : ""}</div>
      </button>`).join("")}</div>${paginazione(elenco.length, stato.pag.materiali, "materiali")}`
      : vuoto("Nessun materiale qui", "Aggiungi un libro, un video, un sito o un blocco di appunti tuoi.", `<button class="btn pieno" data-azione="nuovo-materiale">+ Materiale</button>`)}`;
}

// ---------------------------------------------------------------- PER IL CV
function contenutoCV() {
  const d = stato.dati;
  const completati = d.corsi.filter((c) => c.stato === "completato" && c.nel_cv === "si").sort((a, b) => (b.completato_il || "").localeCompare(a.completato_il || ""));
  const inCorso = stato.cv.inCorso ? d.corsi.filter((c) => c.stato === "in_corso" && c.nel_cv === "si") : [];
  const competenze = d.competenze.filter((c) => c.nel_cv === "si" && c.livello >= LIVELLO_MINIMO_CV);
  const fuori = [];
  d.competenze.forEach((c) => {
    if (c.nel_cv !== "si") fuori.push([c.nome, "competenza con \"Nel CV: No\""]);
    else if (c.livello < LIVELLO_MINIMO_CV) fuori.push([c.nome, `competenza a livello "${etichetta(LIVELLI, c.livello)}": entra nel CV da "Base" in su, quando la sai usare`]);
  });
  d.corsi.forEach((c) => {
    if (c.stato === "completato" && c.nel_cv !== "si") fuori.push([c.titolo, "corso completato con \"Nel CV: No\""]);
    if (c.stato === "in_corso" && !stato.cv.inCorso && c.nel_cv === "si") fuori.push([c.titolo, "corso in corso: entra solo se metti la spunta \"Anche i corsi in corso\""]);
  });
  const senzaInglese = [...completati.filter((c) => !c.titolo_en).map((c) => c.titolo), ...inCorso.filter((c) => !c.titolo_en).map((c) => c.titolo), ...competenze.filter((c) => !c.nome_en).map((c) => c.nome)];
  return { completati, inCorso, competenze, fuori, senzaInglese };
}
function testoCV(lingua) {
  const en = lingua === "en";
  const { completati, inCorso, competenze } = contenutoCV();
  const righe = [];
  if (completati.length) {
    righe.push(en ? "TRAINING AND CERTIFICATIONS" : "FORMAZIONE E CERTIFICAZIONI");
    completati.forEach((c) => {
      const tipo = en ? TIPI_CORSO_EN[c.tipo] : etichetta(TIPI_CORSO, c.tipo);
      const dettagli = [tipo, c.codice_attestato && (en ? `credential ID ${c.codice_attestato}` : `codice ${c.codice_attestato}`)].filter(Boolean).join(", ");
      righe.push(`- ${c.completato_il ? `${c.completato_il.slice(0, 4)} · ` : ""}${(en && c.titolo_en) || c.titolo}${c.ente ? `, ${c.ente}` : ""}${dettagli ? ` (${dettagli})` : ""}`);
    });
  }
  if (inCorso.length) {
    if (righe.length) righe.push("");
    righe.push(en ? "COURSES IN PROGRESS" : "CORSI IN CORSO");
    inCorso.forEach((c) => {
      const fine = c.fine_prevista ? (en ? `, expected completion ${meseAnno(c.fine_prevista)}` : `, conclusione prevista ${meseAnno(c.fine_prevista)}`) : "";
      righe.push(`- ${(en && c.titolo_en) || c.titolo}${c.ente ? `, ${c.ente}` : ""} (${en ? "in progress" : "in corso"}${fine})`);
    });
  }
  if (competenze.length) {
    if (righe.length) righe.push("");
    righe.push(en ? "SKILLS" : "COMPETENZE");
    const aree = [...new Set(competenze.map((c) => c.area || ""))];
    aree.forEach((a) => {
      const elenco = competenze.filter((c) => (c.area || "") === a).map((c) => `${(en && c.nome_en) || c.nome} (${en ? LIVELLI_EN[c.livello] : etichetta(LIVELLI, c.livello).toLowerCase()})`).join(", ");
      const nomeArea = en ? (AREE_EN[a] || a) : a;
      righe.push(`- ${nomeArea ? `${nomeArea}: ` : ""}${elenco}`);
    });
  }
  return righe.join("\n");
}
function vistaCV() {
  const { fuori, senzaInglese } = contenutoCV();
  const it = testoCV("it"), en = testoCV("en");
  const nienteAncora = "Ancora niente da mettere nel CV.\n\nCompaiono qui:\n- i corsi completati con \"Nel CV: Sì\";\n- le competenze con \"Nel CV: Sì\" e livello da \"Base\" in su.";
  return `${intro("Per il CV", "L'elenco pronto da copiare nel curriculum, in italiano e in inglese. Ci finisce solo quello che hai davvero completato o che sai usare: niente promesse.", `<a class="btn chiaro" href="../bussola/index.html#documenti">Apri i CV in BussolaLavoro</a><button class="btn chiaro" data-azione="stampa-cv">Stampa o salva in PDF</button>`)}
    <div class="opzioni-cv"><label><input type="checkbox" data-azione="cv-in-corso" ${stato.cv.inCorso ? "checked" : ""}> Anche i corsi in corso (con la scritta "in corso")</label></div>
    ${senzaInglese.length ? `<p class="attenzione">Manca il nome in inglese per: ${esc(senzaInglese.join("; "))}. Nel testo inglese uso il nome italiano: puoi aggiungere quello inglese aprendo la scheda e premendo Modifica.</p>` : ""}
    <div class="due-colonne" style="grid-template-columns:1fr 1fr">
      <section class="pannello"><h3>In italiano</h3><pre class="testo-cv">${esc(it || nienteAncora)}</pre><button class="btn pieno" data-azione="copia-cv" data-lingua="it" ${it ? "" : "disabled"}>Copia il testo</button></section>
      <section class="pannello"><h3>In inglese</h3><pre class="testo-cv">${esc(en || "Nothing to add to the CV yet.")}</pre><button class="btn pieno" data-azione="copia-cv" data-lingua="en" ${en ? "" : "disabled"}>Copia il testo</button></section>
    </div>
    <div class="spazio"></div>
    <section class="pannello"><h3>Cosa resta fuori, e perché</h3><p class="sotto">Per far entrare qualcosa nel CV apri la sua scheda e cambia "Nel CV" oppure il livello.</p>
      ${fuori.length ? `<ul class="fuori-cv">${fuori.map(([nome, perche]) => `<li><b>${esc(nome)}</b><small>${esc(perche)}</small></li>`).join("")}</ul>` : `<p class="sotto" style="margin:0">Niente: tutto quello che hai segnato è nel testo.</p>`}
    </section>`;
}
async function copia(testo) {
  try { await navigator.clipboard.writeText(testo); return true; } catch {
    const area = document.createElement("textarea");
    area.value = testo; document.body.appendChild(area); area.select();
    let ok = false; try { ok = document.execCommand("copy"); } catch { ok = false; }
    area.remove(); return ok;
  }
}
function stampaCV() {
  const box = document.getElementById("stampa");
  box.innerHTML = `<h1>Elena Rossi · Formazione per il CV</h1><h2>In italiano</h2><pre>${esc(testoCV("it") || "Niente da mostrare.")}</pre><h2>In inglese</h2><pre>${esc(testoCV("en") || "Nothing to show.")}</pre>`;
  window.print();
}

// ---------------------------------------------------------------- IMPOSTAZIONI ED ESPORTA
function vistaImpostazioni() {
  const imp = stato.dati.impostazioni;
  return `${intro("Impostazioni", "Il tuo traguardo di studio e quanto prima vuoi essere avvisata delle date dei corsi.")}
    <div class="griglia-imp">
      <section class="pannello"><h3>Traguardo e avvisi</h3>
        <form id="form-impostazioni">
          ${campo("Minuti di studio a settimana", `<input type="number" name="obiettivo_minuti" min="10" max="5000" step="10" value="${imp.obiettivo_minuti}">`, "Per esempio 180 minuti = 3 ore: mezz'ora per 6 giorni. Meglio un traguardo piccolo e costante che uno grande e faticoso.")}
          <div style="height:12px"></div>
          ${campo("Avvisami prima di quanti giorni", `<input type="number" name="giorni_avviso" min="1" max="90" value="${imp.giorni_avviso}">`, "Vale per esami, fine dei corsi e attestati da rinnovare: il numerino giallo accanto a \"Panoramica\".")}
          <div style="height:14px"></div>
          <button class="btn pieno">Salva</button>
        </form>
      </section>
      <section class="pannello"><h3>Attestati e certificati</h3>
        <p class="sotto">Copia i file degli attestati (PDF o immagini) nella cartella <b>documenti\\formazione</b> del sito. Nella scheda del corso, al campo "File dell'attestato", li scegli dall'elenco e poi li apri con un clic.</p>
        <p class="sotto">File trovati adesso nella cartella: <b>${stato.documenti.length}</b></p>
        <button class="btn chiaro" data-azione="carica-documenti">Aggiorna l'elenco dei file</button>
      </section>
    </div>`;
}
function vistaEsporta() {
  const d = stato.dati;
  return `${intro("Esporta e backup", "Scarica i tuoi dati in Excel, oppure fai una copia di sicurezza.")}
    <div class="tre-colonne">
      <section class="pannello"><h3>Tutto in Excel</h3><p class="sotto">Un file con quattro fogli: Competenze, Corsi e certificazioni, Ore di studio, Materiali e appunti.</p><a class="btn pieno" href="${API}/esporta-excel">Scarica il file Excel</a></section>
      <section class="pannello"><h3>Copia di sicurezza di tutto il sito</h3><p class="sotto">Copia l'intero file dei dati (tutte le sezioni) nella cartella backup.</p><button class="btn chiaro" data-azione="backup">Fai la copia ora</button></section>
      <section class="pannello"><h3>File di trasferimento</h3><p class="sotto">Solo i dati della Formazione, in un file che si può reimportare (per esempio su un altro computer).</p>
        <div class="pulsanti-rapidi"><a class="btn chiaro piccolo" href="${API}/esporta-backup">Scarica</a><button class="btn chiaro piccolo" data-azione="ripristina">Ripristina da file...</button></div>
        <small style="color:var(--inchiostro-tenue)">Il ripristino sostituisce tutti i dati della Formazione (prima viene fatta una copia di sicurezza).</small></section>
    </div>
    <div class="spazio"></div>
    <section class="pannello"><h3>Cosa c'è adesso</h3><dl class="dati-scheda" style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr))">
      ${dato("Competenze", d.competenze.length)}${dato("Corsi e certificazioni", d.corsi.length)}${dato("Sessioni di studio", d.sessioni.length)}${dato("Materiali", d.materiali.length)}
    </dl></section>`;
}

// ---------------------------------------------------------------- finestre
function apriFinestra(contenuto, stretta = true) {
  finestra.innerHTML = `<div class="velo"><section class="finestra ${stretta ? "stretta" : ""}" role="dialog" aria-modal="true">${contenuto}</section></div>`;
  finestra.querySelector(".corpo input:not([type=hidden]):not([type=checkbox]), .corpo textarea, .corpo select")?.focus();
}
function chiudiFinestra() { finestra.innerHTML = ""; }
function testaFinestra(sopra, titolo) { return `<header><div><p class="etichetta">${esc(sopra)}</p><h2>${esc(titolo)}</h2></div><button class="chiudi" type="button" data-chiudi aria-label="Chiudi">×</button></header>`; }
function modulo(tipo, id, sopra, titolo, corpo, conElimina = true) {
  return `<form id="modulo" data-tipo="${tipo}" data-id="${id || ""}">${testaFinestra(sopra, titolo)}<div class="corpo"><p class="avviso errore errore-finestra" hidden></p>${corpo}</div>
    <footer>${id && conElimina ? `<button type="button" class="btn pericolo" data-azione="elimina" data-tipo="${tipo}" data-id="${id}" style="margin-right:auto">Elimina</button>` : ""}<button type="button" class="btn chiaro" data-chiudi>Annulla</button><button class="btn pieno">Salva</button></footer></form>`;
}
const sceltaCompetenza = (scelta, nome = "competenza_id") => `<select name="${nome}"><option value="0">Nessuna</option>${opzioni(stato.dati.competenze.map((c) => [c.id, c.nome]), scelta)}</select>`;
function sceltaCorso(scelta) {
  const aperti = stato.dati.corsi.filter((c) => !["completato", "abbandonato"].includes(c.stato));
  const chiusi = stato.dati.corsi.filter((c) => ["completato", "abbandonato"].includes(c.stato));
  return `<select name="corso_id"><option value="0">Nessun corso</option>${aperti.length ? `<optgroup label="Aperti">${opzioni(aperti.map((c) => [c.id, c.titolo]), scelta)}</optgroup>` : ""}${chiusi.length ? `<optgroup label="Finiti o lasciati">${opzioni(chiusi.map((c) => [c.id, c.titolo]), scelta)}</optgroup>` : ""}</select>`;
}

function formCompetenza(c = {}) {
  apriFinestra(modulo("competenza", c.id, "Mappa delle competenze", c.id ? "Modifica competenza" : "Nuova competenza", `
    <div class="griglia due">${campo("Competenza", `<input name="nome" value="${esc(c.nome || "")}" required placeholder="Per esempio: Python">`)}
      ${campo("Nome in inglese (per il CV)", `<input name="nome_en" value="${esc(c.nome_en || "")}" placeholder="Per esempio: Python">`)}</div>
    <div class="griglia due">${campo("Area", `<input name="area" list="lista-aree" value="${esc(c.area || "")}"><datalist id="lista-aree">${[...new Set([...AREE, ...stato.dati.competenze.map((x) => x.area).filter(Boolean)])].map((a) => `<option value="${esc(a)}">`).join("")}</datalist>`, "Scegli dall'elenco o scrivi tu.")}
      ${campo("Stato", `<select name="stato">${opzioni(STATI_COMP, c.stato || "attiva")}</select>`)}</div>
    <div class="griglia tre">${campo("Livello di oggi", `<select name="livello">${opzioni(LIVELLI, c.livello ?? 0)}</select>`)}
      ${campo("Obiettivo", `<select name="obiettivo">${opzioni(LIVELLI.slice(1), c.obiettivo ?? 3)}</select>`)}
      ${campo("Nel CV", `<select name="nel_cv">${opzioni(SI_NO, c.nel_cv || "no")}</select>`, "Entra nel testo per il CV solo da \"Base\" in su.")}</div>
    <p class="aiuto">Come scegliere il livello: <b>Principiante</b> = sto imparando le basi; <b>Base</b> = so fare cose semplici da sola; <b>Intermedio</b> = la uso nel lavoro senza aiuto; <b>Avanzato</b> = risolvo problemi difficili; <b>Esperta</b> = potrei insegnarla.</p>
    ${campo("Perché la voglio imparare", `<textarea name="perche" rows="2">${esc(c.perche || "")}</textarea>`)}
    <div style="height:12px"></div>
    ${campo("Note", `<textarea name="note" rows="2">${esc(c.note || "")}</textarea>`)}`));
}
function apriCompetenza(id) {
  const c = compDi(id);
  if (!c) return;
  const corsi = stato.dati.corsi.filter((x) => x.competenza_id === c.id);
  const materiali = stato.dati.materiali.filter((x) => x.competenza_id === c.id);
  const sessioni = stato.dati.sessioni.filter((x) => x.competenza_id === c.id);
  apriFinestra(`${testaFinestra(c.area || "Competenza", c.nome)}
    <div class="corpo"><div class="dettaglio"><div>
      <div class="blocco"><h4>Livello</h4>${livelli(c.livello, c.obiettivo)}<p style="margin-top:6px;color:var(--inchiostro-tenue)">Obiettivo: ${esc(etichetta(LIVELLI, c.obiettivo))}</p>
        <div class="pulsanti-rapidi"><button class="btn chiaro piccolo" data-azione="livello" data-id="${c.id}" data-passo="-1" ${c.livello <= 0 ? "disabled" : ""}>↓ Un livello giù</button><button class="btn chiaro piccolo" data-azione="livello" data-id="${c.id}" data-passo="1" ${c.livello >= 5 ? "disabled" : ""}>↑ Un livello su</button></div></div>
      ${c.perche ? `<div class="blocco"><h4>Perché</h4><p>${esc(c.perche)}</p></div>` : ""}
      <div class="blocco"><h4>Corsi (${corsi.length})</h4>${corsi.length ? `<ul class="mini-elenco">${corsi.map((x) => `<li><button data-azione="apri-corso" data-id="${x.id}">${esc(x.titolo)}</button>${pill(STATI_CORSO, x.stato)}</li>`).join("")}</ul>` : `<p style="color:var(--inchiostro-tenue)">Nessun corso collegato.</p>`}</div>
      <div class="blocco"><h4>Materiali (${materiali.length})</h4>${materiali.length ? `<ul class="mini-elenco">${materiali.map((x) => `<li><button data-azione="apri-materiale" data-id="${x.id}">${esc(simbolo(TIPI_MAT, x.tipo))} ${esc(x.titolo)}</button>${pill(STATI_MAT, x.stato)}</li>`).join("")}</ul>` : `<p style="color:var(--inchiostro-tenue)">Nessun materiale collegato.</p>`}</div>
      ${c.note ? `<div class="blocco"><h4>Note</h4><p>${esc(c.note)}</p></div>` : ""}
    </div><dl class="dati-scheda">
      ${dato("Stato", pill(STATI_COMP, c.stato))}${dato("Nel CV", c.nel_cv === "si" ? (c.livello >= LIVELLO_MINIMO_CV ? "Sì" : "Sì, quando arrivi a \"Base\"") : "No")}
      ${dato("In inglese", esc(c.nome_en))}${dato("Studio in totale", esc(oreMinuti(minutiComp(c.id))))}
      ${dato("Sessioni di studio", sessioni.length)}${dato("Ultima sessione", sessioni[0] ? esc(dataIt(sessioni[0].data)) : "")}
    </dl></div></div>
    <footer><button type="button" class="btn chiaro" data-azione="nuovo-corso" data-competenza="${c.id}" style="margin-right:auto">+ Corso</button><button type="button" class="btn chiaro" data-azione="nuovo-materiale" data-competenza="${c.id}">+ Materiale</button><button type="button" class="btn chiaro" data-azione="nuova-sessione" data-competenza="${c.id}">+ Ho studiato</button><button type="button" class="btn chiaro" data-azione="modifica-competenza" data-id="${c.id}">Modifica</button><button type="button" class="btn pieno" data-chiudi>Chiudi</button></footer>`, false);
}

function opzioniAttestati(scelto) {
  const nomi = [...new Set([...stato.documenti.map((d) => d.nome), scelto].filter(Boolean))];
  return `<datalist id="lista-attestati">${nomi.map((n) => `<option value="${esc(n)}">`).join("")}</datalist>`;
}
function formCorso(c = {}, competenza = 0) {
  apriFinestra(modulo("corso", c.id, "Corsi e certificazioni", c.id ? "Modifica corso" : "Nuovo corso", `
    <div class="sezione-form"><h4>Il corso</h4>
      <div class="griglia due">${campo("Titolo", `<input name="titolo" value="${esc(c.titolo || "")}" required>`)}${campo("Titolo in inglese (per il CV)", `<input name="titolo_en" value="${esc(c.titolo_en || "")}">`)}</div>
      <div class="griglia tre">${campo("Ente o piattaforma", `<input name="ente" list="lista-enti" value="${esc(c.ente || "")}" placeholder="Per esempio: Coursera"><datalist id="lista-enti">${[...new Set(stato.dati.corsi.map((x) => x.ente).filter(Boolean))].map((e) => `<option value="${esc(e)}">`).join("")}</datalist>`)}
        ${campo("Tipo", `<select name="tipo">${opzioni(TIPI_CORSO, c.tipo || "corso_online")}</select>`)}
        ${campo("Stato", `<select name="stato">${opzioni(STATI_CORSO, c.stato || "idea")}</select>`)}</div>
      <div class="griglia due">${campo("Competenza", sceltaCompetenza(c.competenza_id || competenza))}${campo("Indirizzo del sito del corso", `<input name="link" value="${esc(c.link || "")}" placeholder="https://...">`)}</div>
    </div>
    <div class="sezione-form"><h4>Date</h4>
      <div class="griglia quattro">${campo("Inizio", `<input type="date" name="inizio" value="${esc(c.inizio || "")}">`)}${campo("Fine prevista", `<input type="date" name="fine_prevista" value="${esc(c.fine_prevista || "")}">`)}
        ${campo("Giorno dell'esame", `<input type="date" name="esame_il" value="${esc(c.esame_il || "")}">`)}${campo("Ora dell'esame", `<input type="time" name="esame_ora" value="${esc(c.esame_ora || "")}">`)}</div>
      <small style="color:var(--inchiostro-tenue)">Le date finiscono da sole nell'agenda della pagina iniziale.</small>
    </div>
    <div class="sezione-form"><h4>Avanzamento e costo</h4>
      <div class="griglia quattro">${campo("Lezioni in tutto", `<input type="number" name="lezioni_totali" min="0" value="${c.lezioni_totali || ""}">`, "Se le sai: moduli, capitoli o video.")}
        ${campo("Lezioni fatte", `<input type="number" name="lezioni_fatte" min="0" value="${c.lezioni_fatte || ""}">`)}
        ${campo("Ore previste", `<input name="ore_previste" inputmode="decimal" value="${c.ore_previste ?? ""}">`)}
        ${campo("Costo in euro", `<input name="costo" inputmode="decimal" value="${c.costo ?? ""}" placeholder="0 se gratuito">`)}</div>
    </div>
    <div class="sezione-form"><h4>Fine corso e attestato</h4>
      <div class="griglia tre">${campo("Completato il", `<input type="date" name="completato_il" value="${esc(c.completato_il || "")}">`)}
        ${campo("File dell'attestato", `<input name="attestato" list="lista-attestati" value="${esc(c.attestato || "")}">${opzioniAttestati(c.attestato)}`, "Il file va nella cartella documenti\\formazione.")}
        ${campo("Codice dell'attestato", `<input name="codice_attestato" value="${esc(c.codice_attestato || "")}">`)}</div>
      <div class="griglia tre">${campo("Indirizzo di verifica dell'attestato", `<input name="link_attestato" value="${esc(c.link_attestato || "")}" placeholder="https://...">`)}
        ${campo("L'attestato scade il", `<input type="date" name="attestato_scade" value="${esc(c.attestato_scade || "")}">`, "Solo se va rinnovato.")}
        ${campo("Nel CV", `<select name="nel_cv">${opzioni(SI_NO, c.nel_cv || "si")}</select>`, "Entra nel testo per il CV solo quando è completato.")}</div>
    </div>
    ${campo("Note", `<textarea name="note" rows="3">${esc(c.note || "")}</textarea>`)}`), false);
}
function apriCorso(id) {
  const c = corsoDi(id);
  if (!c) return;
  const sessioni = stato.dati.sessioni.filter((x) => x.corso_id === c.id);
  const materiali = stato.dati.materiali.filter((x) => x.corso_id === c.id);
  const fatto = minutiCorso(c.id);
  const doc = stato.documenti.find((d) => d.nome === c.attestato);
  const attestato = c.attestato ? (doc ? `<a href="${esc(doc.url)}" target="_blank" rel="noopener">${esc(c.attestato)}</a>` : `${esc(c.attestato)}<br><small style="color:var(--terracotta)">Non lo trovo nella cartella documenti\\formazione</small>`) : "";
  const aperto = !["completato", "abbandonato"].includes(c.stato);
  apriFinestra(`${testaFinestra(etichetta(TIPI_CORSO, c.tipo), c.titolo)}
    <div class="corpo"><div class="dettaglio"><div>
      <div class="blocco"><div class="stati" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">${pill(STATI_CORSO, c.stato)}${c.nel_cv === "si" ? pillTesto("nel CV quando è completato", "cielo") : pillTesto("non va nel CV")}</div>${avanzamento(c, true)}</div>
      ${aperto ? `<div class="pulsanti-rapidi"><button class="btn chiaro piccolo" data-azione="nuova-sessione" data-corso="${c.id}">Ho studiato</button><button class="btn chiaro piccolo" data-azione="avvia-cronometro" data-corso="${c.id}">⏱ Avvia cronometro</button>${c.lezioni_totali ? `<button class="btn chiaro piccolo" data-azione="lezione-piu" data-id="${c.id}">+1 lezione fatta</button>` : ""}<button class="btn pieno piccolo" data-azione="completa-corso" data-id="${c.id}">Segna completato</button></div>` : ""}
      ${c.link ? `<div class="blocco"><h4>Sito del corso</h4><p>${linkEsterno(c.link)}</p></div>` : ""}
      ${c.note ? `<div class="blocco"><h4>Note</h4><p>${esc(c.note)}</p></div>` : ""}
      <div class="blocco"><h4>Sessioni di studio (${sessioni.length}, in tutto ${esc(oreMinuti(fatto))})</h4>${sessioni.length ? `<ul class="mini-elenco">${sessioni.slice(0, 8).map((s) => `<li><button data-azione="modifica-sessione" data-id="${s.id}">${esc(dataIt(s.data))} · ${esc(s.cosa || "Studio")}</button><small>${esc(oreMinuti(s.minuti))}</small></li>`).join("")}</ul>${sessioni.length > 8 ? `<p style="color:var(--inchiostro-tenue);font-size:14px;margin-top:6px">Le altre sono in "Ore di studio".</p>` : ""}` : `<p style="color:var(--inchiostro-tenue)">Ancora nessuna sessione.</p>`}</div>
      <div class="blocco"><h4>Materiali (${materiali.length})</h4>${materiali.length ? `<ul class="mini-elenco">${materiali.map((x) => `<li><button data-azione="apri-materiale" data-id="${x.id}">${esc(simbolo(TIPI_MAT, x.tipo))} ${esc(x.titolo)}</button>${pill(STATI_MAT, x.stato)}</li>`).join("")}</ul>` : `<p style="color:var(--inchiostro-tenue)">Nessun materiale collegato.</p>`}</div>
    </div><dl class="dati-scheda">
      ${dato("Nel percorso", numeroPercorso(c) ? `${numeroPercorso(c)}° di ${percorso().length}` : "")}
      ${dato("Ente o piattaforma", esc(c.ente))}
      ${dato("Competenza", c.competenza_id ? `<button class="link" data-azione="apri-competenza" data-id="${c.competenza_id}">${esc(nomeComp(c.competenza_id))}</button>` : "")}
      ${dato("Inizio", esc(dataIt(c.inizio)))}${dato("Fine prevista", esc(dataIt(c.fine_prevista)))}
      ${dato("Esame", c.esame_il ? esc(`${dataIt(c.esame_il)}${c.esame_ora ? ` ore ${c.esame_ora}` : ""}`) : "")}
      ${dato("Completato il", esc(dataIt(c.completato_il)))}
      ${dato("Ore di studio", c.ore_previste ? esc(`${oreMinuti(fatto)} su ${numeroIt(c.ore_previste)} h previste`) : fatto ? esc(oreMinuti(fatto)) : "")}
      ${dato("Costo", c.costo === 0 ? "Gratuito" : esc(euro(c.costo)))}
      ${dato("Attestato", attestato)}${dato("Codice dell'attestato", esc(c.codice_attestato))}
      ${dato("Verifica dell'attestato", linkEsterno(c.link_attestato, "Apri"))}${dato("L'attestato scade il", esc(dataIt(c.attestato_scade)))}
      ${dato("Titolo in inglese", esc(c.titolo_en))}
    </dl></div></div>
    <footer><button type="button" class="btn chiaro" data-azione="nuovo-materiale" data-corso="${c.id}" style="margin-right:auto">+ Materiale</button><button type="button" class="btn chiaro" data-azione="modifica-corso" data-id="${c.id}">Modifica</button><button type="button" class="btn pieno" data-chiudi>Chiudi</button></footer>`, false);
}
function formCompleta(c) {
  const comp = compDi(c.competenza_id);
  apriFinestra(modulo("completa", c.id, c.titolo, "Corso completato", `
    <p class="frase-gentile" style="font-size:17px">Complimenti! Scrivi i dati dell'attestato, se c'è.</p>
    <div class="griglia due">${campo("Completato il", `<input type="date" name="completato_il" value="${esc(chiaveGiorno())}" max="${chiaveGiorno()}" required>`)}
      ${campo("Nel CV", `<select name="nel_cv">${opzioni(SI_NO, c.nel_cv || "si")}</select>`)}</div>
    <div class="griglia due">${campo("File dell'attestato", `<input name="attestato" list="lista-attestati" value="${esc(c.attestato || "")}">${opzioniAttestati(c.attestato)}`, "Copia prima il file nella cartella documenti\\formazione.")}
      ${campo("Codice dell'attestato", `<input name="codice_attestato" value="${esc(c.codice_attestato || "")}">`)}</div>
    <div class="griglia due">${campo("Indirizzo di verifica", `<input name="link_attestato" value="${esc(c.link_attestato || "")}" placeholder="https://...">`)}
      ${campo("L'attestato scade il", `<input type="date" name="attestato_scade" value="${esc(c.attestato_scade || "")}">`, "Solo se va rinnovato.")}</div>
    ${comp ? campo(`Dopo questo corso, il tuo livello in "${comp.nome}"`, `<select name="nuovo_livello"><option value="0">Resta com'è (${esc(etichetta(LIVELLI, comp.livello))})</option>${opzioni(LIVELLI.slice(1).filter(([v]) => v > comp.livello), "")}</select>`, "Sii onesta con te stessa: sale solo se adesso la sai usare meglio.") : ""}`, false));
}

function formSessione(s = {}) {
  apriFinestra(modulo("sessione", s.id, "Ore di studio", s.id ? "Modifica sessione" : "Ho studiato", `
    <div class="griglia due">${campo("Giorno", `<input type="date" name="data" value="${esc(s.data || chiaveGiorno())}" max="${chiaveGiorno()}" required>`)}
      ${campo("Minuti", `<input type="number" name="minuti" min="1" max="1440" value="${esc(s.minuti ?? 30)}" required><div class="chips">${MINUTI_RAPIDI.map((m) => `<button type="button" data-azione="minuti-rapidi" data-minuti="${m}">${esc(oreMinuti(m))}</button>`).join("")}</div>`)}</div>
    <div class="griglia due">${campo("Corso", sceltaCorso(s.corso_id || 0))}${campo("Competenza", sceltaCompetenza(s.competenza_id || 0), "Se scegli un corso, si mette da sola.")}</div>
    ${campo("Cosa ho fatto", `<input name="cosa" value="${esc(s.cosa || "")}" placeholder="Per esempio: lezione 3 sulle liste, esercizi">`)}
    <div style="height:12px"></div>
    <div class="griglia due">${campo("Lezioni completate in questa sessione", `<input type="number" name="lezioni" min="0" max="100" value="${s.lezioni || 0}">`, "Fanno avanzare da sole la barra del corso.")}
      ${campo("Note", `<input name="note" value="${esc(s.note || "")}">`)}</div>`));
}
function formMateriale(m = {}) {
  apriFinestra(modulo("materiale", m.id, "Materiali e appunti", m.id ? "Modifica materiale" : "Nuovo materiale", `
    <div class="griglia due">${campo("Titolo", `<input name="titolo" value="${esc(m.titolo || "")}" required>`)}${campo("Autore o canale", `<input name="autore" value="${esc(m.autore || "")}">`)}</div>
    <div class="griglia tre">${campo("Tipo", `<select name="tipo">${opzioni(TIPI_MAT, m.tipo || "libro")}</select>`)}${campo("Stato", `<select name="stato">${opzioni(STATI_MAT, m.stato || "da_vedere")}</select>`)}${campo("Quanto mi è servito", `<select name="voto">${opzioni(VOTI, m.voto || 0)}</select>`)}</div>
    <div class="griglia tre">${campo("Indirizzo (se è online)", `<input name="link" value="${esc(m.link || "")}" placeholder="https://...">`)}${campo("Competenza", sceltaCompetenza(m.competenza_id || 0))}${campo("Corso", sceltaCorso(m.corso_id || 0))}</div>
    ${campo("Appunti", `<textarea name="appunti" rows="10" placeholder="Le cose importanti da ricordare, con parole tue.">${esc(m.appunti || "")}</textarea>`)}`), false);
}
function apriMateriale(id) {
  const m = materialeDi(id);
  if (!m) return;
  apriFinestra(`${testaFinestra(etichetta(TIPI_MAT, m.tipo), m.titolo)}
    <div class="corpo"><div class="dettaglio"><div>
      <div class="stati" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px">${pill(STATI_MAT, m.stato)}${m.voto ? `<span class="stelle">${"★".repeat(m.voto)}</span>` : ""}</div>
      ${m.stato !== "finito" ? `<div class="pulsanti-rapidi">${m.stato === "da_vedere" ? `<button class="btn chiaro piccolo" data-azione="stato-materiale" data-id="${m.id}" data-stato="in_corso">L'ho iniziato</button>` : ""}<button class="btn chiaro piccolo" data-azione="stato-materiale" data-id="${m.id}" data-stato="finito">L'ho finito</button></div>` : ""}
      <div class="blocco appunti"><h4>Appunti</h4><p>${m.appunti ? esc(m.appunti) : "Ancora nessun appunto: premi Modifica per scriverli."}</p></div>
    </div><dl class="dati-scheda">
      ${dato("Autore o canale", esc(m.autore))}${dato("Indirizzo", linkEsterno(m.link, "Apri"))}
      ${dato("Competenza", m.competenza_id ? `<button class="link" data-azione="apri-competenza" data-id="${m.competenza_id}">${esc(nomeComp(m.competenza_id))}</button>` : "")}
      ${dato("Corso", m.corso_id ? `<button class="link" data-azione="apri-corso" data-id="${m.corso_id}">${esc(corsoDi(m.corso_id)?.titolo || "")}</button>` : "")}
      ${dato("Aggiunto il", esc(dataIt((m.creato || "").slice(0, 10))))}
    </dl></div></div>
    <footer><button type="button" class="btn chiaro" data-azione="modifica-materiale" data-id="${m.id}" style="margin-right:auto">Modifica</button><button type="button" class="btn pieno" data-chiudi>Chiudi</button></footer>`, false);
}

// ---------------------------------------------------------------- cronometro
function avviaCronometro(corsoId) {
  if (stato.cronometro) { avviso("Il cronometro è già acceso: fermalo prima di avviarne un altro.", "errore"); return; }
  stato.cronometro = { inizio: Date.now(), corso_id: Number(corsoId) || 0 };
  scriviCronometro(stato.cronometro);
  chiudiFinestra();
  avviso("Cronometro avviato. Buono studio! Quando hai finito premi \"Ferma e registra\" in alto.");
}
function fermaCronometro() {
  if (!stato.cronometro) return;
  const minuti = Math.max(1, Math.round((Date.now() - stato.cronometro.inizio) / 60000));
  const corso = corsoDi(stato.cronometro.corso_id);
  stato.cronometro = null;
  scriviCronometro(null);
  disegna();
  formSessione({ minuti, corso_id: corso?.id || 0, competenza_id: corso?.competenza_id || 0 });
}
setInterval(() => { const box = app.querySelector(".cronometro .tempo"); if (box) box.textContent = testoCronometro(); }, 20000);
window.addEventListener("storage", (e) => { if (e.key === CHIAVE_CRONOMETRO) { stato.cronometro = leggiCronometro(); disegna(); } });

// ---------------------------------------------------------------- azioni
async function azioneRapida(percorso, metodo, corpo, messaggio) { try { await salva(percorso, metodo, corpo, messaggio); } catch { /* già mostrato */ } }
async function gestisciClic(evento) {
  const chiudi = evento.target.closest("[data-chiudi]");
  if (chiudi) { chiudiFinestra(); return; }
  const vaiA = evento.target.closest("[data-vai]");
  if (vaiA) { chiudiFinestra(); vai(vaiA.dataset.vai); return; }
  const b = evento.target.closest("[data-azione]");
  if (!b || b.disabled) return;
  const id = Number(b.dataset.id) || 0;
  switch (b.dataset.azione) {
    case "chiudi-avviso": stato.avviso = null; disegna(); break;
    case "pagina": stato.pag[b.dataset.chiave] = Number(b.dataset.pagina); disegna(); window.scrollTo(0, 0); break;
    case "settimana": { const p = Number(b.dataset.passo); stato.lunedi = p === 0 ? lunediDi(chiaveGiorno()) : spostaGiorni(7 * p, stato.lunedi); disegna(); break; }
    case "gruppo-comp": stato.filtri.gruppoComp = b.dataset.gruppo; disegna(); break;
    case "gruppo-corsi": stato.filtri.gruppoCorsi = b.dataset.gruppo; stato.pag.corsi = 1; vai("corsi"); break;
    case "gruppo-mat": stato.filtri.gruppoMat = b.dataset.gruppo; stato.pag.materiali = 1; disegna(); break;
    case "azzera-corsi": Object.assign(stato.filtri, { testoCorsi: "", compCorsi: "" }); stato.pag.corsi = 1; disegna(); break;
    case "azzera-mat": Object.assign(stato.filtri, { testoMat: "", tipoMat: "" }); stato.pag.materiali = 1; disegna(); break;
    case "nuova-competenza": formCompetenza(); break;
    case "apri-competenza": apriCompetenza(id); break;
    case "modifica-competenza": formCompetenza(compDi(id)); break;
    case "livello": {
      const c = compDi(id);
      const nuovo = Math.min(5, Math.max(0, c.livello + Number(b.dataset.passo)));
      const cambi = { livello: nuovo };
      if (nuovo >= c.obiettivo && c.stato === "attiva") cambi.stato = "raggiunta";
      if (nuovo < c.obiettivo && c.stato === "raggiunta") cambi.stato = "attiva";
      const frase = cambi.stato === "raggiunta" ? `${c.nome}: obiettivo raggiunto. Brava!` : `${c.nome}: livello ${etichetta(LIVELLI, nuovo)}.`;
      try { await salva(`competenza?id=${id}`, "PATCH", cambi, frase); apriCompetenza(id); } catch { /* già mostrato */ }
      break;
    }
    case "nuovo-corso": formCorso({}, Number(b.dataset.competenza) || 0); break;
    case "apri-corso": apriCorso(id); break;
    case "modifica-corso": formCorso(corsoDi(id)); break;
    case "completa-corso": formCompleta(corsoDi(id)); break;
    case "sposta-corso": {
      const ordine = percorso().map((c) => c.id);
      const i = ordine.indexOf(id), j = i + Number(b.dataset.passo);
      if (i < 0 || j < 0 || j >= ordine.length) break;
      [ordine[i], ordine[j]] = [ordine[j], ordine[i]];
      await azioneRapida("ordina-corsi", "POST", { ordine });
      break;
    }
    case "lezione-piu": {
      const c = corsoDi(id);
      const nuovo = Math.min(c.lezioni_totali || 9999, c.lezioni_fatte + 1);
      const cambi = { lezioni_fatte: nuovo };
      if (["idea", "iscritta", "in_pausa"].includes(c.stato)) cambi.stato = "in_corso";
      if (!c.inizio) cambi.inizio = chiaveGiorno();
      const fine = c.lezioni_totali && nuovo >= c.lezioni_totali;
      try {
        await salva(`corso?id=${id}`, "PATCH", cambi, fine ? "Ultima lezione fatta! Quando vuoi, premi \"Segna completato\"." : `Lezione segnata: ${nuovo} di ${c.lezioni_totali}.`);
        if (finestra.innerHTML) apriCorso(id);
      } catch { /* già mostrato */ }
      break;
    }
    case "nuova-sessione": {
      const corso = corsoDi(b.dataset.corso);
      formSessione({ corso_id: corso?.id || 0, competenza_id: corso?.competenza_id || Number(b.dataset.competenza) || 0 });
      break;
    }
    case "modifica-sessione": formSessione(stato.dati.sessioni.find((s) => s.id === id)); break;
    case "minuti-rapidi": { const box = finestra.querySelector('[name="minuti"]'); if (box) box.value = b.dataset.minuti; break; }
    case "nuovo-materiale": formMateriale({ competenza_id: Number(b.dataset.competenza) || corsoDi(b.dataset.corso)?.competenza_id || 0, corso_id: Number(b.dataset.corso) || 0 }); break;
    case "apri-materiale": apriMateriale(id); break;
    case "modifica-materiale": formMateriale(materialeDi(id)); break;
    case "stato-materiale": try { await salva(`materiale?id=${id}`, "PATCH", { stato: b.dataset.stato }, b.dataset.stato === "finito" ? "Segnato come finito." : "Segnato come iniziato."); apriMateriale(id); } catch { /* già mostrato */ } break;
    case "avvia-cronometro": avviaCronometro(b.dataset.corso); break;
    case "ferma-cronometro": fermaCronometro(); break;
    case "annulla-cronometro": if (window.confirm("Vuoi buttare via questo conteggio senza registrarlo?")) { stato.cronometro = null; scriviCronometro(null); disegna(); } break;
    case "cv-in-corso": stato.cv.inCorso = b.checked; disegna(); break;
    case "copia-cv": { const ok = await copia(testoCV(b.dataset.lingua)); avviso(ok ? "Testo copiato: ora puoi incollarlo nel CV (Ctrl+V)." : "Non riesco a copiare in automatico: seleziona il testo con il mouse e premi Ctrl+C.", ok ? "ok" : "errore"); break; }
    case "stampa-cv": stampaCV(); break;
    case "carica-documenti": await caricaDocumenti(); avviso(`Elenco aggiornato: ${stato.documenti.length} file nella cartella documenti\\formazione.`); break;
    case "backup": try { const r = await fetch("/api/sistema/backup", { method: "POST" }); const d = await r.json(); if (!r.ok) throw new Error(d.errore); avviso(d.messaggio || `Copia di sicurezza fatta: backup\\${d.file}`); } catch (e) { avviso(`Copia non riuscita: ${e.message}`, "errore"); } break;
    case "ripristina": document.getElementById("file-ripristino").click(); break;
    case "elimina": {
      const nomi = { competenza: "questa competenza (corsi, sessioni e materiali collegati restano, senza competenza)", corso: "questo corso (sessioni e materiali collegati restano, senza corso)", sessione: "questa sessione di studio", materiale: "questo materiale con i suoi appunti" };
      if (!window.confirm(`Vuoi eliminare ${nomi[b.dataset.tipo] || "questo elemento"}?`)) break;
      try { await salva(`${b.dataset.tipo}?id=${id}`, "DELETE", null, "Eliminato."); chiudiFinestra(); } catch { /* già mostrato */ }
      break;
    }
    default: break;
  }
}

app.addEventListener("click", gestisciClic);
finestra.addEventListener("click", gestisciClic);

// Filtri: le caselle di ricerca filtrano mentre scrivi, gli elenchi a tendina quando scegli
app.addEventListener("input", (evento) => {
  const el = evento.target;
  if (el.dataset.filtro === "testoCorsi" || el.dataset.filtro === "testoMat") {
    stato.filtri[el.dataset.filtro] = el.value;
    stato.pag[el.dataset.filtro === "testoCorsi" ? "corsi" : "materiali"] = 1;
    disegna();
  }
});
app.addEventListener("change", (evento) => {
  const el = evento.target;
  const pagine = { compCorsi: "corsi", tipoMat: "materiali", compSess: "sessioni" };
  if (pagine[el.dataset.filtro]) { stato.filtri[el.dataset.filtro] = el.value; stato.pag[pagine[el.dataset.filtro]] = 1; disegna(); }
});
// Nella sessione: scegliendo un corso, la competenza si mette da sola
finestra.addEventListener("change", (evento) => {
  const el = evento.target;
  if (el.name === "corso_id") {
    const corso = corsoDi(el.value);
    const comp = el.form?.querySelector('[name="competenza_id"]');
    if (corso && comp && corso.competenza_id) comp.value = String(corso.competenza_id);
  }
});

app.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  const form = evento.target;
  const dati = Object.fromEntries(new FormData(form).entries());
  if (form.id === "form-impostazioni") { try { await salva("impostazioni", "POST", dati, "Impostazioni salvate."); } catch { /* già mostrato */ } }
});

finestra.addEventListener("submit", async (evento) => {
  const form = evento.target.closest("#modulo");
  if (!form) return;
  evento.preventDefault();
  const dati = Object.fromEntries(new FormData(form).entries());
  const id = Number(form.dataset.id) || 0;
  const tipo = form.dataset.tipo;
  try {
    if (tipo === "completa") {
      await salva("completa", "POST", { id, ...dati }, "Corso completato. Se è segnato \"Nel CV: Sì\", lo trovi già in \"Per il CV\".");
    } else if (tipo === "sessione" && !id) {
      await salva("sessione", "POST", dati, `Sessione registrata: ${oreMinuti(Number(dati.minuti))}.`);
    } else {
      await salva(id ? `${tipo}?id=${id}` : tipo, id ? "PATCH" : "POST", dati, id ? "Modifiche salvate." : "Salvato.");
    }
    chiudiFinestra();
  } catch { /* il messaggio è già nella finestra */ }
});

// Esc chiude le schede, ma non i moduli (per non perdere quello che stai scrivendo)
document.addEventListener("keydown", (evento) => { if (evento.key === "Escape" && finestra.innerHTML && !finestra.querySelector("form")) chiudiFinestra(); });

document.getElementById("file-ripristino").addEventListener("change", async (evento) => {
  const file = evento.target.files[0];
  evento.target.value = "";
  if (!file) return;
  try {
    const dati = JSON.parse(await file.text());
    if (dati.formato !== "formazione-1") throw new Error("questo file non è un file di trasferimento della sezione Formazione.");
    if (!window.confirm(`Nel file ci sono ${dati.competenze?.length || 0} competenze, ${dati.corsi?.length || 0} corsi e ${dati.sessioni?.length || 0} sessioni. TUTTI i dati attuali della Formazione verranno sostituiti. Procedo?`)) return;
    const copiaSicurezza = await fetch("/api/sistema/backup", { method: "POST" });
    if (!copiaSicurezza.ok) throw new Error("non riesco a fare prima la copia di sicurezza: ripristino annullato.");
    await salva("ripristina", "POST", { dati }, "Ripristino fatto.");
  } catch (e) {
    avviso(`Ripristino non riuscito: ${e.message}`, "errore");
  }
});

// Link diretti dalla pagina iniziale: #corso-3, #competenza-2, #materiale-5
function apriDaIndirizzo() {
  const m = location.hash.match(/^#(corso|competenza|materiale)-(\d+)$/);
  if (!m) return false;
  const id = Number(m[2]);
  const vista = { corso: "corsi", competenza: "competenze", materiale: "materiali" }[m[1]];
  if (m[1] === "corso") { const c = corsoDi(id); if (c) stato.filtri.gruppoCorsi = (GRUPPI_CORSI.find(([, , s]) => s && s.includes(c.stato)) || ["tutti"])[0]; }
  if (m[1] === "competenza") { const c = compDi(id); if (c) stato.filtri.gruppoComp = c.stato; }
  if (m[1] === "materiale") { const x = materialeDi(id); if (x) stato.filtri.gruppoMat = x.stato; }
  history.replaceState(null, "", `#${stato.vista = vista}`);
  disegna();
  ({ corso: apriCorso, competenza: apriCompetenza, materiale: apriMateriale })[m[1]](id);
  return true;
}
window.addEventListener("hashchange", () => {
  if (apriDaIndirizzo()) return;
  const v = location.hash.slice(1);
  if (v && v !== stato.vista && VISTE.some(([k]) => k === v)) { stato.vista = v; disegna(); }
});
if (/^#(corso|competenza|materiale)-/.test(location.hash)) stato.vista = "panoramica";
if (!VISTE.some(([k]) => k === stato.vista)) stato.vista = "panoramica";

disegna();
Promise.all([caricaDocumenti(), ricarica()]).then(apriDaIndirizzo);
