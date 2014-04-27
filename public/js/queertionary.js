function onload() {
  var container = document.querySelector('#bin');
  if ( container ) {
    var msnry = new Masonry( container );
    msnry.layout();
  }
}
