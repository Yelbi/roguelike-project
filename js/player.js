/**
 * Funciones relacionadas con el jugador
 */

/**
 * Crea y configura al jugador
 */
function createPlayer(scene) {
    // Encontrar una posición segura para el jugador
    let playerX, playerY;
    
    // Intentar colocar al jugador en la primera sala
    if (gameState.rooms.length > 0) {
        const startRoom = gameState.rooms[0];
        playerX = startRoom.centerX * CONFIG.tileSize + (CONFIG.tileSize / 2);
        playerY = startRoom.centerY * CONFIG.tileSize + (CONFIG.tileSize / 2);
    } else {
        // Si no hay salas, colocar en el centro del mapa
        playerX = (CONFIG.mapWidth / 2) * CONFIG.tileSize;
        playerY = (CONFIG.mapHeight / 2) * CONFIG.tileSize;
    }
    
    console.log(`Jugador colocado en: X=${playerX}, Y=${playerY}`);
    
    // Crear gráfico personalizado para el jugador con un color brillante
    const playerGraphic = scene.add.graphics();
    
    // Dibujar un círculo brillante para el jugador
    playerGraphic.fillStyle(0xff0000, 1); // Rojo brillante
    playerGraphic.fillCircle(0, 0, CONFIG.tileSize * 0.4);
    
    // Añadir un borde para mayor visibilidad
    playerGraphic.lineStyle(2, 0xffff00, 1);
    playerGraphic.strokeCircle(0, 0, CONFIG.tileSize * 0.4);
    
    // Crear textura para el jugador
    const playerTexture = playerGraphic.generateTexture('player_texture', CONFIG.tileSize, CONFIG.tileSize);
    playerGraphic.destroy();
    
    // Crear sprite del jugador con físicas
    const player = scene.physics.add.sprite(playerX, playerY, 'player_texture');
    
    // Configurar el jugador
    player.setScale(0.8);
    player.setDepth(20); // Asegurar que esté por encima de todo
    player.setCollideWorldBounds(true);
    
    // Hacer el cuerpo físico del jugador un poco más pequeño que su sprite visual
    player.body.setSize(CONFIG.tileSize * 0.6, CONFIG.tileSize * 0.6);
    player.body.setOffset(CONFIG.tileSize * 0.2, CONFIG.tileSize * 0.2);
    
    // Configurar la cámara para seguir al jugador
    scene.cameras.main.setBounds(0, 0, 
        CONFIG.mapWidth * CONFIG.tileSize, 
        CONFIG.mapHeight * CONFIG.tileSize);
    scene.cameras.main.startFollow(player, true, 0.1, 0.1);
    
    // Ajustar el zoom para ver más del mapa (menor zoom = ver más)
    scene.cameras.main.setZoom(0.8);
    
    // Forzar una actualización de la cámara inmediatamente
    scene.cameras.main.centerOn(playerX, playerY);
    
    // Agregar efecto de "luz" alrededor del jugador
    const light = scene.add.circle(playerX, playerY, CONFIG.tileSize * 4, 0xffffff, 0.15);
    light.setDepth(5);
    
    // Hacer que la luz siga al jugador
    scene.tweens.add({
        targets: light,
        alpha: 0.25,
        duration: 1000,
        yoyo: true,
        repeat: -1
    });
    
    // Actualizar posición de la luz cuando el jugador se mueve
    player.light = light;
    
    // Añadir un efecto de aparición
    player.setAlpha(0);
    scene.tweens.add({
        targets: player,
        alpha: 1,
        scale: 1,
        duration: 500,
        ease: 'Power2'
    });
    
    return player;
}

/**
 * Maneja el movimiento del jugador
 */
function handlePlayerMovement(scene, player, cursors, wasd) {
    // Si el juego está pausado, no hacer nada
    if (gameState.isPaused) return;
    
    const speed = 150;
    player.setVelocity(0);
    
    // Movimiento horizontal
    if (cursors.left.isDown || wasd.left.isDown) {
        player.setVelocityX(-speed);
    } else if (cursors.right.isDown || wasd.right.isDown) {
        player.setVelocityX(speed);
    }
    
    // Movimiento vertical
    if (cursors.up.isDown || wasd.up.isDown) {
        player.setVelocityY(-speed);
    } else if (cursors.down.isDown || wasd.down.isDown) {
        player.setVelocityY(speed);
    }
    
    // Normalizar la velocidad diagonal
    if ((cursors.left.isDown || wasd.left.isDown || cursors.right.isDown || wasd.right.isDown) &&
        (cursors.up.isDown || wasd.up.isDown || cursors.down.isDown || wasd.down.isDown)) {
        // Reducir la velocidad diagonal
        player.body.velocity.normalize().scale(speed);
    }

    // Actualizar la posición de la luz para que siga al jugador
    if (player.light) {
        player.light.x = player.x;
        player.light.y = player.y;
    }
    
    // Agregar pequeña animación de movimiento
    if (player.body.velocity.x !== 0 || player.body.velocity.y !== 0) {
        if (!player.isMoving) {
            player.isMoving = true;
            scene.tweens.add({
                targets: player,
                scaleX: 0.9,
                scaleY: 0.9,
                duration: 300,
                yoyo: true,
                repeat: -1
            });
        }
    } else if (player.isMoving) {
        player.isMoving = false;
        scene.tweens.killTweensOf(player);
        player.setScale(0.8);
    }
}

