"use strict";
/* BussolaLavoro: interfaccia della sezione.
   I dati arrivano da /api/bussola/... e restano nel file data/sito.sqlite3 sul computer. */

const API = "/api/bussola";
const PER_PAGINA = 10;

// ---------------------------------------------------------------- liste di valori (uguali a modulo.py)
const STATI = [
  ["da_valutare", "Da valutare", "grigio"], ["da_inviare", "Da inviare", "ambra"], ["da_verificare", "Invio da verificare", "ambra"],
  ["inviata", "Inviata", "cielo"], ["in_esame", "Ricevuta / in esame", "cielo"], ["contatto", "Contatto in corso", "lavanda"],
  ["colloquio", "Colloquio fissato", "salvia"], ["colloquio_svolto", "Colloquio svolto", "salvia"], ["offerta", "Offerta", "salvia"],
  ["respinta", "Respinta", "grigio"], ["nessuna_posizione", "Nessuna posizione aperta", "grigio"], ["nessuna_risposta", "Nessuna risposta", "grigio"],
  ["rinunciata", "Rinunciata", "grigio"], ["esclusa", "Non inviata / esclusa", "grigio"], ["chiusa", "Chiusa", "grigio"],
];
const CHIUSI = ["respinta", "nessuna_posizione", "nessuna_risposta", "rinunciata", "esclusa", "chiusa"];
const TIPOLOGIE = [["candidatura", "Candidatura"], ["spontanea", "Candidatura spontanea"], ["estero", "Candidatura estero"], ["cpi", "Centro per l'impiego"], ["docenza", "Docenza"], ["recruiter", "Recruiter / colloquio"], ["agenzia", "Agenzia"], ["piattaforma", "Piattaforma / audio"], ["altro", "Altro"]];
const CONFERME = [["confermato", "Confermato", "salvia"], ["screenshot", "Confermato da screenshot", "salvia"], ["utente", "Confermato da me", "salvia"], ["risposta", "Risposta ricevuta", "cielo"], ["da_verificare", "Da verificare", "ambra"], ["non_confermato", "Non confermato", "terracotta"], ["pista", "Solo pista", "grigio"]];
const MODALITA = [["remoto", "Da remoto"], ["ibrido", "Ibrido"], ["in_sede", "In sede"], ["da_verificare", "Da verificare"]];
const TIPI_AZIONE = [["colloquio", "Colloquio"], ["scadenza", "Scadenza"], ["sollecito", "Sollecito"], ["promemoria", "Promemoria"]];
const STATI_AZIONE = [["programmata", "Da fare"], ["fatta", "Fatta"], ["annullata", "Annullata"]];
const TIPI_MODELLO = [["cv", "CV"], ["lettera", "Lettera di presentazione"], ["sollecito", "Messaggio di sollecito"], ["messaggio", "Messaggio"]];
const VISTE = [["panoramica", "Panoramica"], ["registro", "Candidature"], ["agenda", "Agenda"], ["archivio", "Archivio"], ["confronto", "Confronto"], ["modelli", "Modelli di testo"], ["documenti", "Documenti"], ["esporta", "Esporta e backup"]];
// Scorciatoie per aggiornare una scheda con un clic
const SCORCIATOIE = [["inviata", "Ho inviato"], ["in_esame", "Hanno ricevuto"], ["contatto", "Mi hanno contattata"], ["colloquio", "Colloquio fissato"], ["colloquio_svolto", "Colloquio fatto"], ["offerta", "Offerta"], ["respinta", "Respinta"], ["nessuna_posizione", "Nessuna posizione aperta"], ["nessuna_risposta", "Nessuna risposta"], ["rinunciata", "Ho rinunciato"]];
const GIORNI_SILENZIO = 30;
const FILTRI_VUOTI = { testo: "", stato: "", tipologia: "", conferma: "", speciale: "", ordine: "invio" };

const stato = {
  dati: { schede: [], azioni: [], diario: [], modelli: [] },
  documenti: [],
  vista: location.hash.slice(1) || "panoramica",
  filtri: { ...FILTRI_VUOTI },
  pagina: 1, paginaArchivio: 1, testoArchivio: "", paginaModelli: 1,
  confronto: ["", "", ""],
  mese: new Date(),
  avviso: null,
  finestra: null,
};

const app = document.getElementById("app");
const finestra = document.getElementById("finestra");

// ---------------------------------------------------------------- piccoli aiuti
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const etichetta = (lista, valore) => (lista.find((x) => x[0] === valore) || [valore, valore || "—"])[1];
const tono = (lista, valore) => (lista.find((x) => x[0] === valore) || [])[2] || "grigio";
const pill = (lista, valore) => `<span class="pill tono-${tono(lista, valore)}"><i></i>${esc(etichetta(lista, valore))}</span>`;
const chiusa = (s) => CHIUSI.includes(s.stato);
const minuscolo = (v) => String(v || "").toLocaleLowerCase("it");

function chiaveGiorno(d = new Date()) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
function spostaGiorni(n, da = new Date()) { const d = new Date(da); d.setDate(d.getDate() + n); return chiaveGiorno(d); }
function dataIt(valore, conOra = false) {
  if (!valore) return "";
  const d = new Date(valore.length <= 10 ? `${valore}T12:00:00` : valore);
  if (Number.isNaN(d.getTime())) return valore;
  return new Intl.DateTimeFormat("it-IT", { day: "2-digit", month: "2-digit", year: "numeric", ...(conOra && valore.length > 10 ? { hour: "2-digit", minute: "2-digit" } : {}) }).format(d);
}
function giornoBreve(valore) {
  const d = new Date(`${valore.slice(0, 10)}T12:00:00`);
  return { n: d.getDate(), mese: new Intl.DateTimeFormat("it-IT", { month: "short" }).format(d) };
}
function dataInvioTesto(s) {
  if (s.data_invio && s.data_invio_nota) return s.data_invio_nota;
  return dataIt(s.data_invio) || s.data_invio_nota || "Data non indicata";
}
function schedaDi(id) { return stato.dati.schede.find((s) => s.id === Number(id)); }
function diarioDi(id) { return stato.dati.diario.filter((d) => d.scheda_id === id).sort((a, b) => (b.data + b.id).localeCompare(a.data + a.id)); }
function azioniDi(id) { return stato.dati.azioni.filter((a) => a.scheda_id === id); }

// Ultima data in cui è successo qualcosa su una scheda (invio, notizia, riscontro)
function ultimaAttivita(s) {
  const date = [s.data_invio, ...diarioDi(s.id).map((d) => d.data)];
  const m = String(s.ultimo_riscontro || "").match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (m) date.push(`${m[3]}-${m[2]}-${m[1]}`);
  return date.filter(Boolean).sort().pop() || "";
}
function silenziosa(s) {
  if (!["inviata", "in_esame", "contatto"].includes(s.stato)) return false;
  const ultima = ultimaAttivita(s);
  return Boolean(ultima) && ultima < spostaGiorni(-GIORNI_SILENZIO) && !(s.prossima_data && s.prossima_data >= chiaveGiorno());
}
function daVerificare(s) { return !chiusa(s) && (s.stato === "da_verificare" || ["da_verificare", "non_confermato"].includes(s.conferma)); }

// ---------------------------------------------------------------- comunicazione con il server
async function chiama(percorso, opzioni = {}) {
  const risposta = await fetch(`${API}/${percorso}`, { headers: { "Content-Type": "application/json" }, ...opzioni });
  const dati = await risposta.json().catch(() => ({}));
  if (!risposta.ok) throw new Error(dati.errore || "Operazione non riuscita.");
  return dati;
}
async function ricarica() {
  try {
    stato.dati = await chiama("dati");
  } catch (e) {
    avviso(`Non riesco a leggere i dati: ${e.message}. Il sito è acceso?`, "errore");
  }
  disegna();
}
async function salva(percorso, metodo, corpo, messaggio) {
  try {
    const r = await chiama(percorso, { method: metodo, body: corpo ? JSON.stringify(corpo) : undefined });
    await ricarica();
    if (messaggio) avviso(messaggio);
    return r;
  } catch (e) {
    avviso(e.message, "errore");
    throw e;
  }
}
function avviso(testo, tipo = "ok") {
  stato.avviso = { testo, tipo };
  disegna();
  if (tipo === "ok") setTimeout(() => { if (stato.avviso?.testo === testo) { stato.avviso = null; disegna(); } }, 4000);
}

