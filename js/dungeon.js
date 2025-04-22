/**
 * Funciones relacionadas con la generación de mazmorras
 */

/**
 * Genera una mazmorra procedural
 */
function generateDungeon(scene) {
    console.log("Iniciando generación de mazmorra...");
    
    // Crear fondo general
    createDungeonBackground(scene);
    
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
    
    // Añadir decoraciones
    addDecorations(scene);
    
    console.log("Mazmorra generada con éxito");
}

/**
 * Crea un fondo para toda la mazmorra
 */
function createDungeonBackground(scene) {
    // Crear un fondo de textura para la mazmorra
    const background = scene.add.graphics();
    
    // Rellenar con color base oscuro
    background.fillStyle(0x16213e, 1);
    background.fillRect(0, 0, CONFIG.mapWidth * CONFIG.tileSize, CONFIG.mapHeight * CONFIG.tileSize);
    
    // Patrón de mosaico sutil
    background.lineStyle(1, 0x1a1a2e, 0.5);
    
    // Dibujar líneas horizontales
    for (let y = 0; y < CONFIG.mapHeight; y += 4) {
        background.beginPath();
        background.moveTo(0, y * CONFIG.tileSize);
        background.lineTo(CONFIG.mapWidth * CONFIG.tileSize, y * CONFIG.tileSize);
        background.strokePath();
    }
    
    // Dibujar líneas verticales
    for (let x = 0; x < CONFIG.mapWidth; x += 4) {
        background.beginPath();
        background.moveTo(x * CONFIG.tileSize, 0);
        background.lineTo(x * CONFIG.tileSize, CONFIG.mapHeight * CONFIG.tileSize);
        background.strokePath();
    }
    
    // Añadir puntos aleatorios para simular estrellas/cristales
    for (let i = 0; i < 200; i++) {
        const x = getRandomInt(0, CONFIG.mapWidth * CONFIG.tileSize);
        const y = getRandomInt(0, CONFIG.mapHeight * CONFIG.tileSize);
        
        if (Math.random() > 0.7) {
            // Puntos más brillantes (10%)
            background.fillStyle(0xffd369, 0.4);
            background.fillCircle(x, y, 1);
        } else {
            // Puntos normales
            background.fillStyle(0xffffff, 0.2);
            background.fillCircle(x, y, 0.5);
        }
    }
    
    // Añadir algunas áreas nebulosas
    for (let i = 0; i < 15; i++) {
        const x = getRandomInt(0, CONFIG.mapWidth * CONFIG.tileSize);
        const y = getRandomInt(0, CONFIG.mapHeight * CONFIG.tileSize);
        const radius = getRandomInt(100, 300);
        
        // Gradiente radial
        const color = Math.random() > 0.5 ? 0x0f3460 : 0xe94560;
        const alpha = Math.random() * 0.05;
        
        background.fillStyle(color, alpha);
        background.fillCircle(x, y, radius);
    }
    
    // Establecer profundidad para estar detrás de todo
    background.setDepth(-10);
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
    
    // Crear capa para decoraciones
    if (gameState.decorationLayer) {
        gameState.decorationLayer.clear(true, true);
    }
    gameState.decorationLayer = scene.physics.add.staticGroup();
}

/**
 * Genera salas aleatorias en la mazmorra
 */
function generateRooms(scene) {
    const roomCount = getRandomInt(6, 12); // Ligero aumento para más variedad
    const minRoomSize = CONFIG.roomMinSize;
    const maxRoomSize = CONFIG.roomMaxSize;
    gameState.rooms = [];
    
    let attempts = 0;
    const maxAttempts = 150; // Más intentos para colocar salas
    
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
            centerY: Math.floor(roomY + roomHeight / 2),
            type: getRandomInt(0, 3) // Tipo de sala para variedad visual
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
                        drawFloorTile(scene, x, y, newRoom.type);
                    }
                }
            }
            
            // Añadir detalles a los bordes de la sala
            addRoomBorders(scene, newRoom);
        }
    }
    
    console.log(`Generadas ${gameState.rooms.length} salas después de ${attempts} intentos`);
}

