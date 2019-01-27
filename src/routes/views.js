const express = require('express');
const request = require('request-promise-native');
const router = express.Router();

router.get('/', function (req, res) {
  res.sendFile('index.html', { root: 'src/views' });
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
   
  try {
    const maps = await request(options);
  } catch (err){
    res.status(500);
    res.send(err);
    return;
  }

  res.send(maps);
});

router.get('/play/:mapid/:diff', function (req, res) {
  res.sendFile('index.html', { root: 'src/views' });
});

module.exports = router;
