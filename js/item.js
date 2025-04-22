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
            
            // Usando Graphics para crear sprites personalizados en lugar de depender de assets externos
            const item = scene.add.graphics();
            SPRITES.item.render(item, 0, 0, CONFIG.tileSize * 0.8, itemType);
            
            // Convertir a sprite con físicas
            const itemSprite = scene.physics.add.existing(
                scene.add.sprite(itemX, itemY, '__DEFAULT')
            );
            itemSprite.setScale(0.8);
            itemSprite.depth = 2;
            itemSprite.setTexture(item.generateTexture());
            item.destroy();
            
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
function collectItem(player, itemSprite) {
    const itemIndex = gameState.items.findIndex(item => item.sprite === itemSprite);
    
    if (itemIndex !== -1) {
        const item = gameState.items[itemIndex];
        
        // Reproducir sonido de recogida si está disponible
        if (window.gameInstance && window.gameInstance.sound.sounds) {
            const pickupSound = window.gameInstance.sound.sounds.find(s => s.key === 'pickup');
            if (pickupSound) pickupSound.play();
        }
        
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
        
        // Reproducir sonido de uso si está disponible
        if (window.gameInstance && window.gameInstance.sound.sounds) {
            const pickupSound = window.gameInstance.sound.sounds.find(s => s.key === 'pickup');
            if (pickupSound) pickupSound.play();
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
    const item = scene.add.graphics();
    SPRITES.item.render(item, 0, 0, CONFIG.tileSize * 0.8, itemType);
    
    // Convertir a sprite con físicas
    const itemSprite = scene.physics.add.existing(
        scene.add.sprite(x, y, '__DEFAULT')
    );
    itemSprite.setScale(0.8);
    itemSprite.depth = 2;
    itemSprite.setTexture(item.generateTexture());
    item.destroy();
    
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