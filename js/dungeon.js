/**
 * Funciones relacionadas con la generación de mazmorras
 */

/**
 * Genera una mazmorra procedural
 */
function generateDungeon(scene) {
    // Añadir mensaje para verificar que la generación se está ejecutando
    console.log("Iniciando generación de mazmorra...");
    
    // Configurar un mapa básico
    setupBasicMap(scene);
    
    // Generar salas
    generateRooms(scene);
    
    // Conectar salas
    connectRooms(scene);
    
    // Establecer colisiones
    setupCollisions(scene);
    
    console.log("Mazmorra generada con éxito");
}

/**
 * Configura un mapa básico con paredes
 */
function setupBasicMap(scene) {
    // Inicializar matriz del mapa
    gameState.map = [];
    for (let y = 0; y < CONFIG.mapHeight; y++) {
        const row = [];
        for (let x = 0; x < CONFIG.mapWidth; x++) {
            row.push(1); // 1 = pared, 0 = suelo
        }
        gameState.map.push(row);
    }
    
    // Crear capa de paredes
    gameState.wallsLayer = scene.physics.add.staticGroup();
}

/**
 * Genera salas aleatorias en la mazmorra
 */
function generateRooms(scene) {
    const roomCount = getRandomInt(7, 15);
    const minRoomSize = CONFIG.roomMinSize;
    const maxRoomSize = CONFIG.roomMaxSize;
    gameState.rooms = [];
    
    // Si no se pueden generar salas, crear al menos una sala simple
    if (roomCount <= 0) {
        createTestRoom(scene);
        return;
    }
    
    for (let i = 0; i < roomCount; i++) {
        const roomWidth = getRandomInt(minRoomSize, maxRoomSize);
        const roomHeight = getRandomInt(minRoomSize, maxRoomSize);
        const roomX = getRandomInt(1, CONFIG.mapWidth - roomWidth - 1);
        const roomY = getRandomInt(1, CONFIG.mapHeight - roomHeight - 1);
        
        // Crear una nueva sala
        const newRoom = {
            x: roomX,
            y: roomY,
            width: roomWidth,
            height: roomHeight,
            centerX: Math.floor(roomX + roomWidth / 2),
            centerY: Math.floor(roomY + roomHeight / 2)
        };
        
        // Verificar superposición con otras salas
        let overlapping = false;
        
        for (const otherRoom of gameState.rooms) {
            if (roomsOverlap(newRoom, otherRoom)) {
                overlapping = true;
                break;
            }
        }
        
        if (!overlapping) {
            // Añadir la sala al array
            gameState.rooms.push(newRoom);
            
            // Excavar la sala en el mapa (establecer como suelo)
            for (let y = newRoom.y; y < newRoom.y + newRoom.height; y++) {
                for (let x = newRoom.x; x < newRoom.x + newRoom.width; x++) {
                    gameState.map[y][x] = 0; // 0 = suelo
                    
                    // Dibujar suelo
                    drawFloorTile(scene, x, y);
                }
            }
        }
    }
    
    // Si no se pudo crear ninguna sala, crear una sala de prueba
    if (gameState.rooms.length === 0) {
        createTestRoom(scene);
    }
}

/**
 * Crea una sala de prueba simple para asegurar que haya al menos una sala
 */
function createTestRoom(scene) {
    const roomWidth = Math.floor(CONFIG.mapWidth / 2);
    const roomHeight = Math.floor(CONFIG.mapHeight / 2);
    const roomX = Math.floor(CONFIG.mapWidth / 4);
    const roomY = Math.floor(CONFIG.mapHeight / 4);
    
    const testRoom = {
        x: roomX,
        y: roomY,
        width: roomWidth,
        height: roomHeight,
        centerX: Math.floor(roomX + roomWidth / 2),
        centerY: Math.floor(roomY + roomHeight / 2)
    };
    
    gameState.rooms = [testRoom];
    
    // Excavar la sala en el mapa
    for (let y = testRoom.y; y < testRoom.y + testRoom.height; y++) {
        for (let x = testRoom.x; x < testRoom.x + testRoom.width; x++) {
            if (y >= 0 && y < CONFIG.mapHeight && x >= 0 && x < CONFIG.mapWidth) {
                gameState.map[y][x] = 0; // 0 = suelo
                drawFloorTile(scene, x, y);
            }
        }
    }
    
    console.log("Creada sala de prueba:", testRoom);
}

/**
 * Conecta las salas generadas con corredores
 */
function connectRooms(scene) {
    for (let i = 1; i < gameState.rooms.length; i++) {
        const prevRoom = gameState.rooms[i - 1];
        const currentRoom = gameState.rooms[i];
        
        // Elegir aleatoriamente si crear primero un corredor horizontal o vertical
        if (Math.random() > 0.5) {
            // Primero horizontal, luego vertical
            createHorizontalCorridor(scene, prevRoom.centerX, currentRoom.centerX, prevRoom.centerY);
            createVerticalCorridor(scene, prevRoom.centerY, currentRoom.centerY, currentRoom.centerX);
        } else {
            // Primero vertical, luego horizontal
            createVerticalCorridor(scene, prevRoom.centerY, currentRoom.centerY, prevRoom.centerX);
            createHorizontalCorridor(scene, prevRoom.centerX, currentRoom.centerX, currentRoom.centerY);
        }
    }
}

