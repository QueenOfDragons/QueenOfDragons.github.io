"use strict";
/* Benessere personale: interfaccia della sezione.
   I dati arrivano da /api/benessere/... e restano nel file data/sito.sqlite3 sul computer. */

const API = "/api/benessere";
const PER_PAGINA = 10;

// ---------------------------------------------------------------- liste di valori (uguali a modulo.py)
const AREE = [["abitudini", "Abitudini quotidiane"], ["aspetto", "Cura dell'aspetto"], ["movimento", "Movimento"], ["alimentazione", "Alimentazione"], ["umore", "Umore e mente"], ["farmaci", "Farmaci e integratori"]];
const FONTI = [["manuale", "La segno io"], ["movimento", "Automatica: minuti di movimento del giorno"], ["sonno", "Automatica: ore di sonno scritte in \"Come stai\""], ["diario", "Automatica: quando scelgo l'umore del giorno"], ["farmaci", "Automatica: quando ho preso tutte le dosi del giorno"]];
const UMORI = [[1, "😣", "Molto giù"], [2, "🙁", "Giù"], [3, "😐", "Così così"], [4, "🙂", "Bene"], [5, "😄", "Molto bene"]];
const ENERGIE = [[1, "🪫", "Molto bassa"], [2, "🥱", "Bassa"], [3, "🙂", "Normale"], [4, "💪", "Buona"], [5, "⚡", "Tanta"]];
const QUALITA_SONNO = [[1, "Pessimo"], [2, "Agitato"], [3, "Normale"], [4, "Buono"], [5, "Ottimo"]];
const PAROLE = ["Serena", "Contenta", "Grata", "Carica", "Concentrata", "Creativa", "Tranquilla", "Stanca", "Nervosa", "Preoccupata", "Triste", "Annoiata", "Sola", "Arrabbiata", "Sotto pressione"];
const TIPI_ATTIVITA = ["Camminata", "Camminata veloce", "Ginnastica", "Yoga", "Pilates", "Stretching", "Bicicletta", "Cyclette", "Nuoto", "Ballo", "Lavori in casa o giardino", "Altro"];
const INTENSITA = [["leggera", "Leggera"], ["media", "Media"], ["intensa", "Intensa"]];
const MOMENTI = [["colazione", "Colazione"], ["spuntino", "Spuntino"], ["pranzo", "Pranzo"], ["merenda", "Merenda"], ["cena", "Cena"], ["altro", "Altro"]];
const ETICHETTE_PASTO = ["Verdura", "Frutta", "Legumi", "Pesce", "Carne", "Uova", "Cereali integrali", "Latticini", "Dolce", "Fatto in casa", "Fuori casa", "Di corsa"];
const TIPI_FARMACO = [["farmaco", "Farmaco"], ["integratore", "Integratore"], ["altro", "Altro"]];
const CATEGORIE = [["medico", "Medico di base"], ["specialista", "Visita specialistica"], ["dentista", "Dentista"], ["esami", "Esami e analisi"], ["screening", "Controllo periodico"], ["fisioterapia", "Fisioterapia"], ["parrucchiere", "Parrucchiere"], ["estetista", "Estetista"], ["altro", "Altro"]];
const STATI_APP = [["da_prenotare", "Da prenotare", "ambra"], ["programmato", "Prenotato", "cielo"], ["fatto", "Fatto", "salvia"], ["annullato", "Annullato", "grigio"]];
const USI = [["viso", "Viso"], ["corpo", "Corpo"], ["capelli", "Capelli"], ["unghie", "Unghie"], ["trucco", "Trucco"], ["solari", "Solari"], ["altro", "Altro"]];
const STATI_PRODOTTO = [["in_uso", "In uso", "salvia"], ["da_aprire", "Da aprire", "cielo"], ["da_comprare", "Da comprare", "ambra"], ["finito", "Finito", "grigio"]];
const RICOMPRARE = [["", "Non so ancora"], ["si", "Sì"], ["forse", "Forse"], ["no", "No"]];
const RIPETI = [[0, "Non si ripete"], [1, "Ogni mese"], [2, "Ogni 2 mesi"], [3, "Ogni 3 mesi"], [4, "Ogni 4 mesi"], [6, "Ogni 6 mesi"], [12, "Ogni anno"], [24, "Ogni 2 anni"], [36, "Ogni 3 anni"]];
const ICONE = ["💧", "🌙", "🌿", "🚶", "🧴", "✨", "🥗", "🍎", "🌸", "📝", "💊", "🧘", "📖", "🎵", "☀️", "🦷", "💇", "💅", "🛁", "😴", "☕", "🍵", "❤️", "🙏", "📵", "🧹", "•"];
const GIORNI_SETT = [["1", "Lun"], ["2", "Mar"], ["3", "Mer"], ["4", "Gio"], ["5", "Ven"], ["6", "Sab"], ["7", "Dom"]];
const VISTE = [["oggi", "Oggi"], ["settimana", "La mia settimana"], ["umore", "Umore e diario"], ["movimento", "Movimento"], ["alimentazione", "Alimentazione"], ["farmaci", "Farmaci e integratori"], ["visite", "Visite e controlli"], ["aspetto", "Cura dell'aspetto"], ["medico", "Per il medico"], ["impostazioni", "Impostazioni"], ["esporta", "Esporta e backup"]];

const stato = {
  dati: { abitudini: [], registro: [], diario: [], attivita: [], pasti: [], farmaci: [], assunzioni: [], appuntamenti: [], prodotti: [], impostazioni: { obiettivo_movimento: 150, giorni_avviso: 7 } },
  vista: location.hash.slice(1) || "oggi",
  giorno: chiaveGiorno(),
  lunedi: lunediDi(chiaveGiorno()),
  meseUmore: chiaveGiorno().slice(0, 7),
  pag: { movimento: 1, pasti: 1, visite: 1, prodotti: 1, cose: 1 },
  filtri: { pasti: "", movimento: "", gruppoVisite: "programmato", gruppoFarmaci: "attivi", gruppoProdotti: "in_uso" },
  medico: { da: spostaGiorni(-90), a: chiaveGiorno(), dati: null },
  avviso: null,
};
const app = document.getElementById("app");
const finestra = document.getElementById("finestra");

