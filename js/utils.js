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
    stairs: null
};

// Constantes de configuración
const CONFIG = {
    tileSize: 32,
    mapWidth: 50,
    mapHeight: 50,
    roomMinSize: 5,
    roomMaxSize: 12,
    maxRooms: 15
};

// Sprites simples (formas básicas usando canvas en lugar de sprites externos)
const SPRITES = {
    player: {
        color: "#3498db",
        render: (ctx, x, y, size) => {
            ctx.fillStyle = "#3498db";
            ctx.beginPath();
            ctx.arc(x, y, size/2, 0, Math.PI * 2);
            ctx.fill();
            
            // Detalles del personaje
            ctx.fillStyle = "#2980b9";
            ctx.beginPath();
            ctx.arc(x, y, size/3, 0, Math.PI * 2);
            ctx.fill();
        }
    },
    enemy: {
        color: "#e74c3c",
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
            } else if (type % 3 === 1) {
                // Cuadrado
                ctx.fillRect(x - size/2, y - size/2, size, size);
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
            }
        }
    },
    item: {
        color: "#2ecc71",
        render: (ctx, x, y, size, type) => {
            // Colores según tipo de objeto
            const colors = ["#2ecc71", "#3498db", "#f1c40f", "#9b59b6", "#1abc9c", "#e67e22"];
            ctx.fillStyle = colors[type % colors.length];
            
            // Diferentes formas según tipo
            if (type === 0) { // Poción de salud
                // Botella
                ctx.beginPath();
                ctx.arc(x, y - size/4, size/4, Math.PI, 2 * Math.PI);
                ctx.fillRect(x - size/4, y - size/4, size/2, size/2);
                ctx.fill();
                
                // Líquido
                ctx.fillStyle = "#e74c3c";
                ctx.fillRect(x - size/5, y - size/6, 2*size/5, size/3);
            } else if (type === 1) { // Poción de fuerza
                // Espada
                ctx.beginPath();
                ctx.moveTo(x, y - size/2);
                ctx.lineTo(x, y + size/3);
                ctx.lineTo(x - size/5, y + size/2);
                ctx.lineTo(x + size/5, y + size/2);
                ctx.lineTo(x, y + size/3);
                ctx.fill();
                
                // Empuñadura
                ctx.fillStyle = "#f39c12";
                ctx.fillRect(x - size/4, y - size/2, size/2, size/6);
            } else if (type === 2) { // Poción de defensa
                // Escudo
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
            } else {
                // Objetos genéricos (gemas)
                ctx.beginPath();
                ctx.moveTo(x, y - size/2);
                ctx.lineTo(x - size/2, y);
                ctx.lineTo(x, y + size/2);
                ctx.lineTo(x + size/2, y);
                ctx.closePath();
                ctx.fill();
                
                // Brillo
                ctx.fillStyle = "#ffffff";
                ctx.beginPath();
                ctx.arc(x - size/6, y - size/6, size/8, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    },
    stairs: {
        color: "#f1c40f",
        render: (ctx, x, y, size) => {
            ctx.fillStyle = "#f1c40f";
            
            // Dibujar un portal
            ctx.beginPath();
            ctx.arc(x, y, size/2, 0, Math.PI * 2);
            ctx.fill();
            
            // Efecto de espiral
            ctx.strokeStyle = "#f39c12";
            ctx.lineWidth = 3;
            ctx.beginPath();
            for (let i = 0; i < 2; i++) {
                const radius = (size/2) * (1 - i/3);
                ctx.arc(x, y, radius, 0, Math.PI * 1.5);
            }
            ctx.stroke();
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
 * Obtiene un color según el porcentaje de salud
 */
function getHealthColor(percentage) {
    if (percentage > 0.6) return 0x00ff00; // Verde
    if (percentage > 0.3) return 0xffff00; // Amarillo
    return 0xff0000; // Rojo
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
 * Comprueba si dos salas se superponen
 */
function roomsOverlap(room1, room2) {
    return (
        room1.x <= room2.x + room2.width + 1 &&
        room1.x + room1.width + 1 >= room2.x &&
        room1.y <= room2.y + room2.height + 1 &&
        room1.y + room1.height + 1 >= room2.y
    );
}

/**
 * Obtiene una URL de imagen para representar un objeto
 */
function getItemImageUrl(type) {
    // En un caso real, serían URLs a imágenes, por ahora son placeholders
    return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="%23' + getItemColor(type) + '"/></svg>';
}

/**
 * Obtiene un color para un tipo de objeto
 */
function getItemColor(type) {
    const colors = ["2ecc71", "3498db", "f1c40f", "9b59b6", "1abc9c", "e67e22"];
    return colors[type % colors.length];
}