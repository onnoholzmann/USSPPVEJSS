const w = 1280;
const h = 720;

let gameFont;
let ammo_img;
let ak_model;
let gun_reload_sound;
let gunshot_sound;

let hp = null;
let ammo_mag = 30;
let ammo = 120;
let current_wave = 0;
let score = 0;
let enemys = [];

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
  ak47 = new Weapon(ak_model, 120, 120, 30, 30, 30, 2, true, 100);
  enemys.push(new Enemy(100, 435, 0, 0, 0, new Weapon(ak_model, 120, 120, 30, 30, 30, 2, true, 100), color(100, 200, 255), 15, 100, 10))
}

function preload(){
  ammo_img = loadImage("ammo.png");
  gameFont = loadFont('EvilEmpire-lx5R0.ttf');
  ak_model = loadModel('ak47.stl');
  gun_reload_sound = loadSound('gun-reload.mp3');
  gunshot_sound = loadSound('submachine-gun.mp3');
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
  if(key == "r" || key == "R"){
    ak47.reload();
  }
}

function mousePressed() {
  // hide the cursor
  requestPointerLock();
  // ak47.shoot_scan(player_angle_x, player_angle_y, [player_x, player_y, player_z], enemys)
}

// handle_input activates while it's pressed, until it isn't anymore
function handle_input(){
  // w = 87
  if(keyIsDown(87)){
    player_x += sin(player_angle_x) * speed;
    player_z -= cos(player_angle_x) * speed;
  }
  // s = 83
  if(keyIsDown(83)){
    player_x -= sin(player_angle_x) * speed;
    player_z += cos(player_angle_x) * speed;
  }
  // a = 65
  if(keyIsDown(65)){
    player_x -= cos(player_angle_x) * speed;
    player_z -= sin(player_angle_x) * speed;
  }
  // d = 86
  if(keyIsDown(68)){
    player_x += cos(player_angle_x) * speed;
    player_z += sin(player_angle_x) * speed;
  }
  // check player press LMB
  if(mouseIsPressed && mouseButton === LEFT){
    if(ak47.check_allowed_fire()){
      ak47.shoot_scan(player_angle_x, player_angle_y, [player_x, player_y, player_z], enemys);
    }
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
  // console.log(player_x, player_y, player_z);
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
  draw_text(1070, 50, 50, `${ak47.current_mag_ammo}/${ak47.current_ammo}`);
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

  ak47.draw([player_x, player_y, player_z], player_angle_x);
  manage_enemys();
  for(let enemy of enemys){
    enemy.draw();
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
    gunshot_sound.play();
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
              entity.hit(this.base_damage * this.headshot_multiplier)
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
        closest_hit.hit(this.base_damage * this.headshot_multiplier)
      } else{
        closest_hit.hit(this.base_damage)
      }
    }
  }  
}

function distance_point_line(a, b, c, x, y){
  return abs(a*x + b*y - c)/sqrt(a**2 + b**2)
}

class Enemy{
  constructor(x, y, z, lookangle_x, lookangle_y, weapon, color, body_radius, hp, reward_score){
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
  }

  draw(){
    this.weapon.draw([this.x, this.y, this.z], this.lookangle_x, 5+this.body_radius, 5+this.body_radius, 15)
    push();
    fill(this.color);
    push();
    translate(this.x, this.y, this.z)
    sphere(this.body_radius);
    pop();
    push();
    translate(this.x, 500-this.body_height/2, this.z)
    cylinder(this.body_radius, this.body_height);
    pop();
    pop();
  }

  hit(damage){
    this.hp -= damage;
    if(this.hp <= 0){
      this.is_alive = false;
      score += this.score
      console.log("dead");
    }
    console.log(`damage: ${damage}, ${this.hp}`);
  }
}

function get_dist_pyth(p1, p2){
  sum = 0;
  for(let i=0; i < p1.length; i++){
    sum += (p1[i] - p2[i])**2
  }
  return sqrt(sum)
}

function new_enemy_coords(){
  let x = random(-499, 499)
  let y = random(375, 450)
  let z = random(-499, 499)
  if(get_dist_pyth([player_x, player_y, player_z], [x, y, z]) < 100){
    // use recursion, to solve the situation, where the enemy is too close to the player
    return new_enemy_coords()
  }
  return [x, y, z]
}

function manage_enemys(){
  // remove dead ones
  enemys = enemys.filter(enemy => enemy.is_alive);
  // if empty, summon the new wave
  if(enemys.length <= 0){
    current_wave++;
    for(let i=0, num=random(3, 30); i < num; i++){
      enemys.push(new Enemy(...new_enemy_coords(), random(0, TWO_PI), 0, new Weapon(ak_model, 120, 120, 30, 30, 30, true), color(random(0, 255), random(0, 255), random(0, 255)), random(10, 30), random(50, 200), ceil((random(5, 20)))));
    }
  }
}