// ---------------------------------------------------------------- piccoli aiuti
function chiaveGiorno(d = new Date()) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
function daChiave(k) { return new Date(`${k}T12:00:00`); }
function spostaGiorni(n, da = chiaveGiorno()) { const d = daChiave(da); d.setDate(d.getDate() + n); return chiaveGiorno(d); }
function lunediDi(k) { const d = daChiave(k); return spostaGiorni(-((d.getDay() + 6) % 7), k); }
function giornoSett(k) { return String(((daChiave(k).getDay() + 6) % 7) + 1); } // 1 = lunedì
function aggiungiMesi(k, mesi) { const d = daChiave(k); const g = d.getDate(); d.setDate(1); d.setMonth(d.getMonth() + mesi); d.setDate(Math.min(g, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate())); return chiaveGiorno(d); }
function giorniTra(a, b) { return Math.round((daChiave(b) - daChiave(a)) / 86400000); }
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const etichetta = (lista, valore) => (lista.find((x) => String(x[0]) === String(valore)) || [valore, valore || "—"])[1];
const tono = (lista, valore) => (lista.find((x) => x[0] === valore) || [])[2] || "grigio";
const pill = (lista, valore) => `<span class="pill tono-${tono(lista, valore)}"><i></i>${esc(etichetta(lista, valore))}</span>`;
const pillTesto = (testo, colore = "grigio") => `<span class="pill tono-${colore}">${esc(testo)}</span>`;
const numeroIt = (v, dec = 1) => (v === null || v === undefined || v === "" ? "—" : new Intl.NumberFormat("it-IT", { maximumFractionDigits: dec }).format(Number(v)));
function dataIt(k) { return k ? new Intl.DateTimeFormat("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" }).format(daChiave(k)) : ""; }
function dataLunga(k) { return new Intl.DateTimeFormat("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(daChiave(k)); }
function dataMedia(k) { return new Intl.DateTimeFormat("it-IT", { weekday: "short", day: "numeric", month: "short" }).format(daChiave(k)); }
function boxGiorno(k) { const d = daChiave(k); return `<div class="giorno"><b>${d.getDate()}</b><span>${esc(new Intl.DateTimeFormat("it-IT", { month: "short" }).format(d))}${d.getFullYear() !== new Date().getFullYear() ? ` ${String(d.getFullYear()).slice(2)}` : ""}</span></div>`; }
function quandoTesto(k) {
  const g = giorniTra(chiaveGiorno(), k);
  if (g < 0) return [`${-g} ${-g === 1 ? "giorno" : "giorni"} fa`, "grigio"];
  if (g === 0) return ["Oggi", "lavanda"];
  if (g === 1) return ["Domani", "ambra"];
  return [`Tra ${g} giorni`, g <= stato.dati.impostazioni.giorni_avviso ? "ambra" : "grigio"];
}
function momentoAdesso() { const h = new Date().getHours(); return h < 10 ? "colazione" : h < 12 ? "spuntino" : h < 15 ? "pranzo" : h < 18 ? "merenda" : "cena"; }
const fetta = (lista, pagina) => lista.slice((pagina - 1) * PER_PAGINA, pagina * PER_PAGINA);
function paginaValida(n, pagina) { return Math.min(Math.max(1, pagina), Math.max(1, Math.ceil(n / PER_PAGINA))); }
function paginazione(totale, pagina, chiave) {
  const pagine = Math.max(1, Math.ceil(totale / PER_PAGINA));
  if (pagine === 1) return "";
  return `<nav class="pagine"><button class="btn chiaro piccolo" data-azione="pagina" data-chiave="${chiave}" data-pagina="${pagina - 1}" ${pagina <= 1 ? "disabled" : ""}>← Precedenti</button><span>Pagina ${pagina} di ${pagine}</span><button class="btn chiaro piccolo" data-azione="pagina" data-chiave="${chiave}" data-pagina="${pagina + 1}" ${pagina >= pagine ? "disabled" : ""}>Successive →</button></nav>`;
}
function intro(titolo, testo, bottone = "") { return `<section class="intro"><div><h2>${esc(titolo)}</h2><p>${esc(testo)}</p></div>${bottone}</section>`; }
function vuoto(titolo, testo, bottone = "") { return `<div class="vuoto"><h3>${esc(titolo)}</h3><p>${esc(testo)}</p>${bottone}</div>`; }
const opzioni = (lista, scelto) => lista.map(([v, n]) => `<option value="${esc(v)}" ${String(v) === String(scelto ?? "") ? "selected" : ""}>${esc(n)}</option>`).join("");
const campo = (nome, contenuto, aiuto = "") => `<label class="campo"><span>${esc(nome)}</span>${contenuto}${aiuto ? `<small>${esc(aiuto)}</small>` : ""}</label>`;
const dato = (nome, valore) => (valore || valore === 0 ? `<div><dt>${esc(nome)}</dt><dd>${valore}</dd></div>` : "");
function chipsScelta(nome, lista, scelti) {
  const s = new Set(String(scelti || "").split(",").map((x) => x.trim()).filter(Boolean));
  return `<div class="chips">${lista.map((v) => `<label><input type="checkbox" name="${esc(nome)}" value="${esc(v)}" ${s.has(v) ? "checked" : ""}>${esc(v)}</label>`).join("")}</div>`;
}

// ---------------------------------------------------------------- calcoli (uguali a modulo.py)
const abitudiniAttive = () => stato.dati.abitudini.filter((a) => a.attiva === "si");
const diarioDi = (k) => stato.dati.diario.find((d) => d.data === k);
const farmacoDi = (id) => stato.dati.farmaci.find((f) => f.id === Number(id));
function dosiPreviste(f, k) {
  if (f.attivo !== "si" || !f.orari) return [];
  const dal = f.dal || String(f.creato || "").slice(0, 10); // senza "dal" conta dal giorno in cui l'hai inserito
  if ((dal && k < dal) || (f.al && k > f.al) || !(f.giorni || "1234567").includes(giornoSett(k))) return [];
  return f.orari.split(",");
}
function assunzioniDi(fid, k) { return stato.dati.assunzioni.filter((x) => x.farmaco_id === fid && x.data === k); }
function fineScorta(f) {
  if (f.attivo !== "si" || f.scorta === null || f.scorta === undefined || !f.orari) return null;
  const alGiorno = f.orari.split(",").length * (f.unita_per_dose || 1) * (f.giorni || "1234567").length / 7;
  return alGiorno > 0 ? spostaGiorni(Math.floor(f.scorta / alGiorno)) : null;
}
function scortaBassa(f) { const fine = fineScorta(f); return fine && giorniTra(chiaveGiorno(), fine) <= (f.avviso_giorni || 7) && (!f.al || f.al >= spostaGiorni(f.avviso_giorni || 7) || fine < f.al); }
function valoreGiorno(a, k) {
  if (!(a.giorni || "1234567").includes(giornoSett(k))) return null;
  if (a.fonte === "movimento") return stato.dati.attivita.filter((x) => x.data === k).reduce((t, x) => t + (x.minuti || 0), 0);
  if (a.fonte === "sonno") return diarioDi(k)?.sonno_ore || 0;
  if (a.fonte === "diario") return diarioDi(k)?.umore ? 1 : 0;
  if (a.fonte === "farmaci") {
    let previste = 0, prese = 0;
    stato.dati.farmaci.forEach((f) => { const p = dosiPreviste(f, k); previste += p.length; prese += assunzioniDi(f.id, k).filter((x) => p.includes(x.orario)).length; });
    return previste ? (prese >= previste ? 1 : 0) : null;
  }
  return (stato.dati.registro.find((r) => r.data === k && r.abitudine_id === a.id) || {}).valore || 0;
}
const obiettivoDi = (a) => (a.tipo === "quantita" ? a.obiettivo_giorno || 1 : 1);
const fattaIl = (a, k) => { const v = valoreGiorno(a, k); return v !== null && v >= obiettivoDi(a); };
function serie(a) {
  let k = chiaveGiorno(), n = 0;
  if (!fattaIl(a, k)) k = spostaGiorni(-1, k); // oggi non è ancora finito: si conta da ieri
  for (let i = 0; i < 400; i += 1) {
    const v = valoreGiorno(a, k);
    if (v === null) { k = spostaGiorni(-1, k); continue; }
    if (v >= obiettivoDi(a)) { n += 1; k = spostaGiorni(-1, k); } else break;
  }
  return n;
}
function settimanaDi(a, lunedi) {
  const giorni = Array.from({ length: 7 }, (_, i) => spostaGiorni(i, lunedi));
  const validi = giorni.filter((k) => valoreGiorno(a, k) !== null);
  const fatti = validi.filter((k) => k <= chiaveGiorno() && fattaIl(a, k)).length;
  return { giorni, fatti, obiettivo: Math.min(a.obiettivo_settimana || 1, validi.length || 1), validi: validi.length };
}
function minutiTra(da, a) { return stato.dati.attivita.filter((x) => x.data >= da && x.data <= a).reduce((t, x) => t + (x.minuti || 0), 0); }
const ALTEZZA = 110; // altezza massima delle barre dei grafici, in pixel
const alt = (r) => `${Math.max(0, Math.round(Math.min(1, r || 0) * ALTEZZA))}px`;
function media(valori) { const b = valori.filter((v) => v); return b.length ? b.reduce((t, v) => t + v, 0) / b.length : null; }
function fraseGentile(fatte, totali) {
  if (!totali) return "Oggi è un giorno libero: goditelo.";
  const r = fatte / totali;
  if (r === 0) return "Ogni giorno è un buon giorno per cominciare, anche con una cosa sola.";
  if (r < 0.5) return "Hai già iniziato: ogni piccolo passo conta.";
  if (r < 1) return "Stai andando bene, continua con calma.";
  return "Tutto fatto per oggi. Brava, Elena!";
}

// ---------------------------------------------------------------- comunicazione con il server
async function chiama(percorso, opzioni = {}) {
  const risposta = await fetch(`${API}/${percorso}`, { headers: { "Content-Type": "application/json" }, ...opzioni });
  const dati = await risposta.json().catch(() => ({}));
  if (!risposta.ok) throw new Error(dati.errore || "Operazione non riuscita.");
  return dati;
}
async function ricarica() {
  try { stato.dati = await chiama("dati"); } catch (e) { avviso(`Non riesco a leggere i dati: ${e.message}. Il sito è acceso?`, "errore"); }
  disegna();
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
function disegna() {
  const posizione = window.scrollY;
  // chi sta scrivendo in una casella non deve perderla quando la pagina si ridisegna
  const attivo = document.activeElement;
  const chiave = attivo && app.contains(attivo) ? (attivo.dataset.diario ? `[data-diario="${attivo.dataset.diario}"]` : attivo.dataset.filtro ? `[data-filtro="${attivo.dataset.filtro}"]` : "") : "";
  const cursore = chiave && "selectionStart" in attivo ? [attivo.selectionStart, attivo.selectionEnd] : null;
  const oggi = chiaveGiorno();
  const dosiOggi = stato.dati.farmaci.reduce((t, f) => t + dosiPreviste(f, oggi).filter((o) => !assunzioniDi(f.id, oggi).some((x) => x.orario === o)).length, 0);
  const conteggi = {
    oggi: dosiOggi || undefined,
    farmaci: stato.dati.farmaci.filter(scortaBassa).length || undefined,
    visite: stato.dati.appuntamenti.filter((a) => a.stato === "da_prenotare" && a.data <= spostaGiorni(30)).length || undefined,
  };
  app.innerHTML = `
    <aside class="lato">
      <a class="torna" href="../../index.html">← Pagina iniziale</a>
      <div class="marchio"><div class="bussola">❀</div><div><h1>Benessere<br>personale</h1><small>Prendersi cura, con gentilezza</small></div></div>
      ${VISTE.map(([id, nome]) => `<button class="voce ${stato.vista === id ? "attiva" : ""}" data-vai="${id}"><span>${esc(nome)}</span>${conteggi[id] !== undefined ? `<b class="${id === "farmaci" ? "allerta" : ""}">${conteggi[id]}</b>` : ""}</button>`).join("")}
      <p class="privato">Versione dimostrativa: le tue prove restano solo in questo browser.</p>
    </aside>
    <section class="principale">
      <header class="barra">
        <span class="titolo-vista">${esc(etichetta(VISTE, stato.vista))}</span>
        <div class="azioni"><button class="btn chiaro" data-azione="nuovo-appuntamento">+ Visita o appuntamento</button><button class="btn pieno" data-azione="vai-oggi">Compila oggi</button></div>
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
    case "settimana": return vistaSettimana();
    case "umore": return vistaUmore();
    case "movimento": return vistaMovimento();
    case "alimentazione": return vistaAlimentazione();
    case "farmaci": return vistaFarmaci();
    case "visite": return vistaVisite();
    case "aspetto": return vistaAspetto();
    case "medico": return vistaMedico();
    case "impostazioni": return vistaImpostazioni();
    case "esporta": return vistaEsporta();
    default: return vistaOggi();
  }
}

// ---------------------------------------------------------------- OGGI
function vistaOggi() {
  const k = stato.giorno, oggi = chiaveGiorno();
  const abitudini = abitudiniAttive().map((a) => ({ a, v: valoreGiorno(a, k) })).filter((x) => x.v !== null);
  const fatte = abitudini.filter(({ a, v }) => v >= obiettivoDi(a)).length;
  const etichettaGiorno = k === oggi ? "Oggi" : k === spostaGiorni(-1) ? "Ieri" : k === spostaGiorni(1) ? "Domani" : "";
  return `
    <div class="navigatore">
      <h2>${esc(dataLunga(k))}<small>${etichettaGiorno ? `${etichettaGiorno} · ` : ""}${fatte} abitudini su ${abitudini.length}</small></h2>
      <div class="comandi">
        <button class="btn chiaro piccolo" data-azione="giorno" data-passo="-1">← Giorno prima</button>
        ${k !== oggi ? `<button class="btn chiaro piccolo" data-azione="giorno" data-passo="0">Torna a oggi</button>` : ""}
        <button class="btn chiaro piccolo" data-azione="giorno" data-passo="1" ${k >= oggi ? "disabled" : ""}>Giorno dopo →</button>
      </div>
    </div>
    <p class="frase-gentile">${esc(fraseGentile(fatte, abitudini.length))}</p>
    <div class="griglia-oggi">
      <div>
        ${pannelloAbitudini(abitudini, k)}
        <div class="spazio"></div>
        ${pannelloFarmaciOggi(k)}
        <div class="spazio"></div>
        ${pannelloInArrivo()}
      </div>
      <div>
        ${pannelloComeStai(k)}
        <div class="spazio"></div>
        ${pannelloMovimentoOggi(k)}
        <div class="spazio"></div>
        ${pannelloPastiOggi(k)}
      </div>
    </div>`;
}
function controlloAbitudine(a, v, k) {
  if (a.fonte !== "manuale") {
    const testo = a.tipo === "quantita" ? `${numeroIt(v)} ${a.unita}` : v ? "Fatto" : "Non ancora";
    return `<div class="automatico"><b>${esc(testo)}</b>si aggiorna da sola</div>`;
  }
  if (a.tipo === "spunta") return `<button class="interruttore ${v ? "si" : ""}" data-azione="spunta" data-id="${a.id}" data-valore="${v ? 0 : 1}">${v ? "✓ Fatto" : "Fatto?"}</button>`;
  const passo = a.unita === "ore" ? 0.5 : 1;
  return `<div class="contatore"><button data-azione="conta" data-id="${a.id}" data-valore="${Math.max(0, v - passo)}" aria-label="Meno">−</button><b>${numeroIt(v)}</b><button data-azione="conta" data-id="${a.id}" data-valore="${v + passo}" aria-label="Più">+</button></div>`;
}
function pannelloAbitudini(abitudini, k) {
  if (!abitudini.length) return `<section class="pannello"><h3>Abitudini</h3><p class="nulla">Nessuna abitudine prevista per questo giorno. Puoi aggiungerne da <button class="link" data-vai="impostazioni">Impostazioni</button>.</p></section>`;
  const perArea = AREE.map(([id, nome]) => [nome, abitudini.filter((x) => x.a.area === id)]).filter(([, l]) => l.length);
  return `<section class="pannello"><h3>Abitudini <button class="link" data-vai="impostazioni" style="font-size:14px">Cambia</button></h3>
    ${perArea.map(([nome, lista]) => `<p class="area-titolo">${esc(nome)}</p>${lista.map(({ a, v }) => {
      const ob = obiettivoDi(a), pieno = v >= ob;
      const sotto = a.tipo === "quantita" ? `${numeroIt(v)} di ${numeroIt(ob)} ${a.unita}` : a.note ? a.note : "";
      return `<div class="abitudine ${pieno ? "fatta" : ""}"><div class="ico">${esc(a.icona)}</div>
        <div><strong>${esc(a.nome)}</strong>${sotto ? `<small>${esc(sotto)}</small>` : ""}${a.tipo === "quantita" ? `<div class="barretta ${pieno ? "piena" : ""}"><i style="width:${Math.min(100, (v / ob) * 100)}%"></i></div>` : ""}</div>
        ${controlloAbitudine(a, v, k)}</div>`;
    }).join("")}`).join("")}</section>`;
}
function pannelloComeStai(k) {
  const d = diarioDi(k) || {};
  const parole = new Set(String(d.parole || "").split(",").filter(Boolean));
  const ore = []; for (let h = 3; h <= 12; h += 0.5) ore.push([h, `${numeroIt(h)} ore`]);
  return `<section class="pannello"><h3>Come stai</h3><p class="sotto">Basta un clic: si salva da solo.</p>
    <p class="domanda">Umore</p>
    <div class="scelte-faccine">${UMORI.map(([n, e, t]) => `<button class="${d.umore === n ? "scelta" : ""}" data-azione="diario" data-campo="umore" data-valore="${d.umore === n ? 0 : n}"><span>${e}</span>${esc(t)}</button>`).join("")}</div>
    <p class="domanda">Energia</p>
    <div class="scelte-faccine">${ENERGIE.map(([n, e, t]) => `<button class="${d.energia === n ? "scelta" : ""}" data-azione="diario" data-campo="energia" data-valore="${d.energia === n ? 0 : n}"><span>${e}</span>${esc(t)}</button>`).join("")}</div>
    <div class="riga-sonno">
      ${campo("Ore di sonno", `<select data-diario="sonno_ore"><option value="">—</option>${opzioni(ore, d.sonno_ore)}</select>`)}
      <div><p class="domanda" style="margin-top:0">Com'è stato il sonno</p><div class="scelte-faccine scelte-testo" style="margin:0">${QUALITA_SONNO.map(([n, t]) => `<button class="${d.sonno_qualita === n ? "scelta" : ""}" data-azione="diario" data-campo="sonno_qualita" data-valore="${d.sonno_qualita === n ? 0 : n}">${esc(t)}</button>`).join("")}</div></div>
    </div>
    <p class="domanda">Come ti senti (scegli quante vuoi)</p>
    <div class="chips">${PAROLE.map((p) => `<button class="${parole.has(p) ? "scelta" : ""}" data-azione="parola" data-parola="${esc(p)}">${esc(p)}</button>`).join("")}</div>
    ${campo("Una cosa bella di oggi", `<textarea rows="2" data-diario="cosa_bella" placeholder="Anche piccola: un caffè buono, una telefonata...">${esc(d.cosa_bella || "")}</textarea>`)}
    <div style="height:10px"></div>
    ${campo("Note (per te o per il medico)", `<textarea rows="2" data-diario="note" placeholder="Un sintomo, un pensiero, qualcosa da ricordare">${esc(d.note || "")}</textarea>`, "Le note si salvano quando clicchi fuori dalla casella.")}
  </section>`;
}
function pannelloFarmaciOggi(k) {
  const attivi = stato.dati.farmaci.filter((f) => f.attivo === "si");
  if (!attivi.length) return `<section class="pannello"><h3>Farmaci e integratori</h3><p class="nulla">Nessun farmaco o integratore registrato.</p><button class="btn chiaro piccolo" data-azione="nuovo-farmaco">+ Aggiungi</button></section>`;
  const dosi = [];
  attivi.forEach((f) => dosiPreviste(f, k).forEach((o) => dosi.push({ f, o, presa: assunzioniDi(f.id, k).find((x) => x.orario === o) })));
  dosi.sort((x, y) => x.o.localeCompare(y.o));
  const alBisogno = attivi.filter((f) => !f.orari);
  const basse = attivi.filter(scortaBassa);
  return `<section class="pannello"><h3>Farmaci e integratori <button class="link" data-vai="farmaci" style="font-size:14px">Elenco</button></h3>
    ${basse.map((f) => `<p class="attenzione">${esc(f.nome)}: la scorta finisce verso il ${esc(dataIt(fineScorta(f)))}. <button class="link" data-azione="ricarica-scorta" data-id="${f.id}">Ho comprato una confezione</button></p>`).join("")}
    ${dosi.length ? dosi.map(({ f, o, presa }) => `<div class="dose ${presa ? "presa" : ""}"><div class="orario">${esc(o)}</div>
      <div><strong>${esc(f.nome)}</strong><small>${esc([f.dose, presa ? `preso alle ${presa.ora_presa}` : ""].filter(Boolean).join(" · "))}</small></div>
      <button class="interruttore ${presa ? "si" : ""}" data-azione="prendi" data-id="${f.id}" data-orario="${esc(o)}" data-preso="${presa ? "no" : "si"}">${presa ? "✓ Preso" : "Preso?"}</button></div>`).join("") : `<p class="nulla">Nessuna dose prevista per questo giorno.</p>`}
    ${alBisogno.length ? `<p class="area-titolo">Al bisogno</p>${alBisogno.map((f) => {
      const prese = assunzioniDi(f.id, k);
      return `<div class="dose ${prese.length ? "presa" : ""}"><div class="orario">—</div><div><strong>${esc(f.nome)}</strong><small>${esc([f.dose, prese.length ? `preso ${prese.length} ${prese.length === 1 ? "volta" : "volte"} (${prese.map((x) => x.ora_presa).join(", ")})` : ""].filter(Boolean).join(" · "))}</small></div>
      <div class="voce-giorno" style="padding:0;border:0">${prese.length ? `<button class="btn chiaro piccolo" data-azione="prendi" data-id="${f.id}" data-orario="" data-preso="no" title="Togli l'ultima">−</button>` : ""}<button class="btn chiaro piccolo" data-azione="prendi" data-id="${f.id}" data-orario="" data-preso="si">L'ho preso</button></div></div>`;
    }).join("")}` : ""}
  </section>`;
}
function attivitaFrequenti() {
  const conta = new Map();
  stato.dati.attivita.slice(0, 60).forEach((x) => { const c = `${x.tipo}|${x.minuti}`; conta.set(c, (conta.get(c) || 0) + 1); });
  const scelte = [...conta.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([c]) => { const [tipo, minuti] = c.split("|"); return { tipo, minuti: Number(minuti) }; });
  [["Camminata", 30], ["Ginnastica", 20], ["Yoga", 30], ["Stretching", 15]].forEach(([tipo, minuti]) => { if (scelte.length < 4 && !scelte.some((s) => s.tipo === tipo)) scelte.push({ tipo, minuti }); });
  return scelte;
}
function pannelloMovimentoOggi(k) {
  const lista = stato.dati.attivita.filter((x) => x.data === k);
  const totale = lista.reduce((t, x) => t + (x.minuti || 0), 0);
  return `<section class="pannello"><h3>Movimento <small style="font-family:'Segoe UI';font-size:14px;font-weight:400;color:var(--inchiostro-tenue)">${totale} minuti</small></h3>
    <p class="sotto">Un clic su un pulsante e l'attività è registrata.</p>
    <div class="pulsanti-rapidi">${attivitaFrequenti().map((s) => `<button class="btn chiaro piccolo" data-azione="attivita-rapida" data-tipo="${esc(s.tipo)}" data-minuti="${s.minuti}">+ ${esc(s.tipo)} ${s.minuti} min</button>`).join("")}<button class="btn chiaro piccolo" data-azione="nuova-attivita">Altro...</button></div>
    ${lista.map((x) => `<div class="voce-giorno"><span><b>${esc(x.tipo)}</b> · ${numeroIt(x.minuti, 0)} min${x.intensita !== "media" ? ` · ${esc(etichetta(INTENSITA, x.intensita).toLowerCase())}` : ""}${x.note ? `<br><small>${esc(x.note)}</small>` : ""}</span>
      <span class="destra"><button class="btn chiaro piccolo" data-azione="modifica-attivita" data-id="${x.id}">Modifica</button></span></div>`).join("")}
  </section>`;
}
function pannelloPastiOggi(k) {
  const lista = stato.dati.pasti.filter((p) => p.data === k);
  return `<section class="pannello"><h3>Pasti <button class="link" data-vai="alimentazione" style="font-size:14px">Diario</button></h3>
    <p class="sotto">Cosa hai mangiato, senza contare nulla.</p>
    <div class="pulsanti-rapidi">${MOMENTI.slice(0, 5).map(([m, n]) => `<button class="btn chiaro piccolo" data-azione="nuovo-pasto" data-momento="${m}">+ ${esc(n)}</button>`).join("")}</div>
    ${lista.length ? MOMENTI.map(([m, n]) => lista.filter((p) => p.momento === m).map((p) => `<div class="voce-giorno"><span><b>${esc(n)}</b>: ${esc(p.descrizione || "—")}${p.etichette ? `<br><small>${esc(p.etichette.replaceAll(",", ", "))}</small>` : ""}</span>
      <span class="destra"><button class="btn chiaro piccolo" data-azione="modifica-pasto" data-id="${p.id}">Modifica</button></span></div>`).join("")).join("") : ""}
  </section>`;
}
function pannelloInArrivo() {
  const oggi = chiaveGiorno(), entro = spostaGiorni(30);
  const app = stato.dati.appuntamenti.filter((a) => ["programmato", "da_prenotare"].includes(a.stato) && a.data <= entro && (a.stato === "da_prenotare" || a.data >= oggi)).slice(0, 4);
  const prodotti = stato.dati.prodotti.filter((p) => p.stato === "in_uso" && p.scadenza && p.scadenza <= spostaGiorni(stato.dati.impostazioni.giorni_avviso)).slice(0, 3);
  return `<section class="pannello"><h3>Nei prossimi 30 giorni <button class="link" data-vai="visite" style="font-size:14px">Visite</button></h3>
    ${app.length || prodotti.length ? `<div class="elenco-breve">
      ${app.map((a) => `<button class="cosa ${a.data < oggi ? "ritardo" : a.data === oggi ? "oggi" : ""}" data-azione="apri-appuntamento" data-id="${a.id}">${boxGiorno(a.data)}<div><strong>${esc(a.titolo)}</strong><small>${esc([etichetta(CATEGORIE, a.categoria), a.ora, a.luogo].filter(Boolean).join(" · "))}</small></div>${pill(STATI_APP, a.stato)}</button>`).join("")}
      ${prodotti.map((p) => `<button class="cosa" data-azione="apri-prodotto" data-id="${p.id}">${boxGiorno(p.scadenza)}<div><strong>${esc(p.nome)}</strong><small>prodotto da sostituire (aperto da tempo)</small></div>${pillTesto("Prodotto", "lavanda")}</button>`).join("")}
    </div>` : `<p class="nulla">Niente in programma. Tutto tranquillo.</p>`}
  </section>`;
}

// ---------------------------------------------------------------- LA MIA SETTIMANA
function vistaSettimana() {
  const lun = stato.lunedi, dom = spostaGiorni(6, lun), oggi = chiaveGiorno();
  const giorni = Array.from({ length: 7 }, (_, i) => spostaGiorni(i, lun));
  const righeAb = abitudiniAttive().map((a) => ({ a, s: settimanaDi(a, lun), serie: serie(a) })).filter((x) => x.s.validi);
  const raggiunti = righeAb.filter((x) => x.s.fatti >= x.s.obiettivo).length;
  const minuti = minutiTra(lun, dom), obMin = stato.dati.impostazioni.obiettivo_movimento;
  const minutiGiorno = giorni.map((k) => minutiTra(k, k));
  const maxMin = Math.max(30, ...minutiGiorno);
  const diari = giorni.map(diarioDi);
  return `
    <div class="navigatore">
      <h2>Settimana dal ${esc(dataMedia(lun))} al ${esc(dataMedia(dom))}<small>${raggiunti} obiettivi raggiunti su ${righeAb.length}</small></h2>
      <div class="comandi">
        <button class="btn chiaro piccolo" data-azione="settimana" data-passo="-1">← Settimana prima</button>
        ${lun !== lunediDi(oggi) ? `<button class="btn chiaro piccolo" data-azione="settimana" data-passo="0">Questa settimana</button>` : ""}
        <button class="btn chiaro piccolo" data-azione="settimana" data-passo="1" ${lun >= lunediDi(oggi) ? "disabled" : ""}>Settimana dopo →</button>
      </div>
    </div>
    <p class="frase-gentile">${esc(raggiunti === righeAb.length && righeAb.length ? "Tutti gli obiettivi della settimana raggiunti. Che bello!" : raggiunti ? `Hai già raggiunto ${raggiunti} ${raggiunti === 1 ? "obiettivo" : "obiettivi"}. Gli altri non scappano.` : "Una settimana nuova: si parte con calma, un giorno alla volta.")}</p>
    <section class="settimana-abitudini">
      ${righeAb.map(({ a, s, serie: n }) => `<div class="riga-sett"><div class="ico">${esc(a.icona)}</div>
        <div><strong>${esc(a.nome)}</strong><small>Obiettivo: ${s.obiettivo} ${s.obiettivo === 1 ? "giorno" : "giorni"} su ${s.validi}${a.tipo === "quantita" ? ` (almeno ${numeroIt(obiettivoDi(a))} ${esc(a.unita)})` : ""}</small></div>
        <div class="pallini">${s.giorni.map((k, i) => { const v = valoreGiorno(a, k); const cl = v === null ? "no-conta" : k > oggi ? "futuro" : fattaIl(a, k) ? "si" : ""; return `<span class="${cl} ${k === oggi ? "oggi" : ""}" title="${esc(dataMedia(k))}">${GIORNI_SETT[i][1].charAt(0)}</span>`; }).join("")}</div>
        <div class="esito-sett">${s.fatti >= s.obiettivo ? `<b>🌟 Obiettivo raggiunto</b>` : `${s.fatti} di ${s.obiettivo}${lun === lunediDi(oggi) ? ` · ancora ${s.obiettivo - s.fatti}` : ""}`}${n >= 2 ? `<br><small>${n} giorni di fila</small>` : ""}</div></div>`).join("") || vuoto("Nessuna abitudine attiva", "Aggiungine una da Impostazioni.")}
    </section>
    <div class="spazio"></div>
    <div class="due-colonne">
      <section class="pannello"><h3>Movimento: ${minuti} minuti</h3><p class="sotto">Obiettivo della settimana: ${obMin} minuti${minuti >= obMin ? " · raggiunto 🌟" : ` · mancano ${obMin - minuti}`}</p>
        <div class="barretta ${minuti >= obMin ? "piena" : ""}" style="height:10px;margin-bottom:14px"><i style="width:${Math.min(100, (minuti / obMin) * 100)}%"></i></div>
        <div class="grafico-barre">${minutiGiorno.map((m, i) => `<div>${m ? `<small>${m}</small>` : ""}<i class="salvia" style="height:${alt(m / maxMin)}"></i>${GIORNI_SETT[i][1]}</div>`).join("")}</div>
      </section>
      <section class="pannello"><h3>Umore ed energia</h3><p class="sotto">Da 1 a 5, dai giorni in cui hai compilato "Come stai".</p>
        <div class="grafico-barre">${diari.map((d, i) => `<div><span class="coppia-barre"><i style="height:${alt((d?.umore || 0) / 5)}"></i><i class="cielo" style="height:${alt((d?.energia || 0) / 5)}"></i></span>${d?.umore ? UMORI[d.umore - 1][1] : "·"}<br>${GIORNI_SETT[i][1]}</div>`).join("")}</div>
        <div class="legenda-mini"><span><i></i>Umore</span><span><i style="background:var(--cielo)"></i>Energia</span><span>Sonno medio: ${numeroIt(media(diari.map((d) => d?.sonno_ore)))} ore</span></div>
      </section>
    </div>`;
}

// ---------------------------------------------------------------- UMORE E DIARIO
function vistaUmore() {
  const [anno, mese] = stato.meseUmore.split("-").map(Number);
  const primo = `${stato.meseUmore}-01`;
  const inizio = lunediDi(primo);
  const celle = Array.from({ length: 42 }, (_, i) => spostaGiorni(i, inizio));
  const delMese = stato.dati.diario.filter((d) => d.data.startsWith(stato.meseUmore));
  const conta = new Map();
  delMese.forEach((d) => String(d.parole || "").split(",").filter(Boolean).forEach((p) => conta.set(p, (conta.get(p) || 0) + 1)));
  const cose = stato.dati.diario.filter((d) => d.cosa_bella);
  stato.pag.cose = paginaValida(cose.length, stato.pag.cose);
  const nomeMese = new Intl.DateTimeFormat("it-IT", { month: "long", year: "numeric" }).format(new Date(anno, mese - 1, 1));
  return `
    <div class="navigatore">
      <h2>${esc(nomeMese)}<small>${delMese.length} giorni compilati</small></h2>
      <div class="comandi"><button class="btn chiaro piccolo" data-azione="mese-umore" data-passo="-1">← Mese prima</button><button class="btn chiaro piccolo" data-azione="mese-umore" data-passo="0">Questo mese</button><button class="btn chiaro piccolo" data-azione="mese-umore" data-passo="1">Mese dopo →</button></div>
    </div>
    <div class="due-colonne">
      <section class="pannello">
        <div class="cal-umore">${GIORNI_SETT.map(([, n]) => `<div class="nome-g">${n}</div>`).join("")}
          ${celle.map((k) => { const d = diarioDi(k); return `<button class="${k.slice(0, 7) !== stato.meseUmore ? "fuori" : ""} ${k === chiaveGiorno() ? "oggi" : ""} ${d?.umore ? `u${d.umore}` : ""}" data-azione="apri-giorno" data-giorno="${k}" ${k > chiaveGiorno() ? "disabled" : ""}>${daChiave(k).getDate()}<span>${d?.umore ? UMORI[d.umore - 1][1] : ""}</span></button>`; }).join("")}
        </div>
        <p class="sotto" style="margin-top:10px">Clicca un giorno per aprirlo e compilarlo.</p>
      </section>
      <section class="pannello"><h3>Il mese in breve</h3>
        <dl class="dati-scheda">
          ${dato("Umore medio", delMese.length ? `${numeroIt(media(delMese.map((d) => d.umore)))} su 5` : "")}
          ${dato("Energia media", delMese.length ? `${numeroIt(media(delMese.map((d) => d.energia)))} su 5` : "")}
          ${dato("Sonno medio", media(delMese.map((d) => d.sonno_ore)) ? `${numeroIt(media(delMese.map((d) => d.sonno_ore)))} ore` : "")}
          ${dato("Qualità del sonno", media(delMese.map((d) => d.sonno_qualita)) ? `${numeroIt(media(delMese.map((d) => d.sonno_qualita)))} su 5` : "")}
        </dl>
        ${conta.size ? `<p class="domanda">Le parole del mese</p><div class="parole-conteggio">${[...conta.entries()].sort((a, b) => b[1] - a[1]).map(([p, n]) => pillTesto(`${p} · ${n}`, "lavanda")).join("")}</div>` : `<p class="nulla">Ancora nessun giorno compilato in questo mese.</p>`}
      </section>
    </div>
    <div class="spazio"></div>
    <section class="pannello"><h3>Le cose belle</h3><p class="sotto">Da rileggere nei giorni storti.</p>
      ${cose.length ? fetta(cose, stato.pag.cose).map((d) => `<div class="voce-giorno"><span><small>${esc(dataMedia(d.data))}</small><br>${esc(d.cosa_bella)}</span>${d.umore ? `<span style="font-size:22px">${UMORI[d.umore - 1][1]}</span>` : ""}</div>`).join("") + paginazione(cose.length, stato.pag.cose, "cose") : `<p class="nulla">Scrivile nella pagina Oggi, in "Una cosa bella di oggi".</p>`}
    </section>`;
}

// ---------------------------------------------------------------- MOVIMENTO
function vistaMovimento() {
  const filtro = stato.filtri.movimento;
  const lista = stato.dati.attivita.filter((x) => !filtro || x.tipo === filtro);
  stato.pag.movimento = paginaValida(lista.length, stato.pag.movimento);
  const lunOggi = lunediDi(chiaveGiorno());
  const settimane = Array.from({ length: 8 }, (_, i) => spostaGiorni(-7 * (7 - i), lunOggi));
  const minuti = settimane.map((l) => minutiTra(l, spostaGiorni(6, l)));
  const ob = stato.dati.impostazioni.obiettivo_movimento;
  const max = Math.max(ob, ...minuti);
  const tipi = [...new Set(stato.dati.attivita.map((x) => x.tipo))].sort();
  return `${intro("Movimento", "Camminate, ginnastica, yoga: tutto conta. Le attività di ogni giorno si aggiungono anche dalla pagina Oggi con un clic.", `<button class="btn pieno" data-azione="nuova-attivita">+ Attività</button>`)}
    <section class="pannello"><h3>Le ultime 8 settimane</h3><p class="sotto">Minuti di movimento per settimana · in verde le settimane in cui hai raggiunto il tuo obiettivo (${ob} minuti)</p>
      <div class="grafico-barre otto">${minuti.map((m, i) => `<div>${m ? `<small>${m}</small>` : ""}<i class="${m >= ob ? "salvia" : ""}" style="height:${alt(m / max)}"></i>${esc(new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "short" }).format(daChiave(settimane[i])))}</div>`).join("")}</div>
    </section>
    <div class="spazio"></div>
    <div class="filtri" style="grid-template-columns: minmax(0, 1fr) auto">
      ${campo("Mostra", `<select data-filtro="movimento"><option value="">Tutte le attività</option>${opzioni(tipi.map((t) => [t, t]), filtro)}</select>`)}
      <div class="riga2" style="grid-column:auto">${lista.length} attività · ${numeroIt(lista.reduce((t, x) => t + (x.minuti || 0), 0), 0)} minuti in tutto</div>
    </div>
    ${lista.length ? `<div class="righe">${fetta(lista, stato.pag.movimento).map((x) => `<button class="riga riga-scad" data-azione="modifica-attivita" data-id="${x.id}" style="grid-template-columns:64px minmax(0,1.6fr) minmax(0,1fr) auto">${boxGiorno(x.data)}<div><strong>${esc(x.tipo)}</strong><small>${esc(x.note || "")}</small></div><div>${pillTesto(etichetta(INTENSITA, x.intensita), x.intensita === "intensa" ? "terracotta" : x.intensita === "leggera" ? "cielo" : "salvia")}${x.passi ? ` <small>${numeroIt(x.passi, 0)} passi</small>` : ""}</div><b>${numeroIt(x.minuti, 0)} min</b></button>`).join("")}</div>${paginazione(lista.length, stato.pag.movimento, "movimento")}` : vuoto("Ancora nessuna attività", "Registra la prima con il pulsante qui sopra o dalla pagina Oggi.")}`;
}

