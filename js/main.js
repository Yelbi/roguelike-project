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

// Configuración del juego
const gameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    pixelArt: true,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
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
function startGame() {
    document.getElementById('main-menu').style.display = 'none';
    
    // Destruir juego existente si hay uno
    if (window.gameInstance) {
        window.gameInstance.destroy(true);
    }
    
    // Crear nueva instancia del juego
    window.gameInstance = new Phaser.Game(gameConfig);
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