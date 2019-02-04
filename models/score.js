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

module.exports = mongoose.model('Score', ScoreSchema);
