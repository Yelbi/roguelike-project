/**
 * Inicialización y configuración principal del juego
 */

// Iniciar la barra de carga con una animación más suave
const loadingFill = document.getElementById('loading-fill');
let loadingProgress = 0;
const loadingInterval = setInterval(() => {
    // Aceleración inicial y desaceleración final
    if (loadingProgress < 20) {
        loadingProgress += 0.5;
    } else if (loadingProgress < 80) {
        loadingProgress += 1.5;
    } else {
        loadingProgress += 0.7;
    }
    
    loadingFill.style.width = `${Math.min(loadingProgress, 100)}%`;
    
    if (loadingProgress >= 100) {
        clearInterval(loadingInterval);
        
        // Transición suave
        setTimeout(() => {
            document.getElementById('loading').style.opacity = '0';
            setTimeout(() => {
                document.getElementById('loading').style.display = 'none';
                document.getElementById('main-menu').style.opacity = '0';
                document.getElementById('main-menu').style.display = 'block';
                
                setTimeout(() => {
                    document.getElementById('main-menu').style.opacity = '1';
                }, 50);
            }, 500);
        }, 300);
    }
}, 30);

// Verificar disponibilidad de Phaser al inicio
console.log("Verificando disponibilidad de Phaser...");
if (typeof Phaser === 'undefined') {
    console.error("ERROR: Phaser no está disponible. Verifica que se ha cargado correctamente.");
    alert("Error: No se pudo cargar el motor del juego (Phaser). Por favor, verifica tu conexión a internet y recarga la página.");
} else {
    console.log("Phaser disponible:", Phaser.VERSION);
}

// Música de fondo
let backgroundMusic = null;

// Configuración del juego
const gameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    pixelArt: true,
    backgroundColor: '#222222',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false // Activar para ver colisiones
        }
    },
    scene: [GameScene],
    render: {
        pixelArt: true,
        antialias: false,
        roundPixels: true,
        willReadFrequently: true
    },
    callbacks: {
        preBoot: function(game) {
            console.log('preBoot: Phaser está iniciando');
            // Aplicar configuración willReadFrequently al canvas del juego
            if (game.canvas) {
                const ctx = game.canvas.getContext('2d', { willReadFrequently: true });
                if (ctx) {
                    // Asignar el contexto optimizado
                    game.canvas.getContext = function(type) {
                        return ctx;
                    };
                }
            }
        }
    }
};

// Inicializar el juego cuando se cargue la página
window.onload = function() {
    // Instalar parches
    installPatches();
    
    setupEventListeners();
    
    // Verificar que todos los componentes necesarios estén disponibles
    checkGameComponents();
    
    // Configurar herramientas de desarrollo
    setupDevConsole();
    
    // Iniciar música de fondo
    initBackgroundMusic();
};

/**
 * Inicializa la música de fondo
 */
function initBackgroundMusic() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        
        const audioContext = new AudioContext();
        
        // Crear música de fondo simple
        const createBackgroundMusic = () => {
            if (backgroundMusic) {
                backgroundMusic.stop();
            }
            
            // Crear osciladores
            const osc1 = audioContext.createOscillator();
            const osc2 = audioContext.createOscillator();
            const osc3 = audioContext.createOscillator();
            
            // Crear ganancia (volumen)
            const gainNode = audioContext.createGain();
            gainNode.gain.value = 0.03; // Volumen muy bajo
            
            // Configurar osciladores
            osc1.type = 'sine';
            osc1.frequency.value = 220; // A3
            
            osc2.type = 'sine';
            osc2.frequency.value = 277.18; // C#4
            
            osc3.type = 'sine';
            osc3.frequency.value = 329.63; // E4
            
            // Conectar osciladores a la ganancia
            osc1.connect(gainNode);
            osc2.connect(gainNode);
            osc3.connect(gainNode);
            
            // Conectar ganancia a la salida
            gainNode.connect(audioContext.destination);
            
            // Iniciar osciladores
            osc1.start();
            osc2.start();
            osc3.start();
            
            // Programar cambios de nota
            const interval = setInterval(() => {
                // Cambia notas cada 10 segundos aproximadamente
                if (Math.random() < 0.3) {
                    const notes = [220, 246.94, 261.63, 293.66, 329.63, 349.23, 392];
                    osc1.frequency.setValueAtTime(notes[Math.floor(Math.random() * notes.length)], audioContext.currentTime);
                    osc2.frequency.setValueAtTime(notes[Math.floor(Math.random() * notes.length)], audioContext.currentTime);
                    osc3.frequency.setValueAtTime(notes[Math.floor(Math.random() * notes.length)], audioContext.currentTime);
                }
            }, 10000);
            
            // Objeto para controlar la música
            return {
                stop: () => {
                    clearInterval(interval);
                    osc1.stop();
                    osc2.stop();
                    osc3.stop();
                }
            };
        };
        
        // Iniciar música de fondo en respuesta a la interacción del usuario
        const startMusicOnInteraction = () => {
            backgroundMusic = createBackgroundMusic();
            document.removeEventListener('click', startMusicOnInteraction);
        };
        
        document.addEventListener('click', startMusicOnInteraction);
        
    } catch (error) {
        console.warn("Error al inicializar la música de fondo:", error);
    }
}

