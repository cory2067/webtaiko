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

const accLabels = {0: 'miss', 25: 'bad', 50: 'good', 100: 'perfect'};

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

    // keep track of number of each hit
    this.hits = {miss: 0, bad: 0, good: 0, perfect: 0};
    this.submittedScore = false;

    // accuracy percent is accValue/hitObjects
    this.accValue = 0;
    this.hitObjects = 0;
    this.accText = new PIXI.Text("Acc: 100%", new PIXI.TextStyle({fill: "white"}));
    this.accText.y = 550;
    this.container.addChild(this.accText);

    this.combo = 0;
    this.maxCombo = 0; // max combo achieved 
    this.comboText = new PIXI.Text("Combo: 0", new PIXI.TextStyle({fill: "white"}));
    this.comboText.y = 600;
    this.container.addChild(this.comboText);

    // primary gameplay element
    this.track = new Track(this.map.approachTime);
    this.container.addChild(this.track.container);

    this.maxScore = 0; // stupidly "integrates" over every hit circle
    let combo = 0;
    for (const circle of this.map.hits) {
      if (circle[1] <= 4) {
        combo++;
        this.maxScore += this.getHitScore(combo, 100);
      }
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

  // overall accuracy on map
  getOverallAccuracy() {
      return Math.round(100 * this.accValue / this.hitObjects) / 100;
  }

  // score for a single hitcircle, given acc for that one circle
  getHitScore(combo, acc) {
    return Math.log(combo + 1) * acc;
  }

  getTotalScore() {
    if (!this.rawScore) return 0;
    return Math.round(10000 * this.getOverallAccuracy() * this.rawScore/this.maxScore);
  }

  registerMiss(misses=1) {
    if (this.combo > 4) // avoid spamming combobreak sound
      sounds["/static/sound/combobreak.wav"].play();
    this.combo = 0; 
    this.rawScore *= 0.98**misses;
    this.hits[accLabels[0]] += misses;
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
        this.hits[accLabels[hit.acc]]++;
        this.combo++;
        this.maxCombo = Math.max(this.maxCombo, this.combo);
        this.rawScore += this.getHitScore(this.combo, hit.acc);
        this.track.updateIndicator(this.time(), hit.acc);
        break;
      case "large": // second hit for a large circle 
        this.rawScore += this.getHitScore(this.combo, hit.acc);
        break;
      case "slider":
        this.rawScore += 100;
        break;
      case "spinner":
        this.rawScore += 200;
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

    if (this.cursor >= this.map.hits.length && this.track.empty() && !this.submittedScore) {
      this.submittedScore = true;
      fetch('/api/score', {
        method: 'post',
        headers: {'Content-type': 'application/json'},
        body: JSON.stringify({
          setId: SET_ID,
          diffId: DIFF_ID,
          score: this.getTotalScore(),
          player: 'Cychloryn',
          maxCombo: this.maxCombo,
          acc: this.getOverallAccuracy(),
          hits: this.hits
        })
      }).then(res => res.json())
        .then(res => {
          console.log("Submitted score!");
          window.location = `/score/${res._id}`;
        });
    }

    // spawn new hitcircles
    while (this.cursor < this.map.hits.length && (this.map.hits[this.cursor][0] - this.map.approachTime) < t) {
      // circle[0]: time (ms) when circle should be hit
      // circle[1] & 1: the color this circle is
      // circle[1] & 2: whether the circle is large
      // circle[1] & 4: slider
      // circle[1] & 8: spinner
      // circle[2]: slider/spinner duration
      const circle = this.map.hits[this.cursor];
      if (circle[1] & 4) {
        this.track.addSlider(circle[0], circle[2]);
      } else if (circle[1] & 8) {
        this.track.addSpinner(circle[0], circle[2]);
      } else {
        this.track.addNormalCircle(circle[0], circle[1] % 2, circle[1] & 2);
      }
      this.cursor++;
    }

    this.scoreText.text = "Score: " + this.getTotalScore();
    this.comboText.text = "Combo: " + this.combo;
    if (this.hitObjects) {
      this.accText.text = "Acc: " + this.getOverallAccuracy() + "%";
    }
  }
}