/**
 * Muerte del jugador
 */
function playerDeath(scene) {
    // Detener al jugador y eliminar cualquier tween en progreso
    scene.player.body.setVelocity(0, 0);
    scene.tweens.killTweensOf(scene.player);
    
    // Crear efecto de explosión
    const explosion = scene.add.sprite(scene.player.x, scene.player.y, 'player_texture');
    
    // Crear gráfico de explosión
    const explosionGraphic = scene.add.graphics();
    explosionGraphic.fillStyle(0x3498db, 0.7);
    explosionGraphic.fillCircle(0, 0, 40);
    explosionGraphic.fillStyle(0x2980b9, 0.8);
    explosionGraphic.fillCircle(0, 0, 25);
    explosionGraphic.fillStyle(0xffffff, 0.9);
    explosionGraphic.fillCircle(0, 0, 10);
    
    // Crear textura para la explosión
    const explosionTexture = explosionGraphic.generateTexture('explosion_texture', 80, 80);
    explosionGraphic.destroy();
    
    explosion.setTexture('explosion_texture');
    explosion.setScale(0.5);
    explosion.depth = 15;
    
    // Animación de la explosión
    scene.tweens.add({
        targets: explosion,
        scale: 3,
        alpha: 0,
        duration: 1000,
        onComplete: () => {
            explosion.destroy();
        }
    });
    
    // Ocultar al jugador con una animación de desvanecimiento
    scene.tweens.add({
        targets: scene.player,
        alpha: 0,
        scale: 1.5,
        duration: 500
    });
    
    // Sacudir la cámara para dar efecto dramático
    scene.cameras.main.shake(500, 0.03);
    
    // Reproducir sonido (si existe)
    scene.sounds.playerDeath();
    
    // Mensaje
    addMessage("¡Has muerto! Pulsa el botón para intentarlo de nuevo.", "combat");
    
    // Esperar un momento antes de mostrar la pantalla de Game Over
    scene.time.delayedCall(800, () => {
        showGameOver();
    });
}

/**
 * Comprobar subida de nivel
 */
function checkLevelUp() {
    if (gameState.playerStats.xp >= gameState.playerStats.nextLevelXp) {
        gameState.playerStats.level++;
        gameState.playerStats.xp -= gameState.playerStats.nextLevelXp;
        gameState.playerStats.nextLevelXp = Math.floor(gameState.playerStats.nextLevelXp * 1.5);
        
        // Mejorar estadísticas
        gameState.playerStats.maxHealth += 15;
        gameState.playerStats.health = gameState.playerStats.maxHealth;
        gameState.playerStats.attack += 3;
        gameState.playerStats.defense += 2;
        
        // Mensaje
        addMessage(`¡Has subido al nivel ${gameState.playerStats.level}! Tus estadísticas han mejorado.`, "level");
        
        // Reproducir sonido
        if (window.gameInstance && window.gameInstance.scene) {
            const scene = window.gameInstance.scene.scenes.find(s => s.scene.key === 'GameScene');
            if (scene && scene.sounds) {
                scene.sounds.levelup();
            }
        }
        
        // Comprobar si hay que volver a subir de nivel
        checkLevelUp();
    }
}

/**
 * Usar las escaleras para bajar al siguiente nivel
 */
function useStairs(player, stairs) {
    // Obtener referencia a la escena
    const scene = window.gameInstance.scene.scenes.find(s => s.scene.key === 'GameScene');
    
    if (!scene) return;
    
    // Reproducir sonido (si existe)
    scene.sounds.stairs();
    
    // Efecto visual
    scene.cameras.main.flash(500, 255, 255, 255);
    
    // Incrementar nivel de mazmorra
    gameState.dungeonLevel++;
    
    // Mensaje
    addMessage(`Desciendes al nivel ${gameState.dungeonLevel} de la mazmorra.`, "level");
    
    // Recuperar algo de salud
    const healthBonus = getRandomInt(10, 20);
    gameState.playerStats.health = Math.min(
        gameState.playerStats.maxHealth,
        gameState.playerStats.health + healthBonus
    );
    
    addMessage(`Recuperas ${healthBonus} puntos de salud al descansar entre niveles.`, "level");
    
    // Reiniciar la escena para generar nuevo nivel
    scene.scene.restart();
}

