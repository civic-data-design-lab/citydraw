/*---------------------------
----- Config Vars: Change these to configure for your city or cities-------------
---------------------------*/
var myCities = [  //NAME AND BOUNDS OF CITIES 
  {name:"Minneapolis",bnds:[[44.940692,-93.303021],[44.998488,-93.062086]]},
  {name:"St. Paul",bnds:[[44.940692,-93.303021],[44.998488,-93.062086]]}
]
,tblName = "twin_cities_hoods" // cartoDB table name
,usrName = "mjfoster83" // your cartoDB username
,brandText = "Map your Neighborhood, Twin Cities!" // top left text and link on site
,brandLink = "http://maps.graphicarto.com/twincityhoods" //top left link on site
,giturl = "https://github.com/enam/neighborhoods" //Only change this if you want to link to a fork you made, otherwise you can leave the link to the original repo
,twiturl = "https://twitter.com/mjfoster83" //Links to my twit acct, change it if you want or remove twitter link altogether
,myPath = "http://mjfoster83.cartodb.com/api/v2"; //this is the root path to your cartoDB instance with the v2 api param
/*--------------------------
-----Other things to change
------in /php/callProxy, change the path to your hidden api key.
------in /php/


/*---------------------------
----- Application Vars -------------
---------------------------*/
var selectedCity = myCities[0]//selected city defaults to first myCities city.
,hoodsLayer
,map
,freeDrawLayer
,geoJsonLayer
,highlightHoods=[]
,highlightCount = 0
,c = new L.Control.Zoom({position:'topright'})
,lg = new L.layerGroup()
,overlg = new L.layerGroup()
,getJSON = {abort: function () {}}
,downloadURL = myPath+"/sql?format=shp&q=select+*+from+"+tblName
,ajaxrunning = false
,flagIndex = null
,poly//var for leaflet draw 
,marker
,geomType
,drawnItems//var for drawn polys
,nbrhdYears = 999//no data value
,cityYears = 999//no data value
,hStyle = {
    "stroke":true,
    "color":"#cd0000",//data.rows[i].strokeColor,
    "weight":2,
    "opacity":1,
    "fill":false,
    "clickable":false
}
//fill array from color brewer
//,fillArr = ['#8DD3C7','#FFED6F','#BEBADA','#FB8072','#80B1D3','#FDB462','#B3DE69','#FCCDE5','#D9D9D9','#BC80BD','#CCEBC5','#FFFFB3']
//fill array from tools.medialab.sciences-po.fr/iwanthue/index.php
,fillArr = ["#E7C265","#8AD4E2","#ECACC1","#95D18F","#E9D5B3","#E1EF7E","#F69D92","#9CD7BF","#B2BD75","#D1D3CF","#DAC1E1","#B3C69F","#D1AB6D","#E9D898","#B0CBE6","#D9B5AB","#86E9E1","#DBEA97","#D1F1E4","#DDEBBB","#DFB991","#F3AD8E","#8CDEB5","#EDAF69","#B9F2A6","#8DC8C4","#C2E887","#E5D670","#EAD483","#C4BF6A"]
,toner = L.tileLayer('http://{s}.tile.stamen.com/toner-lite/{z}/{x}/{y}.png', {
    attribution: '<a href="http://stamen.com/" target="_blank" >Stamen</a> | &copy; <a href="http://openstreetmap.org/" target="_blank" >OpenStreetMap</a> contributors'
})
,sat = L.tileLayer("http://oatile{s}.mqcdn.com/tiles/1.0.0/sat/{z}/{x}/{y}.jpg", {
  attribution: 'Search<a href="http://www.mapquest.com/" target="_blank"><img src="http://developer.mapquest.com/content/osm/mq_logo.png"></a>, NASA/JPL, Caltech, USDA',
  subdomains: '1234'
})
,instructed={};
/*---------------------------
----- $(window).load -------
---------------------------*/
function go(){
  $( 'body' ).attr('class','make');
  $('#deletePolyBtn').hide();
  $('#submitPolyBtn').hide();
  $('.modal-body').css( 'max-height', window.innerHeight - 180 );
  map = new L.Map('map', {
    zoomControl:false,
    center: [0,0],
    zoom: 2,
    editable: true
  });
  var baseMaps = {
    "Road": toner,
    "Aerial": sat
  };
  c.addTo(map);
  L.control.layers(baseMaps).addTo(map);
  lg.addTo(map);
  overlg.addTo(map);
  toner.addTo(map);
  map.fitBounds(selectedCity.bnds);
  map.setView([44.982125, -93.269013],13)

  //draw controls
  drawnItems = new L.FeatureGroup();
  map.addLayer(drawnItems);
  
   
    //-----------------------------END DRAW CONTROLS---------------------------------------

	//make teh nav and city buttons---------------|<>o|----thhppt---------City buttons Y'All!
  $('<a class="navbar-brand" href="#" target="_blank">'+brandText+'</a>').click(function(e){
    e.preventDefault();
    $('#aboutModal').modal('show');
  }).prependTo('#navDiv');
  $("#navDiv").prepend('<a class="navbar-brand abbrev" href="'+brandLink+'" target="_blank">'+myCities[0].name+'</a>');
  
  	//add listeners------------------------------------------------------------------------------------------------------LIsteners Y'All!
	  $('#aboutModal').modal('show').on('hidden.bs.modal',function(){
      if ( $('body').hasClass('make') ) showInstructions();
    })
	  $("#resultMapBtn").click(function(e){
  });
  $('#resultsInSpace').click (
    function (e) {
      mapBackground = !$('#resultsInSpace').hasClass('active');
      if(!$('#resultsInSpace').hasClass('active')){
        toner.setOpacity(0);
        sat.setOpacity(0);
      }else{
        toner.setOpacity(1);
        sat.setOpacity(1);
      }
  });
  $("#flagBtn").on('click',function(){
    var q = "update "+tblName+" set flag = true where cartodb_id = "+flagIndex;
    submitToProxy(q);
    $('#flagModal').modal('hide');
    $('.flag-btn[name="' + flagIndex + '"]').addClass('flagged');
  });
  $("#downloadBtn").on('click',function(){
    window.open(downloadURL);
    $('#downloadModal').modal('hide');
  });
  $("#accordion").slimScroll({ height:'100%', position: 'left', distance:0, railcolor:'#ffffff', color:'#555555'});

  $('#startPolyBtn').on('click',function(){
    geomType = "poly";
    $('#deletePolyBtn').show();
    $('#startPolyBtn').hide();
    $('#submitPolyBtn').hide();
    $('#startMarkerBtn').hide();
    drawnItems.eachLayer(function(l){
      if ( l.setStyle ) l.setStyle({clickable:false});
    });
    if ( !instructed.poly ){
      showDrawingInstructions();
      return;
    } 
    freeDrawLayer = new L.FreeDraw({mode: L.FreeDraw.MODES.ALL })
      .on( 'created', function(e){
        var originalPoly = this.polygons[0];
        poly = L.polygon( originalPoly.getLatLngs(), {color:'#D7217E',fillColor:'#D7217E'} );
        map.removeLayer( originalPoly );
        map.removeLayer(freeDrawLayer);
        freeDrawLayer = undefined;
        drawnItems.addLayer( poly );
        poly.enableEdit();
        $(".leaflet-container").removeClass("drawing");
        $('#submitPolyBtn').show();
        showEditingInstructions();
      })
    map.addLayer(freeDrawLayer);
    $(".leaflet-container").addClass("drawing");
  });
  $('#deletePolyBtn').on('click',function(){
    if ( poly ) drawnItems.removeLayer( poly );
    if ( marker ) drawnItems.removeLayer( marker );
    poly = undefined;
    marker = undefined;
    if ( freeDrawLayer ){
      map.removeLayer(freeDrawLayer);
      freeDrawLayer = undefined;
      map.dragging.enable();
      $(".leaflet-container").removeClass("drawing");
    }
    $('#submitPolyBtn').hide();
    $('#startPolyBtn').show();
    $('#startMarkerBtn').show();
    $('#deletePolyBtn').hide();
    drawnItems.eachLayer(function(l){
      if ( l.setStyle ) l.setStyle({clickable:false});
    });
     map.off("editable:editing").off("editable:drawing:commit");
  });
 
  $('#startMarkerBtn').on('click',function(){
    geomType = "point";
    $('#deletePolyBtn').show();
    $('#startPolyBtn').hide();
    $('#submitPolyBtn').hide();
    $('#startMarkerBtn').hide();
    marker = map.editTools.startMarker();
    drawnItems.addLayer( marker );
    showDrawingInstructions();
    map.on("editable:editing",function(){
      $(".leaflet-container").removeClass("drawing");
      $('#submitPolyBtn').show();
    }).on("editable:drawing:commit",function(){
      showEditingInstructions();
      $(".leaflet-container").removeClass("drawing");
      $('#submitPolyBtn').show();
    });
  })
  $("#submitPolyBtn").click(function(e){
  //CHECK IF POLYGON IS COMPLETE
   // if(drawnItems.getLayers().length<1){bootstrap_alert.warning('Oops, you need to map a neighborhood first.'); }
    //ELSE OPEN THE SUBMIT DIALOGUE
    //else{
      // if ( freeDrawLayer) map.removeLayer( freeDrawLayer );
      // freeDrawLayer = undefined;
      $("#submitModal").modal('show');
      getExistingNeighborhoodNames();
      getExistingCityNames();
    //}
  });
  $(".cty-group > button.btn").on("click", function(){
    num = this.name;
    cityYears = num;
  });
  $(".nbr-group > button.btn").on("click", function(){
    num = this.name;
    console.log(num)
    nbrhdYears = num;
  });
  $("#allSubmitBtn").click(function(e){
  //CHECK IF Neighborhood has a name
    if (!notEmpty(document.getElementById('neighborhoodName'))){
      alert('Please enter a neighborhood name, Thanks!');  
      return;
    };
    currentNeighborhood = document.getElementById('neighborhoodName').value;
    currentDescription = document.getElementById('neighborhoodDescription').value;
    currentCity = document.getElementById('cityName').value;
    document.getElementById('neighborhoodName').value = '';
    document.getElementById('neighborhoodDescription').value= '';
    document.getElementById('cityName').value= '';
    $('#deletePolyBtn').hide();
    $('#submitPolyBtn').hide();
    $('#startPolyBtn').show();
    $('#startMarkerBtn').show();
    $("#submitModal").modal('hide');
    $(".cty-group > button.btn").removeClass('active');
    $(".nbr-group > button.btn").removeClass('active');
    //cityYears = 999;
    //nbrhdYears = 999;
    $('.typeahead').unbind();

    //drawnItems.eachLayer(function (layer) {
      var sql;
      var sql2;
      if ( poly ){
        sql = "INSERT INTO "+tblName+" (the_geom, city, description, name,city_yrs,nbrhd_yrs,flag,loved) VALUES (ST_SetSRID(ST_GeomFromGeoJSON('";
        sql2 ='{"type":"MultiPolygon","coordinates":[[[';
       // var a = layer._latlngs;
        var a = poly.getLatLngs();
        console.log('latlng Arr: length: '+a.length+ " " +a);
          for (var i = 0; i < a.length; i++) {
            var lat = (a[i].lat);//.toFixed(4); // rid of rounding that was there for url length issue during dev
            var lng = (a[i].lng);//.toFixed(4); // rid of rounding that was there for url length issue during dev
            var st = '['+lng + ',' + lat+']';
            //if(i<a.length-1){
              st = st + ',';
            //};
          if(i==a.length-1){
            var lat = (a[0].lat).toFixed(4);
              var lng = (a[0].lng).toFixed(4);
            st = st + '['+lng + ',' + lat+']';
          }
            sql2 = sql2+st;
        }
        sql2 += "]]]}'";
        poly
          .setStyle({color:'#03f',fillColor:'#03f',weight:2,fillOpacity:.1})
          .bindPopup( currentNeighborhood )
          .disableEdit();
        poly = undefined;
      } else {
        sql = "INSERT INTO "+tblName+"_point (the_geom, city, description, name,city_yrs,nbrhd_yrs,flag,loved) VALUES (ST_SetSRID(ST_GeomFromGeoJSON('";
        sql2 = '{"type":"Point","coordinates":[';
        sql2 += marker.getLatLng().lng;
        sql2 += ',';
        sql2 += marker.getLatLng().lat;
        sql2 += "]}'";
        marker.bindPopup( currentNeighborhood )
          .disableEdit();
        marker = undefined;
        map.off("editable:editing").off("editable:drawing:commit");
      }
      
      sql2 = sql2 + "),4326),'"+currentCity+"','"+(currentDescription.replace(/'/g,"''")).replace(/"/g,"''")+"','"+(currentNeighborhood.replace(/'/g,"''")).replace(/"/g,"''")+"','"+cityYears+"','"+nbrhdYears+"','false','0')";
      var pURL = sql+sql2;
      console.log(pURL)
      submitToProxy(pURL);
      
      drawnItems.eachLayer(function(l){
        if ( l.setStyle ) l.setStyle({clickable:false});
      });
     // drawnItems.clearLayers();
   // });
    showAlert("Done!","Your neighborhood has been added! Draw more neighborhoods, or take a look at what has been added so far by clicking 'View Maps'.");
  });
  $(".enableTooltipsLeft").tooltip({container:"body",placement:"left"});
  if(window.location.hash) {
    if(window.location.hash.substr(1)==="view"){
      $('#resultMapBtn').addClass('active');
      $('#makeMapModeBtn').removeClass('active');
      goViewState();
    }
  } else {
    // Fragment doesn't exist so, what are ya gonna do?
  }
}

/*---------------------------
----- Some Functions -------------
---------------------------*/
var loadHoods = function(){
  //remove curren tresults layer
  lg.clearLayers();
  cartodb.createLayer(map, {
    user_name: usrName,
    table_name: tblName+"_point",
    zIndex:'999',
    type: 'cartodb',
    cartodb_logo: false,
    query: "SELECT * FROM "+tblName+"_point where flag = false",
    tile_style:'#'+tblName+'_point {marker-fill-opacity: 0.75;marker-line-color: #cd0000;marker-line-width: 5;marker-line-opacity: .25;marker-placement: point;marker-type: ellipse;marker-width: 10;marker-fill: #cd0000;marker-allow-overlap: true;}',
  })
  .done(function(layer) {
    lg.addLayer(layer);
  });
  cartodb.createLayer(map, {
    user_name: usrName,
    table_name: tblName,
    zIndex:'999',
    type: 'cartodb',
    cartodb_logo: false,
    query: "SELECT * FROM "+tblName+" where flag = false",
    tile_style:'#'+tblName+' {line-opacity:.8;line-color: #cd0000;line-width:1;polygon-fill:#fff;polygon-opacity:0.1;}::accent{image-filters: agg-stack-blur(3,3);line-opacity:.2;line-color: #cd0000;line-join:round;polygon-opacity:.01;[zoom=2] { line-width: 4; } [zoom=3] { line-width: 6; } [zoom=4] { line-width: 8; } [zoom>5] { line-width: 10; }}',
    interactivity: 'cartodb_id,name, description',
    featureClick: function(ev, latlng, pos, data){hoodClickHandler(ev, latlng, pos, data)},
    featureOver: function(ev, latlng, pos, data){hoodOverHandler(ev, latlng, pos, data)},
    featureOut: function(ev,latlng, pos, data){hoodOutHandler(ev,latlng,pos,data)}
  })
  .done(function(layer) {
    lg.addLayer(layer);
  });
}
var hoodOverHandler = function(ev,latlng,pos,data){
  $('#map').css('cursor', 'pointer');
}
var hoodOutHandler = function(ev,latlng,pos,data){
  $('#map').css('cursor', 'auto');
}
var hoodClickHandler = function(ev,latlng,pos,data){
  console.log(data);
  //$('#map').css('cursor', 'auto');
  hoodClickGetter(latlng);
}
var hoodClickGetter = function(ll){
  getJSON.abort();
  getJSON = $.ajax(
    {url:myPath+"/sql?q=SELECT name FROM "+tblName+" WHERE ST_Intersects( the_geom, ST_SetSRID((ST_POINT("+ll.lng+", "+ll.lat+")) , 4326)) AND flag = false GROUP BY name ORDER BY name ASC",
    crossDomain:true,
      dataType:"jsonp",
      error: function (xhr, text_status, error_thrown) {
        console.log(text_status)
                    if (text_status != "abort") {
                       // get_data_from_server();  // Try request again.
                    }
                }
      }).done(function(data) {
        var pgArr = '{';
        var unique = false;
        //build array for geojson query and see if the hood is already highlighted
        for(var i = 0;i<data.rows.length;i++){
          boo = true;
          for(var h=0;h<highlightHoods.length;h++){
              if(data.rows[i].name===highlightHoods[h].name){
                boo = false;
                break;
              }
          }
          if(boo){pgArr+=data.rows[i].name+',';unique = true;}
        }
        if(!unique){
          return;
        }
        pgArr = pgArr.substring(0, pgArr.length - 1)+'}';
        pgArr = pgArr.replace(/'/g,"''");
        pgArr = pgArr.replace(/"/g,"''");
        getNewHoods(pgArr);
      });

}
var getNewHoods = function (arr){//takes array of neighborhood names, gets and draws geojson
  var bnds = map.getBounds()
  ,top = bnds.getNorth()
  ,right = bnds.getEast()
  ,left = bnds.getWest()
  ,bottom = bnds.getSouth();
  console.log("ltrb: "+left+','+top+","+right+","+bottom);
 getJSON = $.ajax(
    {url:myPath+"/sql?q=SELECT name,COUNT(name),array_agg(description)as description,array_agg(loved)as loved,array_agg(cartodb_id) as cartodb_id,array_agg(ST_AsGeoJSON(the_geom)) as the_geom FROM "+tblName+" WHERE name = ANY('"+arr+"') AND flag = false AND ST_Intersects(ST_Envelope(the_geom), ST_MakeEnvelope("+left+","+bottom+","+right+","+top+",4326)) GROUP BY name ORDER BY name ASC",
      crossDomain:true,
      dataType:"jsonp",
      error: function (xhr, text_status, error_thrown) {
        console.log(text_status)
                    if (text_status != "abort") {
                      //  get_data_from_server();  // Try request again.
                    }
                }
      }).done(function(data) {
        var currentHoodsCount = highlightCount;
        console.log(currentHoodsCount);
       
        var newHoodCount = data.rows.length;
        if((currentHoodsCount+newHoodCount)>fillArr.length){
          console.log('too many hoods!');
          var diff = (currentHoodsCount+newHoodCount);
          var spliceOff = diff-fillArr.length;
            clearSomeHoods(spliceOff);
          
        }
        for(var i = 0;i<data.rows.length;i++){
          highlightCount++;
          var count = data.rows[i].count;//this is the number of versions of that specific neighborhood
          var name = data.rows[i].name;
          var op = 1-(Math.pow(.2,1/count));
          data.rows[i].layers=[];
          data.rows[i].fillColor = fillArr[0];
          fillArr.push(fillArr.shift());
          highlightHoods.push(data.rows[i]);
          var nStyle = {
                  "stroke":true,
                  "color":"#cccccc",//data.rows[i].strokeColor,
                  "weight":1,
                  "opacity":1,
                  "fill":true,
                  "fillColor":data.rows[i].fillColor,
                  "fillOpacity":op,
                  "clickable":false
          }; var tmpName = highlightHoods.length-1;

          $("#accordion").prepend('<div class="panel panel-default yesMouse '+(tmpName)+'" > '+
            '<div class="panel-heading yesMouse" data-toggle="collapse" style="background-color:'+data.rows[i].fillColor+';"><h4 class="panel-title" >'+
               '<a data-toggle="collapse"  href="#collapse'+(tmpName)+'" >'+
              '<span id="glyphicon'+(tmpName)+'" class="glyphicon glyphicon-chevron-up"></span>    '+
               name+
               '</a><button id='+(tmpName)+' type="button" class="close highlightedHood-btn" >×</button></h4>'+
            '</div>'+
            '<div id="collapse'+(tmpName)+'" class="panel-collapse collapse in">'+// add class 'in' if you want to add it open
              '<div class="panel-body detailText">'+
                //TODO add handler for description array
                getTheText(data.rows[i],tmpName)+
              '</div>'+
            '</div>'+
          '</div><div style="height:5px;" class="yesMouse '+(tmpName)+'"></div>'+
          '<script>'+
          '$("#collapse'+tmpName+'").on("hidden.bs.collapse", function () {$("#glyphicon'+tmpName+'").removeClass("glyphicon-chevron-up").addClass("glyphicon-chevron-down");resizeHandler()});'+
          '$("#collapse'+tmpName+'").on("shown.bs.collapse", function () {$("#glyphicon'+tmpName+'").removeClass("glyphicon-chevron-down").addClass("glyphicon-chevron-up");resizeHandler()});'+
          '$(".enableTooltips").tooltip({container:"body",placement:"right"});'+
          '</script>'
          );
          resizeHandler();
          for (var n = 0;n<count;n++){
              var geom = data.rows[i].the_geom[n];
              var polygons = jQuery.parseJSON(geom);
              var lyr = L.geoJson(polygons, {
                  style: nStyle
              });
              data.rows[i].layers.push(lyr);
              data.rows[i].layers[data.rows[i].layers.length-1].addTo(overlg);
          }
      }
  })
}
var getTheText = function(d,tmpName){
  var ret ="";
  for(var di = 0;di<d.description.length;di++){
   var geom = d.the_geom[di];
     
          var rand = Math.floor((Math.random()*999999)+1);
    ret += '<div class="row"><div class= "col-xs-3">'+
    '<div class="row"><div class="col-xs-12"><div id="map'+rand+'" style="height:50px;width:50px;"></div></div></div>'+
    '<div class="row icon-row">'+
    '<div class="col-xs-6"><span name="'+d.cartodb_id[di]+'" class="loveflag glyphicon glyphicon-flag flag-btn enableTooltips yesMouse" title="Flag for Inappropriate Content"></span></div>'+
    '<div class="col-xs-6"><span name="'+d.cartodb_id[di]+'" class="loveflag glyphicon glyphicon-heart heart-btn enableTooltips yesMouse" title="Love This Neighborhood Image!"></span></div>'+
    '</div></div>'+
    '<div class="col-xs-9">'+
    '<script>var map'+rand+' = L.map("map'+rand+'",{zoomControl:false,attributionControl:false});'+
    'var geom = '+geom+';'+
    'var lyr = L.geoJson('+geom+',{style:hStyle}).addTo(map'+rand+');'+
    'L.tileLayer("http://{s}.tile.stamen.com/toner-background/{z}/{x}/{y}.png", {attribution: "Stamen",opacity:0.4}).addTo(map'+rand+');'+
    'map'+rand+'.fitBounds(lyr.getBounds());'+
    '</script><span>';
    if(d.description[di]===''){
      ret+='No story given.'
    }else{
      ret+=d.description[di];
    }
    ret+='</span><p  class="lovecount"><b>'+d.loved[di]+'</b> love.</p></div></div>'
  }
  return ret;
}
var clearSomeHoods = function(cnt){
  for(var i=0;i<cnt;i++){
    for(var h=0;h<highlightHoods.length;h++){
      if(highlightHoods[h].name != ''){
        clearHighlightedHood(h);
        break;
      }
    }
  }
}
function notEmpty(elem){
  if(elem.value.length == 0){
    elem.focus(); // set the focus to this input
    return false;
  }
  return true;
}
var clearHighlightedHood = function(idx){
  highlightCount--;
  $( "."+idx+"" ).remove();
  var lyrs = highlightHoods[idx].layers;
  highlightHoods[idx].name = '';
  for(var l=0;l<lyrs.length;l++){
    overlg.removeLayer(lyrs[l]);
  }
  //todo shift color to end start of fill array
  var find = highlightHoods[idx].fillColor;
  for(var i = 0;i<fillArr.length;i++){
    //console.log(find + '?' + fillArr[i]);
    if(fillArr[i]===find){
      console.log('found')
      element = fillArr[i];
      fillArr.unshift(fillArr.splice(i, 1));
    }
  }
  resizeHandler();
}
var resizeHandler = function(){
  vph = $(window).height();
  var position = $('#descriptionDiv').position().top;
  contentHeight = $('#accordion')[0].scrollHeight;
  }
var submitToProxy = function(q){
  $.post("php/callProxy.php",
    {
      qurl:q,
      cache: false,
      timeStamp: new Date().getTime()
    }, function(data) {
      console.log(data);
    });
}
var getExistingNeighborhoodNames = function(){
  $.ajax(
    {url:myPath+"/sql?q=SELECT name,COUNT(name) FROM "+tblName+" WHERE flag = false GROUP BY name ORDER BY name ASC",
      crossDomain:true,
      dataType:"jsonp",
      error: function (xhr, text_status, error_thrown) {
        console.log(text_status)
      }
    }).done(function(data) {
      var newARR=[].concat(hoodNames);  // names.js
      $.each(data.rows, function() {
        if ( newARR.indexOf( this.name ) == -1 )
      newARR.push(this.name);
    });
    $('#neighborhoodName').typeahead({
      name:"y",
      local: newARR
    });
  });
}
var getExistingCityNames = function(){
  $.ajax(
    {url:myPath+"/sql?q=SELECT city,COUNT(city) FROM "+tblName+" WHERE flag = false GROUP BY city ORDER BY city ASC",
      crossDomain:true,
      dataType:"jsonp",
      error: function (xhr, text_status, error_thrown) {
        console.log(text_status)
      }
    }).done(function(data) {
      var newARR=[].concat(cityNames);
      $.each(data.rows, function() {
        if ( newARR.indexOf( this.city ) == -1 )
      newARR.push(this.city);
    });
    $('#cityName').typeahead({
      name:"yy",
      local: newARR
    });
  });
}
var animateHeart = function(ex,wy){
  $("#loveIcon").css({left:ex-10,top:wy-10,opacity:1,width:20,height:20});
  $( "#loveIcon" ).animate({
    top: '-=' + $("#loveIcon").height()/2,
    left: '-=' + $("#loveIcon").width()/2,
    width: $("#loveIcon").width()*2,
    height: $("#loveIcon").height()*2,
    opacity: 0
  }, 600 );
}
var goViewState = function(e){
  $('body').attr('class','view');
  loadHoods(); 
  map.removeLayer(drawnItems);
  $('#btnBar').fadeOut('fast', function() {
    $('.viewMap').fadeIn('fast', function() {
    });
  });
}
var goMakeState = function(){
  $('body').attr('class','make');
  $('.viewMap').fadeOut('fast', function() {
    $('#btnBar').fadeIn('fast', function() {
    });
  });
  
  if($('#resultsInSpace').hasClass('active')){
    $('#resultsInSpace').button('toggle');
    
  };
  mapBackground = false;
  toner.setOpacity(1);
  sat.setOpacity(1);
  lg.clearLayers();
  map.addLayer( drawnItems );

  if ( poly ) drawnItems.removeLayer( poly );
  if ( marker ) drawnItems.removeLayer( marker );
  poly = undefined;
  marker = undefined;
  if ( freeDrawLayer ){
    map.removeLayer(freeDrawLayer);
    freeDrawLayer = undefined;
    map.dragging.enable();
    $(".leaflet-container").removeClass("drawing");
  }

  clearSomeHoods(highlightCount);
  $('#deletePolyBtn').hide();
  $('#startPolyBtn').show();
  $('#startMarkerBtn').show();
  $('#submitPolyBtn').hide();

  if ( !instructed ) showInstructions();
}
/*-----------------------------------------
---------UI helper stuff
-------------------------------------------*/
function showInstructions(){
  if ( instructed.poly && instructed.point ) return;
  var action = L.Browser.touch ? 'tap' : 'click';
  var title = 'Draw your first neighborhood!',
    text = 'To get started, zoom to your area of interest, then ' + action + ' the <b>neighborhood SHAPE</b> or <b>neighborhood POINT</b> button.',
    src = 'img/instructions1.gif';
  showAlert( title, text, src );
}
function showDrawingInstructions(){
  if ( instructed[geomType] ) return;
  if ( geomType == "poly" ){
    var action = L.Browser.touch ? 'Drag your finger' : 'Click and drag your mouse';
    var title = 'Now trace the neighborhood',
      text = action + ' to draw the shape of the neighborhood. You won\'t be able to move the map while drawing, but don\'t worry, you can make changes after you finish.',
      src = 'img/instructions2_poly.gif';
    showAlert( title, text, src );    
    function enableDrawing(){
      freeDrawLayer = new L.FreeDraw({mode: L.FreeDraw.MODES.ALL })
        .on( 'created', function(e){
          var originalPoly = this.polygons[0];
          poly = L.polygon( originalPoly.getLatLngs(), {color:'#D7217E',fillColor:'#D7217E'} );
          map.removeLayer( originalPoly );
          map.removeLayer(freeDrawLayer);
          freeDrawLayer = undefined;
          drawnItems.addLayer( poly );
          poly.enableEdit();
          $(".leaflet-container").removeClass("drawing");
          $('#submitPolyBtn').show();
          showEditingInstructions();
        })
      map.addLayer(freeDrawLayer);
      $(".leaflet-container").addClass("drawing");
      $('#generalModal').off('hide.bs.modal',enableDrawing)
    }
    $('#generalModal').on('hide.bs.modal',enableDrawing)
  } else {
    var action = L.Browser.touch ? 'Drag your finger' : 'Click and drag your mouse';
    var title = 'Now place the marker',
      text = L.Browser.touch ? 'Drag the marker to the desired location, then tap <b>Save Neighborhood</b>.'
        : 'Move your mouse to the desired location, then click to drop the marker.'
      src = L.Browser.touch ? 'img/instructions3_point.gif' : 'img/instructions2_point.gif';
      if ( L.Browser.touch ) instructed[geomType] = true;
    showAlert( title, text, src );
  }
  
}
function showEditingInstructions(){
  if ( instructed[geomType] ) return;
  instructed[geomType] = true;
  if ( geomType == "poly" ){
    var action = L.Browser.touch ? 'tap' : 'click';
    var title = 'Looking good!',
      text = 'You can now adjust the shape of the neighborhood. Drag the white squares to change the shape, or ' + action + ' them to delete corners. When you are satisfied with the shape, ' + action + ' <b>Save Neighborhood</b> to submit it.',
      src = 'img/instructions3_poly.gif';
    showAlert( title, text, src );
  } else {
    if ( L.Browser.touch ) return;
    var title = 'Looking good!',
      text = 'You can click and drag the marker to edit its location. When you are satisfied, click <b>Save Neighborhood</b> to submit it.',
      src = 'img/instructions3_point.gif';
    showAlert( title, text, src );
  }
}
function showAlert( title, text, imageSrc, buttonLabel ){
  var m = $("#generalModal");
  $('.modal-body', m).empty();

  $('h3',m).html(title);
  
  if ( imageSrc ){
    $('<div class="img-container">')
      .html('<img src="'+imageSrc+'">')
      .appendTo( $('.modal-body', m) );
  }

  $('<p>')
    .html(text)
    .appendTo( $('.modal-body', m) );

  buttonLabel = buttonLabel || 'OK';
  $('.btn-default',m).html(buttonLabel);

  m.modal('show');
}

/*-----------------------------------------
---------City Zoom V1
-------------------------------------------*/

$("#zoomMpls").click(function(e){
  map.setView([44.982125, -93.269013],13)
});

$("#zoomStPaul").click(function(e){
  map.setView([44.949306, -93.092664], 13)
});

/*-----------------------------------------
---------City Zoom V2
-------------------------------------------*/

var substringMatcher = function(strs) {
  return function findMatches(q, cb) {
    var matches, substringRegex;

    // an array that will be populated with substring matches
    matches = [];

    // regex used to determine if a string contains the substring `q`
    substrRegex = new RegExp(q, 'i');

    // iterate through the pool of strings and for any string that
    // contains the substring `q`, add it to the `matches` array
    $.each(strs, function(i, str) {
      if (substrRegex.test(str)) {
        matches.push(str);
      }
    });

    cb(matches);
  };
};

$('#the-basics .typeahead').typeahead({
  hint: true,
  highlight: true,
  minLength: 1
},
{
  name: 'zoomCities',
  source: substringMatcher(zoomCities)
});

var zoomCity = null;

$('#the-basics').typeahead({
    name: 'zoomCities',
    local: zoomCities
}).on('typeahead:selected', function (obj, datum) {
    console.log(obj);
    console.log(datum);
    zoomCity = datum;
    if(zoomCity == "Minneapolis") {
      map.setView([44.982125, -93.269013],13)
    } else if(zoomCity == "St. Paul") {
      map.setView([44.949306, -93.092664], 13)
    }
});

/*-----------------------------------------
---------Hey, Listeners! Lookout behind you! |o| |<{}>| |o| 
-------------------------------------------*/
$('.mapState').click(function() {
		$('.mapState').removeClass('active');
		$(this).addClass('active');
});
$("#resultMapBtn").click(function(e){
	goViewState();
});
$("#makeMapModeBtn").click(function(e){
	goMakeState();
});
$("#githubBtn").click(function(e){
  window.open(giturl, '_blank');
});
$("#twitterBtn").click(function(e){
  window.open(twiturl, '_blank');
});
$("#modalInfoBtn").click(function(e){
  window.open(brandLink, '_blank');
});
//kludge for stupid bootstrap btn group conflict I couldn't figure out.
$('.btn-group button').click(function()
{
    $(this).parent().children().removeClass('active');
    $(this).addClass('active');
});
$(document).on('click', ".highlightedHood-btn", function() {
  var removeIndex = $(this).attr("id");
  clearHighlightedHood(removeIndex);
});
$(document).on('click',".download-btn",function(){
  $('#downloadModal').modal('show');
});
$(document).on('click',".flag-btn",function(){
  flagIndex = $(this).attr("name");
  $('#flagModal').modal('show');

});
$(document).on('click',".heart-btn",function(event){
  var heartIndex = $(this).attr("name"),
    q;
  if ( !$(this).hasClass('flagged') ){
    q = "update "+tblName+" set loved = loved + 1 where cartodb_id = "+heartIndex;
    animateHeart(event.clientX,event.clientY);
    $(this).addClass('flagged')
  } else {
    q = "update "+tblName+" set loved = loved - 1 where cartodb_id = "+heartIndex;
    $(this).removeClass('flagged')
  }
  submitToProxy(q);
});
$(document).on("hidden.bs.collapse", ".collapse", function () {resizeHandler()});
$(window).resize(function(){resizeHandler()});
$(window).ajaxStart(function() {
    ajaxrunning = true;
});
$(window).ajaxStop(function() {
    ajaxrunning = false;
});
$(window).load(go);