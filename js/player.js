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
    
    // Crear gráfico personalizado para el jugador con un diseño mejorado
    const playerGraphic = scene.add.graphics();
    
    // Base del personaje (círculo)
    playerGraphic.fillStyle(0xe94560, 1); // Color primario
    playerGraphic.fillCircle(0, 0, CONFIG.tileSize * 0.4);
    
    // Detalles del personaje
    playerGraphic.fillStyle(0xffd369, 1); // Color de detalle
    playerGraphic.fillCircle(0, 0, CONFIG.tileSize * 0.25);
    
    // Detalles interiores
    playerGraphic.fillStyle(0x0f3460, 1); // Color oscuro para detalles
    playerGraphic.fillCircle(0, 0, CONFIG.tileSize * 0.15);
    
    // Añadir brillo exterior
    playerGraphic.lineStyle(3, 0xff6b85, 1);
    playerGraphic.strokeCircle(0, 0, CONFIG.tileSize * 0.42);
    
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
    scene.cameras.main.startFollow(player, true, 0.08, 0.08); // Suavizado mejorado
    
    // Ajustar el zoom para ver más del mapa (menor zoom = ver más)
    scene.cameras.main.setZoom(0.8);
    
    // Agregar efecto de "luz" alrededor del jugador
    const lightRadius = CONFIG.tileSize * 6; // Radio ampliado
    const gradient = scene.add.graphics();
    
    // Crear un gradiente radial para la luz
    const gradientColors = [
        { stop: 0, color: 0xe94560, alpha: 0.3 },
        { stop: 0.5, color: 0xe94560, alpha: 0.1 },
        { stop: 1, color: 0xe94560, alpha: 0 }
    ];
    
    gradient.clear();
    let i = 0;
    for (i = 0; i < gradientColors.length; i++) {
        const { stop, color, alpha } = gradientColors[i];
        gradient.fillStyle(color, alpha);
        gradient.fillCircle(0, 0, lightRadius * (1 - stop));
    }
    
    // Generar textura de luz
    const lightTexture = gradient.generateTexture('player_light', lightRadius * 2, lightRadius * 2);
    gradient.destroy();
    
    // Crear sprite de luz
    const light = scene.add.sprite(playerX, playerY, 'player_light');
    light.setDepth(3);
    light.setAlpha(0.7);
    
    // Añadir partículas para el jugador
    const particles = scene.add.particles('player_texture');
    
    // Configurar emisor de partículas
    const emitter = particles.createEmitter({
        alpha: { start: 0.5, end: 0 },
        scale: { start: 0.2, end: 0.1 },
        speed: 20,
        lifespan: 800,
        blendMode: 'ADD',
        frequency: 110,
        quantity: 1
    });
    
    // Ocultar emisor inicialmente
    emitter.stop();
    
    // Guardar referencia al emisor en el jugador
    player.particleEmitter = emitter;
    
    // Hacer que la luz siga al jugador
    scene.tweens.add({
        targets: light,
        alpha: { from: 0.5, to: 0.8 },
        duration: 1500,
        yoyo: true,
        repeat: -1
    });
    
    // Actualizar posición de la luz cuando el jugador se mueve
    player.light = light;
    player.particles = particles;
    
    // Añadir un efecto de aparición
    player.setAlpha(0);
    scene.tweens.add({
        targets: player,
        alpha: 1,
        scale: 1,
        duration: 800,
        ease: 'Back.out'
    });
    
    // Añadir un tween de rotación lenta para el brillo
    scene.tweens.add({
        targets: light,
        angle: 360,
        duration: 15000,
        repeat: -1
    });
    
    return player;
}

/**
 * Maneja el movimiento del jugador
 */
