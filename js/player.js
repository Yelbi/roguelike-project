/**
 * Funciones relacionadas con el jugador
 */

/**
 * Crea y configura al jugador
 */
function createPlayer(scene) {
    // Colocar al jugador en la primera sala
    const startRoom = gameState.rooms[0];
    const playerX = startRoom.centerX * CONFIG.tileSize + (CONFIG.tileSize / 2);
    const playerY = startRoom.centerY * CONFIG.tileSize + (CONFIG.tileSize / 2);
    
    // Crear gráfico personalizado para el jugador en lugar de usar sprites externos
    const playerGraphic = scene.add.graphics();
    SPRITES.player.render(playerGraphic, 0, 0, CONFIG.tileSize * 0.8);
    
    // Crear sprite del jugador con físicas
    const player = scene.physics.add.existing(
        scene.add.sprite(playerX, playerY, '__DEFAULT')
    );
    player.setTexture(playerGraphic.generateTexture());
    playerGraphic.destroy();
    
    player.setScale(1);
    player.setDepth(10);
    player.setCollideWorldBounds(true);
    
    // Configurar la cámara para seguir al jugador
    scene.cameras.main.setBounds(0, 0, 
        CONFIG.mapWidth * CONFIG.tileSize, 
        CONFIG.mapHeight * CONFIG.tileSize);
    scene.cameras.main.startFollow(player, true, 0.08, 0.08);
    scene.cameras.main.setZoom(1);
    
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
}

/**
 * Muerte del jugador
 */
function playerDeath(scene) {
    // Sonido de muerte
    if (scene.sound.sounds) {
        const deathSound = scene.sound.sounds.find(s => s.key === 'player_death');
        if (deathSound) deathSound.play();
    }
    
    // Efecto de explosión
    const explosion = scene.add.sprite(scene.player.x, scene.player.y, '__DEFAULT');
    
    // Crear gráfico de explosión
    const explosionGraphic = scene.add.graphics();
    explosionGraphic.fillStyle(0x3498db, 0.7);
    explosionGraphic.fillCircle(0, 0, 40);
    explosionGraphic.fillStyle(0x2980b9, 0.8);
    explosionGraphic.fillCircle(0, 0, 25);
    explosionGraphic.fillStyle(0xffffff, 0.9);
    explosionGraphic.fillCircle(0, 0, 10);
    
    explosion.setTexture(explosionGraphic.generateTexture());
    explosionGraphic.destroy();
    
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
    
    // Mensaje
    addMessage("¡Has muerto! Pulsa el botón para intentarlo de nuevo.", "combat");
    
    // Game Over
    showGameOver();
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
        
        // Sonido de subida de nivel
        if (window.gameInstance && window.gameInstance.sound.sounds) {
            const levelupSound = window.gameInstance.sound.sounds.find(s => s.key === 'levelup');
            if (levelupSound) levelupSound.play();
        }
        
        // Comprobar si hay que volver a subir de nivel
        checkLevelUp();
    }
}

/**
 * Usar las escaleras para bajar al siguiente nivel
 */
function useStairs(player, stairs) {
    // Sonido de escaleras
    if (window.gameInstance && window.gameInstance.sound.sounds) {
        const stairsSound = window.gameInstance.sound.sounds.find(s => s.key === 'stairs_sound');
        if (stairsSound) stairsSound.play();
    }
    
    // Efecto visual
    if (window.gameInstance) {
        window.gameInstance.cameras.main.flash(500, 255, 255, 255);
    }
    
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
    if (window.gameInstance) {
        window.gameInstance.scene.getScene('GameScene').scene.restart();
    }
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