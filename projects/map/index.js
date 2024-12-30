var countryData = {};
var max_value;
var popup;
var last_country_popup;
var geoJson;
var reqCount = 0
var visitorsCount = 0

var map = L.map("map", {
    attributionControl: false,
    maxBoundsViscosity: 0.3,
    minZoom: 1,
    maxZoom: 5,
    autoPan: false,
    zoomSnap: 0.25,
    maxBounds: [[-90, -180], [90, 180]],
    keyboard: false
}).setView([90, 0], 1.5);

function getColor(id) {
    let a = 80
    let b = 50
    let percent = NaN


    if (id != -1 && typeof countryData[id] !== "undefined") {
        percent = countryData[id][0] / max_value; // for the coloring we use the request number
    }

    let interpolated = (b * percent) + (a * (1 - percent))

    interpolated = interpolated || (a + 7)
    return `hsl(185, ${interpolated}%, ${interpolated + 5}%)`;
}

function getPopupText(e) {
    let dataArr = countryData[e.target.feature.id];
    let numReq = 0
    let numVisitors = 0

    if (typeof dataArr !== "undefined") {
        numReq = dataArr[0]
        numVisitors = dataArr[1]
    }

    return String(
        "<center>" +
        e.target.feature.properties.name + "<br><br>" +
        "Total req. : " + numReq + "<br>" +
        "Unique visitors: " + numVisitors +
        "</center>"
    )

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

function style(id) {
    if (id == -1) {
        return {
            fillColor: getColor(-1),
            weight: 0.2,
            color: "gray",
            fillOpacity: 0.8
        };
    }
    return {
        fillColor: getColor(id),
        weight: 0.2,
        color: "gray",
        fillOpacity: 0.8
    };
}


async function fetchCountryData() {
    // this JSON file cointains a list of country codes followed by a list of two ints: 
    // The first one being the amount of req of that country, and the second is the amount of unique visitors

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
function uptateTotalCount(totalCount, visitorsCount) {
    let reqCountP = document.getElementById("reqCountP");
    let visCountP = document.getElementById("visitCountP");

    reqCountP.textContent = String(reqCount)
    visCountP.textContent = String(visitorsCount)
}
async function fillMap(response) {
    // geoJson = L.geoJson(response, { style: style(response) }).addTo(map)
    geoJson = L.geoJson(response, { style: style(-1) }).addTo(map)
    geoJson.eachLayer(function (layer) {
        onEachFeature(layer.feature, layer);
    });

    const CountryJSON = await fetchCountryData();

    countryData = CountryJSON["Countries"];
    updateTimestampParagraph(CountryJSON["Timestamp"]);


    max_value = -1

    Object.values(countryData).forEach(c => {
        reqCount += c[0];
        visitorsCount += c[1];

        max_value = Math.max(c[0], max_value)
    });
    uptateTotalCount(reqCount, visitorsCount);


    geoJson.eachLayer(function (layer) {
        console.log(layer.feature.id)
        console.log(style(layer.feature.id))
        layer.setStyle(style(layer.feature.id));
    });
}

fetchGeoJson();
