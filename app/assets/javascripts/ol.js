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
    var track_layer = new OpenLayers.Layer.PointTrack( "Track", {style: {strokeColor: "red", strokeWidth: 5, strokeOpacity: 0.8} });
    map.addLayer(track_layer);
    
    console.log($('.points').data('points')); //#points.data('points'))
    var points = $('.points').data('points');
    
    if(points){
	for (var i = 1; i < points.length; i++) {
	    var origin = new OpenLayers.LonLat(parseFloat(points[i-1]['long']), parseFloat(points[i-1]['lat']))
		.transform(
		    projection_wgs, // transform from WGS 1984
		    projection_smp // to Spherical Mercator Projection
		);

	    var dest = new OpenLayers.LonLat(parseFloat(points[i]['long']), parseFloat(points[i]['lat']))
		.transform(
		    projection_wgs, // transform from WGS 1984
		    projection_smp // to Spherical Mercator Projection
		);

	    var origin_feature = new OpenLayers.Feature(track_layer, origin)
	    var dest_feature = new OpenLayers.Feature(track_layer, dest)

	    track_layer.addNodes([origin_feature, dest_feature]);
	}
	map.setCenter(origin, zoom);      // Set center of map
    } else {
	map.setCenter(position, zoom);      // Set center of map
    }
});
 