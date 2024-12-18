var countryVisits = {};
var max_value;
var popup;
var last_country_popup;
var geoJson;
var totalCount = 0

var map = L.map("map", {
    attributionControl: false,
    maxBoundsViscosity: 0.3,
    minZoom: 1,
    maxZoom: 5,
    autoPan: false,
    zoomSnap: 0.25,
    maxBounds: [[-90, -180], [90, 180]],
    keyboard: false
}).setView([60, 0], 1);

function getColor(id) {
    let a = 80
    let b = 50

    let percent = countryVisits[id] / max_value
    let interpolated = (b * percent) + (a * (1 - percent))

    interpolated = interpolated || (a + 7)
    return `hsl(185, ${interpolated}%, ${interpolated + 5}%)`;
}

function getPopupText(e) {
    var num = countryVisits[e.target.feature.id];
    if (num === undefined) {
        num = 0;
    }
    return String(e.target.feature.properties.name + " : " + num)
}

function highlight(e) {
    var layer = e.target;
    popup = L.popup({
        closeButton: false,
        autoPan: false
    })
        .setLatLng(e.latlng)
        .setContent(getPopupText(e))
        .openOn(map);

    last_country_popup = e.target.feature.id;
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
function resetHighlight(e) {
    e.sourceTarget.setStyle({ fillOpacity: 0.8 });
    popup.remove();
    last_country_popup = null;
}

function style(feature) {
    return {
        fillColor: getColor(feature.id),
        weight: 0.2,
        color: "gray",
        fillOpacity: 0.8
    };
}


async function fetchCountryData() {
    return await fetch("countries.json", {
        method: "GET",
        headers: {
            "Accept": "application/json",
        },
    })
        .then((response) => response.json())
        .then((responseJson) => { return responseJson });
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
function updateTimestampParagraph(timestamp) {
    var timestamp_p = document.getElementById("timestamp_paragraph");


    var dateObj = new Date(timestamp * 1000)

    var options = { year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "numeric" };
    timestamp_p.textContent += dateObj.toLocaleDateString("en-IE", options);

}
function uptateTotalCount(totalCount) {
    var count_p = document.getElementById("totalcount_paragraph");
    count_p.textContent = "Total number of visits: " + String(totalCount);
}
async function fillMap(response) {
    geoJson = L.geoJson(response, { style: style(response) }).addTo(map)
    geoJson.eachLayer(function (layer) {
        onEachFeature(layer.feature, layer);
    });

    const CountryJSON = await fetchCountryData();

    countryVisits = CountryJSON["Countries"];
    updateTimestampParagraph(CountryJSON["Timestamp"]);


    max_value = Math.max(...Object.values(countryVisits));
    Object.values(countryVisits).forEach(c => {
        totalCount += c;
    });

    uptateTotalCount(totalCount);


    geoJson.eachLayer(function (layer) {
        layer.setStyle(style(layer.feature));
    });
}

fetchGeoJson();
