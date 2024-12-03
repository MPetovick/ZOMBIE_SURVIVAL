let lives = 3;
let turn = 1;
let kitValue = "";
let zombieValue = "";

// Historial de resultados
let resultHistory = [];

// Listas de valores para las cartas
const kitValues = ["❤", "❤", "❤", "❤", "❤", "❤", "❤❤", "❤❤", "❤❤❤", "⛏", "⛏", "⛏", "⛏", "⛏", "⛏", "⛏⛏", "⛏⛏", "⛏⛏⛏", "⚡", "⚡", "⚡", "✘", "✘", "✘", "✘"];
const zombieValues = ["💀", "💀", "💀", "💀", "💀", "💀", "💀", "💀", "💀", "💀", "💀💀", "💀💀", "💀💀", "💀💀", "💀💀", "💀💀💀", "💀💀💀", "💀💀💀", "☠", "☠", "✔", "✔", "✔", "✔", "✔"];

// Actualizar información de vidas y turno
function updateGameInfo() {
  document.getElementById("lives").innerText = lives;
  document.getElementById("turn").innerText = turn;
}

// Obtener un valor aleatorio de una lista
function getRandomValue(list) {
  const randomIndex = Math.floor(Math.random() * list.length);
  return list[randomIndex];
}

// Mostrar el historial de resultados
function displayHistory() {
  const historyList = document.getElementById("result-history");
  historyList.innerHTML = "";
  resultHistory.forEach(result => {
    const li = document.createElement("li");
    li.innerText = result;
    historyList.appendChild(li);
  });
}

// Usar el KIT de Supervivencia
document.getElementById("kit-button").addEventListener("click", () => {
  // Seleccionar valor aleatorio del KIT
  kitValue = getRandomValue(kitValues);
  document.getElementById("kit-value").innerText = `Valor KIT: ${kitValue}`;

  // Desactivar botón del KIT y activar botón del ZOMBIE
  document.getElementById("kit-button").disabled = true;
  document.getElementById("zombie-button").disabled = false;
});

// Enfrentar al ZOMBIE
document.getElementById("zombie-button").addEventListener("click", () => {
  // Seleccionar valor aleatorio del ZOMBIE
  zombieValue = getRandomValue(zombieValues);
  document.getElementById("zombie-value").innerText = `Valor ZOMBIE: ${zombieValue}`;

  // Mostrar el resultado del enfrentamiento
  let resultMessage = "";
  if (kitValue.includes("❤") || kitValue.includes("⛏") || kitValue.includes("⚡")) {
    if (zombieValue.includes("💀") || zombieValue.includes("☠")) {
      resultMessage = "¡Derrotaste al ZOMBIE!";
    } else {
      resultMessage = "¡El ZOMBIE fue más fuerte! Pierdes 1 vida.";
      lives -= 1;
    }
  } else {
    resultMessage = "Tu carta KIT no tenía poder suficiente. Pierdes 1 vida.";
    lives -= 1;
  }

  // Agregar resultado al historial
  resultHistory.push(`Turno ${turn}: ${resultMessage}`);
  displayHistory();

  // Actualizar vidas y desactivar el botón del ZOMBIE
  updateGameInfo();
  document.getElementById("zombie-button").disabled = true;

  // Comprobar si el jugador ha perdido todas las vidas
  if (lives <= 0) {
    alert("¡Juego terminado! Has perdido todas tus vidas.");
    document.getElementById("kit-button").disabled = true;
    document.getElementById("zombie-button").disabled = true;
    document.getElementById("end-turn").disabled = true;
  }
});

// Finalizar turno
document.getElementById("end-turn").addEventListener("click", () => {
  turn += 1;

  // Reiniciar valores para el siguiente turno
  kitValue = "";
  zombieValue = "";
  document.getElementById("kit-value").innerText = "";
  document.getElementById("zombie-value").innerText = "";
  document.getElementById("kit-button").disabled = false;
  document.getElementById("zombie-button").disabled = true;

  updateGameInfo();
  alert("Turno finalizado. ¡Es el turno del siguiente jugador!");
});

// Inicializar información del juego
updateGameInfo();