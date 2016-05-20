
// VARIABLES
var controlOnMap = true;
var map=null;
var cartoDBPoints = null;
var cartoDBUsername = "niltuzcu";
var sqlQuery = "SELECT * FROM data_collector";
var drawnItems = new L.FeatureGroup();
var drawControl=null;
var dialog = null;
var whatIcon = null;
var Marker=null;
var drawControl=null;
var currentMarker_id=0;
//var geocoder = null;
var line = null;
var polygon= null;
var guid= null;
var current_layer = null;
var gallery_map_name =null;

// GET GEOJSON FROM CARTODB DATABASE
function getGeoJSON(){
  console.log("GeoJSON call");
  $.getJSON("https://"+cartoDBUsername+".cartodb.com/api/v2/sql?format=GeoJSON&q="+sqlQuery, function(data) {
    cartoDBPoints = L.geoJson(data,{
      style: function (feature) {
        return JSON.parse(feature.properties.layer_options);
      },

      pointToLayer: function(feature,latlng){
        var marker = L.marker(latlng,
        {
          icon:L.icon({
           iconUrl: 'icons/marker'+feature.properties.marker_id+'.png'
         })
        });
        marker.bindPopup('<p>' + feature.properties.description + '<br /><em>Submitted by </em>' + feature.properties.name + '</p>');
        return marker;
      }
    }).addTo(map);

  });
};

// GET A RANDOM USER MAP 
function getRandomMap() {
  var random_map_sqlQuery = "SELECT * FROM data_collector WHERE guid= (SELECT a.guid FROM (SELECT guid, count(*) FROM data_collector group by guid having count(*)>1)a ORDER BY RANDOM() LIMIT 1)"

  console.log("getRandomMap called");

  $.getJSON("https://"+cartoDBUsername+".cartodb.com/api/v2/sql?format=GeoJSON&q="+random_map_sqlQuery, function(data) {

    //gallery_map_name = JSON.stringify(data).map_name;
     console.log(data.features[0].properties.map_name);
     $("#gallery_content").html(data.features[0].properties.map_name);
    
      cartoDBPoints = L.geoJson(data,{
     //  onEachFeature: function (feature, layer) {
     //    console.log(feature.properties.map_name);
     // },
      style: function (feature) {
        return JSON.parse(feature.properties.layer_options);
      },
      pointToLayer: function(feature,latlng){
        var marker = L.marker(latlng,
        {
          icon:L.icon({
           iconUrl: 'icons/marker'+feature.properties.marker_id+'.png'
         })
        });
        marker.bindPopup('<p>' + feature.properties.description + '<br /><em>Submitted by </em>' + feature.properties.name + '</p>');
        return marker;
      }
    }).addTo(map);
  });
};

//DOCUMENT ON LOAD *****************************************************************************