// ---------------------------------------------------------------- ALIMENTAZIONE
function vistaAlimentazione() {
  const testo = stato.filtri.pasti.toLocaleLowerCase("it");
  const lista = stato.dati.pasti.filter((p) => !testo || `${p.descrizione} ${p.etichette} ${p.note}`.toLocaleLowerCase("it").includes(testo));
  const giorni = [...new Set(lista.map((p) => p.data))];
  stato.pag.pasti = paginaValida(giorni.length, stato.pag.pasti);
  const da = spostaGiorni(-6);
  const settimana = stato.dati.pasti.filter((p) => p.data >= da);
  const giorniCon = (et) => new Set(settimana.filter((p) => String(p.etichette).split(",").includes(et)).map((p) => p.data)).size;
  return `${intro("Alimentazione", "Un diario semplice di cosa mangi: niente calorie, niente pesi. Serve a notare le abitudini, non a giudicarle.", `<button class="btn pieno" data-azione="nuovo-pasto">+ Pasto</button>`)}
    <section class="pannello"><h3>Ultimi 7 giorni</h3><p class="sotto">In quanti giorni compare ogni etichetta (dai pasti che hai registrato).</p>
      <div class="parole-conteggio">${ETICHETTE_PASTO.map((et) => { const n = giorniCon(et); return n ? pillTesto(`${et}: ${n} ${n === 1 ? "giorno" : "giorni"}`, ["Dolce", "Fuori casa", "Di corsa"].includes(et) ? "ambra" : "salvia") : ""; }).join("") || `<p class="nulla">Nessun pasto registrato negli ultimi 7 giorni.</p>`}</div>
    </section>
    <div class="spazio"></div>
    <div class="filtri" style="grid-template-columns:minmax(0,1fr) auto">
      ${campo("Cerca", `<input type="search" data-filtro="pasti" value="${esc(stato.filtri.pasti)}" placeholder="Per esempio: pesce, minestrone, fuori casa">`)}
      <div class="riga2" style="grid-column:auto">${lista.length} pasti in ${giorni.length} giorni</div>
    </div>
    ${giorni.length ? `<div class="righe">${fetta(giorni, stato.pag.pasti).map((g) => `<div class="giorno-pasti"><h4>${esc(dataLunga(g))}</h4>
      ${MOMENTI.map(([m, n]) => lista.filter((p) => p.data === g && p.momento === m).map((p) => `<div class="voce-giorno"><span><b>${esc(n)}</b>: ${esc(p.descrizione || "—")}${p.etichette ? `<br><small>${esc(p.etichette.replaceAll(",", ", "))}</small>` : ""}${p.note ? `<br><small>${esc(p.note)}</small>` : ""}</span>
        <span class="destra"><button class="btn chiaro piccolo" data-azione="rifai-pasto" data-id="${p.id}" title="Registra lo stesso pasto per oggi">Rifai oggi</button><button class="btn chiaro piccolo" data-azione="modifica-pasto" data-id="${p.id}">Modifica</button></span></div>`).join("")).join("")}</div>`).join("")}</div>${paginazione(giorni.length, stato.pag.pasti, "pasti")}` : vuoto("Nessun pasto", testo ? "Nessun pasto corrisponde alla ricerca." : "Registra il primo pasto dalla pagina Oggi o con il pulsante qui sopra.")}`;
}

