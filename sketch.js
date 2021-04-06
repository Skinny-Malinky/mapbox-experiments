mapboxgl.accessToken = config.accessToken;
var origin = [-4.07472222, 55.79861111, 0];
var map = new mapboxgl.Map({
	container: "map",
	style: "mapbox://styles/struanfraser/ckbxmg3u028071ips08qy6b65",
	center: origin,
	type: "geojson",
	zoom: 6.5,
	pitch: 60,
	heading: 41,
});

var geoData = {
	type: "FeatureCollection",
	features: [],
};
let extColor = "rgb(97, 46, 23)";
const latGirth = 0.02; // 0.01;
const longGirth = 0.02; //0.005
let tempArr = [];
d3.csv("data/aquaculture-pollution.csv").then(function (data) {
	data.forEach((d) => {
		let coords = {};
		coords = toLatLon(d.Easting, d.Northing, 30, "V", undefined, false);
		coords.latitude += 50;
		if (d.Year == "01-Sep-2020" && d.Mortalities_Kilograms > 10000) {
			d.coordinates = coords;
			d.distMultiplier = 0;
			tempArr.push(d);
		}
	});
	tempArr.sort(function (a, b) {
		let result = a.Northing - b.Northing;
		if (result == 0) {
			result = a.Easting - b.Easting;
		}
		return result;
	});
	const distance = 0.01;
	for (let i = 0; i < tempArr.length; i++) {
    let distanceMod;
		if (
			i != 0 &&
			(tempArr[i].coordinates.latitude - tempArr[i - 1].coordinates.latitude) < 1 &&
			(tempArr[i].coordinates.longitude - tempArr[i - 1].coordinates.longitude) < 1
		) {
			tempArr[i].distMultiplier = tempArr[i - 1].distMultiplier + 1;
      distanceMod = (tempArr[i].distMultiplier * (longGirth*2 + distance));
      // console.log(distanceMod, tempArr[i].coordinates.longitude);
			// tempArr[i].coordinates.longitude += distanceMod;
      // console.log(tempArr[i].coordinates.longitude);
      // console.log(tempArr[i].coordinates.longitude, tempArr[i].distMultiplier, distance)
		}
    // console.log(tempArr[i].distMultiplier, tempArr[i].coordinates.latitude, tempArr[i].coordinates.longitude);
		geoData.features.push({
			type: "Feature",
			properties: {
				level: 1,
				height: parseInt(tempArr[i].Mortalities_Kilograms),
				base_height: 0,
				color: extColor,
			},
			geometry: {
				coordinates: [
					[
						[
							parseInt(tempArr[i].coordinates.longitude) + longGirth + distanceMod,
							parseInt(tempArr[i].coordinates.latitude) - latGirth,
						],
						[
							parseInt(tempArr[i].coordinates.longitude) - longGirth + distanceMod,
							parseInt(tempArr[i].coordinates.latitude) - latGirth,
						],
						[
							parseInt(tempArr[i].coordinates.longitude) - longGirth + distanceMod,
							parseInt(tempArr[i].coordinates.latitude) + latGirth,
						],
						[
							parseInt(tempArr[i].coordinates.longitude) + longGirth + distanceMod,
							parseInt(tempArr[i].coordinates.latitude) + latGirth,
						],
						[
							parseInt(tempArr[i].coordinates.longitude) + longGirth + distanceMod,
							parseInt(tempArr[i].coordinates.latitude) - latGirth,
						],
					],
				],
				type: "Polygon",
			},
		});
	}
});

map.on("load", function () {
	console.log(geoData);
	map.addSource("aq-pollution", {
		// GeoJSON Data source used in vector tiles, documented at
		// https://gist.github.com/ryanbaumann/a7d970386ce59d11c16278b90dde094d
		type: "geojson",
		data: geoData,
	});
	map.addLayer({
		id: "aquaculture-pollution",
		type: "fill-extrusion",
		source: "aq-pollution",
		paint: {
			"fill-extrusion-color": ["get", "color"],
			"fill-extrusion-height": ["get", "height"],
			"fill-extrusion-base": ["get", "base_height"],
			"fill-extrusion-opacity": 1,
		},
	});
});

// Largest KG of mortalities is 259265.08860739 produced by Mowi Scotland