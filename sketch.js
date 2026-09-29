const w = 1280;
const h = 720;

let gameFont;
let ammo_img;

let hp = null;
let ammo_mag = 30;
let ammo = 120;
let current_wave = 0;
let score = 0;

let player_x = 0;
// neg y would be pos y in unity(y is inverted, like with the normal screen drawing)
let player_y = 450;
let player_z = 0;
let player_angle_x = 0;
let player_angle_y = 0;
let cam_color;
let speed = 5;

function setup(){
  createCanvas(w, h, WEBGL);
  textFont(gameFont);
  // resize the img, y=0 preserves the original ratio and turn the black logo into a white one
  ammo_img.resize(60, 0);
  ammo_img.filter(INVERT);

  cam_color = color(255, 255, 255);
}

function preload(){
  ammo_img = loadImage("ammo.png");
  gameFont = loadFont('EvilEmpire-lx5R0.ttf');
}

function draw(){
  // green background, so i know immediately when a wall decided to disapear
  background(100, 200, 100);

  // select current draw screen mode
  if(hp>0){
    handle_input();
    draw_3d();
    draw_in_game_stats();
  } else if(hp == null){
    draw_start_screen();
  } else{
    draw_death_screen();
  }
  // ascii code for space = 32
  if(keyIsDown(32)){
    if(hp>0){
      hp--
    }
  }

}

// keyPressed, only activates the key once per press
function keyPressed(){
  // detect if space == pressed to continue to the next screen
  if(key == " "){
    if(hp == null){
      hp = 100;
    } else if(hp<=0){
      hp = null;
    }
  }
}

function mousePressed() {
  // hide the cursor
  requestPointerLock();
}

// handle_input activates while it's pressed, until it isn't anymore
function handle_input(){
  // w = 87
  if(keyIsDown(87)){
    player_x += sin(player_angle_x) * speed;
    player_z -= cos(player_angle_x) * speed;
  }
  // s = 83
  if (keyIsDown(83)) {
    player_x -= sin(player_angle_x) * speed;
    player_z += cos(player_angle_x) * speed;
  }
  // a = 65
  if (keyIsDown(65)) {
    player_x -= cos(player_angle_x) * speed;
    player_z -= sin(player_angle_x) * speed;
  }
  // d = 86
  if (keyIsDown(68)) {
    player_x += cos(player_angle_x) * speed;
    player_z += sin(player_angle_x) * speed;
  }

  player_angle_x += movedX * 0.05;
  player_angle_y += movedY * 0.05;
  player_angle_y = constrain(player_angle_y, -1.5, 1.5);

  if(player_x > 490){
    player_x = 490;
  } else if(player_x < -490){
    player_x = -490;
  }
  if(player_z > 490){
    player_z = 490;
  } else if(player_z < -490){
    player_z = -490;
  }
  console.log(player_x, player_y, player_z);
}

function draw_start_screen(){
  background(50);
  draw_text(-425, -150, 200, 'USSPPVEJSS');
  draw_text(-150, 300, 40, "press SPACE to start");
}

// draws the stats + crosshair
function draw_in_game_stats(){
  camera();
  noLights();
  // switch to ortho projection for flat, 1:1 pixel UI
  ortho(-w / 2, w / 2, -h / 2, h / 2, -10000, 10000);
  drawingContext.disable(drawingContext.DEPTH_TEST);
  push();
  // move the drawing center to the topleft
  translate(-w/2, -h/2);

  // ammo counter
  fill(255);
  draw_text(1070, 50, 50, `${ammo_mag}/${ammo}`);
  draw_img(ammo_img, 1220, 0);

  // health bar
  fill(150);
  rect(1070, 65, 200, 40);
  noStroke();
  fill(200, 0, 0);
  rect(1072, 67, 196, 36);
  fill(0, 200, 0);
  rect(1072, 67, hp/100*196, 36);

  fill(0);
  draw_text(1130, 95, 25, `${hp}/100 hp`);

  // display current wave and score
  fill(255);
  draw_text(15, 50, 50, `wave: ${current_wave}`);
  draw_text(15, 100, 50, `score: ${score}`);

  // crosshair
  // move the drawing center, back to the center
  translate(w/2, h/2);
  fill(255);
  rect(-2, -20, 4, 40);
  rect(-20, -2, 40, 4);
  pop();
  drawingContext.enable(drawingContext.DEPTH_TEST);
}

function draw_text(x, y, size, str){
  textSize(size);
  text(str, x, y);
}

// might needs to just get replaced by image(img, x, y)
function draw_img(img, x, y){
  push();
  translate(x, y);
  image(img, 0, 0);
  pop();
}

function draw_death_screen(){
  background(0);
  push();
  fill(200, 0, 0);
  draw_text(-300, -150, 200, 'YOU DIED');
  fill(200);
  draw_text(-40, -100, 25, `score: ${score}`);
  pop();
}

function draw_3d(){
  let look_x = player_x + sin(player_angle_x) * 100;
  let look_y = player_y + sin(player_angle_y) * 100;
  let look_z = player_z - cos(player_angle_x) * 100;
  camera(player_x, player_y, player_z, look_x, look_y, look_z, 0, 1, 0);

  // stop the cam clipping
  perspective(PI / 3.0, w / h, 1, 10000);
  
  ambientLight(100);
  pointLight(cam_color, player_x, player_y, player_z);

  noStroke();
  
  // walls and the floor and ceiling
  push();
  translate(0, 500, 0);
  rotateX(HALF_PI);
  fill(60);
  plane(1000, 1000);
  pop();

  push();
  translate(0, -500, 0);
  rotateX(HALF_PI);
  fill(40);
  plane(1000, 1000);
  pop();

  push();
  translate(-500, 0, 0);
  rotateY(HALF_PI);
  fill(80);
  plane(1000, 1000);
  pop();

  push();
  translate(500, 0, 0);
  rotateY(-HALF_PI);
  fill(80);
  plane(1000, 1000);
  pop();

  push();
  translate(0, 0, -500);
  fill(100);
  plane(1000, 1000);
  pop();

  push();
  translate(0, 0, 500);
  rotateY(PI);
  fill(100);
  plane(1000, 1000);
  pop();

  // boxes on the floor(for if the room starts to feel trippy)
  /*
  fill(200, 50, 50);
  stroke(0);
  strokeWeight(2);
  
  for (let x = -300; x <= 300; x += 300) {
    for (let z = -300; z <= 300; z += 300) {
      push();
      translate(x, 450, z);
      box(100, 100, 100);
      pop();
    }
  }
  */
}
