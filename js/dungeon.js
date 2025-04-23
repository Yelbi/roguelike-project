/**
 * Genera una mazmorra procedural
 */
function generateDungeon(scene) {
    console.log("Iniciando generación de mazmorra...");
    
    // Configurar un mapa básico
    setupBasicMap(scene);
    
    // Generar salas
    generateRooms(scene);
    
    // Si no se generaron salas, crear una sala de prueba
    if (gameState.rooms.length === 0) {
        createTestRoom(scene);
    }
    
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
    if (gameState.wallsLayer) {
        // Comprobamos primero si es un grupo válido
        if (gameState.wallsLayer.clear && typeof gameState.wallsLayer.clear === 'function') {
            gameState.wallsLayer.clear(true, true);
        } else {
            // Si no existe un grupo válido, lo creamos
            gameState.wallsLayer = scene.physics.add.staticGroup();
        }
    } else {
        // Si no existe en absoluto, lo creamos
        gameState.wallsLayer = scene.physics.add.staticGroup();
    }
    
    // Inicializar capa de suelo
    if (!gameState.floorLayer) {
        gameState.floorLayer = scene.add.group();
    } else if (gameState.floorLayer.clear && typeof gameState.floorLayer.clear === 'function') {
        gameState.floorLayer.clear(true, true);
    }
}

function drawFloorTile(scene, x, y) {
    // Crear un rectángulo para representar el suelo
    const floorRect = scene.add.rectangle(
        x * CONFIG.tileSize + CONFIG.tileSize/2, 
        y * CONFIG.tileSize + CONFIG.tileSize/2, 
        CONFIG.tileSize, 
        CONFIG.tileSize, 
        0x333333 // Color gris oscuro para el suelo
    );
    floorRect.setDepth(0);
    gameState.floorLayer.add(floorRect);
    
    // Actualizar las paredes alrededor
    updateAdjacentWalls(scene, x, y);
}

function updateAdjacentWalls(scene, floorX, floorY) {
    // Direcciones: arriba, derecha, abajo, izquierda
    const directions = [
        {dx: 0, dy: -1},
        {dx: 1, dy: 0},
        {dx: 0, dy: 1},
        {dx: -1, dy: 0}
    ];
    
    directions.forEach(dir => {
        const x = floorX + dir.dx;
        const y = floorY + dir.dy;
        
        // Verificar si está dentro de los límites
        if (x >= 0 && x < CONFIG.mapWidth && y >= 0 && y < CONFIG.mapHeight) {
            // Si es una pared, asegurarse de que sea visible
            if (gameState.map[y][x] === 1) {
                createWallTile(scene, x, y);
            }
        }
    });
}

function createWallTile(scene, x, y) {
    // Crear un rectángulo para representar la pared
    const wall = scene.add.rectangle(
        x * CONFIG.tileSize + CONFIG.tileSize/2, 
        y * CONFIG.tileSize + CONFIG.tileSize/2, 
        CONFIG.tileSize, 
        CONFIG.tileSize, 
        0x8B4513 // Color marrón para las paredes
    );
    wall.setDepth(1);
    
    // Añadir el rectángulo al grupo de paredes
    gameState.wallsLayer.add(wall);
}

/**
 * Configura las colisiones del mapa
 */
function setupCollisions(scene) {
    // Verificar que las capas existan
    if (!gameState.wallsLayer) {
        console.error("No se encontró la capa de paredes");
        return;
    }
    
    // Configurar colisiones con las paredes
    scene.physics.world.setBounds(0, 0, 
        CONFIG.mapWidth * CONFIG.tileSize, 
        CONFIG.mapHeight * CONFIG.tileSize);
    
    // Si hay jugador, configurar colisiones con él
    if (scene.player) {
        scene.physics.add.collider(scene.player, gameState.wallsLayer);
    }
}

/**
 * Genera salas aleatorias en la mazmorra
 */
function generateRooms(scene) {
    const roomCount = getRandomInt(6, 12);
    const minRoomSize = CONFIG.roomMinSize;
    const maxRoomSize = CONFIG.roomMaxSize;
    gameState.rooms = [];
    
    let attempts = 0;
    const maxAttempts = 150;
    
    while (gameState.rooms.length < roomCount && attempts < maxAttempts) {
        attempts++;
        
        // Dimensiones aleatorias para la sala
        const roomWidth = getRandomInt(minRoomSize, maxRoomSize);
        const roomHeight = getRandomInt(minRoomSize, maxRoomSize);
        
        // Posición aleatoria
        const roomX = getRandomInt(2, CONFIG.mapWidth - roomWidth - 3);
        const roomY = getRandomInt(2, CONFIG.mapHeight - roomHeight - 3);
        
        // Crear una nueva sala
        const newRoom = {
            x: roomX,
            y: roomY,
            width: roomWidth,
            height: roomHeight,
            centerX: Math.floor(roomX + roomWidth / 2),
            centerY: Math.floor(roomY + roomHeight / 2),
            type: getRandomInt(0, 3)
        };
        
        // Verificar superposición con otras salas
        let overlapping = false;
        
        for (const otherRoom of gameState.rooms) {
            if (roomsOverlap(newRoom, otherRoom, 1)) {
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
                    if (y >= 0 && y < CONFIG.mapHeight && x >= 0 && x < CONFIG.mapWidth) {
                        gameState.map[y][x] = 0; // 0 = suelo
                        drawFloorTile(scene, x, y);
                    }
                }
            }
        }
    }
    
    console.log(`Generadas ${gameState.rooms.length} salas después de ${attempts} intentos`);
}

