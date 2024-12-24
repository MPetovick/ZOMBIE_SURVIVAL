const MAP_WIDTH = 8; // 8 columnas
const MAP_HEIGHT = 10; // 10 filas
const TILE_SIZE = 50;

// Estado inicial del juego
let player = { x: 4, y: 5, lives: 3, bombs: 2, shield: false };
let zombies = [];
let items = [];
let days = 0;
let elapsedTime = 0;
let gameInterval;

// Referencias a elementos del DOM
const gameContainer = document.getElementById("game-container");
const livesDisplay = document.getElementById("lives");
const bombsDisplay = document.getElementById("bombs");
const daysDisplay = document.getElementById("days");
const timeDisplay = document.getElementById("time");

// Crear el mapa
function createMap() {
  gameContainer.style.gridTemplateColumns = `repeat(${MAP_WIDTH}, ${TILE_SIZE}px)`;
  gameContainer.style.gridTemplateRows = `repeat(${MAP_HEIGHT}, ${TILE_SIZE}px)`;

  gameContainer.innerHTML = "";
  for (let y = 0; y < MAP_HEIGHT; y++) {
    for (let x = 0; x < MAP_WIDTH; x++) {
      const tile = document.createElement("div");
      tile.classList.add("tile");
      tile.dataset.x = x;
      tile.dataset.y = y;
      gameContainer.appendChild(tile);
    }
  }
}

// Actualizar posiciones visuales
function updatePositions() {
  document.querySelectorAll(".tile").forEach(tile => {
    tile.classList.remove("player", "zombie", "item-bomb", "item-shield", "shield");
  });

  // Jugador
  const playerTile = document.querySelector(`.tile[data-x='${player.x}'][data-y='${player.y}']`);
  if (playerTile) {
    playerTile.classList.add("player");
    if (player.shield) playerTile.classList.add("shield");
  }

  // Zombies
  zombies.forEach(({ x, y }) => {
    const zombieTile = document.querySelector(`.tile[data-x='${x}'][data-y='${y}']`);
    if (zombieTile) zombieTile.classList.add("zombie");
  });

  // Items
  items.forEach(({ x, y, type }) => {
    const itemTile = document.querySelector(`.tile[data-x='${x}'][data-y='${y}']`);
    if (itemTile) itemTile.classList.add(type === "bomb" ? "item-bomb" : "item-shield");
  });
}

// Crear entidades (zombies o items)
function createEntities(count, type) {
  const entities = [];
  for (let i = 0; i < count; i++) {
    let x, y;
    do {
      x = Math.floor(Math.random() * MAP_WIDTH);
      y = Math.floor(Math.random() * MAP_HEIGHT);
    } while (
      entities.some(entity => entity.x === x && entity.y === y) ||
      (x === player.x && y === player.y) ||
      zombies.some(zombie => zombie.x === x && zombie.y === y)
    );

    if (type === "zombie") {
      const zombieType = Math.random() < 0.3 ? "fast" : Math.random() < 0.5 ? "slow" : "stealth";
      entities.push({ x, y, type: zombieType });
    } else if (type === "item") {
      const itemType = Math.random() < 0.5 ? "bomb" : "shield";
      entities.push({ x, y, type: itemType });
    }
  }
  return entities;
}

function createZombies(count) {
  zombies = zombies.concat(createEntities(count, "zombie"));
}

function createItems(count) {
  items = items.concat(createEntities(count, "item"));
}

// Mover zombies con comportamientos avanzados
function moveZombies() {
  zombies.forEach(zombie => {
    const dx = player.x - zombie.x;
    const dy = player.y - zombie.y;

    if (zombie.type === "fast") {
      zombie.x += Math.sign(dx);
      zombie.y += Math.sign(dy);
    } else if (zombie.type === "slow" && Math.random() < 0.5) {
      zombie.x += Math.sign(dx);
    } else if (zombie.type === "stealth" && Math.random() < 0.3) {
      zombie.x += Math.floor(Math.random() * 3) - 1;
      zombie.y += Math.floor(Math.random() * 3) - 1;
    }

    zombie.x = Math.max(0, Math.min(MAP_WIDTH - 1, zombie.x));
    zombie.y = Math.max(0, Math.min(MAP_HEIGHT - 1, zombie.y));
  });
}

// Comprobar colisiones
function checkCollisions() {
  // Zombies
  zombies = zombies.filter(({ x, y }) => {
    if (x === player.x && y === player.y) {
      if (player.shield) {
        player.shield = false;
        return false; // Elimina el zombie
      } else {
        player.lives -= 1;
        if (player.lives <= 0) {
          endGame("¡Has sido devorado por los zombies!");
        }
        return false;
      }
    }
    return true;
  });

  // Items
  items = items.filter(({ x, y, type }) => {
    if (x === player.x && y === player.y) {
      if (type === "bomb") player.bombs++;
      if (type === "shield") player.shield = true;
      return false;
    }
    return true;
  });

  updateStats();
}

// Usar bomba
function useBomb() {
  if (player.bombs > 0) {
    player.bombs--;
    zombies = zombies.filter(({ x, y }) => {
      return Math.abs(x - player.x) > 1 || Math.abs(y - player.y) > 1;
    });
    updatePositions();
    updateStats();
  }
}

// Actualizar estadísticas en pantalla
function updateStats() {
  livesDisplay.textContent = `❤️ Vidas: ${player.lives}`;
  bombsDisplay.textContent = `💣 Bombas: ${player.bombs}`;
  daysDisplay.textContent = `📅 Días: ${days}`;
  timeDisplay.textContent = `⏳ Tiempo: ${elapsedTime}s`;
}

// Control del jugador
function handlePlayerMove(dx, dy) {
  player.x = Math.max(0, Math.min(MAP_WIDTH - 1, player.x + dx));
  player.y = Math.max(0, Math.min(MAP_HEIGHT - 1, player.y + dy));
  updatePositions();
  checkCollisions();
}

document.addEventListener("keydown", e => {
  if (e.key === "ArrowLeft") handlePlayerMove(-1, 0);
  if (e.key === "ArrowRight") handlePlayerMove(1, 0);
  if (e.key === "ArrowUp") handlePlayerMove(0, -1);
  if (e.key === "ArrowDown") handlePlayerMove(0, 1);
  if (e.key === " ") useBomb();
});

// Reiniciar juego
function resetGame() {
  player = { x: 4, y: 5, lives: 3, bombs: 2, shield: false };
  zombies = [];
  items = [];
  days = 0;
  elapsedTime = 0;
  createZombies(3);
  createItems(2);
  createMap();
  updatePositions();
  updateStats();
}

// Finalizar juego
function endGame(message) {
  alert(message);
  clearInterval(gameInterval);
  setTimeout(() => window.location.reload(), 500);
}

// Iniciar juego
function startGame() {
  resetGame();

  gameInterval = setInterval(() => {
    elapsedTime++;
    if (elapsedTime % 30 === 0) {
      days++;
      createZombies(days + 1);
      createItems(1);
    }
    moveZombies();
    updatePositions();
    checkCollisions();
  }, 1000);
}

startGame();
