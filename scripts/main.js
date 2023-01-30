const canvas = document.querySelector('canvas');
canvas.width = innerWidth;
canvas.height = innerHeight;

const context = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const modalEl = document.getElementById('restart-modal');
const finalScoreEl = document.getElementById('final-score');
const restartButtonEl = document.getElementById('restart-btn');
const startButtonEl = document.getElementById('start-btn');
const startModalEl = document.getElementById('start-modal');
const volumeOnEl = document.getElementById('volumeOn');
const volumeOffEl = document.getElementById('volumeOff');

let player;
let projectiles = [];
let enemies = [];
let particles = [];
let animationId;
let intervalId;
let score = 0;
let powerUps = [];
let frames = 0;
let backgroundParticles = [];
let game = {
  active: false,
};

function init() {
  const x = canvas.width / 2;
  const y = canvas.height / 2;

  player = new Player(x, y, 10, 'white');
  projectiles = [];
  enemies = [];
  particles = [];
  powerUps = [];
  score = 0;
  scoreEl.innerHTML = score;
  frames = 0;
  backgroundParticles = [];
  game = {
    active: true,
  };

  const spacing = 30;

  for (let x = 0; x < canvas.width + spacing; x+= spacing) {
    for (let y = 0; y < canvas.height + spacing; y += spacing) {
      backgroundParticles.push(new BackgroundParticle({
        position: {x, y},
      }));
    }
  }
}
function spawnEnemies() {
  intervalId = setInterval(() => {
    let x;
    let y;
    const radius = Math.random() * (30 - 4) + 4;
    const colour = `hsl(${Math.random() * 360}, 50%, 50%)`;

    if (Math.random() < 0.5) {
      x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius;
      y = Math.random() * canvas.height;
    } else {
      x = Math.random() * canvas.width;
      y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius;

    }

    const angle = Math.atan2(canvas.height / 2 - y, canvas.width / 2 - x);
    const velocity = { x: Math.cos(angle), y: Math.sin(angle) };

    enemies.push(new Enemy(x, y, radius, colour, velocity));
  }, 1000);
}

function spawnPowerUps() {
  spawnPowerUpsId = setInterval(() => {
    powerUps.push(new PowerUp({
      position: { x: -30, y: Math.random() * canvas.height },
      velocity: { x: Math.random() + 2, y: 0 },
    }));
  }, 10000);
}

function createScoreLabel({ position, score }) {
  const scoreLabel = document.createElement('label');
  scoreLabel.innerHTML = score;
  scoreLabel.style.color = 'white';
  scoreLabel.style.position = 'absolute';
  scoreLabel.style.left = position.x + 'px';
  scoreLabel.style.top = position.y + 'px';
  scoreLabel.style.userSelect = 'none';
  scoreLabel.style.pointerEvents = 'none';

  document.body.appendChild(scoreLabel);

  gsap.to(scoreLabel, {
    opacity: 0,
    y: -30,
    duration: .7,
    onComplete: () => {
      scoreLabel.parentNode.removeChild(scoreLabel);
    },
  });
}

function animate() {
  animationId = requestAnimationFrame(animate);

  context.fillStyle = 'rgba(0, 0, 0, 0.1)';
  context.fillRect(0, 0, canvas.width, canvas.height);

  frames++;

  backgroundParticles.forEach(backgroundParticle => {
    backgroundParticle.draw();

    const distance = Math.hypot(player.x - backgroundParticle.position.x, player.y - backgroundParticle.position.y);

    if (distance < 100) {
      backgroundParticle.alpha = 0;

      if (distance > 70) {
        backgroundParticle.alpha = 0.5;
      }
    } else if (distance > 100 && backgroundParticle.alpha < 0.1) {
      backgroundParticle.alpha += 0.01;
    } else if (distance > 100 && backgroundParticle.alpha > 0.1) {
      backgroundParticle.alpha -= 0.01;
    }
  });

  player.update();

  for (let i = powerUps.length - 1; i >= 0; i--) {
    const powerUp = powerUps[i];

    if (powerUp.position.x > canvas.width) {
      powerUps.splice(i, 1);
    } else {
      powerUp.update();
    }

    const distance = Math.hypot(player.x - powerUp.position.x, player.y - powerUp.position.y);

    if (distance < powerUp.image.height / 2 + player.radius) {
      powerUps.splice(i, 1);

      player.powerUp = 'MachineGun';
      player.colour = 'yellow';

      audio.powerUp.play();

      setTimeout(() => {
        player.powerUp = null;
        player.colour = 'white';
      }, 5000);
    }
  }

  if (player.powerUp === 'MachineGun') {
    const angle = Math.atan2(mouse.position.y - player.y, mouse.position.x - player.x);
    const velocity = { x: Math.cos(angle) * 4, y: Math.sin(angle) * 4 };

    if (frames % 2 === 0) {
      projectiles.push(new Projectile(player.x, player.y, 5, 'yellow', velocity));
    }

    if (frames % 5 === 0) {
      audio.shoot.play();
    }
  }

  for (let index = particles.length - 1; index >= 0; index--) {
    const particle = particles[index];

    if (particle.alpha <= 0) {
      particles.splice(index, 1);
    } else {
      particle.update();
    }
  }

  for (let index = projectiles.length - 1; index >= 0; index--) {
    const projectile = projectiles[index];
    projectile.update();

    if (
      projectile.x + projectile.radius < 0 ||
      projectile.x - projectile.radius > canvas.width ||
      projectile.y + projectile.radius < 0 ||
      projectile.y - projectile.radius > canvas.height
    ) {
      projectiles.splice(index, 1);
    }
  }

  for (let index = enemies.length - 1; index >= 0; index--) {
    const enemy = enemies[index];
    enemy.update();

    const distance = Math.hypot(player.x - enemy.x, player.y - enemy.y);

    if (distance - enemy.radius - player.radius < 1) {
      cancelAnimationFrame(animationId);
      clearInterval(intervalId);
      clearInterval(spawnPowerUpsId);

      audio.death.play();

      game.active = false;

      modalEl.style.display = 'block';
      gsap.fromTo('#restart-modal',
        {
          scale: .8,
          opacity: 0,
        },
        {
          scale: 1,
          opacity: 1,
          ease: 'expo',
        },
      );
      finalScoreEl.innerHTML = score;
    }

    for (let projectileIndex = projectiles.length - 1; projectileIndex >= 0; projectileIndex--) {
      const projectile = projectiles[projectileIndex];
      const distance = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);

      if (distance - enemy.radius - projectile.radius < 1) {
        for (let i = 0; i < enemy.radius * 2; i++) {
          particles.push(new Particle(projectile.x, projectile.y, Math.random() * 2, enemy.colour, { x: (Math.random() - 0.5) * (Math.random() * 8), y: (Math.random() - 0.5) * (Math.random() * 8) }))
        }

        if (enemy.radius - 10 > 5) {
          audio.damageTaken.play();

          score += 100;
          scoreEl.innerHTML = score;

          gsap.to(enemy, { radius: enemy.radius - 10 });

          createScoreLabel({
            position: { x: projectile.x, y: projectile.y },
            score: 100,
          });

          projectiles.splice(projectileIndex, 1);
        } else {
          audio.explode.play();

          score += 150;
          scoreEl.innerHTML = score;

          createScoreLabel({
            position: { x: projectile.x, y: projectile.y },
            score: 150,
          });

          backgroundParticles.forEach(backgroundParticle => {
            gsap.set(backgroundParticle, { colour: 'white', alpha: 1 });
            gsap.to(backgroundParticle, { colour: enemy.colour, alpha: 0.1 });
          });

          enemies.splice(index, 1);
          projectiles.splice(projectileIndex, 1);
        }
      }
    }
  }
}

