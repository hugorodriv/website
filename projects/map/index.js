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
    zoomSnap: 0.25,
    maxBounds: [[-90,-180],   [90,180]],
    keyboard:false}).setView([40, 0], 2);

function getColor(id){
    let a = 25
    let b = 60

    let percent = countryVisits[id]/max_value
    let interpolated = (b * percent) + (a * (1 - percent))

    interpolated = interpolated || 20
    return `hsl(215, 80%, ${interpolated}%)`;
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
            closeButton: false,
            autoPan: false        
        })
            .setLatLng(e.latlng)
            .setContent(getPopupText(e))
            .openOn(map);
    }

    last_country_popup = e.target.feature.id;
    layer.setStyle({fillOpacity: 0.5});
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
    e.sourceTarget.setStyle({fillOpacity:0.8});
    popup.remove();
    last_country_popup = null;
}

function style(feature) {
    return {
        fillColor: getColor(feature.id),
        weight: 0.2,
        color: 'lightgrey',
        fillOpacity: 0.8
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
}

fetchGeoJson();