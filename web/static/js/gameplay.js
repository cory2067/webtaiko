// map keys to track index
const keymap = {
  1:0,2:0,3:0,4:0,5:0,6:0,7:0,8:0,9:0,0:0,
  q:1,w:1,e:1,r:1,t:1,y:1,u:1,i:1,o:1,p:1,
  a:2,s:2,d:2,f:2,g:2,h:2,j:2,k:2,l:2,';':2,
  z:3,x:3,c:3,v:3,b:3,n:3,m:3,',':3,'.':3,'/':3
}

// tracks all gameplay objects and score indicators
class Gameplay {
  constructor(audio, mapData) {
    // actual music for the map
    this.audio = sounds[audio];

    // json representation of beatmap
    this.map = mapData;

    // index of most-recently spawned hitcircle
    this.cursor = 0;

    // contains all gameplay elements
    this.container = new PIXI.Container();

    // raw score is not normalized (to be out of 1,000,000)
    this.rawScore = 0;
    this.scoreText = new PIXI.Text("Score: 0", new PIXI.TextStyle({fill: "white"}));
    this.scoreText.y = 500;
    this.container.addChild(this.scoreText);

    // accuracy percent is accValue/hitObjects
    this.accValue = 0;
    this.hitObjects = 0;
    this.accText = new PIXI.Text("Acc: 100%", new PIXI.TextStyle({fill: "white"}));
    this.accText.y = 550;
    this.container.addChild(this.accText);

    this.combo = 0;
    this.comboText = new PIXI.Text("Combo: 0", new PIXI.TextStyle({fill: "white"}));
    this.comboText.y = 600;
    this.container.addChild(this.comboText);

    // map for row of keys -> track
    this.rowToTrack = {};

    // all tracks currently in play
    this.tracks = [];
    for (const i in this.map.tracks) {
      const trackData = this.map.tracks[i];
      const track = new Track(`/static/img/hitcircle-${trackData.color}.png`,
                              `/static/sound/hit-${trackData.sound}.wav`,
                              trackData.row, this.map.approachTime);

      this.tracks.push(track); 
      this.rowToTrack[trackData.row] = track;
      this.container.addChild(track.container);
    }

    //this.track = new Track(this.map.approachTime);
    //this.container.addChid(this.track.container);

    this.maxScore = 0; // stupidly "integrates" over every hit circle
    for (const circle in this.map.hits) {
      this.maxScore += this.computeScore(circle+1, 100);
    }

    window.addEventListener("keydown", this.handleKey.bind(this), false);
  }

  // start playback of map
  start() {
    this.startTime = performance.now();
    this.audio.play(); 
  }

  // get current time in map
  time() {
    return performance.now() - this.startTime;
  }

  // score for a single hitcircle, given acc for that one circle
  computeScore(combo, acc) {
    return Math.log(combo + 1) * acc;
  }

  registerMiss() {
    if (this.combo > 4) // avoid spamming combobreak sound
      sounds["/static/sound/combobreak.wav"].play();
    this.combo = 0; 
    this.rawScore *= 0.98;
  }

  handleKey(event) {
    if (!(event.key in keymap)) return;

    const row = keymap[event.key];
    const track = this.rowToTrack[row];

    if (track) {
      const acc = track.hit(this.time(), 2 - row);
      if (acc < 0) return; // no hit detected
      this.hitObjects++;
      this.accValue += acc;

      if (acc) { // a hit was successful
        this.combo++;
        this.rawScore += this.computeScore(this.combo, acc);
      } else { // wrong color pressed
        this.registerMiss();
      }
    }
  }

  // update all tracks being played by the beatmap
	// this should be added to the app's ticker
  updateTracks() {
    const t = this.time();

    // update existing hitcircles
    for (const track of this.tracks) {
      const missedCircles = track.updateCircles(t); 
      this.hitObjects += missedCircles; // reduce acc for misses
      if (missedCircles) {
        this.registerMiss();
      }
    }

    // spawn new hitcircles
    while (this.cursor < this.map.hits.length && (this.map.hits[this.cursor][0] - this.map.approachTime) < t) {
      // circle[0]: time (ms) when circle should be hit
      // circle[1]: the track this circle appears on
      const circle = this.map.hits[this.cursor];
      const track = this.tracks[circle[1] % 2];

      track.addCircle(circle[0], circle[1] % 2, circle[1] & 2);
      this.cursor++;
    }

    this.scoreText.text = "Score: " + Math.round(1000000*this.rawScore/this.maxScore);
    this.comboText.text = "Combo: " + this.combo;
    if (this.hitObjects) {
      this.accText.text = "Acc: " + Math.round(100 * this.accValue / this.hitObjects) / 100 + "%";
    }
  }
}
