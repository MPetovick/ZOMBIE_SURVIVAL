// Variables de estado del juego
let vidas = 3;
let armas = 0;
let saludMaxima = 7;

// Elementos del kit de supervivencia y los zombis
const kit = ['♥️', '♥️', '♥️', '♥️', '♥️', '♥️', '♥️♥️', '♥️♥️', '♥️♥️', '⛏️', '⛏️', '⛏️', '⛏️', '⛏️', '⛏️⛏️', '⛏️⛏️', '⛏️⛏️', '⚡️', '⚡️', '⚡️', '❌', '❌', '❌', '❌', '❌'];
const zombies = ['🧟', '🧟', '🧟', '🧟', '🧟', '🧟', '🧟🧟', '🧟🧟', '🧟🧟', '🧟🧟', '🧟🧟🧟', '🧟🧟🧟', '🧟🧟🧟', '☠️', '☠️', '☠️', '✅', '✅', '✅', '✅', '✅'];

// Función para empezar un turno
function startTurn() {
    if (vidas > 0) {
        // Generar elementos aleatorios del Kit de Supervivencia
        const kitAleatorio = getRandomElements(kit, 3);
        const zombiesAleatorios = getRandomElements(zombies, 3);

        // Mostrar los resultados
        document.getElementById('kit').innerHTML = `Kit de Supervivencia: ${kitAleatorio.join(' ')}`;
        document.getElementById('zombies').innerHTML = `Zombis: ${zombiesAleatorios.join(' ')}`;
        
        // Evaluar el turno
        evaluateTurn(kitAleatorio, zombiesAleatorios);
    } else {
        document.getElementById('result').innerHTML = "¡Te convertiste en un zombi! Fin del juego.";
        document.getElementById('start-game').disabled = true;
    }
}

// Función para obtener elementos aleatorios
function getRandomElements(arr, count) {
    let result = [];
    let shuffled = arr.slice(0);
    for (let i = 0; i < count; i++) {
        let index = Math.floor(Math.random() * shuffled.length);
        result.push(shuffled.splice(index, 1)[0]);
    }
    return result;
}

// Evaluar el turno
function evaluateTurn(kitAleatorio, zombiesAleatorios) {
    // Contar elementos de supervivencia
    let vidaRestaurada = 0;
    let armasGanadas = 0;
    
    kitAleatorio.forEach(item => {
        if (item === '♥️') vidaRestaurada++;
        if (item === '⛏️') armasGanadas++;
    });
    
    // Restablecer la vida (máximo 7)
    vidas = Math.min(vidas + vidaRestaurada, saludMaxima);
    armas += armasGanadas;

    // Contar zombis derrotados
    let zombisDerrotados = 0;
    zombiesAleatorios.forEach(item => {
        if (item === '✅') zombisDerrotados++;
    });

    // Si hay zombis no derrotados, perder vida
    let zombisNoDerrotados = zombiesAleatorios.length - zombisDerrotados;
    if (zombisNoDerrotados > 0) {
        vidas -= zombisNoDerrotados;
    }

    // Mostrar el resultado del turno
    document.getElementById('result').innerHTML = `
        Vidas restantes: ${vidas} <br>
        Armas: ${armas} <br>
        Zombis derrotados: ${zombisDerrotados} <br>
        ${zombisNoDerrotados > 0 ? `Perdiste ${zombisNoDerrotados} vidas. ` : '¡Sobreviviste al ataque!'}
    `;

    // Actualizar la interfaz de vidas y armas
    document.getElementById('vidas').textContent = vidas;
    document.getElementById('armas').textContent = armas;

    // Si ya no tienes vidas, el juego termina
    if (vidas <= 0) {
        document.getElementById('result').innerHTML = "¡Te convertiste en un zombi! Fin del juego.";
        document.getElementById('start-game').disabled = true;
    }
}
