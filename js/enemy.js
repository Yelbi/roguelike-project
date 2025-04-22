/**
 * Funciones relacionadas con los enemigos del juego
 */

/**
 * Coloca enemigos en las salas de la mazmorra
 */
function placeEnemies(scene) {
    gameState.enemies = [];
    
    // Destruir grupo anterior si existe
    if (gameState.enemiesGroup) {
        gameState.enemiesGroup.clear(true, true);
    }
    
    // Crear nuevo grupo de enemigos
    gameState.enemiesGroup = scene.physics.add.group();
    
    // Colocar enemigos en salas aleatorias (excepto la primera)
    for (let i = 1; i < gameState.rooms.length; i++) {
        const room = gameState.rooms[i];
        const enemyCount = getRandomInt(1, Math.min(5, gameState.dungeonLevel));
        
        for (let j = 0; j < enemyCount; j++) {
            const x = getRandomInt(room.x + 1, room.x + room.width - 2);
            const y = getRandomInt(room.y + 1, room.y + room.height - 2);
            
            // Elegir tipo de enemigo basado en nivel de mazmorra
            const enemyType = getRandomInt(0, Math.min(5, gameState.dungeonLevel - 1));
            const enemyLevel = getRandomInt(
                Math.max(1, gameState.dungeonLevel - 2),
                gameState.dungeonLevel + 1
            );
            
            // Posición en píxeles
            const enemyX = x * CONFIG.tileSize + (CONFIG.tileSize / 2);
            const enemyY = y * CONFIG.tileSize + (CONFIG.tileSize / 2);
            
            // Usar gráficos para crear una textura para el enemigo
            const enemyGraphic = scene.add.graphics();
            
            // Colores según tipo de enemigo
            const colors = [0xe74c3c, 0xc0392b, 0xd35400, 0xe67e22, 0xf39c12, 0x8e44ad];
            const color = colors[enemyType % colors.length];
            
            enemyGraphic.fillStyle(color, 1);
            
            // Forma según tipo
            if (enemyType % 3 === 0) {
                // Triángulo
                enemyGraphic.beginPath();
                enemyGraphic.moveTo(0, -CONFIG.tileSize/2);
                enemyGraphic.lineTo(-CONFIG.tileSize/2, CONFIG.tileSize/2);
                enemyGraphic.lineTo(CONFIG.tileSize/2, CONFIG.tileSize/2);
                enemyGraphic.closePath();
                enemyGraphic.fillPath();
            } else if (enemyType % 3 === 1) {
                // Cuadrado
                enemyGraphic.fillRect(-CONFIG.tileSize/2, -CONFIG.tileSize/2, CONFIG.tileSize, CONFIG.tileSize);
            } else {
                // Hexágono
                enemyGraphic.beginPath();
                for (let i = 0; i < 6; i++) {
                    const angle = (Math.PI / 3) * i;
                    const px = Math.sin(angle) * (CONFIG.tileSize/2);
                    const py = Math.cos(angle) * (CONFIG.tileSize/2);
                    if (i === 0) {
                        enemyGraphic.moveTo(px, py);
                    } else {
                        enemyGraphic.lineTo(px, py);
                    }
                }
                enemyGraphic.closePath();
                enemyGraphic.fillPath();
            }
            
            // Crear una textura para el enemigo
            const enemyTextureKey = `enemy_${enemyType}_texture`;
            
            if (!scene.textures.exists(enemyTextureKey)) {
                enemyGraphic.generateTexture(enemyTextureKey, CONFIG.tileSize * 2, CONFIG.tileSize * 2);
            }
            
            enemyGraphic.destroy();
            
            // Crear sprite con físicas
            const enemy = scene.physics.add.sprite(enemyX, enemyY, enemyTextureKey);
            enemy.setScale(0.8);
            enemy.depth = 5;
            
            // Agregar al grupo de físicas
            gameState.enemiesGroup.add(enemy);
            
            // Añadir datos del enemigo
            const enemyData = {
                sprite: enemy,
                type: enemyType,
                level: enemyLevel,
                health: 30 + (enemyLevel * 10),
                maxHealth: 30 + (enemyLevel * 10),
                attack: 5 + (enemyLevel * 3),
                defense: 2 + Math.floor(enemyLevel / 2),
                xpReward: 25 + (enemyLevel * 15),
                moveTimer: 0,
                lastMove: 0,
                lastAttack: 0
            };
            
            // Crear barra de salud
            enemyData.healthBar = scene.add.graphics();
            enemyData.healthBar.depth = 20;
            
            // Actualizar barra de salud
            updateEnemyHealthBar(enemyData);
            
            gameState.enemies.push(enemyData);
        }
    }
    
    // Configurar colisiones
    scene.physics.add.collider(gameState.enemiesGroup, gameState.wallsLayer);
    if (gameState.decorationLayer) {
        scene.physics.add.collider(gameState.enemiesGroup, gameState.decorationLayer);
    }
    scene.physics.add.collider(gameState.enemiesGroup, gameState.enemiesGroup);
}

