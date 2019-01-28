const express = require('express');
const converter = require('../converter');
const router = express.Router();

const Beatmap = require('../models/beatmap');

router.get('/download/:mapId', function (req, res) {
  converter(req.params.mapId, 'public/maps')
    .then(maps => Beatmap.insertMany(maps))
    .then(console.log)
    .catch(console.log)
  res.send({res: 'downloading'})
});

router.get('/beatmap/:mapId/:diffId', function (req, res) {
  Beatmap.findOne({mapId: req.params.mapId, diffId: req.params.diffId})
    .then(beatmap => {
      res.send(beatmap);
    }); 
});

module.exports = router;
