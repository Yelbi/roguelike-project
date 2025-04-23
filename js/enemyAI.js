/**
 * Actualiza la lógica de los enemigos
 */
function updateEnemies(scene, player) {
    const currentTime = scene.time.now;
    
    for (const enemy of gameState.enemies) {
        // Mover enemigo cada cierto tiempo
        if (currentTime - enemy.lastMove > 1000 + getRandomInt(-200, 200)) {
            // Asegurarnos de que el sprite existe
            if (!enemy.sprite || !enemy.sprite.active) continue;
            
            const distance = Phaser.Math.Distance.Between(
                enemy.sprite.x, enemy.sprite.y,
                player.x, player.y
            );
            
            // Si el jugador está cerca, perseguirlo
            if (distance < 250) {
                // Calcular dirección hacia el jugador
                const angle = Phaser.Math.Angle.Between(
                    enemy.sprite.x, enemy.sprite.y,
                    player.x, player.y
                );
                
                const speed = 40 + (enemy.level * 2);
                
                const velocityX = Math.cos(angle) * speed;
                const velocityY = Math.sin(angle) * speed;
                
                enemy.sprite.setVelocity(velocityX, velocityY);
            } else {
                // Movimiento aleatorio
                const direction = getRandomInt(0, 3);
                const speed = 40 + (enemy.level * 2);
                
                switch (direction) {
                    case 0: // Arriba
                        enemy.sprite.setVelocity(0, -speed);
                        break;
                    case 1: // Derecha
                        enemy.sprite.setVelocity(speed, 0);
                        break;
                    case 2: // Abajo
                        enemy.sprite.setVelocity(0, speed);
                        break;
                    case 3: // Izquierda
                        enemy.sprite.setVelocity(-speed, 0);
                        break;
                }
            }
            
            // Actualizar tiempo de último movimiento
            enemy.lastMove = currentTime;
            
            // Detener después de un tiempo
            scene.time.delayedCall(500, () => {
                if (enemy.sprite && enemy.sprite.active) {
                    enemy.sprite.setVelocity(0, 0);
                }
            });
        }
        
        // Comprobar colisión con el jugador
        if (enemy.sprite && enemy.sprite.active && player.active && 
            Phaser.Geom.Rectangle.Overlaps(enemy.sprite.getBounds(), player.getBounds())) {
            
            // Solo atacar una vez cada segundo
            if (currentTime - enemy.lastAttack > 1000 || !enemy.lastAttack) {
                enemyAttack(scene, enemy, player);
                enemy.lastAttack = currentTime;
            }
        }
    }
}

/**
 * Comprueba interacción con espacio (atacar o interactuar)
 */
function checkInteraction(scene, player) {
    // Buscar enemigos cercanos
    const nearbyEnemies = [];
    
    for (const enemy of gameState.enemies) {
        if (!enemy.sprite || !enemy.sprite.active) continue;
        
        const distance = Phaser.Math.Distance.Between(
            player.x, player.y,
            enemy.sprite.x, enemy.sprite.y
        );
        
        if (distance < 50) {
            nearbyEnemies.push(enemy);
        }
    }
    
    if (nearbyEnemies.length > 0) {
        // Si hay múltiples enemigos, ordenarlos por distancia
        if (nearbyEnemies.length > 1) {
            nearbyEnemies.sort((a, b) => {
                const distA = Phaser.Math.Distance.Between(
                    player.x, player.y, a.sprite.x, a.sprite.y
                );
                const distB = Phaser.Math.Distance.Between(
                    player.x, player.y, b.sprite.x, b.sprite.y
                );
                return distA - distB;
            });
        }
        
        // Atacar al enemigo más cercano
        attackEnemy(scene, nearbyEnemies[0]);
        return true;
    }
    
    return false;
}

/**
 * Ataca a un enemigo
 */
function attackEnemy(scene, enemy) {
    // Calcular daño basado en estadísticas
    const baseDamage = gameState.playerStats.attack;
    const defense = enemy.defense;
    const damage = Math.max(1, baseDamage - defense);
    
    // Probabilidad de golpe crítico
    const critChance = 0.05 + (gameState.playerStats.level * 0.01);
    const isCrit = Math.random() < critChance;
    
    // Calcular daño final
    const finalDamage = isCrit ? Math.floor(damage * 1.5) : damage;
    
    // Reproducir sonido
    scene.sounds.hit();
    
    // Aplicar daño
    enemy.health -= finalDamage;
    
    // Mensaje
    if (isCrit) {
        addMessage(`¡Golpe crítico! Causas ${finalDamage} puntos de daño.`);
    } else {
        addMessage(`Atacas al enemigo y causas ${finalDamage} puntos de daño.`);
    }
    
    // Comprobar si el enemigo ha muerto
    if (enemy.health <= 0) {
        defeatEnemy(scene, enemy);
    }
}

/**
 * Ataca al jugador desde un enemigo
 */
function enemyAttack(scene, enemy, player) {
    // Calcular daño
    const baseDamage = enemy.attack;
    const defense = gameState.playerStats.defense;
    const damage = Math.max(1, baseDamage - defense);
    
    // Reproducir sonido
    scene.sounds.hit();
    
    // Aplicar daño
    gameState.playerStats.health -= damage;
    
    // Mensaje
    const enemyNameDisplay = enemy.name || "Enemigo";
    addMessage(`${enemyNameDisplay} te ataca y causa ${damage} puntos de daño.`);
    
    // Actualizar UI
    updateUI();
    
    // Comprobar si el jugador ha muerto
    if (gameState.playerStats.health <= 0) {
        playerDeath(scene);
    }
}

