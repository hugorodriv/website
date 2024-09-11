var countryVisits = {};
var max_value;
var popup;
var last_country_popup;
var geoJson;
var currentlyUpdating = [];

var map = L.map("map", {
    attributionControl: false,
    maxBoundsViscosity: 0.3,
    minZoom: 1.5,
    maxZoom: 5,
    autoPan: false,
    zoomSnap: 0.25,
    maxBounds: [[-90, -180], [90, 180]],
    keyboard: false
}).setView([40, 0], 1.5);

function getPopupText(e) {
    var num = countryVisits[e.target.feature.id];
    if (num === undefined) {
        num = 0;
    }
    return String(e.target.feature.properties.name)
}

function onEachFeature(feature, layer) {
    if ("ATA" === layer.feature.id) {     //remove antartica
        layer.remove();
    }
    layer.on({
        mouseout: resetHighlight,
        mouseover: highlight,
        click: highlight
    });
}

function fetchGeoJson() {
    fetch("https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json", {
        method: "GET",
        headers: {
            "Accept": "application/json",
        },
    })
        .then(response => response.json())
        .then(data => {
            fillMap(data);
        })
        .catch(error => {
            console.error("Error fetching GeoJSON:", error);
        });
}

async function fillMap(response) {
    geoJson = L.geoJson(response, {
    }).addTo(map)

    geoJson.eachLayer(function (layer) {
        layer.setStyle({
            fillColor: `hsl(185, 80%, 40%)`,
            weight: 0.2,
            color: "lightgrey",
            fillOpacity: 0.8
        });
    });
}
fetchGeoJson();

function fadeOut(layer) {
    let id = layer.feature.id;
    if (currentlyUpdating.includes(id)) {
        console.log(id)
        return
    }
    currentlyUpdating.push(id)
    console.log(currentlyUpdating)

    let a = 70 // maximum
    let b = 40 // minimum

    let percent = 0
    let interpolated = (b * percent) + (a * (1 - percent))

    let delay = 15
    let step = 0.01

    let timer = setTimeout(function changeOpacity() {
        if (percent < 1.0) {
            interpolated = (b * percent) + (a * (1 - percent))
            layer.setStyle({
                fillColor: `hsl(185, 80%, ${interpolated}%)`
            });
            percent += step
        }

        timer = setTimeout(changeOpacity, delay);
    }, delay)

    currentlyUpdating = currentlyUpdating.filter(function (e) { return e !== id })
}
function processEvent(event) {
    textArr = event.match(/.{1,3}/g);
    textArr.forEach(country => {
        try {
            geoJson.eachLayer(function (layer) {
                if (layer.feature.id == country) {
                    fadeOut(layer);
                }
            });

        } catch (_) {

        }
    });
}

fetch("//hugor.me:8080/instant_events").then(response => {
    const reader = response.body.getReader();

    function read() {
        reader.read().then(({ done, value }) => {
            if (done) {
                return;
            }
            const text = new TextDecoder().decode(value);

            processEvent(text);

            read();
        }).catch(error => {
        });
    }

    read();
}).catch(error => {
});
