/**
 * Escena principal del juego
 */
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }
    
    preload() {
        // No necesitamos cargar recursos externos, usamos gráficos generados dinámicamente
        console.log("GameScene: preload iniciado");
    }
    
    create() {
        console.log("GameScene: create iniciado");
        
        // Guardar referencia a la escena para usar en otras funciones
        this.scene.scene = this;
        
        // Sonidos del juego mediante callbacks a funciones de Web Audio API
        this.sounds = {
            hit: () => window.playSound && window.playSound('hit'),
            pickup: () => window.playSound && window.playSound('pickup'),
            levelup: () => window.playSound && window.playSound('levelup'),
            stairs: () => window.playSound && window.playSound('stairs'),
            enemyDeath: () => window.playSound && window.playSound('enemyDeath'),
            playerDeath: () => window.playSound && window.playSound('playerDeath')
        };
        
        // Generar mazmorra
        generateDungeon(this);
        
        // Crear jugador
        this.player = createPlayer(this);
        
        // Colocar escaleras
        placeStairs(this);
        
        // Colocar enemigos y objetos
        placeEnemies(this);
        placeItems(this);
        
        // Configurar controles
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = {
            up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
        };
        
        // Teclas especiales
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.eKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        this.pKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
        
        // Configurar evento de espacio (atacar/interactuar)
        this.spaceKey.on('down', () => {
            if (!gameState.isPaused) {
                checkInteraction(this, this.player);
            }
        });
        
        // Configurar eventos para inventario y pausa
        this.eKey.on('down', toggleInventory);
        this.pKey.on('down', pauseGame);
        
        // Configurar colisiones
        this.physics.add.collider(this.player, gameState.wallsLayer);
        
        // Overlap con ítems
        if (gameState.itemsGroup) {
            this.physics.add.overlap(this.player, gameState.itemsGroup, (player, itemSprite) => {
                collectItem(this, player, itemSprite);
            }, null, this);
        }
        
        // Overlap con escaleras
        if (gameState.stairs) {
            this.physics.add.overlap(this.player, gameState.stairs, (player, stairs) => {
                useStairs(player, stairs);
            }, null, this);
        }
        
        // Inicializar UI
        updateUI();
        addMessage(`Bienvenido al nivel ${gameState.dungeonLevel} de la mazmorra.`, "level");
        
        console.log("GameScene: create completado");
    }
    
    update() {
        // No actualizar si el juego está pausado
        if (gameState.isPaused) return;
        
        // Mover jugador
        handlePlayerMovement(this, this.player, this.cursors, this.wasd);
        
        // Actualizar enemigos
        updateEnemies(this, this.player);
        
        // Actualizar efectos de estado
        processStatusEffects(this);
    }
}

/**
 * Maneja ataques de enemigos al jugador
 */
function enemyAttack(scene, enemy, player) {
    // Calcular daño
    const baseDamage = enemy.attack;
    const defense = gameState.playerStats.defense;
    const damage = Math.max(1, baseDamage - defense);
    
    // Crear gráfico para la animación de ataque
    const attackGraphic = scene.add.graphics();
    attackGraphic.fillStyle(0xff0000, 0.8);
    attackGraphic.fillCircle(0, 0, 20);
    attackGraphic.fillStyle(0xffff00, 0.8);
    attackGraphic.fillCircle(0, 0, 12);
    attackGraphic.fillStyle(0xffffff, 0.9);
    attackGraphic.fillCircle(0, 0, 5);
    
    // Generar textura para el ataque
    const attackTextureKey = 'enemy_attack_texture';
    if (!scene.textures.exists(attackTextureKey)) {
        attackGraphic.generateTexture(attackTextureKey, 40, 40);
    }
    attackGraphic.destroy();
    
    // Crear el sprite del ataque
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
 * Maneja ataques del jugador a enemigos
 */
EnemyModule.attackEnemy(scene, enemy);

/**
 * Maneja la derrota de un enemigo
 */
function defeatEnemy(scene, enemy) {
    // Reproducir sonido
    scene.sounds.enemyDeath();
    
    // Crear gráfico para la explosión
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
 * Maneja la muerte del jugador
 */
function playerDeath(scene) {
    // Crear gráfico para la explosión
    const explosionGraphic = scene.add.graphics();
    explosionGraphic.fillStyle(0x3498db, 0.7);
    explosionGraphic.fillCircle(0, 0, 40);
    explosionGraphic.fillStyle(0x2980b9, 0.8);
    explosionGraphic.fillCircle(0, 0, 25);
    explosionGraphic.fillStyle(0xffffff, 0.9);
    explosionGraphic.fillCircle(0, 0, 10);
    
    // Generar textura para la explosión
    const explosionTextureKey = 'player_death_texture';
    if (!scene.textures.exists(explosionTextureKey)) {
        explosionGraphic.generateTexture(explosionTextureKey, 80, 80);
    }
    explosionGraphic.destroy();
    
    // Crear el sprite de la explosión
    const explosion = scene.add.sprite(scene.player.x, scene.player.y, explosionTextureKey);
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
    
    // Reproducir sonido
    scene.sounds.playerDeath();
    
    // Mensaje
    addMessage("¡Has muerto! Pulsa el botón para intentarlo de nuevo.", "combat");
    
    // Game Over
    showGameOver();
}