// ---------------------------------------------------------------- struttura della pagina
function vai(vista) { stato.vista = vista; history.replaceState(null, "", `#${vista}`); disegna(); window.scrollTo(0, 0); }

function disegna() {
  const attive = stato.dati.schede.filter((s) => !chiusa(s));
  const conteggi = { registro: attive.length, archivio: stato.dati.schede.length - attive.length, agenda: cosaDaFare().filter((c) => c.data <= spostaGiorni(7)).length };
  const ritardi = cosaDaFare().some((c) => c.data < chiaveGiorno()) || colloquiPassati().length > 0;
  app.innerHTML = `
    <aside class="lato">
      <a class="torna" href="../../index.html">← Pagina iniziale</a>
      <div class="marchio"><div class="bussola">✦</div><div><h1>Bussola<br>Lavoro</h1><small>La tua ricerca, in ordine</small></div></div>
      ${VISTE.map(([id, nome]) => `<button class="voce ${stato.vista === id ? "attiva" : ""}" data-vai="${id}"><span>${esc(nome)}</span>${conteggi[id] !== undefined ? `<b class="${id === "agenda" && ritardi ? "allerta" : ""}">${conteggi[id]}</b>` : ""}</button>`).join("")}
      <p class="privato">Versione dimostrativa: le tue prove restano solo in questo browser.</p>
    </aside>
    <section class="principale">
      <header class="barra">
        <span class="titolo-vista">${esc(etichetta(VISTE, stato.vista))}</span>
        <div class="azioni"><button class="btn chiaro" data-azione="nuova-azione">+ Appuntamento</button><button class="btn pieno" data-azione="nuova-scheda">+ Candidatura</button></div>
      </header>
      <div class="contenuto">
        ${stato.avviso ? `<div class="avviso ${stato.avviso.tipo}">${esc(stato.avviso.testo)}<button data-azione="chiudi-avviso">Chiudi</button></div>` : ""}
        ${disegnaVista()}
      </div>
    </section>`;
}
function disegnaVista() {
  switch (stato.vista) {
    case "registro": return vistaRegistro();
    case "agenda": return vistaAgenda();
    case "archivio": return vistaArchivio();
    case "confronto": return vistaConfronto();
    case "modelli": return vistaModelli();
    case "documenti": return vistaDocumenti();
    case "esporta": return vistaEsporta();
    default: return vistaPanoramica();
  }
}
function intro(titolo, testo, bottone = "") { return `<section class="intro"><div><h2>${esc(titolo)}</h2><p>${esc(testo)}</p></div>${bottone}</section>`; }
function paginazione(totale, pagina, azione) {
  const pagine = Math.max(1, Math.ceil(totale / PER_PAGINA));
  if (pagine === 1) return "";
  return `<nav class="pagine"><button class="btn chiaro piccolo" data-azione="${azione}" data-pagina="${pagina - 1}" ${pagina <= 1 ? "disabled" : ""}>← Precedenti</button><span>Pagina ${pagina} di ${pagine}</span><button class="btn chiaro piccolo" data-azione="${azione}" data-pagina="${pagina + 1}" ${pagina >= pagine ? "disabled" : ""}>Successive →</button></nav>`;
}
function vuoto(titolo, testo) { return `<div class="vuoto"><h3>${esc(titolo)}</h3><p>${esc(testo)}</p></div>`; }

// ---------------------------------------------------------------- panoramica
function cosaDaFare() {
  const voci = stato.dati.azioni.filter((a) => a.stato === "programmata" && a.quando).map((a) => {
    const s = schedaDi(a.scheda_id);
    return { data: a.quando.slice(0, 10), ora: a.quando.slice(11, 16), titolo: a.titolo, sotto: s ? `${s.azienda} · ${s.titolo}` : etichetta(TIPI_AZIONE, a.tipo), tipo: a.tipo, azione: a.id, scheda: s?.id };
  });
  stato.dati.schede.filter((s) => !chiusa(s) && s.prossima_data).forEach((s) => {
    if (azioniDi(s.id).some((a) => a.stato === "programmata" && a.quando.slice(0, 10) === s.prossima_data)) return; // già in agenda
    voci.push({ data: s.prossima_data, ora: "", titolo: s.prossima_azione || "Prossima azione", sotto: `${s.azienda} · ${s.titolo}`, tipo: "prossima", scheda: s.id });
  });
  return voci.sort((a, b) => (a.data + a.ora).localeCompare(b.data + b.ora));
}
function colloquiPassati() {
  const adesso = new Date().toISOString().slice(0, 16);
  return stato.dati.azioni.filter((a) => a.tipo === "colloquio" && a.stato === "programmata" && a.quando && a.quando < adesso);
}
function rigaCosa(c) {
  const oggi = chiaveGiorno();
  const g = giornoBreve(c.data);
  const classe = c.data < oggi ? "ritardo" : c.data === oggi ? "oggi" : "";
  const attr = c.azione ? `data-azione="modifica-azione" data-id="${c.azione}"` : `data-azione="apri-scheda" data-id="${c.scheda}"`;
  return `<button class="cosa ${classe}" ${attr}><div class="giorno"><b>${g.n}</b><span>${esc(g.mese)}</span></div><div><strong>${esc(c.titolo)}</strong><small>${esc(c.sotto)}</small></div><span class="pill tono-${classe === "ritardo" ? "terracotta" : classe === "oggi" ? "salvia" : "grigio"}">${classe === "ritardo" ? "In ritardo" : classe === "oggi" ? "Oggi" : c.ora || etichetta([...TIPI_AZIONE, ["prossima", "Da fare"]], c.tipo)}</span></button>`;
}
function vistaPanoramica() {
  const schede = stato.dati.schede;
  const attive = schede.filter((s) => !chiusa(s));
  const oggi = chiaveGiorno();
  const passatiId = new Set(colloquiPassati().map((a) => a.id));
  const prossime = cosaDaFare().filter((c) => c.data <= spostaGiorni(14) && !passatiId.has(c.azione));
  const colloqui = stato.dati.azioni.filter((a) => a.tipo === "colloquio" && a.stato === "programmata" && a.quando.slice(0, 10) >= oggi);
  const verificare = schede.filter(daVerificare);
  const silenzio = attive.filter(silenziosa);
  const passati = colloquiPassati();
  const perStato = STATI.filter(([id]) => !CHIUSI.includes(id)).map(([id]) => [id, attive.filter((s) => s.stato === id).length]).filter(([, n]) => n);
  const daAggiornare = [
    ...passati.map((a) => { const s = schedaDi(a.scheda_id); return `<button class="cosa ritardo" data-azione="notizia" data-id="${a.scheda_id}" data-azione-id="${a.id}"><div class="giorno"><b>${giornoBreve(a.quando).n}</b><span>${esc(giornoBreve(a.quando).mese)}</span></div><div><strong>Com'è andato il colloquio?</strong><small>${esc(s ? `${s.azienda} · ${s.titolo}` : a.titolo)}</small></div><span class="pill tono-terracotta">Aggiorna</span></button>`; }),
  ].join("");
  return `
    ${intro("Ciao Elena", "Qui trovi solo quello che conta oggi: cosa fare, cosa aggiornare e cosa controllare.")}
    <section class="numeri">
      <button class="numero salvia" data-vai="registro"><b>${attive.length}</b><span>candidature in corso</span></button>
      <button class="numero cielo" data-vai="agenda"><b>${colloqui.length}</b><span>colloqui in programma</span></button>
      <button class="numero ambra" data-filtro-speciale="verificare"><b>${verificare.length}</b><span>invii da verificare</span></button>
      <button class="numero terracotta" data-filtro-speciale="silenzio"><b>${silenzio.length}</b><span>senza notizie da più di ${GIORNI_SILENZIO} giorni</span></button>
    </section>
    <section class="due-colonne">
      <article class="pannello">
        <h3>Da fare nelle prossime due settimane</h3>
        <p class="sotto">Appuntamenti, scadenze e prossime azioni con una data. Clicca per aprire.</p>
        <div class="elenco-breve">${prossime.slice(0, 8).map(rigaCosa).join("") || vuoto("Niente in calendario", "Quando fissi un colloquio o una scadenza, comparirà qui.")}</div>
        ${prossime.length > 8 ? `<p><button class="link" data-vai="agenda">Vedi tutte le ${prossime.length} cose in agenda</button></p>` : ""}
      </article>
      <div>
        ${daAggiornare ? `<article class="pannello"><h3>Da aggiornare</h3><p class="sotto">Colloqui già passati senza un esito scritto.</p><div class="elenco-breve">${daAggiornare}</div></article><div class="spazio"></div>` : ""}
        <article class="pannello">
          <h3>Candidature in corso, per stato</h3>
          <p class="sotto">Clicca uno stato per vedere l'elenco.</p>
          <div class="chip-stati">${perStato.map(([id, n]) => `<button class="pill tono-${tono(STATI, id)}" data-filtro-stato="${id}">${esc(etichetta(STATI, id))}: ${n}</button>`).join("") || "Nessuna candidatura in corso."}</div>
        </article>
        <div class="spazio"></div>
        <article class="pannello">
          <h3>Un consiglio pratico</h3>
          <p class="sotto" style="margin:0">${silenzio.length ? `Ci sono ${silenzio.length} candidature senza notizie da più di ${GIORNI_SILENZIO} giorni. Per ognuna puoi mandare un breve sollecito oppure segnarla come "Nessuna risposta": passerà in archivio e il registro resterà più leggero.` : "Quando ricevi una risposta, apri la candidatura e usa \"Aggiungi notizia\": in un clic aggiorni lo stato e la storia resta salvata."}</p>
        </article>
      </div>
    </section>`;
}

