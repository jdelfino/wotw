var map;
var projection_wgs;
var projection_smp;
var position;
// == On DOM Ready events =====================================================

function display_pois(data, textStatus, jqXHR) {
    var nodes = data['elements'];
    console.log("FOUND " + nodes.length);
    for(var i = 0; i < nodes.length; i++) {
	// TODO: calc distance
	// TODO: figure out how to display types/tags
	$("#poi_table").append("<tr><th>" + nodes[i]['tags']['name'] + '</th><th>' + nodes[i]['type'] + "</th><th>0.0</th>");
    }
}

$(function() {
    // Define variables for OpenLayers
    var center_lat  = '38.575076';      // Sacramento CA latitude
    var center_lng  = '-121.487761';    // Sacramento CA longitude
    var zoom        = 13;
    var mapnik      = new OpenLayers.Layer.OSM();                // OpenStreetMap Layer
    projection_wgs  = new OpenLayers.Projection("EPSG:4326");    // WGS 1984
    projection_smp  = new OpenLayers.Projection("EPSG:900913");  // Spherical Mercator
    position        = new OpenLayers.LonLat(center_lng, center_lat).transform(projection_wgs, projection_smp);
    
    // Create the map
    map = new OpenLayers.Map('map');    // Argument is the name of the containing div.
    map.addLayer(mapnik);

    var track_layer = new OpenLayers.Layer.PointTrack( "Track", {style: {strokeColor: "red", strokeWidth: 5, strokeOpacity: 0.8} });
    map.addLayer(track_layer);
    
    //console.log($('.points').data('points'));
    var points = $('.points').data('points');
    
    var bbox = {'min_lng': 180, 'min_lat': 90, 'max_lng': -180, 'max_lat':-90};

    function replace_corners(new_lat, new_lng){
	if(new_lng < bbox['min_lng']) { bbox['min_lng'] = new_lng; }
	if(new_lng > bbox['max_lng']) { bbox['max_lng'] = new_lng; }
	
	if(new_lat < bbox['min_lat']) { bbox['min_lat'] = new_lat; }
	if(new_lat > bbox['max_lat']) { bbox['max_lat'] = new_lat; }
    }

    if(points){
	var point_objs = []
	//var google_point_objs = []
	for (var i = 0; i < points.length; i++){
	    var lng = parseFloat(points[i]['long']);
	    var lat = parseFloat(points[i]['lat']);
	    
	    replace_corners(lat, lng);
	    var point_obj = new OpenLayers.LonLat(lng, lat)
		.transform(
		    projection_wgs, // transform from WGS 1984
		    projection_smp // to Spherical Mercator Projection
		);
	    point_objs.push(point_obj);
	    //google_point_objs.append(google.maps.LatLng(lat, lng));

	}
	for (var i = 1; i < point_objs.length; i++) {
	    var origin_feature = new OpenLayers.Feature(track_layer, point_objs[i-1])
	    var dest_feature = new OpenLayers.Feature(track_layer, point_objs[i])
	    track_layer.addNodes([origin_feature, dest_feature]);
	}
	map.setCenter(point_objs[0], zoom);      // Set center of map
    } else {
	map.setCenter(position, zoom);      // Set center of map
    }

    // populate POIs

    var overpass_base_url = "http://overpass-api.de/api/interpreter?data=[out:json];";
    var overpass_output = "out;" // controls return format from overpass

    var request = overpass_base_url + 
	"node[\"name\"](" + bbox['min_lat'] + "," + bbox['min_lng'] + "," + 
	bbox['max_lat'] + "," + bbox['max_lng'] + ");" + 
	overpass_output;

    $.ajax({
	url: request,
	success: display_pois
    });
    // TODO: error callback

});
 