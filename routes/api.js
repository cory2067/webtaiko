const express = require('express');
const converter = require('../converter');
const router = express.Router();

const Beatmap = require('../models/beatmap');
const Score = require('../models/score');

router.get('/download/:setId', function (req, res) {
  converter(req.params.setId, 'public/maps')
    .then(maps => Beatmap.insertMany(maps))
    .then(console.log)
    .catch(console.log)
  res.send({res: 'downloading'})
});

router.get('/scores/:setId/:diffId', function (req, res) {
  Beatmap.findOne({setId: req.params.setId, diffId: req.params.diffId}, {hits: false})
    .then(beatmap => {
      res.send(beatmap.toObject({virtuals: true}));
    }); 
});

router.get('/beatmap/:setId/:diffId', function (req, res) {
  Beatmap.findOne({setId: req.params.setId, diffId: req.params.diffId})
    .then(beatmap => {
      res.send(beatmap);
    }); 
});

router.post('/score', function (req, res) {
  Score.findOne({setId: req.body.setId,
                 diffId: req.body.diffId,
                 player: req.body.player,
                 best: true})
    .then(score => {
      // if this score is better than previously set one
      if (!score || (req.body.score > score.score)) {
        score.best = false;
        return score.save();
      }
      return score;
    })
    .then(prevScore => {
      console.log("Set new score.");
      const newScore = new Score({
        setId: req.body.setId,
        diffId: req.body.diffId,
        player: req.body.player,
        score: req.body.score,
        maxCombo: req.body.maxCombo,
        acc: req.body.acc,
        best: !prevScore || !prevScore.best,
        hits: req.body.hits
      });
      return newScore.save();
    })
    .then(score => {
      console.log(score);
      res.send(score);
    });
});

module.exports = router;
