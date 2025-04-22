/**
 * Funciones relacionadas con la generación de mazmorras
 */

/**
 * Genera una mazmorra procedural
 */
function generateDungeon(scene) {
    console.log("Iniciando generación de mazmorra...");
    
    // Configurar un mapa básico
    setupBasicMap(scene);
    
    // Generar salas
    generateRooms(scene);
    
    // Si no se generaron salas, crear una sala de prueba segura
    if (gameState.rooms.length === 0) {
        createTestRoom(scene);
    }
    
    // Conectar salas
    connectRooms(scene);
    
    // Establecer colisiones
    setupCollisions(scene);
    
    // Asegurarse de que la primera sala tenga suficiente espacio para el jugador
    ensureFirstRoomIsSafe(scene);
    
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
        gameState.wallsLayer.clear(true, true);
    }
    gameState.wallsLayer = scene.physics.add.staticGroup();
}

/**
 * Genera salas aleatorias en la mazmorra
 */
function generateRooms(scene) {
    const roomCount = getRandomInt(5, 10); // Reducido para evitar problemas
    const minRoomSize = CONFIG.roomMinSize;
    const maxRoomSize = CONFIG.roomMaxSize;
    gameState.rooms = [];
    
    let attempts = 0;
    const maxAttempts = 100; // Limite de intentos para evitar bucles infinitos
    
    while (gameState.rooms.length < roomCount && attempts < maxAttempts) {
        attempts++;
        
        // Dimensiones aleatorias para la sala
        const roomWidth = getRandomInt(minRoomSize, maxRoomSize);
        const roomHeight = getRandomInt(minRoomSize, maxRoomSize);
        
        // Posición aleatoria (dejando margen para las paredes)
        const roomX = getRandomInt(2, CONFIG.mapWidth - roomWidth - 3);
        const roomY = getRandomInt(2, CONFIG.mapHeight - roomHeight - 3);
        
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
 * Asegura que la primera sala tenga suficiente espacio para el jugador
 */
function ensureFirstRoomIsSafe(scene) {
    if (gameState.rooms.length > 0) {
        const firstRoom = gameState.rooms[0];
        
        // Asegurarse de que la sala sea lo suficientemente grande
        if (firstRoom.width < 4 || firstRoom.height < 4) {
            // Expandir la sala
            const newWidth = Math.max(firstRoom.width, 5);
            const newHeight = Math.max(firstRoom.height, 5);
            
            // Calcular nuevos límites
            const expandX = newWidth - firstRoom.width;
            const expandY = newHeight - firstRoom.height;
            
            // Ajustar los límites para mantener centrado
            firstRoom.x = Math.max(2, firstRoom.x - Math.floor(expandX / 2));
            firstRoom.y = Math.max(2, firstRoom.y - Math.floor(expandY / 2));
            firstRoom.width = newWidth;
            firstRoom.height = newHeight;
            firstRoom.centerX = firstRoom.x + Math.floor(newWidth / 2);
            firstRoom.centerY = firstRoom.y + Math.floor(newHeight / 2);
            
            // Actualizar el mapa con la sala expandida
            for (let y = firstRoom.y; y < firstRoom.y + firstRoom.height; y++) {
                for (let x = firstRoom.x; x < firstRoom.x + firstRoom.width; x++) {
                    if (y >= 0 && y < CONFIG.mapHeight && x >= 0 && x < CONFIG.mapWidth) {
                        gameState.map[y][x] = 0; // 0 = suelo
                        drawFloorTile(scene, x, y);
                    }
                }
            }
            
            console.log("Primera sala expandida para asegurar espacio");
        }
        
        // Asegurarse de que no haya paredes cerca del centro de la primera sala
        const safeRadius = 2;
        for (let y = firstRoom.centerY - safeRadius; y <= firstRoom.centerY + safeRadius; y++) {
            for (let x = firstRoom.centerX - safeRadius; x <= firstRoom.centerX + safeRadius; x++) {
                if (y >= 0 && y < CONFIG.mapHeight && x >= 0 && x < CONFIG.mapWidth) {
                    gameState.map[y][x] = 0; // 0 = suelo
                    drawFloorTile(scene, x, y);
                }
            }
        }
    }
}

/**
 * Crea una sala de prueba simple para asegurar que haya al menos una sala
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
        centerY: roomY + Math.floor(roomHeight / 2)
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
    
    // Añadir corredores adicionales para crear ciclos
    if (gameState.rooms.length > 3) {
        const additionalConnections = Math.min(3, Math.floor(gameState.rooms.length / 3));
        
        for (let i = 0; i < additionalConnections; i++) {
            const roomA = gameState.rooms[getRandomInt(0, gameState.rooms.length - 1)];
            let roomB = gameState.rooms[getRandomInt(0, gameState.rooms.length - 1)];
            
            // Asegurarse de que son salas diferentes
            let attempts = 0;
            while (roomA === roomB && attempts < 5) {
                roomB = gameState.rooms[getRandomInt(0, gameState.rooms.length - 1)];
                attempts++;
            }
            
            if (roomA !== roomB) {
                // Crear corredor aleatorio
                if (Math.random() > 0.5) {
                    createHorizontalCorridor(scene, roomA.centerX, roomB.centerX, roomA.centerY);
                    createVerticalCorridor(scene, roomA.centerY, roomB.centerY, roomB.centerX);
                } else {
                    createVerticalCorridor(scene, roomA.centerY, roomB.centerY, roomA.centerX);
                    createHorizontalCorridor(scene, roomA.centerX, roomB.centerX, roomB.centerY);
                }
            }
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
            
            // También limpiar un poco arriba y abajo para asegurar pasadizos anchos
            if (y - 1 >= 0) gameState.map[y - 1][x] = 0;
            if (y + 1 < CONFIG.mapHeight) gameState.map[y + 1][x] = 0;
            
            // Dibujar suelo
            drawFloorTile(scene, x, y);
            if (y - 1 >= 0) drawFloorTile(scene, x, y - 1);
            if (y + 1 < CONFIG.mapHeight) drawFloorTile(scene, x, y + 1);
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
            
            // También limpiar un poco a los lados para asegurar pasadizos anchos
            if (x - 1 >= 0) gameState.map[y][x - 1] = 0;
            if (x + 1 < CONFIG.mapWidth) gameState.map[y][x + 1] = 0;
            
            // Dibujar suelo
            drawFloorTile(scene, x, y);
            if (x - 1 >= 0) drawFloorTile(scene, x - 1, y);
            if (x + 1 < CONFIG.mapWidth) drawFloorTile(scene, x + 1, y);
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
 * Verifica si una posición es un suelo válido y no una pared
 */
function isValidFloor(x, y) {
    if (x < 0 || x >= CONFIG.mapWidth || y < 0 || y >= CONFIG.mapHeight) {
        return false;
    }
    return gameState.map[y][x] === 0;
}

/**
 * Encuentra un punto aleatorio en una sala
 */
function getRandomPointInRoom(room) {
    // Usar puntos un poco alejados de los bordes para mayor seguridad
    const x = getRandomInt(room.x + 1, room.x + room.width - 2);
    const y = getRandomInt(room.y + 1, room.y + room.height - 2);
    return { x, y };
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
    
    // Ajustar el tamaño del cuerpo físico para permitir un poco de margen
    wall.body.setSize(CONFIG.tileSize - 2, CONFIG.tileSize - 2);
    
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
        
        // Buscar un punto seguro alejado de las paredes
        let x = lastRoom.centerX;
        let y = lastRoom.centerY;
        
        // Verificar que el punto es válido
        if (!isValidFloor(x, y)) {
            // Buscar un punto alternativo
            const alternativePoint = findSafeLocationInRoom(lastRoom);
            if (alternativePoint) {
                x = alternativePoint.x;
                y = alternativePoint.y;
            }
        }
        
        // Convertir a coordenadas en píxeles
        const stairsX = x * CONFIG.tileSize + (CONFIG.tileSize / 2);
        const stairsY = y * CONFIG.tileSize + (CONFIG.tileSize / 2);
        
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
        gameState.stairs = scene.physics.add.sprite(stairsX, stairsY, 'stairs_texture');
        gameState.stairs.setScale(0.8);
        gameState.stairs.depth = 1;
        
        // Añadir animación a las escaleras
        scene.tweens.add({
            targets: gameState.stairs,
            angle: 360,
            duration: 10000,
            repeat: -1
        });
        
        console.log(`Escaleras colocadas en: X=${stairsX}, Y=${stairsY}`);
    }
}

/**
 * Encuentra una ubicación segura dentro de una sala
 */
function findSafeLocationInRoom(room) {
    // Primero intentar con el centro
    if (isValidFloor(room.centerX, room.centerY)) {
        return { x: room.centerX, y: room.centerY };
    }
    
    // Si el centro no es válido, buscar en toda la sala
    for (let y = room.y + 1; y < room.y + room.height - 1; y++) {
        for (let x = room.x + 1; x < room.x + room.width - 1; x++) {
            if (isValidFloor(x, y)) {
                return { x, y };
            }
        }
    }
    
    // Si no se encuentra ningún punto válido, devolver null
    return null;
}