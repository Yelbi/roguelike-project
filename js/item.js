/**
 * Funciones relacionadas con los objetos del juego
 */

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
    
    // Colocar objetos en todas las salas
    for (let i = 0; i < gameState.rooms.length; i++) {
        const room = gameState.rooms[i];
        // Más objetos en niveles más profundos, pero no demasiados
        const itemCount = Math.min(getRandomInt(0, 2), Math.floor(gameState.dungeonLevel / 2));
        
        for (let j = 0; j < itemCount; j++) {
            const x = getRandomInt(room.x + 1, room.x + room.width - 2);
            const y = getRandomInt(room.y + 1, room.y + room.height - 2);
            
            // Decidir tipo de objeto
            const itemType = getRandomInt(0, 5);
            const itemLevel = getRandomInt(
                Math.max(1, gameState.dungeonLevel - 1),
                gameState.dungeonLevel + 1
            );
            
            // Crear sprite del objeto
            const itemX = x * CONFIG.tileSize + (CONFIG.tileSize / 2);
            const itemY = y * CONFIG.tileSize + (CONFIG.tileSize / 2);
            
            // Crear gráfico personalizado para el objeto
            const itemGraphic = scene.add.graphics();
            
            // Colores según tipo de objeto
            const colors = [0x2ecc71, 0x3498db, 0xf1c40f, 0x9b59b6, 0x1abc9c, 0xe67e22];
            const color = colors[itemType % colors.length];
            
            // Dibujar el objeto según su tipo
            if (itemType === 0) { // Poción de salud
                // Botella
                itemGraphic.fillStyle(color, 1);
                itemGraphic.beginPath();
                itemGraphic.arc(0, -CONFIG.tileSize/4, CONFIG.tileSize/4, Math.PI, 2 * Math.PI);
                itemGraphic.fillPath();
                itemGraphic.fillRect(-CONFIG.tileSize/4, -CONFIG.tileSize/4, CONFIG.tileSize/2, CONFIG.tileSize/2);
                
                // Líquido
                itemGraphic.fillStyle(0xe74c3c, 1);
                itemGraphic.fillRect(-CONFIG.tileSize/5, -CONFIG.tileSize/6, 2*CONFIG.tileSize/5, CONFIG.tileSize/3);
            } else if (itemType === 1) { // Poción de fuerza
                // Espada
                itemGraphic.fillStyle(color, 1);
                itemGraphic.beginPath();
                itemGraphic.moveTo(0, -CONFIG.tileSize/2);
                itemGraphic.lineTo(0, CONFIG.tileSize/3);
                itemGraphic.lineTo(-CONFIG.tileSize/5, CONFIG.tileSize/2);
                itemGraphic.lineTo(CONFIG.tileSize/5, CONFIG.tileSize/2);
                itemGraphic.lineTo(0, CONFIG.tileSize/3);
                itemGraphic.fillPath();
                
                // Empuñadura
                itemGraphic.fillStyle(0xf39c12, 1);
                itemGraphic.fillRect(-CONFIG.tileSize/4, -CONFIG.tileSize/2, CONFIG.tileSize/2, CONFIG.tileSize/6);
            } else if (itemType === 2) { // Poción de defensa
                // Escudo
                itemGraphic.fillStyle(color, 1);
                itemGraphic.beginPath();
                itemGraphic.moveTo(0, -CONFIG.tileSize/2);
                itemGraphic.lineTo(-CONFIG.tileSize/2, -CONFIG.tileSize/4);
                itemGraphic.lineTo(-CONFIG.tileSize/2, CONFIG.tileSize/4);
                itemGraphic.lineTo(0, CONFIG.tileSize/2);
                itemGraphic.lineTo(CONFIG.tileSize/2, CONFIG.tileSize/4);
                itemGraphic.lineTo(CONFIG.tileSize/2, -CONFIG.tileSize/4);
                itemGraphic.closePath();
                itemGraphic.fillPath();
                
                // Detalles del escudo
                itemGraphic.fillStyle(0x7f8c8d, 1);
                itemGraphic.beginPath();
                itemGraphic.arc(0, 0, CONFIG.tileSize/4, 0, Math.PI * 2);
                itemGraphic.fillPath();
            } else {
                // Objetos genéricos (gemas)
                itemGraphic.fillStyle(color, 1);
                itemGraphic.beginPath();
                itemGraphic.moveTo(0, -CONFIG.tileSize/2);
                itemGraphic.lineTo(-CONFIG.tileSize/2, 0);
                itemGraphic.lineTo(0, CONFIG.tileSize/2);
                itemGraphic.lineTo(CONFIG.tileSize/2, 0);
                itemGraphic.closePath();
                itemGraphic.fillPath();
                
                // Brillo
                itemGraphic.fillStyle(0xffffff, 1);
                itemGraphic.beginPath();
                itemGraphic.arc(-CONFIG.tileSize/6, -CONFIG.tileSize/6, CONFIG.tileSize/8, 0, Math.PI * 2);
                itemGraphic.fillPath();
            }
            
            // Crear textura para el objeto
            const itemTextureKey = `item_${itemType}_texture`;
            if (!scene.textures.exists(itemTextureKey)) {
                itemGraphic.generateTexture(itemTextureKey, CONFIG.tileSize, CONFIG.tileSize);
            }
            itemGraphic.destroy();
            
            // Crear sprite con físicas
            const itemSprite = scene.physics.add.sprite(itemX, itemY, itemTextureKey);
            itemSprite.setScale(0.8);
            itemSprite.depth = 2;
            
            // Añadir al grupo de físicas
            gameState.itemsGroup.add(itemSprite);
            
            // Añadir datos del objeto
            const itemData = {
                sprite: itemSprite,
                type: itemType,
                level: itemLevel,
                name: getItemName(itemType, itemLevel)
            };
            
            // Añadir animación de flotación
            scene.tweens.add({
                targets: itemSprite,
                y: itemY - 5,
                duration: 1500,
                ease: 'Sine.easeInOut',
                yoyo: true,
                repeat: -1
            });
            
            gameState.items.push(itemData);
        }
    }
}

