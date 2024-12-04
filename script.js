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
// Obtener referencias al audio y al botón
const backgroundMusic = document.getElementById("background-music");
const muteButton = document.getElementById("muteButton");

// Estado inicial
let isMuted = false;

// Función para alternar sonido
muteButton.addEventListener("click", () => {
  isMuted = !isMuted; // Cambiar el estado

  if (isMuted) {
    backgroundMusic.muted = true; // Silenciar audio
    muteButton.textContent = "Activar sonido"; // Cambiar texto del botón
  } else {
    backgroundMusic.muted = false; // Activar audio
    muteButton.textContent = "Silenciar"; // Cambiar texto del botón
  }
});
