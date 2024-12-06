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
// Obtener referencias al audio, botones y elementos de puntuación
const backgroundMusic = document.getElementById("background-music");
const clickButton = document.getElementById("clickButton");
const clickerScoreElement = document.getElementById("clickerScore");

// Estado inicial
let clickerScore = 0;

// Función para aumentar los puntos del juego Clicker
clickButton.addEventListener("click", () => {
  clickerScore++; // Incrementar los puntos
  clickerScoreElement.textContent = `$ZMB: ${clickerScore}`; // Actualizar el contador

  // Aplicar la animación temporal
  clickerScoreElement.classList.add("animate");
  setTimeout(() => {
    clickerScoreElement.classList.remove("animate");
  }, 500); // Duración de la animación en milisegundos

  // Huevo de Pascua: redirigir al alcanzar 21 puntos
  if (clickerScore === 21) {
    // Crear un enlace dinámicamente y simular un clic
    const link = document.createElement("a");
    link.href = "https://t.me/blum/app?startapp=memepadjetton_ZMB_qazah-ref_t4h4ymyIgR"; // Cambia por tu URL
    link.target = "_blank"; // Abre en una nueva pestaña
    link.rel = "noopener noreferrer"; // Mejor seguridad
    document.body.appendChild(link); // Añadir temporalmente al DOM
    link.click(); // Simular clic
    document.body.removeChild(link); // Eliminar el enlace
  }

  // Activar el botón "JUGAR" cuando el puntaje llegue a 1021
  if (clickerScore >= 1021) {
    playButton.disabled = false; // Habilitar el botón
  }
});

// Redirección al hacer clic en el botón "JUGAR"
playButton.addEventListener("click", () => {
  window.location.href = "juego.html"; // Redirige a la página del juego
});
