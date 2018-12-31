const HIT_WINDOW = 35; 

class Track {
  constructor(texture, hitsound, position, approachTime=1000) {
    // master container for this track
    this.container = new PIXI.Container();

    // all active hitcircles in this track
    this.circles = new PIXI.particles.ParticleContainer();

    // sound to play when note hit
    this.hitsound = sounds[hitsound];

    // texture to use for hitcircles on this track
    this.texture = PIXI.loader.resources[texture].texture;

    // y coordinate of this track
    this.position = position * 152;

    // time from when circle enters screen to when it should be hit
    this.approachTime = approachTime;

    // state needed to detect large hitcircle hits (two keys)
    this.largeHit = { active: false };
  
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
  addCircle(hitTime, large) {
    const circle = new PIXI.Sprite(this.texture);
    circle.large = large;
    circle.width = 128 + large * 36;
    circle.height = 128 + large * 36;
    circle.x = window.innerWidth;
    circle.y = this.position + 12 - 18*large;
    circle.hitTime = hitTime;
    this.circles.addChild(circle);
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

    return toDelete.length; // number of missed notes
  }

  // register a hit (keypress) on this track
  hit(time) {
    this.hitsound.play(); // always play hitsound
    if (!this.circles.children.length) return; // no circles on track, ignore
    const circle = this.circles.getChildAt(0);
    const error = Math.abs(circle.hitTime - time);
    
    if (this.largeHit.active) {
      this.largeHit.active = false;
      if (time - this.largeHit.time < 5) { // 5 ms window to hit double notes  
        // successful large hit
        return this.largeHit.acc;
      }
    }

    let acc; 
    if (error < HIT_WINDOW)
      acc = 100;
    else if (error < HIT_WINDOW*2)
      acc = 50;
    else if (error < HIT_WINDOW*4)
      acc = 25;
    else
      return 0;

    if (circle.large) {
      this.largeHit = {
          active: true,
          time: time,
          acc: acc
      }
    }

    this.circles.removeChildAt(0); 
    return acc;
  }
} 
