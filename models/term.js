// Term SCchema
var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var TermSchema = new Schema({
  word : String
});

TermSchema.statics.random = function(cb) {
  this.count(function(err, count) {
    if (err) return cb(err);
    var rand = Math.floor(Math.random() * count);
    this.findOne().skip(rand).exec(cb);
  }.bind(this));
};

module.exports = mongoose.model( 'Term', TermSchema );