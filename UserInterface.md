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

---
## Creare l'interfaccia utente
```js
var loadInputs = function(){

var year             = yearTexbox             .getValue();
var startDate        = startDateTexbox        .getValue();
var endDate          = endDateTexbox          .getValue();
var B1               = B1selectorbox          .getValue();
var B2               = B2selectorbox          .getValue();
var B3               = B3selectorbox          .getValue();
var cloudThreshold   = cloudThresholdSlider   .getValue();
var minCol           = minColSlider           .getValue();
var maxCol           = maxColSlider           .getValue();

return { 
  year             : year,
  startDate        : startDate,
  endDate          : endDate,
  B1               : B1,
  B2               : B2,
  B3               : B3,
  cloudThreshold   : cloudThreshold,
  minCol           : minCol,
  maxCol           : maxCol
};
};

var run = function(){
// load user inputs
var Inputs = loadInputs();
print(Inputs);

// load functions 
var r = require("users/sfrancini/UNIBO:4_app/library"); 
 
// run the function

r.calculateComposite(
Inputs.year,
Inputs.startDate,
Inputs.endDate,
Inputs.cloudThreshold,
Inputs.B1,
Inputs.B2,
Inputs.B3,
Inputs.minCol,
Inputs.maxCol
);

};

var removeLayers = function(){
  Map.clear();
  var widgets = ui.root.widgets();
  if (widgets.length()>2){
  ui.root.remove(ui.root.widgets().get(2));
  }
};

// # input parameters
// run boxes 
var runcalculateCompositeButton = ui.Button('Run');
runcalculateCompositeButton.onClick(run);     
var removeLayersButton = ui.Button('Reset');
removeLayersButton.onClick(removeLayers);

// Text boxes
var Title = ui.Label({value: "Sentinel-2 composites visualizer", style:{
backgroundColor : "#F7E7CE", fontSize: "18px"}});

var yearTexbox = ui.Select({
  items: [
    {label: '2015',       value: "2015"},
    {label: '2016',       value: "2016"},
    {label: '2017',       value: "2017"},
    {label: '2018',       value: "2018"},
    {label: '2019',       value: "2019"},
    {label: '2020',       value: "2020"},
    {label: '2021',       value: "2021"},
    {label: '2022',       value: "2022"},
    {label: '2023',       value: "2023"},
    {label: '2024',       value: "2024"},
    {label: '2025',       value: "2025"}
    ]}).setValue("2025");
    
var startDateTexbox = ui.Textbox({
placeholder: 'startDate (e.g. 05-20)',
value: '07-01',
style: {width: '80px'}});
var endDateTexbox = ui.Textbox({
placeholder: 'endDate (e.g. 09-20)',
value: '08-31',
style: {width: '80px'}});

// See the following link for different bands combinations
// https://custom-scripts.sentinel-hub.com/custom-scripts/sentinel-2/composites/

var B1selectorbox   = ui.Select({
  items: [
    {label: "blue",       value: "B2" },
    {label: "green",      value: "B3" },
    {label: "red",        value: "B4" },
    {label: "Red Edge 1", value: "B5" },
    {label: "Red Edge 2", value: "B6" },
    {label: "Red Edge 3", value: "B7" },
    {label: "NIR",        value: "B8" },
    {label: "Red Edge 4", value: "B8A" },
    {label: "SWIR 1",     value: "B11" },
    {label: "SWIR 2",     value: "B12" }
    ]}).setValue('B4');
var B2selectorbox   = ui.Select({
  items: [
    {label: "blue",       value: "B2" },
    {label: "green",      value: "B3" },
    {label: "red",        value: "B4" },
    {label: "Red Edge 1", value: "B5" },
    {label: "Red Edge 2", value: "B6" },
    {label: "Red Edge 3", value: "B7" },
    {label: "NIR",        value: "B8" },
    {label: "Red Edge 4", value: "B8A" },
    {label: "SWIR 1",     value: "B11" },
    {label: "SWIR 2",     value: "B12" }
    ]}).setValue('B3');
var B3selectorbox   = ui.Select({
  items: [
    {label: "blue",       value: "B2" },
    {label: "green",      value: "B3" },
    {label: "red",        value: "B4" },
    {label: "Red Edge 1", value: "B5" },
    {label: "Red Edge 2", value: "B6" },
    {label: "Red Edge 3", value: "B7" },
    {label: "NIR",        value: "B8" },
    {label: "Red Edge 4", value: "B8A" },
    {label: "SWIR 1",     value: "B11" },
    {label: "SWIR 2",     value: "B12" }
    ]}).setValue('B2');

var cloudThresholdSlider = ui.Slider({min: 0, max: 100, value:70, step: 1,
                             style: { width: '165px', backgroundColor : "#F7E7CE", color: "blue"}});
var cloudThresholdLabel = ui.Label({value: "Maximum percentage of clouds in the image.", 
                  style:{backgroundColor : "#F7E7CE", shown: true}});
var minColSlider = ui.Slider({min: 0, max: 10000, step: 10, value:0,
style: { width: '195px', backgroundColor : "#F7E7CE", color: "darkgreen", shown: true}});
var minColLabel = ui.Label({value: "Value (or one per band) to map onto 00", 
                  style:{backgroundColor : "#F7E7CE", shown: true}});
var maxColSlider = ui.Slider({min: 0, max: 10000, step: 10, value:3000,
style: { width: '195px', backgroundColor : "#F7E7CE", color: "darkgreen", shown: true}});
var maxColLabel = ui.Label({value: "Value (or one per band) to map onto FF", 
                  style:{backgroundColor : "#F7E7CE", shown: true}});
                  
// global  panel
var panel = ui.Panel({style: {width: '300px', backgroundColor: "#F7E7CE", 
border: '2px solid black', textAlign: "center", whiteSpace: "nowrap", shown: true}});

// adding boxes
panel.add(Title);
panel.add(yearTexbox);
panel.add(startDateTexbox);
panel.add(endDateTexbox);
panel.add(B1selectorbox);
panel.add(B2selectorbox);
panel.add(B3selectorbox);
panel.add(cloudThresholdLabel);
panel.add(cloudThresholdSlider);
panel.add(minColLabel);
panel.add(minColSlider);
panel.add(maxColLabel);
panel.add(maxColSlider);
panel.add(runcalculateCompositeButton);
panel.add(removeLayersButton);
ui.root.add(panel);
Map.setOptions('SATELLITE')
// Map.centerObject(ee.Geometry.Point([22, 30]), 4); fassa
```
>
> Serve per rendere la funzione open access.