/**
 * Recoge un objeto al colisionar con él
 */
function collectItem(scene, player, itemSprite) {
    const itemIndex = gameState.items.findIndex(item => item.sprite === itemSprite);
    
    if (itemIndex !== -1) {
        const item = gameState.items[itemIndex];
        
        // Reproducir sonido de recogida
        scene.sounds.pickup();
        
        // Añadir al inventario
        gameState.inventory.push({
            type: item.type,
            level: item.level,
            name: item.name
        });
        
        // Mensaje
        addMessage(`Has recogido: ${item.name}.`, "item");
        
        // Eliminar objeto del mundo
        item.sprite.destroy();
        gameState.items.splice(itemIndex, 1);
        
        // Actualizar inventario
        updateInventoryUI();
    }
}

/**
 * Usar objeto del inventario
 */
function useItem(index) {
    const item = gameState.inventory[index];
    
    if (item) {
        switch (item.type) {
            case 0: // Poción de salud
                const healAmount = 20 + (item.level * 10);
                gameState.playerStats.health = Math.min(
                    gameState.playerStats.maxHealth,
                    gameState.playerStats.health + healAmount
                );
                addMessage(`Usas ${item.name} y recuperas ${healAmount} puntos de salud.`, "item");
                break;
            case 1: // Poción de fuerza
                const attackBonus = 5 + (item.level * 2);
                gameState.playerStats.attack += attackBonus;
                addMessage(`Usas ${item.name} y ganas ${attackBonus} puntos de ataque permanentes.`, "item");
                break;
            case 2: // Poción de defensa
                const defenseBonus = 3 + item.level;
                gameState.playerStats.defense += defenseBonus;
                addMessage(`Usas ${item.name} y ganas ${defenseBonus} puntos de defensa permanentes.`, "item");
                break;
            case 3: // Poción de experiencia
                const xpBonus = 50 + (item.level * 25);
                gameState.playerStats.xp += xpBonus;
                addMessage(`Usas ${item.name} y ganas ${xpBonus} puntos de experiencia.`, "item");
                checkLevelUp();
                break;
            case 4: // Poción de vida máxima
                const maxHealthBonus = 10 + (item.level * 5);
                gameState.playerStats.maxHealth += maxHealthBonus;
                gameState.playerStats.health += maxHealthBonus;
                addMessage(`Usas ${item.name} y tu salud máxima aumenta en ${maxHealthBonus} puntos.`, "item");
                break;
            case 5: // Poción de veneno (daña al usarla, pero da experiencia)
                const poisonDamage = 10 + (item.level * 3);
                const poisonXp = 100 + (item.level * 50);
                gameState.playerStats.health = Math.max(1, gameState.playerStats.health - poisonDamage);
                gameState.playerStats.xp += poisonXp;
                addMessage(`¡${item.name} era venenosa! Pierdes ${poisonDamage} de salud pero ganas ${poisonXp} de experiencia.`, "combat");
                checkLevelUp();
                break;
        }
        
        // Reproducir sonido
        if (window.gameInstance && window.gameInstance.scene) {
            const scene = window.gameInstance.scene.scenes.find(s => s.scene.key === 'GameScene');
            if (scene && scene.sounds) {
                scene.sounds.pickup();
            }
        }
        
        // Eliminar el objeto del inventario
        gameState.inventory.splice(index, 1);
        
        // Actualizar UI
        updateUI();
        updateInventoryUI();
    }
}

