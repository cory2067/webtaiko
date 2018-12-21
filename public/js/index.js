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
  .load(setup);

let circles = new PIXI.Container();

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

sounds.load([
  "maps/kero.mp3"
]);

let musicStart;
sounds.whenLoaded = () => {
  let music = sounds["maps/kero.mp3"];
  musicStart = performance.now();
  music.play();
  app.ticker.add(musicStep);
}

function setup() {
  let target = new PIXI.Sprite(
    PIXI.loader.resources["img/target.png"].texture
  );
  target.width = 152;
  target.height = 152;
  target.x = 116;

  app.stage.addChild(target);
  app.stage.addChild(circles);

  //app.ticker.add(delta => gameLoop(delta));
}

function musicStep() {
  const musicTime = performance.now() - musicStart;  

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
    circle.hitTime = mapdata[mapcursor][0];
    circles.addChild(circle);
    mapcursor++;
  }

  let toDelete = [];
  for (const circle of circles.children) {
    circle.x = 128 + (128 - window.innerWidth)/1000 * (musicTime - circle.hitTime);

    if (circle.x < -128) {
      toDelete.push(circle);
    }
  }
  
  for (const circle of toDelete) {
    circles.removeChild(circle);
  }
}
