// DISTANCE
/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = 
    /* color: #98ff00 */
    /* shown: false */
    ee.Geometry.Polygon(
        [[[11.355140785226325, 44.47883091320929],
          [11.362350563058357, 44.473931427514],
          [11.36526880646656, 44.467071456428634],
          [11.367328742989997, 44.46131335836362],
          [11.375396827706794, 44.469766541228324],
          [11.376426795968513, 44.47258399682832],
          [11.3757401504607, 44.48801634009572],
          [11.375911811837653, 44.495608534365395],
          [11.377971748361091, 44.505403453661664],
          [11.369388679513435, 44.5150743216545],
          [11.355312446603278, 44.52241821251077],
          [11.331451515206794, 44.52706886463324],
          [11.313427070626716, 44.513115794432366],
          [11.298492530831794, 44.51593115661628],
          [11.294715980538825, 44.51287097390149],
          [11.290424446114997, 44.5058931564312],
          [11.276348213204841, 44.49573098101262],
          [11.28396952078723, 44.48595958302883],
          [11.286372780064573, 44.48240793090109],
          [11.311607002476682, 44.48889871781812],
          [11.333236335972776, 44.48510230748526],
          [11.347827553013792, 44.481183173134035]]]),
    wc = ee.ImageCollection("ESA/WorldCover/v200");
/***** End of imports. If edited, may not auto-convert in the playground. *****/

// Define input parameters
var mmu = 5; // minimum mapping unit in numero di pixel: numero minimo di pixel che le aree verdi avranno
// Questo perchè, ci possono essere delle aree che erroneamente vengono idenfiticate come alberi, ma aree verdi troppo piccole non possono essere considerate tali

var pixelsDist = 100; // 1km, ovvero 10m X 100m
// Se un pixel è distante più di 1 km da un'area verde, non va considerato come tale

var outFolder = "outputFolder"
// Crea una variabile per il nome della cartella dove scaricare le immagini

// Define forest mask
var forest = wc.first().eq(10);
Map.addLayer(forest, {}, "forest");
// Il layer che ottengo è di pixel neri (pixel con valore diverso da 10) o bianchi (pixel=10) a seconda dei valori dei pixel

// forest = forest.reproject({
// crs: "EPSG:3035", 
// scale: 10
// });
// Map.addLayer(forest);

// Remove objects smaller than MMU
var smallObj = forest.connectedPixelCount(mmu, false); //false indica di non utilizzare il metodo degli 8 pixel (usa il metodo dei 4 pixel)
Map.addLayer(smallObj, {}, "smallObj");
// Considera i pixel adiacenti (4 o 8 a seconda dei metodi) e rimuove quelli più piccoli della MMU
// In questo caso, scegliendo il metodo dei 4 pixel, eliminiamo i viali, che sono utili ma non sono aree verdi

var isNotSmall = smallObj.gte(mmu);
Map.addLayer(isNotSmall, {}, "isNotSmall");
// Creo una maschera sulla base del codice inserito prima
// Inserisce 0 per i pixel con valori minoria MMU e 1 per i valori maggiori o uguali a MMU

var veg = forest.updateMask(isNotSmall).unmask(0);
Map.addLayer(veg, {}, "veg");
// Uiltizzo la maschera isNotSmall per mascherare le foreste

var dist = veg.fastDistanceTransform(pixelsDist, "pixels",  'manhattan').unmask(pixelsDist); // Calcola la distanza dai pixel classificati come 1
// 1° arg: distanza massima da cui calcolare la distanza, se oltre quella distanza non la calcola ma mette di default la distanza massima;
// 2° arg: unità di misura;
// 3° arg: distanza euclidea, cioè la retta che unisce due punti; distanza manhattan, cioè la somma dei segmenti che producono un angolo retto e permettono di unire i due punti
// La distanza di manhattan è quella più rappresentativa per le città
dist = dist.multiply(10); // from pixels to meters

Map.addLayer(dist, {min:0, max:1000, palette: ["green", "white", "red"]}, "dist"); //max: 1000 perchè 100*10=1000, 1km

dist = dist.reproject({
  crs: "EPSG:3035", 
  scale: 10
});
Map.addLayer(dist, {min:0, max:1000, palette: ["green", "white", "red"]}, "dist reprojected");
// L'immagine non viene riproiettata, ma rimane sempre con una risoluzione spaziale di 10 m
// Dà problemi di calcolo, soprattutto per immagini grandi

// Se vogliamo estrarre statistiche dalla nostra area di studio
var mean = dist.rename("mean").reduceRegion({reducer: ee.Reducer.mean(), geometry: geometry, scale: 10, maxPixels: 1e13, tileScale: 1}); // Prende un'immagine di input e applica un reducer
// Scale: scala, che posso mettere perchè ho riproiettato a una scala precisa
// maxPixels: numero massimo di pixel da elaborare (1e13 numero massimo supportato)

// Ripeto il processo per le altre statistiche
var max = dist.rename("max").reduceRegion({reducer: ee.Reducer.max(), geometry: geometry, scale: 10, maxPixels: 1e13, tileScale: 1}); 

var sd = dist.rename("sd").reduceRegion({reducer: ee.Reducer.stdDev(), geometry: geometry, scale: 10, maxPixels: 1e13, tileScale: 1});

var tooFarPxs = dist.rename("tooFarPxs").gte(300).reduceRegion({reducer: ee.Reducer.sum(), geometry: geometry, scale: 10, maxPixels: 1e13, tileScale: 1});
// Criterio 3-30-300: scrive 1 nelle aree che sono maggiori o uguali a 300m e 0 nelle aree meno distanti di 300m
// Uso l'immagine per estrarre una statistica: la somma indica poi il numero di pixel che non rispetto il criterio

//Per esportare i dati creo una tabella
var table = ee.Feature(null, {
  'mean': mean.get("mean"),
  'sd': sd.get("sd"),
  'max': max.get("max"),
  'tooFarPxs': tooFarPxs.get("tooFarPxs")
});
print(table)

Export.table.toDrive({
  collection: ee.FeatureCollection(table), 
  description: "stats", 
  folder: outFolder,  
  fileFormat: "csv"
});

Export.image.toDrive({
  image: dist, 
  description: "dist", 
  folder: outFolder, 
  region: geometry, 
  scale: 10,   
  maxPixels: 1e13    
});