/**
 * Suelta un objeto en la posición dada
 */
function dropItem(scene, x, y) {
    // Decidir tipo de objeto
    const itemType = getRandomInt(0, 5);
    const itemLevel = getRandomInt(
        Math.max(1, gameState.dungeonLevel - 1),
        gameState.dungeonLevel + 1
    );
    
    // Crear gráfico personalizado para el objeto
    const itemGraphic = scene.add.graphics();
    
    // Colores según tipo de objeto
    const colors = [0x2ecc71, 0x3498db, 0xf1c40f, 0x9b59b6, 0x1abc9c, 0xe67e22];
    const color = colors[itemType % colors.length];
    
    // Dibujar el objeto según su tipo
    if (itemType === 0) { // Poción de salud
        // Botella
        itemGraphic.fillStyle(color, 1);
        itemGraphic.beginPath();
        itemGraphic.arc(0, -CONFIG.tileSize/4, CONFIG.tileSize/4, Math.PI, 2 * Math.PI);
        itemGraphic.fillPath();
        itemGraphic.fillRect(-CONFIG.tileSize/4, -CONFIG.tileSize/4, CONFIG.tileSize/2, CONFIG.tileSize/2);
        
        // Líquido
        itemGraphic.fillStyle(0xe74c3c, 1);
        itemGraphic.fillRect(-CONFIG.tileSize/5, -CONFIG.tileSize/6, 2*CONFIG.tileSize/5, CONFIG.tileSize/3);
    } else {
        // Objetos genéricos (gemas)
        itemGraphic.fillStyle(color, 1);
        itemGraphic.beginPath();
        itemGraphic.moveTo(0, -CONFIG.tileSize/2);
        itemGraphic.lineTo(-CONFIG.tileSize/2, 0);
        itemGraphic.lineTo(0, CONFIG.tileSize/2);
        itemGraphic.lineTo(CONFIG.tileSize/2, 0);
        itemGraphic.closePath();
        itemGraphic.fillPath();
        
        // Brillo
        itemGraphic.fillStyle(0xffffff, 1);
        itemGraphic.beginPath();
        itemGraphic.arc(-CONFIG.tileSize/6, -CONFIG.tileSize/6, CONFIG.tileSize/8, 0, Math.PI * 2);
        itemGraphic.fillPath();
    }
    
    // Crear textura para el objeto
    const itemTextureKey = `item_${itemType}_texture`;
    if (!scene.textures.exists(itemTextureKey)) {
        itemGraphic.generateTexture(itemTextureKey, CONFIG.tileSize, CONFIG.tileSize);
    }
    itemGraphic.destroy();
    
    // Crear sprite con físicas
    const itemSprite = scene.physics.add.sprite(x, y, itemTextureKey);
    itemSprite.setScale(0.8);
    itemSprite.depth = 2;
    
    // Añadir al grupo de físicas
    gameState.itemsGroup.add(itemSprite);
    
    // Añadir datos del objeto
    const itemData = {
        sprite: itemSprite,
        type: itemType,
        level: itemLevel,
        name: getItemName(itemType, itemLevel)
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
    
    // Mensaje
    addMessage(`Has encontrado un objeto: ${itemData.name}.`, "item");
    
        return itemData;
    }