// ---------------------------------------------------------------- registro
function schedeFiltrate() {
  const f = stato.filtri;
  const parole = minuscolo(f.testo).split(/\s+/).filter(Boolean);
  let elenco = stato.dati.schede.filter((s) => !chiusa(s)
    && (!f.stato || s.stato === f.stato)
    && (!f.tipologia || s.tipologia === f.tipologia)
    && (!f.conferma || s.conferma === f.conferma)
    && (f.speciale !== "verificare" || daVerificare(s))
    && (f.speciale !== "silenzio" || silenziosa(s))
    && (f.speciale !== "senza_data" || !s.prossima_data)
    && parole.every((p) => minuscolo([s.azienda, s.titolo, s.citta, s.paese, s.canale, s.contatto, s.fatti, s.note, s.stato_dettaglio, s.compenso].join(" ")).includes(p)));
  const ordini = {
    invio: (a, b) => (b.data_invio || "0").localeCompare(a.data_invio || "0") || b.id - a.id,
    aggiornate: (a, b) => (ultimaAttivita(b) || "0").localeCompare(ultimaAttivita(a) || "0"),
    prossima: (a, b) => (a.prossima_data || "9999").localeCompare(b.prossima_data || "9999"),
    azienda: (a, b) => a.azienda.localeCompare(b.azienda, "it"),
  };
  return elenco.sort(ordini[f.ordine] || ordini.invio);
}
function rigaScheda(s) {
  const oggi = chiaveGiorno();
  const ritardo = s.prossima_data && s.prossima_data < oggi;
  const luogo = [s.citta, s.paese].filter(Boolean).join(", ");
  return `<button class="riga" data-azione="apri-scheda" data-id="${s.id}">
    <div class="chi"><strong>${esc(s.azienda || "Azienda da indicare")}</strong><span>${esc(s.titolo || "Ruolo da indicare")}</span><small>${esc(etichetta(TIPOLOGIE, s.tipologia))}${luogo ? ` · ${esc(luogo)}` : ""} · ${esc(dataInvioTesto(s))}</small></div>
    <div class="stati">${pill(STATI, s.stato)}${pill(CONFERME, s.conferma)}</div>
    <div class="dopo"><small>Prossima azione${s.prossima_data ? ` · <span class="${ritardo ? "ritardo" : ""}" style="display:inline">${esc(dataIt(s.prossima_data))}</span>` : ""}</small><span>${esc(s.prossima_azione || "Da decidere")}</span></div>
  </button>`;
}
function selezione(nome, valore, opzioni, attributo = "data-filtro") {
  return `<select ${attributo}="${nome}">${opzioni.map(([k, t]) => `<option value="${esc(k)}" ${k === valore ? "selected" : ""}>${esc(t)}</option>`).join("")}</select>`;
}
function vistaRegistro() {
  const elenco = schedeFiltrate();
  const pagine = Math.max(1, Math.ceil(elenco.length / PER_PAGINA));
  stato.pagina = Math.min(stato.pagina, pagine);
  const visibili = elenco.slice((stato.pagina - 1) * PER_PAGINA, stato.pagina * PER_PAGINA);
  const f = stato.filtri;
  const statiAttivi = STATI.filter(([id]) => !CHIUSI.includes(id));
  return `
    ${intro("Candidature in corso", "Le candidature chiuse (respinte, senza risposta, rinunciate) sono nell'Archivio. Clicca una riga per vedere tutto e aggiornarla.", `<button class="btn pieno" data-azione="nuova-scheda">+ Nuova candidatura</button>`)}
    <section class="filtri">
      <label class="campo"><span>Cerca</span><input data-filtro="testo" value="${esc(f.testo)}" placeholder="Azienda, ruolo, città, nome del contatto…" /></label>
      <label class="campo"><span>Stato</span>${selezione("stato", f.stato, [["", "Tutti"], ...statiAttivi])}</label>
      <label class="campo"><span>Tipologia</span>${selezione("tipologia", f.tipologia, [["", "Tutte"], ...TIPOLOGIE])}</label>
      <label class="campo"><span>Mostra solo</span>${selezione("speciale", f.speciale, [["", "Tutte"], ["verificare", "Da verificare"], ["silenzio", `Senza notizie da ${GIORNI_SILENZIO} giorni`], ["senza_data", "Senza data per la prossima azione"]])}</label>
      <label class="campo"><span>Ordina per</span>${selezione("ordine", f.ordine, [["invio", "Data di invio (recenti prima)"], ["aggiornate", "Ultima notizia"], ["prossima", "Prossima azione"], ["azienda", "Azienda (A-Z)"]])}</label>
      <div class="riga2"><span>${elenco.length} candidature trovate</span><button class="link" data-azione="azzera-filtri">Azzera i filtri</button></div>
    </section>
    <div class="righe">${visibili.map(rigaScheda).join("") || vuoto("Nessuna candidatura trovata", "Prova ad azzerare i filtri, oppure aggiungi una nuova candidatura.")}</div>
    ${paginazione(elenco.length, stato.pagina, "pagina")}`;
}

// ---------------------------------------------------------------- archivio
function vistaArchivio() {
  const parole = minuscolo(stato.testoArchivio).split(/\s+/).filter(Boolean);
  const elenco = stato.dati.schede.filter((s) => chiusa(s) && parole.every((p) => minuscolo(`${s.azienda} ${s.titolo} ${s.esito} ${s.fatti}`).includes(p)))
    .sort((a, b) => (b.data_chiusura || b.aggiornato.slice(0, 10)).localeCompare(a.data_chiusura || a.aggiornato.slice(0, 10)) || b.aggiornato.localeCompare(a.aggiornato));
  const pagine = Math.max(1, Math.ceil(elenco.length / PER_PAGINA));
  stato.paginaArchivio = Math.min(stato.paginaArchivio, pagine);
  const visibili = elenco.slice((stato.paginaArchivio - 1) * PER_PAGINA, stato.paginaArchivio * PER_PAGINA);
  return `
    ${intro("Archivio", "Candidature concluse: respinte, senza risposta, senza posizioni aperte, rinunciate o non inviate. Restano qui per memoria e si possono riaprire cambiando lo stato.")}
    <section class="filtri" style="grid-template-columns:1fr"><label class="campo"><span>Cerca nell'archivio</span><input data-archivio-testo value="${esc(stato.testoArchivio)}" placeholder="Azienda, ruolo, esito…" /></label></section>
    <div class="righe">${visibili.map((s) => `<button class="riga" data-azione="apri-scheda" data-id="${s.id}"><div class="chi"><strong>${esc(s.azienda)}</strong><span>${esc(s.titolo)}</span><small>${esc(dataInvioTesto(s))}</small></div><div class="stati">${pill(STATI, s.stato)}</div><div class="dopo"><small>Esito${s.data_chiusura ? ` · ${esc(dataIt(s.data_chiusura))}` : ""}</small><span>${esc(s.esito || s.fatti || "Non annotato")}</span></div></button>`).join("") || vuoto("L'archivio è vuoto", "Quando una candidatura si chiude, la trovi qui.")}</div>
    ${paginazione(elenco.length, stato.paginaArchivio, "pagina-archivio")}`;
}

