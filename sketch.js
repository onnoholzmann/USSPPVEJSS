const w = 1280;
const h = 720;

let gameFont;
let ammo_img;
let gun_reload_sound;
let mag_model;
let mag_scale_factor;
let heart_model;
let heart_scale_factor;
let shoe_model;
let shoe_scale_factor;
let models_gpu_initialized = false;
// shop dictates the index
let current_weapon = 1;

let shop_open = false;
let ammo_box_img;
let ak47_model;
let ak47_img;
let g18_model;
let g18_img;
let m4a1_model;
let m4a1_img;
let m82_model;
let m82_img;
let shop_list = [() => {player.weapon.current_ammo += player.weapon.max_mag_ammo * 3},
                  () => {player.weapon = new Weapon(ak47_model, Infinity, 120, 30, 30, 30, 2, true, 100)},
                  () => {player.weapon = new Weapon(g18_model, Infinity, 85, 17, 17, 20, 4, true, 10)},
                  () => {player.weapon = new Weapon(m82_model, Infinity, 40, 10, 10, 1000, 2, false, 1000)},
                  () => {player.weapon = new Weapon(m4a1_model, Infinity, 210, 30, 30, 60, 3, true, 70)}
                ]
let price_list = [30, 50, 75, 125, 200]
let player_coins = 0;
// prevent that you insta buy something
let shop_click_cooldown = 0;

// let gunshot_sound;
// make sure, multiple shots can get their sounds rendered at once
let gunshot_sounds = []; 
let gunshot_pool_index = 0; 

// let hp = null;
// let ammo_mag = 30;
// let ammo = 120;
let current_wave = 0;
// let score = 0;
let enemys = [];
let powerups = [];

// let player_x = 0;
// neg y would be pos y in unity(y is inverted, like with the normal screen drawing)
// let player_y = 450;
// let player_z = 0;
// let player_angle_x = 0;
// let player_angle_y = 0;
let cam_color;
let speed = 5;

function setup(){
  createCanvas(w, h, WEBGL);
  textFont(gameFont);
  // resize the img, y=0 preserves the original ratio and turn the black logo into a white one
  ammo_img.resize(60, 0);
  ammo_img.filter(INVERT);

  cam_color = color(255, 255, 255);
  // ak47 = new Weapon(ak_model, 120, 120, 30, 30, 30, 2, true, 100);
  enemys.push(new Enemy(100, 435, 0, 0, 0, new Weapon(ak47_model, 120, 120, 30, 30, 30, 2, true, 100), color(100, 200, 255), 15, 100, 10, 2));
  // initiate player as enemy object, but don't render the model
  player = new Enemy(0, 450, 0, 0, 0, new Weapon(ak47_model, 120, 120, 30, 30, 30, 2, true, 100), color(0), 15, null, 0);
  mag_scale_factor = 40/get_model_dimensions(mag_model).y;
  heart_scale_factor = 50/get_model_dimensions(heart_model).y;
  shoe_scale_factor = 25/get_model_dimensions(shoe_model).y;

  // ammo_box_img.resize(150, 0);
  ammo_box_img = smart_resize(ammo_box_img, 140)
  ak47_img = smart_resize(ak47_img, 0, 130);
  g18_img = smart_resize(g18_img, 130);
  m82_img = smart_resize(m82_img, 140);
  m4a1_img = smart_resize(m4a1_img, 140);
}

function preload(){
  ammo_img = loadImage("ammo.png");
  gameFont = loadFont('EvilEmpire-lx5R0.ttf');
  mag_model = loadModel('ExtendedMag.obj');
  heart_model = loadModel('heart.obj');
  shoe_model = loadModel('shoe.obj');
  gun_reload_sound = loadSound('gun-reload.mp3');

  ammo_box_img = loadImage('ammo_box.png');
  ak47_model = loadModel('ak47.stl');
  ak47_img = loadImage('ak-47.png');
  g18_model = loadModel('g18.obj');
  g18_img = loadImage('g18.png');
  m82_model = loadModel('m82-50cal.stl');
  m82_img = loadImage('m82_50cal.png');
  m4a1_model = loadModel('M4A1_Carbine.stl');
  m4a1_img = loadImage('m4a1-carabine.png');

  // gunshot_sound = loadSound('submachine-gun.mp3');
  for(let i = 0; i < 8; i++) {
    gunshot_sounds.push(loadSound('submachine-gun.mp3'));
  }
}

