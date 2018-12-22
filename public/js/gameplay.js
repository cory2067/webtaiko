// map keys to track index
const keymap = {
  1:0,2:0,3:0,4:0,5:0,6:0,7:0,8:0,9:0,0:0,
  q:1,w:1,e:1,r:1,t:1,y:1,u:1,i:1,o:1,p:1,
  a:2,s:2,d:2,f:2,g:2,h:2,j:2,k:2,l:2,';':2,
  z:3,x:3,c:3,v:3,b:3,n:3,m:3,',':3,'.':3,'/':3
}

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

    // map for row of keys -> track
    this.rowToTrack = {};

    // all tracks currently in play
    this.tracks = [];
    for (const i in this.map.tracks) {
      const trackData = this.map.tracks[i];
      const track = new Track(`img/hitcircle-${trackData.color}.png`,
                              `sound/hit-${trackData.sound}.wav`,
                              i, this.map.approachTime);

      this.tracks.push(track); 
      this.rowToTrack[trackData.row] = track;
      this.container.addChild(track.container);
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

  handleKey(event) {
    if (!(event.key in keymap)) return;

    const row = keymap[event.key];
    const track = this.rowToTrack[row];

    if (track) {
      track.hit(this.time());
    }
  }

  // update all tracks being played by the beatmap
  updateTracks() {
    const t = this.time();

    // update existing hitcircles
    for (const track of this.tracks) {
      track.updateCircles(t); 
    }

    // spawn new hitcircles
    while (this.map.hits[this.cursor][0] - this.map.approachTime < t) {
      // circle[0]: time (ms) when circle should be hit
      // circle[1]: the track this circle appears on
      const circle = this.map.hits[this.cursor];
      const track = this.tracks[circle[1]];

      track.addCircle(circle[0]);
      this.cursor++;
    }
  }
}