// ---------------------------------------------------------------- agenda
function vistaAgenda() {
  const eventi = new Map();
  const aggiungi = (giorno, ev) => { if (!eventi.has(giorno)) eventi.set(giorno, []); eventi.get(giorno).push(ev); };
  stato.dati.azioni.filter((a) => a.quando && a.stato !== "annullata").forEach((a) => aggiungi(a.quando.slice(0, 10), { titolo: a.titolo, tipo: a.tipo, fatta: a.stato === "fatta", attr: `data-azione="modifica-azione" data-id="${a.id}"`, ora: a.quando.slice(11, 16), scheda: schedaDi(a.scheda_id) }));
  stato.dati.schede.filter((s) => !chiusa(s) && s.prossima_data).forEach((s) => {
    if (azioniDi(s.id).some((a) => a.quando.slice(0, 10) === s.prossima_data)) return;
    aggiungi(s.prossima_data, { titolo: s.prossima_azione || "Prossima azione", tipo: "prossima", attr: `data-azione="apri-scheda" data-id="${s.id}"`, ora: "", scheda: s });
  });
  const m = stato.mese;
  const primo = new Date(m.getFullYear(), m.getMonth(), 1);
  const inizio = new Date(m.getFullYear(), m.getMonth(), 1 - ((primo.getDay() + 6) % 7));
  const giorni = Array.from({ length: 42 }, (_, i) => new Date(inizio.getFullYear(), inizio.getMonth(), inizio.getDate() + i));
  const prefisso = chiaveGiorno(primo).slice(0, 7);
  const delMese = [...eventi.entries()].filter(([g]) => g.startsWith(prefisso)).sort(([a], [b]) => a.localeCompare(b));
  const oggi = chiaveGiorno();
  return `
    ${intro("Agenda", "Colloqui, scadenze, solleciti e promemoria. Le prossime azioni con una data compaiono in giallo.", `<button class="btn pieno" data-azione="nuova-azione">+ Appuntamento</button>`)}
    <section class="mese">
      <div class="mese-testa"><button class="btn chiaro piccolo" data-azione="mese" data-delta="-1">← Mese prima</button><h3>${esc(new Intl.DateTimeFormat("it-IT", { month: "long", year: "numeric" }).format(m))}</h3><button class="btn chiaro piccolo" data-azione="mese" data-delta="1">Mese dopo →</button></div>
      <div class="calendario">${["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"].map((g) => `<div class="nome-giorno">${g}</div>`).join("")}
        ${giorni.map((d) => { const k = chiaveGiorno(d); const ev = eventi.get(k) || []; return `<div class="giorno-cal ${d.getMonth() !== m.getMonth() ? "fuori" : ""} ${k === oggi ? "oggi" : ""}"><b>${d.getDate()}</b>${ev.slice(0, 3).map((e) => `<button class="evento ${e.tipo} ${e.fatta ? "fatta" : ""}" ${e.attr} title="${esc(e.titolo)}">${esc(e.ora ? `${e.ora} ` : "")}${esc(e.titolo)}</button>`).join("")}${ev.length > 3 ? `<small>+${ev.length - 3}</small>` : ""}</div>`; }).join("")}
      </div>
    </section>
    <div class="spazio"></div>
    <section class="pannello"><h3>Elenco del mese</h3><p class="sotto">Clicca per aprire o modificare.</p>
      <div class="elenco-breve">${delMese.flatMap(([g, lista]) => lista.map((e) => { const gg = giornoBreve(g); return `<button class="cosa ${g < oggi && !e.fatta ? "ritardo" : g === oggi ? "oggi" : ""}" ${e.attr}><div class="giorno"><b>${gg.n}</b><span>${esc(gg.mese)}</span></div><div><strong>${esc(e.titolo)}</strong><small>${esc(e.scheda ? `${e.scheda.azienda} · ${e.scheda.titolo}` : "Non collegato a una candidatura")}</small></div><span class="pill tono-grigio">${esc(e.fatta ? "Fatto" : e.ora || etichetta([...TIPI_AZIONE, ["prossima", "Da fare"]], e.tipo))}</span></button>`; })).join("") || vuoto("Niente in questo mese", "Usa i pulsanti per spostarti fra i mesi.")}</div>
    </section>`;
}

// ---------------------------------------------------------------- confronto
function vistaConfronto() {
  const attive = stato.dati.schede.filter((s) => !chiusa(s)).sort((a, b) => a.azienda.localeCompare(b.azienda, "it"));
  const opzioni = [["", "— scegli una candidatura —"], ...attive.map((s) => [String(s.id), `${s.azienda} · ${s.titolo}`])];
  const scelte = stato.confronto.map(schedaDi).filter(Boolean);
  const righe = [["Stato", (s) => etichetta(STATI, s.stato)], ["Tipologia", (s) => etichetta(TIPOLOGIE, s.tipologia)], ["Luogo", (s) => [s.citta, s.paese].filter(Boolean).join(", ")], ["Modalità", (s) => etichetta(MODALITA, s.modalita)], ["Compenso", (s) => s.compenso], ["Contratto", (s) => s.contratto], ["Lingue", (s) => s.lingue], ["Data invio", dataInvioTesto], ["Prossima azione", (s) => `${s.prossima_azione}${s.prossima_data ? ` (${dataIt(s.prossima_data)})` : ""}`], ["Fatti verificati", (s) => s.fatti], ["Valutazione personale", (s) => s.valutazione]];
  return `
    ${intro("Confronto", "Metti affiancate fino a tre candidature. Fatti verificati e valutazioni personali restano su righe separate.")}
    <section class="confronto-scelte">${[0, 1, 2].map((i) => `<label class="campo"><span>Candidatura ${i + 1}</span>${selezione(String(i), stato.confronto[i], opzioni, "data-confronto")}</label>`).join("")}</section>
    ${scelte.length ? `<div style="overflow-x:auto"><table class="tabella-confronto"><thead><tr><th></th>${scelte.map((s) => `<th>${esc(s.azienda)}<br><small style="font-family:inherit;font-weight:400">${esc(s.titolo)}</small></th>`).join("")}</tr></thead><tbody>${righe.map(([nome, leggi]) => `<tr><th>${esc(nome)}</th>${scelte.map((s) => `<td>${esc(leggi(s) || "—")}</td>`).join("")}</tr>`).join("")}</tbody></table></div>` : vuoto("Scegli almeno una candidatura", "Usa i tre menu qui sopra.")}`;
}

