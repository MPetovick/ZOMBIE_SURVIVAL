// Elementos del kit de supervivencia y los zombis
// const kit = ['♥️', '♥️', '♥️', '♥️', '♥️', '♥️', '♥️♥️', '♥️♥️', '♥️♥️', '⛏️', '⛏️', '⛏️', '⛏️', '⛏️', '⛏️⛏️', '⛏️⛏️', '⛏️⛏️', '⚡️', '⚡️', '⚡️', '❌', '❌', '❌', '❌', '❌'];
// const zombies = ['🧟', '🧟', '🧟', '🧟', '🧟', '🧟', '🧟🧟', '🧟🧟', '🧟🧟', '🧟🧟', '🧟🧟🧟', '🧟🧟🧟', '🧟🧟🧟', '☠️', '☠️', '☠️', '✅', '✅', '✅', '✅', '✅'];

let lives = 3;
let turn = 1;
let kitValue = 0;
let zombieValue = 0;

function updateGameInfo() {
  document.getElementById("lives").innerText = lives;
  document.getElementById("turn").innerText = turn;
}

// Generar valor aleatorio
function getRandomValue(type) {
  if (type === "KIT") {
    // KIT de Supervivencia: valores entre 1 y 10
    return Math.floor(Math.random() * 10) + 1;
  } else if (type === "ZOMBIE") {
    // ZOMBIE: valores entre 5 y 15
    return Math.floor(Math.random() * 11) + 5;
  }
}

// Usar el KIT de Supervivencia
document.getElementById("kit-button").addEventListener("click", () => {
  // Generar valor para el KIT
  kitValue = getRandomValue("KIT");
  document.getElementById("kit-value").innerText = `Valor KIT: ${kitValue}`;

  // Desactivar botón del KIT y activar botón del ZOMBIE
  document.getElementById("kit-button").disabled = true;
  document.getElementById("zombie-button").disabled = false;
});

// Enfrentar al ZOMBIE
document.getElementById("zombie-button").addEventListener("click", () => {
  // Generar valor para el ZOMBIE
  zombieValue = getRandomValue("ZOMBIE");
  document.getElementById("zombie-value").innerText = `Valor ZOMBIE: ${zombieValue}`;

  // Evaluar el resultado del combate
  if (kitValue >= zombieValue) {
    alert("¡Derrotaste al ZOMBIE!");
  } else {
    alert("¡Perdiste contra el ZOMBIE! Pierdes 1 vida.");
    lives -= 1;
  }

  // Desactivar botón del ZOMBIE
  document.getElementById("zombie-button").disabled = true;

  // Actualizar vidas
  updateGameInfo();
});

// Finalizar turno
document.getElementById("end-turn").addEventListener("click", () => {
  turn += 1;

  // Reiniciar valores para el siguiente turno
  kitValue = 0;
  zombieValue = 0;
  document.getElementById("kit-value").innerText = "";
  document.getElementById("zombie-value").innerText = "";
  document.getElementById("kit-button").disabled = false;
  document.getElementById("zombie-button").disabled = true;

  updateGameInfo();
  alert("Turno finalizado. ¡Es el siguiente jugador!");
});

// Actualizar información inicial del juego
updateGameInfo();