/**
 * Añade bordes decorativos a las salas
 */
function addRoomBorders(scene, room) {
    // Probabilidad de tener bordes decorativos (70%)
    if (Math.random() > 0.3) {
        const borderGraphic = scene.add.graphics();
        
        // Elegir color de borde según el tipo de sala
        let borderColor;
        switch(room.type) {
            case 0: borderColor = 0xe94560; break; // Rojo
            case 1: borderColor = 0x4f8a8b; break; // Verde-azulado
            case 2: borderColor = 0xffd369; break; // Amarillo
            default: borderColor = 0x9c42f4; break; // Violeta
        }
        
        // Dibujar líneas en los bordes de la sala
        borderGraphic.lineStyle(2, borderColor, 0.4);
        
        // Coordenadas del rectángulo
        const x = room.x * CONFIG.tileSize;
        const y = room.y * CONFIG.tileSize;
        const width = room.width * CONFIG.tileSize;
        const height = room.height * CONFIG.tileSize;
        
        // Dibujar rectángulo
        borderGraphic.strokeRect(x, y, width, height);
        
        // Añadir esquinas más visibles
        borderGraphic.lineStyle(3, borderColor, 0.6);
        
        // Esquina superior izquierda
        borderGraphic.beginPath();
        borderGraphic.moveTo(x, y + 10);
        borderGraphic.lineTo(x, y);
        borderGraphic.lineTo(x + 10, y);
        borderGraphic.strokePath();
        
        // Esquina superior derecha
        borderGraphic.beginPath();
        borderGraphic.moveTo(x + width - 10, y);
        borderGraphic.lineTo(x + width, y);
        borderGraphic.lineTo(x + width, y + 10);
        borderGraphic.strokePath();
        
        // Esquina inferior izquierda
        borderGraphic.beginPath();
        borderGraphic.moveTo(x, y + height - 10);
        borderGraphic.lineTo(x, y + height);
        borderGraphic.lineTo(x + 10, y + height);
        borderGraphic.strokePath();
        
        // Esquina inferior derecha
        borderGraphic.beginPath();
        borderGraphic.moveTo(x + width - 10, y + height);
        borderGraphic.lineTo(x + width, y + height);
        borderGraphic.lineTo(x + width, y + height - 10);
        borderGraphic.strokePath();
        
        borderGraphic.setDepth(1);
    }
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
 * Añade decoraciones al mapa
 */
function addDecorations(scene) {
    // Crear varios tipos de decoraciones
    
    // 1. Añadir charcos de agua/ácido en algunas posiciones aleatorias
    for (let i = 0; i < gameState.rooms.length; i++) {
        const room = gameState.rooms[i];
        
        // Solo en algunas salas (30% de probabilidad)
        if (Math.random() > 0.7) {
            // Número de charcos
            const puddleCount = getRandomInt(1, 3);
            
            for (let j = 0; j < puddleCount; j++) {
                // Posición en la sala (lejos de los bordes)
                const x = getRandomInt(room.x + 2, room.x + room.width - 3);
                const y = getRandomInt(room.y + 2, room.y + room.height - 3);
                
                // Tipo de charco (agua o ácido)
                const puddleType = Math.random() > 0.5 ? 'water' : 'acid';
                
                // Crear gráfico para el charco
                const puddleGraphic = scene.add.graphics();
                
                // Color según tipo
                if (puddleType === 'water') {
                    puddleGraphic.fillStyle(0x4f8a8b, 0.6);
                } else {
                    puddleGraphic.fillStyle(0x9bdc28, 0.6);
                }
                
                // Dibujar forma irregular de charco
                puddleGraphic.beginPath();
                
                // Centro del charco
                const centerX = x * CONFIG.tileSize + CONFIG.tileSize / 2;
                const centerY = y * CONFIG.tileSize + CONFIG.tileSize / 2;
                const radius = CONFIG.tileSize * 1.2;
                
                // Crear forma irregular
                const points = 8;
                const angleStep = (Math.PI * 2) / points;
                
                for (let p = 0; p < points; p++) {
                    const angle = p * angleStep;
                    const radiusVariation = radius * (0.8 + Math.random() * 0.4);
                    const px = centerX + Math.cos(angle) * radiusVariation;
                    const py = centerY + Math.sin(angle) * radiusVariation;
                    
                    if (p === 0) {
                        puddleGraphic.moveTo(px, py);
                    } else {
                        puddleGraphic.lineTo(px, py);
                    }
                }
                
                puddleGraphic.closePath();
                puddleGraphic.fill();
                
                // Añadir brillo
                puddleGraphic.fillStyle(0xffffff, 0.3);
                puddleGraphic.fillCircle(centerX - radius * 0.3, centerY - radius * 0.3, radius * 0.2);
                
                // Establecer profundidad para que esté sobre el suelo pero debajo de todo lo demás
                puddleGraphic.setDepth(1);
                
                // Añadir animación de ondulación
                scene.tweens.add({
                    targets: puddleGraphic,
                    alpha: 0.8,
                    duration: 2000 + Math.random() * 1000,
                    yoyo: true,
                    repeat: -1
                });
            }
        }
    }
    
    // 2. Añadir algunos cristales brillantes en las paredes
    for (let i = 0; i < 25; i++) {
        // Buscar una ubicación válida (pared)
        let x, y;
        let validPosition = false;
        let attempts = 0;
        
        while (!validPosition && attempts < 50) {
            attempts++;
            x = getRandomInt(1, CONFIG.mapWidth - 2);
            y = getRandomInt(1, CONFIG.mapHeight - 2);
            
            // Comprobar si es una pared con espacio libre adyacente
            if (isWall(x, y) && hasAdjacentFloor(x, y)) {
                validPosition = true;
            }
        }
        
        if (validPosition) {
            // Crear cristal brillante
            const crystalGraphic = scene.add.graphics();
            
            // Color aleatorio para el cristal
            const crystalColors = [0xe94560, 0x4f8a8b, 0xffd369, 0x9c42f4];
            const color = crystalColors[getRandomInt(0, crystalColors.length - 1)];
            
            // Posición en píxeles
            const crystalX = x * CONFIG.tileSize + CONFIG.tileSize / 2;
            const crystalY = y * CONFIG.tileSize + CONFIG.tileSize / 2;
            
            // Tamaño aleatorio
            const crystalSize = CONFIG.tileSize * (0.3 + Math.random() * 0.3);
            
            // Dibujar el cristal (forma de diamante)
            crystalGraphic.fillStyle(color, 0.8);
            
            // Forma de cristal
            crystalGraphic.beginPath();
            crystalGraphic.moveTo(crystalX, crystalY - crystalSize);
            crystalGraphic.lineTo(crystalX + crystalSize * 0.7, crystalY);
            crystalGraphic.lineTo(crystalX, crystalY + crystalSize);
            crystalGraphic.lineTo(crystalX - crystalSize * 0.7, crystalY);
            crystalGraphic.closePath();
            crystalGraphic.fill();
            
            // Brillo
            crystalGraphic.fillStyle(0xffffff, 0.7);
            crystalGraphic.fillCircle(crystalX - crystalSize * 0.2, crystalY - crystalSize * 0.2, crystalSize * 0.15);
            
            // Establecer profundidad
            crystalGraphic.setDepth(5);
            
            // Animación de brillo
            scene.tweens.add({
                targets: crystalGraphic,
                alpha: { from: 0.7, to: 1 },
                duration: 1500 + Math.random() * 1000,
                yoyo: true,
                repeat: -1
            });
        }
    }
}

/**
 * Comprueba si hay suelo adyacente a una posición
 */
function hasAdjacentFloor(x, y) {
    const directions = [
        { x: 0, y: -1 }, // Norte
        { x: 1, y: 0 },  // Este
        { x: 0, y: 1 },  // Sur
        { x: -1, y: 0 }  // Oeste
    ];
    
    for (const dir of directions) {
        const checkX = x + dir.x;
        const checkY = y + dir.y;
        
        if (checkX >= 0 && checkX < CONFIG.mapWidth && 
            checkY >= 0 && checkY < CONFIG.mapHeight && 
            gameState.map[checkY][checkX] === 0) {
            return true;
        }
    }
    
    return false;
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
                        drawFloorTile(scene, x, y, firstRoom.type);
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
                    drawFloorTile(scene, x, y, firstRoom.type);
                }
            }
        }
        
        // Añadir un indicador visual al punto de inicio
        const startX = firstRoom.centerX * CONFIG.tileSize + CONFIG.tileSize / 2;
        const startY = firstRoom.centerY * CONFIG.tileSize + CONFIG.tileSize / 2;
        
        // Círculo de energía en el punto de inicio
        const startPortal = scene.add.graphics();
        
        // Círculo exterior
        startPortal.lineStyle(3, 0xffd369, 0.8);
        startPortal.strokeCircle(startX, startY, CONFIG.tileSize * 0.8);
        
        // Círculo interior
        startPortal.lineStyle(2, 0xe94560, 0.6);
        startPortal.strokeCircle(startX, startY, CONFIG.tileSize * 0.5);
        
        // Destellos
        for (let i = 0; i < 4; i++) {
            const angle = (Math.PI / 2) * i;
            const rayLength = CONFIG.tileSize * 0.4;
            const rayX = startX + Math.cos(angle) * rayLength;
            const rayY = startY + Math.sin(angle) * rayLength;
            
            startPortal.lineStyle(2, 0xffffff, 0.7);
            startPortal.beginPath();
            startPortal.moveTo(startX, startY);
            startPortal.lineTo(rayX, rayY);
            startPortal.strokePath();
        }
        
        startPortal.setDepth(1);
        
        // Animación de rotación
        scene.tweens.add({
            targets: startPortal,
            angle: 360,
            duration: 10000,
            repeat: -1
        });
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
        centerY: roomY + Math.floor(roomHeight / 2),
        type: 0 // Tipo básico
    };
    
    gameState.rooms = [testRoom];
    
    // Excavar la sala en el mapa
    for (let y = testRoom.y; y < testRoom.y + testRoom.height; y++) {
        for (let x = testRoom.x; x < testRoom.x + testRoom.width; x++) {
            if (y >= 0 && y < CONFIG.mapHeight && x >= 0 && x < CONFIG.mapWidth) {
                gameState.map[y][x] = 0; // 0 = suelo
                drawFloorTile(scene, x, y, testRoom.type);
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
            
            // Dibujar suelo (usar el tipo 0 por defecto)
            drawFloorTile(scene, x, y, 0);
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
            
            // Dibujar suelo (usar el tipo 0 por defecto)
            drawFloorTile(scene, x, y, 0);
        }
    }
}

