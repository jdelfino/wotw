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
    
    //console.log($('.points').data('points'));
    var points = $('.points').data('points');
    
    var bbox = {'min_long': 180, 'min_lat': 90, 'max_long': -180, 'max_lat':-90};

    function replace_corners(new_lat, new_long){
	if(new_long < bbox['min_long']) { bbox['min_long'] = new_long; }
	else if(new_long > bbox['max_long']) { bbox['max_long'] = new_long; }
	
	if(new_lat < bbox['min_lat']) { bbox['min_lat'] = new_lat; }
	else if(new_lat > bbox['max_lat']) { bbox['max_lat'] = origin_lat; }
    }

    if(points){
	for (var i = 1; i < points.length; i++) {
	    var origin_long = parseFloat(points[i-1]['long']);
	    var origin_lat = parseFloat(points[i-1]['lat']);
	    var dest_long = parseFloat(points[i]['long']);
	    var dest_lat = parseFloat(points[i]['lat']);
	    
	    replace_corners(origin_long, origin_lat);
	    replace_corners(dest_long, dest_lat);

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

    // populate POIs

    //"http://overpass-api.de/api/interpreter?data=[out:json];node[%22highway%22](50.7,7.1,50.8,7.2);out;"
    var overpass_base_url = "http://overpass-api.de/api/interpreter?data=[out:json]";
    var overpass_output = "out;" // controls return format from overpass

    var request = overpass_base_url + 
	"node(" + bbox['min_lat'] + "," + bbox['min_long'] + "," + 
	bbox['max_lat'] + "," + bbox['max_long'] + ");" + 
	overpass_output;

    // TODO: send
    // TODO: success callback
    // TODO: error callback

});
 