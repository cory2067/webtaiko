const express = require('express');
const converter = require('../converter');
const router = express.Router();

const Beatmap = require('../models/beatmap');

router.get('/download/:setId', function (req, res) {
  converter(req.params.setId, 'public/maps')
    .then(maps => Beatmap.insertMany(maps))
    .then(console.log)
    .catch(console.log)
  res.send({res: 'downloading'})
});

router.get('/beatmap/:setId/:diffId', function (req, res) {
  Beatmap.findOne({setId: req.params.setId, diffId: req.params.diffId})
    .then(beatmap => {
      res.send(beatmap);
    }); 
});

module.exports = router;