/**
 * Actualiza la lógica de los enemigos
 */
function updateEnemies(scene, player) {
    const currentTime = scene.time.now;
    
    for (const enemy of gameState.enemies) {
        // Actualizar barra de salud
        updateEnemyHealthBar(enemy);
        
        // Mover enemigo cada cierto tiempo
        if (currentTime - enemy.lastMove > 1000 + getRandomInt(-200, 200)) {
            // Asegurarnos de que el sprite existe
            if (!enemy.sprite || !enemy.sprite.active) continue;
            
            const distance = Phaser.Math.Distance.Between(
                enemy.sprite.x, enemy.sprite.y,
                player.x, player.y
            );
            
            // Si el jugador está cerca, perseguirlo
            if (distance < 200) {
                // Calcular dirección hacia el jugador
                const angle = Phaser.Math.Angle.Between(
                    enemy.sprite.x, enemy.sprite.y,
                    player.x, player.y
                );
                
                const velocityX = Math.cos(angle) * 40;
                const velocityY = Math.sin(angle) * 40;
                
                enemy.sprite.setVelocity(velocityX, velocityY);
            } else {
                // Movimiento aleatorio
                const direction = getRandomInt(0, 3);
                const speed = 40;
                
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
 * Actualiza la barra de salud de un enemigo
 */
function updateEnemyHealthBar(enemy) {
    if (!enemy.healthBar || !enemy.sprite || !enemy.sprite.active) return;
    
    enemy.healthBar.clear();
    
    const width = 30;
    const height = 4;
    const x = enemy.sprite.x - width / 2;
    const y = enemy.sprite.y - 20;
    
    // Fondo de la barra
    enemy.healthBar.fillStyle(0x000000, 0.8);
    enemy.healthBar.fillRect(x, y, width, height);
    
    // Barra de salud
    const healthPercentage = enemy.health / enemy.maxHealth;
    const healthColor = getHealthColor(healthPercentage);
    enemy.healthBar.fillStyle(healthColor, 1);
    enemy.healthBar.fillRect(x, y, width * healthPercentage, height);
}

/**
 * Ataca al jugador desde un enemigo
 */
function enemyAttack(scene, enemy, player) {
    // Calcular daño
    const baseDamage = enemy.attack;
    const defense = gameState.playerStats.defense;
    const damage = Math.max(1, baseDamage - defense);
    
    // Crear animación de ataque (explosión simple)
    const attackGraphic = scene.add.graphics();
    attackGraphic.fillStyle(0xff0000, 0.8);
    attackGraphic.fillCircle(0, 0, 20);
    attackGraphic.fillStyle(0xffff00, 0.8);
    attackGraphic.fillCircle(0, 0, 12);
    attackGraphic.fillStyle(0xffffff, 0.9);
    attackGraphic.fillCircle(0, 0, 5);
    
    // Generar textura para la animación
    const attackTextureKey = 'enemy_attack_texture';
    if (!scene.textures.exists(attackTextureKey)) {
        attackGraphic.generateTexture(attackTextureKey, 40, 40);
    }
    attackGraphic.destroy();
    
    // Crear el sprite de la explosión
    const attackFx = scene.add.sprite(player.x, player.y, attackTextureKey);
    attackFx.setScale(0.5);
    attackFx.depth = 15;
    
    // Animación de la explosión
    scene.tweens.add({
        targets: attackFx,
        scale: 1.2,
        alpha: 0,
        duration: 300,
        onComplete: () => {
            attackFx.destroy();
        }
    });
    
    // Reproducir sonido
    scene.sounds.hit();
    
    // Aplicar daño
    gameState.playerStats.health -= damage;
    
    // Sacudir la cámara
    scene.cameras.main.shake(100, 0.01);
    
    // Mensaje
    addMessage(`El enemigo te ataca y causa ${damage} puntos de daño.`, "combat");
    
    // Actualizar UI
    updateUI();
    
    // Comprobar si el jugador ha muerto
    if (gameState.playerStats.health <= 0) {
        playerDeath(scene);
    }
}

/**
 * Ataca a un enemigo desde el jugador
 */
function attackEnemy(scene, enemy) {
    // Calcular daño basado en estadísticas
    const baseDamage = gameState.playerStats.attack;
    const defense = enemy.defense;
    const damage = Math.max(1, baseDamage - defense);
    
    // Crear animación de ataque (explosión simple)
    const attackGraphic = scene.add.graphics();
    attackGraphic.fillStyle(0x3498db, 0.8);
    attackGraphic.fillCircle(0, 0, 20);
    attackGraphic.fillStyle(0x2980b9, 0.8);
    attackGraphic.fillCircle(0, 0, 12);
    attackGraphic.fillStyle(0xffffff, 0.9);
    attackGraphic.fillCircle(0, 0, 5);
    
    // Generar textura para la animación
    const attackTextureKey = 'player_attack_texture';
    if (!scene.textures.exists(attackTextureKey)) {
        attackGraphic.generateTexture(attackTextureKey, 40, 40);
    }
    attackGraphic.destroy();
    
    // Crear el sprite de la explosión
    const attackFx = scene.add.sprite(enemy.sprite.x, enemy.sprite.y, attackTextureKey);
    attackFx.setScale(0.5);
    attackFx.depth = 15;
    
    // Animación de la explosión
    scene.tweens.add({
        targets: attackFx,
        scale: 1.2,
        alpha: 0,
        duration: 300,
        onComplete: () => {
            attackFx.destroy();
        }
    });
    
    // Reproducir sonido
    scene.sounds.hit();
    
    // Aplicar daño
    enemy.health -= damage;
    
    // Sacudir al enemigo
    scene.tweens.add({
        targets: enemy.sprite,
        x: enemy.sprite.x + getRandomInt(-5, 5),
        y: enemy.sprite.y + getRandomInt(-5, 5),
        duration: 50,
        yoyo: true,
        repeat: 3
    });
    
    // Mensaje
    addMessage(`Atacas al enemigo y causas ${damage} puntos de daño.`, "combat");
    
    // Comprobar si el enemigo ha muerto
    if (enemy.health <= 0) {
        defeatEnemy(scene, enemy);
    }
}

/**
 * Derrota a un enemigo
 */
function defeatEnemy(scene, enemy) {
    // Reproducir sonido
    scene.sounds.enemyDeath();
    
    // Efecto de explosión
    const explosionGraphic = scene.add.graphics();
    explosionGraphic.fillStyle(0xff0000, 0.7);
    explosionGraphic.fillCircle(0, 0, 30);
    explosionGraphic.fillStyle(0xffff00, 0.8);
    explosionGraphic.fillCircle(0, 0, 20);
    explosionGraphic.fillStyle(0xffffff, 0.9);
    explosionGraphic.fillCircle(0, 0, 10);
    
    // Generar textura para la explosión
    const explosionTextureKey = 'enemy_death_texture';
    if (!scene.textures.exists(explosionTextureKey)) {
        explosionGraphic.generateTexture(explosionTextureKey, 60, 60);
    }
    explosionGraphic.destroy();
    
    // Crear el sprite de la explosión
    const explosion = scene.add.sprite(enemy.sprite.x, enemy.sprite.y, explosionTextureKey);
    explosion.setScale(0.5);
    explosion.depth = 15;
    
    // Animación de la explosión
    scene.tweens.add({
        targets: explosion,
        scale: 2,
        alpha: 0,
        duration: 500,
        onComplete: () => {
            explosion.destroy();
        }
    });
    
    // Eliminar enemigo
    if (enemy.healthBar) enemy.healthBar.destroy();
    if (enemy.sprite) enemy.sprite.destroy();
    gameState.enemies = gameState.enemies.filter(e => e !== enemy);
    
    // Incrementar contador de enemigos derrotados
    gameState.enemiesKilled++;
    
    // Ganar experiencia
    const xpGained = enemy.xpReward;
    gameState.playerStats.xp += xpGained;
    
    // Mensaje
    addMessage(`Has derrotado al enemigo y ganas ${xpGained} puntos de experiencia.`, "combat");
    
    // Comprobar subida de nivel
    checkLevelUp();
    
    // Actualizar UI
    updateUI();
    
    // Posibilidad de soltar objeto
    if (getRandomInt(1, 100) <= 30) { // 30% de probabilidad
        dropItem(scene, enemy.sprite.x, enemy.sprite.y);
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
        
        if (distance < 40) {
            nearbyEnemies.push(enemy);
        }
    }
    
    if (nearbyEnemies.length > 0) {
        // Atacar al enemigo más cercano
        const closestEnemy = nearbyEnemies.reduce((closest, current) => {
            const distanceToClosest = Phaser.Math.Distance.Between(
                player.x, player.y,
                closest.sprite.x, closest.sprite.y
            );
            
            const distanceToCurrent = Phaser.Math.Distance.Between(
                player.x, player.y,
                current.sprite.x, current.sprite.y
            );
            
            return distanceToCurrent < distanceToClosest ? current : closest;
        });
        
        attackEnemy(scene, closestEnemy);
        return true;
    }
    
    return false;
}