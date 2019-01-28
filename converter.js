const fs = require('fs');
const request = require('request');
const unzipper = require('unzipper');
const nodesu = new require('nodesu');
const osu = new nodesu.Client(process.env.OSU_API_KEY);

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
    diff: mapData.Metadata.Version,
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
  console.log("Looking up map info...");

  // get all maps where mode==1 (taiko)
  const mapset = (await osu.beatmaps.getBySetId(mapId)).filter(map => map.mode == 1);
  const names = mapset.map(map => `[${map.version}].osu`);
  
  console.log("Downloading osz from Bloodcat...");
  const osz = await unzipper.Open.url(request, `https://bloodcat.com/osu/s/${mapId}`);
  console.log("Extracting...");
  
  const mapfiles = osz.files.filter(file => names.some(n => file.path.endsWith(n)));

  let mapdata = [];
  for (const file of mapfiles) {
    // Note: deliberately doing these synchonously
    // since unzipper unpredictably breaks if you try to extract simultaneously
    mapdata.push(await file.buffer());
    console.log(`Loaded ${file.path}`);
  }

  console.log("Parsing maps...");
  mapdata = mapdata.map(data => {
    let out = parseMap(data.toString()); 

    // attach info about the map from osu api
    out.api = mapset.filter(m => m.version == out.Metadata.Version)[0];
    return out;
  });

  // sort by difficulty
  mapdata.sort((a, b) =>  {
    return parseFloat(a.api.difficultyrating) - 
           parseFloat(b.api.difficultyrating);
  });

  // Identify and extract beatmap audio
  console.log("Extracting audio...");
  const audioName = mapdata[0].General.AudioFilename;
  const audioFile = osz.files.filter(file => file.path === audioName)[0];

  if (!audioFile) {
    throw new Error("Could not find beatmap audio");
  }

  const namesplit = audioName.split('.');
  const audioOutPath = `${outDir}/${mapId}.${namesplit[namesplit.length - 1]}`;

  await new Promise((resolve, reject) => {
    audioFile
      .stream()
      .pipe(fs.createWriteStream(audioOutPath))
      .on('finish', resolve)
      .on('error', reject);
  });

  console.log('----------------------');
  console.log(`Saved map audio to ${audioOutPath}`);

  mapdata.forEach((data, i) => { 
    const out = convertMap(data);
    const outPath = `${outDir}/${mapId}-${i}.tk`;
    fs.writeFileSync(outPath, JSON.stringify(out), 'utf8');
    console.log('--------------------');
    console.log(`Converted ${data.api.version}`);
    console.log(`Saved to ${outPath}`);
  });

  console.log("Complete!");

}

// main(811216, '../public/maps')
module.exports = main;
