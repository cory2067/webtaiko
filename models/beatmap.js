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
  plays         : Number,
  hits          : [[Number]]
});

BeatmapSchema.virtual('diffColor').get(function () {
  const diffColors = ['violet', 'blue', 'teal', 'green',
                     'yellow', 'orange', 'red'];

  return diffColors[Math.floor(this.stars)] || 'black';
});

module.exports = mongoose.model('Beatmap', BeatmapSchema);
