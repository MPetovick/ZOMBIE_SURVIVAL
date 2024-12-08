// Estado del juego (clicker)
const backgroundMusic = document.getElementById("background-music");
const clickButton = document.getElementById("clickButton");
const clickerScoreElement = document.getElementById("clickerScore");
const playButton = document.getElementById("playButton");

// Estado inicial
let clickerScore = 0;

// Función para aumentar los puntos del juego Clicker
clickButton.addEventListener("click", () => {
  clickerScore++; // Incrementar los puntos
  clickerScoreElement.textContent = `$ZMB: ${clickerScore}`; // Actualizar el contador

  // Aplicar la animación temporal de luz verde
  clickerScoreElement.classList.add("animate");
  setTimeout(() => {
    clickerScoreElement.classList.remove("animate");
  }, 500); // Duración de la animación en milisegundos

  // Huevo de Pascua: redirigir al alcanzar 21 puntos
  if (clickerScore === 21) {
    const link = document.createElement("a");
    link.href = "https://t.me/blum/app?startapp=memepadjetton_ZMB_qazah-ref_t4h4ymyIgR"; // Cambia por tu URL
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Activar el botón "JUGAR" cuando el puntaje llegue a 42
  if (clickerScore >= 42) {
    playButton.disabled = false;
  }
});

// Redirección al hacer clic en el botón "JUGAR"
playButton.addEventListener("click", () => {
  window.location.href = "game.html"; // Redirige a la página del juego
});

// Lógica del juego en game.html
l// Variables de juego
let health = 100;
let zombieLevel = 1;
let gameActive = true;

const healthElement = document.getElementById("health");
const zombieLevelElement = document.getElementById("zombie-level");
const attackButton = document.getElementById("attackButton");
const defendButton = document.getElementById("defendButton");
const resultElement = document.getElementById("result");

// Lógica de ataque
if (attackButton) {
  attackButton.addEventListener("click", () => {
    if (!gameActive) return;
    let zombieDamage = Math.floor(Math.random() * 20) + 5;
    zombieLevel -= zombieDamage;
    if (zombieLevel <= 0) {
      resultElement.textContent = "¡Has derrotado a los zombies!";
      zombieLevel = 0;
    }
    updateGameStatus();
  });
}

// Lógica de defensa
if (defendButton) {
  defendButton.addEventListener("click", () => {
    if (!gameActive) return;
    let defense = Math.floor(Math.random() * 15);
    health -= Math.max(0, Math.floor(Math.random() * 30) - defense);
    if (health <= 0) {
      resultElement.textContent = "¡Game Over! Has perdido.";
      gameActive = false;
    }
    updateGameStatus();
  });
}

// Función para actualizar el estado del juego
function updateGameStatus() {
  healthElement.textContent = `Salud: ${health}`;
  zombieLevelElement.textContent = `Nivel de zombies: ${zombieLevel}`;
}

// Función para agregar un nuevo evento al historial de batalla
function addBattleHistory(message) {
  const historyList = document.getElementById("history-list");
  const newEntry = document.createElement("li");
  newEntry.textContent = message;
  historyList.appendChild(newEntry);
}

// Lógica de ataque
attackButton.addEventListener("click", () => {
  if (!gameActive) return;

  let zombieDamage = Math.floor(Math.random() * 20) + 5;
  zombieLevel -= zombieDamage;
  defeatedZombies++;

  if (defeatedZombies >= 3) {
    dayCount++;
    health += 20;
    defeatedZombies = 0;
    addBattleHistory("¡Has derrotado a 3 zombis! +1 Día, +20 Salud");
  }

  if (zombieLevel <= 0) {
    resultElement.textContent = "¡Has derrotado a los zombies!";
    zombieLevel = 0;
    addBattleHistory("¡Has derrotado a los zombis!");
  } else {
    addBattleHistory(`Atacaste a los zombis y causaste ${zombieDamage} de daño.`);
  }

  updateGameStatus();
});

// Lógica de defensa
defendButton.addEventListener("click", () => {
  if (!gameActive) return;

  let defense = Math.floor(Math.random() * 15);
  health -= Math.max(0, Math.floor(Math.random() * 30) - defense);

  if (health <= 0) {
    resultElement.textContent = "¡Game Over! Has perdido.";
    gameActive = false;
    addBattleHistory("¡Game Over! Has perdido.");
  } else {
    addBattleHistory(`Te defendiste con éxito, pero el zombi te atacó y perdiste ${Math.max(0, 30 - defense)} de salud.`);
  }

  // Si el zombi te ataca, pierdes 5 de salud
  if (Math.random() < 0.5) {
    health -= 5;
    addBattleHistory("¡El zombi te ha atacado! Perdiste 5 de salud.");
  }

  updateGameStatus();
});

