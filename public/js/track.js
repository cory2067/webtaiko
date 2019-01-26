const HIT_WINDOW = 30; 
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
        PIXI.loader.resources['/static/img/hitcircle-blue.png'].texture,
        PIXI.loader.resources['/static/img/sliderhead.png'].texture,
        PIXI.loader.resources['/static/img/sliderbody.png'].texture,
        PIXI.loader.resources['/static/img/sliderend.png'].texture,
        PIXI.loader.resources['/static/img/spinner-warning.png'].texture,
        PIXI.loader.resources['/static/img/spinner-circle.png'].texture
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
    
    // state of current spinner
    this.spinner = { active: false };

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

  addSlider(hitTime, duration) {
    const slider = new PIXI.Container();
    slider.type = "slider";
    slider.hitTime = hitTime;
    slider.duration = duration;
    slider.x = window.innerWidth;
    slider.y = this.position + 12;

    const head = new PIXI.Sprite(this.textures[2]);
    head.width = 128;
    head.height = 128;
    slider.addChild(head);

    // pixels per ms
    const rate = (window.innerWidth - 128)/this.approachTime;

    const body = new PIXI.Sprite(this.textures[3]);
    console.log(duration, rate, duration*rate);
    body.width = duration*rate - 256;
    body.height = 128;
    body.x = 128;
    slider.addChild(body);

    const end = new PIXI.Sprite(this.textures[4]);
    end.width = 128;
    end.height = 128;
    end.x = 128 + body.width;
    slider.addChild(end);

    this.circles.addChild(slider); 
  }

  // add spinner warning sprite
  addSpinner(hitTime, duration) {
    const spinner = new PIXI.Sprite(this.textures[5]);
    spinner.type = "spinner";
    spinner.width = 128;
    spinner.height = 128;
    spinner.x = window.innerWidth;
    spinner.y = this.position + 12;
    spinner.hitTime = hitTime;
    spinner.duration = duration;
    this.circles.addChild(spinner);
  }

  addSpinnerHUD() {
    const disp = new PIXI.Container();
    const sprite = new PIXI.Sprite(this.textures[6]);
    const text = new PIXI.Text(this.spinner.hits, new PIXI.TextStyle({fill: "white", align: "center"}));

    sprite.width = 256;
    sprite.height = 256;
    sprite.anchor.x = 0.5;
    sprite.anchor.y = 0.5;
    disp.y = this.position + 64;
    disp.x = 425;

    text.y = 140;
    text.anchor.x = 0.5;
    
    disp.addChild(sprite);
    disp.addChild(text);
   
    this.spinner.display = disp;  
    this.spinner.sprite = sprite;
    this.spinner.text = text;
    this.container.addChild(disp)
  }

  // spawn a new normal hitcircle
  addNormalCircle(hitTime, color, large) {
    const circle = new PIXI.Sprite(this.textures[color]);
    circle.color = color;
    circle.type = large ? "large" : "normal";
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
    let misses = 0;
    for (const circle of this.circles.children) {
      circle.x = 128 + (128 - window.innerWidth)/this.approachTime * (time - circle.hitTime);

      switch (circle.type) {
        case "normal":
        case "large":
          if (time-circle.hitTime > HIT_WINDOW*3) { // took too long to hit
            toDelete.push(circle);
            misses++;
          }
          break;
        case "slider":
          // delete slider when it's finished
          if (time > circle.hitTime + circle.duration) {
            toDelete.push(circle);
          }
          break;
        case "spinner":
          // auto activate spinner
          if (time > circle.hitTime) {
            this.spinner.active = true;
            this.spinner.hits = Math.round(circle.duration / 80);
            this.spinner.endTime = circle.hitTime + circle.duration;
            this.spinner.color = -1; // start with any color
            this.addSpinnerHUD(); // todo clean up this 
            toDelete.push(circle);
          }
      }
    }

    if (this.spinner.active && time > this.spinner.endTime) {
      this.spinner.active = false;
      this.container.removeChild(this.spinner.display);
    }

    // despawn old hitcircles
    // (this may be removed when I add proper miss detection)
    for (const circle of toDelete) {
      this.circles.removeChild(circle);
    }

    this.updateIndicator(time, -1); // step the indicator's animtion
    return misses;
  }

  // register a hit (keypress) on this track
  // returns accuracy of this hit, or -1 if no hit was registered
  hit(time, color) {
    this.hitsounds[color].play(); // always play hitsound
   
    // may be active spinner even if no hitcircles on track 
    if (this.spinner.active && (this.spinner.color === -1 || this.spinner.color === color)) {
      this.spinner.hits--;
      this.spinner.sprite.rotation++;
      this.spinner.text.text--;
      this.spinner.color = 1 - color;
      console.log(this.spinner.hits);
      if (!this.spinner.hits) {
        this.spinner.active = false;
        this.container.removeChild(this.spinner.display);
      }
      return { type: "spinner", hits: this.spinner };
    }
    
    if (!this.circles.children.length) return { type: "none" }; // no circles on track, ignore
    const circle = this.circles.getChildAt(0);
    const error = Math.abs(circle.hitTime - time);

    if (this.largeHit.active) { // first, see if the second hit for a large circle
      this.largeHit.active = false;
      // 5 ms window to hit double notes
      if (color == this.largeHit.color && time - this.largeHit.time < 5) {
        // successful large hit
        return { type: "large", acc: this.largeHit.acc };
      }
    }

    if (circle.type === "slider") return { type: "slider" };

    // spinner is triggered automatically, so hitting the spinner warning does nothing
    if (circle.type === "spinner") return { type: "none" };
    
    if (error >= HIT_WINDOW*3) return { type: "none" }; // circles too far away
    if (color != circle.color) {
      this.circles.removeChildAt(0); 
      return { type: "miss" };  // wrong color is a miss 
    }

    let acc; 
    if (error < HIT_WINDOW)
      acc = 100;
    else if (error < HIT_WINDOW*2)
      acc = 50;
    else
      acc = 25;

    if (circle.type === "large") {
      this.largeHit = {
          active: true,
          time: time,
          acc: acc,
          color: color
      }
    }

    this.circles.removeChildAt(0); 
    return { type: "normal", acc: acc };
  }
} 
