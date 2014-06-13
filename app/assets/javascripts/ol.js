var map;
var projection_wgs;
var projection_smp;
var position;
var polyline; // TODO: better name
var TOLERANCE = 1/1110; // 100 meters (111km ~= 1 degree)
var markers;

// TODO: really, most of this work should be done on the server via a controller,
// rather than pushing it to the client. 

function distance_down_path(point, polypath) {
    var path = polypath.getPath(), len = path.getLength(), dist = 0;
    for(var i=0; i < len-1; i++){
	var curpoint = path.getAt(i);
	var nextpoint = path.getAt(i+1);
	var segment = new google.maps.Polyline({path: [curpoint, nextpoint]});
	if(google.maps.geometry.poly.isLocationOnEdge(point, segment, TOLERANCE)) {
	    dist += google.maps.geometry.spherical.computeDistanceBetween(curpoint, point);
	    break;
	} else {
	    dist += google.maps.geometry.spherical.computeDistanceBetween(curpoint, nextpoint);
	}
    } 
    return dist.toFixed(2); 
}

function addMarker(ll, popupContentHTML) {

    var feature = new OpenLayers.Feature(markers, ll); 
    feature.closeBox = true;
    feature.popupClass = OpenLayers.Class(OpenLayers.Popup.Anchored, {'autoSize': true});
    feature.data.popupContentHTML = popupContentHTML;
    feature.data.overflow = "auto";
    
    var marker = feature.createMarker();
    
    var markerClick = function (evt) {
        if (this.popup == null) {
            this.popup = this.createPopup(this.closeBox);
            map.addPopup(this.popup);
            this.popup.show();
        } else {
            this.popup.toggle();
        }
        currentPopup = this.popup;
        OpenLayers.Event.stop(evt);
    };
    marker.events.register("mousedown", feature, markerClick);
    
    markers.addMarker(marker);
}

function display_pois(data, textStatus, jqXHR) {
    var nodes = data['elements'];
    for(var i = 0; i < nodes.length; i++) {
	var pt = new google.maps.LatLng(nodes[i]['lat'], nodes[i]['lon']);
	var tags = ""
	for(var tag in nodes[i]['tags']){
	    if(tag.indexOf(':') == -1 && tag != "name" && tag != "ele") {
		var key = tag.charAt(0).toUpperCase() + tag.slice(1).replace(/_/g, " ");
		var val = nodes[i]['tags'][tag].replace(/_/g, " ");
		tags += key + ": " + val + "<br/>";
	    }
	}

	// note that this is super inefficient. we fetch a square bounding box
	// from the OSM api, then post filter on the client to POIs close to
	// our route. would be better to smartly construct a polygon and use that,
	// but no easy way to create that polygon
	if(google.maps.geometry.poly.isLocationOnEdge(pt, polyline, TOLERANCE)) { // 10 meter tolerance
	    $("#poi_table").append(
		"<tr><th>" + nodes[i]['tags']['name'] + "</th>" +
		    "<th>" + tags + "</th>" +
		    "<th>" + distance_down_path(pt, polyline) + "</th>"
	    );

	    addMarker(
		new OpenLayers.LonLat(nodes[i]['lon'], nodes[i]['lat'])
		    .transform(
			projection_wgs, // transform from WGS 1984
			projection_smp // to Spherical Mercator Projection
		    ),
		nodes[i]['tags']['name']);

	}
    }
    // use pretty datatable
    $("#poi_table").dataTable({
	"columns": [
	    null,
	    null,
	    { "type": "numeric" }
	]
    });
}

// == On DOM Ready events =====================================================

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
	var google_point_objs = []
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
	    google_point_objs.push(new google.maps.LatLng(lat, lng));

	}
	for (var i = 1; i < point_objs.length; i++) {
	    var origin_feature = new OpenLayers.Feature(track_layer, point_objs[i-1])
	    var dest_feature = new OpenLayers.Feature(track_layer, point_objs[i])
	    track_layer.addNodes([origin_feature, dest_feature]);
	}
	map.setCenter(point_objs[0], zoom);      // Set center of map

	// bounds crap
	polyline = new google.maps.Polyline({path: google_point_objs});
	
    } else {
	map.setCenter(position, zoom);      // Set center of map
    }
    
    map.addControl(new OpenLayers.Control.LayerSwitcher());
    markers = new OpenLayers.Layer.Markers("Markers");
    map.addLayer(markers);

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
 