// ---------------------------------------------------------------- FARMACI
function vistaFarmaci() {
  const gruppo = stato.filtri.gruppoFarmaci;
  const lista = stato.dati.farmaci.filter((f) => (gruppo === "attivi" ? f.attivo === "si" : f.attivo !== "si"));
  const da30 = spostaGiorni(-29);
  return `${intro("Farmaci e integratori", "Orari, dosi e scorte. Quando segni una dose come presa, la scorta scende da sola; quando sta per finire compare un avviso qui, nella pagina Oggi e nell'agenda.", `<button class="btn pieno" data-azione="nuovo-farmaco">+ Farmaco o integratore</button>`)}
    <p class="aiuto">Le informazioni sui farmaci le decidi tu con il tuo medico: questa pagina serve solo a ricordare e a tenere traccia.</p>
    <div class="schede-tab"><button class="btn piccolo ${gruppo === "attivi" ? "scelta" : ""}" data-azione="gruppo-farmaci" data-gruppo="attivi">In uso (${stato.dati.farmaci.filter((f) => f.attivo === "si").length})</button><button class="btn piccolo ${gruppo === "sospesi" ? "scelta" : ""}" data-azione="gruppo-farmaci" data-gruppo="sospesi">Sospesi o finiti (${stato.dati.farmaci.filter((f) => f.attivo !== "si").length})</button></div>
    ${lista.length ? `<div class="righe">${lista.map((f) => {
      let previste = 0, prese = 0;
      for (let k = da30; k <= chiaveGiorno(); k = spostaGiorni(1, k)) { const p = dosiPreviste(f, k); previste += p.length; prese += assunzioniDi(f.id, k).filter((x) => p.includes(x.orario)).length; }
      const fine = fineScorta(f);
      return `<div class="scheda-farmaco ${scortaBassa(f) ? "bassa" : ""}">
        <div><strong>${esc(f.nome)}</strong><small>${esc([etichetta(TIPI_FARMACO, f.tipo), f.dose, f.a_cosa_serve].filter(Boolean).join(" · "))}</small><small>${f.orari ? `Orari: ${esc(f.orari.replaceAll(",", ", "))}` : "Al bisogno"}${(f.giorni || "1234567") !== "1234567" ? ` · solo ${esc(f.giorni.split("").map((g) => etichetta(GIORNI_SETT, g)).join(", "))}` : ""}${f.al ? ` · fino al ${esc(dataIt(f.al))}` : ""}</small></div>
        <div>${f.scorta !== null && f.scorta !== undefined ? `<small>Scorta</small><b>${numeroIt(f.scorta)}</b>${fine ? `<small>finisce verso il ${esc(dataIt(fine))}</small>` : ""}` : `<small>Scorta non seguita</small>`}
          ${previste ? `<small>Ultimi 30 giorni: prese ${prese} su ${previste}</small>` : ""}</div>
        <div class="destra">${f.scorta !== null && f.scorta !== undefined ? `<button class="btn chiaro piccolo" data-azione="ricarica-scorta" data-id="${f.id}">+ Confezione</button>` : ""}<button class="btn chiaro piccolo" data-azione="apri-farmaco" data-id="${f.id}">Apri</button></div>
      </div>`;
    }).join("")}</div>` : vuoto(gruppo === "attivi" ? "Nessun farmaco in uso" : "Nessun farmaco sospeso", gruppo === "attivi" ? "Aggiungi un farmaco o un integratore con il pulsante qui sopra." : "Qui finiscono i farmaci che sospendi.")}`;
}