/**
 * Actualiza efectos de estado del jugador
 */
function updateStatusEffects(scene) {
    const currentTime = scene.time.now;
    
    // Filtrar efectos caducados
    gameState.playerStats.statusEffects = gameState.playerStats.statusEffects.filter(effect => {
        return effect.endTime > currentTime;
    });
    
    // Actualizar UI
    updateStatusEffectsUI();
}

/**
 * Añade un efecto de estado al jugador
 */
function addStatusEffect(scene, type, duration) {
    const currentTime = scene.time.now;
    const endTime = currentTime + duration;
    
    // Definir el efecto según el tipo
    let effect;
    
    switch (type) {
        case 'poison':
            effect = {
                name: 'Veneno',
                color: '#2ecc71',
                endTime: endTime,
                tickTime: 1000, // Daño cada segundo
                lastTick: currentTime,
                onTick: () => {
                    const damage = Math.ceil(gameState.playerStats.maxHealth * 0.02);
                    gameState.playerStats.health = Math.max(1, gameState.playerStats.health - damage);
                    addMessage(`Sufres ${damage} puntos de daño por veneno.`, "combat");
                    updateUI();
                }
            };
            break;
        case 'strength':
            effect = {
                name: 'Fuerza',
                color: '#e74c3c',
                endTime: endTime,
                onAdd: () => {
                    gameState.playerStats.attack += 10;
                    addMessage('Sientes una oleada de fuerza.', "combat");
                    updateUI();
                },
                onRemove: () => {
                    gameState.playerStats.attack -= 10;
                    addMessage('El efecto de fuerza desaparece.', "combat");
                    updateUI();
                }
            };
            // Aplicar efecto al añadirlo
            if (effect.onAdd) effect.onAdd();
            break;
        case 'defense':
            effect = {
                name: 'Defensa',
                color: '#3498db',
                endTime: endTime,
                onAdd: () => {
                    gameState.playerStats.defense += 5;
                    addMessage('Tu piel se endurece temporalmente.', "combat");
                    updateUI();
                },
                onRemove: () => {
                    gameState.playerStats.defense -= 5;
                    addMessage('El efecto de defensa desaparece.', "combat");
                    updateUI();
                }
            };
            // Aplicar efecto al añadirlo
            if (effect.onAdd) effect.onAdd();
            break;
        case 'regeneration':
            effect = {
                name: 'Regeneración',
                color: '#27ae60',
                endTime: endTime,
                tickTime: 2000, // Curación cada 2 segundos
                lastTick: currentTime,
                onTick: () => {
                    const heal = Math.ceil(gameState.playerStats.maxHealth * 0.03);
                    gameState.playerStats.health = Math.min(
                        gameState.playerStats.maxHealth,
                        gameState.playerStats.health + heal
                    );
                    addMessage(`Te regeneras ${heal} puntos de salud.`, "item");
                    updateUI();
                }
            };
            break;
    }
    
    // Añadir el efecto si existe
    if (effect) {
        // Eliminar efectos del mismo tipo si ya existen
        gameState.playerStats.statusEffects = gameState.playerStats.statusEffects.filter(e => e.name !== effect.name);
        gameState.playerStats.statusEffects.push(effect);
        updateStatusEffectsUI();
    }
}

/**
 * Procesa los efectos de estado activos (daño por tiempo, etc)
 */
function processStatusEffects(scene) {
    const currentTime = scene.time.now;
    
    // Procesar efectos de tick
    for (const effect of gameState.playerStats.statusEffects) {
        if (effect.tickTime && effect.onTick && currentTime - effect.lastTick >= effect.tickTime) {
            effect.onTick();
            effect.lastTick = currentTime;
        }
    }
    
    // Comprobar efectos expirados para aplicar onRemove
    const expiredEffects = gameState.playerStats.statusEffects.filter(effect => 
        effect.endTime <= currentTime && effect.onRemove);
    
    for (const effect of expiredEffects) {
        effect.onRemove();
    }
    
    // Filtrar efectos caducados
    gameState.playerStats.statusEffects = gameState.playerStats.statusEffects.filter(effect => 
        effect.endTime > currentTime);
    
    // Actualizar UI
    updateStatusEffectsUI();
}