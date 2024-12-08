// Variables de juego en game.html
let health = 100;
let zombieLevel = 1;
let gameActive = true;
let daysSurvived = 0;

const healthElement = document.getElementById("health");
const zombieLevelElement = document.getElementById("zombie-level");
const attackButton = document.getElementById("attackButton");
const defendButton = document.getElementById("defendButton");
const resultElement = document.getElementById("result");
const daysElement = document.getElementById("daysSurvived");

let zombiesDefeated = 0;

// Lógica de ataque
if (attackButton) {
  attackButton.addEventListener("click", () => {
    if (!gameActive) return;
    let zombieDamage = Math.floor(Math.random() * 20) + 5;
    zombieLevel -= zombieDamage;
    zombiesDefeated++;

    // Cada 3 zombis derrotados, pasa 1 día y recuperas salud
    if (zombiesDefeated % 3 === 0) {
      daysSurvived++;
      health += 20;
    }

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
  daysElement.textContent = `Días sobrevividos: ${daysSurvived}`;
}
