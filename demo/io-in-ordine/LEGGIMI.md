# "Io, in ordine": versione dimostrativa

Questa cartella contiene la demo del gestionale personale "Io, in ordine" (sul computer di casa si chiama SitoPersonale).
Tutti i dati sono **inventati**: la persona si chiama Elena Rossi, e aziende, fornitori, cifre e indirizzi sono di fantasia.

## Come si apre

- **Sul computer:** doppio clic su `index.html`. Si apre nel browser e funziona subito, senza installare niente.
- **Su Internet:** basta copiare tutta la cartella su GitHub Pages (il sito statico gratuito), per esempio dentro la vetrina in `demo/io-in-ordine/`.

Non serve Python, non serve un server, non c'è un database. Niente viene mandato su Internet.

## Come è fatta (in parole semplici)

| File o cartella | A cosa serve |
|---|---|
| `index.html`, `home.js`, `home.css` | La pagina iniziale con i quattro riquadri e l'agenda a foglietti |
| `comune.css` | I colori e lo stile comuni a tutte le pagine |
| `s/bussola/`, `s/spese/`, `s/benessere/`, `s/formazione/` | Le quattro sezioni: sono **le stesse pagine del programma vero**, con pochi ritocchi (nome Elena, link relativi) |
| `demo/motore.js` | Il "motore finto": fa nel browser quello che nel programma vero fa il piccolo server in Python. Aggiunge anche la striscia gialla in alto |
| `demo/dati-demo.js` | **I dati inventati**: è il file da modificare per cambiarli |

**Dove finiscono le modifiche del visitatore.** Chi prova la demo può aggiungere, cambiare ed eliminare dati. Tutto resta solo nella memoria del suo browser (si chiama "localStorage"). Gli altri visitatori non vedono niente, e a te non arriva niente.

**Pulsante "Ripristina i dati di esempio"** (nella striscia in alto): cancella le prove del visitatore e rimette i dati di partenza.

**Rinnovo automatico.** Dopo 7 giorni dalla prima visita i dati di esempio si rinnovano da soli. Così le date sono sempre "intorno a oggi" e l'agenda non resta vuota.

## Come cambiare i dati inventati

1. Apri `demo/dati-demo.js` con il Blocco note (oppure con Visual Studio Code).
2. Le date sono scritte come "giorni da oggi": `g(0)` è oggi, `g(-3)` è tre giorni fa, `g(5)` è fra cinque giorni. `q(2, "10:30")` è fra due giorni alle 10:30.
3. Cambia i testi fra virgolette, lascia uguali virgole e parentesi.
4. Salva, apri la demo e premi **"Ripristina i dati di esempio"** per vedere i dati nuovi.

## Il link "Torna alla vetrina"

Punta a `../../index.html`, cioè alla pagina iniziale della vetrina se la demo sta in `vetrina/demo/io-in-ordine/`. Se la cartella va da un'altra parte, il link si cambia in `demo/motore.js` (cerca "Torna alla vetrina").

## Cosa funziona davvero e cosa mostra solo un messaggio

| Sezione | Funzione | Nella demo |
|---|---|---|
| Pagina iniziale | Riquadri con i numeri di ogni sezione | Funziona |
| Pagina iniziale | Agenda del mese a foglietti colorati (mese prima/dopo, clic sul giorno, clic sul foglietto apre l'elemento) | Funziona |
| Pagina iniziale | Copia di sicurezza (backup) | Messaggio: nel programma vero crea il file nella cartella backup |
| Pagina iniziale | Uso dal cellulare con PIN | Spiegato a parole (la demo si apre già da qualsiasi telefono) |
| BussolaLavoro | Panoramica, candidature con ricerca, filtri e pagine, agenda, archivio, confronto fino a 3 | Funziona |
| BussolaLavoro | Diario delle notizie e "Aggiungi notizia" con i pulsanti rapidi | Funziona |
| BussolaLavoro | Appuntamenti (colloqui, scadenze, solleciti, promemoria) | Funziona |
| BussolaLavoro | Modelli di testo con "Copia il testo" | Funziona |
| BussolaLavoro | Documenti (CV e lettere) | Elenco di esempio; aprire un file mostra un messaggio |
| BussolaLavoro | Excel a 4 fogli, stampa/PDF, file di trasferimento, importazione | Funziona |
| Gestione spese | Spese con ricerca, filtri, totali, pagine | Funziona |
| Gestione spese | Scadenze e rate con "Pagata" (crea la spesa e passa alla rata dopo) | Funziona |
| Gestione spese | Fatture da incassare, budget, riepilogo per mese, IVA e categoria | Funziona |
| Gestione spese | Controlli automatici (conto di un altro cassetto, da verificare, da chiarire, non pagate) | Funziona |
| Gestione spese | Per il commercialista: anteprima, Excel, stampa/PDF | Funziona |
| Gestione spese | Importa fatture elettroniche XML | Funziona con due fatture di esempio già incluse (pulsante "Prova con le fatture di esempio") e con file .xml propri; per i file .zip mostra un messaggio |
| Gestione spese | Registro Excel completo, file di trasferimento, ripristino, impostazioni, storico delle modifiche | Funziona |
| Gestione spese | Aprire il PDF della fattura o ricevuta | Messaggio |
| Benessere | Oggi: abitudini, "Come stai", movimento e pasti con pulsanti rapidi | Funziona |
| Benessere | Abitudini automatiche (movimento, sonno, diario, farmaci) e "obiettivi gentili" | Funziona |
| Benessere | La mia settimana, umore e diario, movimento, alimentazione | Funziona |
| Benessere | Farmaci con "Preso", scorta che scende e avviso "Riordinare" | Funziona |
| Benessere | Visite: "Si ripete" crea da sola la prossima da prenotare | Funziona |
| Benessere | Cura dell'aspetto: data di sostituzione dei prodotti calcolata da sola | Funziona |
| Benessere | Per il medico (stampa ed Excel), impostazioni, Excel completo, trasferimento | Funziona |
| Formazione | Panoramica, mappa delle competenze, corsi e certificazioni con "Il mio percorso" numerato | Funziona |
| Formazione | "Ho studiato", "+1 lezione fatta", cronometro, "Segna completato" con livello della competenza | Funziona |
| Formazione | Ore di studio, materiali e appunti (la ricerca guarda anche negli appunti) | Funziona |
| Formazione | Per il CV in italiano e inglese, da copiare o stampare | Funziona |
| Formazione | Attestati nella cartella documenti | Elenco di esempio; aprire un file mostra un messaggio |
| Formazione | Excel a 4 fogli, file di trasferimento, ripristino | Funziona |

Stampa e PDF usano la stampa del browser ("Salva come PDF"), come nel programma vero. La striscia gialla non compare nelle stampe.
