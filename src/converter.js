const fs = require('fs');
const request = require('request');
const unzipper = require('unzipper');

const parseMap = (text) => {
  const lines = text.split('\n').slice(1);

  const map = {};

  // it's time for janky string operations
  let section;
  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith('//')) continue;

    if (line.startsWith('[')) {
      section = line.substring(1, line.length - 1);

      if (['Events', 'TimingPoints', 'HitObjects'].includes(section)) {
        map[section] = [];
      } else {
        map[section] = {};
      }
    } else {
      if (Array.isArray(map[section])) {
        map[section].push(line.split(','));    
      } else {
        const s = line.split(':');
        map[section][s[0].trim()] = s[1].trim();
      }
    }
  }

  return map;
}

// get timing point at a specific point in a map
const getTiming = (mapData, ms) => {
  const timing = mapData.TimingPoints;
  let r = 0;

  // iterate until we're in the correct timing interval r
  for (r = 0; parseInt(timing[r+1][0]) < ms && r !== timing.length - 1; r++);
  const perBeat = parseFloat(timing[r][1]);

  if (perBeat > 0)
    return perBeat;

  // step backward for inherited timing points
  for (; parseFloat(timing[r][1]) < 0; r--);
  return -perBeat*0.01 * parseFloat(timing[r][1]);
}

const convertMap = (mapData) => {
  const sliderMult = mapData.Difficulty.SliderMultiplier;
  const out = {
    title: mapData.Metadata.Title,
    artist: mapData.Metadata.Artist,
    creator: mapData.Metadata.Creator,
    approachTime: 1000, // hardcoding this for now
    hits: []
  };

  // convert each note of map
  for (let row of mapData.HitObjects) {
    const note = {
      time: parseInt(row[2]),
      hitsound: parseInt(row[4]),
      osuType: parseInt(row[3]),
      tkType: 0
    };

    if ((note.hitsound & 2) || (note.hitsound & 8)) 
      note.tkType = 1; // clap or whistle
    if (note.hitsound & 4)
      note.tkType +=2; // finish (large circle)
    if (note.osuType & 2) {
      note.tkType += 4; // slider
      const pxLength = parseInt(row[6]) * parseInt(row[7]);
      note.duration = pxLength / (100 * sliderMult) * getTiming(mapData, note.time);
    } else if (note.osuType & 8) {
      note.tkType += 8; // spinner
      note.duration = parseInt(row[5]) - note.time;
    }

    if (note.duration)
      out.hits.push([note.time, note.tkType, Math.round(note.duration)]);
    else
      out.hits.push([note.time, note.tkType]);
  }

  return out;
}


async function main(mapId, outDir='out') {
  console.log("Downloading osz...");
  const osz = await unzipper.Open.url(request, `https://bloodcat.com/osu/s/${mapId}`);

  let firstFile = true;
  console.log("Now converting...");

  osz.files.forEach(async (file, i) => {
    if (!file.path.endsWith('.osu')) return;

    const content = await file.buffer();
    const mapData = parseMap(content.toString()); 

    if (firstFile) { // actions that occur once per mapset
      firstFile = false;

      // Extract beatmap audio
      const audioName = mapData.General.AudioFilename;
      const audioFile = osz.files.filter(f => f.path === audioName);
      if (!audioFile.length) throw new Error("Could not find beatmap audio");

      const namesplit = audioName.split('.');
      const outPath = `${outDir}/${mapId}.${namesplit[namesplit.length - 1]}`;
      
      audioFile[0]
        .stream()
        .pipe(fs.createWriteStream(outPath))
        .on('finish', () => {
          console.log('--------------------');
          console.log(`Saved map audio to ${outPath}`);
        });
    }
    
    // ignore non-taiko maps
    if (mapData.General.Mode != 1) return;
    
    // Convert map to .tk (json) format
    const out = convertMap(mapData);

    const outPath = `${outDir}/${mapId}-${i}.tk`;
    fs.writeFile(outPath, JSON.stringify(out), 'utf8', (err) => {
      if (err)
        console.log(err);
      else
        console.log('--------------------');
        console.log(`Converted ${file.path}`);
        console.log(`Saved to ${outPath}`);
    });
  });
}

// main(811216, '../public/maps')
module.exports = main;
