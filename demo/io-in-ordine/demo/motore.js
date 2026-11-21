/* =====================================================================
   "Io, in ordine" - VERSIONE DIMOSTRATIVA
   Motore finto: fa nel browser quello che nel programma vero fa il
   piccolo server in Python (server.py e i file modulo.py delle sezioni).
   - Le pagine chiedono i dati a indirizzi che iniziano con /api/...:
     qui quelle richieste vengono intercettate e servite da questo file.
   - I dati stanno nella memoria del browser (localStorage) del visitatore.
     Niente viene mai mandato su Internet.
   - I dati di partenza sono in dati-demo.js.
   ===================================================================== */
(function () {
  "use strict";

  const SCRIPT = document.currentScript;
  const RADICE = (SCRIPT && SCRIPT.dataset.radice) || "";
  const CHIAVE = "io-in-ordine-demo";
  const CHIAVI_EXTRA = ["formazione_cronometro"]; // il cronometro della Formazione salva da solo nel browser
  const VERSIONE = 1;
  const GIORNI_VALIDITA = 7; // dopo una settimana i dati di esempio si rinnovano, così le date restano "di oggi"

  // ------------------------------------------------------------------ date e numeri
  const pad = (n) => String(n).padStart(2, "0");
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const oggiD = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); };
  const oggi = () => iso(oggiD());
  const oraHM = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
  const adesso = () => { const d = new Date(); return `${iso(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`; };
  function comeData(v) {
    if (!v) return null;
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(v));
    if (!m) return null;
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return d.getMonth() === Number(m[2]) - 1 ? d : null;
  }
  const piuGiorni = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const differenzaGiorni = (da, a) => Math.round((Date.UTC(a.getFullYear(), a.getMonth(), a.getDate()) - Date.UTC(da.getFullYear(), da.getMonth(), da.getDate())) / 86400000);
  const ultimoDelMese = (anno, mese) => new Date(anno, mese + 1, 0).getDate();
  function aggiungiMesi(d, mesi, fisso) {
    const tot = d.getMonth() + mesi;
    const anno = d.getFullYear() + Math.floor(tot / 12);
    const mese = ((tot % 12) + 12) % 12;
    return new Date(anno, mese, Math.min(fisso || d.getDate(), ultimoDelMese(anno, mese)));
  }
  const dataIt = (v) => { const d = comeData(v); return d ? `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}` : (v || ""); };
  const giornoSettimanaIso = (d) => ((d.getDay() + 6) % 7) + 1; // lunedì = 1
  const r2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
  function euro(v) {
    if (v === null || v === undefined) return "—";
    let [intera, dec] = Math.abs(v).toFixed(2).split(".");
    intera = intera.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `${v < 0 ? "-" : ""}${intera},${dec} €`;
  }
  const testo = (v, max = 20000) => (v === null || v === undefined ? "" : String(v)).trim().slice(0, max);
  const unisci = (lista, sep = " · ") => lista.filter((x) => x).join(sep);

  class Errore extends Error { constructor(messaggio, stato = 400) { super(messaggio); this.stato = stato; } }

  // ------------------------------------------------------------------ archivio nel browser
  let DB = null;
  const nuovoDB = () => ({ versione: VERSIONE, seminato: oggi(), t: {}, seq: {}, meta: {} });
  const tab = (nome) => DB.t[nome] || (DB.t[nome] = []);
  function aggiungi(nome, valori, idForzato) {
    let id = idForzato;
    if (!id) { DB.seq[nome] = (DB.seq[nome] || 0) + 1; id = DB.seq[nome]; }
    else if (id > (DB.seq[nome] || 0)) DB.seq[nome] = id;
    const riga = { id, ...valori };
    riga.id = id;
    tab(nome).push(riga);
    return id;
  }
  const trova = (nome, id) => tab(nome).find((r) => r.id === Number(id)) || null;
  const togli = (nome, condizione) => { DB.t[nome] = tab(nome).filter((r) => !condizione(r)); };
  const copia = (lista) => lista.map((r) => ({ ...r }));
  function confronta(a, b) {
    const va = a === undefined ? null : a, vb = b === undefined ? null : b;
    if (va === vb) return 0;
    if (va === null) return -1;
    if (vb === null) return 1;
    if (typeof va === "number" && typeof vb === "number") return va - vb;
    return String(va) < String(vb) ? -1 : String(va) > String(vb) ? 1 : 0;
  }
  // ordina(lista, ["campo", "-campo2"]): il segno meno vuol dire dal più grande al più piccolo
  function ordina(lista, chiavi) {
    return lista.sort((x, y) => {
      for (const k of chiavi) {
        const giu = typeof k === "string" && k.startsWith("-"), c = giu ? k.slice(1) : k;
        const v = typeof c === "function" ? confronta(c(x), c(y)) : confronta(x[c], y[c]);
        if (v) return giu ? -v : v;
      }
      return 0;
    });
  }
  function salvaDB() { try { localStorage.setItem(CHIAVE, JSON.stringify(DB)); } catch { /* memoria del browser non disponibile: i dati valgono finché la pagina resta aperta */ } }
  function leggiDB() {
    try {
      const d = JSON.parse(localStorage.getItem(CHIAVE) || "null");
      if (d && d.versione === VERSIONE && d.seminato) {
        const eta = differenzaGiorni(comeData(d.seminato) || oggiD(), oggiD());
        if (eta >= 0 && eta < GIORNI_VALIDITA) return d;
      }
    } catch { /* dati rovinati: si ricomincia dai dati di esempio */ }
    return null;
  }
  const meta = (chiave) => (chiave in DB.meta ? DB.meta[chiave] : null);
  const scriviMeta = (chiave, valore) => { DB.meta[chiave] = String(valore); };

  // ------------------------------------------------------------------ file Excel (stessa struttura di comune/xlsx.py)
  const F = (n) => (n === null || n === undefined ? null : { __decimale: Number(n) }); // importo: due decimali in Excel
  const escXml = (v) => String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const escAttr = (v) => escXml(v).replace(/"/g, "&quot;");
  function colonna(i) { let l = ""; i += 1; while (i) { const r = (i - 1) % 26; l = String.fromCharCode(65 + r) + l; i = Math.floor((i - 1) / 26); } return l; }
  function cella(rif, v, stile) {
    if (v === null || v === undefined || v === "") return `<c r="${rif}" s="${stile}"/>`;
    if (v instanceof Date && stile === 2) {
      const giorni = Math.round((Date.UTC(v.getFullYear(), v.getMonth(), v.getDate()) - Date.UTC(1899, 11, 30)) / 86400000);
      return `<c r="${rif}" s="3"><v>${giorni}</v></c>`;
    }
    if (typeof v === "object" && "__decimale" in v) return `<c r="${rif}" s="${stile === 2 ? 4 : stile}"><v>${v.__decimale}</v></c>`;
    if (typeof v === "number" && Number.isFinite(v)) return `<c r="${rif}" s="${stile === 2 && !Number.isInteger(v) ? 4 : stile}"><v>${v}</v></c>`;
    // eslint-disable-next-line no-control-regex
    const t = escXml(v).replace(/\r/g, "").replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");
    return `<c r="${rif}" t="inlineStr" s="${stile}"><is><t xml:space="preserve">${t}</t></is></c>`;
  }
  function foglioXml(intest, righe, larg) {
    const cols = larg.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join("");
    const corpo = [`<row r="1">${intest.map((t, i) => cella(`${colonna(i)}1`, t, 1)).join("")}</row>`];
    righe.forEach((riga, n) => corpo.push(`<row r="${n + 2}">${riga.map((v, i) => cella(`${colonna(i)}${n + 2}`, v, 2)).join("")}</row>`));
    const ultima = `${colonna(intest.length - 1)}${Math.max(1, righe.length + 1)}`;
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
      + '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>'
      + `<cols>${cols}</cols><sheetData>${corpo.join("")}</sheetData><autoFilter ref="A1:${ultima}"/></worksheet>`;
  }
  const TABELLA_CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(b) { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = TABELLA_CRC[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function creaZip(file) { // file: [[nome, testo]] - archivio senza compressione, che Excel apre senza problemi
    const enc = new TextEncoder(), parti = [], centrale = [];
    let pos = 0;
    for (const [nome, contenuto] of file) {
      const n = enc.encode(nome), d = enc.encode(contenuto), crc = crc32(d);
      const loc = new DataView(new ArrayBuffer(30));
      loc.setUint32(0, 0x04034b50, true); loc.setUint16(4, 20, true); loc.setUint16(6, 0x0800, true); loc.setUint16(8, 0, true);
      loc.setUint32(14, crc, true); loc.setUint32(18, d.length, true); loc.setUint32(22, d.length, true); loc.setUint16(26, n.length, true);
      parti.push(new Uint8Array(loc.buffer), n, d);
      const cen = new DataView(new ArrayBuffer(46));
      cen.setUint32(0, 0x02014b50, true); cen.setUint16(4, 20, true); cen.setUint16(6, 20, true); cen.setUint16(8, 0x0800, true);
      cen.setUint32(16, crc, true); cen.setUint32(20, d.length, true); cen.setUint32(24, d.length, true); cen.setUint16(28, n.length, true); cen.setUint32(42, pos, true);
      centrale.push(new Uint8Array(cen.buffer), n);
      pos += 30 + n.length + d.length;
    }
    const lungCentrale = centrale.reduce((s, p) => s + p.length, 0);
    const fine = new DataView(new ArrayBuffer(22));
    fine.setUint32(0, 0x06054b50, true); fine.setUint16(8, file.length, true); fine.setUint16(10, file.length, true);
    fine.setUint32(12, lungCentrale, true); fine.setUint32(16, pos, true);
    return new Blob([...parti, ...centrale, new Uint8Array(fine.buffer)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  }
  function creaXlsx(fogli) {
    const testa = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
    const file = [
      ["[Content_Types].xml", `${testa}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${fogli.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")}</Types>`],
      ["_rels/.rels", `${testa}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`],
      ["xl/workbook.xml", `${testa}<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${fogli.map((f, i) => `<sheet name="${escAttr(f[0].slice(0, 31))}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("")}</sheets><definedNames>${fogli.map((f, i) => `<definedName name="_xlnm._FilterDatabase" localSheetId="${i}" hidden="1">'${escXml(f[0].slice(0, 31))}'!$A$1:$${colonna(f[1].length - 1)}$${Math.max(1, f[2].length + 1)}</definedName>`).join("")}</definedNames></workbook>`],
      ["xl/_rels/workbook.xml.rels", `${testa}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${fogli.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join("")}<Relationship Id="rId${fogli.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`],
      ["xl/styles.xml", `${testa}<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF3F6F6A"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="5"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf><xf numFmtId="14" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment vertical="top"/></xf><xf numFmtId="4" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment vertical="top"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`],
    ];
    fogli.forEach((f, i) => file.push([`xl/worksheets/sheet${i + 1}.xml`, foglioXml(f[1], f[2], f[3])]));
    return creaZip(file);
  }
  const XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  const fileExcel = (fogli, nome) => ({ file: creaXlsx(fogli), tipo: XLSX, nome });
  const fileJson = (dati, nome) => ({ file: new Blob([JSON.stringify(dati, null, 1)], { type: "application/json" }), tipo: "application/json", nome });
  const R = (dati, stato = 200) => ({ dati, stato });
  const dataFile = () => oggi();

  // ==================================================================== BussolaLavoro (come sezioni/bussola/modulo.py)
  const Bussola = (() => {
    const STATI_ATTIVI = ["da_valutare", "da_inviare", "da_verificare", "inviata", "in_esame", "contatto", "colloquio", "colloquio_svolto", "offerta"];
    const STATI_CHIUSI = ["respinta", "nessuna_posizione", "nessuna_risposta", "rinunciata", "esclusa", "chiusa"];
    const TIPOLOGIE = ["candidatura", "spontanea", "estero", "cpi", "docenza", "recruiter", "agenzia", "piattaforma", "altro"];
    const CONFERME = ["confermato", "screenshot", "utente", "risposta", "da_verificare", "non_confermato", "pista"];
    const MODALITA = ["remoto", "ibrido", "in_sede", "da_verificare"];
    const TABELLE = {
      bl_schede: {
        tipologia: ["candidatura", TIPOLOGIE], titolo: "", azienda: "", contatto: "", paese: "", citta: "", modalita: ["da_verificare", MODALITA],
        lingue: "", compenso: "", contratto: "", stato: ["da_valutare", [...STATI_ATTIVI, ...STATI_CHIUSI]], stato_dettaglio: "",
        conferma: ["da_verificare", CONFERME], canale: "", link: "", data_invio: "", data_invio_nota: "", ultimo_riscontro: "",
        prossima_azione: "", prossima_data: "", fatti: "", valutazione: "", note: "", cv_usato: "", esito: "", data_chiusura: "",
      },
      bl_azioni: { scheda_id: null, titolo: "", tipo: ["promemoria", ["colloquio", "scadenza", "sollecito", "promemoria"]], quando: "", stato: ["programmata", ["programmata", "fatta", "annullata"]], luogo: "", note: "", esito: "" },
      bl_diario: { scheda_id: null, data: "", testo: "" },
      bl_modelli: { titolo: "", tipo: ["cv", ["cv", "lettera", "sollecito", "messaggio"]], lingua: "italiano", filone: "generale", testo: "", note: "" },
    };
    const NOMI = { scheda: "bl_schede", azione: "bl_azioni", diario: "bl_diario", modello: "bl_modelli" };

    function pulisci(tabella, dati) {
      const valori = {};
      for (const [campo, regola] of Object.entries(TABELLE[tabella])) {
        const grezzo = dati[campo] ?? "";
        if (campo === "scheda_id") { const n = parseInt(grezzo, 10); valori[campo] = grezzo !== "" && Number.isFinite(n) ? n : null; continue; }
        let t = testo(grezzo);
        if (Array.isArray(regola)) t = regola[1].includes(t) ? t : regola[0];
        else if (!t && regola) t = regola;
        valori[campo] = t;
      }
      return valori;
    }
    function inserisci(tabella, dati, id) {
      const v = pulisci(tabella, dati);
      v.creato = String(dati.creato || adesso());
      v.aggiornato = dati.aggiornato && id ? dati.aggiornato : adesso();
      return aggiungi(tabella, v, id);
    }
    function modifica(tabella, ident, dati) {
      const attuale = trova(tabella, ident);
      if (!attuale) throw new Errore("Elemento non trovato: forse è stato eliminato.");
      Object.assign(attuale, pulisci(tabella, { ...attuale, ...dati }), { aggiornato: adesso() });
    }
    function importa(tabelle) {
      const nuovi = new Map(), conteggi = { schede: 0, azioni: 0, diario: 0, modelli: 0 };
      for (const s of tabelle.schede || []) if (s && typeof s === "object") { nuovi.set(String(s.id), inserisci("bl_schede", s)); conteggi.schede++; }
      for (const [chiave, tabella] of [["azioni", "bl_azioni"], ["diario", "bl_diario"]]) {
        for (let riga of tabelle[chiave] || []) {
          if (!riga || typeof riga !== "object") continue;
          riga = { ...riga };
          if (riga.scheda_id !== null && riga.scheda_id !== undefined && riga.scheda_id !== "") riga.scheda_id = nuovi.get(String(riga.scheda_id)) ?? null;
          inserisci(tabella, riga); conteggi[chiave]++;
        }
      }
      for (const m of tabelle.modelli || []) if (m && typeof m === "object") { inserisci("bl_modelli", m); conteggi.modelli++; }
      return conteggi;
    }
    const tutto = () => ({
      schede: ordina(copia(tab("bl_schede")), ["-aggiornato", "-id"]),
      azioni: ordina(copia(tab("bl_azioni")), ["quando", "id"]),
      diario: ordina(copia(tab("bl_diario")), ["-data", "-id"]),
      modelli: ordina(copia(tab("bl_modelli")), ["-aggiornato"]),
    });
    function riepilogo() {
      const g = oggi(), tra7 = iso(piuGiorni(oggiD(), 7));
      const attive = tab("bl_schede").filter((s) => STATI_ATTIVI.includes(s.stato));
      const colloqui = tab("bl_azioni").filter((a) => a.tipo === "colloquio" && a.stato === "programmata" && a.quando.slice(0, 10) >= g).length;
      let daFare = tab("bl_azioni").filter((a) => a.stato === "programmata" && a.quando !== "" && a.quando.slice(0, 10) <= tra7).length;
      daFare += attive.filter((s) => s.prossima_data !== "" && s.prossima_data <= tra7
        && !tab("bl_azioni").some((a) => a.scheda_id === s.id && a.stato === "programmata" && a.quando.slice(0, 10) === s.prossima_data)).length;
      const verificare = attive.filter((s) => s.stato === "da_verificare" || ["da_verificare", "non_confermato"].includes(s.conferma)).length;
      return [
        { etichetta: "candidature in corso", valore: attive.length },
        { etichetta: "colloqui in programma", valore: colloqui },
        { etichetta: "cose da fare entro 7 giorni (o in ritardo)", valore: daFare },
        { etichetta: "invii da verificare", valore: verificare },
      ];
    }
    const NOMI_AZIONE = { colloquio: "Colloquio", scadenza: "Scadenza", sollecito: "Sollecito", promemoria: "Promemoria" };
    function agenda(inizio, fine) {
      const eventi = [];
      const azioni = tab("bl_azioni").filter((a) => a.stato !== "annullata" && a.quando !== "" && a.quando.slice(0, 10) >= inizio && a.quando.slice(0, 10) <= fine);
      const giorni = new Set(azioni.filter((a) => a.stato === "programmata").map((a) => `${a.scheda_id}|${a.quando.slice(0, 10)}`));
      for (const a of azioni) {
        const s = trova("bl_schede", a.scheda_id) || {};
        eventi.push({ data: a.quando.slice(0, 10), ora: a.quando.slice(11, 16), tipo: a.tipo, nome_tipo: NOMI_AZIONE[a.tipo] || a.tipo, titolo: a.titolo,
          sotto: unisci([s.azienda, s.titolo]), luogo: a.luogo, fatto: a.stato === "fatta", link: `/s/bussola/#azione-${a.id}` });
      }
      for (const s of tab("bl_schede")) {
        if (!STATI_ATTIVI.includes(s.stato) || !(s.prossima_data >= inizio && s.prossima_data <= fine)) continue;
        if (giorni.has(`${s.id}|${s.prossima_data}`)) continue;
        eventi.push({ data: s.prossima_data, ora: "", tipo: "prossima", nome_tipo: "Da fare", titolo: s.prossima_azione || "Prossima azione",
          sotto: `${s.azienda} · ${s.titolo}`, luogo: "", fatto: false, link: `/s/bussola/#scheda-${s.id}` });
      }
      return eventi;
    }
    const ET_STATO = { da_valutare: "Da valutare", da_inviare: "Da inviare", da_verificare: "Invio da verificare", inviata: "Inviata", in_esame: "Ricevuta / in esame",
      contatto: "Contatto in corso", colloquio: "Colloquio fissato", colloquio_svolto: "Colloquio svolto", offerta: "Offerta", respinta: "Respinta",
      nessuna_posizione: "Nessuna posizione aperta", nessuna_risposta: "Nessuna risposta", rinunciata: "Rinunciata", esclusa: "Non inviata / esclusa", chiusa: "Chiusa" };
    const ET_TIPOLOGIA = { candidatura: "Candidatura", spontanea: "Candidatura spontanea", estero: "Candidatura estero", cpi: "Centro per l'impiego", docenza: "Docenza",
      recruiter: "Recruiter / colloquio", agenzia: "Agenzia", piattaforma: "Piattaforma / audio", altro: "Altro" };
    const ET_CONFERMA = { confermato: "Confermato", screenshot: "Confermato da screenshot", utente: "Confermato da me", risposta: "Risposta ricevuta",
      da_verificare: "Da verificare", non_confermato: "Non confermato", pista: "Solo pista" };
    function esportaExcel() {
      const schede = ordina(copia(tab("bl_schede")), [(s) => (s.data_invio === "" ? 1 : 0), "-data_invio", "-id"]);
      const nomeDi = (id) => trova("bl_schede", id) || {};
      const intest = ["N.", "Data invio / contatto", "Organizzazione", "Ruolo / attività", "Tipologia", "Stato", "Dettaglio stato", "Ultima notizia / fatti verificati",
        "Prossima azione", "Data prossima azione", "Canale / riferimento", "Link", "Contatto", "Luogo", "Modalità", "Compenso", "Ultimo riscontro", "Conferma",
        "CV usato", "Valutazione personale", "Note personali", "Esito", "Data chiusura"];
      const riga = (s) => {
        let invio = dataIt(s.data_invio) || s.data_invio_nota;
        if (s.data_invio && s.data_invio_nota) invio += ` (${s.data_invio_nota})`;
        return [s.id, invio, s.azienda, s.titolo, ET_TIPOLOGIA[s.tipologia] || s.tipologia, ET_STATO[s.stato] || s.stato, s.stato_dettaglio, s.fatti, s.prossima_azione,
          dataIt(s.prossima_data), s.canale, s.link, s.contatto, unisci([s.citta, s.paese], ", "), s.modalita.replace(/_/g, " "), s.compenso, s.ultimo_riscontro,
          ET_CONFERMA[s.conferma] || s.conferma, s.cv_usato, s.valutazione, s.note, s.esito, dataIt(s.data_chiusura)];
      };
      const larg = [6, 18, 26, 34, 18, 18, 24, 60, 40, 14, 30, 30, 22, 18, 12, 18, 18, 20, 20, 40, 40, 30, 14];
      const diario = ordina(copia(tab("bl_diario")), ["-data"]);
      const azioni = ordina(copia(tab("bl_azioni")), ["-quando"]);
      return fileExcel([
        ["Candidature in corso", intest, schede.filter((s) => STATI_ATTIVI.includes(s.stato)).map(riga), larg],
        ["Archivio", intest, schede.filter((s) => !STATI_ATTIVI.includes(s.stato)).map(riga), larg],
        ["Diario", ["Data", "Organizzazione", "Ruolo", "Notizia"], diario.map((d) => [dataIt(d.data), nomeDi(d.scheda_id).azienda || "", nomeDi(d.scheda_id).titolo || "", d.testo]), [14, 28, 34, 90]],
        ["Agenda", ["Quando", "Tipo", "Azione", "Organizzazione", "Ruolo", "Luogo", "Stato", "Note", "Esito"],
          azioni.map((a) => [a.quando.replace("T", " "), a.tipo, a.titolo, nomeDi(a.scheda_id).azienda || "", nomeDi(a.scheda_id).titolo || "", a.luogo, a.stato, a.note, a.esito]),
          [18, 14, 36, 26, 30, 30, 14, 40, 40]],
      ], `BussolaLavoro-${dataFile()}.xlsx`);
    }
    function gestisci(metodo, percorso, query, corpo) {
      if (percorso === "dati" && metodo === "GET") return R(tutto());
      if (percorso === "esporta-excel" && metodo === "GET") return esportaExcel();
      if (percorso === "esporta-backup" && metodo === "GET") return fileJson({ formato: "bussola-1", creato: adesso(), ...tutto() }, `BussolaLavoro-backup-${dataFile()}.json`);
      if (percorso === "importa" && metodo === "POST") return R({ ok: true, importati: importa(corpo.tabelle || {}) });
      if (percorso === "notizia" && metodo === "POST") {
        const ident = parseInt(corpo.scheda_id || 0, 10);
        const t = testo(corpo.testo);
        if (t) inserisci("bl_diario", { scheda_id: ident, data: corpo.data || oggi(), testo: t });
        const cambi = {};
        for (const k of ["stato", "conferma", "prossima_azione", "prossima_data", "esito", "data_chiusura", "ultimo_riscontro"]) if (k in corpo) cambi[k] = corpo[k];
        const attuale = trova("bl_schede", ident);
        if (!attuale) throw new Errore("Candidatura non trovata.");
        if (corpo.stato && corpo.stato !== attuale.stato) cambi.stato_dettaglio = "";
        if (STATI_CHIUSI.includes(corpo.stato) && !corpo.data_chiusura) cambi.data_chiusura = corpo.data || oggi();
        if (Object.keys(cambi).length) modifica("bl_schede", ident, cambi);
        else attuale.aggiornato = adesso();
        return R({ ok: true });
      }
      const tabella = NOMI[percorso];
      if (!tabella) return R({ errore: "Richiesta sconosciuta." }, 404);
      if (metodo === "POST") return R({ ok: true, id: inserisci(tabella, corpo) }, 201);
      const ident = parseInt(query.get("id") || "0", 10);
      if (!ident) return R({ errore: "Numero dell'elemento mancante." }, 400);
      if (metodo === "PATCH") { modifica(tabella, ident, corpo); return R({ ok: true }); }
      if (metodo === "DELETE") {
        if (tabella === "bl_schede") { togli("bl_azioni", (a) => a.scheda_id === ident); togli("bl_diario", (d) => d.scheda_id === ident); }
        togli(tabella, (r) => r.id === ident);
        return R({ ok: true });
      }
      return R({ errore: "Operazione non prevista." }, 405);
    }
    function semina(d) {
      for (const [chiave, tabella] of [["schede", "bl_schede"], ["azioni", "bl_azioni"], ["diario", "bl_diario"], ["modelli", "bl_modelli"]]) {
        for (const riga of d[chiave] || []) inserisci(tabella, riga, riga.id);
      }
    }
    return { gestisci, riepilogo, agenda, semina };
  })();

  // ==================================================================== Gestione spese (come sezioni/spese/modulo.py)
  const Spese = (() => {
    const CASSETTI = ["SRLS", "DITTA", "PERS"];
    const NOMI_STATO_RIGA = { ok: "OK", da_verificare: "Da verificare", da_chiarire: "Da chiarire" };
    const FREQUENZE = { mensile: 1, bimestrale: 2, trimestrale: 3, quadrimestrale: 4, semestrale: 6, annuale: 12, una_tantum: 0 };
    const NOMI_FREQUENZA = { mensile: "Mensile", bimestrale: "Ogni 2 mesi", trimestrale: "Ogni 3 mesi", quadrimestrale: "Ogni 4 mesi", semestrale: "Ogni 6 mesi", annuale: "Annuale", una_tantum: "Una volta sola" };
    const NOMI_STATO_RICORRENTE = { attivo: "Attivo", da_disdire: "Da disdire", disdetto: "Disdetto", pagato: "Finito / pagato" };
    const NOMI_STATO_INCASSO = { da_incassare: "Da incassare", incassata: "Incassata", annullata: "Annullata", nota_credito: "Nota di credito" };
    const SI_NO = ["si", "no"];
    const NOMI_PAGATO = { si: "Sì", no: "No", rateizzata: "Rateizzata" };
    const T = "testo", N = "numero", D = "data", ID = "id";
    const TABELLE = {
      gs_spese: { codice: T, data_documento: D, cassetto: ["PERS", CASSETTI], categoria: T, fornitore: T, piva_fornitore: T, descrizione: T, tipo_documento: T,
        numero_documento: T, intestato_a: T, imponibile: N, iva: N, totale: N, mezzo: T, pagato: ["si", ["si", "no", "rateizzata"]], data_pagamento: D, scadenza: D,
        file_documento: T, origine: T, stato: ["ok", ["ok", "da_verificare", "da_chiarire"]], segnala: ["no", SI_NO], ricorrente_id: ID, note: T },
      gs_ricorrenti: { nome: T, cassetto: ["PERS", CASSETTI], categoria: T, fornitore: T, importo: N, frequenza: ["mensile", Object.keys(FREQUENZE)], giorno: T,
        prossima_scadenza: D, ultima_scadenza: D, disdetta_entro: D, mezzo: T, stato: ["attivo", ["attivo", "da_disdire", "disdetto", "pagato"]], crea_spesa: ["si", SI_NO], note: T },
      gs_incassi: { cassetto: ["SRLS", ["SRLS", "DITTA"]], numero: T, data_fattura: D, cliente: T, descrizione: T, imponibile: N, iva: N, totale: N, scadenza: D,
        stato: ["da_incassare", ["da_incassare", "incassata", "annullata", "nota_credito"]], data_incasso: D, note: T },
      gs_budget: { cassetto: ["PERS", CASSETTI], categoria: T, importo: N, note: T },
      gs_cassetti: { codice: T, nome: T, tipo: T, partita_iva: T, codice_fiscale: T, regime: T, note: T },
      gs_mezzi: { nome: T, cassetto: T, note: T, attivo: ["si", SI_NO] },
      gs_categorie: { nome: T, vale_per: ["Impresa", ["Impresa", "Personale"]], esempi: T, attiva: ["si", SI_NO] },
      gs_quote: { categoria: T, fornitore: T, quota: N, cassetto_impresa: T, decisa: T },
      gs_storico: { quando: T, operazione: T, dettaglio: T },
    };
    const NOMI = { spesa: "gs_spese", ricorrente: "gs_ricorrenti", incasso: "gs_incassi", budget: "gs_budget", cassetto: "gs_cassetti", mezzo: "gs_mezzi", categoria: "gs_categorie", quota: "gs_quote" };
    const CHIAVI_DATI = { spese: "gs_spese", ricorrenti: "gs_ricorrenti", incassi: "gs_incassi", budget: "gs_budget", cassetti: "gs_cassetti", mezzi: "gs_mezzi", categorie: "gs_categorie", quote: "gs_quote", storico: "gs_storico" };
    const DESCRIVI = {
      gs_spese: (r) => `${r.codice || ""} ${r.fornitore || ""}`.trim(), gs_ricorrenti: (r) => r.nome || "", gs_incassi: (r) => `fattura ${r.numero || ""} ${r.cliente || ""}`.trim(),
      gs_budget: (r) => `budget ${r.cassetto || ""} ${r.categoria || ""}`, gs_cassetti: (r) => `cassetto ${r.codice || ""}`, gs_mezzi: (r) => `mezzo ${r.nome || ""}`,
      gs_categorie: (r) => `categoria ${r.nome || ""}`, gs_quote: (r) => `quota ${r.categoria || ""}`,
    };
    const NOMI_TABELLA = { gs_spese: "Spesa", gs_ricorrenti: "Scadenza o rata", gs_incassi: "Fattura da incassare", gs_budget: "Budget", gs_cassetti: "Impostazioni", gs_mezzi: "Impostazioni", gs_categorie: "Impostazioni", gs_quote: "Impostazioni" };
    const IMPOSTAZIONI_BASE = { soglia_budget: 0.8, giorni_avviso: 7 };

    function numero(v) {
      if (v === null || v === undefined || v === "") return null;
      if (typeof v === "number") return r2(v);
      let t = String(v).replace(/€/g, "").replace(/ /g, "").trim();
      if (!t) return null;
      if (t.includes(",") && t.includes(".")) t = t.replace(/\./g, "").replace(",", ".");
      else if (t.includes(",")) t = t.replace(",", ".");
      const n = Number(t);
      if (!/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(t) || !Number.isFinite(n)) throw new Errore(`«${v}» non sembra un importo: scrivilo così, per esempio 12,50`);
      return r2(n);
    }
    function dataIso(v) {
      const t = v === null || v === undefined ? "" : String(v).trim();
      if (!t) return "";
      if (/^\d{4}-\d{2}-\d{2}/.test(t.slice(0, 10)) && comeData(t.slice(0, 10))) return iso(comeData(t.slice(0, 10)));
      const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(t);
      if (m) { const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1])); if (d.getMonth() === Number(m[2]) - 1 && d.getDate() === Number(m[1])) return iso(d); }
      throw new Errore(`«${t}» non è una data valida.`);
    }
    function impostazioni() {
      const v = { ...IMPOSTAZIONI_BASE };
      for (const k of Object.keys(v)) {
        const m = meta(`spese_${k}`);
        if (m !== null) { const n = Number(m); if (Number.isFinite(n)) v[k] = k === "soglia_budget" ? n : Math.trunc(n); }
      }
      return v;
    }
    function pulisci(tabella, dati) {
      const valori = {};
      for (const [campo, regola] of Object.entries(TABELLE[tabella])) {
        const grezzo = dati[campo] ?? "";
        if (regola === N) valori[campo] = numero(grezzo);
        else if (regola === ID) { const n = parseInt(grezzo, 10); valori[campo] = grezzo !== "" && Number.isFinite(n) ? n : null; }
        else if (regola === D) valori[campo] = dataIso(grezzo);
        else {
          let t = testo(grezzo);
          if (Array.isArray(regola)) t = regola[1].includes(t) ? t : regola[0];
          valori[campo] = t;
        }
      }
      return valori;
    }
    function registra(operazione, dettaglio) {
      aggiungi("gs_storico", { creato: adesso(), aggiornato: adesso(), quando: adesso(), operazione, dettaglio: String(dettaglio).slice(0, 4000) });
    }
    function prossimoCodice(dataDocumento) {
      const anno = (dataDocumento || oggi()).slice(0, 4);
      let massimo = 0;
      for (const s of tab("gs_spese")) {
        if (!String(s.codice).startsWith(`S-${anno}-`)) continue;
        const n = parseInt(String(s.codice).split("-").pop(), 10);
        if (Number.isFinite(n)) massimo = Math.max(massimo, n);
      }
      return `S-${anno}-${String(massimo + 1).padStart(4, "0")}`;
    }
    function completaTotale(v) {
      if (v.totale === null && v.imponibile !== null) v.totale = r2(v.imponibile + (v.iva || 0));
      if (v.totale === null) throw new Errore("Scrivi il totale della spesa (oppure l'imponibile e l'IVA).");
    }
    function inserisci(tabella, dati, storico = true, id) {
      const v = pulisci(tabella, dati);
      if (tabella === "gs_spese") {
        if (!v.codice) v.codice = prossimoCodice(v.data_documento);
        if (!v.intestato_a) v.intestato_a = v.cassetto;
        completaTotale(v);
      }
      if (tabella === "gs_storico") v.quando = v.quando || adesso();
      v.creato = String(dati.creato || adesso());
      v.aggiornato = dati.aggiornato && id ? dati.aggiornato : adesso();
      const nuovo = aggiungi(tabella, v, id);
      if (storico && DESCRIVI[tabella]) registra(NOMI_TABELLA[tabella], `aggiunto: ${DESCRIVI[tabella](v)}`);
      return nuovo;
    }
    const vuoto = (x) => x === null || x === undefined || x === "";
    function modifica(tabella, ident, dati, nota = "") {
      const attuale = trova(tabella, ident);
      if (!attuale) throw new Errore("Elemento non trovato: forse è stato eliminato.");
      const valori = pulisci(tabella, { ...attuale, ...dati });
      if (tabella === "gs_spese") completaTotale(valori);
      const cambi = Object.entries(valori).filter(([c, v]) => (vuoto(attuale[c]) ? "" : attuale[c]) !== (vuoto(v) ? "" : v))
        .map(([c, v]) => `${c}: ${vuoto(attuale[c]) ? "—" : attuale[c]} → ${vuoto(v) ? "—" : v}`);
      if (!cambi.length) return;
      const prima = { ...attuale };
      Object.assign(attuale, valori, { aggiornato: adesso() });
      if (DESCRIVI[tabella]) registra(NOMI_TABELLA[tabella], `${nota ? `${nota} | ` : ""}${DESCRIVI[tabella]({ ...prima, ...valori })}: ${cambi.map((c) => c.slice(0, 300)).join("; ")}`);
    }
    function elimina(tabella, ident) {
      const attuale = trova(tabella, ident);
      if (!attuale) return;
      if (tabella === "gs_ricorrenti") tab("gs_spese").forEach((s) => { if (s.ricorrente_id === ident) s.ricorrente_id = null; });
      togli(tabella, (r) => r.id === ident);
      if (DESCRIVI[tabella]) registra(NOMI_TABELLA[tabella], `eliminato: ${DESCRIVI[tabella](attuale)}${tabella === "gs_spese" ? ` (totale ${euro(attuale.totale)})` : ""}`);
    }
    function caricaTutto(dati, conId = false) {
      const conteggi = {};
      for (const [chiave, tabella] of Object.entries(CHIAVI_DATI)) {
        conteggi[chiave] = 0;
        for (const riga of dati[chiave] || []) if (riga && typeof riga === "object") { inserisci(tabella, riga, false, conId ? riga.id : undefined); conteggi[chiave]++; }
      }
      for (const [k, v] of Object.entries(dati.impostazioni || {})) if (k in IMPOSTAZIONI_BASE) scriviMeta(`spese_${k}`, v);
      return conteggi;
    }
    function tutto() {
      const r = {};
      for (const [chiave, tabella] of Object.entries(CHIAVI_DATI)) r[chiave] = ordina(copia(tab(tabella)), ["id"]);
      ordina(r.spese, ["-data_documento", "-codice"]);
      ordina(r.storico, ["-quando", "-id"]);
      r.impostazioni = impostazioni();
      return r;
    }
    function scadenzaDopo(r, da) {
      const mesi = FREQUENZE[r.frequenza] || 0;
      if (!mesi) return null;
      const fisso = /^\d+$/.test(String(r.giorno || "")) ? parseInt(r.giorno, 10) : null;
      const dopo = aggiungiMesi(da, mesi, fisso);
      const ultima = comeData(r.ultima_scadenza || "");
      if (ultima && dopo > ultima) return null;
      return dopo;
    }
    function pagaRicorrente(corpo) {
      const ident = parseInt(corpo.id || 0, 10);
      const r = trova("gs_ricorrenti", ident);
      if (!r) throw new Errore("Scadenza non trovata.");
      const scadenza = dataIso(corpo.scadenza || r.prossima_scadenza) || oggi();
      const pagataIl = dataIso(corpo.data_pagamento) || oggi();
      let importo = numero(corpo.importo);
      if (importo === null) importo = r.importo;
      const mezzo = String(corpo.mezzo || r.mezzo || "");
      let idSpesa = null;
      if (String(corpo.crea_spesa ?? r.crea_spesa) === "si") {
        if (importo === null) throw new Errore("Scrivi l'importo pagato.");
        idSpesa = inserisci("gs_spese", {
          data_documento: scadenza, cassetto: r.cassetto, categoria: r.categoria, fornitore: r.fornitore, descrizione: String(corpo.descrizione || r.nome),
          tipo_documento: "Ricevuta", intestato_a: r.cassetto, totale: importo, mezzo, pagato: "si", data_pagamento: pagataIl, origine: "Sito", stato: "ok",
          ricorrente_id: ident, segnala: corpo.segnala === "si" ? "si" : "no",
          note: unisci([`data documento = scadenza del ${dataIt(scadenza)}; pagata il ${dataIt(pagataIl)}`, testo(corpo.note)], "; "),
        }, false);
      }
      const successiva = r.frequenza !== "una_tantum" ? scadenzaDopo(r, comeData(scadenza)) : null;
      const cambi = { prossima_scadenza: successiva ? iso(successiva) : "", mezzo };
      if (!successiva) cambi.stato = "pagato";
      const nuovoImporto = numero(corpo.importo_prossimo);
      if (nuovoImporto !== null) cambi.importo = nuovoImporto;
      modifica("gs_ricorrenti", ident, cambi, `pagata la scadenza del ${dataIt(scadenza)} (${euro(importo)}) il ${dataIt(pagataIl)}${idSpesa ? " e registrata come spesa" : ""}`);
      return { ok: true, spesa: idSpesa, prossima: cambi.prossima_scadenza };
    }
    const mezzoDiAltroCassetto = () => Object.fromEntries(tab("gs_mezzi").filter((m) => m.cassetto).map((m) => [m.nome, m.cassetto]));
    function daPagare(entro) {
      const e = iso(entro), voci = [];
      for (const r of tab("gs_ricorrenti")) if (["attivo", "da_disdire"].includes(r.stato) && r.prossima_scadenza !== "" && r.prossima_scadenza <= e) voci.push({ data: r.prossima_scadenza, titolo: r.nome, importo: r.importo, tipo: "ricorrente", id: r.id });
      for (const s of tab("gs_spese")) {
        if (s.pagato !== "no" || s.stato === "da_chiarire") continue;
        const quando = s.scadenza || s.data_documento;
        if (quando && quando <= e) voci.push({ data: quando, titolo: `${s.fornitore} (${s.codice})`, importo: s.totale, tipo: "spesa", id: s.id });
      }
      return ordina(voci, ["data"]);
    }
    function riepilogo() {
      const imp = impostazioni();
      const voci = daPagare(piuGiorni(oggiD(), imp.giorni_avviso));
      const ritardo = voci.filter((v) => v.data < oggi()).length;
      const inizio = iso(new Date(oggiD().getFullYear(), oggiD().getMonth(), 1)), fine = iso(new Date(oggiD().getFullYear(), oggiD().getMonth() + 1, 1));
      const mese = tab("gs_spese").filter((s) => s.data_documento >= inizio && s.data_documento < fine).reduce((t, s) => t + (s.totale || 0), 0);
      const incassi = tab("gs_incassi").filter((f) => f.stato === "da_incassare");
      return [
        { etichetta: `da pagare entro ${imp.giorni_avviso} giorni${ritardo ? ` (${ritardo} in ritardo)` : ""}`, valore: voci.length },
        { etichetta: "speso questo mese (tutti i cassetti)", valore: euro(r2(mese)) },
        { etichetta: `fatture da incassare (${incassi.length})`, valore: euro(r2(incassi.reduce((t, f) => t + (f.totale || 0), 0))) },
        { etichetta: "righe da controllare", valore: tab("gs_spese").filter((s) => s.stato !== "ok").length },
      ];
    }
    const COLORI_CASSETTO = { SRLS: "cielo", DITTA: "salvia", PERS: "lavanda" };
    const NOMI_BREVI = { SRLS: "Società", DITTA: "Ditta", PERS: "Personale" };
    const sigla = (c) => ({ sigla: NOMI_BREVI[c] || c, colore_sigla: COLORI_CASSETTO[c] || "grigio" });
    function agenda(inizio, fine) {
      const eventi = [], dIn = comeData(inizio) || new Date(1, 0, 1), dFi = comeData(fine) || new Date(9999, 0, 1);
      for (const r of tab("gs_ricorrenti")) {
        if (!["attivo", "da_disdire"].includes(r.stato) || r.prossima_scadenza === "") continue;
        let quando = comeData(r.prossima_scadenza), primo = true, giri = 0;
        while (quando && quando <= dFi && giri < 400) {
          if (quando >= dIn) eventi.push({ data: iso(quando), ora: "", tipo: "pagamento", nome_tipo: primo ? "Da pagare" : "Rata prevista", titolo: r.nome,
            sotto: unisci([r.importo !== null ? euro(r.importo) : "importo da sapere", r.cassetto, r.mezzo]), luogo: "", fatto: false, link: `/s/spese/#ricorrente-${r.id}`, ...sigla(r.cassetto) });
          quando = scadenzaDopo(r, quando); primo = false; giri++;
        }
        if (r.disdetta_entro && inizio <= r.disdetta_entro && r.disdetta_entro <= fine) {
          eventi.push({ data: r.disdetta_entro, ora: "", tipo: "disdetta", nome_tipo: "Disdire entro", titolo: r.nome, sotto: r.cassetto, luogo: "", fatto: false, link: `/s/spese/#ricorrente-${r.id}`, ...sigla(r.cassetto) });
        }
      }
      for (const s of tab("gs_spese")) {
        if (!((s.pagato === "no" && (s.scadenza !== "" || s.data_documento !== "")) || s.ricorrente_id !== null || (s.pagato === "si" && s.scadenza !== ""))) continue;
        const quando = s.scadenza || s.data_documento;
        if (!(inizio <= quando && quando <= fine)) continue;
        eventi.push({ data: quando, ora: "", tipo: "pagamento", nome_tipo: s.pagato === "si" ? "Pagata" : "Da pagare", titolo: s.ricorrente_id ? s.descrizione.slice(0, 80) : s.fornitore,
          sotto: `${euro(s.totale)} · ${s.cassetto} · ${s.codice}`, luogo: "", fatto: s.pagato === "si", link: `/s/spese/#spesa-${s.id}`, ...sigla(s.cassetto) });
      }
      for (const f of tab("gs_incassi")) {
        if (!["da_incassare", "incassata"].includes(f.stato)) continue;
        const quando = f.stato === "incassata" ? f.data_incasso : f.scadenza;
        if (quando && inizio <= quando && quando <= fine) eventi.push({ data: quando, ora: "", tipo: "incasso", nome_tipo: f.stato === "incassata" ? "Incassata" : "Da incassare",
          titolo: `Fattura ${f.numero}`, sotto: `${euro(f.totale)} · ${f.cliente}`, luogo: "", fatto: f.stato === "incassata", link: `/s/spese/#incasso-${f.id}`, ...sigla(f.cassetto) });
      }
      return eventi;
    }
    const rigaSpesa = (s) => [s.codice, comeData(s.data_documento), s.cassetto, s.categoria, s.fornitore, s.piva_fornitore, s.descrizione, s.tipo_documento, s.numero_documento,
      s.intestato_a, F(s.imponibile), F(s.iva), F(s.totale), s.mezzo, NOMI_PAGATO[s.pagato] || s.pagato, comeData(s.data_pagamento), comeData(s.scadenza), s.file_documento,
      s.origine, NOMI_STATO_RIGA[s.stato] || s.stato, s.segnala === "si" ? "Sì" : "", s.note];
    const INTEST_SPESE = ["Codice", "Data documento", "Cassetto", "Categoria", "Fornitore", "P.IVA fornitore", "Descrizione", "Tipo documento", "Numero documento", "Intestato a",
      "Imponibile", "IVA", "Totale", "Mezzo di pagamento", "Pagato", "Data pagamento", "Scadenza", "File del documento", "Origine", "Stato", "Da segnalare al commercialista", "Note"];
    const LARG_SPESE = [13, 12, 9, 26, 30, 14, 50, 18, 18, 10, 11, 10, 11, 22, 8, 12, 12, 28, 9, 13, 14, 70];
    const foglioRicorrenti = (lista) => ["Scadenze e rate", ["Nome", "Cassetto", "Categoria", "Fornitore", "Importo previsto", "Frequenza", "Prossima scadenza", "Ultima rata", "Disdire entro", "Mezzo di pagamento", "Stato", "Note"],
      lista.map((r) => [r.nome, r.cassetto, r.categoria, r.fornitore, F(r.importo), NOMI_FREQUENZA[r.frequenza] || r.frequenza, comeData(r.prossima_scadenza), comeData(r.ultima_scadenza), comeData(r.disdetta_entro), r.mezzo, NOMI_STATO_RICORRENTE[r.stato] || r.stato, r.note]),
      [38, 9, 26, 30, 13, 14, 13, 12, 12, 22, 14, 80]];
    const foglioIncassi = (lista) => ["Fatture emesse", ["Cassetto", "Numero", "Data fattura", "Cliente", "Descrizione", "Imponibile", "IVA", "Totale", "Scadenza", "Stato", "Data incasso", "Note"],
      lista.map((f) => [f.cassetto, f.numero, comeData(f.data_fattura), f.cliente, f.descrizione, F(f.imponibile), F(f.iva), F(f.totale), comeData(f.scadenza), NOMI_STATO_INCASSO[f.stato] || f.stato, comeData(f.data_incasso), f.note]),
      [9, 12, 12, 34, 40, 11, 10, 11, 12, 14, 12, 70]];
    function esportaRegistro() {
      return fileExcel([
        ["Spese", INTEST_SPESE, ordina(copia(tab("gs_spese")), ["data_documento", "codice"]).map(rigaSpesa), LARG_SPESE],
        foglioRicorrenti(ordina(copia(tab("gs_ricorrenti")), [(r) => (r.prossima_scadenza === "" ? 1 : 0), "prossima_scadenza"])),
        foglioIncassi(ordina(copia(tab("gs_incassi")), ["data_fattura"])),
        ["Budget", ["Cassetto", "Categoria", "Budget mensile", "Note"], tab("gs_budget").map((b) => [b.cassetto, b.categoria, F(b.importo), b.note]), [10, 30, 14, 40]],
        ["Cassetti", ["Codice", "Nome", "Tipo", "Partita IVA", "Codice fiscale", "Regime", "Note"], tab("gs_cassetti").map((c) => [c.codice, c.nome, c.tipo, c.partita_iva, c.codice_fiscale, c.regime, c.note]), [9, 30, 20, 14, 20, 20, 30]],
        ["Mezzi di pagamento", ["Nome", "Cassetto", "Note", "In uso"], tab("gs_mezzi").map((m) => [m.nome, m.cassetto, m.note, m.attivo === "si" ? "Sì" : "No"]), [26, 10, 80, 8]],
        ["Categorie", ["Categoria", "Vale per", "Esempi", "In uso"], tab("gs_categorie").map((c) => [c.nome, c.vale_per, c.esempi, c.attiva === "si" ? "Sì" : "No"]), [32, 12, 50, 8]],
        ["Quote uso promiscuo", ["Categoria", "Fornitore", "Quota impresa", "Cassetto impresa", "Chi l'ha decisa e quando"], tab("gs_quote").map((q) => [q.categoria, q.fornitore, q.quota, q.cassetto_impresa, q.decisa]), [30, 30, 12, 14, 40]],
        ["Storico", ["Data e ora", "Operazione", "Dettaglio"], ordina(copia(tab("gs_storico")), ["quando", "id"]).map((s) => [s.quando.replace("T", " "), s.operazione, s.dettaglio]), [20, 22, 120]],
      ], `Registro-spese-${dataFile()}.xlsx`);
    }
    function controlliSpesa(s, altro) {
      const motivi = [];
      const cm = altro[s.mezzo];
      if (cm && cm !== s.cassetto) motivi.push(`pagata con un mezzo del cassetto ${cm}`);
      if (s.segnala === "si") motivi.push("segnata da dare al commercialista");
      if (s.stato !== "ok") motivi.push((NOMI_STATO_RIGA[s.stato] || s.stato).toLowerCase());
      if (s.pagato === "no") motivi.push("non ancora pagata");
      if (s.pagato === "rateizzata") motivi.push("non pagata: compresa in un piano di rate");
      if (s.intestato_a && s.intestato_a !== s.cassetto) motivi.push(`intestata a ${s.intestato_a}`);
      return motivi;
    }
    function datiCommercialista(da, a, cassetti) {
      cassetti = cassetti.filter((c) => CASSETTI.includes(c));
      if (!cassetti.length) cassetti = ["SRLS", "DITTA"];
      const nel = (s) => s.data_documento >= da && s.data_documento <= a && cassetti.includes(s.cassetto);
      const spese = ordina(copia(tab("gs_spese").filter(nel)), ["cassetto", "data_documento", "codice"]);
      const altro = mezzoDiAltroCassetto();
      const gruppi = new Map();
      for (const s of spese) {
        const k = `${s.cassetto}|${s.categoria}`;
        if (!gruppi.has(k)) gruppi.set(k, { cassetto: s.cassetto, categoria: s.categoria, n: 0, imponibile: 0, iva: 0, totale: 0 });
        const g = gruppi.get(k); g.n++; g.imponibile += s.imponibile || 0; g.iva += s.iva || 0; g.totale += s.totale || 0;
      }
      const perCategoria = ordina([...gruppi.values()].map((g) => ({ ...g, imponibile: r2(g.imponibile), iva: r2(g.iva), totale: r2(g.totale) })), ["cassetto", "-totale"]);
      const mesi = new Map();
      for (const s of spese) {
        const k = `${s.data_documento.slice(0, 7)}|${s.cassetto}`;
        if (!mesi.has(k)) mesi.set(k, { mese: s.data_documento.slice(0, 7), cassetto: s.cassetto, totale: 0, iva: 0 });
        const g = mesi.get(k); g.totale += s.totale || 0; g.iva += s.iva || 0;
      }
      const perMese = ordina([...mesi.values()].map((g) => ({ ...g, totale: r2(g.totale), iva: r2(g.iva) })), ["mese"]);
      const segnalare = spese.map((s) => ({ ...s, motivi: controlliSpesa(s, altro) })).filter((s) => s.motivi.length);
      const incassi = ordina(copia(tab("gs_incassi").filter((f) => f.data_fattura >= da && f.data_fattura <= a && cassetti.includes(f.cassetto))), ["cassetto", "data_fattura"]);
      const rate = ordina(copia(tab("gs_ricorrenti").filter((r) => ["attivo", "da_disdire"].includes(r.stato) && cassetti.includes(r.cassetto))), ["cassetto", "prossima_scadenza"]);
      const info = copia(tab("gs_cassetti").filter((c) => cassetti.includes(c.codice)));
      return { da, a, cassetti, spese, per_categoria: perCategoria, per_mese: perMese, segnalare, incassi, rate, info, quote: copia(tab("gs_quote")) };
    }
    function esportaCommercialista(da, a, cassetti) {
      const d = datiCommercialista(da, a, cassetti);
      const ora = new Date();
      const leggimi = [["Riepilogo spese per il commercialista"], [`Periodo: dal ${dataIt(d.da)} al ${dataIt(d.a)} (in base alla data del documento)`],
        [`Creato il ${dataIt(iso(ora))} alle ${oraHM()} dalla versione dimostrativa di "Io, in ordine" (dati inventati)`], [""]];
      for (const c of d.info) leggimi.push([`${c.codice}: ${c.nome} · ${c.tipo}${c.partita_iva ? ` · P.IVA ${c.partita_iva}` : ""}${c.regime ? ` · regime ${c.regime}` : ""}`]);
      leggimi.push([""]);
      for (const c of d.cassetti) {
        const proprie = d.spese.filter((s) => s.cassetto === c);
        leggimi.push([`Totale spese ${c}: ${euro(r2(proprie.reduce((t, s) => t + (s.totale || 0), 0)))} (${proprie.length} righe)`]);
      }
      leggimi.push([""], ["Fogli:"], ["- una scheda di spese per ogni cassetto, con tutti i dati dei documenti"], ["- Per categoria e Per mese: i totali"],
        ["- Da guardare insieme: spese pagate con un conto di un altro cassetto, da segnalare, da verificare o non pagate"], ["- Fatture emesse e Rate in corso"], [""],
        [`Quote di uso promiscuo: ${d.quote.length ? d.quote.map((q) => `${q.categoria}${q.fornitore ? ` ${q.fornitore}` : ""} ${(q.quota || 0) <= 1 ? Math.round((q.quota || 0) * 100) : q.quota}% (${q.decisa})`).join("; ") : "nessuna quota decisa finora (le spese per la casa sede della ditta e della società sono segnate da valutare)."}`]);
      const fogli = [["Leggimi", ["Informazioni"], leggimi, [110]]];
      for (const c of d.cassetti) fogli.push([`Spese ${c}`, INTEST_SPESE, d.spese.filter((s) => s.cassetto === c).map(rigaSpesa), LARG_SPESE]);
      fogli.push(["Per categoria", ["Cassetto", "Categoria", "Numero di spese", "Imponibile", "IVA", "Totale"], d.per_categoria.map((r) => [r.cassetto, r.categoria, r.n, F(r.imponibile), F(r.iva), F(r.totale)]), [10, 32, 10, 13, 12, 13]]);
      const mesi = [...new Set(d.per_mese.map((r) => r.mese))].sort();
      const val = (m, c, k) => F((d.per_mese.find((r) => r.mese === m && r.cassetto === c) || {})[k] || 0);
      fogli.push(["Per mese", ["Mese", ...d.cassetti.map((c) => `Totale ${c}`), ...d.cassetti.filter((c) => c !== "PERS").map((c) => `IVA ${c}`)],
        mesi.map((m) => [`${m.slice(5, 7)}/${m.slice(0, 4)}`, ...d.cassetti.map((c) => val(m, c, "totale")), ...d.cassetti.filter((c) => c !== "PERS").map((c) => val(m, c, "iva"))]),
        [10, ...Array(d.cassetti.length * 2).fill(14)]]);
      fogli.push(["Da guardare insieme", ["Codice", "Data", "Cassetto", "Categoria", "Fornitore", "Totale", "Mezzo", "Perché", "Note"],
        d.segnalare.map((s) => [s.codice, comeData(s.data_documento), s.cassetto, s.categoria, s.fornitore, F(s.totale), s.mezzo, s.motivi.join("; "), s.note]), [13, 12, 9, 26, 30, 11, 22, 45, 80]]);
      fogli.push(foglioIncassi(d.incassi));
      const [, intest, righe, larg] = foglioRicorrenti(d.rate);
      fogli.push(["Rate in corso", intest, righe, larg]);
      return fileExcel(fogli, `Spese-per-commercialista-${d.cassetti.join("-")}-${da}-${a}.xlsx`);
    }

    // --------------------------------------------------------------- fatture elettroniche (come fatture_xml.py, solo file .xml e .p7m)
    const TIPI = { TD01: "Fattura elettronica", TD02: "Acconto su fattura", TD03: "Acconto su parcella", TD04: "Nota di credito", TD05: "Nota di debito", TD06: "Parcella",
      TD16: "Integrazione (reverse charge)", TD17: "Autofattura servizi estero", TD18: "Autofattura beni UE", TD19: "Autofattura beni", TD20: "Autofattura", TD24: "Fattura differita",
      TD25: "Fattura differita", TD26: "Cessione beni ammortizzabili", TD27: "Autoconsumo" };
    const PAGAMENTI = { MP01: "contanti", MP02: "assegno", MP05: "bonifico", MP08: "carta di pagamento", MP12: "RIBA", MP15: "giroconto", MP16: "domiciliazione bancaria",
      MP17: "domiciliazione postale", MP19: "addebito SEPA (domiciliazione)", MP20: "SEPA Direct Debit CORE", MP21: "SEPA Direct Debit B2B", MP23: "PagoPA" };
    const figli = (n, nome) => (n ? [...n.children].filter((c) => c.localName === nome) : []);
    function cerca(n, percorso) { // percorso tipo "A/B/C" (figli diretti) oppure ".//A" (ovunque sotto)
      if (!n) return [];
      if (percorso.startsWith(".//")) return [...n.getElementsByTagName("*")].filter((c) => c.localName === percorso.slice(3));
      let livello = [n];
      for (const pezzo of percorso.split("/")) livello = livello.flatMap((x) => figli(x, pezzo));
      return livello;
    }
    const uno = (n, p) => cerca(n, p)[0] || null;
    const tx = (n, p) => { const t = uno(n, p); return t && t.textContent ? t.textContent.trim() : ""; };
    const nn = (t) => { if (t === "" || t === null) return null; const n = Number(t); return Number.isFinite(n) ? r2(n) : null; };
    function soggetto(n) {
      const anag = n ? uno(n, ".//DatiAnagrafici") : null;
      const nome = tx(anag, "Anagrafica/Denominazione") || unisci([tx(anag, "Anagrafica/Nome"), tx(anag, "Anagrafica/Cognome")], " ");
      return { nome, paese: tx(anag, "IdFiscaleIVA/IdPaese"), piva: tx(anag, "IdFiscaleIVA/IdCodice"), cf: tx(anag, "CodiceFiscale") };
    }
    function leggiXml(testoXml, nomeFile) {
      let doc = new DOMParser().parseFromString(testoXml, "application/xml");
      if (doc.getElementsByTagName("parsererror").length) {
        const i = testoXml.indexOf("<"), f = testoXml.lastIndexOf(">");
        doc = new DOMParser().parseFromString(testoXml.slice(i, f + 1), "application/xml");
        if (doc.getElementsByTagName("parsererror").length) throw new Error("non è un file XML leggibile");
      }
      const radice = doc.documentElement;
      if (radice.localName === "FileMetadati") return [];
      if (radice.localName !== "FatturaElettronica") throw new Error("non è una fattura elettronica");
      const testata = uno(radice, "FatturaElettronicaHeader");
      const fornitore = soggetto(uno(testata, "CedentePrestatore")), cliente = soggetto(uno(testata, "CessionarioCommittente"));
      const documenti = [];
      for (const corpo of cerca(radice, "FatturaElettronicaBody")) {
        const gen = uno(corpo, "DatiGenerali/DatiGeneraliDocumento");
        const tipo = tx(gen, "TipoDocumento");
        const riepiloghi = cerca(corpo, "DatiBeniServizi/DatiRiepilogo");
        const imponibile = riepiloghi.reduce((t, r) => t + (nn(tx(r, "ImponibileImporto")) || 0), 0);
        const iva = riepiloghi.reduce((t, r) => t + (nn(tx(r, "Imposta")) || 0), 0);
        const bollo = nn(tx(gen, "DatiBollo/ImportoBollo")) || 0;
        let totale = nn(tx(gen, "ImportoTotaleDocumento"));
        if (totale === null) totale = r2(imponibile + iva + bollo);
        const segno = tipo === "TD04" ? -1 : 1;
        let righe = cerca(corpo, "DatiBeniServizi/DettaglioLinee").map((l) => tx(l, "Descrizione")).filter((r) => r && !/^[-_ ]+$/.test(r));
        let causale = figli(gen, "Causale").map((c) => c.textContent.trim()).filter(Boolean).join(" ");
        if (/^\s*(pagamento|fattura accompagnatoria|fatture? differit|fattura gia' pagata)/i.test(causale) && righe.length) causale = "";
        righe = righe.filter((r) => r.toLowerCase() !== "costi di spedizione").length ? righe.filter((r) => r.toLowerCase() !== "costi di spedizione") : righe;
        let descrizione = causale || righe.slice(0, 3).join(" · ");
        if (!causale && righe.length > 3) descrizione += ` (+${righe.length - 3} righe)`;
        const scadenze = []; let modalita = "";
        for (const p of cerca(corpo, "DatiPagamento/DettaglioPagamento")) {
          modalita = modalita || tx(p, "ModalitaPagamento");
          if (tx(p, "DataScadenzaPagamento")) scadenze.push([tx(p, "DataScadenzaPagamento"), nn(tx(p, "ImportoPagamento"))]);
        }
        const ritenuta = figli(gen, "DatiRitenuta").reduce((t, r) => t + (nn(tx(r, "ImportoRitenuta")) || 0), 0);
        const note = [];
        if (ritenuta) note.push(`ritenuta d'acconto ${ritenuta.toFixed(2).replace(".", ",")} €: al fornitore si paga il netto; chiedere al commercialista`);
        if (bollo) note.push(`bollo ${bollo.toFixed(2).replace(".", ",")} €`);
        if (modalita) note.push(`pagamento: ${PAGAMENTI[modalita] || modalita}`);
        if (scadenze.length > 1) note.push(`più scadenze: ${scadenze.map(([d, i]) => `${d} ${i}`).join("; ")}`);
        documenti.push({
          file: nomeFile, tipo, tipo_documento: tipo === "TD04" ? "Nota di credito" : TIPI[tipo] || "Fattura elettronica", numero: tx(gen, "Numero"), data: tx(gen, "Data").slice(0, 10),
          fornitore: fornitore.nome, piva_fornitore: fornitore.piva || fornitore.cf, paese_fornitore: fornitore.paese, piva_cliente: cliente.piva, cf_cliente: cliente.cf, nome_cliente: cliente.nome,
          imponibile: r2(segno * Math.abs(imponibile)), iva: r2(segno * Math.abs(iva)), totale: r2(segno * Math.abs(totale)), descrizione: descrizione.slice(0, 400),
          scadenza: scadenze.length ? scadenze.map(([d]) => d).sort()[0].slice(0, 10) : "", modalita, note: note.join("; "),
        });
      }
      return documenti;
    }
    function leggiFile(nome, byte) {
      const minuscolo = nome.toLowerCase();
      if (minuscolo.endsWith(".zip") || (byte[0] === 0x50 && byte[1] === 0x4B)) {
        return { documenti: [], errori: [`${nome}: nella versione dimostrativa si possono provare solo i file .xml (o .p7m) uno per uno. Nel programma vero si può scegliere anche lo zip scaricato dall'Agenzia delle Entrate.`] };
      }
      if (minuscolo.includes("metadato") || minuscolo.includes("metadati")) return { documenti: [], errori: [] };
      try {
        let t = new TextDecoder("utf-8").decode(byte);
        if (minuscolo.endsWith(".p7m")) {
          const grezzo = new TextDecoder("latin1").decode(byte);
          const i = grezzo.indexOf("<?xml"), m = /<\/[A-Za-z0-9_]*:?FatturaElettronica>/.exec(grezzo);
          if (i < 0 || !m) throw new Error("non riesco ad aprire la busta firmata (.p7m) in questa versione dimostrativa");
          t = new TextDecoder("utf-8").decode(byte.slice(i, m.index + m[0].length));
        }
        if (/_(MT|RC|NS|DT)_/.test(nome)) return { documenti: [], errori: [] };
        return { documenti: leggiXml(t, nome), errori: [] };
      } catch (e) {
        return { documenti: [], errori: [`${nome}: ${e.message}`] };
      }
    }
    const PAROLE_CATEGORIA = [
      [["carburant", "benzina", "gasolio", "autostrad", "telepass"], "Auto e carburante", "Trasporti e auto personali"],
      [["leasing", "revision", "tagliando", "gomme", "carrozzeria", "officina"], "Auto e carburante", "Trasporti e auto personali"],
      [["affitto", "locazione"], "Affitto, utenze e ufficio", "Casa"],
      [["telefon", "fibra", "internet", "mobile"], "Telefono e internet", "Utenze di casa"],
      [["hosting", "dominio", "software", "cloud", "abbonamento"], "Software e servizi online", "Abbonamenti personali"],
      [["luce", "gas", "energia", "acqua"], "Affitto, utenze e ufficio", "Utenze di casa"],
      [["commercialist", "studio associato", "notai", "avvocat"], "Commercialista e consulenze", "Altro personale"],
      [["toner", "cancelleria", "cartucc", "carta per"], "Cancelleria e materiali", "Altro personale"],
      [["treno", "volo", "hotel", "albergo"], "Viaggi e trasferte", "Viaggi e vacanze"],
      [["farmacia", "laboratorio analisi", "medic"], "Altro impresa", "Salute"],
    ];
    const MEZZO_DA_MODALITA = { MP08: { SRLS: "Carta aziendale", DITTA: "Carta della ditta" }, MP01: { SRLS: "Contanti", DITTA: "Contanti", PERS: "Contanti" } };
    const MEZZO_PREDEFINITO = { SRLS: "Conto della società", DITTA: "Conto della ditta", PERS: "" };
    const soloCifre = (v) => String(v || "").replace(/\D/g, "").replace(/^0+/, "");
    function preparaFatture(nome, base64) {
      let byte;
      try { const b = atob(base64); byte = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) byte[i] = b.charCodeAt(i); } catch { throw new Errore(`${nome}: file non leggibile.`); }
      const { documenti, errori } = leggiFile(nome, byte);
      const identita = {};
      for (const c of tab("gs_cassetti")) for (const v of [c.partita_iva, c.codice_fiscale]) if (v) identita[soloCifre(v) || v.toUpperCase()] = c.codice;
      const chi = (piva, cf) => { for (const v of [piva, cf]) if (v && identita[soloCifre(v) || v.toUpperCase()]) return identita[soloCifre(v) || v.toUpperCase()]; return ""; };
      const esistenti = tab("gs_spese");
      for (const d of documenti) {
        const propria = chi(d.piva_fornitore, "");
        d.intestato_a = chi(d.piva_cliente, d.cf_cliente);
        if (propria) d.salta = `è una fattura emessa da te (${propria}): va fra le fatture da incassare, non fra le spese`;
        else if (!d.intestato_a) d.salta = `è intestata a ${d.nome_cliente || "qualcun altro"}, non a uno dei tuoi cassetti`;
        const gia = esistenti.find((e) => (e.numero_documento && e.numero_documento.trim().toUpperCase() === d.numero.trim().toUpperCase()
          && (soloCifre(e.piva_fornitore) === soloCifre(d.piva_fornitore) || e.data_documento === d.data)) || (e.file_documento && e.file_documento === d.file));
        if (gia) d.gia = gia.codice;
        const cassetto = d.intestato_a || "DITTA";
        const simili = ordina(esistenti.filter((e) => e.piva_fornitore && soloCifre(e.piva_fornitore) === soloCifre(d.piva_fornitore) && e.cassetto === cassetto), ["-data_documento"]);
        let categoria = simili.length ? simili[0].categoria : "";
        if (!categoria) {
          const nomeF = `${`${d.fornitore} ${d.descrizione}`.toLowerCase().split(/\s+/).join(" ")} `;
          for (const [parole, impresa, personale] of PAROLE_CATEGORIA) if (parole.some((x) => nomeF.includes(x))) { categoria = cassetto === "PERS" ? personale : impresa; break; }
        }
        d.cassetto = cassetto; d.categoria = categoria;
        d.mezzo = simili.length && simili[0].mezzo ? simili[0].mezzo : ((MEZZO_DA_MODALITA[d.modalita] || {})[cassetto] || MEZZO_PREDEFINITO[cassetto] || "");
        d.pagato = d.scadenza && d.scadenza >= oggi() ? "no" : "si";
      }
      return { documenti, errori };
    }
    function importaFatture(documenti) {
      let inseriti = 0;
      for (const d of documenti) {
        if (!d || typeof d !== "object") continue;
        const note = ["importata dalla fattura elettronica", d.note || ""].filter(Boolean);
        if (d.pagato === "si" && d.scadenza && !d.data_pagamento) note.push("pagata: data del pagamento non indicata");
        inserisci("gs_spese", { data_documento: d.data, cassetto: d.cassetto, categoria: d.categoria, fornitore: d.fornitore, piva_fornitore: d.piva_fornitore,
          descrizione: d.descrizione, tipo_documento: d.tipo_documento, numero_documento: d.numero, intestato_a: d.intestato_a || d.cassetto, imponibile: d.imponibile,
          iva: d.iva, totale: d.totale, mezzo: d.mezzo, pagato: d.pagato, scadenza: d.scadenza, file_documento: d.file, origine: "XML",
          stato: d.categoria ? "ok" : "da_verificare", segnala: d.segnala === "si" ? "si" : "no", note: note.join("; ") }, false);
        inseriti++;
      }
      if (inseriti) registra("Importazione", `${inseriti} fatture elettroniche importate come spese`);
      return inseriti;
    }

    function gestisci(metodo, percorso, query, corpo) {
      if (percorso === "dati" && metodo === "GET") return R(tutto());
      if (percorso === "leggi-fattura" && metodo === "POST") return R(preparaFatture(String(corpo.nome || "fattura.xml"), String(corpo.contenuto || "")));
      if (percorso === "importa-fatture" && metodo === "POST") return R({ ok: true, importate: importaFatture(corpo.documenti || []) });
      if (percorso === "paga" && metodo === "POST") return R(pagaRicorrente(corpo));
      if (percorso === "incassa" && metodo === "POST") { modifica("gs_incassi", parseInt(corpo.id || 0, 10), { stato: "incassata", data_incasso: corpo.data_incasso || oggi() }); return R({ ok: true }); }
      if (percorso === "impostazioni" && metodo === "POST") {
        let soglia = numero(corpo.soglia_budget);
        const giorni = Math.trunc(numero(corpo.giorni_avviso) || 7);
        if (soglia !== null && soglia > 1) soglia /= 100;
        const v = { soglia_budget: Math.min(Math.max(soglia || 0.8, 0.1), 1), giorni_avviso: Math.min(Math.max(giorni, 1), 90) };
        for (const [k, x] of Object.entries(v)) scriviMeta(`spese_${k}`, x);
        registra("Impostazioni", `avviso budget al ${Math.round(v.soglia_budget * 100)}%, avviso scadenze ${v.giorni_avviso} giorni prima`);
        return R({ ok: true });
      }
      if (percorso === "prossimo-codice" && metodo === "GET") return R({ codice: prossimoCodice(dataIso(query.get("data") || "")) });
      if (percorso === "commercialista" && metodo === "GET") {
        const anno = oggiD().getFullYear();
        const da = dataIso(query.get("da") || "") || `${anno}-01-01`, a = dataIso(query.get("a") || "") || `${anno}-12-31`;
        const cassetti = (query.get("cassetti") ?? "SRLS,DITTA").split(",").filter(Boolean);
        if (query.get("formato") === "excel") {
          registra("Esportazione", `riepilogo per il commercialista ${cassetti.join(", ")} dal ${dataIt(da)} al ${dataIt(a)}`);
          return esportaCommercialista(da, a, cassetti);
        }
        return R(datiCommercialista(da, a, cassetti));
      }
      if (percorso === "esporta-excel" && metodo === "GET") return esportaRegistro();
      if (percorso === "esporta-backup" && metodo === "GET") return fileJson({ formato: "spese-1", creato: adesso(), ...tutto() }, `Spese-backup-${dataFile()}.json`);
      if (percorso === "ripristina" && metodo === "POST") {
        const dati = corpo.dati || {};
        if (dati.formato !== "spese-1" || !Array.isArray(dati.spese)) throw new Errore("Questo file non è un backup della sezione Spese.");
        for (const t of Object.values(CHIAVI_DATI)) DB.t[t] = [];
        const conteggi = caricaTutto(dati);
        registra("Ripristino", `dati sostituiti con il backup del ${dataIt(String(dati.creato || "").slice(0, 10))}: ${conteggi.spese} spese`);
        return R({ ok: true, conteggi });
      }
      const tabella = NOMI[percorso];
      if (!tabella) return R({ errore: "Richiesta sconosciuta." }, 404);
      if (metodo === "POST") {
        if (tabella === "gs_cassetti") return R({ errore: "I cassetti sono tre e si possono solo modificare." }, 400);
        return R({ ok: true, id: inserisci(tabella, corpo) }, 201);
      }
      const ident = parseInt(query.get("id") || "0", 10);
      if (!ident) return R({ errore: "Numero dell'elemento mancante." }, 400);
      if (metodo === "PATCH") { modifica(tabella, ident, corpo); return R({ ok: true }); }
      if (metodo === "DELETE") {
        if (tabella === "gs_cassetti") return R({ errore: "I cassetti non si possono eliminare." }, 400);
        elimina(tabella, ident);
        return R({ ok: true });
      }
      return R({ errore: "Operazione non prevista." }, 405);
    }
    const semina = (d) => caricaTutto(d, true);
    return { gestisci, riepilogo, agenda, semina };
  })();

  // ==================================================================== Benessere personale (come sezioni/benessere/modulo.py)
  const Benessere = (() => {
    const AREE = ["aspetto", "movimento", "abitudini", "umore", "alimentazione", "farmaci"];
    const SI_NO = ["si", "no"];
    const NOMI_CATEGORIE = { medico: "Medico di base", specialista: "Visita specialistica", dentista: "Dentista", esami: "Esami e analisi", screening: "Controllo periodico",
      fisioterapia: "Fisioterapia", parrucchiere: "Parrucchiere", estetista: "Estetista", altro: "Altro" };
    const CATEGORIE_CURA = ["parrucchiere", "estetista"];
    const NOMI_STATI_APP = { da_prenotare: "Da prenotare", programmato: "Prenotato", fatto: "Fatto", annullato: "Annullato" };
    const T = "testo", N = "numero", I = "intero";
    const TABELLE = {
      bn_abitudini: { nome: [T, "", null], area: [T, "abitudini", AREE], icona: [T, "•", null], tipo: [T, "spunta", ["spunta", "quantita"]], unita: [T, "", null],
        obiettivo_giorno: [N, 1, null], obiettivo_settimana: [I, 5, null], giorni: [T, "1234567", null], fonte: [T, "manuale", ["manuale", "movimento", "sonno", "farmaci", "diario"]],
        attiva: [T, "si", SI_NO], ordine: [I, 50, null], note: [T, "", null] },
      bn_registro: { data: [T, "", null], abitudine_id: [I, 0, null], valore: [N, 0, null] },
      bn_diario: { data: [T, "", null], umore: [I, 0, null], energia: [I, 0, null], sonno_qualita: [I, 0, null], sonno_ore: [N, null, null], parole: [T, "", null], cosa_bella: [T, "", null], note: [T, "", null] },
      bn_attivita: { data: [T, "", null], tipo: [T, "Camminata", null], minuti: [N, 30, null], intensita: [T, "media", ["leggera", "media", "intensa"]], passi: [I, 0, null], note: [T, "", null] },
      bn_pasti: { data: [T, "", null], momento: [T, "pranzo", ["colazione", "spuntino", "pranzo", "merenda", "cena", "altro"]], descrizione: [T, "", null], etichette: [T, "", null], note: [T, "", null] },
      bn_farmaci: { nome: [T, "", null], tipo: [T, "farmaco", ["farmaco", "integratore", "altro"]], dose: [T, "", null], unita_per_dose: [N, 1, null], orari: [T, "", null],
        giorni: [T, "1234567", null], dal: [T, "", null], al: [T, "", null], scorta: [N, null, null], avviso_giorni: [I, 7, null], a_cosa_serve: [T, "", null],
        prescritto_da: [T, "", null], attivo: [T, "si", SI_NO], note: [T, "", null] },
      bn_assunzioni: { data: [T, "", null], farmaco_id: [I, 0, null], orario: [T, "", null], ora_presa: [T, "", null], nota: [T, "", null] },
      bn_appuntamenti: { titolo: [T, "", null], categoria: [T, "medico", Object.keys(NOMI_CATEGORIE)], data: [T, "", null], ora: [T, "", null], luogo: [T, "", null],
        persona: [T, "", null], stato: [T, "programmato", Object.keys(NOMI_STATI_APP)], ripeti_mesi: [I, 0, null], preparazione: [T, "", null], note: [T, "", null],
        esito: [T, "", null], precedente_id: [I, 0, null] },
      bn_prodotti: { nome: [T, "", null], marca: [T, "", null], uso: [T, "viso", ["viso", "corpo", "capelli", "unghie", "trucco", "solari", "altro"]],
        stato: [T, "in_uso", ["in_uso", "da_aprire", "finito", "da_comprare"]], aperto_il: [T, "", null], durata_mesi: [I, 0, null], scadenza: [T, "", null], voto: [I, 0, null],
        ricomprare: [T, "", ["", "si", "no", "forse"]], note: [T, "", null] },
    };
    const NOMI = { abitudine: "bn_abitudini", attivita: "bn_attivita", pasto: "bn_pasti", farmaco: "bn_farmaci", appuntamento: "bn_appuntamenti", prodotto: "bn_prodotti" };
    const CHIAVI_DATI = { abitudini: "bn_abitudini", registro: "bn_registro", diario: "bn_diario", attivita: "bn_attivita", pasti: "bn_pasti", farmaci: "bn_farmaci",
      assunzioni: "bn_assunzioni", appuntamenti: "bn_appuntamenti", prodotti: "bn_prodotti" };
    const IMPOSTAZIONI_BASE = { obiettivo_movimento: 150, giorni_avviso: 7 };

    function numero(v) {
      if (v === null || v === undefined || v === "") return null;
      if (typeof v === "number" || typeof v === "boolean") return Number(v);
      let t = String(v).trim().replace(/ /g, "");
      if (t.includes(",")) t = t.replace(/\./g, "").replace(",", ".");
      const n = Number(t);
      return t !== "" && Number.isFinite(n) ? n : null;
    }
    function impostazioni() {
      const v = { ...IMPOSTAZIONI_BASE };
      for (const k of Object.keys(v)) { const m = meta(`benessere_${k}`); if (m !== null && Number.isFinite(Number(m))) v[k] = Math.trunc(Number(m)); }
      return v;
    }
    function pulisci(tabella, dati) {
      const valori = {};
      for (const [campo, [tipo, pred, ammessi]] of Object.entries(TABELLE[tabella])) {
        const grezzo = campo in dati ? dati[campo] : pred;
        if (tipo === N) { const n = numero(grezzo); valori[campo] = n !== null ? r2(n) : pred; }
        else if (tipo === I) { const n = numero(grezzo); valori[campo] = n !== null ? Math.trunc(n) : (pred || 0); }
        else {
          let t = testo(grezzo, 5000);
          if (ammessi && !ammessi.includes(t)) t = pred;
          else if (!t && pred) t = pred;
          valori[campo] = t;
        }
      }
      if (tabella === "bn_prodotti" && !valori.scadenza && valori.aperto_il && valori.durata_mesi) {
        const aperto = comeData(valori.aperto_il);
        if (aperto) valori.scadenza = iso(aggiungiMesi(aperto, valori.durata_mesi));
      }
      if (tabella === "bn_farmaci") {
        const orari = new Set();
        for (const pezzo of valori.orari.replace(/;/g, ",").replace(/\./g, ":").split(",")) {
          const p = pezzo.trim(); if (!p) continue;
          const [ore, minuti = ""] = p.split(":");
          if (/^\d+$/.test(ore) && Number(ore) < 24 && (!minuti || (/^\d\d?/.test(minuti) && Number(minuti.slice(0, 2)) < 60))) orari.add(`${pad(Number(ore))}:${pad(Number(minuti.slice(0, 2) || 0))}`);
          else throw new Errore(`L'orario "${p}" non è valido: scrivilo come 08:00.`);
        }
        valori.orari = [...orari].sort().join(",");
      }
      for (const campo of ["data", "dal", "al", "aperto_il", "scadenza"]) if (campo in valori && valori[campo] && !comeData(valori[campo])) throw new Errore(`La data "${valori[campo]}" non è valida.`);
      return valori;
    }
    function inserisci(tabella, dati, id) {
      const v = pulisci(tabella, dati);
      if (["bn_abitudini", "bn_farmaci", "bn_prodotti"].includes(tabella) && !v.nome) throw new Errore("Scrivi il nome.");
      if (["bn_appuntamenti", "bn_attivita", "bn_pasti"].includes(tabella) && !v.data) throw new Errore("Scegli il giorno.");
      if (tabella === "bn_appuntamenti" && !v.titolo) v.titolo = NOMI_CATEGORIE[v.categoria] || "Appuntamento";
      v.creato = String(dati.creato || adesso());
      v.aggiornato = adesso();
      return aggiungi(tabella, v, id);
    }
    function modifica(tabella, ident, dati) {
      const attuale = trova(tabella, ident);
      if (!attuale) throw new Errore("Elemento non trovato: forse è stato eliminato.");
      const uniti = { ...attuale, ...dati };
      if (tabella === "bn_prodotti" && ("aperto_il" in dati || "durata_mesi" in dati) && !("scadenza" in dati)) uniti.scadenza = "";
      Object.assign(attuale, pulisci(tabella, uniti), { aggiornato: adesso() });
    }
    function elimina(tabella, ident) {
      if (tabella === "bn_abitudini") togli("bn_registro", (r) => r.abitudine_id === ident);
      if (tabella === "bn_farmaci") togli("bn_assunzioni", (r) => r.farmaco_id === ident);
      togli(tabella, (r) => r.id === ident);
    }
    const tutto = () => ({
      abitudini: ordina(copia(tab("bn_abitudini")), ["ordine", "id"]),
      registro: ordina(tab("bn_registro").map((r) => ({ data: r.data, abitudine_id: r.abitudine_id, valore: r.valore })), ["data"]),
      diario: ordina(copia(tab("bn_diario")), ["-data"]),
      attivita: ordina(copia(tab("bn_attivita")), ["-data", "-id"]),
      pasti: ordina(copia(tab("bn_pasti")), ["-data", "-id"]),
      farmaci: ordina(copia(tab("bn_farmaci")), ["-attivo", "nome"]),
      assunzioni: ordina(copia(tab("bn_assunzioni")), ["-data", "orario"]),
      appuntamenti: ordina(copia(tab("bn_appuntamenti")), ["data", "ora"]),
      prodotti: ordina(copia(tab("bn_prodotti")), ["stato", "nome"]),
      impostazioni: impostazioni(),
    });
    function caricaTutto(dati, conId = false) {
      const nuovi = { bn_abitudini: new Map(), bn_farmaci: new Map(), bn_appuntamenti: new Map() };
      const conteggi = Object.fromEntries(Object.keys(CHIAVI_DATI).map((k) => [k, 0]));
      for (const chiave of ["abitudini", "farmaci", "appuntamenti", "diario", "attivita", "pasti", "prodotti"]) {
        const tabella = CHIAVI_DATI[chiave];
        for (const riga of dati[chiave] || []) {
          if (!riga || typeof riga !== "object") continue;
          const nuovo = inserisci(tabella, riga, conId ? riga.id : undefined);
          if (nuovi[tabella]) nuovi[tabella].set(String(riga.id), nuovo);
          conteggi[chiave]++;
        }
      }
      for (const riga of dati.registro || []) { const id = nuovi.bn_abitudini.get(String(riga.abitudine_id)); if (id) { inserisci("bn_registro", { ...riga, abitudine_id: id }); conteggi.registro++; } }
      for (const riga of dati.assunzioni || []) { const id = nuovi.bn_farmaci.get(String(riga.farmaco_id)); if (id) { inserisci("bn_assunzioni", { ...riga, farmaco_id: id }); conteggi.assunzioni++; } }
      for (const nuovo of nuovi.bn_appuntamenti.values()) { const a = trova("bn_appuntamenti", nuovo); if (a && a.precedente_id) a.precedente_id = nuovi.bn_appuntamenti.get(String(a.precedente_id)) || 0; }
      return conteggi;
    }
    function segna(corpo) {
      const giorno = iso(comeData(corpo.data) || oggiD());
      const ident = Math.trunc(numero(corpo.abitudine_id) || 0);
      const valore = numero(corpo.valore) || 0;
      if (!trova("bn_abitudini", ident)) throw new Errore("Abitudine non trovata.");
      const esistente = tab("bn_registro").find((r) => r.data === giorno && r.abitudine_id === ident);
      if (valore <= 0) togli("bn_registro", (r) => r.data === giorno && r.abitudine_id === ident);
      else if (esistente) { esistente.valore = r2(Math.min(valore, 1000)); esistente.aggiornato = adesso(); }
      else aggiungi("bn_registro", { data: giorno, abitudine_id: ident, valore: r2(Math.min(valore, 1000)), creato: adesso(), aggiornato: adesso() });
      return { ok: true };
    }
    function salvaDiario(corpo) {
      const giorno = iso(comeData(corpo.data) || oggiD());
      const attuale = tab("bn_diario").find((d) => d.data === giorno);
      const campi = {};
      for (const [k, v] of Object.entries(corpo)) if (k in TABELLE.bn_diario && k !== "data") campi[k] = v;
      for (const c of ["umore", "energia", "sonno_qualita"]) if (c in campi) campi[c] = Math.min(Math.max(Math.trunc(numero(campi[c]) || 0), 0), 5);
      if (attuale) modifica("bn_diario", attuale.id, campi); else inserisci("bn_diario", { ...campi, data: giorno });
      return { ok: true };
    }
    function prendi(corpo) {
      const giorno = iso(comeData(corpo.data) || oggiD());
      const ident = Math.trunc(numero(corpo.farmaco_id) || 0);
      const f = trova("bn_farmaci", ident);
      if (!f) throw new Errore("Farmaco non trovato.");
      let orario = testo(corpo.orario).slice(0, 5);
      const preso = ![false, "no", 0, "0"].includes(corpo.preso ?? true);
      const dose = f.unita_per_dose || 1;
      if (preso) {
        if (!orario) orario = oraHM();
        else if (tab("bn_assunzioni").some((a) => a.data === giorno && a.farmaco_id === ident && a.orario === orario)) return { ok: true };
        inserisci("bn_assunzioni", { data: giorno, farmaco_id: ident, orario, ora_presa: String(corpo.ora_presa || oraHM()), nota: corpo.nota || "" });
        if (f.scorta !== null) { f.scorta = Math.max(f.scorta - dose, 0); f.aggiornato = adesso(); }
      } else {
        const candidate = ordina(tab("bn_assunzioni").filter((a) => a.data === giorno && a.farmaco_id === ident && (!orario || a.orario === orario)), ["-id"]);
        if (candidate.length) {
          togli("bn_assunzioni", (a) => a.id === candidate[0].id);
          if (f.scorta !== null) { f.scorta += dose; f.aggiornato = adesso(); }
        }
      }
      return { ok: true };
    }
    function appuntamentoFatto(corpo) {
      const ident = Math.trunc(numero(corpo.id) || 0);
      const app = trova("bn_appuntamenti", ident);
      if (!app) throw new Errore("Appuntamento non trovato.");
      const prima = { ...app };
      const cambi = { stato: "fatto" };
      if (corpo.esito) cambi.esito = corpo.esito;
      if (corpo.data) cambi.data = corpo.data;
      modifica("bn_appuntamenti", ident, cambi);
      let prossimo = null;
      const giorno = comeData(cambi.data || prima.data) || oggiD();
      if (prima.ripeti_mesi && !tab("bn_appuntamenti").some((a) => a.precedente_id === ident)) {
        prossimo = inserisci("bn_appuntamenti", { titolo: prima.titolo, categoria: prima.categoria, data: iso(aggiungiMesi(giorno, prima.ripeti_mesi)), luogo: prima.luogo,
          persona: prima.persona, stato: "da_prenotare", ripeti_mesi: prima.ripeti_mesi, preparazione: prima.preparazione, precedente_id: ident });
      }
      return { ok: true, prossimo };
    }
    function dosiPreviste(f, giorno) {
      if (f.attivo !== "si" || !f.orari) return [];
      const dal = comeData(f.dal) || comeData(f.creato || ""), al = comeData(f.al);
      if ((dal && giorno < dal) || (al && giorno > al) || !(f.giorni || "1234567").includes(String(giornoSettimanaIso(giorno)))) return [];
      return f.orari.split(",");
    }
    function fineScorta(f) {
      if (f.attivo !== "si" || f.scorta === null || !f.orari) return null;
      const alGiorno = f.orari.split(",").length * (f.unita_per_dose || 1) * (f.giorni || "1234567").length / 7;
      if (alGiorno <= 0) return null;
      return piuGiorni(oggiD(), Math.floor(f.scorta / alGiorno));
    }
    function valoreGiorno(a, giorno) {
      const g = iso(giorno);
      if (!(a.giorni || "1234567").includes(String(giornoSettimanaIso(giorno)))) return null;
      if (a.fonte === "movimento") return tab("bn_attivita").filter((x) => x.data === g).reduce((t, x) => t + (x.minuti || 0), 0);
      if (a.fonte === "sonno") { const d = tab("bn_diario").find((x) => x.data === g); return d ? d.sonno_ore || 0 : 0; }
      if (a.fonte === "diario") { const d = tab("bn_diario").find((x) => x.data === g); return d && d.umore ? 1 : 0; }
      if (a.fonte === "farmaci") {
        const attivi = tab("bn_farmaci").filter((f) => f.attivo === "si");
        const previste = attivi.reduce((t, f) => t + dosiPreviste(f, giorno).length, 0);
        if (!previste) return null;
        const prese = tab("bn_assunzioni").filter((x) => { const f = trova("bn_farmaci", x.farmaco_id); return x.data === g && f && f.attivo === "si" && `,${f.orari},`.includes(`,${x.orario},`); }).length;
        return prese >= previste ? 1 : 0;
      }
      const r = tab("bn_registro").find((x) => x.data === g && x.abitudine_id === a.id);
      return r ? r.valore : 0;
    }
    const fatta = (a, v) => v !== null && v >= (a.tipo === "quantita" ? a.obiettivo_giorno || 1 : 1);
    function riepilogo() {
      const g = oggiD(), gi = iso(g);
      const diOggi = tab("bn_abitudini").filter((a) => a.attiva === "si").map((a) => [a, valoreGiorno(a, g)]).filter(([, v]) => v !== null);
      const fatte = diOggi.filter(([a, v]) => fatta(a, v)).length;
      let dosi = 0;
      for (const f of tab("bn_farmaci").filter((x) => x.attivo === "si")) {
        const prese = new Set(tab("bn_assunzioni").filter((x) => x.data === gi && x.farmaco_id === f.id).map((x) => x.orario));
        dosi += dosiPreviste(f, g).filter((o) => !prese.has(o)).length;
      }
      const prossima = ordina(tab("bn_appuntamenti").filter((a) => a.stato === "programmato" && a.data >= gi).map((a) => ({ ...a })), ["data", "ora"])[0];
      const tra30 = iso(piuGiorni(g, 30));
      const daPrenotare = tab("bn_appuntamenti").filter((a) => a.stato === "da_prenotare" && a.data <= tra30).length;
      return [
        { etichetta: "abitudini fatte oggi", valore: `${fatte} di ${diOggi.length}` },
        { etichetta: "dosi di farmaci ancora da prendere oggi", valore: dosi },
        { etichetta: "prossima visita o appuntamento", valore: prossima ? dataIt(prossima.data).slice(0, 5) : "nessuna" },
        { etichetta: "controlli da prenotare (entro 30 giorni)", valore: daPrenotare },
      ];
    }
    function agenda(inizio, fine) {
      const eventi = [];
      for (const a of tab("bn_appuntamenti")) {
        if (a.stato === "annullato" || !(a.data >= inizio && a.data <= fine)) continue;
        const dp = a.stato === "da_prenotare";
        eventi.push({ data: a.data, ora: dp ? "" : a.ora, tipo: dp ? "controllo" : (CATEGORIE_CURA.includes(a.categoria) ? "cura" : "visita"),
          nome_tipo: dp ? "Da prenotare" : NOMI_CATEGORIE[a.categoria] || "Visita", titolo: a.titolo,
          sotto: a.persona || (a.preparazione && `Preparazione: ${a.preparazione}`) || "", luogo: a.luogo, fatto: a.stato === "fatto", link: `/s/benessere/#appuntamento-${a.id}` });
      }
      const gIn = comeData(inizio), gFi = comeData(fine);
      for (const f of tab("bn_farmaci").filter((x) => x.attivo === "si")) {
        const finisce = fineScorta(f);
        if (finisce) {
          const riordino = new Date(Math.max(oggiD(), piuGiorni(finisce, -(f.avviso_giorni || 7))));
          const al = comeData(f.al);
          if ((!al || riordino <= al) && gIn && gFi && gIn <= riordino && riordino <= gFi) {
            eventi.push({ data: iso(riordino), ora: "", tipo: "farmaco", nome_tipo: "Farmaci", titolo: `Riordinare: ${f.nome}`,
              sotto: `scorta per circa ${Math.max(differenzaGiorni(oggiD(), finisce), 0)} giorni`, luogo: "", fatto: false, link: `/s/benessere/#farmaco-${f.id}` });
          }
        }
        if (f.al && inizio <= f.al && f.al <= fine) eventi.push({ data: f.al, ora: "", tipo: "farmaco", nome_tipo: "Farmaci", titolo: `Ultimo giorno: ${f.nome}`, sotto: "fine della terapia", luogo: "", fatto: false, link: `/s/benessere/#farmaco-${f.id}` });
      }
      for (const p of tab("bn_prodotti")) {
        if (p.stato === "in_uso" && p.scadenza && p.scadenza >= inizio && p.scadenza <= fine) eventi.push({ data: p.scadenza, ora: "", tipo: "cura", nome_tipo: "Prodotto da sostituire", titolo: p.nome, sotto: p.marca, luogo: "", fatto: false, link: `/s/benessere/#prodotto-${p.id}` });
      }
      return eventi;
    }
    const media = (valori) => { const b = valori.filter((v) => v); return b.length ? Math.round((b.reduce((t, v) => t + v, 0) / b.length) * 10) / 10 : null; };
    function datiMedico(da, a) {
      const inizio = comeData(da), fine = comeData(a);
      if (!inizio || !fine || fine < inizio) throw new Errore("Controlla le date del periodo.");
      const diario = ordina(copia(tab("bn_diario").filter((d) => d.data >= da && d.data <= a)), ["data"]);
      const attivita = ordina(copia(tab("bn_attivita").filter((x) => x.data >= da && x.data <= a)), ["data"]);
      const farmaci = [];
      for (const f of ordina(copia(tab("bn_farmaci")), ["nome"])) {
        let previste = 0, prese = 0;
        const limite = fine < oggiD() ? fine : oggiD();
        for (let g = inizio; g <= limite; g = piuGiorni(g, 1)) previste += dosiPreviste(f, g).length;
        const assunzioni = tab("bn_assunzioni").filter((x) => x.farmaco_id === f.id && x.data >= da && x.data <= a);
        if (f.orari) prese = assunzioni.filter((x) => f.orari.split(",").includes(x.orario)).length;
        if (!previste && !assunzioni.length && f.attivo !== "si") continue;
        farmaci.push({ nome: f.nome, tipo: f.tipo, dose: f.dose, orari: f.orari.replace(/,/g, ", ") || "al bisogno", a_cosa_serve: f.a_cosa_serve, prescritto_da: f.prescritto_da,
          dal: f.dal, al: f.al, attivo: f.attivo, previste, prese: f.orari ? prese : assunzioni.length, aderenza: previste ? Math.round((prese / previste) * 100) : null });
      }
      const settimane = new Map();
      const lunedi = (v) => { const g = comeData(v); return iso(piuGiorni(g, -((g.getDay() + 6) % 7))); };
      const sett = (k) => { if (!settimane.has(k)) settimane.set(k, { diario: [], minuti: 0 }); return settimane.get(k); };
      for (const d of diario) sett(lunedi(d.data)).diario.push(d);
      for (const x of attivita) sett(lunedi(x.data)).minuti += x.minuti || 0;
      const perSettimana = [...settimane.entries()].sort((x, y) => confronta(x[0], y[0])).map(([k, v]) => ({ settimana: k, umore: media(v.diario.map((d) => d.umore)),
        energia: media(v.diario.map((d) => d.energia)), sonno_ore: media(v.diario.map((d) => d.sonno_ore)), sonno_qualita: media(v.diario.map((d) => d.sonno_qualita)),
        minuti: Math.round(v.minuti), giorni_diario: v.diario.length }));
      const visite = ordina(copia(tab("bn_appuntamenti").filter((v) => v.data >= da && v.data <= a && !CATEGORIE_CURA.includes(v.categoria))), ["data"]);
      return { da, a, farmaci, settimane: perSettimana, visite, note: diario.filter((d) => d.note).map((d) => ({ data: d.data, testo: d.note })),
        totali: { umore: media(diario.map((d) => d.umore)), energia: media(diario.map((d) => d.energia)), sonno_ore: media(diario.map((d) => d.sonno_ore)),
          sonno_qualita: media(diario.map((d) => d.sonno_qualita)), minuti: Math.round(attivita.reduce((t, x) => t + (x.minuti || 0), 0)), giorni_diario: diario.length, attivita: attivita.length } };
    }
    function esportaMedico(da, a) {
      const d = datiMedico(da, a);
      return fileExcel([
        ["Farmaci", ["Nome", "Tipo", "Dose", "Orari", "A cosa serve", "Prescritto da", "Dal", "Al", "Dosi previste", "Dosi prese", "Regolarità"],
          d.farmaci.map((f) => [f.nome, f.tipo, f.dose, f.orari, f.a_cosa_serve, f.prescritto_da, comeData(f.dal), comeData(f.al), f.previste || "", f.prese, f.aderenza !== null ? `${f.aderenza}%` : ""]),
          [26, 12, 18, 16, 28, 20, 12, 12, 13, 11, 11]],
        ["Settimane", ["Settimana dal", "Umore medio (1-5)", "Energia media (1-5)", "Ore di sonno", "Qualità sonno (1-5)", "Minuti di movimento", "Giorni con il diario"],
          d.settimane.map((s) => [comeData(s.settimana), s.umore, s.energia, s.sonno_ore, s.sonno_qualita, s.minuti, s.giorni_diario]), [14, 17, 18, 13, 18, 19, 19]],
        ["Visite", ["Data", "Ora", "Tipo", "Titolo", "Medico / persona", "Luogo", "Stato", "Esito", "Note"],
          d.visite.map((v) => [comeData(v.data), v.ora, NOMI_CATEGORIE[v.categoria] || v.categoria, v.titolo, v.persona, v.luogo, NOMI_STATI_APP[v.stato] || v.stato, v.esito, v.note]), [12, 8, 22, 30, 22, 24, 12, 40, 40]],
        ["Note del diario", ["Data", "Nota"], d.note.map((n) => [comeData(n.data), n.testo]), [12, 90]],
      ], `Benessere-per-il-medico-${da}-${a}.xlsx`);
    }
    function esportaTutto() {
      const ab = (id) => trova("bn_abitudini", id) || {}, fa = (id) => trova("bn_farmaci", id) || {};
      return fileExcel([
        ["Come stai", ["Data", "Umore (1-5)", "Energia (1-5)", "Ore di sonno", "Qualità sonno (1-5)", "Parole", "Una cosa bella", "Note"],
          ordina(copia(tab("bn_diario")), ["-data"]).map((d) => [comeData(d.data), d.umore || "", d.energia || "", d.sonno_ore ?? "", d.sonno_qualita || "", d.parole, d.cosa_bella, d.note]), [12, 12, 13, 12, 18, 30, 40, 40]],
        ["Abitudini", ["Data", "Abitudine", "Valore", "Unità"], ordina(copia(tab("bn_registro")), ["-data"]).map((r) => [comeData(r.data), ab(r.abitudine_id).nome || "?", r.valore, ab(r.abitudine_id).unita || ""]), [12, 28, 10, 12]],
        ["Movimento", ["Data", "Attività", "Minuti", "Intensità", "Passi", "Note"], ordina(copia(tab("bn_attivita")), ["-data"]).map((x) => [comeData(x.data), x.tipo, x.minuti, x.intensita, x.passi || "", x.note]), [12, 24, 10, 12, 10, 40]],
        ["Pasti", ["Data", "Momento", "Cosa", "Etichette", "Note"], ordina(copia(tab("bn_pasti")), ["-data", "id"]).map((p) => [comeData(p.data), p.momento, p.descrizione, p.etichette, p.note]), [12, 12, 40, 30, 30]],
        ["Farmaci", ["Nome", "Tipo", "Dose", "Orari", "Dal", "Al", "Scorta", "A cosa serve", "Prescritto da", "Attivo", "Note"],
          tab("bn_farmaci").map((f) => [f.nome, f.tipo, f.dose, f.orari.replace(/,/g, ", ") || "al bisogno", comeData(f.dal), comeData(f.al), f.scorta ?? "", f.a_cosa_serve, f.prescritto_da, f.attivo === "si" ? "sì" : "no", f.note]),
          [26, 12, 18, 16, 12, 12, 10, 28, 20, 8, 30]],
        ["Dosi prese", ["Data", "Farmaco", "Orario previsto", "Ora presa", "Nota"], ordina(copia(tab("bn_assunzioni")), ["-data", "orario"]).map((x) => [comeData(x.data), fa(x.farmaco_id).nome || "?", x.orario, x.ora_presa, x.nota]), [12, 26, 15, 11, 30]],
        ["Visite", ["Data", "Ora", "Tipo", "Titolo", "Medico / persona", "Luogo", "Stato", "Ripeti ogni (mesi)", "Esito", "Note"],
          ordina(copia(tab("bn_appuntamenti")), ["-data"]).map((v) => [comeData(v.data), v.ora, NOMI_CATEGORIE[v.categoria] || v.categoria, v.titolo, v.persona, v.luogo, NOMI_STATI_APP[v.stato] || v.stato, v.ripeti_mesi || "", v.esito, v.note]),
          [12, 8, 22, 30, 22, 24, 12, 17, 40, 40]],
        ["Prodotti", ["Nome", "Marca", "Uso", "Stato", "Aperto il", "Dura (mesi)", "Da sostituire il", "Voto", "Ricomprare", "Note"],
          ordina(copia(tab("bn_prodotti")), ["nome"]).map((p) => [p.nome, p.marca, p.uso, p.stato.replace(/_/g, " "), comeData(p.aperto_il), p.durata_mesi || "", comeData(p.scadenza), p.voto || "", p.ricomprare, p.note]),
          [28, 18, 10, 12, 12, 11, 15, 7, 11, 30]],
      ], `Benessere-${dataFile()}.xlsx`);
    }
    function gestisci(metodo, percorso, query, corpo) {
      if (percorso === "dati" && metodo === "GET") return R(tutto());
      if (percorso === "segna" && metodo === "POST") return R(segna(corpo));
      if (percorso === "diario" && metodo === "POST") return R(salvaDiario(corpo));
      if (percorso === "prendi" && metodo === "POST") return R(prendi(corpo));
      if (percorso === "appuntamento-fatto" && metodo === "POST") return R(appuntamentoFatto(corpo));
      if (percorso === "impostazioni" && metodo === "POST") {
        const mov = Math.trunc(numero(corpo.obiettivo_movimento) || 150), giorni = Math.trunc(numero(corpo.giorni_avviso) || 7);
        scriviMeta("benessere_obiettivo_movimento", Math.min(Math.max(mov, 10), 2000));
        scriviMeta("benessere_giorni_avviso", Math.min(Math.max(giorni, 1), 60));
        return R({ ok: true });
      }
      if (percorso === "ordina-abitudini" && metodo === "POST") {
        (corpo.ordine || []).forEach((id, pos) => { const a = trova("bn_abitudini", id); if (a) a.ordine = (pos + 1) * 10; });
        return R({ ok: true });
      }
      if (percorso === "medico" && metodo === "GET") {
        const da = query.get("da") || "", a = query.get("a") || "";
        if (query.get("formato") === "excel") return esportaMedico(da, a);
        return R(datiMedico(da, a));
      }
      if (percorso === "esporta-excel" && metodo === "GET") return esportaTutto();
      if (percorso === "esporta-backup" && metodo === "GET") return fileJson({ formato: "benessere-1", creato: adesso(), ...tutto() }, `Benessere-backup-${dataFile()}.json`);
      if (percorso === "ripristina" && metodo === "POST") {
        const dati = corpo.dati || {};
        if (dati.formato !== "benessere-1" || !Array.isArray(dati.abitudini)) throw new Errore("Questo file non è un backup della sezione Benessere.");
        for (const t of Object.values(CHIAVI_DATI)) DB.t[t] = [];
        return R({ ok: true, conteggi: caricaTutto(dati) });
      }
      const tabella = NOMI[percorso];
      if (!tabella) return R({ errore: "Richiesta sconosciuta." }, 404);
      if (metodo === "POST") return R({ ok: true, id: inserisci(tabella, corpo) }, 201);
      const ident = parseInt(query.get("id") || "0", 10);
      if (!ident) return R({ errore: "Numero dell'elemento mancante." }, 400);
      if (metodo === "PATCH") { modifica(tabella, ident, corpo); return R({ ok: true }); }
      if (metodo === "DELETE") { elimina(tabella, ident); return R({ ok: true }); }
      return R({ errore: "Richiesta sconosciuta." }, 404);
    }
    const semina = (d) => { caricaTutto(d, true); for (const [k, v] of Object.entries(d.impostazioni || {})) scriviMeta(`benessere_${k}`, v); };
    return { gestisci, riepilogo, agenda, semina };
  })();

  // ==================================================================== Formazione (come sezioni/formazione/modulo.py)
  const Formazione = (() => {
    const LIVELLI = ["Da valutare", "Principiante", "Base", "Intermedio", "Avanzato", "Esperta"];
    const NOMI_STATI_COMP = { attiva: "In crescita", in_pausa: "In pausa", raggiunta: "Obiettivo raggiunto" };
    const NOMI_TIPI_CORSO = { corso_online: "Corso online", corso_aula: "Corso in aula", certificazione: "Certificazione", webinar: "Webinar o seminario",
      percorso: "Percorso di più corsi", master: "Master", altro: "Altro" };
    const NOMI_STATI_CORSO = { idea: "Da valutare", iscritta: "Iscritta, da iniziare", in_corso: "In corso", in_pausa: "In pausa", completato: "Completato", abbandonato: "Lasciato" };
    const NOMI_STATI_MAT = { da_vedere: "Da leggere o vedere", in_corso: "In corso", finito: "Finito" };
    const SI_NO = ["si", "no"];
    const T = "testo", N = "numero", I = "intero";
    const TABELLE = {
      fm_competenze: { nome: [T, "", null], nome_en: [T, "", null], area: [T, "", null], livello: [I, 0, null], obiettivo: [I, 3, null], perche: [T, "", null],
        stato: [T, "attiva", Object.keys(NOMI_STATI_COMP)], nel_cv: [T, "no", SI_NO], ordine: [I, 50, null], note: [T, "", null] },
      fm_corsi: { titolo: [T, "", null], titolo_en: [T, "", null], ente: [T, "", null], tipo: [T, "corso_online", Object.keys(NOMI_TIPI_CORSO)], competenza_id: [I, 0, null],
        link: [T, "", null], stato: [T, "idea", Object.keys(NOMI_STATI_CORSO)], costo: [N, null, null], inizio: [T, "", null], fine_prevista: [T, "", null],
        completato_il: [T, "", null], esame_il: [T, "", null], esame_ora: [T, "", null], lezioni_totali: [I, 0, null], lezioni_fatte: [I, 0, null], ore_previste: [N, null, null],
        attestato: [T, "", null], codice_attestato: [T, "", null], link_attestato: [T, "", null], attestato_scade: [T, "", null], nel_cv: [T, "si", SI_NO], ordine: [I, 0, null], note: [T, "", null] },
      fm_sessioni: { data: [T, "", null], minuti: [N, 30, null], competenza_id: [I, 0, null], corso_id: [I, 0, null], cosa: [T, "", null], lezioni: [I, 0, null], note: [T, "", null] },
      fm_materiali: { titolo: [T, "", null], tipo: [T, "libro", ["libro", "video", "articolo", "sito", "documentazione", "podcast", "esercizi", "appunti", "altro"]], autore: [T, "", null],
        link: [T, "", null], competenza_id: [I, 0, null], corso_id: [I, 0, null], stato: [T, "da_vedere", Object.keys(NOMI_STATI_MAT)], voto: [I, 0, null], appunti: [T, "", null] },
    };
    const NOMI = { competenza: "fm_competenze", corso: "fm_corsi", sessione: "fm_sessioni", materiale: "fm_materiali" };
    const CHIAVI_DATI = { competenze: "fm_competenze", corsi: "fm_corsi", sessioni: "fm_sessioni", materiali: "fm_materiali" };
    const CAMPI_DATA = ["data", "inizio", "fine_prevista", "completato_il", "esame_il", "attestato_scade"];
    const IMPOSTAZIONI_BASE = { obiettivo_minuti: 180, giorni_avviso: 7 };

    function numero(v) {
      if (v === null || v === undefined || v === "") return null;
      if (typeof v === "number" || typeof v === "boolean") return Number(v);
      let t = String(v).trim().replace(/ /g, "").replace(/€/g, "");
      if (t.includes(",")) t = t.replace(/\./g, "").replace(",", ".");
      const n = Number(t);
      return t !== "" && Number.isFinite(n) ? n : null;
    }
    function oreMinuti(minuti) {
      const m = Math.round(minuti || 0), ore = Math.floor(m / 60), resto = m % 60;
      if (!ore) return `${resto} min`;
      return resto ? `${ore} h ${pad(resto)}` : `${ore} h`;
    }
    function impostazioni() {
      const v = { ...IMPOSTAZIONI_BASE };
      for (const k of Object.keys(v)) { const m = meta(`formazione_${k}`); if (m !== null && Number.isFinite(Number(m))) v[k] = Math.trunc(Number(m)); }
      return v;
    }
    function pulisci(tabella, dati) {
      const v = {};
      for (const [campo, [tipo, pred, ammessi]] of Object.entries(TABELLE[tabella])) {
        const grezzo = campo in dati ? dati[campo] : pred;
        if (tipo === N) { const n = numero(grezzo); v[campo] = n !== null ? r2(n) : pred; }
        else if (tipo === I) { const n = numero(grezzo); v[campo] = n !== null ? Math.trunc(n) : (pred || 0); }
        else { let t = testo(grezzo); if (ammessi && !ammessi.includes(t)) t = pred; v[campo] = t; }
      }
      for (const c of CAMPI_DATA) if (c in v && v[c] && !comeData(v[c])) throw new Errore(`La data "${v[c]}" non è valida.`);
      if (tabella === "fm_competenze") { v.livello = Math.min(Math.max(v.livello, 0), 5); v.obiettivo = Math.min(Math.max(v.obiettivo, 1), 5); }
      if (tabella === "fm_corsi") {
        v.lezioni_totali = Math.max(v.lezioni_totali, 0); v.lezioni_fatte = Math.max(v.lezioni_fatte, 0);
        if (v.lezioni_totali) v.lezioni_fatte = Math.min(v.lezioni_fatte, v.lezioni_totali);
      }
      if (tabella === "fm_sessioni") {
        if (v.minuti === null || v.minuti <= 0) throw new Errore("Scrivi quanti minuti hai studiato.");
        if (v.minuti > 1440) throw new Errore("In un giorno ci sono al massimo 1440 minuti.");
        v.lezioni = Math.max(v.lezioni, 0);
      }
      if (tabella === "fm_materiali") v.voto = Math.min(Math.max(v.voto, 0), 5);
      return v;
    }
    const corsoDi = (id) => (id ? trova("fm_corsi", id) : null);
    function spostaLezioni(corsoId, quante, giorno) {
      const c = corsoDi(corsoId);
      if (!c || !quante) return;
      let fatte = Math.max(c.lezioni_fatte + quante, 0);
      if (c.lezioni_totali) fatte = Math.min(fatte, c.lezioni_totali);
      c.lezioni_fatte = fatte;
      if (quante > 0 && ["idea", "iscritta", "in_pausa"].includes(c.stato)) c.stato = "in_corso";
      if (quante > 0 && !c.inizio) c.inizio = giorno;
      c.aggiornato = adesso();
    }
    function inserisci(tabella, dati, collegamenti = true, id) {
      const v = pulisci(tabella, dati);
      if (tabella === "fm_competenze" && !v.nome) throw new Errore("Scrivi il nome della competenza.");
      if (["fm_corsi", "fm_materiali"].includes(tabella) && !v.titolo) throw new Errore("Scrivi il titolo.");
      if (tabella === "fm_sessioni") {
        if (!v.data) throw new Errore("Scegli il giorno.");
        const c = corsoDi(v.corso_id);
        if (c && !v.competenza_id) v.competenza_id = c.competenza_id;
      }
      if (tabella === "fm_corsi" && !v.ordine) v.ordine = tab("fm_corsi").reduce((m, c) => Math.max(m, c.ordine || 0), 0) + 10;
      v.creato = String(dati.creato || adesso());
      v.aggiornato = adesso();
      const nuovo = aggiungi(tabella, v, id);
      if (tabella === "fm_sessioni" && collegamenti) spostaLezioni(v.corso_id, v.lezioni, v.data);
      return nuovo;
    }
    function modifica(tabella, ident, dati) {
      const attuale = trova(tabella, ident);
      if (!attuale) throw new Errore("Elemento non trovato: forse è stato eliminato.");
      const prima = { ...attuale };
      const v = pulisci(tabella, { ...attuale, ...dati });
      if (tabella === "fm_sessioni") { const c = corsoDi(v.corso_id); if (c && !v.competenza_id) v.competenza_id = c.competenza_id; }
      Object.assign(attuale, v, { aggiornato: adesso() });
      if (tabella === "fm_sessioni") {
        if (prima.corso_id === v.corso_id) spostaLezioni(v.corso_id, v.lezioni - prima.lezioni, v.data);
        else { spostaLezioni(prima.corso_id, -prima.lezioni, prima.data); spostaLezioni(v.corso_id, v.lezioni, v.data); }
      }
    }
    function elimina(tabella, ident) {
      if (tabella === "fm_sessioni") { const r = trova("fm_sessioni", ident); if (r) spostaLezioni(r.corso_id, -r.lezioni, r.data); }
      if (tabella === "fm_competenze") for (const f of ["fm_corsi", "fm_sessioni", "fm_materiali"]) tab(f).forEach((r) => { if (r.competenza_id === ident) r.competenza_id = 0; });
      if (tabella === "fm_corsi") for (const f of ["fm_sessioni", "fm_materiali"]) tab(f).forEach((r) => { if (r.corso_id === ident) r.corso_id = 0; });
      togli(tabella, (r) => r.id === ident);
    }
    const tutto = () => ({
      competenze: ordina(copia(tab("fm_competenze")), ["ordine", "nome"]),
      corsi: ordina(copia(tab("fm_corsi")), ["ordine", "id"]),
      sessioni: ordina(copia(tab("fm_sessioni")), ["-data", "-id"]),
      materiali: ordina(copia(tab("fm_materiali")), ["-id"]),
      impostazioni: impostazioni(),
    });
    function caricaTutto(dati, conId = false) {
      const conteggi = { competenze: 0, corsi: 0, sessioni: 0, materiali: 0 }, mComp = new Map(), mCorsi = new Map();
      for (const r of dati.competenze || []) if (r && typeof r === "object") { mComp.set(String(r.id), inserisci("fm_competenze", r, true, conId ? r.id : undefined)); conteggi.competenze++; }
      for (const r of dati.corsi || []) if (r && typeof r === "object") { mCorsi.set(String(r.id), inserisci("fm_corsi", { ...r, competenza_id: mComp.get(String(r.competenza_id)) || 0 }, true, conId ? r.id : undefined)); conteggi.corsi++; }
      for (const k of ["sessioni", "materiali"]) for (const r of dati[k] || []) {
        if (!r || typeof r !== "object") continue;
        inserisci(CHIAVI_DATI[k], { ...r, competenza_id: mComp.get(String(r.competenza_id)) || 0, corso_id: mCorsi.get(String(r.corso_id)) || 0 }, false, conId ? r.id : undefined);
        conteggi[k]++;
      }
      return conteggi;
    }
    function completa(corpo) {
      const ident = Math.trunc(numero(corpo.id) || 0);
      const c = corsoDi(ident);
      if (!c) throw new Errore("Corso non trovato: forse è stato eliminato.");
      const prima = { ...c };
      const cambi = { stato: "completato", completato_il: corpo.completato_il || oggi(), lezioni_fatte: prima.lezioni_totali || prima.lezioni_fatte };
      for (const k of ["attestato", "codice_attestato", "link_attestato", "attestato_scade", "nel_cv"]) if (k in corpo) cambi[k] = corpo[k];
      modifica("fm_corsi", ident, cambi);
      const nuovo = Math.trunc(numero(corpo.nuovo_livello) || 0);
      if (nuovo && prima.competenza_id) {
        const comp = trova("fm_competenze", prima.competenza_id);
        if (comp) { const cc = { livello: nuovo }; if (nuovo >= comp.obiettivo) cc.stato = "raggiunta"; modifica("fm_competenze", comp.id, cc); }
      }
      return { ok: true };
    }
    function riepilogo() {
      const g = oggiD(), gi = iso(g), lunedi = iso(piuGiorni(g, -((g.getDay() + 6) % 7)));
      const imp = impostazioni();
      const minuti = tab("fm_sessioni").filter((s) => s.data >= lunedi && s.data <= gi).reduce((t, s) => t + (s.minuti || 0), 0);
      const date = [...tab("fm_corsi").filter((c) => c.esame_il >= gi && c.esame_il && !["completato", "abbandonato"].includes(c.stato)).map((c) => c.esame_il),
        ...tab("fm_corsi").filter((c) => c.fine_prevista >= gi && c.fine_prevista && ["iscritta", "in_corso", "in_pausa"].includes(c.stato)).map((c) => c.fine_prevista)].sort();
      return [
        { etichetta: "studio di questa settimana", valore: `${oreMinuti(minuti)} di ${oreMinuti(imp.obiettivo_minuti)}` },
        { etichetta: "corsi in corso", valore: tab("fm_corsi").filter((c) => c.stato === "in_corso").length },
        { etichetta: "prossimo esame o fine corso", valore: date.length ? dataIt(date[0]).slice(0, 5) : "nessuno" },
        { etichetta: "competenze in crescita", valore: tab("fm_competenze").filter((c) => c.stato === "attiva").length },
      ];
    }
    function agenda(inizio, fine) {
      const eventi = [];
      const ev = (giorno, ora, nomeTipo, c, sotto, fatto = false) => eventi.push({ data: giorno, ora, tipo: "studio", nome_tipo: nomeTipo, titolo: c.titolo, sotto: sotto || "", luogo: c.ente, fatto, link: `/s/formazione/#corso-${c.id}` });
      const dentro = (x) => x && inizio <= x && x <= fine;
      for (const c of tab("fm_corsi")) {
        if (c.stato === "abbandonato") continue;
        const av = c.lezioni_totali ? `${Math.round((100 * c.lezioni_fatte) / c.lezioni_totali)}% fatto` : "";
        if (dentro(c.esame_il)) ev(c.esame_il, c.esame_ora, "Esame", c, NOMI_TIPI_CORSO[c.tipo] || "", c.stato === "completato");
        if (dentro(c.fine_prevista) && ["iscritta", "in_corso", "in_pausa"].includes(c.stato)) ev(c.fine_prevista, "", "Fine corso prevista", c, av);
        if (dentro(c.inizio) && c.stato === "iscritta") ev(c.inizio, "", "Inizio corso", c, NOMI_TIPI_CORSO[c.tipo] || "");
        if (dentro(c.attestato_scade) && c.stato === "completato") ev(c.attestato_scade, "", "Attestato da rinnovare", c, c.codice_attestato && `Codice ${c.codice_attestato}`);
      }
      return eventi;
    }
    function esportaTutto() {
      const comp = (id) => trova("fm_competenze", id) || {}, corso = (id) => trova("fm_corsi", id) || {};
      const minutiPer = new Map();
      for (const s of tab("fm_sessioni")) minutiPer.set(s.competenza_id, (minutiPer.get(s.competenza_id) || 0) + (s.minuti || 0));
      const corsi = ordina(copia(tab("fm_corsi")), ["ordine", "id"]);
      const aperti = corsi.filter((c) => !["completato", "abbandonato"].includes(c.stato)).map((c) => c.id);
      return fileExcel([
        ["Competenze", ["Competenza", "In inglese", "Area", "Livello attuale", "Obiettivo", "Stato", "Ore di studio", "Nel CV", "Perché", "Note"],
          ordina(copia(tab("fm_competenze")), ["ordine", "nome"]).map((c) => [c.nome, c.nome_en, c.area, LIVELLI[c.livello], LIVELLI[c.obiettivo], NOMI_STATI_COMP[c.stato] || c.stato,
            r2((minutiPer.get(c.id) || 0) / 60), c.nel_cv === "si" ? "sì" : "no", c.perche, c.note]), [30, 26, 22, 15, 13, 18, 12, 8, 36, 36]],
        ["Corsi e certificazioni", ["N. nel percorso", "Titolo", "In inglese", "Ente", "Tipo", "Competenza", "Stato", "Inizio", "Fine prevista", "Completato il", "Esame il",
          "Lezioni", "Costo", "Attestato (file)", "Codice attestato", "Attestato scade il", "Nel CV", "Link", "Note"],
          corsi.map((c) => [aperti.includes(c.id) ? aperti.indexOf(c.id) + 1 : "", c.titolo, c.titolo_en, c.ente, NOMI_TIPI_CORSO[c.tipo] || c.tipo, comp(c.competenza_id).nome || "",
            NOMI_STATI_CORSO[c.stato] || c.stato, comeData(c.inizio), comeData(c.fine_prevista), comeData(c.completato_il), comeData(c.esame_il),
            c.lezioni_totali ? `${c.lezioni_fatte} di ${c.lezioni_totali}` : "", c.costo !== null ? F(c.costo) : "", c.attestato, c.codice_attestato, comeData(c.attestato_scade),
            c.nel_cv === "si" ? "sì" : "no", c.link, c.note]), [9, 34, 30, 20, 18, 24, 18, 12, 13, 13, 12, 10, 10, 24, 18, 15, 8, 30, 36]],
        ["Ore di studio", ["Data", "Minuti", "Competenza", "Corso", "Cosa ho fatto", "Lezioni completate", "Note"],
          ordina(copia(tab("fm_sessioni")), ["-data", "-id"]).map((s) => [comeData(s.data), s.minuti, comp(s.competenza_id).nome || "", corso(s.corso_id).titolo || "", s.cosa, s.lezioni || "", s.note]),
          [12, 9, 26, 30, 40, 10, 30]],
        ["Materiali e appunti", ["Titolo", "Tipo", "Autore", "Competenza", "Corso", "Stato", "Voto", "Link", "Appunti"],
          ordina(copia(tab("fm_materiali")), ["titolo"]).map((m) => [m.titolo, m.tipo, m.autore, comp(m.competenza_id).nome || "", corso(m.corso_id).titolo || "", NOMI_STATI_MAT[m.stato] || m.stato, m.voto || "", m.link, m.appunti]),
          [34, 14, 20, 24, 28, 18, 7, 30, 60]],
      ], `Formazione-${dataFile()}.xlsx`);
    }
    function gestisci(metodo, percorso, query, corpo) {
      if (percorso === "dati" && metodo === "GET") return R(tutto());
      if (percorso === "completa" && metodo === "POST") return R(completa(corpo));
      if (percorso === "impostazioni" && metodo === "POST") {
        const minuti = Math.trunc(numero(corpo.obiettivo_minuti) || 180), giorni = Math.trunc(numero(corpo.giorni_avviso) || 7);
        scriviMeta("formazione_obiettivo_minuti", Math.min(Math.max(minuti, 10), 5000));
        scriviMeta("formazione_giorni_avviso", Math.min(Math.max(giorni, 1), 90));
        return R({ ok: true });
      }
      if ((percorso === "ordina-competenze" || percorso === "ordina-corsi") && metodo === "POST") {
        const t = percorso === "ordina-corsi" ? "fm_corsi" : "fm_competenze";
        (corpo.ordine || []).forEach((id, pos) => { const r = trova(t, id); if (r) r.ordine = (pos + 1) * 10; });
        return R({ ok: true });
      }
      if (percorso === "esporta-excel" && metodo === "GET") return esportaTutto();
      if (percorso === "esporta-backup" && metodo === "GET") return fileJson({ formato: "formazione-1", creato: adesso(), ...tutto() }, `Formazione-backup-${dataFile()}.json`);
      if (percorso === "ripristina" && metodo === "POST") {
        const dati = corpo.dati || {};
        if (dati.formato !== "formazione-1" || !Array.isArray(dati.competenze)) throw new Errore("Questo file non è un file di trasferimento della sezione Formazione.");
        for (const t of Object.values(CHIAVI_DATI)) DB.t[t] = [];
        return R({ ok: true, conteggi: caricaTutto(dati) });
      }
      const tabella = NOMI[percorso];
      if (!tabella) return R({ errore: "Richiesta sconosciuta." }, 404);
      if (metodo === "POST") return R({ ok: true, id: inserisci(tabella, corpo) }, 201);
      const ident = parseInt(query.get("id") || "0", 10);
      if (!ident) return R({ errore: "Numero dell'elemento mancante." }, 400);
      if (metodo === "PATCH") { modifica(tabella, ident, corpo); return R({ ok: true }); }
      if (metodo === "DELETE") { elimina(tabella, ident); return R({ ok: true }); }
      return R({ errore: "Richiesta sconosciuta." }, 404);
    }
    const semina = (d) => { caricaTutto(d, true); for (const [k, v] of Object.entries(d.impostazioni || {})) scriviMeta(`formazione_${k}`, v); };
    return { gestisci, riepilogo, agenda, semina };
  })();

  // ==================================================================== parte comune (come server.py)
  const SEZIONI = [
    { id: "bussola", nome: "BussolaLavoro", descrizione: "Candidature, colloqui, scadenze e documenti della ricerca di lavoro.", colore: "salvia", icona: "✦", stato: "attiva", ordine: 1, modulo: Bussola },
    { id: "spese", nome: "Gestione spese", descrizione: "Spese della società, della ditta individuale e personali, con scadenze, rate e riepilogo per il commercialista.", colore: "terracotta", icona: "€", stato: "attiva", ordine: 2, modulo: Spese },
    { id: "benessere", nome: "Benessere personale", descrizione: "Abitudini, umore, movimento, pasti, farmaci, visite e cura dell'aspetto, con obiettivi gentili.", colore: "lavanda", icona: "❀", stato: "attiva", ordine: 3, modulo: Benessere },
    { id: "formazione", nome: "Formazione", descrizione: "Competenze da far crescere, corsi e certificazioni, ore di studio, materiali e appunti, con l'elenco pronto per il CV.", colore: "cielo", icona: "✎︎", stato: "attiva", ordine: 4, modulo: Formazione },
  ];
  const linkPagina = (link) => String(link || "").replace(/^\/s\/([a-z]+)\/#/, `${RADICE}s/$1/index.html#`);
  // Nel programma vero sono i file nella cartella "documenti" del computer: qui solo nomi di esempio.
  const DOCUMENTI = [
    ["CV_Elena_Rossi_IT.pdf", "cv", 182], ["CV_Elena_Rossi_EN.pdf", "cv", 176], ["Lettera_presentazione_modello.docx", "cv", 24],
    ["Fattura_TeleFibra_ottobre.pdf", "spese", 96], ["Ricevuta_Studio_Verdi.pdf", "spese", 61],
    ["Attestato_SQL_per_analisti.pdf", "formazione", 310],
  ].map(([nome, cartella, kb], i) => ({ nome, cartella, url: `/documenti/${cartella}/${nome}`, dimensione: kb * 1024, modificato: `${iso(piuGiorni(oggiD(), -(12 + i * 9)))}T10:${pad(10 + i)}` }));

  function sistema(metodo, sotto, query) {
    if (sotto === "sezioni") {
      return R({ sezioni: SEZIONI.map(({ modulo, ...info }) => ({ ...info, riepilogo: modulo.riepilogo() })), cellulare: false, indirizzi: [] });
    }
    if (sotto === "backup" && metodo === "POST") {
      return R({ ok: true, file: "(nessun file nella versione dimostrativa)", cartella: "backup",
        messaggio: "Nel programma vero qui si crea una copia di sicurezza di tutti i dati nella cartella backup del computer. In questa versione dimostrativa non si crea nessun file: le tue prove restano solo in questo browser." });
    }
    if (sotto === "agenda") {
      const da = query.get("da") || "", a = query.get("a") || "";
      const eventi = [];
      for (const s of SEZIONI) {
        try {
          for (const e of s.modulo.agenda(da, a)) eventi.push({ ...e, link: linkPagina(e.link), sezione: s.id, contesto: s.nome, colore_contesto: s.colore });
        } catch (errore) { console.warn(`[Demo] Agenda di ${s.id} non letta`, errore); }
      }
      return R({ eventi: ordina(eventi, ["data", (e) => e.ora || ""]) });
    }
    if (sotto === "documenti") return R({ documenti: DOCUMENTI });
    return R({ errore: "Richiesta sconosciuta." }, 404);
  }

  async function rispondi(url, metodo, corpoGrezzo) {
    const resto = url.slice(url.indexOf("/api/") + 5);
    const [percorsoCompleto, q = ""] = resto.split("?");
    const query = new URLSearchParams(q);
    const [nome, ...pezzi] = percorsoCompleto.split("/");
    const sotto = pezzi.join("/");
    let corpo = {};
    if (["POST", "PATCH"].includes(metodo) && corpoGrezzo) {
      try { corpo = JSON.parse(typeof corpoGrezzo === "string" ? corpoGrezzo : await new Response(corpoGrezzo).text()); } catch { return R({ errore: "Richiesta non valida." }, 400); }
      if (!corpo || typeof corpo !== "object" || Array.isArray(corpo)) return R({ errore: "Richiesta non valida." }, 400);
    }
    try {
      if (nome === "sistema") return sistema(metodo, sotto, query);
      const sezione = SEZIONI.find((s) => s.id === nome);
      if (!sezione) return R({ errore: "Sezione non disponibile." }, 404);
      const prima = JSON.stringify(DB);
      try {
        const risposta = sezione.modulo.gestisci(metodo, sotto, query, corpo);
        if (metodo !== "GET" || sotto === "commercialista") salvaDB();
        return risposta;
      } catch (errore) {
        DB = JSON.parse(prima); // come nel programma vero: se qualcosa va storto non resta niente a metà
        throw errore;
      }
    } catch (errore) {
      if (errore instanceof Errore) return R({ errore: errore.message }, errore.stato);
      console.error("[Demo]", errore);
      return R({ errore: `Operazione non riuscita: ${errore.message || errore}` }, 500);
    }
  }

  // ------------------------------------------------------------------ le pagine "parlano" con questo motore invece che con il server
  const fetchVero = window.fetch ? window.fetch.bind(window) : null;
  window.fetch = async function (risorsa, opzioni = {}) {
    const url = typeof risorsa === "string" ? risorsa : (risorsa && risorsa.url) || String(risorsa);
    if (!url.includes("/api/")) return fetchVero(risorsa, opzioni);
    const r = await rispondi(url, String(opzioni.method || "GET").toUpperCase(), opzioni.body);
    if (r.file) return new Response(r.file, { status: 200, headers: { "Content-Type": r.tipo } });
    return new Response(JSON.stringify(r.dati), { status: r.stato || 200, headers: { "Content-Type": "application/json; charset=utf-8" } });
  };

  function scarica(blob, nome) {
    const indirizzo = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = indirizzo; a.download = nome; a.style.display = "none";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(indirizzo), 4000);
  }
  document.addEventListener("click", async (evento) => {
    const a = evento.target.closest && evento.target.closest("a[href]");
    if (!a) return;
    const href = a.getAttribute("href") || "";
    if (href.includes("/api/")) {
      evento.preventDefault();
      evento.stopPropagation();
      const r = await rispondi(href, "GET");
      if (r.file) { scarica(r.file, r.nome); messaggio(`Ho preparato il file «${r.nome}»: lo trovi fra i download del browser. Contiene solo dati inventati.`); }
      else messaggio(r.dati && r.dati.errore ? `Non riesco a preparare il file: ${r.dati.errore}` : "Non riesco a preparare il file.");
    } else if (href.startsWith("/documenti/")) {
      evento.preventDefault();
      evento.stopPropagation();
      messaggio(`Nel programma vero qui si apre il file «${decodeURIComponent(href.split("/").pop())}», salvato nella cartella documenti del computer (CV, fatture, ricevute, attestati). Nella versione dimostrativa i documenti sono solo nomi di esempio.`);
    }
  }, true);

  // ------------------------------------------------------------------ striscia "versione dimostrativa", messaggi e ripristino
  const STILE = `
  .demo-striscia { position: relative; z-index: 60; display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 8px 16px; padding: 10px 16px;
    background: #f5edd6; color: #4f3a0c; border-bottom: 2px solid #c9a24a; font: 15px/1.4 "Segoe UI", system-ui, -apple-system, Roboto, sans-serif; text-align: center; }
  .demo-striscia b { font-weight: 700; }
  .demo-striscia a, .demo-striscia button { font: inherit; font-size: 14px; font-weight: 600; color: #4f3a0c; background: #fffdf8; border: 1px solid #c9a24a; border-radius: 999px;
    padding: 5px 14px; cursor: pointer; text-decoration: none; white-space: nowrap; }
  .demo-striscia a:hover, .demo-striscia button:hover { background: #fff; }
  .demo-striscia a:focus-visible, .demo-striscia button:focus-visible { outline: 3px solid #8f6a1f; outline-offset: 2px; }
  .demo-messaggio { position: fixed; z-index: 9999; left: 50%; bottom: 18px; transform: translateX(-50%); width: min(560px, calc(100% - 32px)); display: flex; gap: 12px; align-items: flex-start;
    padding: 14px 16px; background: #24363b; color: #fff; border-radius: 14px; box-shadow: 0 12px 40px rgba(0,0,0,.25); font: 15px/1.45 "Segoe UI", system-ui, -apple-system, Roboto, sans-serif; }
  .demo-messaggio p { margin: 0; flex: 1; }
  .demo-messaggio button { flex: none; font: inherit; font-size: 14px; color: #24363b; background: #fff; border: 0; border-radius: 999px; padding: 4px 12px; cursor: pointer; }
  @media (max-width: 560px) { .demo-striscia { gap: 6px 8px; padding: 8px 12px; font-size: 14px; } .demo-striscia span { flex-basis: 100%; }
    .demo-striscia a, .demo-striscia button { font-size: 13px; padding: 4px 10px; } }
  @media print { .demo-striscia, .demo-messaggio { display: none !important; } }`;
  let timerMessaggio = null;
  function messaggio(t) {
    let box = document.querySelector(".demo-messaggio");
    if (!box) {
      box = document.createElement("div");
      box.className = "demo-messaggio";
      box.setAttribute("role", "status");
      box.innerHTML = "<p></p><button type=\"button\">Chiudi</button>";
      box.querySelector("button").addEventListener("click", () => box.remove());
      document.body.appendChild(box);
    }
    box.querySelector("p").textContent = t;
    clearTimeout(timerMessaggio);
    timerMessaggio = setTimeout(() => box.remove(), 12000);
  }
  function ripristina() {
    if (!window.confirm("Rimetto tutti i dati di esempio come all'inizio? Le prove che hai fatto in questo browser verranno cancellate.")) return;
    try { localStorage.removeItem(CHIAVE); CHIAVI_EXTRA.forEach((k) => localStorage.removeItem(k)); } catch { /* niente da cancellare */ }
    DB = null;
    location.reload();
  }
  function mettiStriscia() {
    const stile = document.createElement("style");
    stile.textContent = STILE;
    document.head.appendChild(stile);
    const striscia = document.createElement("div");
    striscia.className = "demo-striscia";
    striscia.setAttribute("role", "note");
    striscia.innerHTML = `<span><b>Versione dimostrativa:</b> tutti i dati sono inventati.</span>
      <a href="${RADICE}../../index.html">← Torna alla vetrina</a>
      <button type="button">Ripristina i dati di esempio</button>`;
    striscia.querySelector("button").addEventListener("click", ripristina);
    document.body.insertBefore(striscia, document.body.firstChild);
  }
  // Due fatture elettroniche inventate per provare "Importa fatture XML" senza avere file propri:
  // la prima è nuova, la seconda è già registrata (il programma la riconosce e non la importa due volte).
  function fatturaXml({ fornitore, piva, numero, data, righe, scadenza, modalita }) {
    const imponibile = righe.reduce((t, r) => t + r[1], 0), iva = Math.round(imponibile * 22) / 100, totale = Math.round((imponibile + iva) * 100) / 100;
    return `<?xml version="1.0" encoding="UTF-8"?>
<p:FatturaElettronica versione="FPR12" xmlns:p="http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2">
  <FatturaElettronicaHeader>
    <CedentePrestatore><DatiAnagrafici><IdFiscaleIVA><IdPaese>IT</IdPaese><IdCodice>${piva}</IdCodice></IdFiscaleIVA><Anagrafica><Denominazione>${fornitore}</Denominazione></Anagrafica></DatiAnagrafici></CedentePrestatore>
    <CessionarioCommittente><DatiAnagrafici><IdFiscaleIVA><IdPaese>IT</IdPaese><IdCodice>12345678901</IdCodice></IdFiscaleIVA><Anagrafica><Denominazione>Rossi Analisi SRLS</Denominazione></Anagrafica></DatiAnagrafici></CessionarioCommittente>
  </FatturaElettronicaHeader>
  <FatturaElettronicaBody>
    <DatiGenerali><DatiGeneraliDocumento><TipoDocumento>TD01</TipoDocumento><Divisa>EUR</Divisa><Data>${data}</Data><Numero>${numero}</Numero><ImportoTotaleDocumento>${totale.toFixed(2)}</ImportoTotaleDocumento></DatiGeneraliDocumento></DatiGenerali>
    <DatiBeniServizi>
${righe.map(([d, i], n) => `      <DettaglioLinee><NumeroLinea>${n + 1}</NumeroLinea><Descrizione>${d}</Descrizione><PrezzoTotale>${i.toFixed(2)}</PrezzoTotale><AliquotaIVA>22.00</AliquotaIVA></DettaglioLinee>`).join("\n")}
      <DatiRiepilogo><AliquotaIVA>22.00</AliquotaIVA><ImponibileImporto>${imponibile.toFixed(2)}</ImponibileImporto><Imposta>${iva.toFixed(2)}</Imposta></DatiRiepilogo>
    </DatiBeniServizi>
    <DatiPagamento><CondizioniPagamento>TP02</CondizioniPagamento><DettaglioPagamento><ModalitaPagamento>${modalita}</ModalitaPagamento><DataScadenzaPagamento>${scadenza}</DataScadenzaPagamento><ImportoPagamento>${totale.toFixed(2)}</ImportoPagamento></DettaglioPagamento></DatiPagamento>
  </FatturaElettronicaBody>
</p:FatturaElettronica>`;
  }
  function fattureEsempio() {
    const g = (n) => iso(piuGiorni(oggiD(), n));
    const telefibra = tab("gs_spese").find((s) => s.numero_documento === "TF-0157");
    return [
      new File([fatturaXml({ fornitore: "Ufficio Facile Forniture Srl (di fantasia)", piva: "55566677788", numero: "FV-2231", data: g(-5), scadenza: g(25), modalita: "MP05",
        righe: [["Toner per stampante laser", 58], ["Risme di carta A4 (5 pezzi)", 24]] })], "IT55566677788_esempio1.xml", { type: "text/xml" }),
      new File([fatturaXml({ fornitore: "TeleFibra Italia", piva: "22233344455", numero: "TF-0157", data: telefibra ? telefibra.data_documento : g(-13), scadenza: g(-3), modalita: "MP19",
        righe: [["Canone fibra ufficio", 28.61]] })], "IT22233344455_esempio2.xml", { type: "text/xml" }),
    ];
  }
  window.IoInOrdineDemo = { messaggio, ripristina, fattureEsempio };

  // ------------------------------------------------------------------ avvio
  function prepara() {
    DB = leggiDB();
    if (DB) return;
    DB = nuovoDB();
    const dati = typeof window.creaDatiDemo === "function" ? window.creaDatiDemo({ oggi: oggiD(), iso, piuGiorni, aggiungiMesi }) : {};
    try {
      Bussola.semina(dati.bussola || {});
      Spese.semina(dati.spese || {});
      Benessere.semina(dati.benessere || {});
      Formazione.semina(dati.formazione || {});
    } catch (errore) {
      console.error("[Demo] Dati di esempio non caricati del tutto:", errore);
    }
    salvaDB();
  }
  prepara();
  if (document.body) mettiStriscia(); else document.addEventListener("DOMContentLoaded", mettiStriscia);
  // se il visitatore usa due schede, quando torna su questa riprende i dati più recenti
  window.addEventListener("storage", (e) => { if (e.key === CHIAVE) DB = leggiDB() || DB; });
})();
