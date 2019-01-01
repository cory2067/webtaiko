// map keys to track index
/*const keymap = {
  1:0,2:0,3:0,4:0,5:0,6:0,7:0,8:0,9:0,0:0,
  q:1,w:1,e:1,r:1,t:1,y:1,u:1,i:1,o:1,p:1,
  a:2,s:2,d:2,f:2,g:2,h:2,j:2,k:2,l:2,';':2,
  z:3,x:3,c:3,v:3,b:3,n:3,m:3,',':3,'.':3,'/':3
}*/
const keymap = {
  d:1,f:0,j:0,k:1
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

    // primary gameplay element
    this.track = new Track(this.map.approachTime);
    this.container.addChild(this.track.container);

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

  registerMiss(misses=1) {
    if (this.combo > 4) // avoid spamming combobreak sound
      sounds["/static/sound/combobreak.wav"].play();
    this.combo = 0; 
    this.rawScore *= 0.98**misses;
    this.track.updateIndicator(this.time(), 0);
  }

  handleKey(event) {
    if (!(event.key in keymap)) return;
    const color = keymap[event.key];
    const hit = this.track.hit(this.time(), color);

    switch (hit.type) {
      case "none":
        // no hit detected
        break;
      case "miss":
        this.registerMiss();
        break;
      case "normal":
        this.hitObjects++;
        this.accValue += hit.acc;
        this.combo++;
        this.rawScore += this.computeScore(this.combo, hit.acc);
        this.track.updateIndicator(this.time(), hit.acc);
        break;
      case "large": // second hit for a large circle 
        this.rawScore += this.computeScore(this.combo, hit.acc);
        break;
      default:
        alert("unexpected error: unknown hit type");
    }
  }

  // update the track being played by the beatmap
  // this should be added to the app's ticker
  updateTrack() {
    const t = this.time();

    // update existing hitcircles
    const missedCircles = this.track.updateCircles(t); 
    this.hitObjects += missedCircles; // reduce acc for misses
    if (missedCircles) {
      this.registerMiss(missedCircles);
    }

    // spawn new hitcircles
    while (this.cursor < this.map.hits.length && (this.map.hits[this.cursor][0] - this.map.approachTime) < t) {
      // circle[0]: time (ms) when circle should be hit
      // circle[1] % 2: the color this circle is
      // circle[1] & 2: whether the circle is large
      const circle = this.map.hits[this.cursor];
      this.track.addCircle(circle[0], circle[1] % 2, circle[1] & 2);
      this.cursor++;
    }

    this.scoreText.text = "Score: " + Math.round(1000000*this.rawScore/this.maxScore);
    this.comboText.text = "Combo: " + this.combo;
    if (this.hitObjects) {
      this.accText.text = "Acc: " + Math.round(100 * this.accValue / this.hitObjects) / 100 + "%";
    }
  }
}
