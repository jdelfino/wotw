// This is a manifest file that'll be compiled into application.js, which will include all the files
// listed below.
//
// Any JavaScript/Coffee file within this directory, lib/assets/javascripts, vendor/assets/javascripts,
// or vendor/assets/javascripts of plugins, if any, can be referenced here using a relative path.
//
// It's not advisable to add code directly here, but if you do, it'll appear at the bottom of the
// compiled file.
//
// Read Sprockets README (https://github.com/sstephenson/sprockets#sprockets-directives) for details
// about supported directives.
//
//= require jquery
//= require jquery_ujs
//= require turbolinks
//= require_tree .
//= require openlayers-rails
//= require jquery_nested_form

$(function() {
    $('#add_fields').click(function(association) {
	alert("Did it");
	
	var new_id = new Date().getTime();
	var regexp = new RegExp("new_" + association, "g");
	$(link).up().insert({
	    before: content.replace(regexp, new_id)
	});
	alert("Did it 2");
	return false;
    });

    $('#remove_fields').click(function() {
	$(link).previous("input[type=hidden]").value = "1";
	$(link).up(".fields").hide();
	return false;
    });
});