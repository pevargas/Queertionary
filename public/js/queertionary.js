
// $(function() {
//   var wall = new freewall("#bin");
//   wall.reset({
//     selector: '.item',
//     animate:  false,
//     cellW:    'auto',
//     cellH:    'auto',
//     onResize: function() {
//       wall.fitWidth();
//     }
//   });
//   wall.fitWidth();
//   $(window).trigger("resize");
function onload() {
//   var container = document.querySelector('#bin');
//   var msnry     = new Masonry( container, {
//     itemSelector: '.item',
//   });
  // var event = document.createEvent('HTMLEvents');
  // event.initEvent('resize', true, false);
  // window.dispatchEvent(event);
  console.debug("OnLoad");

  var container = document.querySelector('#bin');
  if ( container ) {
    var msnry = new Masonry( container );
    msnry.layout();
  }
}
