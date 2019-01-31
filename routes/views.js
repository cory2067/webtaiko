const express = require('express');
const request = require('request-promise-native');
const router = express.Router();
const Beatmap = require('../models/beatmap');

// used for UI coloring based on difficulty
const diffColors = ['violet', 'blue', 'teal', 'green', 
                   'yellow', 'orange', 'red'];

router.get('/', function (req, res) {
  Beatmap.find({}, {hits: false}).sort({stars: 'asc'})
    .then((maps) => {
      maps.forEach(map => { 
        map.diffColor = diffColors[Math.floor(map.stars)] || 'black';
      });
      res.render('index', { maps: maps });
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
        diffColor: diffColors[Math.floor(parseFloat(diff.star))] || 'black'
      };
    });
    map.beatmaps.sort((a, b) => a.stars - b.stars);
    maps.push(map);
  }

  res.render('maps', {maps: maps});
});

router.get('/play/:setid/:diff', function (req, res) {
  res.sendFile('play.html', { root: 'views' });
});

module.exports = router;
