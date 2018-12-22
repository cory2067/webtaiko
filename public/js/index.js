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


let mapData;
$.getJSON("maps/kero.tkm", (map) => {
  console.log("loaded tkm");
  mapData = map;
});

sounds.load([
  "maps/kero.mp3",
  "sound/hit-center.wav",
  "sound/hit-rim.wav"
]);

let gameplay;
sounds.whenLoaded = () => {
  gameplay = new Gameplay('maps/kero.mp3', mapData);
  gameplay.start();
  app.stage.addChild(gameplay.container);
  app.ticker.add(gameplay.updateTracks.bind(gameplay));
}

function setup() {
}
