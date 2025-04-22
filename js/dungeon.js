/**
 * Funciones relacionadas con la generación de mazmorras
 */

/**
 * Genera una mazmorra procedural
 */
function generateDungeon(scene) {
    // Crear un mapa básico (sin usar tilemap para no depender de assets externos)
    setupBasicMap(scene);
    
    // Generar salas
    generateRooms(scene);
    
    // Conectar salas
    connectRooms(scene);
    
    // Establecer colisiones
    setupCollisions(scene);
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
    
    // Generar paredes iniciales alrededor del mapa
    for (let y = 0; y < CONFIG.mapHeight; y++) {
        for (let x = 0; x < CONFIG.mapWidth; x++) {
            // Crear gráfico de pared
            if (isWall(x, y)) {
                createWall(scene, x, y);
            }
        }
    }
}

/**
 * Genera salas aleatorias en la mazmorra
 */
function generateRooms(scene) {
    const roomCount = getRandomInt(7, 15);
    const minRoomSize = CONFIG.roomMinSize;
    const maxRoomSize = CONFIG.roomMaxSize;
    gameState.rooms = [];
    
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
                    
                    // Eliminar paredes en esta posición si existen
                    removeWallAt(scene, x, y);
                    
                    // Dibujar suelo
                    drawFloorTile(scene, x, y);
                }
            }
        }
    }
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
            
            // Eliminar pared en esta posición si existe
            removeWallAt(scene, x, y);
            
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
            
            // Eliminar pared en esta posición si existe
            removeWallAt(scene, x, y);
            
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
    gameState.wallsLayer.clear(true, true);
    
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
 * Elimina la pared en una posición específica
 */
function removeWallAt(scene, x, y) {
    // Buscar y eliminar la pared en esa posición
    gameState.wallsLayer.getChildren().forEach(wall => {
        if (wall.x === x * CONFIG.tileSize + (CONFIG.tileSize / 2) && 
            wall.y === y * CONFIG.tileSize + (CONFIG.tileSize / 2)) {
            wall.destroy();
        }
    });
}

/**
 * Crea una pared en la posición especificada
 */
function createWall(scene, x, y) {
    // Posición en píxeles
    const wallX = x * CONFIG.tileSize + (CONFIG.tileSize / 2);
    const wallY = y * CONFIG.tileSize + (CONFIG.tileSize / 2);
    
    // Crear un objeto visual para la pared (rectángulo simple)
    const wall = scene.add.rectangle(
        wallX, wallY, 
        CONFIG.tileSize, CONFIG.tileSize, 
        0x333333
    );
    
    // Añadir físicas estáticas
    scene.physics.add.existing(wall, true);
    
    // Ajustar el tamaño del cuerpo físico
    wall.body.setSize(CONFIG.tileSize, CONFIG.tileSize);
    
    // Añadir al grupo de paredes
    gameState.wallsLayer.add(wall);
}

/**
 * Dibuja una baldosa de suelo en la posición especificada
 */
function drawFloorTile(scene, x, y) {
    // Posición en píxeles
    const floorX = x * CONFIG.tileSize + (CONFIG.tileSize / 2);
    const floorY = y * CONFIG.tileSize + (CONFIG.tileSize / 2);
    
    // Crear un objeto visual para el suelo (rectángulo simple)
    const floorColor = getRandomInt(1, 10) === 1 ? 0x222222 : 0x111111; // Variación ocasional
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
        SPRITES.stairs.render(stairsGraphic, 0, 0, CONFIG.tileSize);
        
        // Crear sprite de escaleras con físicas
        gameState.stairs = scene.physics.add.sprite(x, y, '__DEFAULT');
        gameState.stairs.setTexture(stairsGraphic.generateTexture());
        stairsGraphic.destroy();
        
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