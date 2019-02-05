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

router.get('/scores/:setId/:diffId', async function (req, res) {
  const mapSel = {setId: req.params.setId, diffId: req.params.diffId};

  const tasks = [
    Beatmap.findOne(mapSel, {hits: false}),
    req.query.player ? Score.findOne({...mapSel, player: req.query.player, best: true}) : undefined,
    req.query.player ? Score.find({...mapSel, player: req.query.player}).limit(50) : [],
    Score.find({...mapSel, best: true}).sort('-score').limit(50)
  ];

  const result = await Promise.all(tasks);

  if (result[1]) { // personal best
    const rank = await result[1].findRank();
    result[1] = result[1].toObject(); // to allow field not in schema
    result[1].rank = rank;
  }

  res.send({
    meta: result[0].toObject({virtuals: true}),
    personalBest: result[1],
    myScores: result[2],
    globalScores: result[3] 
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
      if (score && req.body.score > score.score) {
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
