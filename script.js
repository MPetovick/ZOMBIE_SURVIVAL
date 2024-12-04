/*
// Función para mostrar un mensaje en una alerta
function showAlert(message) {
  alert(message);
}

// Valores posibles de las cartas
const kitCardValues = ['❤', '❤', '❤', '❤', '❤', '❤', '❤❤', '❤❤', '❤❤❤', '⛏', '⛏', '⛏', '⛏', '⛏', '⛏', '⛏⛏', '⛏⛏', '⛏⛏⛏', '⚡', '⚡', '⚡', '✘', '✘', '✘', '✘'];
const zombieCardValues = ['💀', '💀', '💀', '💀', '💀', '💀', '💀', '💀', '💀', '💀', '💀💀', '💀💀', '💀💀', '💀💀', '💀💀', '💀💀💀', '💀💀💀', '💀💀💀', '☠', '☠', '✔', '✔', '✔', '✔', '✔'];

// Función para obtener un valor aleatorio de un array
function getRandomCardValue(cardValues) {
  const randomIndex = Math.floor(Math.random() * cardValues.length);
  return cardValues[randomIndex];
}

// Habilitar y deshabilitar los botones de cartas según corresponda
document.getElementById("getKitCard").addEventListener("click", () => {
  const kitCard = getRandomCardValue(kitCardValues);
  document.getElementById("kitCardValue").textContent = "KIT Card Value: " + kitCard;
  document.getElementById("getZombieCard").disabled = false;  // Habilitar el botón de ZOMBIE
});

document.getElementById("getZombieCard").addEventListener("click", () => {
  const zombieCard = getRandomCardValue(zombieCardValues);
  document.getElementById("zombieCardValue").textContent = "ZOMBIE Card Value: " + zombieCard;
});
*/
let score = 0; // Inicializar puntuación
let round = 0; // Contador de rondas
const maxRounds = 10; // Número máximo de rondas

// Actualizar puntuación en pantalla
function updateScore(points) {
  score += points;
  document.getElementById("scoreDisplay").textContent = "Puntuación: " + score;
}

// Manejar la lógica al final del juego
function checkGameOver() {
  round++;
  if (round >= maxRounds) {
    alert("¡Juego terminado! Puntuación final: " + score);
    document.getElementById("getKitCard").disabled = true;
    document.getElementById("getZombieCard").disabled = true;
  }
}

// Botón para obtener una carta del KIT
document.getElementById("getKitCard").addEventListener("click", () => {
  const kitCard = getRandomCardValue(kitCardValues);
  document.getElementById("kitCardValue").textContent = "KIT Card Value: " + kitCard;

  // Ejemplo: Asignar puntos según el valor de la carta
  if (kitCard.includes('❤')) updateScore(5);
  else if (kitCard.includes('⛏')) updateScore(10);
  else if (kitCard.includes('⚡')) updateScore(15);

  document.getElementById("getZombieCard").disabled = false; // Habilitar botón ZOMBIE
  checkGameOver();
});

// Botón para obtener una carta del ZOMBIE
document.getElementById("getZombieCard").addEventListener("click", () => {
  const zombieCard = getRandomCardValue(zombieCardValues);
  document.getElementById("zombieCardValue").textContent = "ZOMBIE Card Value: " + zombieCard;

  // Ejemplo: Penalizar o recompensar según el valor de la carta
  if (zombieCard.includes('✔')) updateScore(20);
  else if (zombieCard.includes('☠')) updateScore(-10);

  document.getElementById("getZombieCard").disabled = true; // Deshabilitar botón ZOMBIE
  checkGameOver();
});
