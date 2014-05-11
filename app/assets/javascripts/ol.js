var map;
var projection_wgs;
var projection_smp;
var position;
// == On DOM Ready events =====================================================
$(function() {
	// Define variables for OpenLayers
	var center_lat  = '38.575076';      // Sacramento CA latitude
	var center_lon  = '-121.487761';    // Sacramento CA longitude
	var zoom        = 13;
	var mapnik      = new OpenLayers.Layer.OSM();                // OpenStreetMap Layer
	projection_wgs  = new OpenLayers.Projection("EPSG:4326");    // WGS 1984
	projection_smp  = new OpenLayers.Projection("EPSG:900913");  // Spherical Mercator
	position        = new OpenLayers.LonLat(center_lon, center_lat).transform(projection_wgs, projection_smp);
 
	// Create the map
	map = new OpenLayers.Map('map');    // Argument is the name of the containing div.
	map.addLayer(mapnik);
	map.setCenter(position, zoom);      // Set center of map
 
    });
 