// ---------------------------------------------------------------- VISITE
function vistaVisite() {
  const gruppo = stato.filtri.gruppoVisite;
  const oggi = chiaveGiorno();
  const gruppi = {
    programmato: stato.dati.appuntamenti.filter((a) => a.stato === "programmato" && a.categoria !== "parrucchiere" && a.categoria !== "estetista"),
    da_prenotare: stato.dati.appuntamenti.filter((a) => a.stato === "da_prenotare"),
    cura: stato.dati.appuntamenti.filter((a) => a.stato === "programmato" && ["parrucchiere", "estetista"].includes(a.categoria)),
    passati: stato.dati.appuntamenti.filter((a) => ["fatto", "annullato"].includes(a.stato)).slice().reverse(),
  };
  const lista = gruppi[gruppo] || [];
  stato.pag.visite = paginaValida(lista.length, stato.pag.visite);
  const nomi = { programmato: "Prenotati", da_prenotare: "Da prenotare", cura: "Parrucchiere ed estetista", passati: "Passati" };
  return `${intro("Visite e controlli", "Medico, dentista, esami, controlli periodici. Se un controllo va ripetuto (per esempio il dentista ogni 6 mesi), quando lo segni come fatto il prossimo compare da solo in \"Da prenotare\".", `<button class="btn pieno" data-azione="nuovo-appuntamento">+ Visita o appuntamento</button>`)}
    <div class="schede-tab">${Object.keys(nomi).map((g) => `<button class="btn piccolo ${gruppo === g ? "scelta" : ""}" data-azione="gruppo-visite" data-gruppo="${g}">${esc(nomi[g])} (${gruppi[g].length})</button>`).join("")}</div>
    ${lista.length ? `<div class="righe">${fetta(lista, stato.pag.visite).map((a) => rigaAppuntamento(a, oggi)).join("")}</div>${paginazione(lista.length, stato.pag.visite, "visite")}` : vuoto("Niente qui", gruppo === "da_prenotare" ? "Nessun controllo da prenotare." : "Nessun appuntamento in questo gruppo.")}`;
}
function rigaAppuntamento(a, oggi = chiaveGiorno()) {
  const [quando, colore] = quandoTesto(a.data);
  const ritardo = a.stato === "da_prenotare" ? a.data < oggi : a.stato === "programmato" && a.data < oggi;
  return `<div class="riga-scad ${ritardo ? "ritardo" : giorniTra(oggi, a.data) <= 7 && a.data >= oggi && a.stato !== "fatto" ? "vicina" : ""}">
    <div class="apri" data-azione="apri-appuntamento" data-id="${a.id}">${boxGiorno(a.data)}<div><strong>${esc(a.titolo)}</strong><small>${esc([etichetta(CATEGORIE, a.categoria), a.ora && a.stato !== "da_prenotare" ? `ore ${a.ora}` : "", a.persona, a.luogo].filter(Boolean).join(" · "))}</small></div>
    <div>${pill(STATI_APP, a.stato)}${a.stato === "da_prenotare" ? `<small>${a.data < oggi ? "da prenotare (era previsto per il " + esc(dataIt(a.data)) + ")" : "verso il " + esc(dataIt(a.data))}</small>` : ["programmato"].includes(a.stato) ? `<small>${esc(quando)}</small>` : a.esito ? `<small>${esc(a.esito.slice(0, 80))}</small>` : ""}</div></div>
    <div class="destra">${a.stato === "da_prenotare" ? `<button class="btn pieno piccolo" data-azione="prenota" data-id="${a.id}">Ho prenotato</button>` : a.stato === "programmato" ? `<button class="btn chiaro piccolo" data-azione="fatto-appuntamento" data-id="${a.id}">Fatto</button>` : ""}<button class="btn chiaro piccolo" data-azione="apri-appuntamento" data-id="${a.id}">Apri</button></div>
  </div>`;
}

// ---------------------------------------------------------------- CURA DELL'ASPETTO
function vistaAspetto() {
  const lun = lunediDi(chiaveGiorno());
  const routine = abitudiniAttive().filter((a) => a.area === "aspetto");
  const ultimi = (cat) => stato.dati.appuntamenti.filter((a) => a.categoria === cat && a.stato === "fatto").slice(-1)[0];
  const prossimi = (cat) => stato.dati.appuntamenti.find((a) => a.categoria === cat && ["programmato", "da_prenotare"].includes(a.stato));
  const gruppo = stato.filtri.gruppoProdotti;
  const prodotti = stato.dati.prodotti.filter((p) => p.stato === gruppo);
  stato.pag.prodotti = paginaValida(prodotti.length, stato.pag.prodotti);
  return `${intro("Cura dell'aspetto", "La routine di bellezza, parrucchiere ed estetista, e i prodotti che usi con la data in cui conviene sostituirli.", `<button class="btn pieno" data-azione="nuovo-prodotto">+ Prodotto</button>`)}
    <div class="tre-colonne">
      <section class="pannello"><h3>La routine di questa settimana</h3><p class="sotto">Si spunta dalla pagina Oggi.</p>
        ${routine.map((a) => { const s = settimanaDi(a, lun); return `<div class="voce-giorno"><span>${esc(a.icona)} <b>${esc(a.nome)}</b><br><small>${s.fatti} di ${s.obiettivo} giorni${s.fatti >= s.obiettivo ? " 🌟" : ""}</small></span></div>`; }).join("") || `<p class="nulla">Nessuna abitudine di cura. Aggiungila da Impostazioni (area "Cura dell'aspetto").</p>`}
        <button class="btn chiaro piccolo" data-azione="nuova-abitudine" data-area="aspetto">+ Abitudine di cura</button>
      </section>
      ${["parrucchiere", "estetista"].map((cat) => { const u = ultimi(cat), p = prossimi(cat); return `<section class="pannello"><h3>${esc(etichetta(CATEGORIE, cat))}</h3>
        <dl class="dati-scheda">${dato("Ultima volta", u ? `${esc(dataIt(u.data))} (${giorniTra(u.data, chiaveGiorno())} giorni fa)${u.esito ? `<br><small>${esc(u.esito)}</small>` : ""}` : "nessuna registrata")}
        ${dato("Prossima", p ? `${esc(dataIt(p.data))} ${pill(STATI_APP, p.stato)}` : "nessuna in programma")}</dl>
        <div class="pulsanti-rapidi"><button class="btn chiaro piccolo" data-azione="nuovo-appuntamento" data-categoria="${cat}">+ Appuntamento</button>${p ? `<button class="btn chiaro piccolo" data-azione="apri-appuntamento" data-id="${p.id}">Apri il prossimo</button>` : ""}</div></section>`; }).join("")}
    </div>
    <div class="spazio"></div>
    <section class="pannello"><h3>I miei prodotti</h3><p class="sotto">Indica quando l'hai aperto e quanti mesi dura dopo l'apertura (il simbolo del vasetto aperto sulla confezione, per esempio "12M"): la data di sostituzione si calcola da sola.</p>
      <div class="schede-tab">${STATI_PRODOTTO.map(([v, n]) => `<button class="btn piccolo ${gruppo === v ? "scelta" : ""}" data-azione="gruppo-prodotti" data-gruppo="${v}">${esc(n)} (${stato.dati.prodotti.filter((p) => p.stato === v).length})</button>`).join("")}</div>
      ${prodotti.length ? `<div class="elenco-breve">${fetta(prodotti, stato.pag.prodotti).map((p) => { const scaduto = p.scadenza && p.scadenza <= chiaveGiorno(); return `<button class="cosa ${scaduto && p.stato === "in_uso" ? "ritardo" : ""}" data-azione="apri-prodotto" data-id="${p.id}">${p.scadenza ? boxGiorno(p.scadenza) : `<div class="giorno"><b>—</b><span></span></div>`}<div><strong>${esc(p.nome)}${p.voto ? ` <small style="display:inline">${"★".repeat(p.voto)}</small>` : ""}</strong><small>${esc([etichetta(USI, p.uso), p.marca, p.aperto_il ? `aperto il ${dataIt(p.aperto_il)}` : "", p.scadenza ? `da sostituire il ${dataIt(p.scadenza)}` : ""].filter(Boolean).join(" · "))}</small></div>${pill(STATI_PRODOTTO, p.stato)}</button>`; }).join("")}</div>${paginazione(prodotti.length, stato.pag.prodotti, "prodotti")}` : `<p class="nulla">Nessun prodotto in questo gruppo.</p>`}
    </section>`;
}

// ---------------------------------------------------------------- PER IL MEDICO
function vistaMedico() {
  const m = stato.medico;
  const d = m.dati;
  return `${intro("Per il medico", "Un riepilogo del periodo che scegli: farmaci e regolarità, umore, sonno, movimento, visite e note. Da stampare (anche come PDF) o scaricare in Excel.")}
    <form class="filtri non-stampare" id="form-medico" style="grid-template-columns:repeat(3,minmax(0,1fr)) auto;align-items:end">
      ${campo("Dal", `<input type="date" name="da" value="${esc(m.da)}" required>`)}
      ${campo("Al", `<input type="date" name="a" value="${esc(m.a)}" required>`)}
      <div class="pulsanti-rapidi" style="margin:0"><button type="button" class="btn chiaro piccolo" data-azione="periodo-medico" data-mesi="1">Ultimo mese</button><button type="button" class="btn chiaro piccolo" data-azione="periodo-medico" data-mesi="3">3 mesi</button><button type="button" class="btn chiaro piccolo" data-azione="periodo-medico" data-mesi="6">6 mesi</button></div>
      <button class="btn pieno">Mostra</button>
    </form>
    ${d ? `<div class="pulsanti-rapidi"><button class="btn chiaro" data-azione="stampa-medico">Stampa o salva in PDF</button><a class="btn chiaro" href="${API}/medico?da=${esc(d.da)}&a=${esc(d.a)}&formato=excel">Scarica in Excel</a></div>${testoMedico(d)}` : `<p class="nulla">Scegli il periodo e premi "Mostra".</p>`}`;
}
function testoMedico(d) {
  const t = d.totali;
  return `<section class="pannello" id="riepilogo-medico">
    <h3>Riepilogo dal ${esc(dataIt(d.da))} al ${esc(dataIt(d.a))}</h3>
    <dl class="dati-scheda" style="grid-template-columns:repeat(3,minmax(0,1fr));display:grid;margin:12px 0">
      ${dato("Umore medio", t.umore ? `${numeroIt(t.umore)} su 5` : "non compilato")}${dato("Energia media", t.energia ? `${numeroIt(t.energia)} su 5` : "non compilata")}
      ${dato("Sonno medio", t.sonno_ore ? `${numeroIt(t.sonno_ore)} ore${t.sonno_qualita ? ` (qualità ${numeroIt(t.sonno_qualita)} su 5)` : ""}` : "non compilato")}
      ${dato("Movimento", `${numeroIt(t.minuti, 0)} minuti in ${t.attivita} attività`)}${dato("Giorni con il diario", t.giorni_diario)}
    </dl>
    <p class="domanda">Farmaci e integratori</p>
    ${d.farmaci.length ? `<div class="contenitore-tabella"><table class="tabella"><thead><tr><th>Nome</th><th>Dose e orari</th><th>A cosa serve</th><th>Periodo</th><th class="num">Dosi prese</th></tr></thead><tbody>
      ${d.farmaci.map((f) => `<tr><td><b>${esc(f.nome)}</b><br><small>${esc(etichetta(TIPI_FARMACO, f.tipo))}${f.prescritto_da ? ` · ${esc(f.prescritto_da)}` : ""}</small></td><td>${esc(f.dose)}<br><small>${esc(f.orari)}</small></td><td>${esc(f.a_cosa_serve)}</td><td>${esc([f.dal ? `dal ${dataIt(f.dal)}` : "", f.al ? `al ${dataIt(f.al)}` : ""].filter(Boolean).join(" ")) || "—"}</td><td class="num">${f.previste ? `${f.prese} su ${f.previste} (${f.aderenza}%)` : f.prese ? `${f.prese} ${f.prese === 1 ? "volta" : "volte"}` : "—"}</td></tr>`).join("")}
    </tbody></table></div>` : `<p class="nulla">Nessun farmaco nel periodo.</p>`}
    <p class="domanda">Settimana per settimana</p>
    ${d.settimane.length ? `<div class="contenitore-tabella"><table class="tabella"><thead><tr><th>Settimana dal</th><th class="num">Umore</th><th class="num">Energia</th><th class="num">Ore di sonno</th><th class="num">Qualità sonno</th><th class="num">Minuti di movimento</th></tr></thead><tbody>
      ${d.settimane.map((s) => `<tr><td>${esc(dataIt(s.settimana))}</td><td class="num">${numeroIt(s.umore)}</td><td class="num">${numeroIt(s.energia)}</td><td class="num">${numeroIt(s.sonno_ore)}</td><td class="num">${numeroIt(s.sonno_qualita)}</td><td class="num">${numeroIt(s.minuti, 0)}</td></tr>`).join("")}
    </tbody></table></div>` : `<p class="nulla">Nessun dato nel periodo.</p>`}
    <p class="domanda">Visite ed esami</p>
    ${d.visite.length ? `<div class="contenitore-tabella"><table class="tabella"><thead><tr><th>Data</th><th>Visita</th><th>Stato</th><th>Esito</th></tr></thead><tbody>
      ${d.visite.map((v) => `<tr><td>${esc(dataIt(v.data))}</td><td><b>${esc(v.titolo)}</b><br><small>${esc([etichetta(CATEGORIE, v.categoria), v.persona].filter(Boolean).join(" · "))}</small></td><td>${esc(etichetta(STATI_APP, v.stato))}</td><td>${esc(v.esito)}</td></tr>`).join("")}
    </tbody></table></div>` : `<p class="nulla">Nessuna visita nel periodo.</p>`}
    ${d.note.length ? `<p class="domanda">Note del diario</p>${d.note.map((n) => `<div class="voce-giorno"><span><small>${esc(dataIt(n.data))}</small><br>${esc(n.testo)}</span></div>`).join("")}` : ""}
  </section>`;
}