$(document).ready(function () {

  //GUID GENERATOR
  function S4() {
    return (((1+Math.random())*0x10000)|0).toString(16).substring(1); 
  };
  guid = (S4() + S4() + "-" + S4() + "-4" + S4().substr(0,3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();
  console.log(guid);

  //LOADING CARD VIEW WELCOME MESSAGE
  $("#card_content").html(info[0].content);
  
  //CARD VIEW SLIDES .JS
  $("#cslide-slides").cslide();

  //OVERWRITING BLOCK CSS LIB - BLOCKING TOOLBAR ON LOAD
  $.blockUI.defaults.message=null;
  $.blockUI.defaults.overlayCSS.cursor='default';
  $.blockUI.defaults.overlayCSS.opacity=0;

  //POSITION 'CREATE MAP BUTTON'
  $("#createmap_button").position({
    my: 'left top',
    at:'right+10 top',
    of:'#info_bar'
  });

  //INVISIBLE DIVS
  $("#card_view").hide();
  $("#tool_view").hide();
  $("#gallery_view").hide();
  $("#tool_handle").hide();

  //PREVENT BROWSER TO CACHE DATA 
  $.ajaxSetup({
    cache: false
  });

  //SLIM SCROLL
  $(function(){
    $("#deneme").slimScroll({
      height: '10em',
      size: '10px',
      color: 'white',
      distance: '10px',
    });
   });

  //DRAW YOUR MAP
  map = L.map('map', {zoomControl:false} ).setView([42.348898, -71.061330], 16);

/*   L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpandmbXliNDBjZWd2M2x6bDk3c2ZtOTkifQ._QA7i5Mpkd_m30IGElHziw', {
    maxZoom: 16,
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
    '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
    'Imagery © <a href="http://mapbox.com">Mapbox</a>',
    id: 'mapbox.light'
  }).addTo(map);*/


  // BASEMAPS
  var streets_base = L.mapbox.tileLayer('http://tileserver.graphicarto.com/cambridge_streets.tilejson', {maxZoom: 15, minZoom: 9, attribution: 'Map data &copy; <a href="http://metrogis.org">MetroGIS</a>, <a href="http://www.graphicarto.com">Mike Foster</a>'});

  var hydro_base = L.mapbox.tileLayer('http://tileserver.graphicarto.com/cambridge_hydro.tilejson', {maxZoom: 15, minZoom: 9, attribution: 'Map data &copy; <a href="http://metrogis.org">MetroGIS</a>, <a href="http://www.graphicarto.com">Mike Foster</a>'});

  var buildings_base = L.mapbox.tileLayer('http://tileserver.graphicarto.com/cambridge_buildings.tilejson', {maxZoom: 15, minZoom: 9, attribution: 'Map data &copy; <a href="http://metrogis.org">MetroGIS</a>, <a href="http://www.graphicarto.com">Mike Foster</a>'});


//LOADING BASE MAPS FOR GALLERY RANDOM MAPS
  streets_base.addTo(map);
  hydro_base.addTo(map);
  buildings_base.addTo(map);

  // load GeoJSON from an external file
  $( "#toggle_streets" ).click(function() {
    if(map.hasLayer(streets_base)){
      map.removeLayer(streets_base);
    } else {
      streets_base.addTo(map);
    };
  });

  $( "#toggle_buildings" ).click(function() {
    if(map.hasLayer(buildings_base)){
      map.removeLayer(buildings_base);
    } else {
      buildings_base.addTo(map);
    };
  });

  $( "#toggle_hydro" ).click(function() {
    if(map.hasLayer(hydro_base)){
      map.removeLayer(hydro_base);
    } else {
      hydro_base.addTo(map);
    };
  });

  // geocoder= L.control.geocoder('search-NdXLorL', {expanded: true}).addTo(map);
  // var element = geocoder.getContainer();
  // $("#geocoder").append(element);
    
  //POPULATE MARKER DIALOG
  var innerHTML="";
  for(var i=0; i<10; i++){
    innerHTML+= "<div class='test_div' onclick=changeMarker(" + i + ")> <img src='icons/marker"+i+".png' class='markerclass'></div>";
    }

  $("#marker_view").html(innerHTML);

  //CALL DRAW LINE
  $("#drawLineButton").click(function(){
      drawLine();
    });

  //CALL DRAW POLYGON
  $("#drawPolygonButton").click(function(){
      drawPolygon();
    });

   //CHANGE MAP - GET A RANDOM MAP
  $("#change_map").click(function(){
      refreshLayer();
      getRandomMap();
    });

  // EXPAND INFO VERTICAL TAB_DENEME
  $("#info_bar .expand_handle").click(function () {

      $("#card_view").insertAfter($("#info_bar"));
      $("#card_view").show();
      $("#info_bar").hide();
      $("#createmap_button").animate({
        left: "400",
      }, 500, function() {
                // Animation complete.
              });
      $("#card_view").animate({
        left: "0",
      }, 500, function() {
                // Animation complete.
              });
  });


  $("#card_view .expand_handle_expanded").click(function () {

      alignCreateMapButton();
      collapse("#info_bar","#card_view");
  });


  function expand(target_bar,target_view,after){
      $(target_view).insertAfter($(after));
      $(target_view).show();
      $(target_bar).hide();

      $(target_view).animate({
        left: "0",
      }, 500, function() {
                        // Animation complete.
                      });  
  };

  //USE TO COLLAPSE EXPANDED VIEW
  function collapse(target_bar,target_view){
    $(target_view).animate({
            left: "-360px",
          }, 500, function() {

            $(target_view).hide();
            $(target_bar).show();

                // Animation complete.
              });
        };

        // use to move createmap button next to infobar.
        function alignCreateMapButton(){

         $("#createmap_button").animate({
          left: "40px",
        }, 500, function() {
                // Animation complete.
              });
       };

       $("#tool_bar").block({css:{border:'5px solid black'}});

       $("#tool_bar .expand_handle").click(function () {
        expand("#tool_bar","#tool_view","#info_view");        
      });

       $("#tool_view .expand_handle_expanded").click(function () {
        collapse("#tool_bar","#tool_view");
      });     

       $("#gallery_bar .expand_handle").click(function () {

        expand("#gallery_bar","#gallery_view","#tool_bar");
      });

       $("#gallery_view .expand_handle_expanded").click(function () {
        collapse("#gallery_bar","#gallery_view");
      });



       $("#createmap_button").click(function(){

         $("#createmap_button").hide(); 
         $("#tool_bar").unblock(); 
         $("#tool_handle").show();   
         expand("#info_bar","#card_view","#info_bar"); 
         expand("#tool_bar", "#tool_view","#card_view"); 
         $("#card_content").html(info[1].content);
         $("#cslide-slides").cslide();
         map.removeLayer(streets_base);
         map.removeLayer(hydro_base);
         map.removeLayer(buildings_base);
         refreshLayer();
       });


  map.on('draw:created', function (e) {
    current_layer = e.layer;
    console.log(current_layer);
    current_layer.marker_id = currentMarker_id;
    map.addLayer(drawnItems);
    drawnItems.addLayer(current_layer);
    //dialog.dialog( "open" );
  });

     dialog = $( "#dialog" ).dialog({
      autoOpen: false,
      height: 300,
      width: 350,
      modal: true,
      position: {
        my: "center center",
        at: "center center",
        of: "#map"
      },
      buttons: {
        "OK": setLayerContent,
        Cancel: function() {
          dialog.dialog("close");
          drawnItems.removeLayer(current_layer);
        }
      },
      close: function() {
        form[ 0 ].reset();
        console.log("Dialog closed");
      }
    });

     form = dialog.find( "form" ).on( "submit", function( event ) {
      event.preventDefault();
    });

  // GET GEOJSON ONLOAD
  //getGeoJSON();

  // DIALOG INPUTS
  function setLayerContent(){
      current_layer.username=username.value;
      current_layer.description=description.value;
      dialog.dialog("close");
  };


});

// END OF LOAD *****************************************************************************

// GET MARKER IDs  
function changeMarker(marker_id){
  if(Marker!=null){
    Marker.disable();
    Marker=null;
  }
  whatIcon = L.icon({
    iconUrl: 'icons/marker'+marker_id+'.png'
  });

  currentMarker_id = marker_id;
  Marker = new L.Draw.Marker(map, {icon:whatIcon});
  Marker.enable();
};


// DRAW LINE
function drawLine(color) {
  line = new L.Draw.Polyline(map,{shapeOptions:{color: color}}
    ).enable();
};

// DRAW POLYGON
function drawPolygon(color) {
  polygon = new L.Draw.Polygon(map,{shapeOptions:{color: color}}
    ).enable();
};


// SET DATA 
function setData() {
  drawnItems.eachLayer(function (layer) {
    
    var map_name = $("#mapname").val().replace("'"," ");
    

    var neighborhood_name = $("#neighborhoodname").val().replace("'"," ");
    console.log(map_name);
    console.log(neighborhood_name);
    var sql = "INSERT INTO data_collector (the_geom, description, name, latitude, longitude, marker_id, guid, map_name, neighborhood_name, layer_options) VALUES (ST_SetSRID(ST_GeomFromGeoJSON('";
    console.log(layer.options);
    var options = JSON.stringify(layer.options);
    var sql2 =JSON.stringify(layer.toGeoJSON().geometry)+"'),4326),'" + layer.description + "','" + layer.username + "','" + 0 + "','" + 0 +"','" + layer.marker_id + "','" + guid + "','" + map_name + "','" + neighborhood_name + "','" + options + "')";    
    var pURL = sql+sql2;
    console.log(pURL);
    submitToProxy(pURL);
    console.log("Feature has been submitted to the Proxy");
  });
  map.removeLayer(drawnItems);
  drawnItems = new L.FeatureGroup();
  console.log("drawnItems has been cleared");
  $('#aboutModal').modal();
};

function refreshLayer() {
  if (map.hasLayer(cartoDBPoints)) {
    map.removeLayer(cartoDBPoints);
  };
  //getGeoJSON();
};

// SUBMIT TO PROXY
var submitToProxy = function(q){
      $.post("php/callProxy.php", { //Put path to your PHP file here
        qurl:q,
        cache: false,
        timeStamp: new Date().getTime()
      }, function(data) {
        console.log(data);
        refreshLayer();
      });
    };