/**
 * Verifica la disponibilidad de todos los componentes necesarios
 */
function checkGameComponents() {
    console.log("Verificando componentes del juego...");
    
    const requiredFunctions = [
        'generateDungeon', 'createPlayer', 'placeEnemies', 'placeItems', 
        'placeStairs', 'updateUI', 'addMessage'
    ];
    
    const missingFunctions = requiredFunctions.filter(funcName => 
        typeof window[funcName] !== 'function'
    );
    
    if (missingFunctions.length > 0) {
        console.error("Faltan las siguientes funciones:", missingFunctions);
        alert("Error: Algunos componentes del juego no están disponibles. Recarga la página o contacta al desarrollador.");
    } else {
        console.log("Todos los componentes están disponibles.");
    }
}

/**
 * Configura los event listeners para la interfaz
 */
function setupEventListeners() {
    // Agregar animación a los botones del menú
    const menuOptions = document.querySelectorAll('.menu-option');
    menuOptions.forEach(option => {
        option.addEventListener('mouseover', () => {
            option.style.transform = 'scale(1.05)';
            option.style.boxShadow = '0 0 10px #f39c12';
        });
        option.addEventListener('mouseout', () => {
            option.style.transform = 'scale(1)';
            option.style.boxShadow = 'none';
        });
    });

    // Botones del menú principal
    document.getElementById('start-game').addEventListener('click', startGame);
    document.getElementById('how-to-play').addEventListener('click', showHelp);
    
    // Botones del menú de pausa
    document.getElementById('resume-game').addEventListener('click', resumeGame);
    document.getElementById('restart-game').addEventListener('click', restartGame);
    
    // Botones de juego terminado y ayuda
    document.getElementById('try-again').addEventListener('click', restartGame);
    document.getElementById('close-help').addEventListener('click', closeHelp);

    // Listeners para elementos del inventario
    document.getElementById('inventory-items').addEventListener('click', (e) => {
        const itemElement = e.target.closest('.inventory-item');
        if (itemElement && itemElement.dataset.index) {
            useItem(parseInt(itemElement.dataset.index));
        }
    });
    
    // Evento para mostrar/ocultar el debug
    document.addEventListener('keydown', (e) => {
        // Presionar F2 para activar/desactivar el modo debug
        if (e.key === 'F2') {
            const debugEnabled = toggleDebugMode();
            console.log(`Modo debug ${debugEnabled ? 'activado' : 'desactivado'}`);
        }
        
        // Presionar F3 para activar/desactivar mostrar colisiones
        if (e.key === 'F3' && gameState.debug.enabled) {
            gameState.debug.showCollisions = !gameState.debug.showCollisions;
            console.log(`Mostrar colisiones ${gameState.debug.showCollisions ? 'activado' : 'desactivado'}`);
        }
    });
    
    console.log("Event listeners configurados.");
}

/**
 * Inicia el juego
 */
function startGame() {
    console.log("Iniciando juego...");
    
    // Animación de salida del menú
    document.getElementById('main-menu').style.opacity = '0';
    
    setTimeout(() => {
        document.getElementById('main-menu').style.display = 'none';
        
        try {
            // Destruir juego existente si hay uno
            if (window.gameInstance) {
                console.log("Destruyendo instancia anterior del juego");
                window.gameInstance.destroy(true);
            }
            
            // Reiniciar estado del juego
            resetGameState();
            
            // Crear nueva instancia del juego
            window.gameInstance = new Phaser.Game({
                ...gameConfig,
                callbacks: {
                    preBoot: function(game) {
                        console.log('preBoot: Phaser está iniciando');
                    },
                    postBoot: function(game) {
                        console.log('postBoot: Phaser ha iniciado completamente');
                    }
                }
            });
            
            // Verificar que la instancia se creó correctamente
            setTimeout(() => {
                if (window.gameInstance && window.gameInstance.isBooted) {
                    console.log("Juego iniciado correctamente");
                } else {
                    console.error("Problema al iniciar el juego");
                    alert("Error: No se pudo iniciar el juego. Recarga la página e inténtalo de nuevo.");
                }
            }, 1000);
        } catch (error) {
            console.error("Error al iniciar el juego:", error);
            alert("Error al iniciar el juego: " + error.message);
        }
    }, 300);
}

/**
 * Reinicia el estado del juego a los valores por defecto
 */
function resetGameState() {
    gameState.dungeonLevel = 1;
    gameState.playerStats = {
        level: 1,
        health: 100,
        maxHealth: 100,
        attack: 10,
        defense: 5,
        xp: 0,
        nextLevelXp: 100,
        statusEffects: []
    };
    gameState.inventory = [];
    gameState.enemies = [];
    gameState.items = [];
    gameState.messages = [];
    gameState.enemiesKilled = 0;
    gameState.isPaused = false;
    gameState.isInventoryOpen = false;
    
    // Asegurarse de que el UI se actualice
    updateUI();
    clearMessages();
}