// ---------------------------------------------------------------- IMPOSTAZIONI
function vistaImpostazioni() {
  const imp = stato.dati.impostazioni;
  const tutte = stato.dati.abitudini;
  return `${intro("Impostazioni", "Scegli le abitudini da seguire e i tuoi obiettivi. Puoi spegnere un'abitudine senza perdere quello che hai già segnato.", `<button class="btn pieno" data-azione="nuova-abitudine">+ Abitudine</button>`)}
    <div class="griglia-imp">
      <section class="pannello"><h3>Le mie abitudini</h3><p class="sotto">Le frecce cambiano l'ordine in cui le vedi nella pagina Oggi.</p>
        <div class="elenco-impostazioni">${tutte.map((a, i) => `<div class="voce-imp"><div>${esc(a.icona)} <b>${esc(a.nome)}</b> ${a.attiva === "si" ? "" : pillTesto("spenta")}<small>${esc(etichetta(AREE, a.area))} · ${a.tipo === "quantita" ? `almeno ${numeroIt(a.obiettivo_giorno)} ${esc(a.unita)} al giorno` : "spunta"} · ${a.obiettivo_settimana} giorni a settimana${a.fonte !== "manuale" ? " · automatica" : ""}</small></div>
          <div class="pulsanti-rapidi" style="margin:0;flex-wrap:nowrap"><button class="btn chiaro piccolo" data-azione="sposta-abitudine" data-id="${a.id}" data-passo="-1" ${i === 0 ? "disabled" : ""} aria-label="Più su">↑</button><button class="btn chiaro piccolo" data-azione="sposta-abitudine" data-id="${a.id}" data-passo="1" ${i === tutte.length - 1 ? "disabled" : ""} aria-label="Più giù">↓</button><button class="btn chiaro piccolo" data-azione="accendi-abitudine" data-id="${a.id}">${a.attiva === "si" ? "Spegni" : "Accendi"}</button><button class="btn chiaro piccolo" data-azione="modifica-abitudine" data-id="${a.id}">Modifica</button></div></div>`).join("")}</div>
      </section>
      <section class="pannello"><h3>Obiettivi e avvisi</h3>
        <form id="form-impostazioni">
          ${campo("Minuti di movimento a settimana", `<input type="number" name="obiettivo_movimento" min="10" max="2000" step="10" value="${imp.obiettivo_movimento}">`, "Le linee guida dell'Organizzazione Mondiale della Sanità per gli adulti indicano almeno 150 minuti di attività moderata a settimana. Scegli quello che va bene per te.")}
          <div style="height:12px"></div>
          ${campo("Avvisami prima di quanti giorni", `<input type="number" name="giorni_avviso" min="1" max="60" value="${imp.giorni_avviso}">`, "Vale per i prodotti da sostituire e per i promemoria in arrivo. Per i farmaci si sceglie nella scheda di ognuno.")}
          <div style="height:14px"></div>
          <button class="btn pieno">Salva</button>
        </form>
      </section>
    </div>`;
}

// ---------------------------------------------------------------- ESPORTA E BACKUP
function vistaEsporta() {
  const d = stato.dati;
  return `${intro("Esporta e backup", "Scarica i tuoi dati in Excel, oppure fai una copia di sicurezza.")}
    <div class="tre-colonne">
      <section class="pannello"><h3>Tutto in Excel</h3><p class="sotto">Un file con un foglio per ogni parte: Come stai, Abitudini, Movimento, Pasti, Farmaci, Dosi prese, Visite, Prodotti.</p><a class="btn pieno" href="${API}/esporta-excel">Scarica il file Excel</a></section>
      <section class="pannello"><h3>Copia di sicurezza di tutto il sito</h3><p class="sotto">Copia l'intero file dei dati (tutte le sezioni) nella cartella backup.</p><button class="btn chiaro" data-azione="backup">Fai la copia ora</button></section>
      <section class="pannello"><h3>File di trasferimento</h3><p class="sotto">Solo i dati del Benessere, in un file che si può reimportare (per esempio su un altro computer).</p>
        <div class="pulsanti-rapidi"><a class="btn chiaro piccolo" href="${API}/esporta-backup">Scarica</a><button class="btn chiaro piccolo" data-azione="ripristina">Ripristina da file...</button></div>
        <small style="color:var(--inchiostro-tenue)">Il ripristino sostituisce tutti i dati del Benessere (prima viene fatta una copia di sicurezza).</small></section>
    </div>
    <div class="spazio"></div>
    <section class="pannello"><h3>Cosa c'è adesso</h3><dl class="dati-scheda" style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr))">
      ${dato("Giorni di diario", d.diario.length)}${dato("Abitudini", d.abitudini.length)}${dato("Attività", d.attivita.length)}${dato("Pasti", d.pasti.length)}
      ${dato("Farmaci e integratori", d.farmaci.length)}${dato("Dosi registrate", d.assunzioni.length)}${dato("Visite e appuntamenti", d.appuntamenti.length)}${dato("Prodotti", d.prodotti.length)}
    </dl></section>`;
}

// ---------------------------------------------------------------- finestre
function apriFinestra(contenuto, stretta = true) {
  finestra.innerHTML = `<div class="velo"><section class="finestra ${stretta ? "stretta" : ""}" role="dialog" aria-modal="true">${contenuto}</section></div>`;
  finestra.querySelector(".corpo input:not([type=hidden]):not([type=checkbox]), .corpo textarea, .corpo select")?.focus();
}
function chiudiFinestra() { finestra.innerHTML = ""; }
function testaFinestra(sopra, titolo) { return `<header><div><p class="etichetta">${esc(sopra)}</p><h2>${esc(titolo)}</h2></div><button class="chiudi" type="button" data-chiudi aria-label="Chiudi">×</button></header>`; }
function modulo(tipo, id, sopra, titolo, corpo, extra = "") {
  return `<form id="modulo" data-tipo="${tipo}" data-id="${id || ""}">${testaFinestra(sopra, titolo)}<div class="corpo"><p class="avviso errore errore-finestra" hidden></p>${corpo}</div>
    <footer>${id && extra !== null ? `<button type="button" class="btn pericolo" data-azione="elimina" data-tipo="${tipo}" data-id="${id}" style="margin-right:auto">Elimina</button>` : ""}${extra || ""}<button type="button" class="btn chiaro" data-chiudi>Annulla</button><button class="btn pieno">Salva</button></footer></form>`;
}

