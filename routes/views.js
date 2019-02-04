const express = require('express');
const request = require('request-promise-native');
const router = express.Router();
const Beatmap = require('../models/beatmap');

router.get('/', function (req, res) {
  Beatmap.find({}, {hits: false}).sort({stars: 'asc'})
    .then((maps) => {
      // convert mongoose doc to plain object
      const rawMaps = maps.map(m => m.toObject({virtuals: true}));
      res.render('index', {maps: rawMaps});
    });
});

router.get('/maps', async function (req, res) {
  const options = {
    uri: 'https://bloodcat.com/osu/',
    qs: {
      s: '1,2,4', // ranked, approved, loved
      m: 1, // taiko
      mod: 'json',
      q: req.query.q || ''
    },
    json: true // Automatically parses the JSON string in the response
  };
  
  let rawMaps; 
  try {
    rawMaps = await request(options);
  } catch (err){
    res.status(500);
    res.send(err);
    return;
  }

  // parse bloodcat response
  const maps = []; // filtered
  for (const rawMap of rawMaps) {
    let map = {
      title: rawMap.title,
      artist: rawMap.artist,
      creator: rawMap.creator,
      id: parseInt(rawMap.id)  
    };

    map.beatmaps = rawMap.beatmaps.filter(diff => diff.mode == 1);
    map.beatmaps = map.beatmaps.map(diff => {
      return { 
        diff: diff.name,
        stars: Math.round(parseFloat(diff.star) * 100) / 100,
      };
    });
    map.beatmaps.sort((a, b) => a.stars - b.stars);
    maps.push(map);
  }

  res.render('maps', {maps: maps});
});

router.get('/play/:setId/:diffId', function (req, res) {
  Beatmap.findOneAndUpdate({setId: req.params.setId, diffId: req.params.diffId}, {$inc: {plays: 1}})
    .then(beatmap => {
      if (!beatmap) return res.sendStatus(404);
      res.sendFile('play.html', { root: 'views' });
    });
});

module.exports = router;
