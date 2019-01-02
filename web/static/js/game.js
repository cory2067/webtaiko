let type = "WebGL"
if(!PIXI.utils.isWebGLSupported()){
  type = "canvas"
}

PIXI.utils.sayHello(type)
PIXI.settings.PRECISION_FRAGMENT = PIXI.PRECISION.HIGH

//Create a Pixi Application
let app = new PIXI.Application();

$(() => {
  document.body.appendChild(app.view);
  app.renderer.view.style.position = "absolute";
  app.renderer.view.style.display = "block";
  app.renderer.autoResize = true;
  app.renderer.resize(window.innerWidth, window.innerHeight);
});

PIXI.loader
  .add([
    "/static/img/target.png",
    "/static/img/hitcircle-red.png",
    "/static/img/hitcircle-blue.png",
    "/static/img/sliderhead.png",
    "/static/img/sliderbody.png",
    "/static/img/sliderend.png",
    "/static/img/spinner-warning.png",
    "/static/img/hit-perfect.png",
    "/static/img/hit-good.png",
    "/static/img/hit-bad.png",
    "/static/img/miss.png",
  ])
  .load(setup)


let mapData;
$.getJSON(`/static/maps/${MAP_ID}.tk`, (map) => {
  console.log("loaded tk");
  mapData = map;
});

sounds.load([
  `/static/maps/${MAP_ID}.mp3`,
  "/static/sound/hit-center.wav",
  "/static/sound/hit-rim.wav",
  "/static/sound/combobreak.wav"
]);

let gameplay;
sounds.whenLoaded = () => {
  gameplay = new Gameplay(`/static/maps/${MAP_ID}.mp3`, mapData);
  gameplay.start();
  app.stage.addChild(gameplay.container);
  app.ticker.add(gameplay.updateTrack.bind(gameplay));
}

function setup() {
}
