var mongoose = require('mongoose');
var Term     = require('../models/term.js');
// var urban    = require('urban');

var http         = require('http');

var tumblr   = require('tumblr.js');
var tumblrclient   = tumblr.createClient({ consumer_key: 'R2IUz11uULHiG7BIl9xEcs7csQxoRKVVCyP6bzBLDVxbIotC8R' });

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
exports.index = function(req, res){
  res.render('index', { title: 'Homepage' });
};

/* GET List of Terms page*/
exports.showAll = function(req, res) {
  Term.find(function(err, terms, count){
    res.render('list', { 
      title: 'Term List',
      terms: terms
    });
  });
};

function ud(term) {
  var urbandic = urban(term);
  urbandic.first(function(json) {
    return json;
  });
  return null;
}

function tumb(term) {
  var result = null;
  // Make the request
  client.tagged('gif', function (err, data) {
    if (err) console.error(err);
    console.log(data);
    result = data;
  });

  return result;
}

// function html (raw) {
//   var e = document.createElement('div');
//   e.innerHTML = raw;
//   return e.childNodes.length === 0 ? "" : e.childNodes[0].nodeValue;
// }
// function json (raw) {
//   var decode = html(raw);
//   var json = eval("(" + decode + ")");
//   console.debug(json);
//   return json;
// }

exports.showTerm = function(req, res) {
  Term.findOne({ word: req.params.word }, function(err, term) {
    if(err) console.error(err);
    // res.send(tumb(term.word) + "hello");
    //urban: ud(term.word) 
    // var tposts = tumb(term.word);
    // console.log(tposts);
    tumblrclient.tagged( term.word, function( err, tumblrdata ) {
      if (err) console.error(err);
      // wiki.getArticleContents(term.word, function(err, wikidata) {
      //   if (err) console.error(err);
        // var options = {
        //   host: 'api.urbandictionary.com',
        //   port: 80,
        //   path: '/v0/define?term=' + encodeURI(term.word),
        //   headers: {
        //     'content-type': 'text/plain'
        //   }
        // };

        // direct way
        client.get('http://api.urbandictionary.com/v0/define?term=' + encodeURI(term.word), function(urban, response){

        // http.get(options, function(urb) {
        //   console.log("Got response: " + urb.statusCode);
        //   urb.on('data', function(rawurban) {
            // var json = JSON.parse(urban.toString());
            // console.log(json);
            res.render('show', { 
              title: term.word,
              term: term, 
              // wikipedia: wikidata,
              urban: urban,
              tumblr: tumblrdata
            }); // Render

        });


        //   });// on

        // }).on('error', function(e) {
        //   console.error(e.message);
        // }); // get

      // }); // Wiki
    }); // Tumblr
  });

  // Term.findOne({word: req.params.word}, function(error, term){
  //   res.render('/term/' + term.word, {
  //     title: term.word,
  //     term: term
  //   });
  // });
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