// resizes to the desired size, even if there is a section of the photo seethrough, so it doesn't fuck up your plan
function smart_resize(img, w, h=0){
  img.loadPixels();
  
  let min_x = img.width;
  let min_y = img.height;
  let max_x = 0;
  let max_y = 0;
  
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      let i = (x + y * img.width) * 4;
      let alpha = img.pixels[i + 3];

      if (alpha > 0) {
        if (x < min_x) min_x = x;
        if (y < min_y) min_y = y;
        if (x > max_x) max_x = x;
        if (y > max_y) max_y = y;
      }
    }
  }
  
  let width = max_x - min_x + 1;
  let height = max_y - min_y + 1;
  let cropped_img = img.get(min_x, min_y, width, height);
  cropped_img.resize(w, h);
  return cropped_img;
}

function draw(){
  // make sure the models are initialized on the gpu, to prevent those absolutely massive lagspikes
  if (!models_gpu_initialized && frameCount > 2){
    console.log("torturing gpu");
    push();
    camera();
    // move it behind the cam, so it isn't visible
    translate(0, 0, -2000);
    
    ambientLight(100);
    specularMaterial(160, 160, 160);
    shininess(50);
    
    if(ak47_model) model(ak47_model);
    if(g18_model) model(g18_model);
    if(m82_model) model(m82_model);
    if(m4a1_model) model(m4a1_model);
    if(mag_model) model(mag_model);
    if(heart_model) model(heart_model);
    if(shoe_model) model(shoe_model);
    
    pop();
    models_gpu_initialized = true;
    console.log("gpu tortured succesfully");
  }
  // green background, so i know immediately when a wall decided to teleport into another dimension, out of nowhere
  background(100, 200, 100);

  // select current draw screen mode
  if(player.hp>0){
    handle_input();
    draw_3d();
    draw_in_game_stats();
  } else if(player.hp == null){
    draw_start_screen();
  } else{
    draw_death_screen();
  }
}

// keyPressed, only activates the key once per press
function keyPressed(){
  // detect if space == pressed to continue to the next screen
  if(key == " "){
    if(player.hp == null){
      player = new Enemy(0, 450, 0, 0, 0, new Weapon(ak47_model, 120, 120, 30, 30, 30, 2, true, 100), color(0), 15, 100, 0);
      current_wave = 0;
      player_coins = 0;
    } else if(player.hp<=0){
      player.hp = null;
    }
  }
  if(key == "r" || key == "R"){
    player.weapon.reload();
  }
}

// in py
// lambda a, b: a * b
// is hetzelfde als
// (a, b) => a * b
// in js
function mousePressed() {
  // hide the cursor if the shop isn't opened, else, make the shop function
  if(!shop_open){
    requestPointerLock();
  } else{
    if(mouseY > 465 && mouseY < 570 && shop_click_cooldown <= 0){
      for(let i = 0; i < 5; i++){
        if(mouseX > 115 + 225*i && mouseX < 265 + 225*i && current_weapon != i && player_coins >= price_list[i]){
          shop_list[i]();
          player_coins -= price_list[i];
          if(i != 0){
            shop_open = false;
            requestPointerLock();
          }
        }
      }
    } else if(get_dist_pyth([mouseX, mouseY], [1200, 120]) < 30 && shop_click_cooldown <= 0){
      shop_open = false;
      requestPointerLock();
      next_wave_time = new Date().getTime() + 5000;
    }
    console.log(mouseX, mouseY, shop_click_cooldown)
  }
  // ak47.shoot_scan(player_angle_x, player_angle_y, [player_x, player_y, player_z], enemys)
}