/**
 * Dibuja una baldosa de suelo en la posición dada
 */
function drawFloorTile(scene, x, y, type) {
    // Esta función podría faltar en el código, definirla si no existe
    if (!window.drawFloorTile) {
        window.drawFloorTile = function(scene, x, y, type) {
            // Crear gráfico para el suelo
            const floorGraphic = scene.add.graphics();
            
            // Determinar color según tipo de sala
            const floorColors = [0x222831, 0x1a1a2e, 0x0f3460, 0x16213e];
            const floorColor = floorColors[type % floorColors.length];
            
            // Dibujar cuadrado
            floorGraphic.fillStyle(floorColor, 1);
            floorGraphic.fillRect(
                x * CONFIG.tileSize, 
                y * CONFIG.tileSize, 
                CONFIG.tileSize, 
                CONFIG.tileSize
            );
            
            // Añadir un poco de variación visual con líneas tenues
            floorGraphic.lineStyle(1, 0x000000, 0.1);
            floorGraphic.strokeRect(
                x * CONFIG.tileSize + 0.5, 
                y * CONFIG.tileSize + 0.5, 
                CONFIG.tileSize - 1, 
                CONFIG.tileSize - 1
            );
            
            floorGraphic.setDepth(0);
        };
    }
    
    // Llamar a la función (ya sea la existente o la que acabamos de definir)
    window.drawFloorTile(scene, x, y, type);
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