/**
 * Derrota a un enemigo
 */
function defeatEnemy(scene, enemy) {
    // Reproducir sonido
    scene.sounds.enemyDeath();
    
    // Eliminar enemigo
    if (enemy.sprite) enemy.sprite.destroy();
    gameState.enemies = gameState.enemies.filter(e => e !== enemy);
    
    // Incrementar contador de enemigos derrotados
    gameState.enemiesKilled++;
    
    // Ganar experiencia
    gameState.playerStats.xp += enemy.xpReward;
    
    // Mensaje
    addMessage(`Has derrotado al ${enemy.name} nivel ${enemy.level} y ganas ${enemy.xpReward} puntos de experiencia.`);
    
    // Comprobar subida de nivel
    checkLevelUp();
    
    // Actualizar UI
    updateUI();
    
    // Posibilidad de soltar objeto
    const dropChance = 30 + (enemy.level * 3);
    if (getRandomInt(1, 100) <= dropChance) {
        dropItem(scene, enemy.sprite.x, enemy.sprite.y);
    }
}

/**
 * Coloca enemigos en las salas
 */
function placeEnemies(scene) {
    gameState.enemies = [];
    
    // Destruir grupo anterior si existe
    if (gameState.enemiesGroup) {
        gameState.enemiesGroup.clear(true, true);
    }
    
    // Crear nuevo grupo de enemigos
    gameState.enemiesGroup = scene.physics.add.group();
    
    // Tipos de enemigos disponibles
    const enemyTypes = [
        { name: 'Sombra', color: 0xe74c3c },
        { name: 'Centinela', color: 0xc0392b },
        { name: 'Brujo', color: 0xd35400 },
        { name: 'Asesino', color: 0xe67e22 },
        { name: 'Guardián', color: 0xf39c12 },
        { name: 'Espectro', color: 0x8e44ad }
    ];
    
    // Colocar enemigos en salas aleatorias (excepto la primera)
    for (let i = 1; i < gameState.rooms.length; i++) {
        const room = gameState.rooms[i];
        
        // Más enemigos en niveles más profundos
        const minEnemies = Math.min(1, Math.floor(gameState.dungeonLevel / 2));
        const maxEnemies = Math.min(5, Math.floor(gameState.dungeonLevel * 0.7) + 1);
        const enemyCount = getRandomInt(minEnemies, maxEnemies);
        
        for (let j = 0; j < enemyCount; j++) {
            // Encontrar una posición válida
            const x = getRandomInt(room.x + 1, room.x + room.width - 2);
            const y = getRandomInt(room.y + 1, room.y + room.height - 2);
            
            // Elegir tipo de enemigo basado en nivel de mazmorra
            const availableTypes = Math.min(enemyTypes.length, gameState.dungeonLevel + 1);
            const enemyTypeIndex = getRandomInt(0, availableTypes - 1);
            const enemyType = enemyTypes[enemyTypeIndex];
            
            // Nivel del enemigo
            const enemyLevel = getRandomInt(
                Math.max(1, gameState.dungeonLevel - 1),
                gameState.dungeonLevel + 1
            );
            
            // Posición en píxeles
            const enemyX = x * CONFIG.tileSize + (CONFIG.tileSize / 2);
            const enemyY = y * CONFIG.tileSize + (CONFIG.tileSize / 2);
            
            // Crear enemigo
            createEnemy(scene, enemyX, enemyY, enemyType, enemyTypeIndex, enemyLevel);
        }
    }
    
    // Configurar colisiones
    scene.physics.add.collider(gameState.enemiesGroup, gameState.wallsLayer);
    scene.physics.add.collider(gameState.enemiesGroup, gameState.enemiesGroup);
}

/**
 * Crea un enemigo
 */
function createEnemy(scene, x, y, enemyType, typeIndex, level) {
    // Crear gráfico para el enemigo
    const enemyGraphic = scene.add.graphics({ willReadFrequently: true });
    enemyGraphic.fillStyle(enemyType.color, 1);
    enemyGraphic.fillCircle(0, 0, CONFIG.tileSize * 0.4);
    // Añadir borde negro para mejor visibilidad
    enemyGraphic.lineStyle(2, 0x000000, 1);
    enemyGraphic.strokeCircle(0, 0, CONFIG.tileSize * 0.4);
    
    // Generar textura
    const enemyTextureKey = `enemy_${typeIndex}_lvl_${level}_texture`;
    enemyGraphic.generateTexture(enemyTextureKey, CONFIG.tileSize, CONFIG.tileSize);
    enemyGraphic.destroy();
    
    // Crear sprite
    const enemy = scene.physics.add.sprite(x, y, enemyTextureKey);
    enemy.setDepth(5);
    
    // Agregar al grupo de físicas
    gameState.enemiesGroup.add(enemy);
    
    // Estadísticas
    const enemyBaseHealth = 30 + (level * 12);
    
    const enemyData = {
        sprite: enemy,
        type: typeIndex,
        name: enemyType.name,
        level: level,
        health: enemyBaseHealth,
        maxHealth: enemyBaseHealth,
        attack: 5 + (level * 3) + typeIndex,
        defense: 2 + Math.floor(level / 2) + Math.floor(typeIndex / 2),
        xpReward: 25 + (level * 15) + (typeIndex * 5),
        lastMove: 0,
        lastAttack: 0
    };
    
    gameState.enemies.push(enemyData);
    
    return enemyData;
}