// handle_input activates while it's pressed, until it isn't anymore
function handle_input(){
  // make sure, you can't move or look around, while you're using the shop
  if(shop_open) return;
  // w = 87
  if(keyIsDown(87)){
    player.x += sin(player.lookangle_x) * speed * player.speed_modifier;
    player.z -= cos(player.lookangle_x) * speed * player.speed_modifier;
  }
  // s = 83
  if(keyIsDown(83)){
    player.x -= sin(player.lookangle_x) * speed * player.speed_modifier;
    player.z += cos(player.lookangle_x) * speed * player.speed_modifier;
  }
  // a = 65
  if(keyIsDown(65)){
    player.x -= cos(player.lookangle_x) * speed * player.speed_modifier;
    player.z -= sin(player.lookangle_x) * speed * player.speed_modifier;
  }
  // d = 86
  if(keyIsDown(68)){
    player.x += cos(player.lookangle_x) * speed * player.speed_modifier;
    player.z += sin(player.lookangle_x) * speed * player.speed_modifier;
  }
  // check player press LMB
  if(mouseIsPressed && mouseButton === LEFT){
    if(player.weapon.check_allowed_fire() && !shop_open){
      player.weapon.shoot_scan(player.lookangle_x, player.lookangle_y, [player.x, player.y, player.z], enemys);
    }
  }

  player.lookangle_x += movedX * 0.05;
  player.lookangle_y += movedY * 0.05;
  player.lookangle_y = constrain(player.lookangle_y, -1.5, 1.5);

  if(player.x > 490){
    player.x = 490;
  } else if(player.x < -490){
    player.x = -490;
  }
  if(player.z > 490){
    player.z = 490;
  } else if(player.z < -490){
    player.z = -490;
  }
  // console.log(player_x, player_y, player_z);
  
  player.speed_modifier_remaining--;
  if(player.speed_modifier_remaining <= 0){
    player.speed_modifier = 1;
  }
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
  draw_text(1070, 50, 50, `${player.weapon.current_mag_ammo}/${player.weapon.current_ammo}`);
  draw_img(ammo_img, 1220, 0);

  // health bar
  fill(150);
  rect(1070, 65, 200, 40);
  noStroke();
  fill(200, 0, 0);
  rect(1072, 67, 196, 36);
  fill(0, 200, 0);
  rect(1072, 67, player.hp/100*196, 36);

  fill(0);
  draw_text(1130, 95, 25, `${int(player.hp)}/100 hp`);

  // display current wave and score
  fill(255);
  draw_text(15, 50, 50, `wave: ${current_wave}`);
  draw_text(15, 100, 50, `coins: ${player_coins}`);
  draw_text(15, 150, 50, `score: ${int(player.score)}`);
  if(enemys.length <= 0){
    draw_text(250, 350, 100, "next wave incoming...");
  }

  // crosshair
  push();
  // move the drawing center, back to the center
  translate(w/2, h/2);
  fill(255);
  rect(-2, -20, 4, 40);
  rect(-20, -2, 40, 4);
  pop();
  
  if(shop_open){
    draw_shop();
  }

  pop();
  drawingContext.enable(drawingContext.DEPTH_TEST);
}