/**
 * Dibuja una baldosa de suelo
 */
function drawFloorTile(scene, x, y) {
    // Crear el suelo físico para colisiones
    // En una implementación completa, esto crearía tiles visuales
}

/**
 * Comprueba si una casilla es una pared
 */
function isWall(x, y) {
    // Comprobar límites del mapa
    if (x < 0 || x >= CONFIG.mapWidth || y < 0 || y >= CONFIG.mapHeight) {
        return true; // Todo fuera del mapa se considera pared
    }
    
    return gameState.map[y][x] === 1; // 1 = pared, 0 = suelo
}

/**
 * Crea una sala de prueba simple
 */
function createTestRoom(scene) {
    // Crear una sala segura en el centro del mapa
    const roomWidth = Math.min(15, CONFIG.mapWidth - 10);
    const roomHeight = Math.min(15, CONFIG.mapHeight - 10);
    const roomX = Math.floor((CONFIG.mapWidth - roomWidth) / 2);
    const roomY = Math.floor((CONFIG.mapHeight - roomHeight) / 2);
    
    const testRoom = {
        x: roomX,
        y: roomY,
        width: roomWidth,
        height: roomHeight,
        centerX: roomX + Math.floor(roomWidth / 2),
        centerY: roomY + Math.floor(roomHeight / 2),
        type: 0
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
 * Crea un corredor horizontal en el mapa
 */
function createHorizontalCorridor(scene, startX, endX, y) {
    const start = Math.min(startX, endX);
    const end = Math.max(startX, endX);
    
    for (let x = start; x <= end; x++) {
        // Comprobar límites del mapa
        if (x >= 0 && x < CONFIG.mapWidth && y >= 0 && y < CONFIG.mapHeight) {
            // Marcar como suelo
            gameState.map[y][x] = 0;
            
            // Dibujar suelo
            drawFloorTile(scene, x, y);
        }
    }
}

/**
 * Crea un corredor vertical en el mapa
 */
function createVerticalCorridor(scene, startY, endY, x) {
    const start = Math.min(startY, endY);
    const end = Math.max(startY, endY);
    
    for (let y = start; y <= end; y++) {
        // Comprobar límites del mapa
        if (x >= 0 && x < CONFIG.mapWidth && y >= 0 && y < CONFIG.mapHeight) {
            // Marcar como suelo
            gameState.map[y][x] = 0;
            
            // Dibujar suelo
            drawFloorTile(scene, x, y);
        }
    }
}

/**
 * Conecta las salas generadas con corredores
 */
function connectRooms(scene) {
    if (gameState.rooms.length <= 1) return;
    
    // Conectar cada sala con la siguiente
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
 * Coloca las escaleras para bajar al siguiente nivel
 */
function placeStairs(scene) {
    // Eliminar escaleras anteriores si existen
    if (gameState.stairs) {
        gameState.stairs.destroy();
    }
    
    // Colocar escaleras en la última sala
    if (gameState.rooms.length > 0) {
        const lastRoom = gameState.rooms[gameState.rooms.length - 1];
        const stairsX = lastRoom.centerX * CONFIG.tileSize + (CONFIG.tileSize / 2);
        const stairsY = lastRoom.centerY * CONFIG.tileSize + (CONFIG.tileSize / 2);
        
        // Crear gráfico para las escaleras
        const stairsGraphic = scene.add.graphics({ willReadFrequently: true });
        stairsGraphic.fillStyle(0x8e44ad, 0.8); // Púrpura
        stairsGraphic.fillCircle(0, 0, CONFIG.tileSize * 0.4);
        // Añadir borde blanco para mejor visibilidad
        stairsGraphic.lineStyle(2, 0xffffff, 1);
        stairsGraphic.strokeCircle(0, 0, CONFIG.tileSize * 0.4);
        
        // Generar textura
        const stairsTextureKey = 'portal_texture';
        stairsGraphic.generateTexture(stairsTextureKey, CONFIG.tileSize, CONFIG.tileSize);
        stairsGraphic.destroy();
        
        // Crear sprite con físicas
        gameState.stairs = scene.physics.add.sprite(stairsX, stairsY, stairsTextureKey);
        gameState.stairs.setDepth(3);
    }
}