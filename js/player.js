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
    
    // Crear gráfico para el jugador
    const playerGraphic = scene.add.graphics({ willReadFrequently: true });
    playerGraphic.fillStyle(0x3498db, 1); // Azul
    playerGraphic.fillCircle(0, 0, CONFIG.tileSize * 0.4);
    playerGraphic.fillStyle(0xffffff, 0.5); // Borde blanco para mejor visibilidad
    playerGraphic.lineStyle(2, 0xffffff, 1);
    playerGraphic.strokeCircle(0, 0, CONFIG.tileSize * 0.4);
    
    // Generar textura
    playerGraphic.generateTexture('player_texture', CONFIG.tileSize, CONFIG.tileSize);
    playerGraphic.destroy();
    
    // Crear sprite con físicas
    const player = scene.physics.add.sprite(playerX, playerY, 'player_texture');
    player.setDepth(20);
    player.setCollideWorldBounds(true);
    
    // Configurar la cámara para seguir al jugador
    scene.cameras.main.setBounds(0, 0, 
        CONFIG.mapWidth * CONFIG.tileSize, 
        CONFIG.mapHeight * CONFIG.tileSize);
    scene.cameras.main.startFollow(player, true, 0.08, 0.08);
    
    return player;
}

/**
 * Maneja el movimiento del jugador
 */
function handlePlayerMovement(scene, player, cursors, wasd) {
    if (gameState.isPaused) return;
    
    const speed = 160;
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
        player.body.velocity.normalize().scale(speed);
    }
}

/**
 * Muerte del jugador
 */
function playerDeath(scene) {
    // Reproducir sonido
    scene.sounds.playerDeath();
    
    // Mensaje
    addMessage("¡Has muerto! Pulsa el botón para intentarlo de nuevo.");
    
    // Mostrar pantalla de Game Over
    showGameOver();
}