// En index.html
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

  // Guardar en localStorage
  localStorage.setItem('zmbPoints', clickerScore);

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
