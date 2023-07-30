let x = document.getElementById("gamesound");
x.volume = 0.4;
let musicPlaying = false;
const playMusic = function () {
  x.play();
};

window.addEventListener("load", function (e) {
  const canvas = document.getElementById("canvas1");
  const ctx = canvas.getContext("2d");

  canvas.width = 1200;
  canvas.height = 500;

  //########################################################################
  // CLASSES
  //########################################################################

  // --------------------------------------------------------------------------------
  // 1.)take care of specified user input, like arrow keys
  class InputHandler {
    constructor(game) {
      this.game = game;
      window.addEventListener("keydown", (e) => {
        if (
          (e.key === "ArrowUp" || e.key === "ArrowDown") &&
          this.game.keys.indexOf(e.key) === -1
        ) {
          this.game.keys.push(e.key);
        } else if (e.key === " ") {
          this.game.player.shootTop();
        }
      });

      window.addEventListener("keyup", (e) => {
        if (this.game.keys.indexOf(e.key) > -1) {
          this.game.keys.splice(this.game.keys.indexOf(e.key), 1);
        }
      });
    }
  }

  // --------------------------------------------------------------------------------

  class SoundController {
    constructor() {
      this.powerUpSound = document.getElementById("powerup");
      this.powerDownSound = document.getElementById("powerdown");
      this.explosionSound = document.getElementById("explosion");
      this.shotSound = document.getElementById("shot");
      this.hitSound = document.getElementById("hit");
      // this.shieldSound = document.getElementById("shieldSound");
    }

    powerUp() {
      this.powerUpSound.currentTime = 0;
      this.powerUpSound.play();
    }
    powerDown() {
      this.powerDownSound.currentTime = 0;
      this.powerDownSound.play();
    }
    explosion() {
      this.explosionSound.currentTime = 0;
      this.explosionSound.play();
    }
    shot() {
      this.shotSound.currentTime = 0;
      this.shotSound.play();
    }
    hit() {
      this.hitSound.currentTime = 0;
      this.hitSound.play();
    }
  }

  // 2.)handles player's laser
  class Projectile {
    constructor(game, x, y) {
      this.game = game;
      this.x = x;
      this.y = y;
      this.width = 36.25;
      this.height = 20;
      this.speed = Math.random() * 0.2 + 2.8;
      this.markedForDeletion = false;
      this.image = document.getElementById("fireball");
      this.frameX = 0;
      this.maxFrame = 3;
      this.fps = 20;
      this.timer = 0;
      this.interval = 1000 / this.fps;
    }

    update(deltaTime) {
      if (this.timer > this.interval) {
        if (this.frameX < this.maxFrame) this.frameX++;
        else this.frameX = 0;
        this.timer = 0;
      } else {
        this.timer += deltaTime;
      }
      this.x += this.speed;
      if (this.x > this.game.width * 0.8) this.markedForDeletion = true;
    }

    draw(context) {
      // context.fillStyle = "yellow";
      // context.fillRect(this.x, this.y, this.width, this.height);
      context.drawImage(
        this.image,
        this.frameX * this.width,
        0,
        this.width,
        this.height,
        this.x,
        this.y,
        this.width,
        this.height
      );
    }
  }

  // 3.) things come from enemies
  class Particle {
    constructor(game, x, y) {
      this.game = game;
      this.x = x;
      this.y = y;
      this.image = document.getElementById("gears");
      this.frameX = Math.floor(Math.random() * 3);
      this.frameY = Math.floor(Math.random() * 3);
      this.spriteSize = 50;
      this.sizeModifier = (Math.random() * 0.5 + 0.5).toFixed(1);
      this.size = this.spriteSize * this.sizeModifier;
      this.speedX = Math.random() * 6 - 3;
      this.speedY = Math.random() * -15;
      this.gravity = 0.5;
      this.markedForDeletion = false;
      this.angle = 0;
      this.va = Math.random() * 0.2 - 0.1;
      this.bounced = 0;
      this.bottomBounceBoundary = Math.random() * 80 + 60;
    }

    update() {
      this.angle += this.va;
      this.speedY += this.gravity;
      this.x -= this.speedX + this.game.speed;
      this.y += this.speedY;
      if (this.y > this.game.height + this.size || this.x < 0 - this.size)
        this.markedForDeletion = true;
      if (
        this.y > this.game.height - this.bottomBounceBoundary &&
        this.bounced < 5
      ) {
        this.bounced++;
        this.speedY *= -0.7;
      }
    }
    draw(context) {
      context.save();
      context.translate(this.x, this.y);
      context.rotate(this.angle);
      context.drawImage(
        this.image,
        this.frameX * this.spriteSize,
        this.frameY * this.spriteSize,
        this.spriteSize,
        this.spriteSize,
        this.size * -0.5,
        this.size * -0.5,
        this.size,
        this.size
      );
      context.restore();
    }
  }

  // 4.)control main char,animate player
  class Player {
    constructor(game) {
      this.game = game;
      this.width = 120;
      this.height = 190;
      this.x = 20;
      this.y = 100;
      this.speedY = 0;
      this.maxSpeed = 5;
      this.projectiles = [];
      this.image = document.getElementById("player");
      this.frameX = 0;
      this.frameY = 0;
      this.maxFrame = 37;
      this.powerUp = false;
      this.powerUpTimer = 0;
      this.powerUpLimit = 10000;
    }

    update(deltaTime) {
      if (this.game.keys.includes("ArrowUp")) this.speedY = -this.maxSpeed;
      else if (this.game.keys.includes("ArrowDown"))
        this.speedY = +this.maxSpeed;
      else this.speedY = 0;
      this.y += this.speedY;

      if (this.y > this.game.height - this.height * 0.5)
        this.y = this.game.height - this.height * 0.5;

      if (this.y < -this.height * 0.5) this.y = -this.height * 0.5;
      //update projectile
      this.projectiles.forEach((projectile) => {
        projectile.update(deltaTime);
      });

      this.projectiles = this.projectiles.filter(
        (projectile) => !projectile.markedForDeletion
      );

      // sprint animation
      if (this.frameX < this.maxFrame) {
        this.frameX++;
      } else {
        this.frameX = 0;
      }

      // powerup

      if (this.powerUp) {
        if (this.powerUpTimer > this.powerUpLimit) {
          this.powerUpTimer = 0;
          this.powerUp = false;
          this.frameY = 0;
          this.game.sound.powerDown();
        } else {
          this.powerUpTimer += deltaTime;
          this.frameY = 1;
          this.game.ammo += 0.1;
        }
      }
    }

    draw(context) {
      // context.fillStyle = "black ";
      // if ((this, game.debug))
      //   context.strokeRect(this.x, this.y, this.width, this.height);

      this.projectiles.forEach((projectile) => {
        projectile.draw(context);
      });

      // console.log(this.image);
      context.drawImage(
        this.image,
        this.frameX * this.width,
        this.frameY * this.height,
        this.width,
        this.height,
        this.x,
        this.y,
        this.width,
        this.height
      );
    }

    shootTop() {
      if (this.game.ammo > 0) {
        this.projectiles.push(
          new Projectile(this.game, this.x + 95, this.y + 33)
        );
        this.game.ammo--;
      }
      this.game.sound.shot();
      if (this.powerUp) this.shootBottom();
    }

    shootBottom() {
      if (this.game.ammo > 0) {
        this.projectiles.push(
          new Projectile(this.game, this.x + 80, this.y + 175)
        );
        this.game.ammo--;
      }
    }

    enterPowerUp() {
      this.powerUpTimer = 0;
      this.powerUp = true;
      if (this.game.ammo < this.game.maxAmmo)
        this.game.ammo = this.game.maxAmmo;
      this.game.sound.powerUp();
    }
  }

  // --------------------------------------------------------------------------------

  // 5.) main print handling many fifferent enemy types
  class Enemy {
    constructor(game) {
      this.game = game;
      this.x = this.game.width;
      this.speedX = Math.random() * -1.5 - 0.5;
      this.markedForDeletion = false;
      this.lives = 5;
      this.score = this.lives;
      this.frameX = 0;
      this.frameY = 0;
      this.maxFrame = 37;
    }

    update() {
      this.x += this.speedX - this.game.speed;
      if (this.x + this.width < 0) this.markedForDeletion = true;
      // sprite animation
      if (this.frameX < this.maxFrame) {
        this.frameX++;
      } else {
        this.frameX = 0;
      }
    }

    draw(context) {
      // if (this.game.debug)
      //   context.strokeRect(this.x, this.y, this.width, this.height);

      context.drawImage(
        this.image,
        this.frameX * this.width,
        this.frameY * this.height,
        this.width,
        this.height,
        this.x,
        this.y,
        this.width,
        this.height
      );
      // if (this.game.debug) {
      //   context.font = "20px Helvetica";
      //   context.fillText(this.lives, this.x, this.y);
      // }
    }
  }

  class Angler1 extends Enemy {
    constructor(game) {
      super(game);
      this.width = 228;
      this.height = 169;
      this.y = Math.random() * this.game.height * 0.95 - this.height;
      this.image = document.getElementById("angler1");
      this.frameY = Math.floor(Math.random() * 3);
      this.lives = 5;
      this.score = this.lives;
    }
  }

  class Angler2 extends Enemy {
    constructor(game) {
      super(game);
      this.width = 213;
      this.height = 165;
      this.y = Math.random() * this.game.height * 0.95 - this.height;
      this.image = document.getElementById("angler2");
      this.frameY = Math.floor(Math.random() * 2);
      this.lives = 6;
      this.score = this.lives;
    }
  }

  class LuckyFish extends Enemy {
    constructor(game) {
      super(game);
      this.width = 99;
      this.height = 95;
      this.y = Math.random() * this.game.height * 0.95 - this.height;
      this.image = document.getElementById("lucky");
      this.frameY = Math.floor(Math.random() * 2);
      this.lives = 5;
      this.score = 15;
      this.type = "lucky";
    }
  }

  class HiveWhale extends Enemy {
    constructor(game) {
      super(game);
      this.width = 400;
      this.height = 227;
      this.y = Math.random() * this.game.height * 0.9 - this.height;
      this.image = document.getElementById("hivewhale");
      this.frameY = 0;
      this.lives = 20;
      this.score = this.lives;
      this.type = "hive";
      this.speedX = Math.random() * -1.2 - 0.2;
    }
  }

  class Drone extends Enemy {
    constructor(game, x, y) {
      super(game);
      this.x = x;
      this.y = y;
      this.width = 115;
      this.height = 95;
      this.y = Math.random() * this.game.height * 0.9 - this.height;
      this.image = document.getElementById("drone");
      this.frameY = Math.floor(Math.random() * 2);
      this.lives = 3;
      this.score = this.lives;
      this.type = "drone";
      this.speedX = Math.random() * -4.2 - 0.5;
    }
  }

  class BulbWhale extends Enemy {
    constructor(game) {
      super(game);
      this.width = 270;
      this.height = 219;
      this.y = Math.random() * (this.game.height * 0.95 - this.height);
      this.image = document.getElementById("bulbwhale");
      this.frameY = Math.floor(Math.random() * 2);
      this.lives = 20;
      this.score = this.lives;
      this.speedX = Math.random() * -1.2 - 0.2;
    }
  }
  class MoonFish extends Enemy {
    constructor(game) {
      super(game);
      this.width = 227;
      this.height = 240;
      this.y = Math.random() * (this.game.height * 0.95 - this.height);
      this.image = document.getElementById("moonfish");
      this.frameY = 0;
      this.lives = 10;
      this.score = this.lives;
      this.speedX = Math.random() * -1.2 - 2;
      this.type = "moon";
    }
  }

  class Stalker extends Enemy {
    constructor(game) {
      super(game);
      this.width = 243;
      this.height = 123;
      this.y = Math.random() * (this.game.height * 0.95 - this.height);
      this.image = document.getElementById("stalker");
      this.frameY = 0;
      this.lives = 5;
      this.score = this.lives;
      this.speedX = Math.random() * -1 - 1;
    }
  }
  class Razorfin extends Enemy {
    constructor(game) {
      super(game);
      this.width = 187;
      this.height = 149;
      this.y = Math.random() * (this.game.height * 0.95 - this.height);
      this.image = document.getElementById("razorfin");
      this.frameY = 0;
      this.lives = 7;
      this.score = this.lives;
      this.speedX = Math.random() * -1 - 1;
    }
  }
  // --------------------------------------------------------------------------------

  // 6.)handle individual background layer
  class Layer {
    constructor(game, image, speedModifier) {
      this.game = game;
      this.image = image;
      this.speedModifier = speedModifier;
      this.width = 1768;
      this.height = 500;
      this.x = 0;
      this.y = 0;
    }

    update() {
      if (this.x <= -this.width) this.x = 0;
      this.x -= this.game.speed * this.speedModifier;
    }

    draw(context) {
      context.drawImage(this.image, this.x, this.y);
      context.drawImage(this.image, this.x + this.width, this.y);
    }
  }

  // --------------------------------------------------------------------------------

  // 7.)pull all layered objects together to animate entire game road

  class Background {
    constructor(game) {
      this.game = game;
      // this.image1 = document.querySelector("#layer1");
      // this.layer1 = new Layer(this.game, this.image1, 1);
      this.image1 = document.getElementById("layer1");
      this.image2 = document.getElementById("layer2");
      this.image3 = document.getElementById("layer3");
      this.image4 = document.getElementById("layer4");
      this.layer1 = new Layer(this.game, this.image1, 0.2);
      this.layer2 = new Layer(this.game, this.image2, 0.4);
      this.layer3 = new Layer(this.game, this.image3, 1);
      this.layer4 = new Layer(this.game, this.image4, 1.5);
      this.layers = [this.layer1, this.layer2, this.layer3];

      // this.layers = [this.layer1];
    }

    update() {
      this.layers.forEach((layer) => layer.update());
    }

    draw(context) {
      this.layers.forEach((layer) => layer.draw(context));
    }
  }

  // --------------------------------------------------------------------------------

  class Explosion {
    constructor(game, x, y) {
      this.game = game;
      this.x = x;
      this.y = y;
      this.frameX = 0;
      this.spriteHeight = 200;
      this.spriteWidth = 200;

      this.width = this.spriteWidth;
      this.height = this.spriteHeight;

      this.x = x - this.width * 0.5;
      this.y = y - this.height * 0.5;

      this.timer = 0;
      this.interval = 1000 / 30;
      // or fps = 15
      this.markedForDeletion = false;
      this.maxFrame = 8;
    }
    update(deltaTime) {
      this.x -= this.game.speed;
      if (this.timer > this.interval) {
        this.frameX++;
        this.timer = 0;
      } else {
        this.timer += deltaTime;
      }
      if (this.frameX > this.maxFrame) this.markedForDeletion = true;
    }

    draw(context) {
      context.drawImage(
        this.image,
        this.frameX * this.spriteWidth,
        0,
        this.spriteWidth,
        this.spriteHeight,
        this.x,
        this.y,
        this.width,
        this.height
      );
    }
  }

  class SmokeExplosion extends Explosion {
    constructor(game, x, y) {
      super(game, x, y);
      this.image = document.getElementById("smokeExplosions");
    }
  }

  class FireExplosion extends Explosion {
    constructor(game, x, y) {
      super(game, x, y);
      this.image = document.getElementById("fireExplosion");
    }
  }

  // 8.) draw timer score and othe ranimation that need to be displayed to the user
  class UI {
    constructor(game) {
      this.game = game;
      this.fontSize = 25;
      this.fontFamily = "Bangers";
      this.color = "white";
    }

    draw(context) {
      context.save();
      // display score
      context.fillStyle = this.color;
      context.shadowOffsetX = 2;
      context.shadowOffsetY = 2;
      context.shadowColor = "black";
      context.font = this.fontSize + "px " + this.fontFamily;
      context.fillText("Score : " + this.game.score, 25, 40);
      context.fillStyle = this.color;
      // ammo

      // timer
      const formattedTime = (this.game.gameTime * 0.001).toFixed(1);
      context.fillText("Timer : " + formattedTime, 20, 100);

      // game over message
      if (this.game.gameOver) {
        // console.log(this.game.winningScore, this.game.score);
        context.textAlign = "center";
        let message1, message2;
        if (this.game.score >= this.game.winningScore) {
          message1 = "You're on fire!";
          message2 = "A true gaming master";
        } else {
          message1 = "Ahhh! Don't give up!";
          message2 = "Success awaits your next attempt";
        }

        context.font = "70px " + this.fontFamily;
        context.fillText(
          message1,
          this.game.width * 0.5,
          this.game.height * 0.5 - 20
        );

        context.font = "25px " + this.fontFamily;
        context.fillText(
          message2,
          this.game.width * 0.5,
          this.game.height * 0.5 + 20
        );

        // console.log(btn);
      }

      if (this.game.player.powerUp) context.fillStyle = "#ffffbd";
      for (let i = 0; i < this.game.ammo; i++) {
        context.fillRect(20 + 5 * i, 50, 3, 20);
      }

      context.restore();
    }
  }

  // --------------------------------------------------------------------------------

  // 9.) all logic come together
  class Game {
    constructor(width, height) {
      this.width = width;
      this.height = height;
      this.sound = new SoundController();
      this.background = new Background(this);
      this.player = new Player(this);
      this.input = new InputHandler(this);
      this.ui = new UI(this);
      this.keys = [];
      this.enemies = [];
      this.particles = [];
      this.explosions = [];
      this.enemyTimer = 0;
      this.enemyInterval = 1600;
      this.ammo = 20;
      this.ammoTimer = 0;
      this.ammoInterval = 350;
      this.maxAmmo = 50;
      this.gameOver = false;
      this.score = 0;
      this.winningScore = 80;
      this.gameTime = 0;
      this.gameLimit = 30000;
      this.speed = 1;
      // this.debug = true;
    }

    // method
    update(deltaTime) {
      if (!this.gameOver) this.gameTime += deltaTime;
      if (this.gameTime > this.gameLimit) this.gameOver = true;
      this.background.update();
      this.background.layer4.update();
      this.player.update(deltaTime);
      if (this.ammoTimer > this.ammoInterval) {
        if (this.ammo < this.maxAmmo) this.ammo++;
        this.ammoTimer = 0;
      } else {
        this.ammoTimer += deltaTime;
      }

      this.particles.forEach((particle) => particle.update());
      this.particles = this.particles.filter(
        (particle) => !particle.markedForDeletion
      );

      this.explosions.forEach((explosion) => explosion.update(deltaTime));
      this.explosions = this.explosions.filter(
        (explosion) => !explosion.markedForDeletion
      );

      this.enemies.forEach((enemy) => {
        enemy.update();
        if (this.checkCollision(this.player, enemy)) {
          enemy.markedForDeletion = true;
          this.addExplosion(enemy);
          this.sound.hit();
          for (let i = 0; i < enemy.score; i++) {
            this.particles.push(
              new Particle(
                this,
                enemy.x + enemy.width * 0.5,
                enemy.y + enemy.height * 0.5
              )
            );
          }
          if (enemy.type === "lucky") this.player.enterPowerUp();
          if (enemy.type === "moon") this.player.enterPowerUp();
          else if (!this.gameOver) this.score -= 2;
        }

        this.player.projectiles.forEach((projectile) => {
          if (this.checkCollision(projectile, enemy)) {
            enemy.lives--;
            projectile.markedForDeletion = true;
            this.particles.push(
              new Particle(
                this,
                enemy.x + enemy.width * 0.5,
                enemy.y + enemy.height * 0.5
              )
            );
            if (enemy.lives <= 0) {
              for (let i = 0; i < enemy.score; i++) {
                this.particles.push(
                  new Particle(
                    this,
                    enemy.x + enemy.width * 0.5,
                    enemy.y + enemy.height * 0.5
                  )
                );
              }
              enemy.markedForDeletion = true;
              this.addExplosion(enemy);
              this.sound.explosion();

              if (enemy.type == "hive") {
                for (let index = 0; index < 3; index++) {
                  this.enemies.push(
                    new Drone(
                      game,
                      enemy.x + Math.random() * enemy.width,
                      enemy.y + Math.random() * enemy.height * 0.5
                    )
                  );
                }
              }
              if (!this.gameOver) this.score += enemy.score;
              // if (this.score > this.winningScore) this.gameOver = true;
            }
          }
        });
      });

      this.enemies = this.enemies.filter((enemy) => !enemy.markedForDeletion);

      if (this.enemyTimer > this.enemyInterval && this.gameOver != true) {
        this.addEnemy();
        this.enemyTimer = 0;
      } else {
        this.enemyTimer += deltaTime;
      }
    }

    draw(context) {
      this.background.draw(context);
      this.ui.draw(context);
      this.player.draw(context);
      this.particles.forEach((particle) => particle.draw(context));

      this.enemies.forEach((enemy) => {
        enemy.draw(context);
      });
      this.explosions.forEach((explosion) => explosion.draw(context));

      this.background.layer4.draw(context);
    }

    // #############################
    // adding enemies
    // #############################

    addEnemy() {
      const randomize = Math.random();
      if (randomize < 0.1) this.enemies.push(new Angler1(this));
      else if (randomize < 0.3) this.enemies.push(new Stalker(this));
      else if (randomize < 0.5) this.enemies.push(new Razorfin(this));
      else if (randomize < 0.6) this.enemies.push(new Angler2(this));
      else if (randomize < 0.7) this.enemies.push(new HiveWhale(this));
      else if (randomize < 0.8) this.enemies.push(new BulbWhale(this));
      else if (randomize < 0.9) this.enemies.push(new MoonFish(this));
      else this.enemies.push(new LuckyFish(this));
    }

    // #############################
    // adding explosion effects
    // #############################
    addExplosion(enemy) {
      const randomize = Math.random();
      if (randomize < 0.5) {
        this.explosions.push(
          new SmokeExplosion(
            this,
            enemy.x + enemy.width * 0.5,
            enemy.y + enemy.height * 0.5
          )
        );
      } else {
        this.explosions.push(
          new FireExplosion(
            this,
            enemy.x + enemy.width * 0.5,
            enemy.y + enemy.height * 0.5
          )
        );
      }
    }

    checkCollision(rect1, rect2) {
      return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
      );
    }
  }

  const game = new Game(canvas.width, canvas.height);
  let lastTime = 0;

  function animate(timeStamp) {
    playMusic();

    const deltaTime = timeStamp - lastTime;
    // console.log(deltaTime);
    lastTime = timeStamp;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    game.draw(ctx);
    game.update(deltaTime);

    // to triger next animation frame-> built in
    requestAnimationFrame(animate);
  }

  animate(0);
});
