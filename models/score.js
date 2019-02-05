const mongoose = require('mongoose');

const ScoreSchema = new mongoose.Schema ({
  setId: Number,
  diffId: Number,
  player: String,
  score: Number,
  maxCombo: Number,
  acc: Number,
  best: Boolean,
  hits: {
    perfect: Number, 
    good: Number,
    bad: Number,
    miss: Number
  }
});

ScoreSchema.methods.findRank = function () {
  return this.model('Score').countDocuments({
		setId: this.setId,
		mapId: this.mapId,
    best: true, 
    score: {$gte: this.score}
  });
};

module.exports = mongoose.model('Score', ScoreSchema);
