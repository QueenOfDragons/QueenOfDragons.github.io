"use strict";
/* Gestione spese: interfaccia della sezione.
   I dati arrivano da /api/spese/... e restano nel file data/sito.sqlite3 sul computer. */

const API = "/api/spese";
const PER_PAGINA = 10;

// ---------------------------------------------------------------- liste di valori (uguali a modulo.py)
const CASSETTI = [["SRLS", "Società (SRLS)", "cielo"], ["DITTA", "Ditta individuale", "salvia"], ["PERS", "Personali", "lavanda"]];
const STATI_RIGA = [["ok", "OK", "salvia"], ["da_verificare", "Da verificare", "ambra"], ["da_chiarire", "Da chiarire", "terracotta"]];
const FREQUENZE = [["mensile", "Mensile", 1], ["bimestrale", "Ogni 2 mesi", 2], ["trimestrale", "Ogni 3 mesi", 3], ["quadrimestrale", "Ogni 4 mesi", 4], ["semestrale", "Ogni 6 mesi", 6], ["annuale", "Annuale", 12], ["una_tantum", "Una volta sola", 0]];
const STATI_RICORRENTE = [["attivo", "Attivo", "salvia"], ["da_disdire", "Da disdire", "ambra"], ["disdetto", "Disdetto", "grigio"], ["pagato", "Finito / pagato", "grigio"]];
const STATI_INCASSO = [["da_incassare", "Da incassare", "ambra"], ["incassata", "Incassata", "salvia"], ["annullata", "Annullata", "grigio"], ["nota_credito", "Nota di credito", "grigio"]];
const SI_NO = [["si", "Sì"], ["no", "No"]];
const PAGATO = [["si", "Sì"], ["no", "No, da pagare"], ["rateizzata", "Rateizzata (in un piano di rate)"]];
const TIPI_DOCUMENTO = ["Fattura elettronica", "Fattura PDF o carta", "Ricevuta", "Scontrino", "Nota di credito", "F24", "Estratto conto", "Altro"];
const ORIGINI = ["Sito", "XML", "PDF", "Foto", "Chat"];
const VISTE = [["panoramica", "Panoramica"], ["spese", "Spese"], ["importa", "Importa fatture XML"], ["scadenze", "Scadenze e rate"], ["fatture", "Fatture da incassare"], ["riepilogo", "Riepilogo"], ["budget", "Budget"], ["commercialista", "Per il commercialista"], ["esporta", "Esporta e backup"], ["impostazioni", "Impostazioni"], ["storico", "Storico"]];
const MESI = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
const FILTRI_VUOTI = { testo: "", cassetto: "", categoria: "", anno: "", mese: "", pagato: "", stato: "", mezzo: "", speciale: "", ordine: "recenti" };

const oggiData = new Date();
const stato = {
  dati: { spese: [], ricorrenti: [], incassi: [], budget: [], cassetti: [], mezzi: [], categorie: [], quote: [], storico: [], impostazioni: { soglia_budget: 0.8, giorni_avviso: 7 } },
  documenti: [],
  vista: location.hash.slice(1) || "panoramica",
  filtri: { ...FILTRI_VUOTI },
  pagina: 1,
  scad: { gruppo: "in_corso", cassetto: "", testo: "", pagina: 1 },
  fatt: { gruppo: "aperte", pagina: 1 },
  annoRiepilogo: String(oggiData.getFullYear()),
  cassettoRiepilogo: "DITTA",
  meseBudget: `${oggiData.getFullYear()}-${String(oggiData.getMonth() + 1).padStart(2, "0")}`,
  comm: { da: `${oggiData.getFullYear()}-01-01`, a: `${oggiData.getFullYear()}-12-31`, cassetti: ["SRLS", "DITTA"], dati: null, pagina: 1 },
  imp: { paginaCategorie: 1 },
  storico: { testo: "", pagina: 1 },
  importa: { documenti: [], errori: [], gruppo: "nuove", pagina: 1, lettura: "" },
  avviso: null,
};

const app = document.getElementById("app");
const finestra = document.getElementById("finestra");

// ---------------------------------------------------------------- piccoli aiuti
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const etichetta = (lista, valore) => (lista.find((x) => x[0] === valore) || [valore, valore || "—"])[1];
const tono = (lista, valore) => (lista.find((x) => x[0] === valore) || [])[2] || "grigio";
const pill = (lista, valore) => `<span class="pill tono-${tono(lista, valore)}"><i></i>${esc(etichetta(lista, valore))}</span>`;
const pillTesto = (testo, colore = "grigio") => `<span class="pill tono-${colore}">${esc(testo)}</span>`;
const minuscolo = (v) => String(v || "").toLocaleLowerCase("it");
const formatoEuro = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", useGrouping: "always" });
const euro = (v) => (v === null || v === undefined || v === "" ? "—" : formatoEuro.format(Number(v)));
const somma = (lista, campo = "totale") => Math.round(lista.reduce((t, x) => t + (Number(x[campo]) || 0), 0) * 100) / 100;

