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
    this.position = position;

    // time from when circle enters screen to when it should be hit
    this.approachTime = approachTime;
  
    let target = new PIXI.Sprite(
      PIXI.loader.resources["img/target.png"].texture
    );
    target.width = 152;
    target.height = 152;
    target.x = 116;

    this.container.addChild(target);
    this.container.addChild(this.circles);
  }

  // spawn a new hitcircle
  addCircle(hitTime) {
    console.log("adding sprite");
    const circle = new PIXI.Sprite(this.texture);
    circle.width = 128;
    circle.height = 128;
    circle.x = window.innerWidth;
    circle.y = this.position + 12;
    circle.hitTime = hitTime;
    circles.addChild(circle);
  }

  // update position of active hitcircles 
  updateCircles(time) {
    let toDelete = [];
    for (const circle of this.circles.children) {
      circle.x = 128 + (128 - window.innerWidth)/this.approachTime * (time - circle.hitTime);

      if (circle.x < -128) {
        toDelete.push(circle);
      }
    }

    // despawn old hitcircles
    // (this may be removed when I add proper miss detection)
    for (const circle of toDelete) {
      this.circles.removeChild(circle);
    }
  }

  // register a hit (keypress) on this track
  hit(time) {
    this.circles.removeChildAt(0); 
    this.hitsound.play();
  }
} 
