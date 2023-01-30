class Player {
  constructor(x, y, radius, colour) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.colour = colour;
    this.velocity = {
      x: 0,
      y: 0,
    };
    this.powerUp;
    // this.image = new Image();
    // this.image.src = '../img/Ship_LVL_1.png';
  }

  draw() {
    // context.drawImage(this.image, this.x - 25, this.y - 25, 50, 50);
    context.beginPath();
    context.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    context.fillStyle = this.colour;
    context.fill();
  }

  update() {
    this.draw();

    const friction = 0.99;

    this.velocity.x *= friction;
    this.velocity.y *= friction;

    if (
      this.x + this.radius + this.velocity.x <= canvas.width &&
      this.x - this.radius + this.velocity.x >= 0
    ) {
      this.x += this.velocity.x;
    } else {
      this.velocity.x = 0;
    }

    if (
      this.y + this.radius + this.velocity.y <= canvas.height &&
      this.y - this.radius + this.velocity.y >= 0
    ) {
      this.y += this.velocity.y;
    } else {
      this.velocity.y = 0;
    }
  }
}

class Projectile {
  constructor(x, y, radius, colour, velocity) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.colour = colour;
    this.velocity = velocity;
  }

  draw() {
    context.beginPath();
    context.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    context.fillStyle = this.colour;
    context.fill();
  }

  update() {
    this.draw();

    this.x = this.x + this.velocity.x;
    this.y = this.y + this.velocity.y;
  }
}

class Enemy {
  constructor(x, y, radius, colour, velocity) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.colour = colour;
    this.velocity = velocity;
    this.type = 'Linear';
    this.radians = 0;
    this.center = { x, y };

    if (Math.random() < 0.5) {
      this.type = 'Homing';

      if (Math.random() < 0.5) {
        this.type = 'Spinning';

        if (Math.random() < 0.5) {
          this.type = 'Homing Spinning';
        }
      }
    }
  }

  draw() {
    context.beginPath();
    context.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    context.fillStyle = this.colour;
    context.fill();
  }

  update() {
    this.draw();

    if (this.type === 'Spinning') {
      this.radians += 0.1;

      this.center.x += this.velocity.x;
      this.center.y += this.velocity.y;

      this.x = this.center.x + Math.cos(this.radians) * 30;
      this.y = this.center.y + Math.sin(this.radians) * 30;
    } else if (this.type === 'Homing') {
      const angle = Math.atan2(player.y - this.y, player.x - this.x);

      this.velocity.x = Math.cos(angle);
      this.velocity.y = Math.sin(angle);

      this.x = this.x + this.velocity.x;
      this.y = this.y + this.velocity.y;
    } else if (this.type === 'Homing Spinning') {
      this.radians += 0.1;

      const angle = Math.atan2(player.y - this.center.y, player.x - this.center.x);

      this.velocity.x = Math.cos(angle);
      this.velocity.y = Math.sin(angle);

      this.center.x += this.velocity.x;
      this.center.y += this.velocity.y;

      this.x = this.center.x + Math.cos(this.radians) * 30;
      this.y = this.center.y + Math.sin(this.radians) * 30;
    } else {
      this.x = this.x + this.velocity.x;
      this.y = this.y + this.velocity.y;
    }
  }
}

const friction = 0.99;

class Particle {
  constructor(x, y, radius, colour, velocity) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.colour = colour;
    this.velocity = velocity;
    this.alpha = 1;
  }

  draw() {
    context.save();
    context.globalAlpha = this.alpha;
    context.beginPath();
    context.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    context.fillStyle = this.colour;
    context.fill();
    context.restore();
  }

  update() {
    this.draw();

    this.velocity.x *= friction;
    this.velocity.y *= friction;
    this.x = this.x + this.velocity.x;
    this.y = this.y + this.velocity.y;
    this.alpha -= 0.01;
  }
}

class BackgroundParticle {
  constructor({ position, radius = 3, colour = 'blue' }) {
    this.position = position;
    this.radius = radius;
    this.colour = colour;
    this.alpha = 0.1;
  }

  draw() {
    context.save();
    context.globalAlpha = this.alpha;
    context.beginPath();
    context.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
    context.fillStyle = this.colour;
    context.fill();
    context.restore();
  }

  // update() {
  //   this.draw();
  //
  //   this.velocity.x *= friction;
  //   this.velocity.y *= friction;
  //   this.x = this.x + this.velocity.x;
  //   this.y = this.y + this.velocity.y;
  //   this.alpha -= 0.01;
  // }
}

class PowerUp {
  constructor({ position = { x: 0, y: 0 }, velocity }) {
    this.position = position;
    this.velocity = velocity;
    this.radians = 0;

    this.image = new Image();
    this.image.src = './img/lightningBolt.png';

    this.alpha = 1;
    gsap.to(this, { alpha: 0, duration: .2, repeat: -1, yoyo: true, ease: 'linear' });
  }

  draw() {
    context.save();
    context.globalAlpha = this.alpha;
    context.translate(this.position.x + this.image.width / 2, this.position.y + this.image.height / 2);
    context.rotate(this.radians);
    context.translate(-this.position.x - this.image.width / 2, -this.position.y - this.image.height / 2);
    context.drawImage(this.image, this.position.x, this.position.y);
    context.restore();
  }

  update() {
    this.draw();

    this.radians += 0.01;
    this.position.x += this.velocity.x;
  }
}
