// Make a FeatureCollection from the hand-made geometries.
var polygons = ee.FeatureCollection([
 ee.Feature(Forest, {'class': 0}),
 ee.Feature(nonForest, {'class': 1})
]);
print(polygons);
// Map.addLayer(polygons);

// calculate BAP composite
var library = require("users/sfrancini/bap:library"); 
var BAPCS = library.BAP(null, "08-01", 30, 70, 0.7, 0.2, 0.3, 1500); // La funzione del BAP prende diversi argomenti: target day, days range, percentuale di copertura delle nuvole
var predictors = BAPCS.filter(ee.Filter.calendarRange(2022, 2022, "year")).first();
print(predictors)
// var predictors = BAP_300_2010;

// 
// Use these bands for prediction.
var bands = ["blue", "green", "red", "nir", "swir1", "swir2"];
// var bands = BAP_300_2010.bandNames()

// Get the values for all pixels in each polygon in the training.
var training = predictors.sampleRegions({
// Get the sample from the polygons FeatureCollection.
collection: polygons,
// Keep this list of properties from the polygons.
properties: ['class'],
// Set the scale to get Landsat pixels in the polygons.
scale: 30
});

// print(training.first());
// print(training.size());

// Create an RF classifier with custom parameters.
var classifier = ee.Classifier.smileRandomForest({numberOfTrees:10})
// 
// Train the classifier.
var trained = classifier.train(training, 'class', bands);

// Classify the image.
var classified = predictors.classify(trained);

// Display the classification result and the input image.
Map.setCenter(-62.836, -9.2399, 11);
Map.addLayer(predictors, 
{bands: ['red', 'green', 'blue'], min:0, max:2500}, "RGB BAP");
Map.addLayer(polygons, {}, 'training polygons');
Map.addLayer(classified,
           {min: 0, max: 1, palette: ['green', 'red']},
           'deforestation');

// see the accuracy
var accuracy = trained.confusionMatrix().aside(print, "confusion matrix");
var performanceParameters = ee.Feature(null, {
overallAccuracy: accuracy.accuracy(),
kappa: accuracy.kappa(),
userAccuracy: accuracy.consumersAccuracy(),
producerAccuracy:accuracy.producersAccuracy()});
print(performanceParameters);
