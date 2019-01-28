const mongoose = require('mongoose');

const BeatmapSchema = new mongoose.Schema ({
  setId         : Number,
  diffId        : Number,
  title         : String,
  artist        : String,
  creator       : String,
  diff          : String,
  stars         : Number,
  approachTime  : Number,
  hits          : [[Number]]
});

module.exports = mongoose.model('Beatmap', BeatmapSchema);
