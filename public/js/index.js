let type = "WebGL"
if(!PIXI.utils.isWebGLSupported()){
  type = "canvas"
}

PIXI.utils.sayHello(type)
PIXI.settings.PRECISION_FRAGMENT = PIXI.PRECISION.HIGH

//Create a Pixi Application
let app = new PIXI.Application();

//Add the canvas that Pixi automatically created for you to the HTML document
document.body.appendChild(app.view);

app.renderer.view.style.position = "absolute";
app.renderer.view.style.display = "block";
app.renderer.autoResize = true;
app.renderer.resize(window.innerWidth, window.innerHeight);

const keymap = {
 1:0,2:0,3:0,4:0,5:0,6:0,7:0,8:0,9:0,0:0,
 q:1,w:1,e:1,r:1,t:1,y:1,u:1,i:1,o:1,p:1,
 a:2,s:2,d:2,f:2,g:2,h:2,j:2,k:2,l:2,';':2,
 z:3,x:3,c:3,v:3,b:3,n:3,m:3,',':3,'.':3,'/':3
}

function keyboard(value) {
  let key = {};
  key.value = value;
  key.isDown = false;
  key.isUp = true;
  key.press = undefined;
  key.release = undefined;
  //The `downHandler`
  key.downHandler = event => {
    if (event.key === key.value) {
      if (key.isUp && key.press) key.press();
      key.isDown = true;
      key.isUp = false;
      event.preventDefault();
    }
  };

  //The `upHandler`
  key.upHandler = event => {
    if (event.key === key.value) {
      if (key.isDown && key.release) key.release();
      key.isDown = false;
      key.isUp = true;
      event.preventDefault();
    }
  };

  //Attach event listeners
  const downListener = key.downHandler.bind(key);
  const upListener = key.upHandler.bind(key);
  
  window.addEventListener(
    "keydown", downListener, false
  );
  window.addEventListener(
    "keyup", upListener, false
  );
  
  // Detach event listeners
  key.unsubscribe = () => {
    window.removeEventListener("keydown", downListener);
    window.removeEventListener("keyup", upListener);
  };
  
  return key;
}

PIXI.loader
  .add([
    "img/hitcircle-red.png",
    "img/target.png",
    "img/hitcircle-blue.png",
  ])
  .load(setup)

let track, circles;

window.addEventListener("keydown", event => { 
  const row = keymap[event.key]; 
  if (row == 2) {
    track.hit(performance.now() - musicStart);
  }
}, false);


let enter = keyboard("Enter");
enter.press = () => {
  let circle = new PIXI.Sprite(
    PIXI.loader.resources["img/hitcircle-blue.png"].texture
  );

  circle.width = 128;
  circle.height = 128;

  circle.x = window.innerWidth; 
  circle.y = 14;
  circles.addChild(circle);
};

let mapdata;
let mapcursor = 0;
$.getJSON("maps/kero.tkm", (map) => {
  console.log("loaded")
  mapdata = map.hits;
});

function handleHit(cir) {
  const musicTime = performance.now() - musicStart;  

  //if (musicTime < c.children[0].hitTime
  const color = cir.children[0].color;
  cir.removeChildAt(0);

  let hitsound;
  if (color == 0) {
    hitsound = sounds["sound/taiko/taiko-normal-hitnormal.wav"];
  } else {
    hitsound = sounds["sound/taiko/taiko-normal-hitclap.wav"];
  }
  hitsound.play();
}


sounds.load([
  "maps/kero.mp3",
  "sound/taiko/taiko-normal-hitnormal.wav",
  "sound/taiko/taiko-normal-hitclap.wav"
]);

let musicStart;
sounds.whenLoaded = () => {
  let music = sounds["maps/kero.mp3"];
  musicStart = performance.now();
  music.play();
}

function setup() {
  track = new Track("img/hitcircle-blue.png",
                    "sound/taiko/taiko-normal-hitclap.wav",
                    0, 1000);

  circles = track.circles;

  let target = new PIXI.Sprite(
    PIXI.loader.resources["img/target.png"].texture
  );
  target.width = 152;
  target.height = 152;
  target.x = 116;

  //app.stage.addChild(target);
  //app.stage.addChild(circles);
  app.stage.addChild(track.container);
  app.ticker.add(stepTracks);
}

function stepTracks() {
  const musicTime = performance.now() - musicStart;  
  track.updateCircles(musicTime);
  
  while (mapdata[mapcursor][0] - 1500 < musicTime) {
    track.addCircle(mapdata[mapcursor][0]);
    mapcursor++;
  }
}

function musicStep() {
  const musicTime = performance.now() - musicStart;  

  // spawn new hitcircles
  while (mapdata[mapcursor][0] - 1500 < musicTime) {
    let tex;
    if (mapdata[mapcursor][1]) {
      tex = PIXI.loader.resources["img/hitcircle-blue.png"].texture
    } else {
      tex = PIXI.loader.resources["img/hitcircle-red.png"].texture
    }

    const circle = new PIXI.Sprite(tex);

    circle.width = 128;
    circle.height = 128;

    circle.x = window.innerWidth; 
    circle.y = 12;
    circle.color = mapdata[mapcursor][1];
    circle.hitTime = mapdata[mapcursor][0];
    circles.addChild(circle);
    mapcursor++;
  }

  // update positions of existing hitcircles
  let toDelete = [];
  for (const circle of circles.children) {
    circle.x = 128 + (128 - window.innerWidth)/1000 * (musicTime - circle.hitTime);

    if (circle.x < -128) {
      toDelete.push(circle);
    }
  }
 
  // despawn old hitcircles 
  for (const circle of toDelete) {
    circles.removeChild(circle);
  }
}
