# Google Earth Engine (GEE)
## Manuale comandi

Pannello di sinistra:
+	Script -> NEW #Posso creare repository e file
+	Docs: informazioni principali sulle funzioni di GEE

Pannello di destra:
+	Inspector: se clicco sullo schermo vedo il valore di un determinato pixel; in Point vedo latitudine e longitudine, zoom level (livello di zoom della mappa) e scala.

È consigliato usare ; alla fine di ogni codice (riga) in JavaScript.

Con Reset cancelliamo la console (sezione di destra).

Una variabile è un oggetto che può contenere uno e un solo valore alla volta.
Per creare un oggetto: var nome = valore

Per commentare: //
Per commento multilinea: /* poi */

ee.Image() è una funzione constructor

La funzione Map.addLayer() aggiunge una mappa.

Nella barra di ricerca possiamo cercare città oppure dataset (es. Sentinel-2). Se cerchiamo Sentinel-2 abbiamo TOA (Top of the Atmosphere), che è un dato grezzo, o SR (Surface Reflectance), che è un dato elaborato che simula la riflettanza reale.

filterDate() filtra la data (formato americano).
filterBounds() selezione dalle image collection di input solo le immagini tali che toccano l’argomento.
filter() è un filtro generico all’interno del quale possiamo inserire tutta una serie di filtri, come tutte le immagini tali che la percentuale di pixel nuvolosi sia inferiore o maggiore di un dato valore, con la funzione ee.Filter.lt(‘CLOUDY_PIXEL_PERCENTAGE’, 20).
lt (less than), lte (less than or equal), gt (greater than), gte (greater than or equal)
CLOUDY_PIXEL_PERCENTAGE è una variabile che dice qual è la percentuale di pixel con nuvole.

Per mascherare le nuvole posso usare una variabile che ha l’obiettivo di mascherare le nuvole: il risultato che si ottiene è una image collection dalla quale sono state tolte le nuvole.
Per usare una sola immagine e non una image collection calcolo una statistica, che solitamente è la mediana, cioè un parametro statistico che ci tutela dal rumore.

La funzione Map.addLayer() è una funzione complicata che prende più argomenti:
+	Oggetto che vogliamo visualizzare
+	Tra parentesi graffe: prima le bande, poi il minimo e il massimo di riflettanza dei pixel da usare per riscalare i colori

Con la funzione select() seleziono dal composite una data banda
Con la funzione rename() posso rinominare la banda
Reproject() permette di riscalare le immagini

unitScale() scala i valori da 1 a 0.

In GEE, come in qualsiasi altro linguaggio di programmazione, ci sono delle funzioni già disponibili e che possono essere usate dall’utente. Nel caso di linguaggi come R o Phyton, si parla di funzioni disponibili in librerie, cioè raccolte di funzioni sviluppate da altri utenti che le memorizzano e le mettono a disposizione, per esempio in piattaforme online come GitHub, e l’utente può scaricarle e usarle già pronte. Su GEE, il processo di condivisione delle librerie in maniera formale è un po’ più complesso: le librerie e le funzioni disponibili sono quelle che troviamo nel Docs; si possono però creare funzioni specifiche, cioè si definiscono in maniera chiara input e output.

## Interfaccia utente (User Interface, UI)
var calculateComposite = function(year, startDate, endDate, cloudsTh, B1, B2, B3, min, max)
min e max indicano di quanto vengono riscalati i pixel: se è tra 0 a 10.000, il pixel per avere luminosità massima deve avere un valore di 10.000, mentre la luminosità minima corrisponde a 0

ee.ImageCollection()
.filter() permette di usare una proprietà delle immagini per filtrare (es. 'CLOUDY_PIXEL_PERCENTAGE')
.filterDate() permette di filtrare i dati

Conviene definire i parametri all'inizio per rendere il codice più pulito.

In js il + usato con le stringhe serve per unirle (es. var startDateWithYear = year+"-"+startDate dove year e startDate sono due variabili)

Con la seguente funzione print(S2.first()) stampiamo solo il primo elemento: lo si fa per vedere se è tutto okay, se il numero di elementi è troppo alto.

Per mascherare le nuvole ci sono vari metodi: il più utilizzato è il metodo SCL che classifica i pixel in varie classi, di cui alcune sono utili, altre vanno mascherate.
Costruisco una funzione per mascherare le nuvole
var maskClouds = function(img){
 var SCL = img.select("SCL");
 var vegetation = SCL.eq(4); // Usando .eq() dico che il pixel deve valere 1 se è di classe 4, 0 in tutti gli altri casi
 var soil = SCL.eq(5);
 var water = SCL.eq(6);
 var mask = soil.or(water).or(vegetation); // Con l'operatore .or() dico che il pixel deve valere 1 se è vegetazione o acqua e 0 in tutti gli altri casi
 var maskedImage = img.updateMask(mask); // L'immagine di input rimane inalterata se i pixel valgono 1, mentre è cancellata se vale 0
 return maskedImage;
};

var S2_masked = S2.map(maskClouds); // Applica all'immagine la maschera creata sopra
Quello che noi osserviamo è l'ultima immagine caricata; nell'immagine con la maschera, vengono eliminate le immagine dove i pixel hanno valori di riflettanza elevatissimi, perchè corrispondono alle nuvole, che infatti sono bianche.

Tra parentesi tonde abbiamo gli argomenti, tra parentesi graffe l'effetto che quella funzione ha con l'argomento.

var composite = S2_masked.median(); // Creo un composite con la mediana
Map.addLayer(composite, {min:min, max:max, bands:[B1, B2, B3]}, startDateWithYear+"/"+endDateWithYear+"_"+B1+"-"+B2+"-"+B3); // La stringa finale mi permette di dare un nome composto al layer
Il composite contiene molto meno rumore rispetto all'immagine di prima.

Posso fare tutto in un'unica riga con il seguente comando:
var calculateComposite = function(year, startDate, endDate, cloudsTh, B1, B2, B3, min, max){
return composite; //Indico quello che voglio avere come output
};
Dentro devo inserire tutto il codice.

Per vedere se funziona devo usare la funzione:
var composite2025 = calculateComposite(2025, "06-01", "08-31", 70, "B4", "B3", "B2", 0, 3000);

Per esportare una funzione usiamo il seguente codice:
exports.calculateComposite = calculateComposite; // Prima il nome della funzione, poi il nome che vogliamo dare
Serve per rendere la funzione open access.

### Link utili
https://custom-scripts.sentinel-hub.com/custom-scripts/sentinel-2/composites/
