// Term SCchema
var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var TermSchema = new Schema({
  word : String
});

module.exports = mongoose.model( 'Term', TermSchema );