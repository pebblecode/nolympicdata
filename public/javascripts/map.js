function load(){

  var point = new google.maps.LatLng(51.4860604, -0.118939);

  var myMapOptions = {
    zoom: 15,
    center: point,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  };

  var map = new google.maps.Map(document.getElementById("map"),myMapOptions);

  var image = new google.maps.MarkerImage(
    'images/map-pin-image.png',
    new google.maps.Size(200,74),
    new google.maps.Point(0,0),
    new google.maps.Point(100,74)
  );

  var shadow = new google.maps.MarkerImage(
    'images/map-pin-shadow.png',
    new google.maps.Size(240,74),
    new google.maps.Point(0,0),
    new google.maps.Point(100,74)
  );

  var shape = {
    coord: [199,0,199,1,199,2,199,3,199,4,199,5,199,6,199,7,199,8,199,9,199,10,199,11,199,12,199,13,199,14,199,15,199,16,199,17,199,18,199,19,199,20,199,21,199,22,199,23,199,24,199,25,199,26,199,27,199,28,199,29,199,30,199,31,199,32,199,33,199,34,199,35,199,36,199,37,199,38,199,39,199,40,199,41,199,42,199,43,199,44,199,45,199,46,199,47,199,48,199,49,199,50,199,51,199,52,199,53,199,54,108,55,107,56,107,57,106,58,106,59,106,60,105,61,105,62,104,63,104,64,103,65,103,66,103,67,102,68,102,69,101,70,101,71,100,72,100,73,99,73,99,72,98,71,98,70,98,69,97,68,97,67,96,66,96,65,95,64,95,63,95,62,94,61,94,60,93,59,93,58,93,57,92,56,92,55,0,54,0,53,0,52,0,51,0,50,0,49,0,48,0,47,0,46,0,45,0,44,0,43,0,42,0,41,0,40,0,39,0,38,0,37,0,36,0,35,0,34,0,33,0,32,0,31,0,30,0,29,0,28,0,27,0,26,0,25,0,24,0,23,0,22,0,21,0,20,0,19,0,18,0,17,0,16,0,15,0,14,0,13,0,12,0,11,0,10,0,9,0,8,0,7,0,6,0,5,0,4,0,3,0,2,0,1,0,0,199,0],
    type: 'poly'
  };

  var marker = new google.maps.Marker({
    draggable: false,
    icon: image,
    shadow: shadow,
    shape: shape,
    map: map,
    position: point
  });

}