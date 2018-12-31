const HIT_WINDOW = 35; 
const TRACK_POSITION = 152;

class Track {
  constructor(approachTime=1000) {
    // master container for this track
    this.container = new PIXI.Container();

    // all active hitcircles in this track
    // TODO refactor with particlecontainer (will need to use sprite sheet)
    this.circles = new PIXI.Container();

    // sound to play when note hit
    this.hitsounds = [
        sounds['/static/sound/hit-center.wav'],
        sounds['/static/sound/hit-rim.wav']
    ]

    // textures to use for hitcircles on this track
    this.textures = [
        PIXI.loader.resources['/static/img/hitcircle-red.png'].texture,
        PIXI.loader.resources['/static/img/hitcircle-blue.png'].texture
    ];

    this.indicatorTex = {
        0:   PIXI.loader.resources['/static/img/miss.png'].texture,
        25:  PIXI.loader.resources['/static/img/hit-bad.png'].texture,
        50:  PIXI.loader.resources['/static/img/hit-good.png'].texture,
        100: PIXI.loader.resources['/static/img/hit-perfect.png'].texture
    };

    // y coordinate of this track
    // may be changable in future
    this.position = TRACK_POSITION;

    // time from when circle enters screen to when it should be hit
    this.approachTime = approachTime;

    // state needed to detect large hitcircle hits (two keys)
    this.largeHit = { active: false };

    // indicates perfect, good, bad, miss
    this.indicator = {};
  
    let target = new PIXI.Sprite(
      PIXI.loader.resources["/static/img/target.png"].texture
    );
    target.width = 152;
    target.height = 152;
    target.x = 116;
    target.y = this.position;

    this.container.addChild(target);
    this.container.addChild(this.circles);
  }

  // spawn a new hitcircle
  addCircle(hitTime, color, large) {
    const circle = new PIXI.Sprite(this.textures[color]);
    circle.color = color;
    circle.large = large;
    circle.width = 128 + large * 36;
    circle.height = 128 + large * 36;
    circle.x = window.innerWidth;
    circle.y = this.position + 12 - 18*large;
    circle.hitTime = hitTime;
    this.circles.addChild(circle);
  }

  updateIndicator(time, hit=-1) {
    // a hit/miss was registered!
    if (hit > -1) {
      if (this.indicator.sprite) { // remove the last indicator
        this.container.removeChild(this.indicator.sprite);
      }

      const ind = new PIXI.Sprite(this.indicatorTex[hit]);

      ind.width = 256;
      ind.height = 256;
      ind.x = 64;
      ind.y = this.position - 54;

      this.indicator.sprite = ind;
      this.container.addChild(ind);
    } else if (this.indicator.sprite) {
      // no hit registered, just continue the animation of the current one
      const ind = this.indicator.sprite;
      ind.alpha -= 0.05;
      if (ind.alpha < 0) {
        ind.alpha = 0;
      }

    }
  }

  // update position of active hitcircles 
  updateCircles(time) {
    let toDelete = [];
    for (const circle of this.circles.children) {
      circle.x = 128 + (128 - window.innerWidth)/this.approachTime * (time - circle.hitTime);

      if (time-circle.hitTime > HIT_WINDOW*4) { // took too long to hit
        toDelete.push(circle);
      }
    }

    // despawn old hitcircles
    // (this may be removed when I add proper miss detection)
    for (const circle of toDelete) {
      this.circles.removeChild(circle);
    }

    this.updateIndicator(time, -1); // step the indicator's animtion
    return toDelete.length; // number of missed notes
  }

  // register a hit (keypress) on this track
  // returns accuracy of this hit, or -1 if no hit was registered
  hit(time, color) {
    this.hitsounds[color].play(); // always play hitsound
    if (!this.circles.children.length) return -1; // no circles on track, ignore
    const circle = this.circles.getChildAt(0);
    const error = Math.abs(circle.hitTime - time);

    if (this.largeHit.active) { // first, see if the second hit for a large circle
      this.largeHit.active = false;
      // 5 ms window to hit double notes
      if (color == this.largeHit.color && time - this.largeHit.time < 5) {
        // successful large hit
        return this.largeHit.acc;
      }
    }
    
    if (error >= HIT_WINDOW*4) return -1; // circles too far away
    if (color != circle.color) {
      this.circles.removeChildAt(0); 
      return 0;  // wrong color is a miss 
    }

    let acc; 
    if (error < HIT_WINDOW)
      acc = 100;
    else if (error < HIT_WINDOW*2)
      acc = 50;
    else
      acc = 25;

    if (circle.large) {
      this.largeHit = {
          active: true,
          time: time,
          acc: acc,
          color: color
      }
    }

    this.circles.removeChildAt(0); 
    return acc;
  }
} 