function draw_shop(){
  if(shop_click_cooldown > 0) shop_click_cooldown--;
  push();
  stroke(25);
  strokeWeight(2);

  fill(100);
  rect(65, 100, 1150, 520, 25);

  // draw individual shop thingy
  translate(-35, 0)
  push();
  translate(125, 125);
  fill(22, 105, 122);
  rect(0, 0, 200, 470, 25);
  fill(237, 231, 227);
  rect(25, 25, 150, 150, 10);
  draw_img(ammo_box_img, 30, 33);
  fill(0);
  draw_text(25, 225, 50, "AMMO");
  draw_text(25, 255, 25, "3 mags of ammo");
  draw_text(25, 285, 25, "for your current");
  draw_text(25, 315, 25, "gun");

  fill(255, 49, 49);
  rect(25, 340, 150, 105, 10);
  fill(0);
  draw_text(40, 400, 35, `${price_list[0]} coins`)
  pop();

  translate(225, 0);
  push();
  translate(125, 125);
  fill(22, 105, 122);
  rect(0, 0, 200, 470, 25);
  fill(237, 231, 227);
  rect(25, 25, 150, 150, 10);
  draw_img(ak47_img, 40, 35);
  fill(0);
  draw_text(25, 225, 50, "AK-47");
  draw_text(25, 255, 25, "firerate: MEDIUM");
  draw_text(25, 285, 25, "magsize: 30");
  draw_text(25, 315, 25, "ammo: 150");

  fill(255, 49, 49);
  rect(25, 340, 150, 105, 10);
  fill(0);
  if(current_weapon == 1){
    draw_text(40, 400, 35, "OWNED")
  } else{
    draw_text(40, 400, 35, `${price_list[1]} coins`)
  }
  pop();

  translate(225, 0);
  push();
  translate(125, 125);
  fill(22, 105, 122);
  rect(0, 0, 200, 470, 25);
  fill(237, 231, 227);
  rect(25, 25, 150, 150, 10);
  draw_img(g18_img, 35, 60);
  fill(0);
  draw_text(25, 225, 50, "G18");
  draw_text(25, 255, 25, "firerate: HIGH");
  draw_text(25, 285, 25, "magsize: 17");
  draw_text(25, 315, 25, "ammo: 102");

  fill(255, 49, 49);
  rect(25, 340, 150, 105, 10);
  fill(0);
  if(current_weapon == 2){
    draw_text(40, 400, 35, "OWNED")
  } else{
    draw_text(40, 400, 35, `${price_list[2]} coins`)
  }
  pop();

  translate(225, 0);
  push();
  translate(125, 125);
  fill(22, 105, 122);
  rect(0, 0, 200, 470, 25);
  fill(237, 231, 227);
  rect(25, 25, 150, 150, 10);
  draw_img(m82_img, 30, 65);
  fill(0);
  draw_text(25, 225, 50, "M82");
  draw_text(25, 255, 25, "firerate: LOW");
  draw_text(25, 285, 25, "magsize: 10");
  draw_text(25, 315, 25, "ammo: 50");

  fill(255, 49, 49);
  rect(25, 340, 150, 105, 10);
  fill(0);
  if(current_weapon == 3){
    draw_text(40, 400, 35, "OWNED")
  } else{
    draw_text(40, 400, 35, `${price_list[3]} coins`)
  }
  pop();

  translate(225, 0);
  push();
  translate(125, 125);
  fill(22, 105, 122);
  rect(0, 0, 200, 470, 25);
  fill(237, 231, 227);
  rect(25, 25, 150, 150, 10);
  draw_img(m4a1_img, 30, 60);
  fill(0);
  draw_text(25, 225, 50, "M4A1");
  draw_text(25, 255, 25, "firerate: MEDIUM");
  draw_text(25, 285, 25, "magsize: 30");
  draw_text(25, 315, 25, "ammo: 240");

  fill(255, 49, 49);
  rect(25, 340, 150, 105, 10);
  fill(0);
  if(current_weapon == 4){
    draw_text(40, 400, 35, "OWNED")
  } else{
    draw_text(40, 400, 35, `${price_list[4]} coins`)
  }
  pop();

  // exit cross in top right
  fill(255, 49, 49);
  translate(333, 120);
  circle(0, 0, 25);
  fill(255);
  strokeWeight(3);
  line(-(8)/sqrt(2), (8)/sqrt(2), (8)/sqrt(2), -(8)/sqrt(2));
  line((8)/sqrt(2), (8)/sqrt(2), -(8)/sqrt(2), -(8)/sqrt(2));

  pop();
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
  draw_text(-40, -100, 25, `score: ${int(player.score)}`);
  pop();
}