// ---------------------------------------------------------------- modelli
function vistaModelli() {
  const elenco = stato.dati.modelli;
  const visibili = elenco.slice((stato.paginaModelli - 1) * PER_PAGINA, stato.paginaModelli * PER_PAGINA);
  return `
    ${intro("Modelli di testo", "Testi da riusare: lettere, solleciti, messaggi ai recruiter. Inserisci solo cose vere e verificabili prima di inviarle.", `<button class="btn pieno" data-azione="nuovo-modello">+ Nuovo modello</button>`)}
    <div class="scorciatoie">${TIPI_MODELLO.map(([id, nome]) => `<button class="btn chiaro piccolo" data-azione="nuovo-modello" data-tipo="${id}">Parti da: ${esc(nome)}</button>`).join("")}</div>
    <div class="schede-modelli">${visibili.map((m) => `<article class="pannello modello"><div class="testa"><div><p class="etichetta">${esc(etichetta(TIPI_MODELLO, m.tipo))} · ${esc(m.lingua)}</p><h3>${esc(m.titolo || "Senza titolo")}</h3></div></div><pre>${esc(m.testo)}</pre><div class="bottoni"><button class="btn pieno piccolo" data-azione="copia-modello" data-id="${m.id}">Copia il testo</button><button class="btn chiaro piccolo" data-azione="modifica-modello" data-id="${m.id}">Modifica</button></div></article>`).join("") || vuoto("Nessun modello salvato", "Crea il primo partendo da una delle strutture qui sopra.")}</div>
    ${paginazione(elenco.length, stato.paginaModelli, "pagina-modelli")}`;
}
function testoBase(tipo) {
  return {
    cv: "[Titolo professionale]\n\nProfilo\n[Solo competenze ed esperienze vere, adattate alla posizione.]\n\nCompetenze utili per questa posizione\n[Elenco mirato]\n\nEsperienze\n[Ruolo, contesto, risultati verificabili]",
    lettera: "Oggetto: candidatura per [posizione]\n\nGentile [Nome / Ufficio del personale],\n\nmi candido per [posizione] perché [motivo concreto].\n\nLe esperienze più vicine a quello che cercate sono [solo fatti verificati].\n\nResto a disposizione per un colloquio.\n\nCordiali saluti,\nElena Rossi",
    sollecito: "Oggetto: candidatura per [posizione] del [data]\n\nGentile [Nome / Ufficio del personale],\n\nil [data] vi ho inviato la mia candidatura per [posizione]. Vi scrivo per sapere se è ancora in valutazione e se vi servono altre informazioni.\n\nGrazie per l'attenzione,\nElena Rossi",
    messaggio: "Buongiorno [Nome],\n\nla contatto a proposito di [opportunità].\n[Messaggio breve, con soli elementi verificati.]\n\nGrazie,\nElena Rossi",
  }[tipo] || "";
}