function chiaveGiorno(d = new Date()) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
function spostaGiorni(n, da = new Date()) { const d = new Date(da); d.setDate(d.getDate() + n); return chiaveGiorno(d); }
function dataIt(valore) {
  if (!valore) return "";
  const d = new Date(`${valore.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return valore;
  return new Intl.DateTimeFormat("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" }).format(d);
}
function giornoBreve(valore) {
  if (!valore) return { n: "?", mese: "" };
  const d = new Date(`${valore.slice(0, 10)}T12:00:00`);
  return { n: d.getDate(), mese: new Intl.DateTimeFormat("it-IT", { month: "short" }).format(d) + (d.getFullYear() !== oggiData.getFullYear() ? ` ${String(d.getFullYear()).slice(2)}` : "") };
}
function giorniMancanti(valore) {
  const a = new Date(`${chiaveGiorno()}T12:00:00`), b = new Date(`${valore}T12:00:00`);
  return Math.round((b - a) / 86400000);
}
function quandoTesto(valore) {
  const g = giorniMancanti(valore);
  if (g < 0) return [`In ritardo di ${-g} ${-g === 1 ? "giorno" : "giorni"}`, "terracotta"];
  if (g === 0) return ["Oggi", "terracotta"];
  if (g === 1) return ["Domani", "ambra"];
  return [`Tra ${g} giorni`, g <= stato.dati.impostazioni.giorni_avviso ? "ambra" : "grigio"];
}
function boxGiorno(valore) { const g = giornoBreve(valore); return `<div class="giorno"><b>${g.n}</b><span>${esc(g.mese)}</span></div>`; }
function mezzoCassetto(nome) { return (stato.dati.mezzi.find((m) => m.nome === nome) || {}).cassetto || ""; }
function altroCassetto(s) { const c = mezzoCassetto(s.mezzo); return c && c !== s.cassetto ? c : ""; }
function daControllare(s) { return s.stato !== "ok"; }
function aggiungiMesi(valore, mesi, giornoFisso) {
  const d = new Date(`${valore}T12:00:00`);
  const totale = d.getMonth() + mesi;
  const anno = d.getFullYear() + Math.floor(totale / 12), mese = ((totale % 12) + 12) % 12;
  const ultimo = new Date(anno, mese + 1, 0).getDate();
  return chiaveGiorno(new Date(anno, mese, Math.min(giornoFisso || d.getDate(), ultimo), 12));
}
// Stessa regola di modulo.py: la scadenza dopo quella indicata (vuoto se era l'ultima)
function scadenzaDopo(r, valore) {
  const mesi = (FREQUENZE.find((f) => f[0] === r.frequenza) || [])[2] || 0;
  if (!mesi || !valore) return "";
  const dopo = aggiungiMesi(valore, mesi, Number(r.giorno) || 0);
  return r.ultima_scadenza && dopo > r.ultima_scadenza ? "" : dopo;
}
function prossimeDate(r, quante) {
  const date = [];
  let d = r.prossima_scadenza;
  while (d && date.length < quante) { date.push(d); d = scadenzaDopo(r, d); }
  return date;
}
function contaRate(r) {
  if (!r.prossima_scadenza || !r.ultima_scadenza) return 0;
  let n = 0, d = r.prossima_scadenza;
  while (d && n < 500) { n += 1; d = scadenzaDopo(r, d); }
  return n;
}
const spesaDi = (id) => stato.dati.spese.find((s) => s.id === Number(id));
const ricorrenteDi = (id) => stato.dati.ricorrenti.find((r) => r.id === Number(id));
const incassoDi = (id) => stato.dati.incassi.find((f) => f.id === Number(id));
const inCorso = (r) => ["attivo", "da_disdire"].includes(r.stato);
const nomiCategorie = (valePer = "") => stato.dati.categorie.filter((c) => c.attiva === "si" && (!valePer || c.vale_per === valePer)).map((c) => c.nome);
const nomiMezzi = () => stato.dati.mezzi.filter((m) => m.attivo === "si").map((m) => m.nome);
const anniPresenti = () => [...new Set([String(oggiData.getFullYear()), ...stato.dati.spese.map((s) => s.data_documento.slice(0, 4)).filter(Boolean)])].sort().reverse();

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
async function caricaDocumenti() {
  try { stato.documenti = (await (await fetch("/api/sistema/documenti")).json()).documenti || []; } catch { stato.documenti = []; }
}
async function salva(percorso, metodo, corpo, messaggio) {
  try {
    const r = await chiama(percorso, { method: metodo, body: corpo ? JSON.stringify(corpo) : undefined });
    await ricarica();
    if (messaggio) avviso(messaggio);
    return r;
  } catch (e) {
    if (finestra.querySelector(".errore-finestra")) avvisoFinestra(e.message); // l'errore si vede dentro la finestra aperta
    else avviso(e.message, "errore");
    throw e;
  }
}
function avviso(testo, tipo = "ok") {
  stato.avviso = { testo, tipo };
  disegna();
  if (tipo === "ok") setTimeout(() => { if (stato.avviso?.testo === testo) { stato.avviso = null; disegna(); } }, 4000);
}
function avvisoFinestra(testo) {
  const box = finestra.querySelector(".errore-finestra");
  if (box) { box.hidden = false; box.textContent = testo; box.scrollIntoView({ block: "nearest" }); }
}

// ---------------------------------------------------------------- struttura della pagina
function vai(vista) { stato.vista = vista; history.replaceState(null, "", `#${vista}`); disegna(); window.scrollTo(0, 0); }

function disegna() {
  const imp = stato.dati.impostazioni;
  const urgenti = daPagare(spostaGiorni(imp.giorni_avviso));
  const conteggi = {
    spese: stato.dati.spese.length,
    scadenze: urgenti.length,
    fatture: stato.dati.incassi.filter((f) => f.stato === "da_incassare").length,
  };
  const ritardo = urgenti.some((v) => v.data < chiaveGiorno());
  app.innerHTML = `
    <aside class="lato">
      <a class="torna" href="../../index.html">← Pagina iniziale</a>
      <div class="marchio"><div class="bussola">€</div><div><h1>Gestione<br>spese</h1><small>Conti in ordine, senza ansia</small></div></div>
      ${VISTE.map(([id, nome]) => `<button class="voce ${stato.vista === id ? "attiva" : ""}" data-vai="${id}"><span>${esc(nome)}</span>${conteggi[id] !== undefined ? `<b class="${id === "scadenze" && ritardo ? "allerta" : ""}">${conteggi[id]}</b>` : ""}</button>`).join("")}
      <p class="privato">Versione dimostrativa: le tue prove restano solo in questo browser.</p>
    </aside>
    <section class="principale">
      <header class="barra">
        <span class="titolo-vista">${esc(etichetta(VISTE, stato.vista))}</span>
        <div class="azioni"><button class="btn chiaro" data-azione="nuova-ricorrente">+ Scadenza o rata</button><button class="btn pieno" data-azione="nuova-spesa">+ Spesa</button></div>
      </header>
      <div class="contenuto">
        ${stato.avviso ? `<div class="avviso ${stato.avviso.tipo}">${esc(stato.avviso.testo)}<button data-azione="chiudi-avviso">Chiudi</button></div>` : ""}
        ${disegnaVista()}
      </div>
    </section>`;
}
function disegnaVista() {
  switch (stato.vista) {
    case "spese": return vistaSpese();
    case "scadenze": return vistaScadenze();
    case "fatture": return vistaFatture();
    case "riepilogo": return vistaRiepilogo();
    case "budget": return vistaBudget();
    case "commercialista": return vistaCommercialista();
    case "esporta": return vistaEsporta();
    case "impostazioni": return vistaImpostazioni();
    case "storico": return vistaStorico();
    case "importa": return vistaImporta();
    default: return vistaPanoramica();
  }
}
function intro(titolo, testo, bottone = "") { return `<section class="intro"><div><h2>${esc(titolo)}</h2><p>${esc(testo)}</p></div>${bottone}</section>`; }
function paginazione(totale, pagina, azione) {
  const pagine = Math.max(1, Math.ceil(totale / PER_PAGINA));
  if (pagine === 1) return "";
  return `<nav class="pagine"><button class="btn chiaro piccolo" data-azione="${azione}" data-pagina="${pagina - 1}" ${pagina <= 1 ? "disabled" : ""}>← Precedenti</button><span>Pagina ${pagina} di ${pagine}</span><button class="btn chiaro piccolo" data-azione="${azione}" data-pagina="${pagina + 1}" ${pagina >= pagine ? "disabled" : ""}>Successive →</button></nav>`;
}
const fetta = (lista, pagina) => lista.slice((pagina - 1) * PER_PAGINA, pagina * PER_PAGINA);
function paginaValida(lista, pagina) { return Math.min(Math.max(1, pagina), Math.max(1, Math.ceil(lista.length / PER_PAGINA))); }
function vuoto(titolo, testo, bottone = "") { return `<div class="vuoto"><h3>${esc(titolo)}</h3><p>${esc(testo)}</p>${bottone}</div>`; }

// ---------------------------------------------------------------- cose da pagare (scadenze e spese non pagate)
function daPagare(entro) {
  const voci = stato.dati.ricorrenti.filter((r) => inCorso(r) && r.prossima_scadenza && r.prossima_scadenza <= entro)
    .map((r) => ({ data: r.prossima_scadenza, titolo: r.nome, sotto: [r.importo !== null ? euro(r.importo) : "importo da sapere", r.cassetto, r.mezzo].filter(Boolean).join(" · "), tipo: "ricorrente", id: r.id }));
  stato.dati.spese.filter((s) => s.pagato === "no" && s.stato !== "da_chiarire").forEach((s) => {
    const data = s.scadenza || s.data_documento;
    if (data && data <= entro) voci.push({ data, titolo: s.fornitore, sotto: [euro(s.totale), s.cassetto, s.mezzo, s.codice].filter(Boolean).join(" · "), tipo: "spesa", id: s.id });
  });
  stato.dati.ricorrenti.filter((r) => inCorso(r) && r.disdetta_entro && r.disdetta_entro >= chiaveGiorno() && r.disdetta_entro <= entro)
    .forEach((r) => voci.push({ data: r.disdetta_entro, titolo: `Disdire: ${r.nome}`, sotto: "ultimo giorno per la disdetta", tipo: "disdetta", id: r.id }));
  return voci.sort((a, b) => a.data.localeCompare(b.data));
}
function rigaDaPagare(v) {
  const [testo, colore] = quandoTesto(v.data);
  const classe = v.data < chiaveGiorno() ? "ritardo" : giorniMancanti(v.data) <= stato.dati.impostazioni.giorni_avviso ? "oggi" : "";
  const apri = v.tipo === "spesa" ? `data-azione="apri-spesa" data-id="${v.id}"` : `data-azione="apri-ricorrente" data-id="${v.id}"`;
  const paga = v.tipo === "ricorrente" ? `<button class="btn chiaro piccolo" data-azione="paga" data-id="${v.id}">Pagata</button>` : v.tipo === "spesa" ? `<button class="btn chiaro piccolo" data-azione="segna-pagata" data-id="${v.id}">Pagata</button>` : "";
  return `<div class="riga-scad ${classe === "ritardo" ? "ritardo" : classe === "oggi" ? "vicina" : ""}"><div class="apri" ${apri}>${boxGiorno(v.data)}<div><strong>${esc(v.titolo)}</strong><small>${esc(v.sotto)}</small></div></div><div class="destra">${pillTesto(testo, colore)}${paga}</div></div>`;
}

// ---------------------------------------------------------------- panoramica
function speseMese(chiaveMese) { return stato.dati.spese.filter((s) => s.data_documento.startsWith(chiaveMese)); }
function vistaPanoramica() {
  const imp = stato.dati.impostazioni;
  const meseOra = chiaveGiorno().slice(0, 7);
  const prossimi = daPagare(spostaGiorni(30));
  const urgenti = daPagare(spostaGiorni(imp.giorni_avviso));
  const delMese = speseMese(meseOra);
  const aperte = stato.dati.incassi.filter((f) => f.stato === "da_incassare");
  const controllo = stato.dati.spese.filter(daControllare);
  const massimo = Math.max(1, ...CASSETTI.map(([c]) => somma(delMese.filter((s) => s.cassetto === c))));
  const budget = statoBudget(meseOra).filter((b) => b.percentuale >= imp.soglia_budget);
  const nonPagate = stato.dati.spese.filter((s) => s.pagato === "no");
  const altri = stato.dati.spese.filter((s) => altroCassetto(s));
  const segnalare = stato.dati.spese.filter((s) => s.segnala === "si");
  return `
    ${intro("Ciao Elena", "Qui trovi solo quello che conta adesso: cosa pagare, cosa incassare e cosa controllare.")}
    <section class="numeri">
      <button class="numero ${urgenti.some((v) => v.data < chiaveGiorno()) ? "terracotta" : "ambra"}" data-vai="scadenze"><b>${urgenti.length}</b><span>da pagare entro ${imp.giorni_avviso} giorni</span></button>
      <button class="numero salvia" data-azione="filtra-mese" data-mese="${meseOra}"><b class="piccolo">${esc(euro(somma(delMese)))}</b><span>speso a ${esc(MESI[oggiData.getMonth()])} (tutti i cassetti)</span></button>
      <button class="numero cielo" data-vai="fatture"><b class="piccolo">${esc(euro(somma(aperte)))}</b><span>${aperte.length} fatture da incassare</span></button>
      <button class="numero ambra" data-azione="filtra-speciale" data-speciale="controllare"><b>${controllo.length}</b><span>righe da controllare</span></button>
    </section>
    <div class="due-colonne">
      <section class="pannello">
        <h3>Da pagare nei prossimi 30 giorni</h3>
        <p class="sotto">Rate, abbonamenti e spese non ancora pagate. Premi "Pagata" quando hai pagato: la spesa si registra da sola.</p>
        ${prossimi.length ? `<div class="righe">${prossimi.slice(0, 8).map(rigaDaPagare).join("")}</div>${prossimi.length > 8 ? `<p><button class="link" data-vai="scadenze">Vedi tutte (${prossimi.length})</button></p>` : ""}` : vuoto("Niente da pagare", "Nei prossimi 30 giorni non ci sono scadenze.")}
      </section>
      <div>
        <section class="pannello">
          <h3>Speso a ${esc(MESI[oggiData.getMonth()])}</h3>
          <p class="sotto">In base alla data del documento.</p>
          <div class="cassetti-mese">${CASSETTI.map(([c, nome]) => { const t = somma(delMese.filter((s) => s.cassetto === c)); return `<div><span>${esc(nome)}</span><div class="barra-cat"><i style="width:${Math.max(0, (t / massimo) * 100)}%"></i></div><b>${esc(euro(t))}</b></div>`; }).join("")}</div>
          <p><button class="link" data-vai="riepilogo">Apri il riepilogo dell'anno</button></p>
        </section>
        <div class="spazio"></div>
        ${budget.length ? `<section class="pannello"><h3>Budget da tenere d'occhio</h3><p class="sotto">Categorie oltre il ${Math.round(imp.soglia_budget * 100)}% del budget di questo mese.</p><div class="elenco-breve">${budget.map((b) => `<div class="cosa"><div class="giorno"><b>${Math.round(b.percentuale * 100)}%</b></div><div><strong>${esc(b.categoria)}</strong><small>${esc(b.cassetto)} · ${esc(euro(b.speso))} su ${esc(euro(b.importo))}</small></div>${b.percentuale >= 1 ? pillTesto("Superato", "terracotta") : pillTesto("Attenzione", "ambra")}</div>`).join("")}</div></section><div class="spazio"></div>` : ""}
        <section class="pannello">
          <h3>Da controllare</h3>
          <p class="sotto">Clicca una voce per vedere le spese.</p>
          <div class="chip-stati">
            <button class="pill tono-terracotta" data-azione="filtra-speciale" data-speciale="da_chiarire">Da chiarire: ${stato.dati.spese.filter((s) => s.stato === "da_chiarire").length}</button>
            <button class="pill tono-ambra" data-azione="filtra-speciale" data-speciale="da_verificare">Da verificare: ${stato.dati.spese.filter((s) => s.stato === "da_verificare").length}</button>
            <button class="pill tono-ambra" data-azione="filtra-speciale" data-speciale="non_pagate">Non pagate: ${nonPagate.length}</button>
            <button class="pill tono-lavanda" data-azione="filtra-speciale" data-speciale="altro_cassetto">Pagate con un conto di un altro cassetto: ${altri.length}</button>
            <button class="pill tono-cielo" data-azione="filtra-speciale" data-speciale="segnala">Da segnalare al commercialista: ${segnalare.length}</button>
          </div>
        </section>
      </div>
    </div>`;
}

// ---------------------------------------------------------------- spese
function speseFiltrate() {
  const f = stato.filtri;
  const testo = minuscolo(f.testo);
  let lista = stato.dati.spese.filter((s) => {
    if (testo && !minuscolo([s.codice, s.fornitore, s.descrizione, s.numero_documento, s.note, s.categoria, s.mezzo].join(" ")).includes(testo)) return false;
    if (f.cassetto && s.cassetto !== f.cassetto) return false;
    if (f.categoria && s.categoria !== f.categoria) return false;
    if (f.anno && !s.data_documento.startsWith(f.anno)) return false;
    if (f.mese && s.data_documento.slice(5, 7) !== f.mese) return false;
    if (f.pagato && s.pagato !== f.pagato) return false;
    if (f.stato && s.stato !== f.stato) return false;
    if (f.mezzo && s.mezzo !== f.mezzo) return false;
    if (f.speciale === "controllare" && !daControllare(s)) return false;
    if (f.speciale === "altro_cassetto" && !altroCassetto(s)) return false;
    if (f.speciale === "segnala" && s.segnala !== "si") return false;
    return true;
  });
  const ordini = {
    recenti: (a, b) => (b.data_documento + b.codice).localeCompare(a.data_documento + a.codice),
    vecchie: (a, b) => (a.data_documento + a.codice).localeCompare(b.data_documento + b.codice),
    importo: (a, b) => (Number(b.totale) || 0) - (Number(a.totale) || 0),
    fornitore: (a, b) => a.fornitore.localeCompare(b.fornitore, "it"),
  };
  return lista.sort(ordini[f.ordine] || ordini.recenti);
}
function filtroSelect(nome, chiave, valore, opzioni, tutti = "Tutti") {
  return `<label class="campo"><span>${esc(nome)}</span><select data-filtro="${chiave}"><option value="">${esc(tutti)}</option>${opzioni.map(([k, t]) => `<option value="${esc(k)}" ${k === valore ? "selected" : ""}>${esc(t)}</option>`).join("")}</select></label>`;
}
function rigaSpesa(s) {
  const altro = altroCassetto(s);
  return `<button class="riga spesa" data-azione="apri-spesa" data-id="${s.id}">
    <div class="giorno"><b>${giornoBreve(s.data_documento).n}</b><span>${esc(giornoBreve(s.data_documento).mese)}</span></div>
    <div class="chi"><strong>${esc(s.fornitore || "Fornitore non indicato")}</strong><span>${esc(s.descrizione)}</span><small>${esc(s.codice)} · ${esc(s.categoria)}${s.mezzo ? ` · ${esc(s.mezzo)}` : ""}</small></div>
    <div class="stati">${pill(CASSETTI, s.cassetto)}${s.stato !== "ok" ? pill(STATI_RIGA, s.stato) : ""}${s.pagato === "no" ? pillTesto("Non pagata", "terracotta") : ""}${s.pagato === "rateizzata" ? pillTesto("Rateizzata", "ambra") : ""}${altro ? pillTesto(`Conto ${altro}`, "lavanda") : ""}${s.segnala === "si" ? pillTesto("Commercialista", "cielo") : ""}</div>
    <div class="importo ${Number(s.totale) < 0 ? "negativo" : ""}">${esc(euro(s.totale))}</div>
  </button>`;
}
function vistaSpese() {
  const f = stato.filtri;
  const lista = speseFiltrate();
  stato.pagina = paginaValida(lista, stato.pagina);
  const speciali = [["controllare", "Da controllare (non OK)"], ["altro_cassetto", "Pagate con un conto di un altro cassetto"], ["segnala", "Da segnalare al commercialista"]];
  const categorie = [...new Set([...nomiCategorie(), ...stato.dati.spese.map((s) => s.categoria)])].filter(Boolean).sort((a, b) => a.localeCompare(b, "it"));
  const mezzi = [...new Set([...nomiMezzi(), ...stato.dati.spese.map((s) => s.mezzo)])].filter(Boolean);
  const attivi = Object.entries(f).filter(([k, v]) => v && k !== "ordine").length;
  return `
    ${intro("Le tue spese", "Cerca, filtra e apri una spesa per vederla tutta o modificarla. Il totale qui sotto conta solo le spese che vedi.")}
    <section class="filtri spese">
      <label class="campo"><span>Cerca</span><input data-filtro="testo" value="${esc(f.testo)}" placeholder="fornitore, descrizione, codice, note…" /></label>
      ${filtroSelect("Cassetto", "cassetto", f.cassetto, CASSETTI)}
      ${filtroSelect("Anno", "anno", f.anno, anniPresenti().map((a) => [a, a]))}
      ${filtroSelect("Mese", "mese", f.mese, MESI.map((m, i) => [String(i + 1).padStart(2, "0"), m]))}
      ${filtroSelect("Categoria", "categoria", f.categoria, categorie.map((c) => [c, c]), "Tutte")}
      ${filtroSelect("Pagata", "pagato", f.pagato, PAGATO, "Tutte")}
      ${filtroSelect("Stato della riga", "stato", f.stato, STATI_RIGA, "Tutti")}
      ${filtroSelect("Mezzo di pagamento", "mezzo", f.mezzo, mezzi.map((m) => [m, m]))}
      ${filtroSelect("Controlli", "speciale", f.speciale, speciali, "Nessuno")}
      ${filtroSelect("Ordina per", "ordine", f.ordine, [["recenti", "Più recenti prima"], ["vecchie", "Più vecchie prima"], ["importo", "Importo più alto"], ["fornitore", "Fornitore (A-Z)"]], "Più recenti prima")}
      <div class="riga2"><span>${attivi ? `${attivi} filtri attivi` : "Nessun filtro"}</span>${attivi ? `<button class="link" data-azione="azzera-filtri">Togli tutti i filtri</button>` : ""}</div>
    </section>
    <p class="somma"><span><b>${lista.length}</b> spese</span><span>Totale <b>${esc(euro(somma(lista)))}</b></span><span>di cui imponibile ${esc(euro(somma(lista, "imponibile")))} e IVA ${esc(euro(somma(lista, "iva")))}</span></p>
    ${lista.length ? `<div class="righe">${fetta(lista, stato.pagina).map(rigaSpesa).join("")}</div>${paginazione(lista.length, stato.pagina, "pagina-spese")}` : vuoto("Nessuna spesa trovata", "Prova a togliere qualche filtro.")}`;
}

// ---------------------------------------------------------------- scadenze e rate
function vistaScadenze() {
  const sc = stato.scad;
  const testo = minuscolo(sc.testo);
  let lista = stato.dati.ricorrenti.filter((r) => (sc.gruppo === "in_corso" ? inCorso(r) : sc.gruppo === "finite" ? !inCorso(r) : true)
    && (!sc.cassetto || r.cassetto === sc.cassetto) && (!testo || minuscolo([r.nome, r.fornitore, r.note, r.categoria].join(" ")).includes(testo)));
  lista = lista.sort((a, b) => (a.prossima_scadenza || "9999").localeCompare(b.prossima_scadenza || "9999") || a.nome.localeCompare(b.nome, "it"));
  sc.pagina = paginaValida(lista, sc.pagina);
  const nonPagate = stato.dati.spese.filter((s) => s.pagato === "no" && s.stato !== "da_chiarire").sort((a, b) => (a.scadenza || a.data_documento).localeCompare(b.scadenza || b.data_documento));
  const mese = (r) => {
    const n = contaRate(r);
    return [r.importo !== null ? euro(r.importo) : "importo da sapere", etichetta(FREQUENZE, r.frequenza), r.cassetto, r.mezzo, r.ultima_scadenza ? `ultima rata ${dataIt(r.ultima_scadenza)}${n ? ` (${n} ancora da pagare)` : ""}` : ""].filter(Boolean).join(" · ");
  };
  const riga = (r) => {
    const classe = r.prossima_scadenza && inCorso(r) ? (r.prossima_scadenza < chiaveGiorno() ? "ritardo" : giorniMancanti(r.prossima_scadenza) <= stato.dati.impostazioni.giorni_avviso ? "vicina" : "") : "";
    const [testoQuando, colore] = r.prossima_scadenza && inCorso(r) ? quandoTesto(r.prossima_scadenza) : [etichetta(STATI_RICORRENTE, r.stato), "grigio"];
    return `<div class="riga-scad ${classe}"><div class="apri" data-azione="apri-ricorrente" data-id="${r.id}">${boxGiorno(r.prossima_scadenza)}<div><strong>${esc(r.nome)}</strong><small>${esc(mese(r))}</small></div></div>
      <div class="destra">${r.stato === "da_disdire" ? pill(STATI_RICORRENTE, r.stato) : ""}${r.disdetta_entro && inCorso(r) ? pillTesto(`Disdire entro ${dataIt(r.disdetta_entro)}`, "ambra") : ""}${pillTesto(testoQuando, colore)}${inCorso(r) && r.prossima_scadenza ? `<button class="btn chiaro piccolo" data-azione="paga" data-id="${r.id}">Pagata</button>` : ""}</div></div>`;
  };
  return `
    ${intro("Scadenze e rate", "Abbonamenti, rate dell'Agenzia delle Entrate-Riscossione e pagamenti futuri. Quando paghi premi \"Pagata\": la spesa viene registrata e la scadenza passa da sola alla rata successiva.")}
    <div class="schede-tab">${[["in_corso", "In corso"], ["finite", "Finite o disdette"], ["tutte", "Tutte"]].map(([k, t]) => `<button class="btn piccolo ${sc.gruppo === k ? "scelta" : ""}" data-azione="gruppo-scad" data-valore="${k}">${t}</button>`).join("")}</div>
    <section class="filtri" style="grid-template-columns: 2fr 1fr">
      <label class="campo"><span>Cerca</span><input data-filtro-scad="testo" value="${esc(sc.testo)}" placeholder="nome, fornitore, note…" /></label>
      <label class="campo"><span>Cassetto</span><select data-filtro-scad="cassetto"><option value="">Tutti</option>${CASSETTI.map(([k, t]) => `<option value="${k}" ${sc.cassetto === k ? "selected" : ""}>${t}</option>`).join("")}</select></label>
    </section>
    ${lista.length ? `<div class="righe">${fetta(lista, sc.pagina).map(riga).join("")}</div>${paginazione(lista.length, sc.pagina, "pagina-scad")}` : vuoto("Nessuna scadenza qui", "Aggiungine una con il pulsante \"+ Scadenza o rata\" in alto.")}
    ${nonPagate.length && sc.gruppo !== "finite" ? `<div class="spazio"></div><section class="pannello"><h3>Spese registrate ma non ancora pagate</h3><p class="sotto">Bollette con addebito, fatture da saldare… Premi "Pagata" quando l'addebito è avvenuto.</p><div class="righe">${nonPagate.slice(0, 10).map((s) => rigaDaPagare({ data: s.scadenza || s.data_documento, titolo: s.fornitore, sotto: [euro(s.totale), s.cassetto, s.mezzo, s.codice].filter(Boolean).join(" · "), tipo: "spesa", id: s.id })).join("")}</div></section>` : ""}`;
}

// ---------------------------------------------------------------- fatture da incassare
function vistaFatture() {
  const ft = stato.fatt;
  let lista = stato.dati.incassi.filter((f) => ft.gruppo === "aperte" ? f.stato === "da_incassare" : ft.gruppo === "chiuse" ? f.stato !== "da_incassare" : true);
  lista = lista.sort((a, b) => ft.gruppo === "aperte" ? (a.scadenza || "9999").localeCompare(b.scadenza || "9999") : b.data_fattura.localeCompare(a.data_fattura));
  ft.pagina = paginaValida(lista, ft.pagina);
  const aperte = stato.dati.incassi.filter((f) => f.stato === "da_incassare");
  const riga = (f) => {
    const scaduta = f.stato === "da_incassare" && f.scadenza && f.scadenza < chiaveGiorno();
    const [testo, colore] = f.stato === "da_incassare" && f.scadenza ? quandoTesto(f.scadenza) : [etichetta(STATI_INCASSO, f.stato), tono(STATI_INCASSO, f.stato)];
    return `<div class="riga-scad ${scaduta ? "ritardo" : ""}"><div class="apri" data-azione="apri-incasso" data-id="${f.id}">${boxGiorno(f.stato === "incassata" ? f.data_incasso : f.scadenza || f.data_fattura)}<div><strong>Fattura ${esc(f.numero)} · ${esc(euro(f.totale))}</strong><small>${esc(f.cliente)} · ${esc(f.cassetto)} · emessa il ${esc(dataIt(f.data_fattura))}${f.stato === "incassata" ? ` · incassata il ${esc(dataIt(f.data_incasso))}` : f.scadenza ? ` · scade il ${esc(dataIt(f.scadenza))}` : ""}</small></div></div>
      <div class="destra">${pillTesto(f.stato === "da_incassare" && scaduta ? `Scaduta: ${testo.toLowerCase()}` : testo, scaduta ? "terracotta" : colore)}${f.stato === "da_incassare" ? `<button class="btn chiaro piccolo" data-azione="incassa" data-id="${f.id}">Incassata</button>` : ""}</div></div>`;
  };
  return `
    ${intro("Fatture da incassare", "Le fatture che hai emesso (società e ditta). Sono entrate: non entrano nei totali delle spese.", `<button class="btn chiaro" data-azione="nuovo-incasso">+ Fattura emessa</button>`)}
    <p class="somma"><span><b>${aperte.length}</b> da incassare</span><span>Totale <b>${esc(euro(somma(aperte)))}</b></span><span>di cui scadute ${esc(euro(somma(aperte.filter((f) => f.scadenza && f.scadenza < chiaveGiorno()))))}</span></p>
    <div class="schede-tab">${[["aperte", "Da incassare"], ["chiuse", "Incassate o annullate"], ["tutte", "Tutte"]].map(([k, t]) => `<button class="btn piccolo ${ft.gruppo === k ? "scelta" : ""}" data-azione="gruppo-fatt" data-valore="${k}">${t}</button>`).join("")}</div>
    ${lista.length ? `<div class="righe">${fetta(lista, ft.pagina).map(riga).join("")}</div>${paginazione(lista.length, ft.pagina, "pagina-fatt")}` : vuoto("Nessuna fattura qui", "Quando emetti una fattura, registrala con \"+ Fattura emessa\".")}`;
}

// ---------------------------------------------------------------- riepilogo
function vistaRiepilogo() {
  const anno = stato.annoRiepilogo;
  const delAnno = stato.dati.spese.filter((s) => s.data_documento.startsWith(anno));
  const cella = (lista, campo, cassetto, mese) => {
    const v = somma(lista, campo);
    return v ? `<button class="cella-link" data-azione="vai-spese" data-cassetto="${cassetto}" data-anno="${anno}" data-mese="${mese}">${esc(euro(v))}</button>` : `<span style="color:var(--inchiostro-tenue)">—</span>`;
  };
  const righeMesi = MESI.map((nome, i) => {
    const mm = String(i + 1).padStart(2, "0");
    const delMese = delAnno.filter((s) => s.data_documento.slice(5, 7) === mm);
    return `<tr><td style="text-transform:capitalize">${nome}</td>${CASSETTI.map(([c]) => `<td class="num">${cella(delMese.filter((s) => s.cassetto === c), "totale", c, mm)}</td>`).join("")}<td class="num"><b>${delMese.length ? esc(euro(somma(delMese))) : "—"}</b></td><td class="num">${cella(delMese.filter((s) => s.cassetto === "SRLS"), "iva", "SRLS", mm)}</td><td class="num">${cella(delMese.filter((s) => s.cassetto === "DITTA"), "iva", "DITTA", mm)}</td></tr>`;
  }).join("");
  const perCassetto = delAnno.filter((s) => s.cassetto === stato.cassettoRiepilogo);
  const categorie = [...new Set(perCassetto.map((s) => s.categoria))].map((c) => ({ c, lista: perCassetto.filter((s) => s.categoria === c) })).map((x) => ({ ...x, totale: somma(x.lista) })).sort((a, b) => b.totale - a.totale);
  const massimo = Math.max(1, ...categorie.map((x) => x.totale));
  return `
    ${intro(`Riepilogo ${anno}`, "Totali per mese e per cassetto, in base alla data del documento. Clicca un importo per vedere le spese che lo compongono.",
      `<label class="campo" style="min-width:140px"><span>Anno</span><select data-azione-cambia="anno-riepilogo">${anniPresenti().map((a) => `<option ${a === anno ? "selected" : ""}>${a}</option>`).join("")}</select></label>`)}
    <div class="contenitore-tabella"><table class="tabella">
      <thead><tr><th>Mese</th>${CASSETTI.map(([c]) => `<th class="num">${c}</th>`).join("")}<th class="num">Totale</th><th class="num">IVA SRLS</th><th class="num">IVA DITTA</th></tr></thead>
      <tbody>${righeMesi}</tbody>
      <tfoot><tr><td>Anno ${esc(anno)}</td>${CASSETTI.map(([c]) => `<td class="num">${esc(euro(somma(delAnno.filter((s) => s.cassetto === c))))}</td>`).join("")}<td class="num">${esc(euro(somma(delAnno)))}</td><td class="num">${esc(euro(somma(delAnno.filter((s) => s.cassetto === "SRLS"), "iva")))}</td><td class="num">${esc(euro(somma(delAnno.filter((s) => s.cassetto === "DITTA"), "iva")))}</td></tr></tfoot>
    </table></div>
    <div class="spazio"></div>
    <section class="pannello">
      <h3>Per categoria</h3>
      <p class="sotto">Scegli il cassetto. Clicca una categoria per vedere le spese.</p>
      <div class="schede-tab">${CASSETTI.map(([k, t]) => `<button class="btn piccolo ${stato.cassettoRiepilogo === k ? "scelta" : ""}" data-azione="cassetto-riepilogo" data-valore="${k}">${t}</button>`).join("")}</div>
      ${categorie.length ? `<div class="contenitore-tabella"><table class="tabella"><thead><tr><th>Categoria</th><th>Peso</th><th class="num">Spese</th><th class="num">Totale</th></tr></thead><tbody>${categorie.map((x) => `<tr><td><button class="cella-link" data-azione="vai-spese" data-cassetto="${stato.cassettoRiepilogo}" data-anno="${anno}" data-categoria="${esc(x.c)}">${esc(x.c)}</button></td><td style="width:35%"><div class="barra-cat"><i style="width:${(x.totale / massimo) * 100}%"></i></div></td><td class="num">${x.lista.length}</td><td class="num">${esc(euro(x.totale))}</td></tr>`).join("")}</tbody></table></div>` : vuoto("Nessuna spesa", "In questo anno non ci sono spese per questo cassetto.")}
    </section>`;
}

// ---------------------------------------------------------------- budget
function statoBudget(chiaveMese) {
  const delMese = speseMese(chiaveMese);
  return stato.dati.budget.map((b) => {
    const speso = somma(delMese.filter((s) => s.cassetto === b.cassetto && s.categoria === b.categoria));
    return { ...b, speso, percentuale: b.importo ? speso / b.importo : 0 };
  });
}
function vistaBudget() {
  const soglia = stato.dati.impostazioni.soglia_budget;
  const lista = statoBudget(stato.meseBudget).sort((a, b) => b.percentuale - a.percentuale);
  const [anno, mese] = stato.meseBudget.split("-");
  return `
    ${intro("Budget mensile", `Un tetto di spesa al mese per cassetto e categoria. L'avviso scatta al ${Math.round(soglia * 100)}% (si cambia in Impostazioni).`,
      `<div style="display:flex;gap:10px;align-items:end;flex-wrap:wrap"><label class="campo"><span>Mese</span><input type="month" data-azione-cambia="mese-budget" value="${esc(stato.meseBudget)}" /></label><button class="btn pieno" data-azione="nuovo-budget">+ Budget</button></div>`)}
    ${lista.length ? `<div class="contenitore-tabella"><table class="tabella"><thead><tr><th>Cassetto</th><th>Categoria</th><th class="num">Budget</th><th class="num">Speso a ${esc(MESI[Number(mese) - 1])} ${esc(anno)}</th><th>Uso</th><th></th></tr></thead><tbody>
      ${lista.map((b) => `<tr><td>${esc(b.cassetto)}</td><td>${esc(b.categoria)}</td><td class="num">${esc(euro(b.importo))}</td><td class="num">${esc(euro(b.speso))}</td><td style="min-width:180px"><div class="barra-cat ${b.percentuale >= 1 ? "" : b.percentuale >= soglia ? "ambra" : "salvia"}"><i style="width:${Math.min(100, b.percentuale * 100)}%"></i></div><small>${Math.round(b.percentuale * 100)}% ${b.percentuale >= 1 ? "· superato" : b.percentuale >= soglia ? "· attenzione" : ""}</small></td><td class="num"><button class="btn chiaro piccolo" data-azione="modifica-budget" data-id="${b.id}">Modifica</button></td></tr>`).join("")}
    </tbody></table></div>` : vuoto("Nessun budget impostato", "Il budget è facoltativo. Se vuoi tenere d'occhio una categoria (per esempio la spesa alimentare), premi \"+ Budget\" e scrivi quanto vuoi spendere al mese.", `<p><button class="btn pieno" data-azione="nuovo-budget">+ Budget</button></p>`)}`;
}

// ---------------------------------------------------------------- per il commercialista
function urlCommercialista(formato = "") {
  const c = stato.comm;
  return `${API}/commercialista?da=${c.da}&a=${c.a}&cassetti=${c.cassetti.join(",")}${formato ? `&formato=${formato}` : ""}`;
}
async function caricaCommercialista() {
  try {
    const r = await fetch(urlCommercialista());
    const d = await r.json();
    if (!r.ok) throw new Error(d.errore);
    stato.comm.dati = d;
    stato.comm.pagina = 1;
  } catch (e) {
    avviso(`Anteprima non riuscita: ${e.message}`, "errore");
  }
  disegna();
}
function vistaCommercialista() {
  const c = stato.comm;
  const anno = oggiData.getFullYear();
  const rapidi = [[`${anno}-01-01`, `${anno}-12-31`, `Anno ${anno}`], [`${anno - 1}-01-01`, `${anno - 1}-12-31`, `Anno ${anno - 1}`],
    [`${anno}-01-01`, `${anno}-03-31`, "1° trimestre"], [`${anno}-04-01`, `${anno}-06-30`, "2° trimestre"], [`${anno}-07-01`, `${anno}-09-30`, "3° trimestre"], [`${anno}-10-01`, `${anno}-12-31`, "4° trimestre"]];
  const d = c.dati;
  let anteprima = vuoto("Scegli periodo e cassetti", "Poi premi \"Mostra l'anteprima\" per vedere cosa finirà nel file.");
  if (d) {
    const totali = d.cassetti.map((k) => ({ k, lista: d.spese.filter((s) => s.cassetto === k) }));
    c.pagina = paginaValida(d.segnalare, c.pagina);
    anteprima = `
      <section class="numeri">${totali.map((t) => `<div class="numero"><b class="piccolo">${esc(euro(somma(t.lista)))}</b><span>${esc(etichetta(CASSETTI, t.k))}: ${t.lista.length} spese, IVA ${esc(euro(somma(t.lista, "iva")))}</span></div>`).join("")}<div class="numero ambra"><b>${d.segnalare.length}</b><span>spese da guardare insieme</span></div></section>
      <div class="due-colonne">
        <section class="pannello"><h3>Da guardare insieme al commercialista</h3><p class="sotto">Pagate con un conto di un altro cassetto, segnate da dare a lui, da verificare o non pagate.</p>
          ${d.segnalare.length ? `<div class="elenco-breve">${fetta(d.segnalare, c.pagina).map((s) => `<button class="cosa" data-azione="apri-spesa" data-id="${s.id}">${boxGiorno(s.data_documento)}<div><strong>${esc(s.fornitore)} · ${esc(euro(s.totale))}</strong><small>${esc(s.motivi.join("; "))}</small></div>${pillTesto(s.cassetto)}</button>`).join("")}</div>${paginazione(d.segnalare.length, c.pagina, "pagina-comm")}` : `<p>Nessuna spesa da segnalare in questo periodo.</p>`}
        </section>
        <section class="pannello"><h3>Per categoria</h3><p class="sotto">Totali del periodo.</p>
          <div class="contenitore-tabella"><table class="tabella"><thead><tr><th>Cassetto</th><th>Categoria</th><th class="num">Totale</th></tr></thead><tbody>${d.per_categoria.map((r) => `<tr><td>${esc(r.cassetto)}</td><td>${esc(r.categoria)}</td><td class="num">${esc(euro(r.totale))}</td></tr>`).join("")}</tbody></table></div>
        </section>
      </div>`;
  }
  return `
    ${intro("Per il commercialista", "Prepara il riepilogo da mandare al commercialista: un file Excel ordinato (si apre anche con LibreOffice) oppure una stampa / PDF.")}
    <section class="pannello">
      <div class="pulsanti-rapidi">${rapidi.map(([da, a, t]) => `<button class="btn piccolo ${c.da === da && c.a === a ? "scelta" : ""}" data-azione="periodo-comm" data-da="${da}" data-a="${a}" style="${c.da === da && c.a === a ? "border-color:var(--terracotta);background:var(--terracotta-tenue)" : ""}">${t}</button>`).join("")}</div>
      <div class="griglia tre">
        <label class="campo"><span>Dal</span><input type="date" data-comm="da" value="${esc(c.da)}" /></label>
        <label class="campo"><span>Al</span><input type="date" data-comm="a" value="${esc(c.a)}" /></label>
        <div class="campo"><span>Cassetti</span><div style="display:flex;gap:12px;flex-wrap:wrap;padding-top:8px">${CASSETTI.map(([k, t]) => `<label><input type="checkbox" data-comm-cassetto="${k}" ${c.cassetti.includes(k) ? "checked" : ""}/> ${k}</label>`).join("")}</div><small>Di solito SRLS e DITTA; le personali solo se servono (per esempio per la dichiarazione dei redditi).</small></div>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn chiaro" data-azione="anteprima-comm">Mostra l'anteprima</button>
        <a class="btn pieno" href="${esc(urlCommercialista("excel"))}" data-scarica>Scarica il file Excel</a>
        <button class="btn chiaro" data-azione="stampa-comm">Stampa o salva in PDF</button>
      </div>
    </section>
    <div class="spazio"></div>
    ${anteprima}`;
}
async function stampaCommercialista() {
  if (!stato.comm.dati) await caricaCommercialista();
  const d = stato.comm.dati;
  if (!d) return;
  const tabella = (intest, righe) => `<table><thead><tr>${intest.map((t) => `<th>${esc(t)}</th>`).join("")}</tr></thead><tbody>${righe.map((r) => `<tr>${r.map((v) => `<td>${esc(v)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
  document.getElementById("stampa").innerHTML = `
    <h1>Riepilogo spese per il commercialista</h1>
    <p>Periodo dal ${esc(dataIt(d.da))} al ${esc(dataIt(d.a))} · stampato il ${esc(dataIt(chiaveGiorno()))}</p>
    ${d.info.map((c) => `<p><b>${esc(c.codice)}</b>: ${esc(c.nome)} · ${esc(c.tipo)}${c.partita_iva ? ` · P.IVA ${esc(c.partita_iva)}` : ""}</p>`).join("")}
    <h2>Totali per categoria</h2>${tabella(["Cassetto", "Categoria", "Spese", "Imponibile", "IVA", "Totale"], d.per_categoria.map((r) => [r.cassetto, r.categoria, r.n, euro(r.imponibile), euro(r.iva), euro(r.totale)]))}
    <h2>Da guardare insieme</h2>${tabella(["Codice", "Data", "Cassetto", "Fornitore", "Totale", "Perché"], d.segnalare.map((s) => [s.codice, dataIt(s.data_documento), s.cassetto, s.fornitore, euro(s.totale), s.motivi.join("; ")]))}
    <h2>Elenco delle spese</h2>${tabella(["Codice", "Data", "Cassetto", "Categoria", "Fornitore", "Imponibile", "IVA", "Totale", "Pagata con"], d.spese.map((s) => [s.codice, dataIt(s.data_documento), s.cassetto, s.categoria, s.fornitore, euro(s.imponibile), euro(s.iva), euro(s.totale), s.mezzo]))}
    ${d.incassi.length ? `<h2>Fatture emesse</h2>${tabella(["Cassetto", "Numero", "Data", "Cliente", "Totale", "Stato"], d.incassi.map((f) => [f.cassetto, f.numero, dataIt(f.data_fattura), f.cliente, euro(f.totale), etichetta(STATI_INCASSO, f.stato)]))}` : ""}`;
  window.print();
}

// ---------------------------------------------------------------- esporta e backup
function vistaEsporta() {
  return `
    ${intro("Esporta e backup", "Per avere i dati anche fuori dal sito, o per metterli al sicuro.")}
    <div class="trasferimenti">
      <section class="pannello"><h3>Registro completo in Excel</h3><p>Tutte le spese, le scadenze, le fatture, il budget, le impostazioni e lo storico, in un file con un foglio per ogni parte.</p><a class="btn pieno" href="${API}/esporta-excel" data-scarica>Scarica il registro Excel</a></section>
      <section class="pannello"><h3>Riepilogo per il commercialista</h3><p>Scegli periodo e cassetti, poi scarica il file o stampalo.</p><button class="btn chiaro" data-vai="commercialista">Vai al riepilogo</button></section>
      <section class="pannello"><h3>Copia di sicurezza di tutto il sito</h3><p>Copia il file dei dati (comprese le candidature di BussolaLavoro) nella cartella backup, con data e ora nel nome.</p><button class="btn chiaro" data-azione="backup">Fai una copia di sicurezza</button></section>
      <section class="pannello"><h3>File di trasferimento</h3><p>Un file con tutti i dati della sezione Spese, per tenerli da parte o portarli su un altro computer.</p><a class="btn chiaro" href="${API}/esporta-backup" data-scarica>Scarica il file di trasferimento</a></section>
      <section class="pannello"><h3>Ripristina da un file di trasferimento</h3><p><b>Attenzione:</b> tutti i dati attuali della sezione Spese vengono sostituiti da quelli del file. Prima il sito fa da solo una copia di sicurezza.</p><button class="btn pericolo" data-azione="ripristina">Scegli il file e ripristina</button></section>
    </div>`;
}

// ---------------------------------------------------------------- impostazioni
function vistaImpostazioni() {
  const imp = stato.dati.impostazioni;
  const categorie = [...stato.dati.categorie].sort((a, b) => a.vale_per.localeCompare(b.vale_per) || a.nome.localeCompare(b.nome, "it"));
  stato.imp.paginaCategorie = paginaValida(categorie, stato.imp.paginaCategorie);
  const voce = (titolo, sotto, azione, id, extra = "") => `<div class="voce-imp"><div><strong>${esc(titolo)}</strong>${sotto ? `<small>${esc(sotto)}</small>` : ""}</div><div style="display:flex;gap:8px;align-items:center">${extra}<button class="btn chiaro piccolo" data-azione="${azione}" data-id="${id}">Modifica</button></div></div>`;
  return `
    ${intro("Impostazioni", "Le liste che usi nelle spese. Le modifiche valgono da subito.")}
    <div class="griglia-imp">
      <section class="pannello"><h3>Avvisi</h3><p class="sotto">Quando avvisarti.</p>
        <form id="form-impostazioni" class="griglia due">
          <label class="campo"><span>Avviso budget al (%)</span><input name="soglia_budget" inputmode="decimal" value="${Math.round(imp.soglia_budget * 100)}" /><small>Per esempio 80: avvisa quando hai usato l'80% del budget.</small></label>
          <label class="campo"><span>Avviso scadenze: giorni prima</span><input name="giorni_avviso" inputmode="numeric" value="${imp.giorni_avviso}" /><small>Le scadenze entro questi giorni diventano gialle.</small></label>
          <div><button class="btn pieno" type="submit">Salva gli avvisi</button></div>
        </form>
      </section>
      <section class="pannello"><h3>Cassetti</h3><p class="sotto">I tre "cassetti" delle spese, con i dati che servono a riconoscere le fatture.</p>
        <div class="elenco-impostazioni">${stato.dati.cassetti.map((c) => voce(`${c.codice} · ${c.nome}`, [c.tipo, c.partita_iva ? `P.IVA ${c.partita_iva}` : "", c.regime].filter(Boolean).join(" · "), "modifica-cassetto", c.id)).join("")}</div>
      </section>
      <section class="pannello"><h3>Mezzi di pagamento</h3><p class="sotto">Conti e carte, ciascuno con il suo cassetto. Mai numeri di carta interi o codici IBAN.</p>
        <div class="elenco-impostazioni">${stato.dati.mezzi.map((m) => voce(m.nome, `${m.cassetto ? `cassetto ${m.cassetto}` : "vale per più cassetti"}${m.note ? ` · ${m.note}` : ""}`, "modifica-mezzo", m.id, m.attivo === "no" ? pillTesto("Non più in uso") : "")).join("")}</div>
        <p><button class="link" data-azione="nuovo-mezzo">+ Aggiungi un mezzo di pagamento</button></p>
      </section>
      <section class="pannello"><h3>Categorie</h3><p class="sotto">Impresa (società e ditta) oppure Personale.</p>
        <div class="elenco-impostazioni">${fetta(categorie, stato.imp.paginaCategorie).map((c) => voce(c.nome, `${c.vale_per}${c.esempi ? ` · ${c.esempi}` : ""}`, "modifica-categoria", c.id, c.attiva === "no" ? pillTesto("Non più in uso") : "")).join("")}</div>
        ${paginazione(categorie.length, stato.imp.paginaCategorie, "pagina-categorie")}
        <p><button class="link" data-azione="nuova-categoria">+ Aggiungi una categoria</button></p>
      </section>
      <section class="pannello"><h3>Quote di uso promiscuo</h3><p class="sotto">Solo se decise con il commercialista: il sito non le stabilisce mai da solo.</p>
        ${stato.dati.quote.length ? `<div class="elenco-impostazioni">${stato.dati.quote.map((q) => voce(`${q.categoria}${q.fornitore ? ` · ${q.fornitore}` : ""}: ${q.quota ?? "?"}${Number(q.quota) <= 1 ? "" : "%"}`, `cassetto ${q.cassetto_impresa || "?"} · ${q.decisa}`, "modifica-quota", q.id)).join("")}</div>` : `<p>Nessuna quota decisa finora.</p>`}
        <p><button class="link" data-azione="nuova-quota">+ Aggiungi una quota decisa con il commercialista</button></p>
      </section>
    </div>`;
}

// ---------------------------------------------------------------- storico
function vistaStorico() {
  const testo = minuscolo(stato.storico.testo);
  const lista = stato.dati.storico.filter((s) => !testo || minuscolo(`${s.operazione} ${s.dettaglio}`).includes(testo));
  stato.storico.pagina = paginaValida(lista, stato.storico.pagina);
  return `
    ${intro("Storico delle modifiche", "Ogni cosa aggiunta, cambiata o eliminata, con data e ora. Comprende anche lo storico del vecchio registro Excel.")}
    <section class="filtri" style="grid-template-columns:1fr"><label class="campo"><span>Cerca</span><input data-filtro-storico value="${esc(stato.storico.testo)}" placeholder="codice, fornitore, nome della rata…" /></label></section>
    ${lista.length ? `<ul class="diario storico">${fetta(lista, stato.storico.pagina).map((s) => `<li><b>${esc(dataIt(s.quando))} ${esc(s.quando.slice(11, 16))}</b><b>${esc(s.operazione)}</b><p>${esc(s.dettaglio)}</p></li>`).join("")}</ul>${paginazione(lista.length, stato.storico.pagina, "pagina-storico")}` : vuoto("Niente da mostrare", "Nessuna modifica trovata.")}`;
}

// ---------------------------------------------------------------- importare le fatture elettroniche (XML)
const chiaveDoc = (d) => `${String(d.piva_fornitore).replace(/\D/g, "").replace(/^0+/, "")}|${String(d.numero).trim().toUpperCase()}`;
function gruppoDoc(d) { return d.salta ? "saltate" : d.gia ? "gia" : "nuove"; }
async function leggiFileFatture(files) {
  const im = stato.importa;
  const giaVisti = new Map(im.documenti.map((d) => [chiaveDoc(d), d]));
  let n = 0;
  for (const file of files) {
    n += 1;
    im.lettura = `Leggo il file ${n} di ${files.length}: ${file.name}`;
    disegna();
    try {
      const contenuto = await new Promise((ok, ko) => {
        const lettore = new FileReader();
        lettore.onload = () => ok(String(lettore.result).split(",")[1] || "");
        lettore.onerror = () => ko(new Error("file non leggibile"));
        lettore.readAsDataURL(file);
      });
      const r = await chiama("leggi-fattura", { method: "POST", body: JSON.stringify({ nome: file.name, contenuto }) });
      im.errori.push(...r.errori);
      r.documenti.forEach((d) => {
        const chiave = chiaveDoc(d);
        if (giaVisti.has(chiave)) return; // stesso documento in due file (per esempio .xml e .p7m): lo tengo una volta sola
        giaVisti.set(chiave, d);
        d.scelta = gruppoDoc(d) === "nuove";
        im.documenti.push(d);
      });
    } catch (e) {
      im.errori.push(`${file.name}: ${e.message}`);
    }
  }
  im.lettura = "";
  im.documenti.sort((a, b) => b.data.localeCompare(a.data));
  im.gruppo = "nuove"; im.pagina = 1;
  disegna();
}
function schedaImport(d, i) {
  const gruppo = gruppoDoc(d);
  const sel = (nome, chiave, valore, lista, vuota = null) => `<label class="campo"><span>${esc(nome)}</span><select data-import="${i}" data-campo="${chiave}" ${!d.scelta ? "disabled" : ""}>${typeof lista === "string" ? lista : opzioni(lista, valore, vuota)}</select></label>`;
  return `<div class="pannello scheda-import ${d.scelta ? "" : "spenta"}">
    <div class="testa-import">
      ${gruppo === "saltate" ? "" : `<label class="spunta piccola"><input type="checkbox" data-import-scelta="${i}" ${d.scelta ? "checked" : ""}/><span>Importa</span></label>`}
      <div class="chi"><strong>${esc(d.fornitore)} · ${esc(euro(d.totale))}</strong><small>${esc(d.tipo_documento)} n. ${esc(d.numero)} del ${esc(dataIt(d.data))}${d.scadenza ? ` · scade il ${esc(dataIt(d.scadenza))}` : ""} · intestata a ${esc(d.intestato_a || d.nome_cliente || "?")}</small><small>${esc(d.descrizione)}</small>${d.note ? `<small>${esc(d.note)}</small>` : ""}</div>
      <div class="stati">${gruppo === "gia" ? pillTesto(`Già registrata: ${d.gia}`, "salvia") : gruppo === "saltate" ? pillTesto("Non va importata", "grigio") : ""}</div>
    </div>
    ${gruppo === "saltate" ? `<p class="attenzione">${esc(d.salta)}</p>` : `<div class="griglia quattro">
      ${sel("Cassetto", "cassetto", d.cassetto, CASSETTI)}
      ${sel("Categoria", "categoria", d.categoria, categoriePer(d.cassetto, d.categoria))}
      ${sel("Mezzo di pagamento", "mezzo", d.mezzo, nomiMezzi(), "Non indicato")}
      ${sel("Pagata", "pagato", d.pagato, PAGATO)}
    </div>${d.intestato_a && d.cassetto !== d.intestato_a ? `<p class="attenzione">La fattura è intestata a ${esc(d.intestato_a)} ma la stai mettendo nel cassetto ${esc(d.cassetto)}.</p>` : ""}`}
  </div>`;
}
function vistaImporta() {
  const im = stato.importa;
  const gruppi = { nuove: im.documenti.filter((d) => gruppoDoc(d) === "nuove"), gia: im.documenti.filter((d) => gruppoDoc(d) === "gia"), saltate: im.documenti.filter((d) => gruppoDoc(d) === "saltate") };
  const lista = gruppi[im.gruppo] || [];
  im.pagina = paginaValida(lista, im.pagina);
  const scelte = im.documenti.filter((d) => d.scelta && gruppoDoc(d) !== "saltate");
  const senzaCategoria = scelte.filter((d) => !d.categoria).length;
  return `
    ${intro("Importa le fatture elettroniche", "Scegli i file XML delle fatture ricevute (anche quelli firmati .p7m, o un file .zip che li contiene). Il sito li legge, riconosce quelle già registrate e ti propone cassetto, categoria e mezzo di pagamento: tu controlli e confermi.")}
    <section class="pannello">
      <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center">
        <button class="btn pieno" data-azione="scegli-xml">Scegli i file delle fatture</button>
        <button class="btn chiaro" data-azione="prova-xml" title="Versione dimostrativa: carica due fatture elettroniche inventate">Prova con le fatture di esempio</button>
        ${im.documenti.length ? `<button class="btn chiaro" data-azione="svuota-import">Ricomincia</button>` : ""}
        ${im.lettura ? `<span>${esc(im.lettura)}…</span>` : ""}
      </div>
      <p class="aiuto" style="margin-top:14px">Dove trovarli: sito dell'Agenzia delle Entrate, "Fatture e Corrispettivi", poi "Consultazione", "Fatture elettroniche e altri dati IVA", "Fatture ricevute". Puoi scegliere tanti file insieme (tieni premuto Ctrl mentre clicchi, oppure Ctrl e A per sceglierli tutti) oppure lo zip scaricato. Puoi prendere tutto: i file "metaDato" vengono ignorati e, se la stessa fattura c'è sia in .xml sia in .p7m, viene tenuta una volta sola.</p>
    </section>
    ${im.errori.length ? `<div class="spazio"></div><section class="pannello"><h3>File che non ho potuto leggere (${im.errori.length})</h3>${im.errori.slice(0, 10).map((e) => `<p class="attenzione">${esc(e)}</p>`).join("")}</section>` : ""}
    ${im.documenti.length ? `
      <div class="spazio"></div>
      <div class="schede-tab">${[["nuove", `Da importare (${gruppi.nuove.length})`], ["gia", `Già registrate (${gruppi.gia.length})`], ["saltate", `Da non importare (${gruppi.saltate.length})`]].map(([k, t]) => `<button class="btn piccolo ${im.gruppo === k ? "scelta" : ""}" data-azione="gruppo-import" data-valore="${k}">${t}</button>`).join("")}</div>
      ${im.gruppo === "gia" ? `<p class="aiuto">Queste sono già nell'elenco delle spese: di solito non vanno importate di nuovo. Se una è davvero diversa, metti la spunta "Importa".</p>` : ""}
      ${im.gruppo === "saltate" ? `<p class="aiuto">Fatture emesse da te o intestate a qualcun altro: non sono tue spese.</p>` : ""}
      ${lista.length ? `<div class="righe">${fetta(lista, im.pagina).map((d) => schedaImport(d, im.documenti.indexOf(d))).join("")}</div>${paginazione(lista.length, im.pagina, "pagina-import")}` : vuoto("Niente qui", "Nessuna fattura in questo gruppo.")}
      <div class="spazio"></div>
      <section class="pannello barra-import">
        <div><strong>${scelte.length} fatture selezionate</strong> · totale ${esc(euro(somma(scelte)))}${senzaCategoria ? `<br><small class="suggerimento">${senzaCategoria} senza categoria: verranno importate come "Da verificare".</small>` : ""}</div>
        <button class="btn pieno" data-azione="conferma-import" ${scelte.length ? "" : "disabled"}>Importa le fatture selezionate</button>
      </section>` : ""}`;
}

// ---------------------------------------------------------------- finestre: dettagli
function apriFinestra(contenuto, stretta = false) {
  finestra.innerHTML = `<div class="velo"><section class="finestra ${stretta ? "stretta" : ""}" role="dialog" aria-modal="true">${contenuto}</section></div>`;
  finestra.querySelector(".corpo input:not([type=hidden]), .corpo textarea, .corpo select")?.focus();
}
function chiudiFinestra() { finestra.innerHTML = ""; }
function testaFinestra(sopra, titolo) { return `<header><div><p class="etichetta">${esc(sopra)}</p><h2>${esc(titolo)}</h2></div><button class="chiudi" data-chiudi aria-label="Chiudi">×</button></header>`; }
const dato = (nome, valore) => (valore || valore === 0 ? `<div><dt>${esc(nome)}</dt><dd>${valore}</dd></div>` : "");
const soloNomeFile = (testo) => String(testo || "").trim().replace(/^"+|"+$/g, "").split(/[\\/]/).pop(); // da C:\...\spese\bolletta.pdf tiene solo bolletta.pdf
function linkDocumento(valore) {
  if (!valore) return "";
  const nome = soloNomeFile(valore);
  const doc = stato.documenti.find((d) => d.nome.toLowerCase() === nome.toLowerCase());
  return doc ? `<a href="${esc(doc.url)}" target="_blank" rel="noopener">${esc(nome)}</a>` : `${esc(nome)} <small style="color:var(--inchiostro-tenue)">(non è nella cartella documenti)</small>`;
}

function apriSpesa(id) {
  const s = spesaDi(id);
  if (!s) return;
  const altro = altroCassetto(s);
  const rata = s.ricorrente_id ? ricorrenteDi(s.ricorrente_id) : null;
  apriFinestra(`
    ${testaFinestra(`${s.codice} · ${etichetta(CASSETTI, s.cassetto)}`, `${s.fornitore || "Spesa"} · ${euro(s.totale)}`)}
    <div class="corpo">
      <div class="scorciatoie">${pill(CASSETTI, s.cassetto)}${pill(STATI_RIGA, s.stato)}${s.pagato === "si" ? pillTesto("Pagata", "salvia") : s.pagato === "rateizzata" ? pillTesto("Rateizzata: si paga con un piano di rate", "ambra") : pillTesto("Non pagata", "terracotta")}${altro ? pillTesto(`Pagata con un conto del cassetto ${altro}`, "lavanda") : ""}${s.segnala === "si" ? pillTesto("Da segnalare al commercialista", "cielo") : ""}</div>
      <div class="dettaglio">
        <div>
          <div class="blocco"><h4>Descrizione</h4><p>${esc(s.descrizione || "—")}</p></div>
          ${s.note ? `<div class="blocco prossima"><h4>Note</h4><p>${esc(s.note)}</p></div>` : ""}
          ${rata ? `<div class="blocco"><h4>Fa parte di</h4><p><button class="link" data-azione="apri-ricorrente" data-id="${rata.id}">${esc(rata.nome)}</button></p></div>` : ""}
        </div>
        <dl class="dati-scheda">
          ${dato("Data del documento", esc(dataIt(s.data_documento)))}
          ${dato("Categoria", esc(s.categoria))}
          ${dato("Documento", esc([s.tipo_documento, s.numero_documento ? `n. ${s.numero_documento}` : ""].filter(Boolean).join(" ")))}
          ${dato("Intestato a", s.intestato_a && s.intestato_a !== s.cassetto ? `<b>${esc(s.intestato_a)}</b>` : esc(s.intestato_a))}
          ${dato("P.IVA fornitore", esc(s.piva_fornitore))}
          ${dato("Importi", `imponibile ${esc(euro(s.imponibile))} · IVA ${esc(euro(s.iva))} · <b>totale ${esc(euro(s.totale))}</b>`)}
          ${dato("Mezzo di pagamento", esc(s.mezzo))}
          ${dato("Pagata il", esc(dataIt(s.data_pagamento)))}
          ${dato("Scadenza", esc(dataIt(s.scadenza)))}
          ${dato("File del documento", linkDocumento(s.file_documento))}
          ${dato("Arrivata da", esc(s.origine))}
        </dl>
      </div>
    </div>
    <footer><button class="btn chiaro" data-chiudi>Chiudi</button><button class="btn pericolo" data-azione="elimina-spesa" data-id="${s.id}">Elimina</button><button class="btn chiaro" data-azione="duplica-spesa" data-id="${s.id}">Duplica</button>${s.pagato === "no" ? `<button class="btn chiaro" data-azione="segna-pagata" data-id="${s.id}">Segna pagata</button>` : ""}${s.stato !== "ok" ? `<button class="btn chiaro" data-azione="spesa-ok" data-id="${s.id}">Controllata: segna OK</button>` : ""}<button class="btn pieno" data-azione="modifica-spesa" data-id="${s.id}">Modifica</button></footer>`);
}

function apriRicorrente(id) {
  const r = ricorrenteDi(id);
  if (!r) return;
  const pagamenti = stato.dati.spese.filter((s) => s.ricorrente_id === r.id).sort((a, b) => b.data_documento.localeCompare(a.data_documento));
  const prossime = inCorso(r) ? prossimeDate(r, 6) : [];
  const n = contaRate(r);
  apriFinestra(`
    ${testaFinestra(`${etichetta(FREQUENZE, r.frequenza)} · ${etichetta(CASSETTI, r.cassetto)}`, r.nome)}
    <div class="corpo">
      <div class="scorciatoie">${pill(STATI_RICORRENTE, r.stato)}${pill(CASSETTI, r.cassetto)}${r.prossima_scadenza && inCorso(r) ? pillTesto(`Prossima: ${dataIt(r.prossima_scadenza)}`, quandoTesto(r.prossima_scadenza)[1]) : ""}${r.crea_spesa === "no" ? pillTesto("Non crea una spesa quando la paghi", "grigio") : ""}</div>
      <div class="dettaglio">
        <div>
          ${r.note ? `<div class="blocco prossima"><h4>Note</h4><p>${esc(r.note)}</p></div>` : ""}
          ${prossime.length ? `<div class="blocco"><h4>Prossime scadenze previste</h4><div class="prossime-rate">${prossime.map((d) => pillTesto(dataIt(d), d < chiaveGiorno() ? "terracotta" : "grigio")).join("")}</div></div>` : ""}
          <div class="blocco"><h4>Pagamenti registrati dal sito</h4>
            ${pagamenti.length ? `<div class="elenco-breve">${pagamenti.slice(0, 6).map((s) => `<button class="cosa" data-azione="apri-spesa" data-id="${s.id}">${boxGiorno(s.data_documento)}<div><strong>${esc(euro(s.totale))}</strong><small>${esc(s.codice)} · pagata il ${esc(dataIt(s.data_pagamento))}${s.mezzo ? ` con ${esc(s.mezzo)}` : ""}</small></div></button>`).join("")}</div>` : `<p style="color:var(--inchiostro-tenue)">Ancora nessuno. I pagamenti fatti prima del sito sono nell'elenco delle spese (cerca "${esc(r.fornitore || r.nome)}").</p>`}
          </div>
        </div>
        <dl class="dati-scheda">
          ${dato("Importo previsto", esc(euro(r.importo)))}
          ${dato("Frequenza", esc(etichetta(FREQUENZE, r.frequenza)) + (r.giorno && r.frequenza !== "una_tantum" ? ` (giorno ${esc(r.giorno)})` : ""))}
          ${dato("Prossima scadenza", esc(dataIt(r.prossima_scadenza)))}
          ${dato("Ultima rata", esc(dataIt(r.ultima_scadenza)) + (n ? ` · ${n} rate ancora da pagare` : ""))}
          ${dato("Disdire entro", esc(dataIt(r.disdetta_entro)))}
          ${dato("Categoria", esc(r.categoria))}
          ${dato("Fornitore", esc(r.fornitore))}
          ${dato("Mezzo di pagamento", esc(r.mezzo))}
        </dl>
      </div>
    </div>
    <footer><button class="btn chiaro" data-chiudi>Chiudi</button><button class="btn pericolo" data-azione="elimina-ricorrente" data-id="${r.id}">Elimina</button><button class="btn chiaro" data-azione="modifica-ricorrente" data-id="${r.id}">Modifica</button>${inCorso(r) && r.prossima_scadenza ? `<button class="btn pieno" data-azione="paga" data-id="${r.id}">Segna pagata</button>` : ""}</footer>`);
}

function apriIncasso(id) {
  const f = incassoDi(id);
  if (!f) return;
  apriFinestra(`
    ${testaFinestra(`Fattura emessa · ${f.cassetto}`, `${f.numero} · ${euro(f.totale)}`)}
    <div class="corpo">
      <div class="scorciatoie">${pill(STATI_INCASSO, f.stato)}${pill(CASSETTI, f.cassetto)}</div>
      <div class="dettaglio">
        <div><div class="blocco"><h4>Descrizione</h4><p>${esc(f.descrizione || "—")}</p></div>${f.note ? `<div class="blocco prossima"><h4>Note</h4><p>${esc(f.note)}</p></div>` : ""}</div>
        <dl class="dati-scheda">
          ${dato("Cliente", esc(f.cliente))}
          ${dato("Data fattura", esc(dataIt(f.data_fattura)))}
          ${dato("Importi", `imponibile ${esc(euro(f.imponibile))} · IVA ${esc(euro(f.iva))} · <b>totale ${esc(euro(f.totale))}</b>`)}
          ${dato("Scadenza", esc(dataIt(f.scadenza)))}
          ${dato("Incassata il", esc(dataIt(f.data_incasso)))}
        </dl>
      </div>
    </div>
    <footer><button class="btn chiaro" data-chiudi>Chiudi</button><button class="btn pericolo" data-azione="elimina-incasso" data-id="${f.id}">Elimina</button><button class="btn chiaro" data-azione="modifica-incasso" data-id="${f.id}">Modifica</button>${f.stato === "da_incassare" ? `<button class="btn pieno" data-azione="incassa" data-id="${f.id}">Segna incassata</button>` : ""}</footer>`);
}

// ---------------------------------------------------------------- moduli (aggiungere e modificare)
function opzioni(lista, valore, vuota = "") {
  const voci = lista.map((x) => (Array.isArray(x) ? x : [x, x]));
  if (valore && !voci.some(([k]) => k === valore)) voci.push([valore, `${valore} (non più in elenco)`]);
  return `${vuota !== null ? `<option value="">${esc(vuota)}</option>` : ""}${voci.map(([k, t]) => `<option value="${esc(k)}" ${k === valore ? "selected" : ""}>${esc(t)}</option>`).join("")}`;
}
function campo(nome, chiave, valore = "", tipo = "text", aiuto = "", extra = "") {
  return `<label class="campo"><span>${esc(nome)}</span><input name="${chiave}" type="${tipo}" value="${esc(valore ?? "")}" ${extra} />${aiuto ? `<small>${aiuto}</small>` : ""}</label>`;
}
function importo(nome, chiave, valore, aiuto = "") {
  const testo = valore === null || valore === undefined || valore === "" ? "" : String(valore).replace(".", ",");
  return campo(nome, chiave, testo, "text", aiuto, `inputmode="decimal" placeholder="0,00"`);
}
function scelta(nome, chiave, valore, lista, vuota = null, aiuto = "") {
  return `<label class="campo"><span>${esc(nome)}</span><select name="${chiave}">${opzioni(lista, valore, vuota)}</select>${aiuto ? `<small>${aiuto}</small>` : ""}</label>`;
}
function area(nome, chiave, valore = "", aiuto = "", righe = 3) {
  return `<label class="campo"><span>${esc(nome)}</span>${aiuto ? `<small>${esc(aiuto)}</small>` : ""}<textarea name="${chiave}" rows="${righe}">${esc(valore)}</textarea></label>`;
}
function spunta(nome, chiave, acceso, aiuto) {
  return `<label class="spunta"><input type="checkbox" name="${chiave}" value="si" ${acceso ? "checked" : ""}/><span>${esc(nome)}<small>${esc(aiuto)}</small></span></label>`;
}
function piedeModulo(testo = "Salva") { return `<footer><button class="btn chiaro" type="button" data-chiudi>Annulla</button><button class="btn pieno" type="submit">${esc(testo)}</button></footer>`; }
const erroreFinestra = `<p class="avviso errore errore-finestra" hidden></p>`;
function categoriePer(cassetto, valore) {
  const prima = cassetto === "PERS" ? "Personale" : "Impresa";
  const dopo = prima === "Impresa" ? "Personale" : "Impresa";
  const gruppo = (vp, titolo) => `<optgroup label="${titolo}">${nomiCategorie(vp).sort((a, b) => a.localeCompare(b, "it")).map((c) => `<option ${c === valore ? "selected" : ""}>${esc(c)}</option>`).join("")}</optgroup>`;
  const extra = valore && !nomiCategorie().includes(valore) ? `<option selected>${esc(valore)}</option>` : "";
  return `<option value="">Scegli…</option>${extra}${gruppo(prima, `Categorie ${prima === "Impresa" ? "dell'impresa" : "personali"}`)}${gruppo(dopo, `Altre (${dopo})`)}`;
}
function avvisoMezzo(cassetto, mezzo) {
  const c = mezzoCassetto(mezzo);
  return c && c !== cassetto ? `Il mezzo «${mezzo}» è del cassetto ${c}: va bene se è andata così, ma ricordati di segnalarlo al commercialista.` : "";
}

function moduloSpesa(id, copia = null) {
  const base = { data_documento: chiaveGiorno(), cassetto: "DITTA", pagato: "si", stato: "ok", origine: "Sito", segnala: "no", tipo_documento: "Fattura elettronica" };
  const s = id ? spesaDi(id) : copia ? { ...copia, codice: "", data_documento: chiaveGiorno(), data_pagamento: "", numero_documento: "", file_documento: "", origine: "Sito", ricorrente_id: null } : base;
  const fornitori = [...new Set(stato.dati.spese.map((x) => x.fornitore).filter(Boolean))].sort((a, b) => a.localeCompare(b, "it"));
  apriFinestra(`
    ${testaFinestra(id ? s.codice : "Nuova spesa", id ? "Modifica la spesa" : copia ? "Nuova spesa (copiata)" : "Registra una spesa")}
    <form id="modulo" data-tipo="spesa" data-id="${id || ""}">
      <div class="corpo">
        ${erroreFinestra}
        <div class="griglia tre">
          ${campo("Data del documento", "data_documento", s.data_documento, "date", "", "required")}
          <label class="campo"><span>Cassetto</span><select name="cassetto" data-aggiorna-categorie>${opzioni(CASSETTI, s.cassetto, null)}</select></label>
          <label class="campo"><span>Categoria</span><select name="categoria" required>${categoriePer(s.cassetto, s.categoria)}</select></label>
        </div>
        <div class="griglia due">
          <label class="campo"><span>Fornitore</span><input name="fornitore" list="elenco-fornitori" value="${esc(s.fornitore || "")}" required data-fornitore /><datalist id="elenco-fornitori">${fornitori.map((f) => `<option value="${esc(f)}">`).join("")}</datalist><small>Se il fornitore è nuovo, scrivi il nome per intero: l'elenco mostra solo quelli già usati.</small><small class="suggerimento" data-avviso-fornitore></small></label>
          ${campo("Partita IVA del fornitore (facoltativa)", "piva_fornitore", s.piva_fornitore)}
        </div>
        <div class="griglia">${area("Descrizione", "descrizione", s.descrizione, "", 2)}</div>
        <div class="griglia tre">
          <label class="campo"><span>Tipo di documento</span><input name="tipo_documento" list="elenco-tipi" value="${esc(s.tipo_documento || "")}" /><datalist id="elenco-tipi">${TIPI_DOCUMENTO.map((t) => `<option value="${esc(t)}">`).join("")}</datalist></label>
          ${campo("Numero del documento", "numero_documento", s.numero_documento)}
          ${scelta("Intestato a", "intestato_a", s.intestato_a || s.cassetto, CASSETTI, null, "Di solito è lo stesso cassetto.")}
        </div>
        <div class="griglia tre">
          ${importo("Imponibile", "imponibile", s.imponibile, "Facoltativo.")}
          ${importo("IVA", "iva", s.iva, "Facoltativa.")}
          ${importo("Totale", "totale", s.totale, "Se lo lasci vuoto lo calcolo io: imponibile + IVA. Le note di credito vanno in negativo.")}
        </div>
        <div class="griglia tre">
          <label class="campo"><span>Mezzo di pagamento</span><select name="mezzo" data-controlla-mezzo>${opzioni(nomiMezzi(), s.mezzo, "Non indicato")}</select><small class="suggerimento" data-avviso-mezzo>${esc(avvisoMezzo(s.cassetto, s.mezzo))}</small></label>
          ${scelta("Pagata", "pagato", s.pagato, PAGATO, null, "Rateizzata = il debito si paga con un piano di rate, che segui in Scadenze e rate.")}
          ${campo("Pagata il", "data_pagamento", s.data_pagamento, "date")}
        </div>
        <div class="griglia tre">
          ${campo("Scadenza (se non è ancora pagata)", "scadenza", s.scadenza, "date")}
          <label class="campo"><span>File del documento</span><input name="file_documento" list="elenco-documenti" value="${esc(s.file_documento || "")}" /><datalist id="elenco-documenti">${stato.documenti.map((d) => `<option value="${esc(d.nome)}">`).join("")}</datalist><small>Copia il file nella cartella documenti\\spese e scrivi qui solo il nome (per esempio bolletta.pdf): poi lo apri con un clic.</small></label>
          <label class="campo"><span>Arrivata da</span><input name="origine" list="elenco-origini" value="${esc(s.origine || "")}" /><datalist id="elenco-origini">${ORIGINI.map((o) => `<option value="${o}">`).join("")}</datalist></label>
        </div>
        <div class="griglia due">
          ${scelta("Stato della riga", "stato", s.stato, STATI_RIGA, null, "OK = controllata. Da verificare o Da chiarire = c'è qualcosa da guardare.")}
          <div class="campo"><span>Commercialista</span>${spunta("Da segnalare al commercialista", "segnala", s.segnala === "si", "Per esempio le spese della casa che è anche sede della ditta e della società.")}</div>
        </div>
        <div class="griglia">${area("Note", "note", s.note, "", 3)}</div>
      </div>
      ${piedeModulo(id ? "Salva le modifiche" : "Registra la spesa")}
    </form>`);
}

function moduloRicorrente(id) {
  const r = id ? ricorrenteDi(id) : { cassetto: "DITTA", frequenza: "mensile", stato: "attivo", crea_spesa: "si", prossima_scadenza: chiaveGiorno() };
  apriFinestra(`
    ${testaFinestra(id ? "Scadenza o rata" : "Nuova scadenza o rata", id ? r.nome : "Abbonamento, rata o pagamento futuro")}
    <form id="modulo" data-tipo="ricorrente" data-id="${id || ""}">
      <div class="corpo">
        ${erroreFinestra}
        <p class="aiuto">Esempi: una rateizzazione dell'Agenzia delle Entrate-Riscossione, un abbonamento, il canone del telefono, un pagamento da fare una volta sola.</p>
        <div class="griglia due">
          ${campo("Nome", "nome", r.nome, "text", "Come la vuoi vedere nell'elenco.", "required")}
          ${campo("Fornitore o ente", "fornitore", r.fornitore)}
        </div>
        <div class="griglia tre">
          <label class="campo"><span>Cassetto</span><select name="cassetto" data-aggiorna-categorie>${opzioni(CASSETTI, r.cassetto, null)}</select></label>
          <label class="campo"><span>Categoria</span><select name="categoria">${categoriePer(r.cassetto, r.categoria)}</select></label>
          ${importo("Importo previsto", "importo", r.importo, "Se cambia ogni volta, scrivi il prossimo.")}
        </div>
        <div class="griglia tre">
          ${scelta("Ogni quanto", "frequenza", r.frequenza, FREQUENZE.map(([k, t]) => [k, t]), null)}
          ${campo("Prossima scadenza", "prossima_scadenza", r.prossima_scadenza, "date")}
          ${campo("Ultima rata (facoltativa)", "ultima_scadenza", r.ultima_scadenza, "date", "Dopo questa data la rata si chiude da sola.")}
        </div>
        <div class="griglia tre">
          ${campo("Giorno fisso del mese (facoltativo)", "giorno", r.giorno, "number", "Es. 31 = sempre l'ultimo giorno del mese.", `min="1" max="31"`)}
          ${campo("Disdire entro (facoltativo)", "disdetta_entro", r.disdetta_entro, "date")}
          <label class="campo"><span>Mezzo di pagamento</span><select name="mezzo">${opzioni(nomiMezzi(), r.mezzo, "Non indicato")}</select></label>
        </div>
        <div class="griglia due">
          ${scelta("Stato", "stato", r.stato, STATI_RICORRENTE, null)}
          <div class="campo"><span>Quando la paghi</span>${spunta("Registra anche la spesa", "crea_spesa", r.crea_spesa !== "no", "Togli la spunta per gli addebiti delle carte di credito: le singole spese sono già registrate e non vanno contate due volte.")}</div>
        </div>
        <div class="griglia">${area("Note", "note", r.note, "", 4)}</div>
      </div>
      ${piedeModulo(id ? "Salva le modifiche" : "Aggiungi")}
    </form>`);
}

function moduloPaga(id) {
  const r = ricorrenteDi(id);
  if (!r) return;
  const dopo = scadenzaDopo(r, r.prossima_scadenza);
  apriFinestra(`
    ${testaFinestra("Segna come pagata", r.nome)}
    <form id="modulo" data-tipo="paga" data-id="${id}">
      <div class="corpo">
        ${erroreFinestra}
        <div class="griglia tre">
          ${campo("Scadenza che hai pagato", "scadenza", r.prossima_scadenza, "date", "", "required")}
          ${campo("Pagata il", "data_pagamento", chiaveGiorno(), "date", "", "required")}
          ${importo("Importo pagato", "importo", r.importo)}
        </div>
        <div class="griglia due">
          <label class="campo"><span>Pagata con</span><select name="mezzo" data-controlla-mezzo data-cassetto="${esc(r.cassetto)}">${opzioni(nomiMezzi(), r.mezzo, "Non indicato")}</select><small class="suggerimento" data-avviso-mezzo>${esc(avvisoMezzo(r.cassetto, r.mezzo))}</small></label>
          ${r.frequenza !== "una_tantum" && dopo ? importo("Importo della prossima rata (facoltativo)", "importo_prossimo", "", `Scrivilo solo se cambia. La prossima scadenza sarà il <b>${esc(dataIt(dopo))}</b>.`) : `<p class="aiuto">${r.frequenza === "una_tantum" ? "È un pagamento da fare una volta sola: dopo averlo segnato risulterà finito." : "Era l'ultima rata: dopo averla segnata risulterà finita."}</p>`}
        </div>
        <div class="griglia">${spunta("Registra anche la spesa nell'elenco delle spese", "crea_spesa", r.crea_spesa !== "no", "Togli la spunta solo se le singole spese sono già registrate (per esempio l'addebito mensile di una carta di credito).")}</div>
        <div class="griglia">${spunta("Da segnalare al commercialista", "segnala", Boolean(avvisoMezzo(r.cassetto, r.mezzo)), "Per esempio se hai pagato con un conto di un altro cassetto.")}</div>
        <div class="griglia">${area("Note (facoltative)", "note", "", "", 2)}</div>
      </div>
      ${piedeModulo("Segna pagata")}
    </form>`, true);
}

function moduloSegnaPagata(id) {
  const s = spesaDi(id);
  if (!s) return;
  apriFinestra(`
    ${testaFinestra(s.codice, `Segna pagata: ${s.fornitore}`)}
    <form id="modulo" data-tipo="segna-pagata" data-id="${id}">
      <div class="corpo">
        ${erroreFinestra}
        <div class="griglia due">
          ${campo("Pagata il", "data_pagamento", s.scadenza && s.scadenza <= chiaveGiorno() ? s.scadenza : chiaveGiorno(), "date", "", "required")}
          <label class="campo"><span>Pagata con</span><select name="mezzo" data-controlla-mezzo data-cassetto="${esc(s.cassetto)}">${opzioni(nomiMezzi(), s.mezzo, "Non indicato")}</select><small class="suggerimento" data-avviso-mezzo>${esc(avvisoMezzo(s.cassetto, s.mezzo))}</small></label>
        </div>
        <p class="aiuto">Totale: <b>${esc(euro(s.totale))}</b>. Se l'importo addebitato è diverso, usa invece "Modifica".</p>
      </div>
      ${piedeModulo("Segna pagata")}
    </form>`, true);
}

function moduloIncasso(id) {
  const f = id ? incassoDi(id) : { cassetto: "SRLS", stato: "da_incassare", data_fattura: chiaveGiorno() };
  apriFinestra(`
    ${testaFinestra(id ? `Fattura ${f.numero}` : "Nuova fattura emessa", id ? "Modifica la fattura" : "Registra una fattura da incassare")}
    <form id="modulo" data-tipo="incasso" data-id="${id || ""}">
      <div class="corpo">
        ${erroreFinestra}
        <div class="griglia tre">
          ${scelta("Emessa da", "cassetto", f.cassetto, CASSETTI.filter(([k]) => k !== "PERS"), null)}
          ${campo("Numero", "numero", f.numero, "text", "", "required")}
          ${campo("Data della fattura", "data_fattura", f.data_fattura, "date", "", "required")}
        </div>
        <div class="griglia due">${campo("Cliente", "cliente", f.cliente, "text", "", "required")}${campo("Descrizione", "descrizione", f.descrizione)}</div>
        <div class="griglia tre">${importo("Imponibile", "imponibile", f.imponibile)}${importo("IVA", "iva", f.iva)}${importo("Totale", "totale", f.totale, "Le note di credito vanno in negativo.")}</div>
        <div class="griglia tre">${campo("Scadenza", "scadenza", f.scadenza, "date")}${scelta("Stato", "stato", f.stato, STATI_INCASSO, null)}${campo("Incassata il", "data_incasso", f.data_incasso, "date")}</div>
        <div class="griglia">${area("Note", "note", f.note, "", 3)}</div>
      </div>
      ${piedeModulo(id ? "Salva le modifiche" : "Registra la fattura")}
    </form>`);
}

function moduloIncassa(id) {
  const f = incassoDi(id);
  apriFinestra(`
    ${testaFinestra(`Fattura ${f.numero}`, "Segna come incassata")}
    <form id="modulo" data-tipo="incassa" data-id="${id}">
      <div class="corpo">${erroreFinestra}<div class="griglia">${campo("Incassata il", "data_incasso", chiaveGiorno(), "date", "", "required")}</div><p class="aiuto">${esc(f.cliente)} · ${esc(euro(f.totale))}</p></div>
      ${piedeModulo("Segna incassata")}
    </form>`, true);
}

const MODULI_SEMPLICI = {
  budget: { titolo: "Budget mensile", lista: "budget", campi: (b) => `<div class="griglia tre">${scelta("Cassetto", "cassetto", b.cassetto || "PERS", CASSETTI, null)}<label class="campo"><span>Categoria</span><select name="categoria" required>${categoriePer(b.cassetto || "PERS", b.categoria)}</select></label>${importo("Quanto al mese", "importo", b.importo)}</div><div class="griglia">${campo("Note", "note", b.note)}</div>` },
  cassetto: { titolo: "Cassetto", lista: "cassetti", campi: (c) => `<div class="griglia due">${campo("Codice", "codice", c.codice, "text", "Non cambiarlo: lo usano tutte le spese.", "readonly")}${campo("Nome", "nome", c.nome)}</div><div class="griglia tre">${campo("Tipo", "tipo", c.tipo)}${campo("Partita IVA", "partita_iva", c.partita_iva)}${campo("Codice fiscale", "codice_fiscale", c.codice_fiscale)}</div><div class="griglia due">${campo("Regime", "regime", c.regime)}${campo("Note", "note", c.note)}</div>` },
  mezzo: { titolo: "Mezzo di pagamento", lista: "mezzi", campi: (m) => `<p class="attenzione">Scrivi solo un nome breve: mai numeri di carta interi o codici IBAN.</p><div class="griglia tre">${campo("Nome breve", "nome", m.nome, "text", "", "required")}${scelta("Cassetto", "cassetto", m.cassetto || "", [["", "Più cassetti"], ...CASSETTI], null)}${scelta("In uso", "attivo", m.attivo || "si", SI_NO, null)}</div><div class="griglia">${campo("Note", "note", m.note)}</div>` },
  categoria: { titolo: "Categoria", lista: "categorie", campi: (c) => `<div class="griglia tre">${campo("Nome", "nome", c.nome, "text", c.id ? "Se cambi il nome, le spese già registrate restano con il nome vecchio." : "", "required")}${scelta("Vale per", "vale_per", c.vale_per || "Impresa", ["Impresa", "Personale"], null)}${scelta("In uso", "attiva", c.attiva || "si", SI_NO, null)}</div><div class="griglia">${campo("Esempi", "esempi", c.esempi)}</div>` },
  quota: { titolo: "Quota di uso promiscuo", lista: "quote", campi: (q) => `<p class="attenzione">Solo quote decise con il commercialista.</p><div class="griglia tre">${campo("Categoria", "categoria", q.categoria, "text", "", "required")}${campo("Fornitore (facoltativo)", "fornitore", q.fornitore)}${importo("Quota impresa (%)", "quota", q.quota, "Es. 50")}</div><div class="griglia due">${scelta("Cassetto impresa", "cassetto_impresa", q.cassetto_impresa || "DITTA", CASSETTI.filter(([k]) => k !== "PERS"), null)}${campo("Chi l'ha decisa e quando", "decisa", q.decisa, "text", "", "required")}</div>` },
};
function moduloSemplice(tipo, id) {
  const def = MODULI_SEMPLICI[tipo];
  const elemento = id ? stato.dati[def.lista].find((x) => x.id === Number(id)) : {};
  apriFinestra(`
    ${testaFinestra(def.titolo, id ? "Modifica" : "Aggiungi")}
    <form id="modulo" data-tipo="${tipo}" data-id="${id || ""}">
      <div class="corpo">${erroreFinestra}${def.campi(elemento)}</div>
      <footer>${id && tipo !== "cassetto" ? `<button class="btn pericolo" type="button" data-azione="elimina-semplice" data-tipo="${tipo}" data-id="${id}">Elimina</button>` : ""}<button class="btn chiaro" type="button" data-chiudi>Annulla</button><button class="btn pieno" type="submit">Salva</button></footer>
    </form>`, true);
}

// ---------------------------------------------------------------- invio dei moduli
finestra.addEventListener("submit", async (evento) => {
  const form = evento.target.closest("#modulo");
  if (!form) return;
  evento.preventDefault();
  const dati = Object.fromEntries(new FormData(form).entries());
  form.querySelectorAll("input[type=checkbox]").forEach((c) => { dati[c.name] = c.checked ? "si" : "no"; });
  const id = Number(form.dataset.id) || 0;
  const tipo = form.dataset.tipo;
  try {
    if (tipo === "spesa") {
      dati.file_documento = soloNomeFile(dati.file_documento);
      const r = await salva(id ? `spesa?id=${id}` : "spesa", id ? "PATCH" : "POST", dati, id ? "Modifiche salvate." : "Spesa registrata.");
      apriSpesa(id || r.id);
    } else if (tipo === "ricorrente") {
      const r = await salva(id ? `ricorrente?id=${id}` : "ricorrente", id ? "PATCH" : "POST", dati, id ? "Modifiche salvate." : "Scadenza aggiunta.");
      apriRicorrente(id || r.id);
    } else if (tipo === "paga") {
      const r = await salva("paga", "POST", { id, ...dati });
      chiudiFinestra();
      avviso(r.prossima ? `Fatto. Prossima scadenza: ${dataIt(r.prossima)}.` : "Fatto. Non ci sono altre scadenze: ora risulta finita.");
    } else if (tipo === "segna-pagata") {
      await salva(`spesa?id=${id}`, "PATCH", { pagato: "si", data_pagamento: dati.data_pagamento, mezzo: dati.mezzo }, "Spesa segnata come pagata.");
      chiudiFinestra();
    } else if (tipo === "incasso") {
      const r = await salva(id ? `incasso?id=${id}` : "incasso", id ? "PATCH" : "POST", dati, id ? "Modifiche salvate." : "Fattura registrata.");
      apriIncasso(id || r.id);
    } else if (tipo === "incassa") {
      await salva("incassa", "POST", { id, data_incasso: dati.data_incasso }, "Fattura segnata come incassata.");
      chiudiFinestra();
    } else if (MODULI_SEMPLICI[tipo]) {
      await salva(id ? `${tipo}?id=${id}` : tipo, id ? "PATCH" : "POST", dati, "Salvato.");
      chiudiFinestra();
    }
  } catch { /* il messaggio è già nella finestra */ }
});

app.addEventListener("submit", async (evento) => {
  if (evento.target.id !== "form-impostazioni") return;
  evento.preventDefault();
  try { await salva("impostazioni", "POST", Object.fromEntries(new FormData(evento.target).entries()), "Avvisi salvati."); } catch { /* già mostrato */ }
});

// ---------------------------------------------------------------- clic
async function elimina(percorso, domanda, messaggio) {
  if (!window.confirm(domanda)) return;
  try { await salva(percorso, "DELETE", null, messaggio); chiudiFinestra(); } catch { /* già mostrato */ }
}
async function gestisciClic(evento) {
  // La finestra si chiude SOLO con i pulsanti Chiudi / Annulla / ×: un clic fuori (per esempio finendo una selezione per il copia e incolla) non la chiude
  if (evento.target.closest("[data-chiudi]")) { chiudiFinestra(); return; }
  const vaiA = evento.target.closest("[data-vai]");
  if (vaiA) { chiudiFinestra(); vai(vaiA.dataset.vai); return; }
  const el = evento.target.closest("[data-azione]");
  if (!el) return;
  const id = Number(el.dataset.id) || 0;
  switch (el.dataset.azione) {
    case "chiudi-avviso": stato.avviso = null; disegna(); break;
    case "nuova-spesa": moduloSpesa(0); break;
    case "nuova-ricorrente": moduloRicorrente(0); break;
    case "nuovo-incasso": moduloIncasso(0); break;
    case "nuovo-budget": moduloSemplice("budget", 0); break;
    case "modifica-budget": moduloSemplice("budget", id); break;
    case "modifica-cassetto": moduloSemplice("cassetto", id); break;
    case "nuovo-mezzo": moduloSemplice("mezzo", 0); break;
    case "modifica-mezzo": moduloSemplice("mezzo", id); break;
    case "nuova-categoria": moduloSemplice("categoria", 0); break;
    case "modifica-categoria": moduloSemplice("categoria", id); break;
    case "nuova-quota": moduloSemplice("quota", 0); break;
    case "modifica-quota": moduloSemplice("quota", id); break;
    case "elimina-semplice": elimina(`${el.dataset.tipo}?id=${id}`, "Vuoi davvero eliminarlo?", "Eliminato."); break;
    case "apri-spesa": apriSpesa(id); break;
    case "modifica-spesa": moduloSpesa(id); break;
    case "duplica-spesa": moduloSpesa(0, spesaDi(id)); break;
    case "segna-pagata": moduloSegnaPagata(id); break;
    case "spesa-ok": try { await salva(`spesa?id=${id}`, "PATCH", { stato: "ok" }, "Riga segnata come controllata."); apriSpesa(id); } catch { /* già mostrato */ } break;
    case "elimina-spesa": elimina(`spesa?id=${id}`, `Vuoi davvero eliminare la spesa ${spesaDi(id)?.codice}? Resterà traccia nello storico.`, "Spesa eliminata."); break;
    case "apri-ricorrente": apriRicorrente(id); break;
    case "modifica-ricorrente": moduloRicorrente(id); break;
    case "elimina-ricorrente": elimina(`ricorrente?id=${id}`, "Vuoi davvero eliminare questa scadenza? Le spese già pagate restano.", "Scadenza eliminata."); break;
    case "paga": moduloPaga(id); break;
    case "apri-incasso": apriIncasso(id); break;
    case "modifica-incasso": moduloIncasso(id); break;
    case "incassa": moduloIncassa(id); break;
    case "elimina-incasso": elimina(`incasso?id=${id}`, "Vuoi davvero eliminare questa fattura?", "Fattura eliminata."); break;
    case "pagina-spese": stato.pagina = Number(el.dataset.pagina); disegna(); window.scrollTo(0, 0); break;
    case "pagina-scad": stato.scad.pagina = Number(el.dataset.pagina); disegna(); window.scrollTo(0, 0); break;
    case "pagina-fatt": stato.fatt.pagina = Number(el.dataset.pagina); disegna(); break;
    case "pagina-storico": stato.storico.pagina = Number(el.dataset.pagina); disegna(); break;
    case "pagina-categorie": stato.imp.paginaCategorie = Number(el.dataset.pagina); disegna(); break;
    case "pagina-comm": stato.comm.pagina = Number(el.dataset.pagina); disegna(); break;
    case "gruppo-scad": stato.scad.gruppo = el.dataset.valore; stato.scad.pagina = 1; disegna(); break;
    case "gruppo-fatt": stato.fatt.gruppo = el.dataset.valore; stato.fatt.pagina = 1; disegna(); break;
    case "cassetto-riepilogo": stato.cassettoRiepilogo = el.dataset.valore; disegna(); break;
    case "azzera-filtri": stato.filtri = { ...FILTRI_VUOTI }; stato.pagina = 1; disegna(); break;
    case "filtra-speciale": {
      const v = el.dataset.speciale;
      stato.filtri = { ...FILTRI_VUOTI };
      if (["da_chiarire", "da_verificare"].includes(v)) stato.filtri.stato = v;
      else if (v === "non_pagate") stato.filtri.pagato = "no";
      else stato.filtri.speciale = v;
      stato.pagina = 1; vai("spese"); break;
    }
    case "filtra-mese": stato.filtri = { ...FILTRI_VUOTI, anno: el.dataset.mese.slice(0, 4), mese: el.dataset.mese.slice(5, 7) }; stato.pagina = 1; vai("spese"); break;
    case "vai-spese":
      stato.filtri = { ...FILTRI_VUOTI, cassetto: el.dataset.cassetto || "", anno: el.dataset.anno || "", mese: el.dataset.mese || "", categoria: el.dataset.categoria || "" };
      stato.pagina = 1; vai("spese"); break;
    case "periodo-comm": stato.comm.da = el.dataset.da; stato.comm.a = el.dataset.a; caricaCommercialista(); break;
    case "anteprima-comm": caricaCommercialista(); break;
    case "stampa-comm": stampaCommercialista(); break;
    case "backup":
      try {
        const r = await fetch("/api/sistema/backup", { method: "POST" });
        const d = await r.json();
        if (!r.ok) throw new Error(d.errore);
        avviso(d.messaggio || `Copia di sicurezza fatta: backup\\${d.file}`);
      } catch (e) { avviso(`Copia non riuscita: ${e.message || e}`, "errore"); }
      break;
    case "ripristina": document.getElementById("file-ripristino").click(); break;
    case "scegli-xml": document.getElementById("file-xml").click(); break;
    case "prova-xml": leggiFileFatture(window.IoInOrdineDemo.fattureEsempio()); break;
    case "svuota-import": stato.importa = { documenti: [], errori: [], gruppo: "nuove", pagina: 1, lettura: "" }; disegna(); break;
    case "gruppo-import": stato.importa.gruppo = el.dataset.valore; stato.importa.pagina = 1; disegna(); break;
    case "pagina-import": stato.importa.pagina = Number(el.dataset.pagina); disegna(); window.scrollTo(0, 0); break;
    case "conferma-import": {
      const scelte = stato.importa.documenti.filter((d) => d.scelta && gruppoDoc(d) !== "saltate");
      if (!window.confirm(`Importo ${scelte.length} fatture come spese?`)) break;
      try {
        const r = await salva("importa-fatture", "POST", { documenti: scelte });
        stato.importa = { documenti: [], errori: [], gruppo: "nuove", pagina: 1, lettura: "" };
        stato.filtri = { ...FILTRI_VUOTI }; stato.pagina = 1;
        vai("spese");
        avviso(r.importate === 1 ? "Importata 1 fattura: la trovi qui sotto, in ordine di data." : `Importate ${r.importate} fatture: le trovi qui sotto, in ordine di data.`);
      } catch { /* già mostrato */ }
      break;
    }
    default: break;
  }
}
app.addEventListener("click", gestisciClic);
finestra.addEventListener("click", gestisciClic);

// ---------------------------------------------------------------- campi che cambiano
function mantieniFuoco(selettore, t) {
  const posizione = t.selectionStart;
  disegna();
  const nuovo = app.querySelector(selettore);
  if (nuovo) { nuovo.focus(); nuovo.setSelectionRange(posizione, posizione); }
}
app.addEventListener("input", (evento) => {
  const t = evento.target;
  if (t.matches("[data-filtro='testo']")) { stato.filtri.testo = t.value; stato.pagina = 1; mantieniFuoco("[data-filtro='testo']", t); }
  if (t.matches("[data-filtro-scad='testo']")) { stato.scad.testo = t.value; stato.scad.pagina = 1; mantieniFuoco("[data-filtro-scad='testo']", t); }
  if (t.matches("[data-filtro-storico]")) { stato.storico.testo = t.value; stato.storico.pagina = 1; mantieniFuoco("[data-filtro-storico]", t); }
});
app.addEventListener("change", (evento) => {
  const t = evento.target;
  if (t.matches("[data-import-scelta]")) { stato.importa.documenti[Number(t.dataset.importScelta)].scelta = t.checked; disegna(); return; }
  if (t.matches("[data-import]")) {
    const d = stato.importa.documenti[Number(t.dataset.import)];
    d[t.dataset.campo] = t.value;
    if (t.dataset.campo === "cassetto") {
      const valePer = t.value === "PERS" ? "Personale" : "Impresa";
      if (d.categoria && !nomiCategorie(valePer).includes(d.categoria)) d.categoria = "";
      if (!d.mezzo || (mezzoCassetto(d.mezzo) && mezzoCassetto(d.mezzo) !== t.value)) d.mezzo = { SRLS: "Conto della società", DITTA: "Conto della ditta", PERS: "" }[t.value] || "";
    }
    disegna(); return;
  }
  if (t.matches("select[data-filtro]")) { stato.filtri[t.dataset.filtro] = t.value; stato.pagina = 1; disegna(); }
  if (t.matches("select[data-filtro-scad]")) { stato.scad[t.dataset.filtroScad] = t.value; stato.scad.pagina = 1; disegna(); }
  if (t.matches("[data-azione-cambia='anno-riepilogo']")) { stato.annoRiepilogo = t.value; disegna(); }
  if (t.matches("[data-azione-cambia='mese-budget']") && t.value) { stato.meseBudget = t.value; disegna(); }
  if (t.matches("[data-comm]")) { stato.comm[t.dataset.comm] = t.value; stato.comm.dati = null; disegna(); }
  if (t.matches("[data-comm-cassetto]")) {
    const scelti = [...app.querySelectorAll("[data-comm-cassetto]:checked")].map((c) => c.dataset.commCassetto);
    stato.comm.cassetti = scelti.length ? scelti : ["SRLS", "DITTA"];
    stato.comm.dati = null; disegna();
  }
});
// Fornitore già usato: riempie i campi ancora vuoti con i dati della sua ultima spesa
function compilaDaFornitore(form) {
  const campoNome = form.querySelector("[data-fornitore]");
  const box = form.querySelector("[data-avviso-fornitore]");
  if (!campoNome || !box) return;
  const nome = minuscolo(campoNome.value.trim());
  const cassetto = form.querySelector("select[name=cassetto]").value;
  const precedenti = stato.dati.spese.filter((x) => minuscolo(x.fornitore) === nome && x.id !== Number(form.dataset.id))
    .sort((a, b) => b.data_documento.localeCompare(a.data_documento));
  const ultima = precedenti.find((x) => x.cassetto === cassetto) || precedenti[0];
  if (!nome || !ultima) { box.textContent = ""; return; }
  const riempiti = [];
  const piva = form.querySelector("input[name=piva_fornitore]");
  if (piva && !piva.value && ultima.piva_fornitore) { piva.value = ultima.piva_fornitore; riempiti.push("partita IVA"); }
  if (ultima.cassetto === cassetto) {
    const categoria = form.querySelector("select[name=categoria]");
    if (categoria && !categoria.value && ultima.categoria) { categoria.innerHTML = categoriePer(cassetto, ultima.categoria); riempiti.push("categoria"); }
    const mezzo = form.querySelector("select[name=mezzo]");
    if (mezzo && !mezzo.value && ultima.mezzo && [...mezzo.options].some((o) => o.value === ultima.mezzo)) {
      mezzo.value = ultima.mezzo; riempiti.push("mezzo di pagamento");
      const avvisoM = form.querySelector("[data-avviso-mezzo]");
      if (avvisoM) avvisoM.textContent = avvisoMezzo(cassetto, mezzo.value);
    }
  }
  box.textContent = riempiti.length ? `Ho preso ${riempiti.join(", ")} dall'ultima spesa di questo fornitore (${ultima.codice} del ${dataIt(ultima.data_documento)}): controlla che vadano bene.` : "";
}
finestra.addEventListener("input", (evento) => {
  if (evento.target.matches("[data-fornitore]") && evento.inputType !== "insertText") compilaDaFornitore(evento.target.closest("form")); // scelta dall'elenco
});
finestra.addEventListener("change", (evento) => {
  const t = evento.target;
  const form = t.closest("form");
  if (!form) return;
  if (t.matches("[data-fornitore]")) compilaDaFornitore(form);
  if (t.matches("[data-aggiorna-categorie]") || (t.name === "cassetto" && form.dataset.tipo === "budget")) {
    const sel = form.querySelector("select[name=categoria]");
    if (sel) sel.innerHTML = categoriePer(t.value, sel.value);
    const intestato = form.querySelector("select[name=intestato_a]");
    if (intestato) intestato.value = t.value;
  }
  if (t.matches("[data-controlla-mezzo]") || t.name === "cassetto") {
    const mezzo = form.querySelector("[data-controlla-mezzo]");
    const cassetto = form.querySelector("select[name=cassetto]")?.value || mezzo?.dataset.cassetto || "";
    const box = form.querySelector("[data-avviso-mezzo]");
    if (box && mezzo) box.textContent = avvisoMezzo(cassetto, mezzo.value);
  }
  if (t.name === "pagato" && t.value === "si") {
    const data = form.querySelector("input[name=data_pagamento]");
    if (data && !data.value) data.value = chiaveGiorno();
  }
});
// Il tasto Esc chiude le schede da leggere, ma non i moduli in cui si sta scrivendo (si perderebbe il lavoro)
document.addEventListener("keydown", (evento) => { if (evento.key === "Escape" && finestra.innerHTML && !finestra.querySelector("form")) chiudiFinestra(); });

document.getElementById("file-xml").addEventListener("change", (evento) => {
  const files = [...evento.target.files];
  evento.target.value = "";
  if (files.length) leggiFileFatture(files);
});

document.getElementById("file-ripristino").addEventListener("change", async (evento) => {
  const file = evento.target.files[0];
  evento.target.value = "";
  if (!file) return;
  try {
    const dati = JSON.parse(await file.text());
    if (dati.formato !== "spese-1") throw new Error("questo file non è un file di trasferimento della sezione Spese.");
    if (!window.confirm(`Nel file ci sono ${dati.spese?.length || 0} spese e ${dati.ricorrenti?.length || 0} scadenze. TUTTI i dati attuali della sezione Spese verranno sostituiti. Procedo?`)) return;
    const copia = await fetch("/api/sistema/backup", { method: "POST" });
    if (!copia.ok) throw new Error("non riesco a fare prima la copia di sicurezza: ripristino annullato.");
    const r = await salva("ripristina", "POST", { dati });
    avviso(`Ripristino fatto: ${r.conteggi.spese} spese, ${r.conteggi.ricorrenti} scadenze, ${r.conteggi.incassi} fatture.`);
  } catch (e) {
    avviso(`Ripristino non riuscito: ${e.message}`, "errore");
  }
});

// Link diretti dalla pagina iniziale: #spesa-12, #ricorrente-3, #incasso-2
function apriDaIndirizzo() {
  const m = location.hash.match(/^#(spesa|ricorrente|incasso)-(\d+)$/);
  if (!m) return false;
  const vista = { spesa: "spese", ricorrente: "scadenze", incasso: "fatture" }[m[1]];
  history.replaceState(null, "", `#${stato.vista = vista}`);
  disegna();
  ({ spesa: apriSpesa, ricorrente: apriRicorrente, incasso: apriIncasso })[m[1]](Number(m[2]));
  return true;
}
window.addEventListener("hashchange", () => {
  if (apriDaIndirizzo()) return;
  const v = location.hash.slice(1);
  if (v && v !== stato.vista && VISTE.some(([k]) => k === v)) { stato.vista = v; disegna(); }
});
if (/^#(spesa|ricorrente|incasso)-/.test(location.hash)) stato.vista = "panoramica";
if (!VISTE.some(([k]) => k === stato.vista)) stato.vista = "panoramica";

// Quando torni sul sito (per esempio dopo aver copiato un file con Esplora file) rileggo l'elenco dei documenti
window.addEventListener("focus", async () => {
  await caricaDocumenti();
  const aperta = finestra.querySelector("[data-azione='modifica-spesa']");
  if (aperta && !finestra.querySelector("form")) apriSpesa(Number(aperta.dataset.id));
});

disegna();
Promise.all([ricarica(), caricaDocumenti()]).then(apriDaIndirizzo);
