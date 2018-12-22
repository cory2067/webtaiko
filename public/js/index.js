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
$.getJSON("maps/kero.tkm", (map) => {
  console.log("loaded")
  mapdata = map.hits;
});

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
