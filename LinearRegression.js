// prepare refence data
nfi_gsv = nfi_gsv.filterBounds(geometry);
// Map.addLayer(nfi_gsv)

// prepare predictors 
var library = require("users/sfrancini/speciesClassification:library"); 

// Medoid composite
var medoidVariables = library.medoidComposite("2018-06-15", "2018-08-15", "2018");
Map.addLayer(medoidVariables, {bands: ["2018red", "2018green", "2018blue"], min:0, max: 3000})

// Temperature
var temperature = c.filter(ee.Filter.calendarRange(2010, 2020, "year"))
.select("mean_2m_air_temperature").mean().subtract(273.15);
// Precipitation
var precipitation = c.filter(ee.Filter.calendarRange(2010, 2020, "year"))
.select("total_precipitation").median();

//  merge the images
var predictors = ee.Image.cat([medoidVariables, 
                               dem.select(0).mean(),
                               temperature,
                               precipitation])
                               .addBands(ee.Image.pixelCoordinates('EPSG:4326'))
                               .float();

// STEP 1 *******************************************************************************************************

// Perform the extraction and create the training dataset that combines the independent variables (predictors) 
// with the dependent variable (nfi gsv)

var trainingDataset = predictors.reduceRegions({
collection: nfi_gsv, 
reducer: ee.Reducer.first(), 
scale: 20
});

Export.table.toAsset({
collection: trainingDataset, 
description: "trainingDataset", 
assetId: "projects/planetunifi/assets/UNIBO/trainingDataset"
})

// STEP 2 *******************************************************************************************************

Map.addLayer(trainingDataset_loaded)
print(trainingDataset_loaded)

// calculate m and q
var fit = trainingDataset_loaded.reduceColumns({
  reducer: ee.Reducer.linearFit(),
  selectors: ['2018NDVI', 'Vapv_ha']
});

print(fit)

var m = ee.Number(fit.get("scale"));
var q = ee.Number(fit.get("offset"));

print(m)
print(q)

// make the prediction using the calculated regression coefficients
var predictedGSVmap = medoidVariables.select("2018NDVI").multiply(m).add(q);

Map.addLayer(predictedGSVmap.clip(geometry), {min:0, max:500, palette: ["white", "yellow", "lightgreen", "green", "darkgreen"]})

// calculate RMSE and visualize
var trainingDataset_loaded_withPredictions = trainingDataset_loaded.map(function(f){
  var NDVI = ee.Number(f.get("2018NDVI"));
  var Vapv_ha = ee.Number(f.get("Vapv_ha"));
  var prediction = NDVI.multiply(m).add(q);
  var scarto = Vapv_ha.subtract(prediction)
  var scarto2 = scarto.pow(2)
  return f.set("prediction", prediction).set("scarto", scarto).set("scarto2", scarto2)
})

print(trainingDataset_loaded_withPredictions)

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

// Mostra il grafico
print(chart_NDVIvsVapv);

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

// Mostra il grafico
print(chart);

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

var mediaScarti = trainingDataset_loaded_withPredictions.aggregate_mean('scarto');
print('mediaScarti:', mediaScarti.round());

var mse = trainingDataset_loaded_withPredictions.aggregate_mean('scarto2');
print('mse:', mse);
var rmse = ee.Number(mse).sqrt();
print('RMSE:', rmse);