function formAttivita(x = {}) {
  apriFinestra(modulo("attivita", x.id, "Movimento", x.id ? "Modifica attività" : "Nuova attività", `
    <div class="griglia due">${campo("Giorno", `<input type="date" name="data" value="${esc(x.data || stato.giorno)}" max="${chiaveGiorno()}" required>`)}
      ${campo("Attività", `<input name="tipo" list="lista-attivita" value="${esc(x.tipo || "Camminata")}" required><datalist id="lista-attivita">${[...new Set([...TIPI_ATTIVITA, ...stato.dati.attivita.map((a) => a.tipo)])].map((t) => `<option value="${esc(t)}">`).join("")}</datalist>`, "Scegli dall'elenco o scrivi tu.")}</div>
    <div class="griglia tre">${campo("Minuti", `<input type="number" name="minuti" min="1" max="600" value="${esc(x.minuti ?? 30)}" required>`)}
      ${campo("Intensità", `<select name="intensita">${opzioni(INTENSITA, x.intensita || "media")}</select>`)}
      ${campo("Passi (se li sai)", `<input type="number" name="passi" min="0" value="${x.passi || ""}">`)}</div>
    ${campo("Note", `<textarea name="note" rows="2">${esc(x.note || "")}</textarea>`)}`));
}
function formPasto(p = {}) {
  const descrizioni = [...new Set(stato.dati.pasti.map((x) => x.descrizione).filter(Boolean))].slice(0, 200);
  apriFinestra(modulo("pasto", p.id, "Alimentazione", p.id ? "Modifica pasto" : "Nuovo pasto", `
    <div class="griglia due">${campo("Giorno", `<input type="date" name="data" value="${esc(p.data || stato.giorno)}" max="${chiaveGiorno()}" required>`)}
      ${campo("Momento", `<select name="momento">${opzioni(MOMENTI, p.momento || momentoAdesso())}</select>`)}</div>
    ${campo("Cosa hai mangiato", `<input name="descrizione" list="lista-pasti" value="${esc(p.descrizione || "")}" placeholder="Per esempio: pasta al pomodoro e insalata"><datalist id="lista-pasti">${descrizioni.map((t) => `<option value="${esc(t)}">`).join("")}</datalist>`, "Mentre scrivi ti propone i pasti che hai già registrato.")}
    <p class="domanda">Etichette (facoltative)</p>${chipsScelta("etichette", ETICHETTE_PASTO, p.etichette)}
    ${campo("Note", `<textarea name="note" rows="2" placeholder="Come ti sei sentita, dove eri...">${esc(p.note || "")}</textarea>`)}`));
}
function formFarmaco(f = {}) {
  const giorni = new Set((f.giorni || "1234567").split(""));
  apriFinestra(modulo("farmaco", f.id, "Farmaci e integratori", f.id ? `Modifica: ${f.nome}` : "Nuovo farmaco o integratore", `
    <div class="griglia due">${campo("Nome", `<input name="nome" value="${esc(f.nome || "")}" required placeholder="Per esempio: Vitamina D">`)}
      ${campo("Tipo", `<select name="tipo">${opzioni(TIPI_FARMACO, f.tipo || "farmaco")}</select>`)}</div>
    <div class="griglia due">${campo("Dose", `<input name="dose" value="${esc(f.dose || "")}" placeholder="Per esempio: 1 compressa, 10 gocce">`)}
      ${campo("Quante unità della scorta usa ogni dose", `<input type="number" name="unita_per_dose" min="0.25" step="0.25" value="${esc(f.unita_per_dose ?? 1)}">`, "Di solito 1 (una compressa). Serve per scalare la scorta.")}</div>
    ${campo("Orari", `<input name="orari" value="${esc((f.orari || "").replaceAll(",", ", "))}" placeholder="Per esempio: 08:00, 20:00">`, "Separali con la virgola. Lascia vuoto se lo prendi solo al bisogno.")}
    <p class="domanda">In quali giorni</p><div class="chips">${GIORNI_SETT.map(([v, n]) => `<label><input type="checkbox" name="giorni" value="${v}" ${giorni.has(v) ? "checked" : ""}>${n}</label>`).join("")}</div>
    <div class="griglia due">${campo("Dal", `<input type="date" name="dal" value="${esc(f.dal || "")}">`)}${campo("Al (fine terapia)", `<input type="date" name="al" value="${esc(f.al || "")}">`, "Vuoto se non c'è una fine.")}</div>
    <div class="griglia due">${campo("Scorta attuale (unità)", `<input type="number" name="scorta" min="0" step="0.25" value="${f.scorta ?? ""}" placeholder="Per esempio: 28">`, "Quante compresse (o dosi) hai in casa. Vuoto se non vuoi seguirla.")}
      ${campo("Avvisami quando restano giorni", `<input type="number" name="avviso_giorni" min="1" max="60" value="${esc(f.avviso_giorni ?? 7)}">`)}</div>
    <div class="griglia due">${campo("A cosa serve", `<input name="a_cosa_serve" value="${esc(f.a_cosa_serve || "")}">`)}${campo("Prescritto da", `<input name="prescritto_da" value="${esc(f.prescritto_da || "")}">`)}</div>
    ${campo("Note", `<textarea name="note" rows="2" placeholder="Per esempio: a stomaco pieno">${esc(f.note || "")}</textarea>`)}`));
}
function apriFarmaco(id) {
  const f = farmacoDi(id);
  if (!f) return;
  const ultime = stato.dati.assunzioni.filter((x) => x.farmaco_id === f.id).slice(0, 8);
  apriFinestra(`${testaFinestra(etichetta(TIPI_FARMACO, f.tipo), f.nome)}<div class="corpo">
    <dl class="dati-scheda">${dato("Dose", esc(f.dose))}${dato("Orari", f.orari ? esc(f.orari.replaceAll(",", ", ")) : "al bisogno")}${dato("Giorni", (f.giorni || "1234567") === "1234567" ? "tutti" : esc(f.giorni.split("").map((g) => etichetta(GIORNI_SETT, g)).join(", ")))}
    ${dato("Periodo", esc([f.dal ? `dal ${dataIt(f.dal)}` : "", f.al ? `al ${dataIt(f.al)}` : ""].filter(Boolean).join(" ")))}${dato("Scorta", f.scorta !== null && f.scorta !== undefined ? `${numeroIt(f.scorta)}${fineScorta(f) ? ` · finisce verso il ${esc(dataIt(fineScorta(f)))}` : ""}` : "")}
    ${dato("A cosa serve", esc(f.a_cosa_serve))}${dato("Prescritto da", esc(f.prescritto_da))}${dato("Note", esc(f.note))}
    ${dato("Ultime dosi prese", ultime.map((x) => `${esc(dataIt(x.data))} ${esc(x.ora_presa)}`).join("<br>"))}</dl></div>
    <footer><button class="btn chiaro" data-azione="sospendi-farmaco" data-id="${f.id}" style="margin-right:auto">${f.attivo === "si" ? "Sospendi" : "Riprendi"}</button>${f.scorta !== null && f.scorta !== undefined ? `<button class="btn chiaro" data-azione="ricarica-scorta" data-id="${f.id}">+ Confezione</button>` : ""}<button class="btn chiaro" data-chiudi>Chiudi</button><button class="btn pieno" data-azione="modifica-farmaco" data-id="${f.id}">Modifica</button></footer>`);
}
function formScorta(f) {
  apriFinestra(modulo("scorta", f.id, f.nome, "Ho comprato una confezione", `
    <p class="aiuto">Scorta attuale: ${numeroIt(f.scorta || 0)}. Scrivi quante unità (compresse, bustine, dosi) ci sono nella confezione nuova: verranno aggiunte.</p>
    ${campo("Unità nella confezione", `<input type="number" name="quantita" min="0.25" step="0.25" value="${esc(f.ultima_confezione || 30)}" required>`)}`, null));
}
function formAppuntamento(a = {}, categoria = "") {
  const cat = a.categoria || categoria || "medico";
  apriFinestra(modulo("appuntamento", a.id, "Visite e appuntamenti", a.id ? `Modifica: ${a.titolo}` : "Nuova visita o appuntamento", `
    <div class="griglia due">${campo("Tipo", `<select name="categoria">${opzioni(CATEGORIE, cat)}</select>`)}
      ${campo("Titolo", `<input name="titolo" value="${esc(a.titolo || "")}" placeholder="Per esempio: Pulizia dei denti, Mammografia">`, "Se lo lasci vuoto uso il tipo.")}</div>
    <div class="griglia tre">${campo("Giorno", `<input type="date" name="data" value="${esc(a.data || "")}" required>`)}${campo("Ora", `<input type="time" name="ora" value="${esc(a.ora || "")}">`)}
      ${campo("Stato", `<select name="stato">${opzioni(STATI_APP.map(([v, n]) => [v, n]), a.stato || "programmato")}</select>`, "\"Da prenotare\": il giorno è indicativo.")}</div>
    <div class="griglia due">${campo("Medico o persona", `<input name="persona" value="${esc(a.persona || "")}">`)}${campo("Luogo", `<input name="luogo" value="${esc(a.luogo || "")}">`)}</div>
    <div class="griglia due">${campo("Si ripete", `<select name="ripeti_mesi">${opzioni(RIPETI, a.ripeti_mesi || 0)}</select>`, "Quando lo segni come fatto, il prossimo si prepara da solo.")}
      ${campo("Preparazione", `<input name="preparazione" value="${esc(a.preparazione || "")}" placeholder="Per esempio: a digiuno, portare le analisi">`)}</div>
    ${campo("Note", `<textarea name="note" rows="2">${esc(a.note || "")}</textarea>`)}
    ${a.id ? `<div style="height:12px"></div>${campo("Esito", `<textarea name="esito" rows="2">${esc(a.esito || "")}</textarea>`)}` : ""}`), false);
}
function apriAppuntamento(id) {
  const a = stato.dati.appuntamenti.find((x) => x.id === Number(id));
  if (!a) return;
  const precedente = stato.dati.appuntamenti.find((x) => x.id === a.precedente_id);
  apriFinestra(`${testaFinestra(etichetta(CATEGORIE, a.categoria), a.titolo)}<div class="corpo">
    <p>${pill(STATI_APP, a.stato)}</p>
    <dl class="dati-scheda">${dato(a.stato === "da_prenotare" ? "Da prenotare verso il" : "Quando", `${esc(dataLunga(a.data))}${a.ora && a.stato !== "da_prenotare" ? ` alle ${esc(a.ora)}` : ""}`)}
    ${dato("Medico o persona", esc(a.persona))}${dato("Luogo", esc(a.luogo))}${dato("Preparazione", esc(a.preparazione))}${dato("Si ripete", a.ripeti_mesi ? esc(etichetta(RIPETI, a.ripeti_mesi)) : "")}
    ${dato("Note", esc(a.note))}${dato("Esito", esc(a.esito))}${dato("Volta precedente", precedente ? `${esc(dataIt(precedente.data))}${precedente.esito ? `: ${esc(precedente.esito)}` : ""}` : "")}</dl></div>
    <footer>${a.stato === "da_prenotare" ? `<button class="btn chiaro" data-azione="prenota" data-id="${a.id}" style="margin-right:auto">Ho prenotato</button>` : a.stato === "programmato" ? `<button class="btn chiaro" data-azione="fatto-appuntamento" data-id="${a.id}" style="margin-right:auto">Segna come fatto</button>` : ""}<button class="btn chiaro" data-chiudi>Chiudi</button><button class="btn pieno" data-azione="modifica-appuntamento" data-id="${a.id}">Modifica</button></footer>`);
}
function formFatto(a) {
  apriFinestra(modulo("fatto", a.id, a.titolo, "Visita fatta", `
    ${campo("Giorno", `<input type="date" name="data" value="${esc(a.data > chiaveGiorno() ? chiaveGiorno() : a.data)}" required>`)}
    <div style="height:12px"></div>
    ${campo("Esito o cosa ti hanno detto", `<textarea name="esito" rows="3">${esc(a.esito || "")}</textarea>`)}
    ${a.ripeti_mesi ? `<p class="aiuto" style="margin-top:12px">Si ripete ${esc(etichetta(RIPETI, a.ripeti_mesi).toLowerCase())}: preparo il prossimo in "Da prenotare".</p>` : ""}`, null));
}
function formPrenota(a) {
  apriFinestra(modulo("prenota", a.id, a.titolo, "Ho prenotato", `
    <div class="griglia due">${campo("Giorno", `<input type="date" name="data" value="${esc(a.data >= chiaveGiorno() ? a.data : "")}" required>`)}${campo("Ora", `<input type="time" name="ora" value="${esc(a.ora || "")}">`)}</div>
    <div class="griglia due">${campo("Medico o persona", `<input name="persona" value="${esc(a.persona || "")}">`)}${campo("Luogo", `<input name="luogo" value="${esc(a.luogo || "")}">`)}</div>`, null));
}
function formProdotto(p = {}) {
  apriFinestra(modulo("prodotto", p.id, "Cura dell'aspetto", p.id ? `Modifica: ${p.nome}` : "Nuovo prodotto", `
    <div class="griglia due">${campo("Nome", `<input name="nome" value="${esc(p.nome || "")}" required placeholder="Per esempio: Crema notte">`)}${campo("Marca", `<input name="marca" value="${esc(p.marca || "")}">`)}</div>
    <div class="griglia due">${campo("Per", `<select name="uso">${opzioni(USI, p.uso || "viso")}</select>`)}${campo("Stato", `<select name="stato">${opzioni(STATI_PRODOTTO.map(([v, n]) => [v, n]), p.stato || "in_uso")}</select>`)}</div>
    <div class="griglia tre">${campo("Aperto il", `<input type="date" name="aperto_il" value="${esc(p.aperto_il || "")}">`)}
      ${campo("Dura dopo l'apertura (mesi)", `<select name="durata_mesi">${opzioni([[0, "Non lo so"], [3, "3 mesi"], [6, "6 mesi"], [9, "9 mesi"], [12, "12 mesi"], [18, "18 mesi"], [24, "24 mesi"], [36, "36 mesi"]], p.durata_mesi || 0)}</select>`)}
      ${campo("Da sostituire il", `<input type="date" name="scadenza" value="${esc(p.scadenza || "")}">`, "Si calcola da solo se lasci vuoto.")}</div>
    <div class="griglia due">${campo("Ti piace?", `<select name="voto">${opzioni([[0, "Non ancora deciso"], [1, "★"], [2, "★★"], [3, "★★★"], [4, "★★★★"], [5, "★★★★★"]], p.voto || 0)}</select>`)}${campo("Lo ricompreresti?", `<select name="ricomprare">${opzioni(RICOMPRARE, p.ricomprare || "")}</select>`)}</div>
    ${campo("Note", `<textarea name="note" rows="2">${esc(p.note || "")}</textarea>`)}`));
}
function apriProdotto(id) {
  const p = stato.dati.prodotti.find((x) => x.id === Number(id));
  if (!p) return;
  apriFinestra(`${testaFinestra(etichetta(USI, p.uso), p.nome)}<div class="corpo"><p>${pill(STATI_PRODOTTO, p.stato)}</p>
    <dl class="dati-scheda">${dato("Marca", esc(p.marca))}${dato("Aperto il", esc(dataIt(p.aperto_il)))}${dato("Dura dopo l'apertura", p.durata_mesi ? `${p.durata_mesi} mesi` : "")}${dato("Da sostituire il", esc(dataIt(p.scadenza)))}
    ${dato("Voto", p.voto ? "★".repeat(p.voto) : "")}${dato("Lo ricompreresti?", p.ricomprare ? esc(etichetta(RICOMPRARE, p.ricomprare)) : "")}${dato("Note", esc(p.note))}</dl></div>
    <footer>${p.stato !== "in_uso" ? `<button class="btn chiaro" data-azione="prodotto-aperto" data-id="${p.id}" style="margin-right:auto">L'ho aperto oggi</button>` : `<button class="btn chiaro" data-azione="prodotto-finito" data-id="${p.id}" style="margin-right:auto">È finito</button>`}<button class="btn chiaro" data-chiudi>Chiudi</button><button class="btn pieno" data-azione="modifica-prodotto" data-id="${p.id}">Modifica</button></footer>`);
}
function formAbitudine(a = {}, area = "") {
  const giorni = new Set((a.giorni || "1234567").split(""));
  apriFinestra(modulo("abitudine", a.id, "Impostazioni", a.id ? `Modifica: ${a.nome}` : "Nuova abitudine", `
    <div class="griglia due">${campo("Nome", `<input name="nome" value="${esc(a.nome || "")}" required placeholder="Per esempio: Leggere 10 pagine">`)}${campo("Area", `<select name="area">${opzioni(AREE, a.area || area || "abitudini")}</select>`)}</div>
    <p class="domanda">Simbolo</p><div class="chips">${ICONE.map((i) => `<label><input type="radio" name="icona" value="${esc(i)}" ${(a.icona || "🌸") === i ? "checked" : ""}>${esc(i)}</label>`).join("")}</div>
    <div class="griglia tre">${campo("Come la segni", `<select name="tipo">${opzioni([["spunta", "Con una spunta (fatto / non fatto)"], ["quantita", "Con un numero (bicchieri, minuti...)"]], a.tipo || "spunta")}</select>`)}
      ${campo("Unità (se è un numero)", `<input name="unita" value="${esc(a.unita || "")}" placeholder="bicchieri, minuti, pagine">`)}
      ${campo("Obiettivo al giorno (se è un numero)", `<input type="number" name="obiettivo_giorno" min="0.5" step="0.5" value="${esc(a.obiettivo_giorno ?? 1)}">`)}</div>
    <p class="domanda">In quali giorni conta</p><div class="chips">${GIORNI_SETT.map(([v, n]) => `<label><input type="checkbox" name="giorni" value="${v}" ${giorni.has(v) ? "checked" : ""}>${n}</label>`).join("")}</div>
    <div class="griglia due">${campo("Obiettivo gentile: quanti giorni a settimana", `<select name="obiettivo_settimana">${opzioni([1, 2, 3, 4, 5, 6, 7].map((n) => [n, `${n} ${n === 1 ? "giorno" : "giorni"}`]), a.obiettivo_settimana || 5)}</select>`, "Non serve farla tutti i giorni per essere brava.")}
      ${campo("Si compila", `<select name="fonte">${opzioni(FONTI, a.fonte || "manuale")}</select>`)}</div>
    ${campo("Note", `<textarea name="note" rows="2">${esc(a.note || "")}</textarea>`)}`));
}

// ---------------------------------------------------------------- stampa
function stampaMedico() {
  const box = document.getElementById("stampa");
  const html = document.getElementById("riepilogo-medico")?.innerHTML || "";
  box.innerHTML = `<h1>Elena Rossi · Benessere</h1>${html}`;
  window.print();
}

// ---------------------------------------------------------------- azioni
async function azioneRapida(percorso, corpo, messaggio) { try { await salva(percorso, "POST", corpo, messaggio); } catch { /* già mostrato */ } }
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
    case "vai-oggi": stato.giorno = chiaveGiorno(); vai("oggi"); break;
    case "giorno": { const p = Number(b.dataset.passo); stato.giorno = p === 0 ? chiaveGiorno() : spostaGiorni(p, stato.giorno); if (stato.giorno > chiaveGiorno()) stato.giorno = chiaveGiorno(); disegna(); break; }
    case "settimana": { const p = Number(b.dataset.passo); stato.lunedi = p === 0 ? lunediDi(chiaveGiorno()) : spostaGiorni(7 * p, stato.lunedi); disegna(); break; }
    case "mese-umore": { const p = Number(b.dataset.passo); const [a, m] = stato.meseUmore.split("-").map(Number); const d = p === 0 ? new Date() : new Date(a, m - 1 + p, 1); stato.meseUmore = chiaveGiorno(d).slice(0, 7); disegna(); break; }
    case "apri-giorno": stato.giorno = b.dataset.giorno; vai("oggi"); break;
    case "pagina": stato.pag[b.dataset.chiave] = Number(b.dataset.pagina); disegna(); window.scrollTo(0, 0); break;
    case "spunta": case "conta": await azioneRapida("segna", { data: stato.giorno, abitudine_id: id, valore: Number(b.dataset.valore) }); break;
    case "diario": await azioneRapida("diario", { data: stato.giorno, [b.dataset.campo]: Number(b.dataset.valore) }); break;
    case "parola": {
      const attuali = new Set(String(diarioDi(stato.giorno)?.parole || "").split(",").filter(Boolean));
      if (attuali.has(b.dataset.parola)) attuali.delete(b.dataset.parola); else attuali.add(b.dataset.parola);
      await azioneRapida("diario", { data: stato.giorno, parole: [...attuali].join(",") }); break;
    }
    case "prendi": await azioneRapida("prendi", { data: stato.giorno, farmaco_id: id, orario: b.dataset.orario, preso: b.dataset.preso }); break;
    case "attivita-rapida": await azioneRapida("attivita", { data: stato.giorno, tipo: b.dataset.tipo, minuti: Number(b.dataset.minuti), intensita: "media" }, `${b.dataset.tipo} registrata: ${b.dataset.minuti} minuti.`); break;
    case "nuova-attivita": formAttivita(); break;
    case "modifica-attivita": formAttivita(stato.dati.attivita.find((x) => x.id === id)); break;
    case "nuovo-pasto": formPasto(b.dataset.momento ? { momento: b.dataset.momento } : {}); break;
    case "modifica-pasto": formPasto(stato.dati.pasti.find((x) => x.id === id)); break;
    case "rifai-pasto": { const p = stato.dati.pasti.find((x) => x.id === id); await azioneRapida("pasto", { ...p, id: undefined, data: chiaveGiorno(), creato: undefined }, "Pasto registrato per oggi."); break; }
    case "nuovo-farmaco": formFarmaco(); break;
    case "apri-farmaco": apriFarmaco(id); break;
    case "modifica-farmaco": formFarmaco(farmacoDi(id)); break;
    case "ricarica-scorta": formScorta(farmacoDi(id)); break;
    case "sospendi-farmaco": { const f = farmacoDi(id); try { await salva(`farmaco?id=${id}`, "PATCH", { attivo: f.attivo === "si" ? "no" : "si" }, f.attivo === "si" ? "Farmaco sospeso." : "Farmaco ripreso."); chiudiFinestra(); } catch { /* già mostrato */ } break; }
    case "gruppo-farmaci": stato.filtri.gruppoFarmaci = b.dataset.gruppo; disegna(); break;
    case "nuovo-appuntamento": formAppuntamento({}, b.dataset.categoria || ""); break;
    case "apri-appuntamento": apriAppuntamento(id); break;
    case "modifica-appuntamento": formAppuntamento(stato.dati.appuntamenti.find((x) => x.id === id)); break;
    case "fatto-appuntamento": formFatto(stato.dati.appuntamenti.find((x) => x.id === id)); break;
    case "prenota": formPrenota(stato.dati.appuntamenti.find((x) => x.id === id)); break;
    case "gruppo-visite": stato.filtri.gruppoVisite = b.dataset.gruppo; stato.pag.visite = 1; disegna(); break;
    case "nuovo-prodotto": formProdotto(); break;
    case "apri-prodotto": apriProdotto(id); break;
    case "modifica-prodotto": formProdotto(stato.dati.prodotti.find((x) => x.id === id)); break;
    case "prodotto-aperto": try { await salva(`prodotto?id=${id}`, "PATCH", { stato: "in_uso", aperto_il: chiaveGiorno() }, "Segnato come aperto oggi."); chiudiFinestra(); } catch { /* già mostrato */ } break;
    case "prodotto-finito": try { await salva(`prodotto?id=${id}`, "PATCH", { stato: "finito" }, "Prodotto finito. Se vuoi ricomprarlo, cambia lo stato in \"Da comprare\"."); chiudiFinestra(); } catch { /* già mostrato */ } break;
    case "gruppo-prodotti": stato.filtri.gruppoProdotti = b.dataset.gruppo; stato.pag.prodotti = 1; disegna(); break;
    case "nuova-abitudine": formAbitudine({}, b.dataset.area || ""); break;
    case "modifica-abitudine": formAbitudine(stato.dati.abitudini.find((x) => x.id === id)); break;
    case "accendi-abitudine": { const a = stato.dati.abitudini.find((x) => x.id === id); await salva(`abitudine?id=${id}`, "PATCH", { attiva: a.attiva === "si" ? "no" : "si" }, a.attiva === "si" ? `"${a.nome}" spenta: non la vedrai più nella pagina Oggi.` : `"${a.nome}" accesa.`).catch(() => {}); break; }
    case "sposta-abitudine": {
      const ordine = stato.dati.abitudini.map((a) => a.id);
      const i = ordine.indexOf(id), j = i + Number(b.dataset.passo);
      if (j < 0 || j >= ordine.length) break;
      [ordine[i], ordine[j]] = [ordine[j], ordine[i]];
      await azioneRapida("ordina-abitudini", { ordine }); break;
    }
    case "periodo-medico": stato.medico.a = chiaveGiorno(); stato.medico.da = aggiungiMesi(chiaveGiorno(), -Number(b.dataset.mesi)); await caricaMedico(); break;
    case "stampa-medico": stampaMedico(); break;
    case "backup": try { const r = await fetch("/api/sistema/backup", { method: "POST" }); const d = await r.json(); if (!r.ok) throw new Error(d.errore); avviso(d.messaggio || `Copia di sicurezza fatta: backup\\${d.file}`); } catch (e) { avviso(`Copia non riuscita: ${e.message}`, "errore"); } break;
    case "ripristina": document.getElementById("file-ripristino").click(); break;
    case "elimina": {
      const nomi = { attivita: "questa attività", pasto: "questo pasto", farmaco: "questo farmaco e tutte le dosi registrate", appuntamento: "questo appuntamento", prodotto: "questo prodotto", abitudine: "questa abitudine e tutto quello che hai segnato (se vuoi solo smettere di vederla, usa Spegni)" };
      if (!window.confirm(`Vuoi eliminare ${nomi[b.dataset.tipo] || "questo elemento"}?`)) break;
      try { await salva(`${b.dataset.tipo}?id=${id}`, "DELETE", null, "Eliminato."); chiudiFinestra(); } catch { /* già mostrato */ }
      break;
    }
    default: break;
  }
}
async function caricaMedico() {
  try { stato.medico.dati = await chiama(`medico?da=${stato.medico.da}&a=${stato.medico.a}`); } catch (e) { avviso(e.message, "errore"); return; }
  disegna();
}

