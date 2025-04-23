/**
 * Coloca objetos en la mazmorra
 */
function placeItems(scene) {
    gameState.items = [];
    
    // Destruir grupo anterior si existe
    if (gameState.itemsGroup) {
        gameState.itemsGroup.clear(true, true);
    }
    
    // Crear nuevo grupo de objetos
    gameState.itemsGroup = scene.physics.add.group();
    
    // Tipos de objetos
    const itemTypes = [
        { name: 'Poción de Salud', color: 0x9bdc28 },
        { name: 'Poción de Fuerza', color: 0xff5555 },
        { name: 'Poción de Defensa', color: 0x4477ff },
        { name: 'Poción de Experiencia', color: 0xdd77ff },
        { name: 'Poción de Vida Máxima', color: 0x55dddd },
        { name: 'Poción Misteriosa', color: 0xff9933 }
    ];
    
    // Colocar objetos en las salas
    for (let i = 0; i < gameState.rooms.length; i++) {
        const room = gameState.rooms[i];
        
        // Decidir si colocar un objeto
        const itemChance = 0.4 + (gameState.dungeonLevel * 0.05);
        const baseCount = i === 0 ? 1 : Math.random() < itemChance ? 1 : 0;
        const itemCount = baseCount;
        
        for (let j = 0; j < itemCount; j++) {
            // Buscar una posición válida
            const x = getRandomInt(room.x + 2, room.x + room.width - 3);
            const y = getRandomInt(room.y + 2, room.y + room.height - 3);
            
            // Decidir tipo de objeto
            let typeIndex;
            const rarityRoll = Math.random();
            
            if (rarityRoll < 0.4) {
                typeIndex = 0; // Salud
            } else if (rarityRoll < 0.7) {
                typeIndex = getRandomInt(1, 2); // Ataque/defensa
            } else if (rarityRoll < 0.9) {
                typeIndex = getRandomInt(3, 4); // Experiencia/vida máxima
            } else {
                typeIndex = 5; // Misterioso
            }
            
            const itemType = itemTypes[typeIndex];
            
            // Nivel del objeto
            const itemLevel = getRandomInt(
                Math.max(1, gameState.dungeonLevel - 1),
                gameState.dungeonLevel + 1
            );
            
            // Posición en píxeles
            const itemX = x * CONFIG.tileSize + (CONFIG.tileSize / 2);
            const itemY = y * CONFIG.tileSize + (CONFIG.tileSize / 2);
            
            // Crear objeto
            createItem(scene, itemX, itemY, itemType, typeIndex, itemLevel);
        }
    }
}

/**
 * Crea un objeto
 */
function createItem(scene, x, y, itemType, typeIndex, level) {
    // Clave de textura para este tipo y nivel de ítem
    const itemTextureKey = `item_${typeIndex}_lvl_${level}_texture`;
    
    // Verificar si la textura ya existe para evitar recrearla
    if (!scene.textures.exists(itemTextureKey)) {
        // Crear gráfico para el objeto
        const itemGraphic = scene.add.graphics({ willReadFrequently: true });
        itemGraphic.fillStyle(itemType.color, 1);
        itemGraphic.fillCircle(0, 0, CONFIG.tileSize * 0.3);
        // Añadir borde blanco para mejor visibilidad
        itemGraphic.lineStyle(2, 0xffffff, 1);
        itemGraphic.strokeCircle(0, 0, CONFIG.tileSize * 0.3);
        
        // Generar textura
        itemGraphic.generateTexture(itemTextureKey, CONFIG.tileSize, CONFIG.tileSize);
        itemGraphic.destroy();
    }
    
    // Crear sprite
    const itemSprite = scene.physics.add.sprite(x, y, itemTextureKey);
    itemSprite.setDepth(2);
    
    // Añadir al grupo de físicas
    gameState.itemsGroup.add(itemSprite);
    
    // Añadir datos del objeto
    const itemData = {
        sprite: itemSprite,
        type: typeIndex,
        level: level,
        name: getItemName(typeIndex, level)
    };
    
    // Añadir animación de flotación
    scene.tweens.add({
        targets: itemSprite,
        y: y - 5,
        duration: 1500,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1
    });
    
    gameState.items.push(itemData);
    
    return itemData;
}

/**
 * Suelta un objeto en la posición dada
 */
function dropItem(scene, x, y) {
    // Decidir tipo de objeto
    const itemType = getRandomInt(0, 5);
    
    // Nivel del objeto
    const bonusChance = Math.random();
    let itemLevel;
    
    if (bonusChance < 0.05) {
        itemLevel = gameState.dungeonLevel + 2;
    } else if (bonusChance < 0.25) {
        itemLevel = gameState.dungeonLevel + 1;
    } else {
        itemLevel = getRandomInt(
            Math.max(1, gameState.dungeonLevel - 1),
            gameState.dungeonLevel
        );
    }
    
    // Tipos de objetos
    const itemTypes = [
        { name: 'Poción de Salud', color: 0x9bdc28 },
        { name: 'Poción de Fuerza', color: 0xff5555 },
        { name: 'Poción de Defensa', color: 0x4477ff },
        { name: 'Poción de Experiencia', color: 0xdd77ff },
        { name: 'Poción de Vida Máxima', color: 0x55dddd },
        { name: 'Poción Misteriosa', color: 0xff9933 }
    ];
    
    // Crear el objeto
    const itemData = createItem(scene, x, y, itemTypes[itemType], itemType, itemLevel);
    
    // Mensaje
    addMessage(`Has encontrado un objeto: ${itemData.name}!`);
}