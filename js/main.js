
var controlOnMap = true;
//LEAFLET DRAW
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
var currentMarker_id=null;
//var geocoder = null;
var line = null;


function getGeoJSON(){
  console.log("GeoJSON call");
  $.getJSON("https://"+cartoDBUsername+".cartodb.com/api/v2/sql?format=GeoJSON&q="+sqlQuery, function(data) {
    cartoDBPoints = L.geoJson(data,{
      pointToLayer: function(feature,latlng){
        console.log(feature.properties.name);
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

//DOCUMENT ON LOAD
$(document).ready(function () {

  $("#card_content").html(info[0].content);

       //OVERWRITING BLOCK CSS LIB
       $.blockUI.defaults.message=null;
       $.blockUI.defaults.overlayCSS.cursor='default';
       $.blockUI.defaults.overlayCSS.opacity=0;

      //POSITION CREATE MAP BUTTON
      $("#createmap_button").position({
        my: 'left top',
        at:'right+10 top',
        of:'#info_bar'
      });

      //INVISIBLE DIVS
      $("#card_view").hide();
      $("#tool_view").hide();
      $("#question_view").hide();
      $("#gallery_view").hide();

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
               //SLIM SCROLL
       $(function(){
    $("#deneme1").slimScroll({
        height: '10em',
        size: '10px',
        color: 'white',
        distance: '10px',
    });
});

   // DRAW YOUR MAP
   map = L.map('map', {zoomControl:false} ).setView([42.348898, -71.061330], 16);

   L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpandmbXliNDBjZWd2M2x6bDk3c2ZtOTkifQ._QA7i5Mpkd_m30IGElHziw', {
    maxZoom: 16,
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
    '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
    'Imagery © <a href="http://mapbox.com">Mapbox</a>',
    id: 'mapbox.light'
  }).addTo(map);

   // geocoder= L.control.geocoder('search-NdXLorL', {expanded: true}).addTo(map);
   // var element = geocoder.getContainer();
   // $("#geocoder").append(element);
    
    // POPULATE MARKER DIALOG
    var innerHTML="";
    for(var i=0; i<10; i++){
      innerHTML+= "<div class='test_div' onclick=changeMarker(" + i + ")> <img src='icons/marker"+i+".png' class='markerclass'></div>";

    }

    //$("#icondialog").html(innerHTML);

    $("#marker_view").html(innerHTML);


    // SHOW MARKER DIALOG
        $("#drawMarkerButton").click(
      function () {
        $("#icondialog").dialog('open');
               }
          );


    $("#drawLineButton").click(function(){
      drawLine();
    });

    // EXPAND INFO VERTICAL TAB  
    //     $("#info_bar .expand_handle").click(function () {

    //       $("#info_handle").toggleClass('expand_handle_expanded');
    //       $(".vertical_text").toggleClass('vertical_text_expanded');
    //       $("#info_bar").toggleClass('verticaltab_info_expanded',500,'easeInOutQuad');
    //       if ($("#info_bar").hasClass='verticaltab_info_expanded'){
    //           $(".verticaltab_info_expanded").html(info[0].content);
    //       };
    //     });


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

          // $("#createmap_button").animate({
          //       left: "40px",
          //     }, 500, function() {
          //       // Animation complete.
          //     });
          // $("#card_view").animate({
          //       left: "-360px",
          //     }, 500, function() {

          // $("#card_view").hide();
          // $("#info_bar").show();
 
          //       // Animation complete.
          //     });

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

        $("#question_view .expand_handle_expanded").click(function () {
          collapse("#info_bar","#question_view");
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
          expand("#info_bar","#card_view","#info_bar"); 
          console.log('nil0');
          expand("#tool_bar", "#tool_view","#card_view"); 
          console.log('nil1');
          $("#card_content").html(info[1].content);

          console.log('nil3');
       });


    map.on('draw:created', function (e) {
      var layer = e.layer;

      map.addLayer(drawnItems);
      drawnItems.addLayer(layer);

      dialog.dialog( "open" );
    });

     // drawControl = new L.Control.Draw({

     //      draw : {
     //        polygon : false,
     //        polyline : true,
     //        rectangle : false,
     //        circle : false,
     //        marker: false,
     //      },
     //      edit : false,
     //      remove: false
     //    });
     // map.addControl(drawControl);



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
        "Add to Database": setData,
        Cancel: function() {
          dialog.dialog("close");
          map.removeLayer(drawnItems);
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

    // GET GEOJSON ONLOAD'TA OLMASI LAZIM KI HARITAYI ACINCA EKLENSIN
    getGeoJSON();


    $(function() {
      $('#tooldialog').dialog({
        position: { my: "right top", at: "right-10 top+10", of: "#map" },
        width: 200,
        height: 600,
        closeOnEscape: false,
        open: function(event, ui) { $(".ui-dialog-titlebar-close", ui.dialog | ui).hide(); },
        collapseEnabled: true,
        beforeCollapse: function(event, ui) {
          console.log('beforeCollapse');
        },
        collapse: function(event, ui) {
          console.log('collapse');
        },
        beforeCollapseRestore: function(event, ui) {
          console.log('beforeCollapseRestore');
        },
        collapseRestore: function(event, ui) {
          console.log('collapseRestore');
        }
      });
    });


    $(function() {
      var x = 0;
      $('#questiondialog').dialog({buttons: {
        Prev: function() {
            x--; // Increment counter
            if (x==-1){
              x=cards.length-1;
            }
            $(this).html(cards[x].content); // Build dialog based on new value
            $(this).dialog("option", "title", cards[x].card);
          },
          Next: function() {
            x++; // Increment counter
            if (x==cards.length){
              x=0;
            }
            $(this).html(cards[x].content); // Build dialog based on new value
            $(this).dialog("option", "title", cards[x].card);
          }}});
    });


  });
// End of onLoad 


// JQUERY UI DIALOG 
$(function(){
          $("#icondialog").dialog({ 
    position: { my: "left center", at: "right+10 center", of: "#tooldialog" },
    autoOpen: false,
    modal: false,
    height: 250,
    width: 300,
  });
});


// GET MARKER IDs  //
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
function drawLine() {
  line = new L.Draw.Polyline(map).enable();
  console.log("draw Line");
};


// SET DATA 
function setData() {
  var enteredUsername = username.value;
  var enteredDescription = description.value;
  drawnItems.eachLayer(function (layer) {
    var sql = "INSERT INTO data_collector (the_geom, description, name, latitude, longitude, marker_id) VALUES (ST_SetSRID(ST_GeomFromGeoJSON('";
    var a = layer.getLatLng();
    console.log(a);
    var sql2 ='{"type":"Point","coordinates":[' + a.lng + "," + a.lat + "]}'),4326),'" + enteredDescription + "','" + enteredUsername + "','" + a.lat + "','" + a.lng +"','" + currentMarker_id + "')";
    var pURL = sql+sql2;
    console.log(pURL);
    submitToProxy(pURL);
    console.log("Feature has been submitted to the Proxy");
  });
  map.removeLayer(drawnItems);
  drawnItems = new L.FeatureGroup();
  console.log("drawnItems has been cleared");
  dialog.dialog("close");
};

function refreshLayer() {
  if (map.hasLayer(cartoDBPoints)) {
    map.removeLayer(cartoDBPoints);
  };
  getGeoJSON();
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