let audioInitialized = false;

function shoot({ x, y }) {
  if (game.active) {
    const angle = Math.atan2(event.clientY - player.y, event.clientX - player.x);
    const velocity = {x: Math.cos(angle) * 4, y: Math.sin(angle) * 4};

    projectiles.push(new Projectile(player.x, player.y, 5, 'white', velocity))

    audio.shoot.play();
  }
}

addEventListener('click', (event) => {
  if (!audio.background.playing() && !audioInitialized) {
    audio.background.play();
    audioInitialized = true;
  }

  shoot({ x: event.clientX, y: event.clientY });
});

addEventListener('touchstart', (event) => {
  const x = event.touches[0].clientX;
  const y = event.touches[0].clientY;

  mouse.position.x = event.touches[0].clientX;
  mouse.position.y = event.touches[0].clientY;

  shoot({ x, y });
});

const mouse = {
  position: {
    x: 0,
    y: 0,
  },
};

addEventListener('mousemove', (event) => {
  mouse.position.x = event.clientX;
  mouse.position.y = event.clientY;
});

addEventListener('touchmove', (event) => {
  mouse.position.x = event.touches[0].clientX;
  mouse.position.y = event.touches[0].clientY;
});

restartButtonEl.addEventListener('click', () => {
  audio.select.play();

  init();
  animate();
  spawnEnemies();
  spawnPowerUps();

  gsap.to('#restart-modal', {
    opacity: 0,
    scale: .8,
    duration: .3,
    ease: 'expo.in',
    onComplete: () => {
      modalEl.style.display = 'none';
    },
  });
});

startButtonEl.addEventListener('click', () => {
  audio.select.play();

  init();
  animate();
  spawnEnemies();
  spawnPowerUps();

  gsap.to('#start-modal', {
    opacity: 0,
    scale: .8,
    duration: .3,
    ease: 'expo.in',
    onComplete: () => {
      startModalEl.style.display = 'none';
    },
  });
});

volumeOnEl.addEventListener('click', () => {
  audio.background.pause();

  volumeOffEl.style.display = 'block';
  volumeOnEl.style.display = 'none';

  for (let key in audio) {
    audio[key].mute(true);
  }
});

volumeOffEl.addEventListener('click', () => {
  if (audioInitialized) {
    audio.background.play();
  }

  volumeOffEl.style.display = 'none';
  volumeOnEl.style.display = 'block';

  for (let key in audio) {
    audio[key].mute(false);
  }
});

addEventListener('resize', () => {
  canvas.width = innerWidth;
  canvas.height = innerHeight;

  init();
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    clearInterval(intervalId);
    clearInterval(spawnPowerUpsId);
  } else {
    spawnEnemies();
    spawnPowerUps();
  }
});

addEventListener('keydown', (event) => {
  switch (event.key) {
    case 'ArrowRight':
      player.velocity.x += 1;
      break;
    case 'ArrowUp':
      player.velocity.y -= 1;
      break;
    case 'ArrowLeft':
      player.velocity.x -= 1;
      break;
    case 'ArrowDown':
      player.velocity.y += 1;
      break;
  }
});
