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
    wallsLayer: null
};

// Constantes de configuración
const CONFIG = {
    tileSize: 32,
    mapWidth: 50,
    mapHeight: 50,
    roomMinSize: 6,
    roomMaxSize: 12,
    maxRooms: 15
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
 * Calcula la fórmula de XP necesaria para subir de nivel
 */
function calculateXpForNextLevel(currentLevel) {
    return Math.floor(100 * Math.pow(1.5, currentLevel - 1));
}

/**
 * Obtiene el nombre de un objeto según su tipo y nivel
 */
function getItemName(type, level) {
    const qualityPrefix = level <= 1 ? "Menor" : 
                          level <= 3 ? "Normal" : 
                          level <= 5 ? "Mayor" : 
                          level <= 7 ? "Superior" : "Legendaria";
    
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
 * Obtiene la escena activa actual
 */
function getActiveScene() {
    if (!window.gameInstance || !window.gameInstance.scene) return null;
    
    const activeScene = window.gameInstance.scene.scenes.find(s => 
        s.scene.key === 'GameScene' && s.scene.isActive());
    
    return activeScene;
}

/**
 * Obtiene una URL de imagen para representar un objeto
 */
function getItemImageUrl(type) {
    // Colores básicos para los diferentes tipos de objetos
    const colors = [
        "2ecc71", // Salud (verde)
        "e74c3c", // Ataque (rojo)
        "3498db", // Defensa (azul)
        "9b59b6", // Experiencia (púrpura)
        "1abc9c", // Vida máxima (turquesa)
        "f39c12"  // Misterio (naranja)
    ];
    
    // Usar el color correspondiente al tipo
    const color = colors[type % colors.length];
    
    // Crear un círculo simple como SVG para representar el objeto
    return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="%23' + color + '"/></svg>';
}

/**
 * Obtiene una URL de imagen para representar un objeto
 */
function getItemImageUrl(type) {
    // Colores básicos para los diferentes tipos de objetos
    const colors = [
        "2ecc71", // Salud (verde)
        "e74c3c", // Ataque (rojo)
        "3498db", // Defensa (azul)
        "9b59b6", // Experiencia (púrpura)
        "1abc9c", // Vida máxima (turquesa)
        "f39c12"  // Misterio (naranja)
    ];
    
    // Usar el color correspondiente al tipo
    const color = colors[type % colors.length];
    
    // Crear un círculo simple como SVG para representar el objeto
    return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="%23' + color + '"/></svg>';
}