/**
 * Crea un corredor horizontal entre dos puntos
 */
function createHorizontalCorridor(scene, startX, endX, y) {
    const start = Math.min(startX, endX);
    const end = Math.max(startX, endX);
    
    for (let x = start; x <= end; x++) {
        // Establecer como suelo en la matriz del mapa
        if (y >= 0 && y < CONFIG.mapHeight && x >= 0 && x < CONFIG.mapWidth) {
            gameState.map[y][x] = 0; // 0 = suelo
            
            // Dibujar suelo
            drawFloorTile(scene, x, y);
        }
    }
}

/**
 * Crea un corredor vertical entre dos puntos
 */
function createVerticalCorridor(scene, startY, endY, x) {
    const start = Math.min(startY, endY);
    const end = Math.max(startY, endY);
    
    for (let y = start; y <= end; y++) {
        // Establecer como suelo en la matriz del mapa
        if (y >= 0 && y < CONFIG.mapHeight && x >= 0 && x < CONFIG.mapWidth) {
            gameState.map[y][x] = 0; // 0 = suelo
            
            // Dibujar suelo
            drawFloorTile(scene, x, y);
        }
    }
}

/**
 * Configura colisiones para el mapa
 */
function setupCollisions(scene) {
    // Actualizar paredes después de generar salas y corredores
    updateWalls(scene);
}

/**
 * Actualiza las paredes de la mazmorra
 */
function updateWalls(scene) {
    // Limpia todas las paredes existentes
    if (gameState.wallsLayer) {
        gameState.wallsLayer.clear(true, true);
    }
    
    // Recrea las paredes basadas en la matriz del mapa
    for (let y = 0; y < CONFIG.mapHeight; y++) {
        for (let x = 0; x < CONFIG.mapWidth; x++) {
            if (isWall(x, y)) {
                createWall(scene, x, y);
            }
        }
    }
}

/**
 * Comprueba si una posición es una pared
 */
function isWall(x, y) {
    // Borde del mapa
    if (x === 0 || x === CONFIG.mapWidth - 1 || y === 0 || y === CONFIG.mapHeight - 1) {
        return true;
    }
    
    // Comprobar la matriz del mapa
    return gameState.map[y][x] === 1;
}

/**
 * Crea una pared en una posición específica
 */
function createWall(scene, x, y) {
    // Posición en píxeles
    const wallX = x * CONFIG.tileSize + (CONFIG.tileSize / 2);
    const wallY = y * CONFIG.tileSize + (CONFIG.tileSize / 2);
    
    // Crear un rectángulo para la pared con un color más visible
    const wall = scene.add.rectangle(
        wallX, wallY, 
        CONFIG.tileSize, CONFIG.tileSize, 
        0x8B4513  // Marrón para mejorar visibilidad
    );
    
    // Añadir físicas estáticas
    scene.physics.add.existing(wall, true);
    
    // Añadir al grupo de paredes
    gameState.wallsLayer.add(wall);
}

/**
 * Dibuja una baldosa de suelo en una posición específica
 */
function drawFloorTile(scene, x, y) {
    // Posición en píxeles
    const floorX = x * CONFIG.tileSize + (CONFIG.tileSize / 2);
    const floorY = y * CONFIG.tileSize + (CONFIG.tileSize / 2);
    
    // Crear un rectángulo para el suelo con un color más visible
    const floorColor = getRandomInt(1, 10) === 1 ? 0x444444 : 0x333333;
    scene.add.rectangle(
        floorX, floorY, 
        CONFIG.tileSize, CONFIG.tileSize, 
        floorColor
    ).setDepth(-1);
}

/**
 * Coloca las escaleras en la última sala
 */
function placeStairs(scene) {
    if (gameState.rooms.length > 0) {
        const lastRoom = gameState.rooms[gameState.rooms.length - 1];
        const x = lastRoom.centerX * CONFIG.tileSize + (CONFIG.tileSize / 2);
        const y = lastRoom.centerY * CONFIG.tileSize + (CONFIG.tileSize / 2);
        
        // Crear gráfico personalizado para las escaleras
        const stairsGraphic = scene.add.graphics();
        stairsGraphic.fillStyle(0xf1c40f, 1);
        stairsGraphic.fillCircle(0, 0, CONFIG.tileSize/2);
        stairsGraphic.lineStyle(3, 0xf39c12, 1);
        stairsGraphic.beginPath();
        stairsGraphic.arc(0, 0, CONFIG.tileSize/3, 0, Math.PI * 1.5);
        stairsGraphic.stroke();
        
        // Usar generateTexture para crear una textura a partir del gráfico
        const stairsTexture = stairsGraphic.generateTexture('stairs_texture', CONFIG.tileSize, CONFIG.tileSize);
        stairsGraphic.destroy();
        
        // Crear sprite de escaleras con físicas
        gameState.stairs = scene.physics.add.sprite(x, y, 'stairs_texture');
        gameState.stairs.setScale(0.8);
        gameState.stairs.depth = 1;
        
        // Añadir animación a las escaleras
        scene.tweens.add({
            targets: gameState.stairs,
            angle: 360,
            duration: 10000,
            repeat: -1
        });
    }
}