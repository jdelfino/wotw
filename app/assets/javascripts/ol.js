var map;
var projection_wgs;
var projection_smp;
var position;
var polyline; // TODO: better name
var TOLERANCE = 2/1110; // 200 meters (111km ~= 1 degree)
var markers;
var markerlist={};
var lastfeature;

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

function hideAllOtherPopups(popup) {
    for(var i = 0; i < map.popups.length; i++){
	if(map.popups[i] != popup){
	    map.popups[i].hide();
	}
    }
}

function togglePopup(feature){
    hideAllOtherPopups(feature.popup);

    if (feature.popup == null) {
        feature.popup = feature.createPopup(true);
        map.addPopup(feature.popup);
        feature.popup.show();
    } else {
        feature.popup.toggle();
    }
}

function addMarker(ll, popupContentHTML) {

    var feature = new OpenLayers.Feature(markers, ll); 
    feature.popupClass = OpenLayers.Class(OpenLayers.Popup.Anchored, {'autoSize': true});
    feature.data.popupContentHTML = popupContentHTML;
    feature.data.overflow = "auto";

    var marker = feature.createMarker();
    
    var markerClick = function (evt) {
	togglePopup(this);
        OpenLayers.Event.stop(evt);
    };
    marker.events.register("mousedown", feature, markerClick);
    
    markers.addMarker(marker);
    return feature
}

function clean_tag(tag){
    return tag.charAt(0).toUpperCase() + tag.slice(1).replace(/_/g, " ");
}

function display_pois(data, textStatus, jqXHR) {
    var nodes = data['elements'];
    var pois = []

    for(var i = 0; i < nodes.length; i++) {
	var pt = new google.maps.LatLng(nodes[i]['lat'], nodes[i]['lon']);
	if(google.maps.geometry.poly.isLocationOnEdge(pt, polyline, TOLERANCE)) {
	    var tags = ""
	    var type = ""
	    for(var tag in nodes[i]['tags']){
		if(tag == 'website') {
		    tags += "<a href=" + nodes[i]['tags'][tag] + '">Website</a><br/>';
		} else if(tag == 'amenity') {
		    type = clean_tag(nodes[i]['tags'][tag])
		} else if(tag == 'bus' && nodes[i]['tags'][tag] == 'yes') {
		    type = "Bus"
		} else if(tag == 'railway' || tag == 'tourism') {
		    type = clean_tag(nodes[i]['tags'][tag])
		} else if(tag.indexOf(':') == -1 && tag != "name" && tag != "ele") {
		    var key = tag.charAt(0).toUpperCase() + tag.slice(1).replace(/_/g, " ");
		    var val = clean_tag(nodes[i]['tags'][tag]);
		    tags += key + ": " + val + "<br/>";
		}
	    }
	    pois.push({"pt":pt, 
		       "distance": parseInt(distance_down_path(pt, polyline)), 
		       "type": type,
		       "tags": tags,
		       "name": nodes[i]['tags']['name'].trim()});
	}
    }

    pois.sort(function(a,b) { 
	if(a['distance'] < b['distance']) {
	    return -1;
	} else if(a['distance'] > b['distance']) {
	    return 1;
	}
	return 0;
    });

    for(var i = 0; i < pois.length; i++) {
	var feature = 
	    addMarker(new OpenLayers.LonLat(pois[i]['pt'].lng(), pois[i]['pt'].lat())
		      .transform(
			  projection_wgs, // transform from WGS 1984
			  projection_smp // to Spherical Mercator Projection
		      ),
		      pois[i]['name']);

	var row = "<tr><td>" + pois[i]['name'] + "</td><td>";
	if(pois[i]['type']) {
	    row += "<b>" + pois[i]['type'] + '</b><br/>'
	}
	row += pois[i]['tags'] + "</td>" +
	    "<td>" + pois[i]['distance'] + "</td>"

	$(row).appendTo("#poi_table"
	 ).hover(
	     function() { this.inflate(1.2);
			  this.icon.setUrl('http://www.openlayers.org/dev/img/marker-green.png');
			  // bring this marker to the front
			  this.erase(); 
			  markers.redraw();
			}.bind(feature.marker),
	     function() { this.inflate(1/1.2); 
			  this.icon.setUrl('http://www.openlayers.org/dev/img/marker.png');
			}.bind(feature.marker) 
	 ).click(
	     function() { togglePopup(this);
			  map.setCenter(this.marker.lonlat)}.bind(feature)
	 );
	
    }
    $("#poi_table tbody > tr:odd").addClass('pure-table-odd')

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
    
    markers = new OpenLayers.Layer.Markers("Markers");
    map.addLayer(markers);
    scalebar = new OpenLayers.Control.ScaleLine();
    map.addControl(scalebar);
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


    $(window).scroll(function (e) {
	var vertical_position = 0;
	if (pageYOffset)//usual
	    vertical_position = pageYOffset;
	else if (document.documentElement.clientHeight)//ie
	    vertical_position = document.documentElement.scrollTop;
	else if (document.body)//ie quirks
	    vertical_position = document.body.scrollTop;
	
	div_offset = $("#poi_table").offset().top
	map_offset = $("#map").offset().top

	desired_padding = vertical_position - div_offset + 25; //fudge
	max_padding = $("#poi_table").height() - $("#map").height()
	min_padding = 16; //1em
	padding = Math.max(Math.min(desired_padding, max_padding), min_padding)

	$(".movable_map").animate({'padding-top': padding}, 25, "swing");

    });
});
 
