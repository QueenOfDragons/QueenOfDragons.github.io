/* =====================================================================
   "Io, in ordine" - VERSIONE DIMOSTRATIVA
   DATI INVENTATI. Persona, aziende, indirizzi, numeri e cifre sono di
   fantasia: ogni somiglianza con persone o aziende reali è casuale.

   Come si cambiano: modifica le righe qui sotto e salva il file.
   Le date sono scritte come "quanti giorni da oggi":
     g(0) = oggi, g(-3) = tre giorni fa, g(5) = fra cinque giorni.
     q(2, "10:30") = fra due giorni alle 10:30 (per gli appuntamenti).
   In questo modo l'agenda è sempre piena intorno al giorno in cui
   qualcuno apre la demo.
   Dopo una modifica, nella demo premi "Ripristina i dati di esempio".
   ===================================================================== */
window.creaDatiDemo = function ({ oggi, iso, piuGiorni }) {
  const g = (n) => iso(piuGiorni(oggi, n));
  const q = (n, ora) => `${g(n)}T${ora}`;
  const ieri = (n) => `${g(-n)}T09:00:00`; // per "creato" e "aggiornato"
  const giornoDelMese = (n) => String(piuGiorni(oggi, n).getDate());

  // ================================================================ BussolaLavoro
  const schede = [
    { id: 1, tipologia: "candidatura", titolo: "Data Analyst senior", azienda: "Stellanova Dati Srl", contatto: "Ufficio del personale", paese: "Italia", citta: "Milano",
      modalita: "ibrido", lingue: "italiano, inglese", compenso: "da definire", contratto: "tempo indeterminato", stato: "colloquio", conferma: "risposta",
      canale: "sito dell'azienda", link: "https://www.example.com/lavora-con-noi/data-analyst", data_invio: g(-21), ultimo_riscontro: "telefonata della selezionatrice",
      prossima_azione: "Colloquio tecnico in videochiamata", prossima_data: g(3), fatti: "Primo colloquio conoscitivo andato bene. Mi hanno chiesto esempi di cruscotti fatti per clienti.",
      valutazione: "Molto interessante: lavoro su dati di vendita, squadra giovane.", cv_usato: "CV_Elena_Rossi_IT.pdf", aggiornato: ieri(1) },
    { id: 2, tipologia: "candidatura", titolo: "Consulente analisi dati, settore assicurativo", azienda: "Grecale Assicurazioni", contatto: "Dott.ssa Marta Bini (nome di fantasia)",
      paese: "Italia", citta: "Firenze", modalita: "in_sede", lingue: "italiano", compenso: "38.000 € lordi annui (indicato nell'annuncio)", contratto: "tempo determinato 12 mesi",
      stato: "colloquio_svolto", conferma: "risposta", canale: "portale di annunci", link: "https://www.example.com/annunci/12345", data_invio: g(-30),
      prossima_azione: "Aggiornare com'è andato il colloquio", prossima_data: g(-2), fatti: "Colloquio fissato dopo la prima telefonata.", valutazione: "Sede comoda, contratto breve.",
      cv_usato: "CV_Elena_Rossi_IT.pdf", aggiornato: ieri(2) },
    { id: 3, tipologia: "estero", titolo: "Statistical programmer (remote)", azienda: "Brezza Clinical Research GmbH", contatto: "Talent team", paese: "Germania", citta: "Monaco di Baviera",
      modalita: "remoto", lingue: "inglese", compenso: "", contratto: "freelance", stato: "inviata", conferma: "confermato", canale: "sito dell'azienda",
      link: "https://www.example.com/careers/statistical-programmer", data_invio: g(-12), fatti: "Ricevuta la mail automatica di conferma.", cv_usato: "CV_Elena_Rossi_EN.pdf", aggiornato: ieri(12) },
    { id: 4, tipologia: "docenza", titolo: "Docente del corso \"Analisi dei dati per le imprese\"", azienda: "Accademia Mareblu", contatto: "Segreteria didattica", paese: "Italia", citta: "Pisa",
      modalita: "ibrido", compenso: "45 € l'ora", contratto: "incarico di docenza", stato: "contatto", conferma: "risposta", canale: "passaparola", data_invio: g(-9),
      prossima_azione: "Mandare il programma del corso", prossima_data: g(1), fatti: "Interessati a 40 ore di lezione in primavera.", valutazione: "Bello e vicino a casa.", aggiornato: ieri(3) },
    { id: 5, tipologia: "recruiter", titolo: "BI developer", azienda: "Quarzo Consulting (tramite recruiter)", contatto: "Luca, recruiter (nome di fantasia)", paese: "Italia", citta: "Bologna",
      modalita: "remoto", stato: "in_esame", conferma: "risposta", canale: "messaggio sul profilo professionale", data_invio: g(-15), prossima_azione: "Sollecitare il recruiter",
      prossima_data: g(8), fatti: "Il recruiter ha girato il CV al cliente.", aggiornato: ieri(6) },
    { id: 6, tipologia: "candidatura", titolo: "Analista reporting", azienda: "Cooperativa Arcobaleno Servizi", paese: "Italia", citta: "Livorno", modalita: "in_sede",
      stato: "inviata", conferma: "confermato", canale: "e-mail", data_invio: g(-42), fatti: "Candidatura mandata per e-mail all'indirizzo dell'annuncio.", cv_usato: "CV_Elena_Rossi_IT.pdf", aggiornato: ieri(42) },
    { id: 7, tipologia: "spontanea", titolo: "Candidatura spontanea: analisi statistica", azienda: "Fondazione Ricerca Valdarno", paese: "Italia", citta: "Empoli", modalita: "da_verificare",
      stato: "da_inviare", conferma: "da_verificare", prossima_azione: "Scrivere la lettera di presentazione", prossima_data: g(5), valutazione: "Fanno progetti di ricerca sociale: mi piacerebbe.", aggiornato: ieri(4) },
    { id: 8, tipologia: "candidatura", titolo: "Analista statistico", azienda: "Istituto Orizzonte", paese: "Italia", citta: "Roma", modalita: "remoto", stato: "da_valutare",
      conferma: "pista", canale: "segnalazione di un'amica", link: "https://www.example.com/annunci/orizzonte", note: "Capire se accettano lavoro completamente da remoto.", aggiornato: ieri(5) },
    { id: 9, tipologia: "piattaforma", titolo: "Consulente dati a progetto", azienda: "Portale Lavoro Esempio", paese: "Italia", modalita: "remoto", stato: "da_verificare",
      conferma: "da_verificare", canale: "piattaforma online", data_invio_nota: "metà del mese scorso", note: "Non trovo la mail di conferma: controllare nel profilo della piattaforma.", aggiornato: ieri(20) },
    { id: 10, tipologia: "candidatura", titolo: "Consulente part-time per reportistica", azienda: "Banca Popolare di Collina (di fantasia)", paese: "Italia", citta: "Lucca",
      modalita: "ibrido", compenso: "24 ore settimanali", stato: "offerta", conferma: "risposta", canale: "sito dell'azienda", data_invio: g(-50),
      prossima_azione: "Rispondere all'offerta", prossima_data: g(6), fatti: "Arrivata la proposta scritta. Chiedere se si può lavorare due giorni da casa.", aggiornato: ieri(1) },
    { id: 11, tipologia: "candidatura", titolo: "Data scientist", azienda: "Datavela Srl", paese: "Italia", citta: "Torino", modalita: "ibrido", stato: "respinta", conferma: "risposta",
      data_invio: g(-70), esito: "Cercano un profilo più giovane di esperienza.", data_chiusura: g(-24), fatti: "Colloquio fatto, poi risposta negativa per e-mail.", aggiornato: ieri(24) },
    { id: 12, tipologia: "candidatura", titolo: "Analista dati marketing", azienda: "Lumen Analytics", paese: "Italia", citta: "Milano", modalita: "remoto", stato: "nessuna_risposta",
      conferma: "confermato", data_invio: g(-95), esito: "Nessuna notizia dopo due solleciti.", data_chiusura: g(-35), aggiornato: ieri(35) },
    { id: 13, tipologia: "cpi", titolo: "Incontro di orientamento", azienda: "Centro per l'impiego (sede di esempio)", paese: "Italia", citta: "Pisa", modalita: "in_sede",
      stato: "chiusa", conferma: "confermato", data_invio: g(-80), esito: "Fatto il colloquio di orientamento, iscrizione aggiornata.", data_chiusura: g(-78), aggiornato: ieri(78) },
    { id: 14, tipologia: "agenzia", titolo: "Impiegata amministrativa con Excel", azienda: "Agenzia Lavoro Facile", paese: "Italia", citta: "Pisa", modalita: "in_sede", stato: "rinunciata",
      conferma: "risposta", data_invio: g(-60), esito: "Ruolo troppo lontano dalle mie competenze.", data_chiusura: g(-55), aggiornato: ieri(55) },
  ];
  const azioni = [
    { id: 1, scheda_id: 1, titolo: "Colloquio tecnico", tipo: "colloquio", quando: q(3, "10:30"), luogo: "Videochiamata (link nella mail)", note: "Preparare due esempi di cruscotti e il caso delle vendite stagionali." },
    { id: 2, scheda_id: 2, titolo: "Colloquio con la responsabile", tipo: "colloquio", quando: q(-2, "15:00"), luogo: "Firenze, sede dell'azienda", note: "Portare una copia del CV." },
    { id: 3, scheda_id: 5, titolo: "Sollecitare il recruiter", tipo: "sollecito", quando: q(8, "09:30"), note: "Usare il modello di sollecito." },
    { id: 4, scheda_id: 10, titolo: "Risposta all'offerta", tipo: "scadenza", quando: q(6, "12:00"), note: "Prima chiedere i giorni da casa." },
    { id: 5, scheda_id: 1, titolo: "Ripassare il caso di studio", tipo: "promemoria", quando: q(2, "18:00") },
    { id: 6, scheda_id: 3, titolo: "Inviare la candidatura in inglese", tipo: "promemoria", quando: q(-12, "09:00"), stato: "fatta", esito: "Inviata." },
    { id: 7, scheda_id: 11, titolo: "Colloquio conoscitivo", tipo: "colloquio", quando: q(-30, "11:00"), stato: "fatta", luogo: "Videochiamata", esito: "Gentili, ma cercano più esperienza su un programma specifico." },
    { id: 8, scheda_id: 4, titolo: "Incontro con la direttrice didattica", tipo: "colloquio", quando: q(12, "14:00"), luogo: "Accademia Mareblu, sala riunioni" },
  ];
  const diario = [
    [1, -21, "Inviata la candidatura dal sito dell'azienda."], [1, -14, "Telefonata della selezionatrice: primo colloquio fissato."], [1, -8, "Primo colloquio conoscitivo: andato bene."],
    [1, -1, "Mi hanno scritto per il colloquio tecnico."], [2, -30, "Candidatura inviata dal portale."], [2, -16, "Risposta: vogliono conoscermi."], [2, -10, "Colloquio fissato."],
    [3, -12, "Candidatura inviata in inglese. Arrivata la conferma automatica."], [4, -9, "Telefonata con la segreteria: cercano una docente per 40 ore."],
    [4, -3, "Mandata la mia disponibilità per marzo e aprile."], [5, -15, "Contattata dal recruiter sul profilo professionale."], [5, -6, "Il recruiter ha mandato il CV al cliente."],
    [6, -42, "Inviata la candidatura per e-mail."], [8, -5, "Un'amica mi ha segnalato l'annuncio."], [9, -20, "Candidatura fatta sulla piattaforma (da verificare)."],
    [10, -50, "Candidatura inviata."], [10, -28, "Primo colloquio."], [10, -15, "Secondo colloquio con il responsabile."], [10, -1, "Arrivata l'offerta scritta."],
    [11, -70, "Candidatura inviata."], [11, -30, "Colloquio conoscitivo."], [11, -24, "Risposta negativa per e-mail."],
    [12, -95, "Candidatura inviata."], [12, -60, "Primo sollecito."], [12, -35, "Secondo sollecito, nessuna risposta: chiudo."],
    [13, -80, "Incontro di orientamento fissato."], [13, -78, "Incontro fatto."], [14, -60, "Proposta dell'agenzia."], [14, -55, "Ho rinunciato: ruolo non adatto."],
  ].map(([scheda_id, n, testo], i) => ({ id: i + 1, scheda_id, data: g(n), testo }));
  const modelli = [
    { id: 1, titolo: "Profilo breve per il CV", tipo: "cv", lingua: "italiano", filone: "analisi dati",
      testo: "Analista di dati con lunga esperienza in progetti per banche, assicurazioni e aziende di servizi. Trasformo dati sparsi in report chiari e cruscotti che aiutano a decidere. Lavoro bene in squadra e so spiegare i numeri anche a chi non è del mestiere." },
    { id: 2, titolo: "Lettera di presentazione (base)", tipo: "lettera", lingua: "italiano", filone: "generale",
      testo: "Oggetto: candidatura per [posizione]\n\nGentile [Nome / Ufficio del personale],\n\nmi candido per [posizione] perché [motivo concreto].\n\nNegli ultimi anni ho [esperienza vicina a quello che cercate].\n\nResto a disposizione per un colloquio.\n\nCordiali saluti,\nElena Rossi" },
    { id: 3, titolo: "Sollecito gentile", tipo: "sollecito", lingua: "italiano", filone: "generale",
      testo: "Oggetto: candidatura per [posizione] del [data]\n\nGentile [Nome],\n\nil [data] vi ho inviato la mia candidatura per [posizione]. Vi scrivo per sapere se è ancora in valutazione e se vi servono altre informazioni.\n\nGrazie per l'attenzione,\nElena Rossi" },
    { id: 4, titolo: "Short message to recruiters", tipo: "messaggio", lingua: "inglese", filone: "estero",
      testo: "Hello [Name],\n\nthank you for reaching out. I am interested in [role]. I am available for a short call on [days].\n\nBest regards,\nElena Rossi" },
  ];

  // ================================================================ Gestione spese
  const cassetti = [
    { id: 1, codice: "SRLS", nome: "Rossi Analisi SRLS", tipo: "Società (SRLS)", partita_iva: "12345678901", codice_fiscale: "12345678901", regime: "ordinario", note: "Dati di fantasia." },
    { id: 2, codice: "DITTA", nome: "Elena Rossi, formazione e docenze", tipo: "Ditta individuale", partita_iva: "10987654321", codice_fiscale: "", regime: "forfettario", note: "Dati di fantasia." },
    { id: 3, codice: "PERS", nome: "Spese personali", tipo: "Persona", partita_iva: "", codice_fiscale: "", regime: "", note: "" },
  ];
  const mezzi = [
    ["Conto della società", "SRLS", "Conto corrente della società (nessun numero salvato)"], ["Carta aziendale", "SRLS", "Carta di debito della società"],
    ["Conto della ditta", "DITTA", ""], ["Carta della ditta", "DITTA", ""], ["Conto personale", "PERS", ""], ["Carta di credito personale", "PERS", "Addebito il 15 del mese dopo"], ["Contanti", "", ""],
  ].map(([nome, cassetto, note], i) => ({ id: i + 1, nome, cassetto, note, attivo: "si" }));
  const categorie = [
    ["Software e servizi online", "Impresa", "programmi, cloud, dominio del sito"], ["Telefono e internet", "Impresa", "fibra dell'ufficio, cellulare di lavoro"],
    ["Affitto, utenze e ufficio", "Impresa", "affitto, luce, gas"], ["Commercialista e consulenze", "Impresa", ""], ["Cancelleria e materiali", "Impresa", "carta, toner"],
    ["Viaggi e trasferte", "Impresa", "treni, alberghi"], ["Auto e carburante", "Impresa", ""], ["Formazione e libri", "Impresa", "corsi, manuali"], ["Altro impresa", "Impresa", ""],
    ["Spesa alimentare", "Personale", "supermercato, mercato"], ["Casa", "Personale", "manutenzioni, arredo"], ["Utenze di casa", "Personale", "luce, gas, acqua"],
    ["Salute", "Personale", "farmacia, visite"], ["Trasporti e auto personali", "Personale", ""], ["Abbonamenti personali", "Personale", "streaming, palestra"],
    ["Tempo libero", "Personale", "cinema, cene, libri"], ["Viaggi e vacanze", "Personale", ""], ["Altro personale", "Personale", ""],
  ].map(([nome, vale_per, esempi], i) => ({ id: i + 1, nome, vale_per, esempi, attiva: "si" }));
  // [giorni fa, cassetto, categoria, fornitore, descrizione, totale, IVA, mezzo, extra]
  const righeSpese = [
    [118, "SRLS", "Software e servizi online", "Nuvola Software Srl", "Abbonamento programma di analisi (mese)", 59, 10.64, "Carta aziendale", { piva_fornitore: "11122233344", tipo_documento: "Fattura elettronica", origine: "XML" }],
    [112, "SRLS", "Telefono e internet", "TeleFibra Italia", "Canone fibra ufficio", 34.9, 6.29, "Conto della società", { piva_fornitore: "22233344455", tipo_documento: "Fattura elettronica", numero_documento: "TF-0091", origine: "XML" }],
    [105, "PERS", "Spesa alimentare", "Supermercato Il Granaio", "Spesa settimanale", 86.4, null, "Conto personale"],
    [99, "DITTA", "Formazione e libri", "Libreria Universitaria Esempio", "Manuale di statistica applicata", 42, null, "Carta della ditta"],
    [92, "PERS", "Utenze di casa", "Luce e Gas del Tirreno", "Bolletta luce e gas bimestrale", 148.3, null, "Conto personale"],
    [88, "SRLS", "Commercialista e consulenze", "Studio Verdi Commercialisti", "Compenso trimestrale", 380, 68.52, "Conto della società", { piva_fornitore: "33344455566", tipo_documento: "Fattura elettronica", file_documento: "Ricevuta_Studio_Verdi.pdf" }],
    [84, "PERS", "Salute", "Farmacia Centrale (di fantasia)", "Farmaci da banco", 23.8, null, "Contanti"],
    [80, "SRLS", "Telefono e internet", "TeleFibra Italia", "Canone fibra ufficio", 34.9, 6.29, "Conto della società", { piva_fornitore: "22233344455", tipo_documento: "Fattura elettronica", numero_documento: "TF-0123", origine: "XML" }],
    [75, "DITTA", "Viaggi e trasferte", "Treni Veloci Spa (di fantasia)", "Treno per lezione a Firenze, andata e ritorno", 18.6, null, "Carta della ditta"],
    [70, "PERS", "Tempo libero", "Cinema Odeon (di fantasia)", "Due biglietti", 16, null, "Carta di credito personale"],
    [66, "PERS", "Spesa alimentare", "Supermercato Il Granaio", "Spesa settimanale", 92.15, null, "Conto personale"],
    [60, "SRLS", "Cancelleria e materiali", "Cartoleria Il Quaderno", "Toner e risme di carta", 64.9, 11.7, "Carta aziendale"],
    [55, "PERS", "Casa", "Ferramenta Bianchi (di fantasia)", "Lampadine e piccole riparazioni", 27.5, null, "Contanti"],
    [50, "SRLS", "Software e servizi online", "Nuvola Software Srl", "Abbonamento programma di analisi (mese)", 59, 10.64, "Carta di credito personale", { piva_fornitore: "11122233344", note: "Pagata per sbaglio con la carta personale: da dire al commercialista.", segnala: "si" }],
    [47, "PERS", "Abbonamenti personali", "Palestra Forma Più", "Quota mensile", 45, null, "Conto personale"],
    [44, "DITTA", "Altro impresa", "Copisteria Rapida", "Stampa dispense del corso", 31.2, null, "Contanti", { stato: "da_verificare", note: "Manca lo scontrino: cercarlo." }],
    [40, "PERS", "Spesa alimentare", "Mercato rionale", "Frutta e verdura", 21.3, null, "Contanti"],
    [36, "SRLS", "Viaggi e trasferte", "Albergo Stella Polare (di fantasia)", "Una notte a Milano per incontro con cliente", 112, 10.18, "Carta aziendale"],
    [33, "PERS", "Salute", "Studio dentistico Sorriso (di fantasia)", "Igiene dentale", 90, null, "Conto personale"],
    [30, "SRLS", "Affitto, utenze e ufficio", "Coworking Lungarno (di fantasia)", "Postazione in coworking (mese)", 180, 32.46, "Conto della società", { piva_fornitore: "44455566677", tipo_documento: "Fattura elettronica" }],
    [27, "PERS", "Spesa alimentare", "Supermercato Il Granaio", "Spesa settimanale", 78.9, null, "Conto personale"],
    [24, "DITTA", "Software e servizi online", "Sito Facile Srl (di fantasia)", "Rinnovo dominio e spazio web", 36.6, 6.6, "Carta della ditta"],
    [20, "SRLS", "Software e servizi online", "Nuvola Software Srl", "Abbonamento programma di analisi (mese)", 59, 10.64, "Carta aziendale", { piva_fornitore: "11122233344" }],
    [18, "PERS", "Tempo libero", "Trattoria Da Gino (di fantasia)", "Cena con le amiche", 38, null, "Carta di credito personale"],
    [15, "PERS", "Trasporti e auto personali", "Distributore Esempio", "Carburante", 55, null, "Carta di credito personale"],
    [13, "SRLS", "Telefono e internet", "TeleFibra Italia", "Canone fibra ufficio", 34.9, 6.29, "Conto della società", { piva_fornitore: "22233344455", tipo_documento: "Fattura elettronica", numero_documento: "TF-0157", origine: "XML", file_documento: "Fattura_TeleFibra_ottobre.pdf" }],
    [10, "PERS", "Spesa alimentare", "Supermercato Il Granaio", "Spesa settimanale", 81.7, null, "Conto personale"],
    [8, "DITTA", "Cancelleria e materiali", "Cartoleria Il Quaderno", "Quaderni e pennarelli per l'aula", 14.6, null, "Contanti"],
    [6, "PERS", "Altro personale", "Negozio di Esempio", "Regalo di compleanno", 35, null, "Contanti", { stato: "da_chiarire", note: "Non ricordo se l'ho pagato io o mia sorella." }],
    [4, "PERS", "Spesa alimentare", "Mercato rionale", "Frutta, verdura e pane", 18.4, null, "Contanti"],
    [3, "SRLS", "Commercialista e consulenze", "Studio Verdi Commercialisti", "Pratica annuale", 244, 44, "Conto della società", { pagato: "no", scadenza: g(4), piva_fornitore: "33344455566", tipo_documento: "Fattura elettronica" }],
    [2, "PERS", "Utenze di casa", "Acquedotto di Esempio", "Bolletta acqua", 64.2, null, "Conto personale", { pagato: "no", scadenza: g(12) }],
    [1, "DITTA", "Formazione e libri", "Corsi Online Esempio", "Corso di aggiornamento", 120, null, "Carta della ditta", { pagato: "rateizzata", note: "Pagato in tre rate: le rate sono in Scadenze e rate." }],
    [0, "PERS", "Spesa alimentare", "Supermercato Il Granaio", "Spesa settimanale", 74.3, null, "Conto personale"],
  ];
  const spese = righeSpese.map(([n, cassetto, categoria, fornitore, descrizione, totale, iva, mezzo, extra = {}], i) => ({
    id: i + 1, data_documento: g(-n), cassetto, categoria, fornitore, descrizione, totale, iva, imponibile: iva !== null ? Math.round((totale - iva) * 100) / 100 : null,
    mezzo, pagato: "si", data_pagamento: extra.pagato && extra.pagato !== "si" ? "" : g(-n), tipo_documento: "Ricevuta", intestato_a: cassetto, origine: "Sito", stato: "ok", segnala: "no", ...extra,
  }));
  const ricorrenti = [
    { id: 1, nome: "Abbonamento programma di analisi", cassetto: "SRLS", categoria: "Software e servizi online", fornitore: "Nuvola Software Srl", importo: 59, frequenza: "mensile", giorno: giornoDelMese(10), prossima_scadenza: g(10), mezzo: "Carta aziendale", stato: "attivo" },
    { id: 2, nome: "Canone fibra ufficio", cassetto: "SRLS", categoria: "Telefono e internet", fornitore: "TeleFibra Italia", importo: 34.9, frequenza: "mensile", giorno: giornoDelMese(2), prossima_scadenza: g(2), mezzo: "Conto della società", stato: "attivo" },
    { id: 3, nome: "Commercialista (trimestrale)", cassetto: "SRLS", categoria: "Commercialista e consulenze", fornitore: "Studio Verdi Commercialisti", importo: 380, frequenza: "trimestrale", prossima_scadenza: g(20), mezzo: "Conto della società", stato: "attivo" },
    { id: 4, nome: "Rate del computer portatile", cassetto: "DITTA", categoria: "Altro impresa", fornitore: "Negozio Informatica Esempio", importo: 89, frequenza: "mensile", giorno: giornoDelMese(9), prossima_scadenza: g(9), ultima_scadenza: g(130), mezzo: "Conto della ditta", stato: "attivo", note: "Piano di 8 rate: mancano le ultime 5." },
    { id: 5, nome: "Corso di aggiornamento in tre rate", cassetto: "DITTA", categoria: "Formazione e libri", fornitore: "Corsi Online Esempio", importo: 40, frequenza: "mensile", prossima_scadenza: g(14), ultima_scadenza: g(75), mezzo: "Carta della ditta", stato: "attivo", crea_spesa: "no", note: "La spesa è già registrata come \"Rateizzata\": pagando le rate non si crea una nuova spesa." },
    { id: 6, nome: "Palestra", cassetto: "PERS", categoria: "Abbonamenti personali", fornitore: "Palestra Forma Più", importo: 45, frequenza: "mensile", prossima_scadenza: g(11), disdetta_entro: g(25), mezzo: "Conto personale", stato: "da_disdire", note: "Passo alla piscina comunale: disdire entro la data." },
    { id: 7, nome: "Assicurazione auto", cassetto: "PERS", categoria: "Trasporti e auto personali", fornitore: "Assicurazioni Esempio", importo: 520, frequenza: "annuale", prossima_scadenza: g(40), mezzo: "Conto personale", stato: "attivo" },
    { id: 8, nome: "Film e serie in streaming", cassetto: "PERS", categoria: "Abbonamenti personali", fornitore: "Streaming Esempio", importo: 12.99, frequenza: "mensile", prossima_scadenza: g(-1), mezzo: "Carta di credito personale", stato: "attivo" },
    { id: 9, nome: "Addebito della carta di credito personale", cassetto: "PERS", categoria: "Altro personale", fornitore: "Banca di Esempio", importo: null, frequenza: "mensile", prossima_scadenza: g(16), mezzo: "Conto personale", stato: "attivo", crea_spesa: "no", note: "Gli acquisti sono già registrati uno per uno: l'addebito non diventa una spesa." },
  ];
  const anno = String(oggi.getFullYear());
  const incassi = [
    { id: 1, cassetto: "SRLS", numero: `14/${anno}`, data_fattura: g(-75), cliente: "Studio Associato Arno (di fantasia)", descrizione: "Analisi dei dati di vendita, prima parte", imponibile: 1800, iva: 396, totale: 2196, scadenza: g(-45), stato: "incassata", data_incasso: g(-44) },
    { id: 2, cassetto: "SRLS", numero: `17/${anno}`, data_fattura: g(-40), cliente: "Studio Associato Arno (di fantasia)", descrizione: "Analisi dei dati di vendita, seconda parte", imponibile: 1500, iva: 330, totale: 1830, scadenza: g(-10), stato: "da_incassare", note: "Scaduta da qualche giorno: mandare un promemoria gentile." },
    { id: 3, cassetto: "SRLS", numero: `19/${anno}`, data_fattura: g(-12), cliente: "Associazione Volontari Collina (di fantasia)", descrizione: "Cruscotto delle attività dei volontari", imponibile: 900, iva: 198, totale: 1098, scadenza: g(18), stato: "da_incassare" },
    { id: 4, cassetto: "DITTA", numero: `6/${anno}`, data_fattura: g(-30), cliente: "Accademia Mareblu (di fantasia)", descrizione: "Docenza: 12 ore di lezione", imponibile: 540, iva: 0, totale: 540, scadenza: g(0), stato: "da_incassare", note: "Regime forfettario: senza IVA." },
    { id: 5, cassetto: "DITTA", numero: `4/${anno}`, data_fattura: g(-90), cliente: "Biblioteca Comunale di Esempio", descrizione: "Seminario sui dati aperti", imponibile: 300, iva: 0, totale: 300, scadenza: g(-60), stato: "incassata", data_incasso: g(-58) },
  ];
  const budget = [
    { id: 1, cassetto: "PERS", categoria: "Spesa alimentare", importo: 400, note: "" }, { id: 2, cassetto: "PERS", categoria: "Tempo libero", importo: 80, note: "" },
    { id: 3, cassetto: "PERS", categoria: "Abbonamenti personali", importo: 60, note: "" }, { id: 4, cassetto: "SRLS", categoria: "Software e servizi online", importo: 120, note: "" },
    { id: 5, cassetto: "DITTA", categoria: "Cancelleria e materiali", importo: 30, note: "" },
  ];
  const quote = [{ id: 1, categoria: "Telefono e internet", fornitore: "TeleFibra Italia", quota: 0.5, cassetto_impresa: "DITTA", decisa: "con il commercialista (esempio)" }];
  const storico = [
    { quando: `${g(-7)}T18:20:00`, operazione: "Spesa", dettaglio: "aggiunto: spesa di esempio" },
    { quando: `${g(-3)}T10:05:00`, operazione: "Importazione", dettaglio: "2 fatture elettroniche importate come spese" },
    { quando: `${g(-1)}T21:40:00`, operazione: "Esportazione", dettaglio: "riepilogo per il commercialista SRLS, DITTA" },
  ].map((s, i) => ({ id: i + 1, ...s }));

  // ================================================================ Benessere personale
  const abitudini = [
    { nome: "Bere acqua", area: "abitudini", icona: "💧", tipo: "quantita", unita: "bicchieri", obiettivo_giorno: 8, obiettivo_settimana: 5, ordine: 10 },
    { nome: "Dormire almeno 7 ore", area: "abitudini", icona: "🌙", tipo: "quantita", unita: "ore", obiettivo_giorno: 7, obiettivo_settimana: 5, fonte: "sonno", ordine: 20, note: "Si compila da sola con le ore di sonno scritte in \"Come stai\"." },
    { nome: "Pausa dallo schermo", area: "abitudini", icona: "🌿", tipo: "spunta", obiettivo_settimana: 5, giorni: "12345", ordine: 30, note: "Almeno una pausa vera di 10 minuti lontano dal computer." },
    { nome: "Muovermi", area: "movimento", icona: "🚶", tipo: "quantita", unita: "minuti", obiettivo_giorno: 30, obiettivo_settimana: 5, fonte: "movimento", ordine: 40, note: "Si compila da sola con i minuti registrati in Movimento." },
    { nome: "Crema viso al mattino", area: "aspetto", icona: "🧴", tipo: "spunta", obiettivo_settimana: 5, ordine: 50 },
    { nome: "Crema viso la sera", area: "aspetto", icona: "✨", tipo: "spunta", obiettivo_settimana: 5, ordine: 60 },
    { nome: "Frutta e verdura", area: "alimentazione", icona: "🥗", tipo: "quantita", unita: "porzioni", obiettivo_giorno: 5, obiettivo_settimana: 4, ordine: 70 },
    { nome: "Un momento per me", area: "umore", icona: "🌸", tipo: "spunta", obiettivo_settimana: 4, ordine: 80, note: "Lettura, musica, una passeggiata senza fretta, una telefonata a un'amica." },
    { nome: "Scrivere come sto", area: "umore", icona: "📝", tipo: "spunta", obiettivo_settimana: 5, fonte: "diario", ordine: 90, note: "Si compila da sola quando scegli l'umore in \"Come stai\"." },
    { nome: "Farmaci presi", area: "farmaci", icona: "💊", tipo: "spunta", obiettivo_settimana: 7, fonte: "farmaci", ordine: 100, note: "Si compila da sola quando hai preso tutte le dosi previste del giorno. Nei giorni senza dosi non conta." },
  ].map((a, i) => ({ id: i + 1, ...a }));
  const registro = [];
  for (let n = 1; n <= 20; n++) { // venti giorni passati, con qualche giorno "no" (obiettivi gentili: nessun rimprovero)
    const giorno = g(-n), feriale = ![0, 6].includes(piuGiorni(oggi, -n).getDay());
    registro.push({ data: giorno, abitudine_id: 1, valore: [8, 6, 9, 7, 8, 5, 8][n % 7] });
    if (feriale && n % 5 !== 0) registro.push({ data: giorno, abitudine_id: 3, valore: 1 });
    if (n % 6 !== 0) registro.push({ data: giorno, abitudine_id: 5, valore: 1 });
    if (n % 4 !== 0) registro.push({ data: giorno, abitudine_id: 6, valore: 1 });
    registro.push({ data: giorno, abitudine_id: 7, valore: [5, 4, 3, 5, 6, 4, 2][n % 7] });
    if (n % 3 !== 1) registro.push({ data: giorno, abitudine_id: 8, valore: 1 });
  }
  registro.push({ data: g(0), abitudine_id: 1, valore: 3 }, { data: g(0), abitudine_id: 5, valore: 1 }, { data: g(0), abitudine_id: 7, valore: 1 });
  const parole = ["serena", "un po' stanca", "piena di energia", "pensierosa", "contenta", "di corsa", "tranquilla"];
  const coseBelle = ["Una telefonata lunga con mia sorella.", "Il sole sul lungofiume.", "Ho finito un capitolo del libro.", "Il colloquio è andato bene.",
    "Pranzo all'aperto con un'amica.", "Ho imparato una cosa nuova in Python.", "Una passeggiata senza fretta."];
  const diarioBn = [];
  for (let n = 1; n <= 18; n++) {
    if (n % 5 === 3) continue; // qualche giorno senza diario: va bene così
    diarioBn.push({ id: diarioBn.length + 1, data: g(-n), umore: [4, 3, 5, 3, 4, 2, 4][n % 7], energia: [3, 3, 4, 2, 4, 3, 5][n % 7], sonno_qualita: [4, 3, 4, 2, 5, 3, 4][n % 7],
      sonno_ore: [7.5, 6.5, 8, 6, 7, 7, 7.5][n % 7], parole: parole[n % 7], cosa_bella: coseBelle[n % 7], note: n === 6 ? "Mal di testa nel pomeriggio, passato con un po' di riposo." : n === 11 ? "Dormito male: troppi pensieri sul lavoro." : "" });
  }
  const attivita = [
    [1, "Camminata", 40, "media", 5200], [2, "Yoga", 30, "leggera", 0], [3, "Camminata", 25, "leggera", 3100], [5, "Bicicletta", 50, "media", 0], [6, "Camminata", 35, "media", 4600],
    [8, "Nuoto", 45, "media", 0], [9, "Camminata", 30, "leggera", 3900], [11, "Yoga", 30, "leggera", 0], [12, "Camminata", 60, "media", 7800], [15, "Bicicletta", 40, "intensa", 0], [0, "Camminata", 20, "leggera", 2500],
  ].map(([n, tipo, minuti, intensita, passi], i) => ({ id: i + 1, data: g(-n), tipo, minuti, intensita, passi, note: n === 12 ? "Giro lungo sulle mura." : "" }));
  const pasti = [
    [0, "colazione", "Yogurt, cereali integrali e una mela", "Frutta,Cereali integrali,Latticini"], [1, "pranzo", "Pasta e ceci", "Legumi,Fatto in casa"], [1, "cena", "Pesce al forno con zucchine", "Pesce,Verdura,Fatto in casa"],
    [2, "pranzo", "Insalatona con uova e pomodori", "Verdura,Uova"], [2, "merenda", "Una pera e qualche noce", "Frutta"], [2, "cena", "Pizza con le amiche", "Fuori casa"],
    [3, "pranzo", "Panino al volo", "Di corsa"], [3, "cena", "Minestrone e pane integrale", "Verdura,Cereali integrali,Fatto in casa"], [4, "pranzo", "Riso con verdure", "Verdura,Fatto in casa"],
    [4, "cena", "Pollo e patate al forno", "Carne,Fatto in casa"], [5, "colazione", "Pane tostato e marmellata", "Cereali integrali"], [5, "cena", "Zuppa di lenticchie", "Legumi,Fatto in casa"],
  ].map(([n, momento, descrizione, etichette], i) => ({ id: i + 1, data: g(-n), momento, descrizione, etichette, note: "" }));
  const farmaci = [
    { id: 1, nome: "Vitamina D", tipo: "integratore", dose: "1 compressa", unita_per_dose: 1, orari: "08:00", giorni: "1234567", dal: g(-60), scorta: 9, avviso_giorni: 10, a_cosa_serve: "Consigliata dal medico per l'inverno", prescritto_da: "Medico di base", attivo: "si" },
    { id: 2, nome: "Magnesio", tipo: "integratore", dose: "1 bustina", unita_per_dose: 1, orari: "21:00", giorni: "1234567", dal: g(-30), scorta: 22, avviso_giorni: 7, a_cosa_serve: "Stanchezza", attivo: "si" },
    { id: 3, nome: "Collirio lubrificante", tipo: "farmaco", dose: "2 gocce", unita_per_dose: 1, orari: "09:00,15:00", giorni: "1234567", dal: g(-10), al: g(20), scorta: null, avviso_giorni: 7, a_cosa_serve: "Occhi secchi da computer", prescritto_da: "Oculista", attivo: "si" },
    { id: 4, nome: "Antidolorifico al bisogno", tipo: "farmaco", dose: "1 compressa", unita_per_dose: 1, orari: "", giorni: "1234567", dal: g(-90), scorta: 10, avviso_giorni: 7, a_cosa_serve: "Mal di testa", attivo: "si", note: "Non più di 2 al giorno." },
  ];
  const assunzioni = [];
  for (let n = 1; n <= 12; n++) {
    if (n !== 4) assunzioni.push({ data: g(-n), farmaco_id: 1, orario: "08:00", ora_presa: "08:10" });
    if (n % 6 !== 0) assunzioni.push({ data: g(-n), farmaco_id: 2, orario: "21:00", ora_presa: "21:15" });
    if (n <= 10) { assunzioni.push({ data: g(-n), farmaco_id: 3, orario: "09:00", ora_presa: "09:05" }); if (n % 3) assunzioni.push({ data: g(-n), farmaco_id: 3, orario: "15:00", ora_presa: "15:20" }); }
  }
  assunzioni.push({ data: g(-6), farmaco_id: 4, orario: "16:30", ora_presa: "16:30", nota: "mal di testa" });
  const appuntamenti = [
    { id: 1, titolo: "Igiene dentale", categoria: "dentista", data: g(6), ora: "16:00", luogo: "Studio dentistico Sorriso (di fantasia)", persona: "Dott. Neri", stato: "programmato", ripeti_mesi: 6 },
    { id: 2, titolo: "Esami del sangue", categoria: "esami", data: g(15), luogo: "Laboratorio di analisi", stato: "da_prenotare", ripeti_mesi: 12, preparazione: "A digiuno dalla sera prima" },
    { id: 3, titolo: "Visita oculistica", categoria: "specialista", data: g(-40), ora: "10:00", luogo: "Ambulatorio oculistico", persona: "Dott.ssa Gialli", stato: "fatto", ripeti_mesi: 12, esito: "Vista stabile. Collirio per gli occhi secchi." },
    { id: 4, titolo: "Visita oculistica", categoria: "specialista", data: g(325), luogo: "Ambulatorio oculistico", stato: "da_prenotare", ripeti_mesi: 12, precedente_id: 3 },
    { id: 5, titolo: "Taglio e piega", categoria: "parrucchiere", data: g(9), ora: "10:00", luogo: "Salone Capelli d'Oro (di fantasia)", stato: "programmato" },
    { id: 6, titolo: "Controllo della pressione", categoria: "medico", data: g(18), ora: "11:30", luogo: "Ambulatorio del medico di base", persona: "Dott. Azzurri", stato: "programmato", note: "Portare l'elenco degli integratori." },
    { id: 7, titolo: "Mammografia di controllo", categoria: "screening", data: g(28), luogo: "Centro screening", stato: "da_prenotare", ripeti_mesi: 24 },
  ];
  const prodotti = [
    { id: 1, nome: "Crema viso idratante", marca: "Marca di esempio", uso: "viso", stato: "in_uso", aperto_il: g(-80), durata_mesi: 3, voto: 4, ricomprare: "si" },
    { id: 2, nome: "Mascara", marca: "Marca di esempio", uso: "trucco", stato: "in_uso", aperto_il: g(-87), durata_mesi: 3, voto: 3, ricomprare: "forse", note: "Il mascara va cambiato ogni 3 mesi." },
    { id: 3, nome: "Shampoo delicato", marca: "Marca di esempio", uso: "capelli", stato: "in_uso", aperto_il: g(-20), durata_mesi: 12, voto: 5, ricomprare: "si" },
    { id: 4, nome: "Crema solare viso", marca: "Marca di esempio", uso: "solari", stato: "da_aprire", scadenza: g(400) },
    { id: 5, nome: "Siero alla vitamina C", uso: "viso", stato: "da_comprare", note: "Consigliato dall'estetista." },
  ];

  // ================================================================ Formazione
  const competenze = [
    { id: 1, nome: "Analisi dei dati con SQL", nome_en: "Data analysis with SQL", area: "Dati", livello: 4, obiettivo: 5, perche: "È la base del mio lavoro.", stato: "attiva", nel_cv: "si", ordine: 10 },
    { id: 2, nome: "Python per l'analisi dei dati", nome_en: "Python for data analysis", area: "Programmazione", livello: 2, obiettivo: 4, perche: "Lo chiedono in molti annunci.", stato: "attiva", nel_cv: "si", ordine: 20 },
    { id: 3, nome: "Cruscotti e visualizzazione dei dati", nome_en: "Dashboards and data visualization", area: "Dati", livello: 3, obiettivo: 4, perche: "Far capire i numeri a colpo d'occhio.", stato: "attiva", nel_cv: "si", ordine: 30 },
    { id: 4, nome: "Inglese professionale", nome_en: "Professional English", area: "Lingue", livello: 3, obiettivo: 4, perche: "Per le candidature all'estero.", stato: "attiva", nel_cv: "si", ordine: 40 },
    { id: 5, nome: "Gestione dei progetti con il metodo Scrum", nome_en: "Scrum project management", area: "Organizzazione", livello: 1, obiettivo: 3, perche: "Utile nei gruppi di lavoro.", stato: "in_pausa", nel_cv: "no", ordine: 50, note: "Riprendo dopo il corso di Python." },
    { id: 6, nome: "Statistica per il controllo qualità", nome_en: "Statistical quality control", area: "Dati", livello: 4, obiettivo: 4, stato: "raggiunta", nel_cv: "si", ordine: 60 },
  ];
  const corsi = [
    { id: 1, titolo: "Python per l'analisi dei dati: dalle basi ai grafici", titolo_en: "Python for data analysis: from basics to charts", ente: "Scuola Online di Esempio", tipo: "corso_online",
      competenza_id: 2, link: "https://www.example.com/corsi/python-dati", stato: "in_corso", costo: 0, inizio: g(-18), fine_prevista: g(24), lezioni_totali: 24, lezioni_fatte: 9, ore_previste: 30, nel_cv: "si", ordine: 10,
      note: "Una lezione al giorno, dal lunedì al venerdì." },
    { id: 2, titolo: "Certificazione di inglese livello C1", titolo_en: "C1 English certificate", ente: "Ente certificatore di esempio", tipo: "certificazione", competenza_id: 4, stato: "iscritta",
      costo: 230, inizio: g(10), esame_il: g(50), esame_ora: "09:30", lezioni_totali: 0, nel_cv: "si", ordine: 20 },
    { id: 3, titolo: "Cruscotti efficaci: corso pratico", titolo_en: "Effective dashboards: hands-on course", ente: "Accademia dei Dati (di fantasia)", tipo: "corso_online", competenza_id: 3,
      stato: "idea", costo: 89, lezioni_totali: 8, ore_previste: 12, nel_cv: "si", ordine: 30 },
    { id: 4, titolo: "Introduzione al metodo Scrum", titolo_en: "Introduction to Scrum", ente: "Webinar gratuito di esempio", tipo: "webinar", competenza_id: 5, stato: "in_pausa", lezioni_totali: 10, lezioni_fatte: 3, nel_cv: "no", ordine: 40, inizio: g(-70) },
    { id: 5, titolo: "SQL avanzato per analisti", titolo_en: "Advanced SQL for analysts", ente: "Scuola Online di Esempio", tipo: "corso_online", competenza_id: 1, stato: "completato", costo: 49,
      inizio: g(-110), completato_il: g(-60), lezioni_totali: 12, lezioni_fatte: 12, ore_previste: 16, attestato: "Attestato_SQL_per_analisti.pdf", codice_attestato: "SQL-ESEMPIO-2041", nel_cv: "si", ordine: 5 },
  ];
  const sessioni = [];
  const argomenti = ["Variabili e tipi di dati", "Liste e dizionari", "Leggere un file CSV", "Le tabelle con pandas", "Filtrare le righe", "Raggruppare e sommare",
    "Unire due tabelle", "Il primo grafico", "Grafici a barre e a linee"];
  [17, 16, 15, 12, 11, 9, 8, 4, 1].forEach((n, i) => sessioni.push({ data: g(-n), minuti: [45, 60, 40, 75, 50, 60, 45, 90, 55][i], competenza_id: 2, corso_id: 1, cosa: argomenti[i], lezioni: 1 }));
  [14, 7, 3, 0].forEach((n, i) => sessioni.push({ data: g(-n), minuti: [30, 25, 40, 20][i], competenza_id: 4, corso_id: 0, cosa: ["Ascolto di un podcast in inglese", "Lettura di un articolo", "Conversazione con un'amica inglese", "Esercizi di grammatica"][i], lezioni: 0 }));
  [65, 62, 60].forEach((n, i) => sessioni.push({ data: g(-n), minuti: [90, 80, 60][i], competenza_id: 1, corso_id: 5, cosa: ["Funzioni finestra", "Query annidate", "Esame finale"][i], lezioni: 0 }));
  sessioni.forEach((s, i) => { s.id = i + 1; s.note = ""; });
  const materiali = [
    { id: 1, titolo: "Guida rapida a pandas", tipo: "documentazione", autore: "Documentazione ufficiale", link: "https://www.example.com/pandas", competenza_id: 2, corso_id: 1, stato: "in_corso", voto: 4,
      appunti: "groupby() raggruppa come GROUP BY in SQL. merge() unisce due tabelle come una JOIN." },
    { id: 2, titolo: "Esercizi di Python per principianti", tipo: "esercizi", link: "https://www.example.com/esercizi-python", competenza_id: 2, corso_id: 1, stato: "da_vedere" },
    { id: 3, titolo: "Raccontare i dati con i grafici", tipo: "libro", autore: "Autrice di fantasia", competenza_id: 3, stato: "finito", voto: 5,
      appunti: "Un grafico, un messaggio. Togliere tutto quello che non serve. Il titolo dice la conclusione." },
    { id: 4, titolo: "Podcast di inglese per il lavoro", tipo: "podcast", link: "https://www.example.com/podcast", competenza_id: 4, stato: "in_corso", voto: 4, appunti: "Puntate brevi: perfette in camminata." },
    { id: 5, titolo: "Il metodo Scrum in 30 minuti", tipo: "video", competenza_id: 5, corso_id: 4, stato: "da_vedere" },
    { id: 6, titolo: "Le mie note sulle funzioni finestra", tipo: "appunti", competenza_id: 1, corso_id: 5, stato: "finito", appunti: "ROW_NUMBER() numera le righe; SUM() OVER (PARTITION BY ...) fa i totali per gruppo senza perdere le righe." },
  ];

  return {
    bussola: { schede, azioni, diario, modelli },
    spese: { cassetti, mezzi, categorie, spese, ricorrenti, incassi, budget, quote, storico, impostazioni: { soglia_budget: 0.8, giorni_avviso: 7 } },
    benessere: { abitudini, registro, diario: diarioBn, attivita, pasti, farmaci, assunzioni, appuntamenti, prodotti, impostazioni: { obiettivo_movimento: 150, giorni_avviso: 7 } },
    formazione: { competenze, corsi, sessioni, materiali, impostazioni: { obiettivo_minuti: 240, giorni_avviso: 7 } },
  };
};
