
// Store endpoint of API link
var queryURL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson";
// var platesJSON = "PB2002_plates.json";
// var platesJSON = tectonicPlates

// Use d3 to access API endpoint
d3.json(queryURL, function(data) {
    // Once we get a response, send the data.features object to the createFeatures function
        createFeatures(data.features, tectonicPlates.features);
    // createFeatures(data.features);
});

//return color based on value
function getColor(x) {
    return x > 5 ? "#f40202" :
           x > 4 ? "#f45f02" :
           x > 3 ? "#f49702" :
           x > 2 ? "#F4bc02" :
           x > 1 ? "#d8f402" :
           x > 0 ? "#93f402" :
                "#FFEDA0";
}

function createFeatures(earthquakeData, plateData) {

    // Creating a function to style earthquake marks
    function circleStyle(feature) {
        return {
            color: "black",
            fillColor: getColor(feature.properties.mag),
            fillOpacity: 0.85,
            opacity: 1,
            weight: 1,
            stroke: true,
            radius: +feature.properties.mag*4.5
        };
    }
    // creating a function to style plate layer
    function plateStyle() {
        return {
            color: "blue",
            fillOpacity: 0,
        };
    }

    // Create a GeoJSON layer containing the features array on the earthquakeData object
    // Run the onEachFeature function once for each piece of data in the array
    var earthquakes = L.geoJSON(earthquakeData, {
        pointToLayer: function (feature, latlng) {
            return L.circleMarker(latlng, circleStyle(feature));
        },
        onEachFeature: function (feature, layer) {
            layer.bindPopup("<h3>" + feature.properties.place + "<hr>Magnitude: "
            +feature.properties.mag + "</h3><hr><p>" + new Date(feature.properties.time) + "</p>");
        }
    });

    var plates = L.geoJSON(plateData, {
        style: function(feature) {
            return plateStyle(feature)
        },
        onEachFeature: function (feature, layer) {
            layer.bindPopup("<h3>" + feature.properties.PlateName + "</h3>");
        }
    });
  
    // Sending our earthquakes layer to the createMap function
    createMap(earthquakes, plates);
}

function createMap(earthquakes, plates) {

    // Define streetmap and darkmap layers
    var streetmap = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
        attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
        maxZoom: 18,
        id: "mapbox.streets",
        accessToken: API_KEY
    });
  
    var darkmap = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
        attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
        maxZoom: 18,
        id: "mapbox.dark",
        accessToken: API_KEY
    });

    var satmap = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
        attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
        maxZoom: 18,
        id: "mapbox.streets-satellite",
        accessToken: API_KEY
    });
  
    // Define a baseMaps object to hold our base layers
    var baseMaps = {
      "Street Map": streetmap,
      "Dark Map": darkmap,
      "Satellite Map": satmap
    };
  
    // Create overlay object to hold our overlay layer
    var overlayMaps = {
      // Earthquakes: earthquakes,
      Plates: plates,
    };
  
    // Create our map, giving it the streetmap and earthquakes layers to display on load
    var myMap = L.map("map", {
      center: [
        37.09, -95.71
      ],
      zoom: 5,
    //   ********
    // time dimension code that is not necessary
      timeDimension: true,
      timeDimensionOptions: {
        timeInterval : "P1W/today",
        period: "P1D",
        autoPlay: true
      },
      timeDimensionControl: true,
      timeDimensionControlOptions: {
        loopButton: true,
        autoPlay: true
      },
    // *********
      layers: [streetmap, plates]
    });
  
    // Create a layer control
    // Pass in our baseMaps and overlayMaps
    // Add the layer control to the map
    L.control.layers(baseMaps, overlayMaps, {
      collapsed: false
    }).addTo(myMap);



// Set up the legend
var legend = L.control({ position: "bottomright" });
legend.onAdd = function() {
    var div = L.DomUtil.create("div", "info legend");
    var limits = [0,1,2,3,4,5];
    var colors = ["#93f402", "#d8f402", "#F4bc02", "#f49702", "#f45f02", "#f40202"];
    // var labels = [];

    for (var i = 0; i < limits.length; i++) {
        div.innerHTML += "<i style='background: " + colors[i] + "'></i> " +
          limits[i] + (limits[i + 1] ? "&ndash;" + limits[i + 1] + "<br>" : "+");
      }

return div;
};

// Adding legend to the map
legend.addTo(myMap);


//add time timeDimension
//based on example from: http://jsfiddle.net/bielfrontera/5afucs89/
L.TimeDimension.Layer.GeoJson.GeometryCollection = L.TimeDimension.Layer.GeoJson.extend({
    // Do not modify features. Just return the feature if it intersects the time interval
    _getFeatureBetweenDates: function(feature, minTime, maxTime) {
      var time = new Date(feature.properties.time);
        if (time > maxTime || time < minTime) {
            return null;
        }
        return feature;
    }
  });
  var timeLayer = L.timeDimension.layer.geoJson.geometryCollection = function(layer, options) {
    return new L.TimeDimension.Layer.GeoJson.GeometryCollection(layer, options);
  };


  geoJsonTimeLayer = L.timeDimension.layer.geoJson.geometryCollection(earthquakes, {
    // updateTimeDimension: true,
    updateTimeDimensionMode: 'replace',
    duration: 'PT6H',
    }).addTo(myMap);
}