function handlePlayerMovement(scene, player, cursors, wasd) {
    // Si el juego está pausado, no hacer nada
    if (gameState.isPaused) return;
    
    const speed = 160; // Velocidad ligeramente aumentada
    let moving = false;
    player.setVelocity(0);
    
    // Movimiento horizontal
    if (cursors.left.isDown || wasd.left.isDown) {
        player.setVelocityX(-speed);
        moving = true;
    } else if (cursors.right.isDown || wasd.right.isDown) {
        player.setVelocityX(speed);
        moving = true;
    }
    
    // Movimiento vertical
    if (cursors.up.isDown || wasd.up.isDown) {
        player.setVelocityY(-speed);
        moving = true;
    } else if (cursors.down.isDown || wasd.down.isDown) {
        player.setVelocityY(speed);
        moving = true;
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
    
    // Gestionar las partículas según movimiento
    if (player.particleEmitter) {
        if (moving) {
            // Activar emisor de partículas
            player.particleEmitter.start();
            // Ajustar posición del emisor para que siga al jugador
            player.particleEmitter.setPosition(player.x, player.y);
            // La dirección de emisión depende de la dirección de movimiento (opuesta)
            const angle = Phaser.Math.RadToDeg(
                Math.atan2(-player.body.velocity.y, -player.body.velocity.x)
            );
            player.particleEmitter.setAngle({ min: angle - 20, max: angle + 20 });
        } else {
            // Detener emisión de partículas cuando no se mueve
            player.particleEmitter.stop();
        }
    }
    
    // Agregar animación mejorada de movimiento
    if (moving) {
        if (!player.isMoving) {
            player.isMoving = true;
            
            // Detener cualquier tween anterior
            scene.tweens.killTweensOf(player);
            
            // Animación de "vibración" ligera para dar sensación de movimiento
            scene.tweens.add({
                targets: player,
                scaleX: { from: 0.85, to: 0.95 },
                scaleY: { from: 0.95, to: 0.85 },
                duration: 350,
                ease: 'Sine.easeInOut',
                yoyo: true,
                repeat: -1
            });
        }
    } else if (player.isMoving) {
        player.isMoving = false;
        scene.tweens.killTweensOf(player);
        
        // Animación de "respiración" en reposo
        scene.tweens.add({
            targets: player,
            scaleX: 0.9,
            scaleY: 0.9,
            duration: 750,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }
}

/**
 * Muerte del jugador con efectos visuales mejorados
 */
function playerDeath(scene) {
    // Detener al jugador y eliminar cualquier tween en progreso
    scene.player.body.setVelocity(0, 0);
    scene.tweens.killTweensOf(scene.player);
    
    // Detener emisor de partículas
    if (scene.player.particleEmitter) {
        scene.player.particleEmitter.stop();
    }
    
    // Crear varios círculos de explosión
    const explosionColors = [
        0xe94560, // Rojo
        0xffd369, // Amarillo
        0x0f3460, // Azul oscuro
        0xffffff  // Blanco
    ];
    
    // Animación de muerte más elaborada
    scene.time.delayedCall(100, () => {
        // Crear partículas de explosión
        const deathParticles = scene.add.particles('player_texture');
        const deathEmitter = deathParticles.createEmitter({
            speed: { min: 50, max: 200 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.6, end: 0 },
            blendMode: 'ADD',
            lifespan: 800,
            quantity: 30
        });
        
        deathEmitter.explode(50, scene.player.x, scene.player.y);
        
        // Secuencia de efectos visuales
        for (let i = 0; i < explosionColors.length; i++) {
            const color = explosionColors[i];
            const delay = i * 150;
            
            // Gráfico para el círculo de explosión
            const explosionGraphic = scene.add.graphics();
            explosionGraphic.fillStyle(color, 1);
            explosionGraphic.fillCircle(0, 0, 40 - i * 8);
            
            // Generar textura
            const explosionTextureKey = `explosion_texture_${i}`;
            explosionGraphic.generateTexture(explosionTextureKey, 80, 80);
            explosionGraphic.destroy();
            
            // Crear sprite con retraso
            scene.time.delayedCall(delay, () => {
                const explosion = scene.add.sprite(scene.player.x, scene.player.y, explosionTextureKey);
                explosion.setScale(0.5);
                explosion.setDepth(25);
                
                // Añadir tween
                scene.tweens.add({
                    targets: explosion,
                    scale: 3,
                    alpha: 0,
                    duration: 500,
                    ease: 'Power2',
                    onComplete: () => {
                        explosion.destroy();
                    }
                });
            });
        }
        
        // Añadir ondas de energía
        const shockwave = scene.add.graphics();
        shockwave.lineStyle(3, 0xe94560, 1);
        shockwave.strokeCircle(0, 0, 30);
        
        const shockwaveTexture = shockwave.generateTexture('shockwave_texture', 60, 60);
        shockwave.destroy();
        
        const shockwaveSprite = scene.add.sprite(scene.player.x, scene.player.y, 'shockwave_texture');
        shockwaveSprite.setDepth(20);
        
        scene.tweens.add({
            targets: shockwaveSprite,
            scale: 8,
            alpha: 0,
            duration: 1000,
            ease: 'Cubic.Out'
        });
    });
    
    // Ocultar al jugador con una animación de desvanecimiento
    scene.tweens.add({
        targets: scene.player,
        alpha: 0,
        scale: 1.5,
        angle: 720,
        duration: 800,
        ease: 'Power2'
    });
    
    // Sacudir la cámara para dar efecto dramático
    scene.cameras.main.shake(500, 0.03);
    scene.cameras.main.flash(500, 230, 69, 96);
    
    // Reproducir sonido (si existe)
    scene.sounds.playerDeath();
    
    // Mensaje
    addMessage("¡Has muerto! Pulsa el botón para intentarlo de nuevo.", "combat");
    
    // Esperar un momento antes de mostrar la pantalla de Game Over
    scene.time.delayedCall(1200, () => {
        showGameOver();
    });
}