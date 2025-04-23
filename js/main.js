/**
 * Inicialización del juego
 */

// Configuración del juego
const gameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    pixelArt: true,
    backgroundColor: '#16213e',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [GameScene],
    render: {
        pixelArt: true,
        antialias: false,
        roundPixels: true,
        willReadFrequently: true,
        powerPreference: 'high-performance'
    },
    canvas: {
        willReadFrequently: true
    },
    callbacks: {
        preBoot: function(game) {
            console.log("Configurando willReadFrequently...");
            if (game.canvas) {
                game.canvas.setAttribute('willReadFrequently', 'true');
                const ctx = game.canvas.getContext('2d', { 
                    willReadFrequently: true,
                    alpha: false
                });
                if (ctx) {
                    game.canvas.getContext = function() {
                        return ctx;
                    };
                }
            }
        }
    }
};

// Inicializar el juego cuando se cargue la página
window.onload = function() {
    setupEventListeners();
};

/**
 * Configura los event listeners para la interfaz
 */
function setupEventListeners() {
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
    
    // Iniciar la barra de carga
    const loadingFill = document.getElementById('loading-fill');
    let loadingProgress = 0;
    const loadingInterval = setInterval(() => {
        loadingProgress += 1;
        loadingFill.style.width = `${Math.min(loadingProgress, 100)}%`;
        
        if (loadingProgress >= 100) {
            clearInterval(loadingInterval);
            document.getElementById('loading').style.display = 'none';
            document.getElementById('main-menu').style.display = 'block';
        }
    }, 30);
}

/**
 * Inicia el juego
 */
function startGame() {
    console.log("Iniciando juego...");
    
    document.getElementById('main-menu').style.display = 'none';
    
    try {
        // Destruir juego existente si hay uno
        if (window.gameInstance) {
            window.gameInstance.destroy(true);
        }
        
        // Reiniciar estado del juego
        resetGameState();
        
        // Crear nueva instancia del juego
        window.gameInstance = new Phaser.Game(gameConfig);
        
    } catch (error) {
        console.error("Error al iniciar el juego:", error);
        alert("Error al iniciar el juego: " + error.message);
    }
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