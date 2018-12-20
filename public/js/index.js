let type = "WebGL"
if(!PIXI.utils.isWebGLSupported()){
  type = "canvas"
}

PIXI.utils.sayHello(type)

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
  .add("img/hitcircle.png")
  .load(setup);

let circles = new PIXI.particles.ParticleContainer();

let enter = keyboard("Enter");
enter.press = () => {
  let circle = new PIXI.Sprite(
    PIXI.loader.resources["img/hitcircle.png"].texture
  );

	circle.width = 128;
	circle.height = 128;

	circle.x = window.innerWidth; 
	circles.addChild(circle);
};


function setup() {
  app.stage.addChild(circles);

  app.ticker.add(delta => gameLoop(delta));
}

function gameLoop(delta) {
	let toDelete = [];
	for (const circle of circles.children) {
		circle.x -= 10*delta;
		if (circle.x < -128) {
			toDelete.push(circle);		
		}
  }	

	// avoid removing children while iterating
	for (const circle of toDelete) {
		circles.removeChild(circle);
	}

}