function draw_3d(){
  let look_x = player.x + sin(player.lookangle_x) * 100;
  let look_y = player.y + sin(player.lookangle_y) * 100;
  let look_z = player.z - cos(player.lookangle_x) * 100;
  camera(player.x, player.y, player.z, look_x, look_y, look_z, 0, 1, 0);

  // stop the cam clipping
  perspective(PI / 3.0, w / h, 1, 10000);
  
  ambientLight(100);
  pointLight(cam_color, player.x, player.y, player.z);

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

  player.weapon.draw([player.x, player.y, player.z], player.lookangle_x);
  manage_enemys();
  for(let enemy of enemys){
    enemy.move();
    enemy.draw();
    enemy.attempt_shot();
  }
  powerups = powerups.filter(powerup => !powerup.collected);
  for(let powerup of powerups){
    powerup.draw();
    powerup.check_collision();
  }

  /*
  push()
  // translate(player_x+15*sin(player_angle_x), player_y, player_z+15*cos(player_angle_x));
  let forwardDist = 15; // How far in front
  let sideDist = 20;    // How far to the side (e.g., right hand)
  let posX = player_x + forwardDist * cos(player_angle_x) + sideDist * sin(player_angle_x);
  let posZ = player_z + forwardDist * sin(player_angle_x) - sideDist * cos(player_angle_x);
  translate(posX, player_y, posZ);
  rotateY(-HALF_PI - player_angle_x)
  scale(1, -1, 1);
  specularMaterial(160, 160, 160);
  // normalMaterial();
  shininess(50);
  model(ak_model);
  pop();
  */

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


class Weapon{
  constructor(model, max_ammo, current_ammo, current_mag_ammo, max_mag_ammo, base_damage, headshot_multiplier, bullet_kill_one, fire_cooldown){
    this.model = model;
    // max and current ammo is what is in your backpack and the mag, is what is in your gun
    this.max_ammo = max_ammo;
    this.current_ammo = current_ammo;
    this.current_mag_ammo = current_mag_ammo;
    this.max_mag_ammo = max_mag_ammo;
    this.base_damage = base_damage;
    this.headshot_multiplier = headshot_multiplier;
    this.bullet_kill_one = bullet_kill_one;
    // both in ms
    this.fire_cooldown = fire_cooldown;
    this.last_fire = 0;
  }

  draw(parent_coords, rotate_x, forward_dist=15, side_dist=20, height_offset=0){
    // Only draw if the 3D model has finished loading
    if (!this.model) return;
    push();
    // translate(player_x+15*sin(player_angle_x), player_y, player_z+15*cos(player_angle_x));
    // position the gun(so it isn't in your face, when you shoot)
    // let forward_dist = 15;
    // let side_dist = 20;
    let [x, y, z] = parent_coords;
    let pos_x = x + forward_dist * cos(rotate_x) + side_dist * sin(rotate_x);
    let pos_z = z + forward_dist * sin(rotate_x) - side_dist * cos(rotate_x);
    translate(pos_x, y+height_offset, pos_z);
    rotateY(-HALF_PI - rotate_x)
    scale(1, -1, 1);
    specularMaterial(160, 160, 160);
    // normalMaterial();
    shininess(50);
    model(this.model);
    pop();
  }

  // check if the gun is ready/allowed to fire
  check_allowed_fire(){
    return (this.last_fire + this.fire_cooldown < Date.now() && this.current_mag_ammo > 0 && !gun_reload_sound.isPlaying())
  }

  reload(){
    let addable = this.max_mag_ammo - this.current_mag_ammo;
    if(addable > 0 && this.current_ammo > 0){
      gun_reload_sound.play();
      
      if(addable <= this.current_ammo){
        this.current_ammo -= addable;
        this.current_mag_ammo += addable;
      } else if(this.current_ammo > 0){
        this.current_mag_ammo += this.current_ammo;
        this.current_ammo = 0;
      }
    }
  }

  // this uses hitscan, but since you can't jump, it's simpler
  shoot_scan(shootangle_x, shootangle_y, bullet_origin, collide_check_list){
    this.current_mag_ammo--;
    this.last_fire = Date.now();
    let ds_player = get_dist_pyth(bullet_origin, [player.x, player.y, player.z]);
    let amp = 1 - 0.95 * constrain(ds_player / 1000, 0, 1);
    // play(startTime, rate, amplitude/volume)
    // gunshot_sound.play(0, 1, amp);
    console.log(`amp: ${amp}`)
    gunshot_sounds[gunshot_pool_index].play(0, 1, amp);
    gunshot_pool_index = (gunshot_pool_index + 1) % gunshot_sounds.length;
    // console.log("shot?")
    // vector of the direction of the shot
    let dx = sin(shootangle_x);
    let dz = -cos(shootangle_x);
    let a = -dz;
    let b = dx;
    let c = (-dz * bullet_origin[0]) + (dx * bullet_origin[2]);

    // make sure only one gets hit if bullet_kill_one == True
    let closest_hit = null;
    let min_distance = Infinity;
    let closest_is_headshot = false;

    for(let entity of collide_check_list){
      // console.log("s2")
      // vector of the direction of the entity
      let vx = entity.x - bullet_origin[0];
      let vz = entity.z - bullet_origin[2];
      
      // use the dot product of the 2 vectors to see if it is behind(needs ignoring) or front(damage, if close enough)
      let dot_product = (vx * dx) + (vz * dz);
      // the dot product is the (in this case) horizontal distance from the player to the hit
      let hit_y = bullet_origin[1] + (dot_product * tan(shootangle_y));
      // console.log(`dx = ${dx}, vx = ${vx}`)
      // console.log(`entity.x = ${entity.x}, bullet origin_x = ${bullet_origin.x}`)
      // console.log(`dot_product = ${dot_product}`)

      if(dot_product > 0){
        let dist_to_line = distance_point_line(a, b, c, entity.x, entity.z);
        let headshot = (hit_y >= entity.y - entity.body_radius && hit_y <= entity.y + entity.body_radius);
        // console.log(`dist_to_line = ${dist_to_line}`)
        if(dist_to_line < entity.body_radius && hit_y <= 500 && hit_y >= entity.y - entity.body_radius){
          if(!this.bullet_kill_one){
            if(headshot){
              entity.hit(this.base_damage * this.headshot_multiplier);
            } else{
              entity.hit(this.base_damage);
            }
          } else{
            if(dot_product < min_distance){
              min_distance = dot_product;
              closest_hit = entity;
              closest_is_headshot = headshot;
            }
          }
        }
      }
    }
    if(this.bullet_kill_one && closest_hit){
      if(closest_is_headshot){
        closest_hit.hit(this.base_damage * this.headshot_multiplier);
      } else{
        closest_hit.hit(this.base_damage);
      }
    }
  }  
}

function distance_point_line(a, b, c, x, y){
  return abs(a*x + b*y - c)/sqrt(a**2 + b**2)
}

class Enemy{
  constructor(x, y, z, lookangle_x, lookangle_y, weapon, color, body_radius, hp, reward_score, speed){
    this.x = x;
    this.y = y;
    this.z = z;
    this.lookangle_x = lookangle_x;
    this.lookangle_y = lookangle_y;
    this.weapon = weapon;
    this.color = color;
    this.body_radius = body_radius;
    this.body_height = 500-this.y-this.body_radius;
    this.hp = hp;
    this.is_alive = true;
    this.score = reward_score;
    this.goal_pos = this.new_goal_pos();
    this.speed = speed;
    this.fleeing = false;
    this.speed_modifier = 1;
    this.speed_modifier_remaining = Infinity;
    this.flee_cooldown = 0;
  }

  draw(){
    this.weapon.draw([this.x, this.y, this.z], this.lookangle_x, 5+this.body_radius, 5+this.body_radius, 15)
    push();
    fill(this.color);
    push();
    translate(this.x, this.y, this.z);
    sphere(this.body_radius);
    pop();
    push();
    translate(this.x, 500-this.body_height/2, this.z);
    cylinder(this.body_radius, this.body_height);
    pop();
    pop();
  }

  hit(damage){
    this.hp -= damage;
    if(this.hp <= 0){
      this.is_alive = false;
      player_coins += int(random(3, 7))
      player.score += this.score;
      console.log("dead");
      let rand_num = random(1, 10)
      if(rand_num <= 3){
        powerups.push(new Powerup(mag_model, this.x, 450, this.z, 100, 50, 25, 0.05, [255, 255, 10], mag_collect, mag_scale_factor));
      } else if(rand_num <= 7){
        powerups.push(new Powerup(heart_model, this.x, 450, this.z, 100, 50, 25, 0.05, [255, 10, 10], heart_collect, heart_scale_factor))
      } else{
        powerups.push(new Powerup(shoe_model, this.x, 450, this.z, 100, 50, 25, 0.05, [0, 204, 235], shoe_collect, shoe_scale_factor))
      }
    }
    console.log(`damage: ${damage}, ${this.hp}`);
  }

  new_goal_pos(){
    // let dist = get_dist_pyth([this.x, this.y, this.z], [player.x, player.y, player.z]);
    if(this.fleeing){
      this.fleeing = false;
      this.speed_modifier = 1;
      this.flee_cooldown = 30;
    }
    
    let dx = (random(0, 50)+50)*Math.sign(random(-1, 1));
    // let y = random(375, 450)
    let dz = (random(0, 50)+50)*Math.sign(random(-1, 1));

    let target_x = this.x + dx;
    let target_z = this.z + dz;
    // move the target if it's unreachable, to prevent buggy/yittery movement near the wall
    if (target_x >= 490) target_x = 490 - random(60, 100);
    else if (target_x <= -490) target_x = -490 + random(60, 100);
    else target_x = constrain(target_x, -490, 490);
    
    if (target_z >= 490) target_z = 490 - random(60, 100);
    else if (target_z <= -490) target_z = -490 + random(60, 100);
    else target_z = constrain(target_z, -490, 490);

    // return [constrain(, -490, 490), this.y, constrain(, -490, 490)];
    return [target_x, this.y, target_z]
  }

  move(){
    let dist = get_dist_pyth([this.x, this.y, this.z], this.goal_pos);
    if(dist < this.speed*1.5){
      this.goal_pos = this.new_goal_pos();
    }
    let player_dist = get_dist_pyth([this.x, this.y, this.z], [player.x, player.y, player.z]);
    if(player_dist < 75 && !this.fleeing){
      if(this.flee_cooldown <= 0){
        // let dx = this.x - player.x;
        // let dz = this.z - player.z;
        let player_delta_vector = [this.x - player.x, 0, this.z - player.z];
        let fleeing_direction = normalize_vector(player_delta_vector);
        let target_x = this.x + fleeing_direction[0]*150;
        let target_z = this.z + fleeing_direction[2]*150;
        if (target_x >= 490) target_x = 490 - random(60, 100);
        else if (target_x <= -490) target_x = -490 + random(60, 100);
        
        if (target_z >= 490) target_z = 490 - random(60, 100);
        else if (target_z <= -490) target_z = -490 + random(60, 100);

        // this.goal_pos = [constrain(this.x + dx*3, -490, 490), this.y, constrain(this.z + dz*3, -490, 490)];
        this.goal_pos = [target_x, this.y, target_z]
        this.speed_modifier = 4;
        this.fleeing = true;
      }
    }
    let delta_vector = [this.goal_pos[0] - this.x, 0, this.goal_pos[2] - this.z];
    let movement_direction_vector =  normalize_vector(delta_vector);
    this.x += movement_direction_vector[0]*this.speed*this.speed_modifier;
    this.z += movement_direction_vector[2]*this.speed*this.speed_modifier;
    this.flee_cooldown--;
  }

  attempt_shot(){
    if(random(0, 100) < 1){
      // don't forget to remove the aimbot, because that isn't fun
      this.weapon.shoot_scan(this.lookangle_x + random(-0.25, 0.25), this.lookangle_y + random(-0.25, 0.25), [this.x, this.y, this.z], [player])
    }
    // make the enemy aim at the player
    let dx = player.x - this.x;
    let dz = player.z - this.z;
    let target_angle_x = atan2(dx, -dz);
    let dy = player.y - this.y;
    let dist_xz = sqrt(dx*dx + dz*dz);
    let target_angle_y = atan2(dy, dist_xz);
    this.lookangle_x = target_angle_x;
    this.lookangle_y = target_angle_y;
  }
}

class Powerup{
  constructor(model, x, y, z, r, bobbing_period, bobbing_amp, rotation_speed, color, effect_func, scale_factor=1){
    this.model = model;
    // this.x, this.y, this.z = x, y, z;
    this.x = x;
    this.y = y;
    this.z = z;
    this.r = r;
    this.bobbing_period = bobbing_period;
    this.bobbing_amp = bobbing_amp;
    this.rotation_speed = rotation_speed;
    this.color = color;
    this.effect = effect_func;
    this.collected = false;
    this.scale_factor = scale_factor;
  }

  draw(){
    push();
    translate(this.x, this.y + this.bobbing_amp*sin(frameCount/(60*this.bobbing_period)*360), this.z);
    scale(this.scale_factor, -this.scale_factor, this.scale_factor);
    rotateY(frameCount*this.rotation_speed);
    ambientMaterial(...this.color);
    specularMaterial(255, 255, 255);
    // normalMaterial();
    shininess(50);
    model(this.model);
    pop();
  }

  check_collision(){
    if(get_dist_pyth([player.x, player.y, player.z], [this.x, this.y, this.z]) <= this.r + player.body_radius){
      this.effect();
      this.collected = true;
    }
  }
}

function mag_collect(){
  player.weapon.current_ammo += int(random(5, player.weapon.max_mag_ammo));
}

function heart_collect(){
  player.hp += int(random(5, 20));
  player.hp = min(player.hp, 100);
}

function shoe_collect(){
  if(player.speed_modifier <= 1.1){
    player.speed_modifier = 1.5;
  } else{
    player.speed_modifier *= 1.1;
  }
  player.speed_modifier_remaining += random(5*60, 15*60)
}

function get_model_dimensions(model) {
  if (!model || !model.vertices || model.vertices.length === 0) {
    return { x: 1, y: 1, z: 1 };
  }
  
  let min_x = Infinity, max_x = -Infinity;
  let min_y = Infinity, max_y = -Infinity;
  let min_z = Infinity, max_z = -Infinity;
  
  for (let v of model.vertices) {
    if (v.x < min_x) min_x = v.x;
    if (v.x > max_x) max_x = v.x;
    if (v.y < min_y) min_y = v.y;
    if (v.y > max_y) max_y = v.y;
    if (v.z < min_z) min_z = v.z;
    if (v.z > max_z) max_z = v.z;
  }
  
  return {x: max_x - min_x, y: max_y - min_y, z: max_z - min_z};
}

function normalize_vector(vector){
  let vector_magnitude = get_dist_pyth(vector, [0, 0, 0]);
  let normalized_vector = []
  for(let i=0; i < vector.length; i++){
    normalized_vector[i] = vector[i]/vector_magnitude;
  }
  return normalized_vector;
}

function get_dist_pyth(p1, p2=[0, 0, 0]){
  let sum = 0;
  for(let i=0; i < p1.length; i++){
    sum += (p1[i] - p2[i])**2;
  }
  return sqrt(sum);
}

function new_enemy_coords(){
  let x = random(-499, 499)
  let y = random(375, 450)
  let z = random(-499, 499)
  if(get_dist_pyth([player.x, player.y, player.z], [x, y, z]) < 100){
    // use recursion, to solve the situation, where the enemy is too close to the player
    return new_enemy_coords()
  }
  return [x, y, z]
}

let next_wave_time = 0;
function manage_enemys(){
  // remove dead ones
  enemys = enemys.filter(enemy => enemy.is_alive);
  // if empty, summon the new wave after a small delay
  if(enemys.length <= 0){
    if(new Date().getTime() > next_wave_time + 10000 || shop_open == true){
      // make sure you are able to use the shop and no new wave starts yet
      if(!shop_open) shop_click_cooldown = 10;
      shop_open = true;
      exitPointerLock();
      next_wave_time = new Date().getTime() + 5000;
    }
    if(new Date().getTime() > next_wave_time){
      current_wave++;
      for(let i=0, num=random(3, 7)*(1+current_wave/4); i < num; i++){
        let hp = random(10, 100);
        let body_radius = random(10, 15)*(1+hp/100);
        let base_damage = random(10, body_radius)
        let reward_score = ceil(random(5, 20)) + base_damage*1.2*(hp/75);
        let gun = new Weapon(ak47_model, 120, random(5, 30), random(5, 30), 30, base_damage, 2, true, 100)
        let movement_speed = random(2, 5)*(15/body_radius);
        enemys.push(new Enemy(...new_enemy_coords(), random(0, TWO_PI), 0, gun, color(random(0, 255), random(0, 255), random(0, 255)), body_radius, hp, reward_score, movement_speed));
      }
    }
  }
}
