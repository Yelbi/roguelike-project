/**
 * Funciones de utilidad para el roguelike
 */

// Estado global del juego
const gameState = {
    dungeonLevel: 1,
    playerStats: {
        level: 1,
        health: 100,
        maxHealth: 100,
        attack: 10,
        defense: 5,
        xp: 0,
        nextLevelXp: 100,
        statusEffects: []
    },
    inventory: [],
    enemies: [],
    items: [],
    messages: [],
    enemiesKilled: 0,
    isPaused: false,
    isInventoryOpen: false,
    rooms: [],
    map: null,
    groundLayer: null,
    wallsLayer: null,
    decorationLayer: null,
    itemsGroup: null,
    enemiesGroup: null,
    stairs: null,
    debug: {
        enabled: false,
        showCollisions: false
    }
};

// Constantes de configuración
const CONFIG = {
    tileSize: 32,
    mapWidth: 50,
    mapHeight: 50,
    roomMinSize: 6,
    roomMaxSize: 12,
    maxRooms: 15,
    playerSpeed: 160,
    enemySpeedBase: 50, 
    enemySpeedVariation: 30,
    minEnemiesPerRoom: 1,
    maxEnemiesPerRoom: 3,
    itemDropChance: 40, // Porcentaje de probabilidad de obtener un objeto al derrotar un enemigo
    enemySpawnChanceIncreasePerLevel: 10,
    difficultyIncreasePerLevel: 0.2 // Factor de aumento de dificultad por nivel de mazmorra
};

// Colores para varios elementos del juego
const COLORS = {
    floors: [0x333333, 0x3A3A3A, 0x444444],
    walls: [0x8B4513, 0x7B3F12, 0x9B5514],
    player: 0xFF0000,
    playerBorder: 0xFFFF00,
    healthBar: {
        high: 0x44FF44,
        medium: 0xFFFF44,
        low: 0xFF4444,
        background: 0x111111
    },
    items: {
        health: 0x44DD44,
        attack: 0xFF5555,
        defense: 0x4477FF,
        experience: 0xDD77FF,
        maxHealth: 0x55DDDD,
        mystery: 0xFF9933
    }
};

