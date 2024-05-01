var countryVisits = {};
var max_value;
var popup;
var last_country_popup;
var geoJson;

var map = L.map('map', { 
    attributionControl:false, 
    maxBoundsViscosity: 0.3,
    minZoom: 2,
    maxZoom: 5,
    autoPan: false,
    maxBounds: [[-90,-180],   [90,180]],
    keyboard:false}).setView([30, 7], 2);

function getColor(id){
    var a = 30
    var b = 60
    var percent = countryVisits[id]/max_value
    var w1 = percent
    var w2 = 1 - w1
    var interpolated = (b * w1) + (a * w2)
    interpolated = interpolated || 70
    return `hsl(205, 100%, ${interpolated}%)`;
}

function getPopupText(e){
    var num = countryVisits[e.target.feature.id];
    if (num === undefined){
        num = 0;
    }
    return String(e.target.feature.properties.name + " : " + num)
}

function highlight(e){
    var layer = e.target;
    var current_country = e.target.feature.id;
    if (current_country != last_country_popup){
        popup = L.popup({
            closeButton: false        
        })
            .setLatLng(e.latlng)
            .setContent(getPopupText(e))
            .openOn(map);
    }

    last_country_popup = e.target.feature.id;
    layer.setStyle({fillOpacity: 0.3});
    layer.bringToFront();
}

function onEachFeature(feature, layer) {
    if("ATA" === layer.feature.id){     //remove antartica
        layer.remove();
    }
    layer.on({
        click: highlight,
        mouseover: highlight,
        mouseout: resetHighlight,
    });
}
function resetHighlight(e) {
    e.sourceTarget.setStyle({fillOpacity:0.4});
    popup.remove();
    last_country_popup = null;
}

function style(feature) {
    return {
        fillColor: getColor(feature.id),
        weight: 0.2,
        color: 'white',
        fillOpacity: 0.4
    };
}


async function fetchCountryData() {
    return await fetch('countries.json', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
        })
        .then((response)=>response.json())
        .then((responseJson)=>{return responseJson});
}

function fetchGeoJson(){
    fetch('https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json', {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
        },
    })
    .then(response => response.json())
    .then(data => {
        fillMap(data);
    })
    .catch(error => {
        console.error('Error fetching GeoJSON:', error);
    });
}
async function fillMap(response){
    geoJson = L.geoJson(response, {style: style(response)}).addTo(map)
    geoJson.eachLayer(function (layer) {
        onEachFeature(layer.feature, layer);
    });

    countryVisits = await fetchCountryData();
    max_value = Math.max(...Object.values(countryVisits));
    geoJson.eachLayer(function (layer) {
        layer.setStyle(style(layer.feature));
    });
    // map.fitWorld();
}


fetchGeoJson();
