var mongoose = require('mongoose');
var Term     = require('../models/term.js');
var async    = require('async');
var http     = require('http');
var tumblr   = require('tumblr.js').createClient({ consumer_key: 'R2IUz11uULHiG7BIl9xEcs7csQxoRKVVCyP6bzBLDVxbIotC8R' });

var MediaWikiApi = require('mediawiki-api');
wiki = new MediaWikiApi('en.wikipedia.org');

var Client = require('node-rest-client').Client;
var client = new Client();

// var flickrapi = require('flickrapi');
// var flickr    = new Flickr({
//   api_key: "02338b577d95e553204fbda618b301fd",
//   secret: "8163cddf21f552d2"
// });

// var Twit = require('twit')
// var T = new Twit({
//   consumer_key: 'aDAtbABsiigLOyrNxZjnkK8lw',
//   consumer_secret: 'y25QnCIYk3w7Che78sWdbtX20f3qpB05YAyUwVnKA3Uo5rMQbd'  
// });

/* GET Home Page */
exports.index = function(req, res) {
  Term.random(function(err, term) {
    res.render('index', { title: 'Homepage', term: term.word });
  });
};

/* GET Disclaimer Page */
exports.disclaimer = function(req, res) {
  res.render('disclaimer', { title: 'Disclaimer' });
};

/* GET List of Terms page*/
exports.showAll = function(req, res) {
  Term.find({}, null, {sort: {word: 1}}, function(err, terms, count){
    res.render('list', { 
      title: 'List o\' Words',
      terms: terms
    });
  });
};

exports.find = function(req, res) {
  var search = req.query.search;
  if ( search ) {
    var foundit = false;
    Term.findOne({ word: req.query.search }, function(err, term) {
      if ( term ) {
        res.redirect('/define/' + search );
      }
      else {

        // Call ALL the social media sites
        async.parallel({
          tumblr: function(callback) { call_tumblr(search, callback); },
          urban:  function(callback) { call_urban(search,  callback); },
          flickr: function(callback) { call_flickr(search, callback); }
        },
        function(err, results) {
          if (err) console.error(err);
          var tumblr = false, urban = false;
          if ( results.tumblr.length ) tumblr = true;
          if ( results.urban.length )  urban = true;
          if ( results.flickr.length ) flickr = true;

          res.render('find', { 
            title: 'Find a Word', 
            found: search,
            good: urban && ( tumblr || flickr )
          });
        }); // Async
      } // else
    });
    console.log(foundit);
  }
  else {
    res.render('find', { title: 'Find a Word' });    
  }
};

// Function to shuffle array -- Hella Awesome
// http://stackoverflow.com/a/10142256
Array.prototype.shuffle = function() {
  var i = this.length, j, temp;
  if ( i == 0 ) return this;
  while ( --i ) {
     j = Math.floor( Math.random() * ( i + 1 ) );
     temp = this[i];
     this[i] = this[j];
     this[j] = temp;
  }
  return this;
}

/* Get the word on the url and find it in the different social media sites */
exports.showTerm = function(req, res) {
  Term.findOne({ word: req.params.word }, function(err, term) {
    if(err) console.error(err);
    
    // Call ALL the social media sites
    async.parallel({
      tumblr:   function(callback) { call_tumblr(term.word, callback); },
      urban:    function(callback) { call_urban(term.word,  callback); },
      flickr:   function(callback) { call_flickr(term.word, callback); }
    },
    function(err, results) {
      if (err) console.error(err);
      var gallery = [];
      results.tumblr.forEach(function(url) { gallery.push(url); });
      results.flickr.forEach(function(url) { gallery.push(url); });
      gallery.shuffle();

      res.render('show', { 
        title: term.word,
        term: term, 
        urban:  results.urban,
        gallery: gallery
      }); // Render
    }); // Async
  }); // findOne
};

exports.addTerm = function(req, res) {
  new Term({ word: req.body.term }).save();
  res.redirect('/define/'+req.body.term);
};

exports.deleteTerm = function(req, res) {
  Term.find({ word: req.params.word }).remove().exec();
  // Term.findOne({ word: req.params.word }, function(err, term) {
  //     term.remove();
  // }).save();
  res.send("deleted?");
  // res.redirect('/define');
};

function call_tumblr(word, callback) {
  tumblr.tagged( word, { type: 'photo', limit: '40' }, function parse_tumblr( err, data ) {
    if (err) console.error(err);
    var photos = [];
    var BreakException = {};
    Array.prototype.forEach.call(data, function(el, i){
      if ( el.type == "photo") {
        var count = el.tags.length;
        // try {
          // el.tags.forEach(function(tag) {
            // var res = Term.count({ word: tag }, function(error, ct) {
              // if (error) console.error(error);
              // count = count - ct;
              // console.log( tag + " " + ct + " " + count);
              // if ( ct !== 0 ) throw BreakException;
              // if ( count < el.tags.length ) {
                // console.log( "Entered Pic Loop" );
                el.photos.forEach(function(pic) {
                  photos.push(pic.alt_sizes[0].url);
                }); // photos.forEach 
                // return true;
              // }
              // return false;
            // }); // Term.count
            // console.log( count );
          // }); // tags.forEach
        // }
        // catch (e) {
        //   if (e == BreakException) {
            // el.photos.forEach(function(pic) {
          //     photos.push(pic.alt_sizes[0]);
          //   }); // photos.forEach
          // }
          // else throw e;
        // }

        // console.log( count );
        // console.log(el.tags.length > count);
        // console.log(count == el.tags.length);

        // if (el.tags.length > count) {
          // el.photos.forEach(function(pic) {
          //   photos.push(pic.alt_sizes[0]);
          // }); // photos.forEach
        // }

      } // type == photo
    }); // forEach.call
    callback(null, photos);
  });
};

function call_urban(word, callback) {
  var url = 'http://api.urbandictionary.com/v0/define?term=' + encodeURI(word);
  client.get(url, function parse_urban(data, response) {
    var terms = [];
    var number = 0;
    Array.prototype.forEach.call(data.list, function(el, i) {
      if (el.thumbs_up - el.thumbs_down > 10) {
        if (number++ < 3) {
          terms.push(el);
          console.log(el);
        }
      }
    });

    callback(null, terms);
  });
};


function call_flickr(word, callback) {
  // if ( word == 'bear' || word == 'otter' || word == 'cub' ) {
  //   word = "gay " + word;
  // }
  var url = 'https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=' 
    + '02338b577d95e553204fbda618b301fd&format=json&nojsoncallback=1&tags=' + encodeURI(word);
  client.get(url, function parse_flickr(data, response) {
    var flickrs = [];

    data.photos.photo.forEach(function(obj) {
      var src = 'http://farm' + obj.farm + '.staticflickr.com/'+obj.server+'/'+obj.id+'_'+obj.secret+'.jpg';
      flickrs.push(src);
    });

    callback(null, flickrs);
  });
};