// Sprites simples (formas básicas usando canvas en lugar de sprites externos)
const SPRITES = {
    player: {
        color: COLORS.player,
        render: (ctx, x, y, size) => {
            ctx.fillStyle = COLORS.player;
            ctx.beginPath();
            ctx.arc(x, y, size/2, 0, Math.PI * 2);
            ctx.fill();
            
            // Detalles del personaje
            ctx.lineStyle = 2;
            ctx.strokeStyle = COLORS.playerBorder;
            ctx.beginPath();
            ctx.arc(x, y, size/2, 0, Math.PI * 2);
            ctx.stroke();
            
            // Cara simple
            ctx.fillStyle = "#000000";
            // Ojos
            ctx.beginPath();
            ctx.arc(x - size/6, y - size/8, size/10, 0, Math.PI * 2);
            ctx.arc(x + size/6, y - size/8, size/10, 0, Math.PI * 2);
            ctx.fill();
            // Boca
            ctx.beginPath();
            ctx.arc(x, y + size/8, size/8, 0, Math.PI);
            ctx.stroke();
        }
    },
    enemy: {
        render: (ctx, x, y, size, type) => {
            // Colores según tipo de enemigo
            const colors = ["#e74c3c", "#c0392b", "#d35400", "#e67e22", "#f39c12", "#8e44ad"];
            ctx.fillStyle = colors[type % colors.length];
            
            // Forma según tipo
            if (type % 3 === 0) {
                // Triángulo
                ctx.beginPath();
                ctx.moveTo(x, y - size/2);
                ctx.lineTo(x - size/2, y + size/2);
                ctx.lineTo(x + size/2, y + size/2);
                ctx.closePath();
                ctx.fill();
                
                // Ojos
                ctx.fillStyle = "#000000";
                ctx.beginPath();
                ctx.arc(x - size/6, y, size/10, 0, Math.PI * 2);
                ctx.arc(x + size/6, y, size/10, 0, Math.PI * 2);
                ctx.fill();
            } else if (type % 3 === 1) {
                // Cuadrado
                ctx.fillRect(x - size/2, y - size/2, size, size);
                
                // Ojos
                ctx.fillStyle = "#000000";
                ctx.beginPath();
                ctx.arc(x - size/6, y - size/8, size/10, 0, Math.PI * 2);
                ctx.arc(x + size/6, y - size/8, size/10, 0, Math.PI * 2);
                ctx.fill();
                
                // Boca
                ctx.strokeStyle = "#000000";
                ctx.beginPath();
                ctx.moveTo(x - size/4, y + size/4);
                ctx.lineTo(x + size/4, y + size/4);
                ctx.stroke();
            } else {
                // Hexágono
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const angle = (Math.PI / 3) * i;
                    const px = x + Math.sin(angle) * (size/2);
                    const py = y + Math.cos(angle) * (size/2);
                    if (i === 0) {
                        ctx.moveTo(px, py);
                    } else {
                        ctx.lineTo(px, py);
                    }
                }
                ctx.closePath();
                ctx.fill();
                
                // Ojos
                ctx.fillStyle = "#000000";
                ctx.beginPath();
                ctx.arc(x - size/6, y - size/8, size/10, 0, Math.PI * 2);
                ctx.arc(x + size/6, y - size/8, size/10, 0, Math.PI * 2);
                ctx.fill();
                
                // Boca (curvada para parecer amenazante)
                ctx.strokeStyle = "#000000";
                ctx.beginPath();
                ctx.arc(x, y + size/5, size/6, Math.PI, 0);
                ctx.stroke();
            }
        }
    },
    item: {
        render: (ctx, x, y, size, type) => {
            // Colores según tipo de objeto
            const colors = [
                COLORS.items.health,       // Poción de salud
                COLORS.items.attack,       // Poción de fuerza
                COLORS.items.defense,      // Poción de defensa
                COLORS.items.experience,   // Poción de experiencia
                COLORS.items.maxHealth,    // Poción de vida máxima
                COLORS.items.mystery       // Poción misteriosa
            ];
            
            // Color base según tipo
            const color = colors[type % colors.length];
            
            // Diferentes formas según tipo
            if (type === 0) { // Poción de salud
                // Botella
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(x, y - size/4, size/4, Math.PI, 2 * Math.PI);
                ctx.fillRect(x - size/4, y - size/4, size/2, size/2);
                ctx.fill();
                
                // Líquido
                ctx.fillStyle = "#e74c3c";
                ctx.fillRect(x - size/5, y - size/6, 2*size/5, size/3);
                
                // Brillo
                ctx.fillStyle = "#ffffff";
                ctx.globalAlpha = 0.7;
                ctx.beginPath();
                ctx.arc(x - size/8, y - size/8, size/10, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1.0;
            } else if (type === 1) { // Poción de fuerza
                // Espada
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.moveTo(x, y - size/2);
                ctx.lineTo(x - size/6, y - size/4);
                ctx.lineTo(x - size/6, y + size/3);
                ctx.lineTo(x, y + size/2);
                ctx.lineTo(x + size/6, y + size/3);
                ctx.lineTo(x + size/6, y - size/4);
                ctx.closePath();
                ctx.fill();
                
                // Empuñadura
                ctx.fillStyle = "#f39c12";
                ctx.fillRect(x - size/3, y - size/2, 2*size/3, size/6);
                
                // Brillo
                ctx.fillStyle = "#ffffff";
                ctx.globalAlpha = 0.7;
                ctx.beginPath();
                ctx.arc(x + size/8, y, size/10, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1.0;
            } else if (type === 2) { // Poción de defensa
                // Escudo
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.moveTo(x, y - size/2);
                ctx.lineTo(x - size/2, y - size/4);
                ctx.lineTo(x - size/2, y + size/4);
                ctx.lineTo(x, y + size/2);
                ctx.lineTo(x + size/2, y + size/4);
                ctx.lineTo(x + size/2, y - size/4);
                ctx.closePath();
                ctx.fill();
                
                // Detalles del escudo
                ctx.fillStyle = "#7f8c8d";
                ctx.beginPath();
                ctx.arc(x, y, size/4, 0, Math.PI * 2);
                ctx.fill();
                
                // Brillo
                ctx.fillStyle = "#ffffff";
                ctx.globalAlpha = 0.7;
                ctx.beginPath();
                ctx.arc(x - size/6, y - size/6, size/10, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1.0;
            } else {
                // Objetos genéricos (gemas)
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.moveTo(x, y - size/2);
                ctx.lineTo(x - size/2, y);
                ctx.lineTo(x, y + size/2);
                ctx.lineTo(x + size/2, y);
                ctx.closePath();
                ctx.fill();
                
                // Brillo
                ctx.fillStyle = "#ffffff";
                ctx.globalAlpha = 0.7;
                ctx.beginPath();
                ctx.arc(x - size/6, y - size/6, size/8, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1.0;
            }
        }
    },
    stairs: {
        color: "#f1c40f",
        render: (ctx, x, y, size) => {
            // Fondo del portal
            ctx.fillStyle = "#8e44ad";
            ctx.beginPath();
            ctx.arc(x, y, size/2, 0, Math.PI * 2);
            ctx.fill();
            
            // Borde dorado
            ctx.strokeStyle = "#f1c40f";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(x, y, size/2, 0, Math.PI * 2);
            ctx.stroke();
            
            // Efecto de espiral
            ctx.strokeStyle = "#f39c12";
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let i = 0; i < 3; i++) {
                const radius = (size/2) * (1 - i/4);
                ctx.arc(x, y, radius, 0, Math.PI * (1 + i/2));
            }
            ctx.stroke();
            
            // Brillo central
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(x, y, size/8, 0, Math.PI * 2);
            ctx.fill();
        }
    }
};

/**
 * Obtiene un número entero aleatorio entre min y max (ambos inclusive)
 */
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Obtiene un elemento aleatorio de un array
 */
function getRandomElement(array) {
    return array[getRandomInt(0, array.length - 1)];
}

/**
 * Obtiene un color según el porcentaje de salud
 */
function getHealthColor(percentage) {
    if (percentage > 0.6) return COLORS.healthBar.high;
    if (percentage > 0.3) return COLORS.healthBar.medium;
    return COLORS.healthBar.low;
}

/**
 * Genera un UUID simple
 */
function generateId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Obtiene el nombre de un objeto según su tipo y nivel
 */
function getItemName(type, level) {
    const qualityPrefix = getQualityPrefix(level);
    
    switch (type) {
        case 0: return `${qualityPrefix} Poción de Salud`;
        case 1: return `${qualityPrefix} Poción de Fuerza`;
        case 2: return `${qualityPrefix} Poción de Defensa`;
        case 3: return `${qualityPrefix} Poción de Experiencia`;
        case 4: return `${qualityPrefix} Poción de Vida Máxima`;
        case 5: return `${qualityPrefix} Poción Misteriosa`;
        default: return `${qualityPrefix} Objeto Desconocido`;
    }
}

/**
 * Obtiene un prefijo de calidad según el nivel del objeto
 */
function getQualityPrefix(level) {
    if (level <= 1) return "Menor";
    if (level <= 3) return "Normal";
    if (level <= 5) return "Mayor";
    if (level <= 7) return "Superior";
    return "Legendaria";
}

/**
 * Comprueba si dos salas se superponen con un margen adicional
 */
function roomsOverlap(room1, room2, margin = 1) {
    return (
        room1.x - margin <= room2.x + room2.width + margin &&
        room1.x + room1.width + margin >= room2.x - margin &&
        room1.y - margin <= room2.y + room2.height + margin &&
        room1.y + room1.height + margin >= room2.y - margin
    );
}

/**
 * Obtiene una URL de imagen para representar un objeto
 */
function getItemImageUrl(type) {
    const colors = [
        "2ecc71", // Salud
        "e74c3c", // Ataque
        "3498db", // Defensa
        "9b59b6", // Experiencia
        "1abc9c", // Vida máxima
        "f39c12"  // Misterio
    ];
    
    const color = colors[type % colors.length];
    
    let shape = "";
    // Forma svg según tipo
    if (type === 0) { // Poción de salud - botella
        shape = '<rect x="8" y="14" width="8" height="8" fill="#' + color + '"/><circle cx="12" cy="12" r="4" fill="#' + color + '"/>';
    } else if (type === 1) { // Poción de fuerza - espada
        shape = '<polygon points="12,4 10,10 8,20 12,18 16,20 14,10" fill="#' + color + '"/>';
    } else if (type === 2) { // Poción de defensa - escudo
        shape = '<path d="M12,4 L4,8 L4,16 L12,20 L20,16 L20,8 Z" fill="#' + color + '"/><circle cx="12" cy="12" r="3" fill="#7f8c8d"/>';
    } else if (type === 3) { // Poción de experiencia - estrella
        shape = '<polygon points="12,2 15,9 22,9 16,14 19,21 12,17 5,21 8,14 2,9 9,9" fill="#' + color + '"/>';
    } else if (type === 4) { // Poción de vida máxima - corazón
        shape = '<path d="M12,21 L10.55,19.7 C5.4,15.36 2,12.28 2,8.5 C2,5.42 4.42,3 7.5,3 C9.24,3 10.91,3.81 12,5.09 C13.09,3.81 14.76,3 16.5,3 C19.58,3 22,5.42 22,8.5 C22,12.28 18.6,15.36 13.45,19.7 L12,21 Z" fill="#' + color + '"/>';
    } else { // Poción misteriosa - gema
        shape = '<polygon points="12,2 20,8 20,16 12,22 4,16 4,8" fill="#' + color + '"/>';
    }
    
    return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">' + shape + '<circle cx="8" cy="8" r="2" fill="white" fill-opacity="0.7"/></svg>';
}

/**
 * Calcula la fórmula de XP necesaria para subir de nivel
 */
function calculateXpForNextLevel(currentLevel) {
    return Math.floor(100 * Math.pow(1.5, currentLevel - 1));
}

/**
 * Calcula el daño con variación aleatoria
 */
function calculateDamage(baseDamage, defense) {
    // Añadir variación aleatoria (+/- 20%)
    const variation = getRandomInt(-20, 20) / 100;
    const actualDamage = Math.round(baseDamage * (1 + variation));
    
    // Reducir por defensa (la defensa reduce el daño en un porcentaje)
    const damageReduction = defense / (defense + 50); // Fórmula para que la defensa tenga rendimientos decrecientes
    const finalDamage = Math.max(1, Math.round(actualDamage * (1 - damageReduction)));
    
    return finalDamage;
}

/**
 * Función para depuración - dibujar información en pantalla
 */
function drawDebugInfo(scene) {
    if (!gameState.debug.enabled) return;
    
    // Limpiar cualquier gráfico de depuración anterior
    if (scene.debugGraphics) {
        scene.debugGraphics.clear();
    } else {
        scene.debugGraphics = scene.add.graphics();
        scene.debugGraphics.setDepth(100);
    }
    
    // Mostrar marcos de colisión si está activado
    if (gameState.debug.showCollisions) {
        scene.debugGraphics.lineStyle(1, 0xff0000);
        
        // Dibujar cajas de colisión de las paredes
        gameState.wallsLayer.getChildren().forEach(wall => {
            scene.debugGraphics.strokeRect(
                wall.x - wall.width/2, 
                wall.y - wall.height/2, 
                wall.width, 
                wall.height
            );
        });
        
        // Dibujar cajas de colisión del jugador
        scene.debugGraphics.lineStyle(1, 0x00ff00);
        scene.debugGraphics.strokeRect(
            scene.player.x - scene.player.width/2 + scene.player.body.offset.x,
            scene.player.y - scene.player.height/2 + scene.player.body.offset.y,
            scene.player.body.width,
            scene.player.body.height
        );
        
        // Dibujar cajas de colisión de los enemigos
        scene.debugGraphics.lineStyle(1, 0xff00ff);
        gameState.enemies.forEach(enemy => {
            if (enemy.sprite && enemy.sprite.active) {
                scene.debugGraphics.strokeRect(
                    enemy.sprite.x - enemy.sprite.width/2 + enemy.sprite.body.offset.x,
                    enemy.sprite.y - enemy.sprite.height/2 + enemy.sprite.body.offset.y,
                    enemy.sprite.body.width,
                    enemy.sprite.body.height
                );
            }
        });
    }
    
    // Dibujar el texto de depuración
    if (scene.debugText) {
        scene.debugText.destroy();
    }
    
    const debugInfo = [
        `FPS: ${Math.round(scene.game.loop.actualFps)}`,
        `Pos: ${Math.round(scene.player.x)},${Math.round(scene.player.y)}`,
        `Enemigos: ${gameState.enemies.length}`,
        `Nivel: ${gameState.dungeonLevel}`,
        `Memoria: ${Math.round(performance.memory ? performance.memory.usedJSHeapSize / (1024 * 1024) : 0)} MB`
    ];
    
    scene.debugText = scene.add.text(10, 10, debugInfo, {
        font: '14px monospace',
        fill: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 5, y: 5 }
    });
    scene.debugText.setScrollFactor(0);
    scene.debugText.setDepth(100);
}

/**
 * Activa/desactiva el modo de depuración
 */
function toggleDebugMode() {
    gameState.debug.enabled = !gameState.debug.enabled;
    
    if (!gameState.debug.enabled) {
        // Limpiar gráficos de depuración si se desactiva
        const scene = getActiveScene();
        if (scene) {
            if (scene.debugGraphics) {
                scene.debugGraphics.clear();
            }
            if (scene.debugText) {
                scene.debugText.destroy();
                scene.debugText = null;
            }
        }
    }
    
    return gameState.debug.enabled;
}

/**
 * Obtiene la escena activa actual
 */
function getActiveScene() {
    if (!window.gameInstance || !window.gameInstance.scene) return null;
    
    const activeScene = window.gameInstance.scene.scenes.find(s => 
        s.scene.key === 'GameScene' && s.scene.isActive());
    
    return activeScene;
}

/**
 * Añade utilidades de desarrollo para consola
 */
function setupDevConsole() {
    window.dev = {
        toggleDebug: toggleDebugMode,
        healPlayer: function(amount = 100) {
            gameState.playerStats.health = Math.min(
                gameState.playerStats.maxHealth,
                gameState.playerStats.health + amount
            );
            updateUI();
            return `Curado ${amount} puntos de salud`;
        },
        killAllEnemies: function() {
            const count = gameState.enemies.length;
            const scene = getActiveScene();
            if (!scene) return "No hay escena activa";
            
            gameState.enemies.forEach(enemy => {
                if (enemy.healthBar) enemy.healthBar.destroy();
                if (enemy.sprite) enemy.sprite.destroy();
            });
            
            gameState.enemies = [];
            return `Eliminados ${count} enemigos`;
        },
        teleport: function(x, y) {
            const scene = getActiveScene();
            if (!scene || !scene.player) return "No hay jugador activo";
            
            scene.player.x = x * CONFIG.tileSize;
            scene.player.y = y * CONFIG.tileSize;
            return `Teletransportado a (${x}, ${y})`;
        },
        nextLevel: function() {
            const scene = getActiveScene();
            if (!scene) return "No hay escena activa";
            
            gameState.dungeonLevel++;
            scene.scene.restart();
            return `Avanzando al nivel ${gameState.dungeonLevel}`;
        },
        godMode: function(enable = true) {
            window.godMode = enable;
            return `Modo dios ${enable ? 'activado' : 'desactivado'}`;
        },
        giveItem: function(type = 0, level = 1) {
            if (type < 0 || type > 5) return "Tipo de objeto inválido (0-5)";
            if (level < 1 || level > 10) return "Nivel de objeto inválido (1-10)";
            
            const itemName = getItemName(type, level);
            gameState.inventory.push({
                type: type,
                level: level,
                name: itemName
            });
            
            updateInventoryUI();
            return `Añadido: ${itemName}`;
        },
        showStats: function() {
            return {
                playerStats: { ...gameState.playerStats },
                level: gameState.dungeonLevel,
                enemies: gameState.enemies.length,
                rooms: gameState.rooms.length,
                items: gameState.items.length,
                killed: gameState.enemiesKilled
            };
        }
    };
    
    console.log("Herramientas de desarrollo disponibles. Usa window.dev.[comando] para acceder.");
}