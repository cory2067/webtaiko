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

let mapdata;
let mapcursor = 0;
let mapall;
$.getJSON("maps/kero.tkm", (map) => {
  console.log("loaded")
  mapdata = map.hits;
  mapall = map;
});

sounds.load([
  "maps/kero.mp3",
  "sound/hit-center.wav",
  "sound/hit-rim.wav"
]);

let musicStart;
sounds.whenLoaded = () => {
  let music = sounds["maps/kero.mp3"];
  musicStart = performance.now();
  music.play();
  
  new Gameplay('maps/kero.mp3', mapall);
}

function setup() {
  track = new Track("img/hitcircle-blue.png",
                    "sound/hit-rim.wav",
                    0, 1000);

  circles = track.circles;

  app.stage.addChild(track.container);
  app.ticker.add(updateTracks);
}

function updateTracks() {
  const musicTime = performance.now() - musicStart;  
  track.updateCircles(musicTime);
  
  while (mapdata[mapcursor][0] - 1500 < musicTime) {
    track.addCircle(mapdata[mapcursor][0]);
    mapcursor++;
  }
}
