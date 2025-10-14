// DEM: Digital Elevation Model, che indica per ogni pixel la quota

// Prepare refence data
nfi_gsv = nfi_gsv.filterBounds(geometry);
// Map.addLayer(nfi_gsv)

// prepare predictors 
var library = require("users/sfrancini/speciesClassification:library"); 

// Medoid composite
var medoidVariables = library.medoidComposite("2018-06-15", "2018-08-15", "2018"); //Funzione per calcolare il medoid che calcola anche degli indici
Map.addLayer(medoidVariables, {bands: ["2018red", "2018green", "2018blue"], min:0, max: 3000})

// Temperature
var temperature = c.filter(ee.Filter.calendarRange(2010, 2020, "year"))
                   .select("mean_2m_air_temperature").mean().subtract(273.15); // Con .substract() passo dai °K ai °C

// Precipitation
var precipitation = c.filter(ee.Filter.calendarRange(2010, 2020, "year"))
                     .select("total_precipitation").median();


//  Merge the images
// Crea un'immagine, chiamata predictors, che contiene tutti i predittori, cioè le variabili indipendenti
var predictors = ee.Image.cat([medoidVariables, 
                               dem.select(0).mean(),
                               temperature,
                               precipitation])
                               .addBands(ee.Image.pixelCoordinates('EPSG:4326')) //Aggiungo una banda che indica per ogni pixel le coordinate di latitudine e longitudine
                               .float();

// STEP 1 *******************************************************************************************************
// Creo il dataset di training e lo salvo

// Perform the extraction and create the training dataset that combines the independent variables (predictors) with the dependent variable (nfi gsv)
var trainingDataset = predictors.reduceRegions({
                                                collection: nfi_gsv, 
                                                reducer: ee.Reducer.first(), // Prende il pixel più vicino
                                                scale: 20 // Risoluzione spaziale
});

// Salvo i dati sottoforma di tabella
Export.table.toAsset({
                    collection: trainingDataset, //Collection da esportare
                    description: "trainingDataset", //Nome che gli do
                    assetId: "projects/planetunifi/assets/UNIBO/trainingDataset" //Percorso dell'asset (dato) che ho salvato
})
// Una volta che ho salvato i dati, posso commentare lo Step 1 e procedere solo con lo Step 2

// STEP 2 *******************************************************************************************************

Map.addLayer(trainingDataset_loaded)
print(trainingDataset_loaded)

// calculate m and q
var fit = trainingDataset_loaded.reduceColumns({
                                                reducer: ee.Reducer.linearFit(), //Reducer che applico (regressione lineare)
                                                selectors: ['2018NDVI', 'Vapv_ha'] //Colonne a cui applico il reducer
});

print(fit) //Stampa il risultato
//Offset: q; Scale: m

var m = ee.Number(fit.get("scale"));
var q = ee.Number(fit.get("offset"));

print(m)
print(q)

// make the prediction using the calculated regression coefficients
var predictedGSVmap = medoidVariables.select("2018NDVI").multiply(m).add(q);
// Applico il modello, sostituendo i valori di m e q e la x (NDVI) e y (volume)
// All'inizio noi conoscevamo solo la biomassa e il volume di alcuni punti discreti
// Integrando l'infromazione a terra con l'immagine satellitare, possiamo spazializzare, cioè estendere i dati a un'intera area di studio

Map.addLayer(predictedGSVmap.clip(geometry), {min:0, max:500, palette: ["white", "yellow", "lightgreen", "green", "darkgreen"]})
// min: 0 m3/ha e max: 500 m3/ha

// L'NDVI da solo non consente di ottenere un dato accurato

// Per vedere se il modello funziona, calcolo dei parametri di performance, come il Mean Square Error (MSE)
// L'MSE ha il problema che è poco leggibile, perchè non è nelle stesse unità di misura della variabile, in quanto è al quadrato
// Si calcola perciò il Root Mean Square Error, che corrisponde alla radice quadrata dell'MSE, che ha la stessa unità di misura della variabile
// calculate RMSE and visualize
var trainingDataset_loaded_withPredictions = trainingDataset_loaded.map(function(f){
   var NDVI = ee.Number(f.get("2018NDVI"));
   var Vapv_ha = ee.Number(f.get("Vapv_ha"));
   var prediction = NDVI.multiply(m).add(q);
   var scarto = Vapv_ha.subtract(prediction)
   var scarto2 = scarto.pow(2) // 2 perchè è al quadrato
   return f.set("prediction", prediction).set("scarto", scarto).set("scarto2", scarto2)
})
print(trainingDataset_loaded_withPredictions)

// Calcolo la media degli scarti, che dovrebbe essere 0
// Il valore è 0 perchè stiamo usando la regressione lineare, che tende a bilanciare gli scarti
var mediaScarti = trainingDataset_loaded_withPredictions.aggregate_mean('scarto');
print('mediaScarti:', mediaScarti.round());

// Mean Square Error
var mse = trainingDataset_loaded_withPredictions.aggregate_mean('scarto2');
print('mse:', mse);

// Root Mean Square Error: indica l'errore atteso, più leggibile perchè è nelle stesse unità di misura della variabile
var rmse = ee.Number(mse).sqrt();
print('RMSE:', rmse);
// Ha un valore molto alto perchè l'NDVI da solo non basta

// Creo dei grafici
var chart_NDVIvsVapv = ui.Chart.feature.byFeature({
  features: trainingDataset_loaded_withPredictions,
  xProperty: '2018NDVI',
  yProperties: ['Vapv_ha']
})
.setChartType('ScatterChart')
.setOptions({
  title: 'Scatter plot tra x e y',
  hAxis: {title: 'NDVI'},
  vAxis: {title: 'Vapv_ha'},
  pointSize: 6,
  colors: ['#1f77b4']
});
print(chart_NDVIvsVapv); // Mostra il grafico

var chart = ui.Chart.feature.byFeature({
  features: trainingDataset_loaded_withPredictions,
  xProperty: 'prediction',
  yProperties: ['Vapv_ha']
})
.setChartType('ScatterChart')
.setOptions({
  title: 'Scatter plot tra x e y',
  hAxis: {title: 'prediction'},
  vAxis: {title: 'reference'},
  pointSize: 6,
  colors: ['#1f77b4']
});
print(chart); // Mostra il grafico
// Vedo perrfettamente che l'NDVI da solo non basta
// Riesce però a discriminare quei pixel a bassa presenza di biomassa

// 
var histogram = ui.Chart.feature.histogram({
  features: trainingDataset_loaded_withPredictions,
  property: 'scarto',
  minBucketWidth: 50  // ampiezza dei bin
})
.setOptions({
  title: 'Distribuzione scarti',
  hAxis: {title: 'scarti'},
  vAxis: {title: 'Frequenza'},
  colors: ['#1b9e77']
});

print(histogram);
// Volume misurato (y) e volume predetto (x)
// Gli ultimi due grafici sono identici
