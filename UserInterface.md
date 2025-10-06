# Interfaccia utente (User Interface, UI)
```var calculateComposite = function(year, startDate, endDate, cloudsTh, B1, B2, B3, min, max)```
> min e max indicano di quanto vengono riscalati i pixel.
> Se è da 0 a 10.000, il pixel per avere luminosità massima deve avere un valore di 10.000, mentre la luminosità minima corrisponde a 0.

## Creare una image collection
```js
ee.ImageCollection()
  .filter() // Permette di usare una proprietà delle immagini per filtrare (es. ```'CLOUDY_PIXEL_PERCENTAGE'```)
  .filterDate() //Permette di filtrare i dati
```

> [!NOTE]
>
> In JavaScript il +, usato con le stringhe, serve per unirle (es. ```var startDateWithYear = year+"-"+startDate```, dove year e startDate sono due variabili)

Con la funzione ```print(S2.first())``` stampiamo solo il primo elemento: lo si fa per vedere se è tutto okay, se il numero di elementi è troppo alto.


## Mascherare le nuvole
Per mascherare le nuvole ci sono vari metodi: il più utilizzato è il metodo SCL, che classifica i pixel in varie classi, di cui alcune sono utili, altre vanno mascherate.
Per costruire una funzione per mascherare le nuvole:
```js
var maskClouds = function(img){
 var SCL = img.select("SCL");
 var vegetation = SCL.eq(4); // Usando .eq() dico che il pixel deve valere 1 se è di classe 4, 0 in tutti gli altri casi
 var soil = SCL.eq(5);
 var water = SCL.eq(6);
 var mask = soil.or(water).or(vegetation); // Con .or() il pixel deve valere 1 se è vegetazione o acqua, 0 in tutti gli altri casi
 var maskedImage = img.updateMask(mask); // L'immagine di input rimane inalterata se il pixel vale 1; è cancellata se vale 0
 return maskedImage;
};

var S2_masked = S2.map(maskClouds) // Applica all'immagine la maschera creata sopra
```
Quello che noi osserviamo è l'ultima immagine caricata.
Nell'immagine con la maschera, vengono eliminate le immagine dove i pixel hanno valori di riflettanza elevatissimi, perchè corrispondono alle nuvole, che infatti sono bianche.

> [!NOTE]
>
> Tra parentesi tonde abbiamo gli argomenti, tra parentesi graffe l'effetto che quella funzione ha con l'argomento.

### Creare un composite
```js
var composite = S2_masked.median(); // Creo un composite con la mediana
Map.addLayer(composite, {min:min, max:max, bands:[B1, B2, B3]}, startDateWithYear+"/"+endDateWithYear+"_"+B1+"-"+B2+"-"+B3);
```
> La stringa finale mi permette di dare un nome composto al layer
>
> Il composite contiene molto meno rumore rispetto all'immagine di prima.

## Creare una funzione unica
Posso fare tutto in un'unica riga con il seguente comando:
```js
var calculateComposite = function(year, startDate, endDate, cloudsTh, B1, B2, B3, min, max){
return composite; //Indico quello che voglio avere come output
};
```
> Tra la riga di ```var``` e quella di ```return``` devo inserire tutto il codice.

> [!NOTE]
>
> Conviene definire tutti i parametri all'inizio per rendere il codice più pulito.

Per vedere se funziona, devo usare: ```var composite2025 = calculateComposite(2025, "06-01", "08-31", 70, "B4", "B3", "B2", 0, 3000)```

### Esportare una funzione
Per esportare una funzione: ```exports.calculateComposite = calculateComposite```
> Prima inserisco il nome della funzione, poi il nome che le voglio dare
>
> Serve per rendere la funzione open access.
