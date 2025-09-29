# Google Earth Engine
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
