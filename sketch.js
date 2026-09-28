const w = 1280
const h = 720
let gameFont
let ammo_img

function setup(){
  createCanvas(w, h, WEBGL);
  textFont(gameFont);
  // resize the img, y=0 preserves the original ratio and turn the black logo into a white one
  ammo_img.resize(60, 0);
  ammo_img.filter(INVERT);
}

function preload(){
  ammo_img = loadImage("ammo.png");
  gameFont = loadFont('EvilEmpire-lx5R0.ttf');
}

function draw(){
  background(100)

  // draw screen mode
  if(hp>0){
    draw_in_game_stats()
  } else if(hp == null){
    draw_start_screen()
  } else{
    draw_death_screen()
  }
  // ascii code for space = 32
  if(keyIsDown(32)){
    if(hp>0){
      hp--
    }
  }

}

function keyPressed(){
  // detect if space == pressed to continue to the next screen
  if(key == " "){
    if(hp == null){
      hp = 100
    } else if(hp<=0){
      hp = null
    }
  }
}

function draw_start_screen(){
  background(50)
  draw_text(-425, -150, 200, 'USSPPVEJSS')
  draw_text(-150, 300, 40, "press SPACE to start")
}

let hp = null;
let ammo_mag = 30;
let ammo = 120;
let current_wave = 0;
let score = 0
// draws the stats + crosshair
function draw_in_game_stats(){
  push()
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
  pop()
}

function draw_text(x, y, size, str){
  textSize(size);
  text(str, x, y);
}

/*
// def all img stuff
function preload_image(img_path, size){
  return loadImage(img_path, function() {
    console.log('Image loaded successfully');
  }, function(err) {
    console.error('Failed to load image:', err);
  }).resize(size);
}
*/

// might needs to just get replaced by image(img, x, y)
function draw_img(img, x, y){
  push();
  translate(x, y);
  image(img, 0, 0);
  pop();
}

function draw_death_screen(){
  push()
  background(0)
  fill(200, 0, 0)
  draw_text(-300, -150, 200, 'YOU DIED')
  fill(200)
  draw_text(-40, -100, 25, `score: ${score}`)
  pop()
}