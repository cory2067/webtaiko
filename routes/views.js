const express = require('express');
const request = require('request-promise-native');
const router = express.Router();

router.get('/', function (req, res) {
  res.sendFile('index.html', { root: 'views' });
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
        name: diff.name,
        star: Math.round(parseFloat(diff.star) * 100) / 100
      };
    });
    map.beatmaps.sort((a, b) => a.star - b.star);
    maps.push(map);
  }

  res.render('maps', {maps: maps});
});

router.get('/play/:mapid/:diff', function (req, res) {
  res.sendFile('index.html', { root: 'views' });
});

module.exports = router;
