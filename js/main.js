/**
 * Inicialización y configuración principal del juego
 */

// Iniciar la barra de carga
const loadingFill = document.getElementById('loading-fill');
let loadingProgress = 0;
const loadingInterval = setInterval(() => {
    loadingProgress += 1;
    loadingFill.style.width = `${loadingProgress}%`;
    if (loadingProgress >= 100) {
        clearInterval(loadingInterval);
        document.getElementById('loading').style.display = 'none';
        document.getElementById('main-menu').style.display = 'block';
    }
}, 30);

// Agregar verificación de Phaser al inicio de main.js
console.log("Verificando disponibilidad de Phaser...");
if (typeof Phaser === 'undefined') {
    console.error("ERROR: Phaser no está disponible. Verifica que se ha cargado correctamente.");
    alert("Error: No se pudo cargar el motor del juego (Phaser). Por favor, verifica tu conexión a internet y recarga la página.");
} else {
    console.log("Phaser disponible:", Phaser.VERSION);
}

// Modifica la configuración de juego para incluir depuración
const gameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    pixelArt: true,
    backgroundColor: '#444444', // Color de fondo más claro para depuración
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: true // Activar depuración de física para ver los cuerpos de colisión
        }
    },
    scene: [GameScene]
};

// Inicializar el juego cuando se cargue la página
window.onload = function() {
    setupEventListeners();
};

/**
 * Configura los event listeners para la interfaz
 */
function setupEventListeners() {
    document.getElementById('start-game').addEventListener('click', startGame);
    document.getElementById('how-to-play').addEventListener('click', showHelp);
    document.getElementById('resume-game').addEventListener('click', resumeGame);
    document.getElementById('restart-game').addEventListener('click', restartGame);
    document.getElementById('try-again').addEventListener('click', restartGame);
    document.getElementById('close-help').addEventListener('click', closeHelp);

    // Listeners para elementos del inventario
    document.getElementById('inventory-items').addEventListener('click', (e) => {
        const itemElement = e.target.closest('.inventory-item');
        if (itemElement && itemElement.dataset.index) {
            useItem(itemElement.dataset.index);
        }
    });
}

/**
 * Inicia el juego
 */
// Modifica la función startGame para incluir registro de eventos
function startGame() {
    console.log("Iniciando juego...");
    document.getElementById('main-menu').style.display = 'none';
    
    // Destruir juego existente si hay uno
    if (window.gameInstance) {
        console.log("Destruyendo instancia anterior del juego");
        window.gameInstance.destroy(true);
    }
    
    // Crear nueva instancia del juego con callbacks para monitorear eventos
    window.gameInstance = new Phaser.Game({
        ...gameConfig,
        callbacks: {
            preBoot: function (game) {
                console.log('preBoot: Phaser está iniciando');
            },
            postBoot: function (game) {
                console.log('postBoot: Phaser ha iniciado completamente');
            }
        }
    });
    
    // Verificar que la instancia se creó correctamente después de un breve retraso
    setTimeout(() => {
        if (window.gameInstance && window.gameInstance.isBooted) {
            console.log("Juego iniciado correctamente");
        } else {
            console.error("Problema al iniciar el juego");
        }
    }, 1000);
}

/**
 * Gestiona el audio del juego de manera simplificada
 */
function createSimpleAudio() {
    // En lugar de cargar archivos de audio, creamos efectos de audio simples con el API Web Audio
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null; // Si no hay soporte, simplemente no tendremos audio
    
    const audioContext = new AudioContext();
    
    // Función para crear sonidos básicos
    const createSound = (type, duration, frequency) => {
        return () => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.type = type;
            oscillator.frequency.value = frequency;
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
            
            oscillator.start();
            oscillator.stop(audioContext.currentTime + duration);
        };
    };
    
    // Crear efectos de sonido básicos
    return {
        hit: createSound('square', 0.1, 200),
        pickup: createSound('sine', 0.2, 800),
        levelup: createSound('sawtooth', 0.3, 600),
        stairs: createSound('triangle', 0.4, 400),
        enemyDeath: createSound('square', 0.3, 100),
        playerDeath: createSound('sawtooth', 0.5, 150)
    };
}

// Crear audio simple
const simpleAudio = createSimpleAudio();

// Exponer una función de audio simplificada para que las otras partes del código puedan usarla
window.playSound = function(sound) {
    if (simpleAudio && simpleAudio[sound]) {
        simpleAudio[sound]();
    }
};