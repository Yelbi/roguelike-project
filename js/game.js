/**
 * Escena principal del juego
 */
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }
    
    preload() {
        // No necesitamos cargar recursos externos, usamos gráficos generados dinámicamente
        // y audio procedural desde main.js
    }
    
    create() {
        this.scene.scene = this; // Referencia a la escena para usar en otras funciones
        
        // Sonidos del juego mediante Web Audio API
        this.sounds = {
            hit: () => window.playSound('hit'),
            pickup: () => window.playSound('pickup'),
            levelup: () => window.playSound('levelup'),
            stairs: () => window.playSound('stairs'),
            enemyDeath: () => window.playSound('enemyDeath'),
            playerDeath: () => window.playSound('playerDeath')
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
        this.physics.add.overlap(this.player, gameState.itemsGroup, (player, itemSprite) => {
            collectItem(this, player, itemSprite);
        }, null, this);
        this.physics.add.overlap(this.player, gameState.stairs, (player, stairs) => {
            useStairs(player, stairs);
        }, null, this);
        
        // Inicializar UI
        updateUI();
        addMessage(`Bienvenido al nivel ${gameState.dungeonLevel} de la mazmorra.`, "level");
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
 * Funciones de la escena principal
 */

/**
 * Maneja ataques de enemigos al jugador
 */
function enemyAttack(scene, enemy, player) {
    // Calcular daño
    const baseDamage = enemy.attack;
    const defense = gameState.playerStats.defense;
    const damage = Math.max(1, baseDamage - defense);
    
    // Crear animación de ataque (explosión simple)
    const attackFx = scene.add.sprite(player.x, player.y, '__DEFAULT');
    
    // Crear gráfico de explosión
    const explosionGraphic = scene.add.graphics();
    explosionGraphic.fillStyle(0xff0000, 0.8);
    explosionGraphic.fillCircle(0, 0, 20);
    explosionGraphic.fillStyle(0xffff00, 0.8);
    explosionGraphic.fillCircle(0, 0, 12);
    explosionGraphic.fillStyle(0xffffff, 0.9);
    explosionGraphic.fillCircle(0, 0, 5);
    
    attackFx.setTexture(explosionGraphic.generateTexture());
    explosionGraphic.destroy();
    
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
    
    // Sonido de golpe
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
function attackEnemy(scene, enemy) {
    // Calcular daño basado en estadísticas
    const baseDamage = gameState.playerStats.attack;
    const defense = enemy.defense;
    const damage = Math.max(1, baseDamage - defense);
    
    // Crear animación de ataque (explosión simple)
    const attackFx = scene.add.sprite(enemy.sprite.x, enemy.sprite.y, '__DEFAULT');
    
    // Crear gráfico de explosión
    const explosionGraphic = scene.add.graphics();
    explosionGraphic.fillStyle(0x3498db, 0.8);
    explosionGraphic.fillCircle(0, 0, 20);
    explosionGraphic.fillStyle(0x2980b9, 0.8);
    explosionGraphic.fillCircle(0, 0, 12);
    explosionGraphic.fillStyle(0xffffff, 0.9);
    explosionGraphic.fillCircle(0, 0, 5);
    
    attackFx.setTexture(explosionGraphic.generateTexture());
    explosionGraphic.destroy();
    
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
    
    // Sonido de golpe
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
 * Maneja la derrota de un enemigo
 */
function defeatEnemy(scene, enemy) {
    // Sonido de muerte
    scene.sounds.enemyDeath();
    
    // Efecto de explosión
    const explosion = scene.add.sprite(enemy.sprite.x, enemy.sprite.y, '__DEFAULT');
    
    // Crear gráfico de explosión
    const explosionGraphic = scene.add.graphics();
    explosionGraphic.fillStyle(0xff0000, 0.7);
    explosionGraphic.fillCircle(0, 0, 30);
    explosionGraphic.fillStyle(0xffff00, 0.8);
    explosionGraphic.fillCircle(0, 0, 20);
    explosionGraphic.fillStyle(0xffffff, 0.9);
    explosionGraphic.fillCircle(0, 0, 10);
    
    explosion.setTexture(explosionGraphic.generateTexture());
    explosionGraphic.destroy();
    
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
    // Sonido de muerte
    scene.sounds.playerDeath();
    
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
 * Conecta la funcionalidad para bajar escaleras
 */
function useStairs(player, stairs) {
    // Obtener referencia a la escena
    const scene = window.gameInstance.scene.scenes[0];
    
    // Sonido de escaleras
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
 * Conecta la funcionalidad para recoger objetos
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