// ---------------------------------------------------------------- documenti
function vistaDocumenti() {
  const docs = stato.documenti.filter((d) => !d.cartella.startsWith("spese")); // fatture e ricevute stanno in Gestione spese
  return `
    ${intro("Documenti", "CV, lettere e altri file salvati nella cartella \"documenti\" del sito. Per aggiungerne uno, copialo nella cartella documenti (per esempio documenti\\cv) e poi premi \"Aggiorna l'elenco\".", `<button class="btn chiaro" data-azione="carica-documenti">Aggiorna l'elenco</button>`)}
    <div class="documenti">${docs.map((d) => `<div class="documento"><div><strong>${esc(d.nome)}</strong><br><small>${esc(d.cartella ? `cartella ${d.cartella} · ` : "")}modificato il ${esc(dataIt(d.modificato, true))} · ${Math.max(1, Math.round(d.dimensione / 1024))} KB</small></div><a class="btn chiaro piccolo" href="${esc(d.url)}" target="_blank" rel="noopener">Apri</a></div>`).join("") || vuoto("Nessun documento", "Copia i tuoi CV nella cartella documenti\\cv del sito, poi premi \"Aggiorna l'elenco\".")}</div>`;
}
async function caricaDocumenti() {
  try { stato.documenti = (await (await fetch("/api/sistema/documenti")).json()).documenti || []; } catch { stato.documenti = []; }
  disegna();
}

// ---------------------------------------------------------------- esporta
function vistaEsporta() {
  return `
    ${intro("Esporta e backup", "Tutti i modi per portare fuori i dati o metterli al sicuro.")}
    <section class="trasferimenti">
      <article class="pannello"><h3>File Excel</h3><p>Un file con quattro fogli: candidature in corso, archivio, diario delle notizie e agenda. Si apre con Excel.</p><a class="btn pieno" href="${API}/esporta-excel">Scarica il file Excel</a></article>
      <article class="pannello"><h3>Riepilogo da stampare</h3><p>Un elenco ordinato delle candidature in corso. Dalla finestra di stampa puoi anche scegliere "Salva come PDF".</p><button class="btn pieno" data-azione="stampa">Stampa o salva in PDF</button></article>
      <article class="pannello"><h3>Copia di sicurezza</h3><p>Copia il file dei dati di tutto il sito nella cartella "backup". Fallo ogni tanto, e copia quella cartella su una chiavetta.</p><button class="btn chiaro" data-azione="backup">Fai la copia di sicurezza</button></article>
      <article class="pannello"><h3>Trasferire i dati</h3><p>Il file di trasferimento contiene solo BussolaLavoro. Serve per spostare i dati su un altro computer: lì si usa "Importa", che <b>aggiunge</b> le schede a quelle già presenti.</p><div style="display:flex;gap:10px;flex-wrap:wrap"><a class="btn chiaro" href="${API}/esporta-backup">Scarica file di trasferimento</a><button class="btn chiaro" data-azione="importa">Importa un file</button></div></article>
    </section>`;
}
function stampa() {
  const attive = stato.dati.schede.filter((s) => !chiusa(s)).sort((a, b) => (b.data_invio || "0").localeCompare(a.data_invio || "0"));
  const chiuse = stato.dati.schede.filter(chiusa).length;
  document.getElementById("stampa").innerHTML = `<h1>BussolaLavoro: candidature in corso</h1><p>Elena Rossi · situazione al ${esc(dataIt(chiaveGiorno()))} · ${attive.length} in corso, ${chiuse} in archivio</p>
    <table><thead><tr><th>Invio</th><th>Organizzazione e ruolo</th><th>Stato</th><th>Prossima azione</th></tr></thead><tbody>
    ${attive.map((s) => `<tr><td>${esc(dataInvioTesto(s))}</td><td><b>${esc(s.azienda)}</b><br>${esc(s.titolo)}</td><td>${esc(etichetta(STATI, s.stato))}<br><small>${esc(etichetta(CONFERME, s.conferma))}</small></td><td>${esc(s.prossima_azione)}${s.prossima_data ? `<br><b>${esc(dataIt(s.prossima_data))}</b>` : ""}</td></tr>`).join("")}</tbody></table>`;
  window.print();
}

// ---------------------------------------------------------------- finestre: dettaglio e moduli
function apriFinestra(contenuto, stretta = false) {
  finestra.innerHTML = `<div class="velo"><section class="finestra ${stretta ? "stretta" : ""}" role="dialog" aria-modal="true">${contenuto}</section></div>`;
  finestra.querySelector("input, textarea, select")?.focus();
}
function chiudiFinestra() { finestra.innerHTML = ""; stato.finestra = null; }
function testaFinestra(sopra, titolo) { return `<header><div><p class="etichetta">${esc(sopra)}</p><h2>${esc(titolo)}</h2></div><button class="chiudi" data-chiudi aria-label="Chiudi">×</button></header>`; }

function apriScheda(id) {
  const s = schedaDi(id);
  if (!s) return;
  stato.finestra = { tipo: "scheda", id };
  const diario = diarioDi(s.id);
  const azioni = azioniDi(s.id).sort((a, b) => b.quando.localeCompare(a.quando));
  const luogo = [s.citta, s.paese].filter(Boolean).join(", ");
  const dato = (nome, valore) => valore ? `<div><dt>${esc(nome)}</dt><dd>${valore}</dd></div>` : "";
  apriFinestra(`
    ${testaFinestra(etichetta(TIPOLOGIE, s.tipologia), `${s.azienda} · ${s.titolo}`)}
    <div class="corpo">
      <div class="scorciatoie">${pill(STATI, s.stato)}${pill(CONFERME, s.conferma)}${s.stato_dettaglio && minuscolo(s.stato_dettaglio) !== minuscolo(etichetta(STATI, s.stato)) ? `<span class="pill tono-grigio">${esc(s.stato_dettaglio)}</span>` : ""}</div>
      <div class="dettaglio">
        <div>
          ${s.prossima_azione || s.prossima_data ? `<div class="blocco prossima"><h4>Prossima azione${s.prossima_data ? ` · ${esc(dataIt(s.prossima_data))}` : ""}</h4><p>${esc(s.prossima_azione || "—")}</p></div>` : ""}
          <div class="blocco fatti"><h4>Fatti verificati e ultima notizia</h4><p>${esc(s.fatti || "Nessun fatto annotato.")}</p></div>
          ${s.valutazione ? `<div class="blocco ipotesi"><h4>Ipotesi o valutazione personale</h4><p>${esc(s.valutazione)}</p></div>` : ""}
          ${s.note ? `<div class="blocco"><h4>Note</h4><p>${esc(s.note)}</p></div>` : ""}
          ${chiusa(s) && s.esito ? `<div class="blocco"><h4>Esito</h4><p>${esc(s.esito)}</p></div>` : ""}
          <div class="blocco"><h4>Storia (diario delle notizie)</h4>
            ${diario.length ? `<ul class="diario">${diario.map((d) => `<li><b>${esc(dataIt(d.data))}</b><p>${esc(d.testo)}</p><button data-azione="elimina-diario" data-id="${d.id}">Elimina</button></li>`).join("")}</ul>` : `<p style="color:var(--inchiostro-tenue)">Ancora nessuna notizia aggiunta qui. Usa "Aggiungi notizia".</p>`}
          </div>
          <div class="blocco"><h4>Appuntamenti collegati</h4>
            ${azioni.length ? `<div class="elenco-breve">${azioni.map((a) => `<button class="cosa" data-azione="modifica-azione" data-id="${a.id}"><div class="giorno"><b>${a.quando ? giornoBreve(a.quando).n : "?"}</b><span>${a.quando ? esc(giornoBreve(a.quando).mese) : ""}</span></div><div><strong>${esc(a.titolo)}</strong><small>${esc(etichetta(TIPI_AZIONE, a.tipo))}${a.luogo ? ` · ${esc(a.luogo)}` : ""}</small></div><span class="pill tono-grigio">${esc(etichetta(STATI_AZIONE, a.stato))}</span></button>`).join("")}</div>` : ""}
            <p><button class="link" data-azione="nuova-azione" data-scheda="${s.id}">+ Aggiungi un appuntamento per questa candidatura</button></p>
          </div>
        </div>
        <dl class="dati-scheda">
          ${dato("Data di invio o contatto", esc(dataInvioTesto(s)))}
          ${dato("Canale / riferimento", esc(s.canale))}
          ${dato("Link", s.link ? `<a href="${esc(s.link)}" target="_blank" rel="noopener">${esc(s.link)}</a>` : "")}
          ${dato("Contatto", esc(s.contatto))}
          ${dato("Luogo", esc(luogo))}
          ${dato("Modalità", s.modalita !== "da_verificare" ? esc(etichetta(MODALITA, s.modalita)) : "")}
          ${dato("Compenso", esc(s.compenso))}
          ${dato("Contratto", esc(s.contratto))}
          ${dato("Lingue", esc(s.lingue))}
          ${dato("CV usato", esc(s.cv_usato))}
          ${dato("Ultimo riscontro", esc(s.ultimo_riscontro))}
          ${dato("Chiusa il", esc(dataIt(s.data_chiusura)))}
        </dl>
      </div>
    </div>
    <footer><button class="btn pericolo" data-azione="elimina-scheda" data-id="${s.id}">Elimina</button><button class="btn chiaro" data-azione="modifica-scheda" data-id="${s.id}">Modifica tutti i dati</button><button class="btn pieno" data-azione="notizia" data-id="${s.id}">Aggiungi notizia</button></footer>`);
}

function campo(nome, chiave, valore = "", tipo = "text", aiuto = "", extra = "") {
  return `<label class="campo"><span>${esc(nome)}</span><input name="${chiave}" type="${tipo}" value="${esc(valore)}" ${extra} />${aiuto ? `<small>${esc(aiuto)}</small>` : ""}</label>`;
}
function scelta(nome, chiave, valore, lista) {
  return `<label class="campo"><span>${esc(nome)}</span><select name="${chiave}">${lista.map(([k, t]) => `<option value="${esc(k)}" ${k === valore ? "selected" : ""}>${esc(t)}</option>`).join("")}</select></label>`;
}
function area(nome, chiave, valore = "", aiuto = "", righe = 4) {
  return `<label class="campo"><span>${esc(nome)}</span>${aiuto ? `<small>${esc(aiuto)}</small>` : ""}<textarea name="${chiave}" rows="${righe}">${esc(valore)}</textarea></label>`;
}

function moduloScheda(id) {
  const s = id ? schedaDi(id) : { tipologia: "candidatura", stato: "da_valutare", conferma: "da_verificare", modalita: "da_verificare", data_invio: chiaveGiorno() };
  stato.finestra = { tipo: "modulo-scheda", id };
  const nomiDoc = stato.documenti.map((d) => `<option value="${esc(d.nome)}">`).join("");
  apriFinestra(`
    ${testaFinestra(id ? "Modifica" : "Nuova", id ? `${s.azienda} · ${s.titolo}` : "Nuova candidatura")}
    <form id="modulo" data-tipo="scheda" data-id="${id || ""}" class="corpo">
      <div class="sezione-form"><h4>Chi e cosa</h4>
        <div class="griglia due">${campo("Azienda o ente", "azienda", s.azienda, "text", "", "required")}${campo("Ruolo o attività", "titolo", s.titolo, "text", "", "required")}</div>
        <div class="griglia tre">${scelta("Tipologia", "tipologia", s.tipologia, TIPOLOGIE)}${campo("Persona di contatto", "contatto", s.contatto, "text", "Nome, ruolo, email")}${campo("Canale / riferimento", "canale", s.canale, "text", "Es. LinkedIn, portale, email")}</div>
        <div class="griglia due">${campo("Link all'annuncio", "link", s.link, "url")}${campo("CV usato", "cv_usato", s.cv_usato, "text", "Scegli dall'elenco dei documenti o scrivi il nome", 'list="elenco-doc"')}<datalist id="elenco-doc">${nomiDoc}</datalist></div>
      </div>
      <div class="sezione-form"><h4>Dove e come</h4>
        <div class="griglia tre">${campo("Città", "citta", s.citta)}${campo("Paese", "paese", s.paese)}${scelta("Modalità", "modalita", s.modalita, MODALITA)}</div>
        <div class="griglia tre">${campo("Compenso", "compenso", s.compenso, "text", "Es. 250 €/giorno + IVA")}${campo("Contratto", "contratto", s.contratto, "text", "Es. partita IVA, 12 mesi")}${campo("Lingue richieste", "lingue", s.lingue)}</div>
      </div>
      <div class="sezione-form"><h4>Invio e stato</h4>
        <div class="griglia tre">${campo("Data di invio o contatto", "data_invio", s.data_invio, "date")}${campo("Nota sulla data", "data_invio_nota", s.data_invio_nota, "text", "Se la data non è precisa: es. «Ottobre 2026»")}${scelta("Conferma dell'invio", "conferma", s.conferma, CONFERME)}</div>
        <div class="griglia tre">${scelta("Stato", "stato", s.stato, STATI)}${campo("Dettaglio dello stato", "stato_dettaglio", s.stato_dettaglio, "text", "Facoltativo, con parole tue")}${campo("Ultimo riscontro", "ultimo_riscontro", s.ultimo_riscontro, "text", "Es. 03/11/2026 (email)")}</div>
        <div class="griglia due">${campo("Prossima azione", "prossima_azione", s.prossima_azione)}${campo("Data della prossima azione", "prossima_data", s.prossima_data, "date")}</div>
      </div>
      <div class="sezione-form"><h4>Fatti e valutazioni (restano separati)</h4>
        <div class="separati">${area("Fatti verificati e ultima notizia", "fatti", s.fatti, "Solo cose certe: date, email ricevute, requisiti scritti nell'annuncio.", 6)}${area("Ipotesi o valutazione personale", "valutazione", s.valutazione, "Impressioni, dubbi, probabilità: non verranno mai mostrate come fatti.", 6)}</div>
        ${area("Note", "note", s.note, "", 3)}
      </div>
      <div class="sezione-form"><h4>Chiusura</h4>
        <div class="griglia due">${campo("Esito", "esito", s.esito, "text", "Compila quando la candidatura si chiude")}${campo("Data di chiusura", "data_chiusura", s.data_chiusura, "date")}</div>
      </div>
    </form>
    <footer><button class="btn chiaro" data-chiudi>Annulla</button><button class="btn pieno" type="submit" form="modulo">${id ? "Salva le modifiche" : "Salva la candidatura"}</button></footer>`);
}

function moduloNotizia(id, idAzione = null) {
  const s = schedaDi(id);
  if (!s) return;
  stato.finestra = { tipo: "notizia", id };
  apriFinestra(`
    ${testaFinestra("Aggiungi notizia", `${s.azienda} · ${s.titolo}`)}
    <form id="modulo" data-tipo="notizia" data-id="${id}" data-azione-colloquio="${idAzione || ""}" class="corpo">
      <p style="margin-top:0;color:var(--inchiostro-tenue)">Cos'è successo? Scegli un pulsante (facoltativo) e scrivi due righe: la notizia resta nella storia della candidatura.</p>
      <div class="scorciatoie">${SCORCIATOIE.map(([k, t]) => `<button type="button" class="btn piccolo" data-scorciatoia="${k}">${esc(t)}</button>`).join("")}</div>
      <div class="griglia due">${campo("Data", "data", chiaveGiorno(), "date")}${scelta("Nuovo stato", "stato", "", [["", `Lascia com'è (${etichetta(STATI, s.stato)})`], ...STATI])}</div>
      ${area("Cosa è successo", "testo", "", "Es. «Email da Mario Rossi: mi propongono un colloquio su Teams.»", 4)}
      <div id="campi-colloquio" class="griglia due" hidden>${campo("Quando è il colloquio", "colloquio_quando", "", "datetime-local")}${campo("Dove o come", "colloquio_luogo", "", "text", "Es. Teams, sede di Milano")}</div>
      <div class="griglia due">${campo("Prossima azione", "prossima_azione", s.prossima_azione)}${campo("Data della prossima azione", "prossima_data", s.prossima_data, "date")}</div>
      <label style="display:flex;gap:8px;align-items:center"><input type="checkbox" name="riscontro" /> È una risposta arrivata da loro (aggiorna "Ultimo riscontro")</label>
    </form>
    <footer><button class="btn chiaro" data-chiudi>Annulla</button><button class="btn pieno" type="submit" form="modulo">Salva la notizia</button></footer>`, true);
}

function moduloAzione(id, schedaId = "") {
  const a = id ? stato.dati.azioni.find((x) => x.id === id) : { tipo: "colloquio", stato: "programmata", scheda_id: schedaId ? Number(schedaId) : "", quando: "" };
  stato.finestra = { tipo: "modulo-azione", id };
  const elenco = [["", "Nessuna"], ...stato.dati.schede.slice().sort((x, y) => x.azienda.localeCompare(y.azienda, "it")).map((s) => [String(s.id), `${s.azienda} · ${s.titolo}${chiusa(s) ? " (archivio)" : ""}`])];
  apriFinestra(`
    ${testaFinestra(id ? "Modifica appuntamento" : "Nuovo appuntamento", a.titolo || "Colloquio, scadenza, sollecito o promemoria")}
    <form id="modulo" data-tipo="azione" data-id="${id || ""}" class="corpo">
      <div class="griglia due">${scelta("Tipo", "tipo", a.tipo, TIPI_AZIONE)}${scelta("Stato", "stato", a.stato, STATI_AZIONE)}</div>
      ${campo("Titolo", "titolo", a.titolo, "text", "Es. Colloquio su Teams con la responsabile", "required")}
      <div class="griglia due">${campo("Quando", "quando", a.quando, "datetime-local")}${scelta("Candidatura collegata", "scheda_id", String(a.scheda_id ?? ""), elenco)}</div>
      ${campo("Dove o come", "luogo", a.luogo)}
      ${area("Note", "note", a.note, "Cosa preparare, cosa portare.", 3)}
      ${area("Esito", "esito", a.esito, "Compila dopo: com'è andata.", 3)}
    </form>
    <footer>${id ? `<button class="btn pericolo" data-azione="elimina-azione" data-id="${id}">Elimina</button>` : ""}<button class="btn chiaro" data-chiudi>Annulla</button><button class="btn pieno" type="submit" form="modulo">Salva</button></footer>`, true);
}

function moduloModello(id, tipo = "lettera") {
  const m = id ? stato.dati.modelli.find((x) => x.id === id) : { tipo, lingua: "italiano", filone: "generale", testo: testoBase(tipo) };
  apriFinestra(`
    ${testaFinestra(id ? "Modifica modello" : "Nuovo modello", m.titolo || etichetta(TIPI_MODELLO, m.tipo))}
    <form id="modulo" data-tipo="modello" data-id="${id || ""}" class="corpo">
      <div class="griglia tre">${campo("Titolo", "titolo", m.titolo, "text", "", "required")}${scelta("Tipo", "tipo", m.tipo, TIPI_MODELLO)}${campo("Lingua", "lingua", m.lingua)}</div>
      ${area("Testo", "testo", m.testo, "Le parti tra parentesi quadre sono da sostituire ogni volta.", 14)}
      ${area("Note d'uso", "note", m.note, "", 2)}
    </form>
    <footer>${id ? `<button class="btn pericolo" data-azione="elimina-modello" data-id="${id}">Elimina</button>` : ""}<button class="btn chiaro" data-chiudi>Annulla</button><button class="btn pieno" type="submit" form="modulo">Salva</button></footer>`);
}

// ---------------------------------------------------------------- salvataggi dai moduli
finestra.addEventListener("submit", async (evento) => {
  const form = evento.target.closest("#modulo");
  if (!form) return;
  evento.preventDefault();
  const dati = Object.fromEntries(new FormData(form).entries());
  const id = Number(form.dataset.id) || 0;
  const tipo = form.dataset.tipo;
  try {
    if (tipo === "notizia") {
      const corpo = { scheda_id: id, data: dati.data, testo: dati.testo, prossima_azione: dati.prossima_azione, prossima_data: dati.prossima_data };
      if (dati.stato) corpo.stato = dati.stato;
      if (dati.stato === "colloquio" && dati.colloquio_quando && dati.prossima_data === (schedaDi(id)?.prossima_data || "")) {
        corpo.prossima_azione = `Colloquio${dati.colloquio_luogo ? ` (${dati.colloquio_luogo})` : ""}`;
        corpo.prossima_data = dati.colloquio_quando.slice(0, 10);
      }
      if (dati.riscontro) corpo.ultimo_riscontro = dataIt(dati.data);
      if (["inviata", "in_esame", "contatto", "colloquio", "colloquio_svolto", "offerta", "respinta", "nessuna_posizione"].includes(dati.stato) && schedaDi(id)?.conferma === "da_verificare") corpo.conferma = "utente";
      if (dati.stato && CHIUSI.includes(dati.stato) && dati.testo) corpo.esito = dati.testo;
      if (!dati.testo && !dati.stato && dati.prossima_azione === schedaDi(id)?.prossima_azione && dati.prossima_data === schedaDi(id)?.prossima_data) { avviso("Scrivi cosa è successo oppure scegli un nuovo stato.", "errore"); return; }
      await chiama("notizia", { method: "POST", body: JSON.stringify(corpo) });
      if (dati.stato === "colloquio" && dati.colloquio_quando) {
        await chiama("azione", { method: "POST", body: JSON.stringify({ scheda_id: id, tipo: "colloquio", titolo: `Colloquio ${schedaDi(id)?.azienda || ""}`.trim(), quando: dati.colloquio_quando, luogo: dati.colloquio_luogo, stato: "programmata" }) });
      }
      const idColloquio = Number(form.dataset.azioneColloquio);
      if (idColloquio) await chiama(`azione?id=${idColloquio}`, { method: "PATCH", body: JSON.stringify({ stato: "fatta", esito: dati.testo }) });
      await ricarica();
      avviso("Notizia salvata.");
      apriScheda(id);
      return;
    }
    if (tipo === "scheda") {
      if (CHIUSI.includes(dati.stato) && !dati.data_chiusura) dati.data_chiusura = chiaveGiorno();
      const r = await salva(id ? `scheda?id=${id}` : "scheda", id ? "PATCH" : "POST", dati, id ? "Modifiche salvate." : "Candidatura aggiunta.");
      apriScheda(id || r.id);
      return;
    }
    if (tipo === "azione") {
      const ritorno = stato.finestra?.tipo === "modulo-azione" ? dati.scheda_id : "";
      await salva(id ? `azione?id=${id}` : "azione", id ? "PATCH" : "POST", dati, "Appuntamento salvato.");
      if (ritorno) apriScheda(Number(ritorno)); else chiudiFinestra();
      return;
    }
    if (tipo === "modello") {
      await salva(id ? `modello?id=${id}` : "modello", id ? "PATCH" : "POST", dati, "Modello salvato.");
      chiudiFinestra();
    }
  } catch (e) {
    avviso(e.message || "Salvataggio non riuscito.", "errore");
  }
});

async function elimina(percorso, domanda, messaggio) {
  if (!window.confirm(domanda)) return false;
  await salva(percorso, "DELETE", null, messaggio);
  return true;
}

// ---------------------------------------------------------------- clic e scelte
async function gestisciClic(evento) {
  const vista = evento.target.closest("[data-vai]");
  if (vista) { chiudiFinestra(); vai(vista.dataset.vai); return; }
  const fStato = evento.target.closest("[data-filtro-stato]");
  if (fStato) { stato.filtri = { ...FILTRI_VUOTI, stato: fStato.dataset.filtroStato }; stato.pagina = 1; vai("registro"); return; }
  const fSpec = evento.target.closest("[data-filtro-speciale]");
  if (fSpec) { stato.filtri = { ...FILTRI_VUOTI, speciale: fSpec.dataset.filtroSpeciale }; stato.pagina = 1; vai("registro"); return; }
  if (evento.target.closest("[data-chiudi]")) { chiudiFinestra(); return; }
  const sc = evento.target.closest("[data-scorciatoia]");
  if (sc) {
    const form = document.getElementById("modulo");
    form.stato.value = sc.dataset.scorciatoia;
    form.querySelectorAll("[data-scorciatoia]").forEach((b) => b.classList.toggle("scelta", b === sc));
    document.getElementById("campi-colloquio").hidden = sc.dataset.scorciatoia !== "colloquio";
    return;
  }
  const bottone = evento.target.closest("[data-azione]");
  if (!bottone) return;
  const id = Number(bottone.dataset.id) || 0;
  switch (bottone.dataset.azione) {
    case "chiudi-avviso": stato.avviso = null; disegna(); break;
    case "nuova-scheda": moduloScheda(0); break;
    case "apri-scheda": apriScheda(id); break;
    case "modifica-scheda": moduloScheda(id); break;
    case "notizia": moduloNotizia(id, Number(bottone.dataset.azioneId) || null); break;
    case "elimina-scheda": if (await elimina(`scheda?id=${id}`, "Vuoi eliminare questa candidatura con la sua storia e i suoi appuntamenti? Non si può annullare. (Se è solo conclusa, meglio cambiare lo stato: andrà in archivio.)", "Candidatura eliminata.")) chiudiFinestra(); break;
    case "elimina-diario": { const sid = stato.finestra?.id; if (await elimina(`diario?id=${id}`, "Eliminare questa notizia?", "Notizia eliminata.")) apriScheda(sid); break; }
    case "nuova-azione": moduloAzione(0, bottone.dataset.scheda || ""); break;
    case "modifica-azione": moduloAzione(id); break;
    case "elimina-azione": if (await elimina(`azione?id=${id}`, "Eliminare questo appuntamento?", "Appuntamento eliminato.")) chiudiFinestra(); break;
    case "nuovo-modello": moduloModello(0, bottone.dataset.tipo || "lettera"); break;
    case "modifica-modello": moduloModello(id); break;
    case "elimina-modello": if (await elimina(`modello?id=${id}`, "Eliminare questo modello?", "Modello eliminato.")) chiudiFinestra(); break;
    case "copia-modello": { const m = stato.dati.modelli.find((x) => x.id === id); try { await navigator.clipboard.writeText(m.testo); avviso("Testo copiato: ora puoi incollarlo dove ti serve (Ctrl+V)."); } catch { avviso("Non riesco a copiare in automatico: apri il modello e copia il testo a mano.", "errore"); } break; }
    case "azzera-filtri": stato.filtri = { ...FILTRI_VUOTI }; stato.pagina = 1; disegna(); break;
    case "pagina": stato.pagina = Number(bottone.dataset.pagina); disegna(); window.scrollTo(0, 0); break;
    case "pagina-archivio": stato.paginaArchivio = Number(bottone.dataset.pagina); disegna(); window.scrollTo(0, 0); break;
    case "pagina-modelli": stato.paginaModelli = Number(bottone.dataset.pagina); disegna(); break;
    case "mese": stato.mese = new Date(stato.mese.getFullYear(), stato.mese.getMonth() + Number(bottone.dataset.delta), 1); disegna(); break;
    case "carica-documenti": await caricaDocumenti(); avviso(`Elenco aggiornato: ${stato.documenti.length} documenti.`); break;
    case "stampa": stampa(); break;
    case "importa": document.getElementById("file-import").click(); break;
    case "backup": try { const r = await fetch("/api/sistema/backup", { method: "POST" }); const d = await r.json(); if (!r.ok) throw new Error(d.errore); avviso(d.messaggio || `Copia di sicurezza fatta: backup\\${d.file}`); } catch (e) { avviso(`Copia non riuscita: ${e.message}`, "errore"); } break;
    default: break;
  }
}
app.addEventListener("click", gestisciClic);
finestra.addEventListener("click", gestisciClic);

app.addEventListener("input", (evento) => {
  const t = evento.target;
  if (t.matches("[data-filtro='testo']") || t.matches("[data-archivio-testo]")) {
    if (t.matches("[data-archivio-testo]")) { stato.testoArchivio = t.value; stato.paginaArchivio = 1; } else { stato.filtri.testo = t.value; stato.pagina = 1; }
    const posizione = t.selectionStart;
    disegna();
    const nuovo = app.querySelector(t.matches("[data-archivio-testo]") ? "[data-archivio-testo]" : "[data-filtro='testo']");
    nuovo.focus();
    nuovo.setSelectionRange(posizione, posizione);
  }
});
app.addEventListener("change", (evento) => {
  const t = evento.target;
  if (t.matches("select[data-filtro]")) { stato.filtri[t.dataset.filtro] = t.value; stato.pagina = 1; disegna(); }
  if (t.matches("[data-confronto]")) { stato.confronto[Number(t.dataset.confronto)] = t.value; disegna(); }
});
finestra.addEventListener("change", (evento) => {
  if (evento.target.name === "stato" && document.getElementById("campi-colloquio")) {
    document.getElementById("campi-colloquio").hidden = evento.target.value !== "colloquio";
  }
});
// Il tasto Esc chiude le schede da leggere, ma non i moduli in cui si sta scrivendo (si perderebbe il lavoro)
document.addEventListener("keydown", (evento) => { if (evento.key === "Escape" && finestra.innerHTML && !finestra.querySelector("form")) chiudiFinestra(); });

document.getElementById("file-import").addEventListener("change", async (evento) => {
  const file = evento.target.files[0];
  evento.target.value = "";
  if (!file) return;
  try {
    const tabelle = JSON.parse(await file.text());
    if (!tabelle.schede?.length && !tabelle.modelli?.length) throw new Error("Nel file non trovo candidature o modelli da importare.");
    if (!window.confirm(`Nel file ci sono ${tabelle.schede?.length || 0} candidature e ${tabelle.modelli?.length || 0} modelli. Verranno AGGIUNTI a quelli che hai già. Procedo?`)) return;
    const r = await salva("importa", "POST", { tabelle });
    avviso(`Importate ${r.importati.schede} candidature, ${r.importati.azioni} appuntamenti, ${r.importati.diario} notizie, ${r.importati.modelli} modelli.`);
  } catch (e) {
    avviso(`Importazione non riuscita: ${e.message}`, "errore");
  }
});

// Link diretti dalla pagina iniziale: #scheda-15 apre la candidatura, #azione-3 l'appuntamento
function apriDaIndirizzo() {
  const m = location.hash.match(/^#(scheda|azione)-(\d+)$/);
  if (!m) return false;
  history.replaceState(null, "", `#${stato.vista = m[1] === "scheda" ? "registro" : "agenda"}`);
  disegna();
  if (m[1] === "scheda") apriScheda(Number(m[2])); else moduloAzione(Number(m[2]));
  return true;
}
window.addEventListener("hashchange", () => {
  if (apriDaIndirizzo()) return;
  const v = location.hash.slice(1);
  if (v && v !== stato.vista) { stato.vista = v; disegna(); }
});
if (/^#(scheda|azione)-/.test(location.hash)) stato.vista = "panoramica";

disegna();
ricarica().then(apriDaIndirizzo);
caricaDocumenti();