app.addEventListener("click", gestisciClic);
finestra.addEventListener("click", gestisciClic);

// Note del diario e ore di sonno: si salvano quando si esce dalla casella
app.addEventListener("change", async (evento) => {
  const el = evento.target;
  if (el.dataset.diario) { await azioneRapida("diario", { data: stato.giorno, [el.dataset.diario]: el.value }, el.tagName === "TEXTAREA" ? "Salvato." : ""); return; }
  if (el.dataset.filtro === "movimento") { stato.filtri.movimento = el.value; stato.pag.movimento = 1; disegna(); }
});
app.addEventListener("input", (evento) => {
  const el = evento.target;
  if (el.dataset.filtro === "pasti") {
    stato.filtri.pasti = el.value; stato.pag.pasti = 1; disegna();
  }
});

app.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  const form = evento.target;
  const dati = Object.fromEntries(new FormData(form).entries());
  if (form.id === "form-impostazioni") { try { await salva("impostazioni", "POST", dati, "Impostazioni salvate."); } catch { /* già mostrato */ } }
  if (form.id === "form-medico") { stato.medico.da = dati.da; stato.medico.a = dati.a; await caricaMedico(); }
});

finestra.addEventListener("submit", async (evento) => {
  const form = evento.target.closest("#modulo");
  if (!form) return;
  evento.preventDefault();
  const fd = new FormData(form);
  const dati = Object.fromEntries(fd.entries());
  ["giorni", "etichette"].forEach((n) => { if (form.querySelector(`[name="${n}"]`)) dati[n] = fd.getAll(n).join(n === "giorni" ? "" : ","); });
  const id = Number(form.dataset.id) || 0;
  const tipo = form.dataset.tipo;
  try {
    if ((tipo === "abitudine" || tipo === "farmaco") && !dati.giorni) { avvisoFinestra("Scegli almeno un giorno della settimana."); return; }
    if (tipo === "scorta") {
      const f = farmacoDi(id);
      await salva(`farmaco?id=${id}`, "PATCH", { scorta: (f.scorta || 0) + Number(dati.quantita || 0) }, `Scorta aggiornata: ${numeroIt((f.scorta || 0) + Number(dati.quantita || 0))}.`);
    } else if (tipo === "fatto") {
      const r = await salva("appuntamento-fatto", "POST", { id, ...dati });
      avviso(r.prossimo ? "Fatto. Ho preparato il prossimo controllo in \"Da prenotare\"." : "Segnato come fatto.");
    } else if (tipo === "prenota") {
      await salva(`appuntamento?id=${id}`, "PATCH", { ...dati, stato: "programmato" }, "Appuntamento prenotato: lo trovi anche nell'agenda della pagina iniziale.");
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
    if (dati.formato !== "benessere-1") throw new Error("questo file non è un file di trasferimento della sezione Benessere.");
    if (!window.confirm(`Nel file ci sono ${dati.diario?.length || 0} giorni di diario e ${dati.abitudini?.length || 0} abitudini. TUTTI i dati attuali del Benessere verranno sostituiti. Procedo?`)) return;
    const copia = await fetch("/api/sistema/backup", { method: "POST" });
    if (!copia.ok) throw new Error("non riesco a fare prima la copia di sicurezza: ripristino annullato.");
    await salva("ripristina", "POST", { dati }, "Ripristino fatto.");
  } catch (e) {
    avviso(`Ripristino non riuscito: ${e.message}`, "errore");
  }
});

// Link diretti dalla pagina iniziale: #appuntamento-3, #farmaco-2, #prodotto-5
function apriDaIndirizzo() {
  const m = location.hash.match(/^#(appuntamento|farmaco|prodotto)-(\d+)$/);
  if (!m) return false;
  const vista = { appuntamento: "visite", farmaco: "farmaci", prodotto: "aspetto" }[m[1]];
  const id = Number(m[2]);
  if (m[1] === "appuntamento") {
    const a = stato.dati.appuntamenti.find((x) => x.id === id);
    if (a) stato.filtri.gruppoVisite = a.stato === "da_prenotare" ? "da_prenotare" : ["fatto", "annullato"].includes(a.stato) ? "passati" : ["parrucchiere", "estetista"].includes(a.categoria) ? "cura" : "programmato";
  }
  if (m[1] === "farmaco") { const f = farmacoDi(id); if (f) stato.filtri.gruppoFarmaci = f.attivo === "si" ? "attivi" : "sospesi"; }
  if (m[1] === "prodotto") { const p = stato.dati.prodotti.find((x) => x.id === id); if (p) stato.filtri.gruppoProdotti = p.stato; }
  history.replaceState(null, "", `#${stato.vista = vista}`);
  disegna();
  ({ appuntamento: apriAppuntamento, farmaco: apriFarmaco, prodotto: apriProdotto })[m[1]](id);
  return true;
}
window.addEventListener("hashchange", () => {
  if (apriDaIndirizzo()) return;
  const v = location.hash.slice(1);
  if (v && v !== stato.vista && VISTE.some(([k]) => k === v)) { stato.vista = v; disegna(); }
});
if (/^#(appuntamento|farmaco|prodotto)-/.test(location.hash)) stato.vista = "oggi";
if (!VISTE.some(([k]) => k === stato.vista)) stato.vista = "oggi";

disegna();
ricarica().then(apriDaIndirizzo);
