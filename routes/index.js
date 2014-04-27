var mongoose = require('mongoose');
var Term     = require('../models/term.js');
var async    = require('async');
var http     = require('http');
var tumblr   = require('tumblr.js').createClient({ consumer_key: 'R2IUz11uULHiG7BIl9xEcs7csQxoRKVVCyP6bzBLDVxbIotC8R' });

var MediaWikiApi = require('mediawiki-api');
wiki = new MediaWikiApi('en.wikipedia.org');

var Client = require('node-rest-client').Client;
var client = new Client();

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
        res.render('find', { title: 'Find a Word', found: search });
      }
    });
    console.log(foundit);
  }
  else {
    res.render('find', { title: 'Find a Word' });    
  }
};

/* Get the word on the url and find it in the different social media sites */
exports.showTerm = function(req, res) {
  Term.findOne({ word: req.params.word }, function(err, term) {
    if(err) console.error(err);
    
    // Call ALL the social media sites
    async.parallel({
      tumblr: function(callback) { call_tumblr(term.word, callback); },
      urban:  function(callback) { call_urban(term.word,  callback); } 
    },
    function(err, results) {
      if (err) console.error(err);
      res.render('show', { 
        title: term.word,
        term: term, 
        urban:  results.urban,
        tumblr: results.tumblr
      }); // Render
    }); // Final Callback
  }); // async
};

exports.addTerm = function(req, res) {
  new Term({ word: req.body.term }).save();
  res.redirect('/define');
}

exports.deleteTerm = function(req, res) {
  Term.findOne({ word: req.params.word }, function(err, term) {
    term.remove();
    res.redirect('/define');
  });
}

function call_tumblr(word, callback) {
  tumblr.tagged( word, { type: 'photo', limit: '40' }, function parse_tumblr( err, data ) {
    if (err) console.error(err);
    var photos = [];
    Array.prototype.forEach.call(data, function(el, i){
      if ( el.type == "photo") {
        el.photos.forEach(function(pic) {
          photos.push(pic.alt_sizes[0]);
        });
      }
    });
    callback(null, photos);
  });
}

function call_urban(word, callback) {
  var url = 'http://api.urbandictionary.com/v0/define?term=' + encodeURI(word);
  client.get(url, function parse_urban(data, response) {
    var terms = [];
    var number = 0;
    Array.prototype.forEach.call(data.list, function(el, i) {
      if (el.thumbs_up - el.thumbs_down > 10) {
        if (number++ < 3) {
          terms.push(el);
        }
      }
    });

    callback(null, terms);
  });
}
