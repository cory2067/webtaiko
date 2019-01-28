const express = require('express');
const converter = require('../converter');
const router = express.Router();

router.get('/download/:mapId', function (req, res) {
  converter(req.params.mapId, 'public/maps');
  res.send({res: 'downloading'})
});

module.exports = router;
