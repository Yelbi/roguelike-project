/**
 * Escena principal del juego
 */
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }
    
    create() {
        console.log("GameScene: create iniciado");
        
        // Guardar referencia a la escena
        this.scene.scene = this;
        
        // Sonidos básicos del juego
        this.sounds = {
            hit: function() { 
                if (AudioManager) AudioManager.playSound('hit'); 
            },
            pickup: function() { 
                if (AudioManager) AudioManager.playSound('pickup'); 
            },
            levelup: function() { 
                if (AudioManager) AudioManager.playSound('levelup'); 
            },
            stairs: function() { 
                if (AudioManager) AudioManager.playSound('stairs'); 
            },
            enemyDeath: function() { 
                if (AudioManager) AudioManager.playSound('enemyDeath'); 
            },
            playerDeath: function() { 
                if (AudioManager) AudioManager.playSound('playerDeath'); 
            }
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
            this.physics.add.overlap(this.player, gameState.itemsGroup, collectItem);
        }
        
        // Overlap con escaleras
        if (gameState.stairs) {
            this.physics.add.overlap(this.player, gameState.stairs, useStairs);
        }
        
        // Inicializar UI
        updateUI();
        addMessage(`Bienvenido al nivel ${gameState.dungeonLevel} de la mazmorra.`);
    }
    
    update() {
        // No actualizar si el juego está pausado
        if (gameState.isPaused) return;
        
        // Mover jugador
        handlePlayerMovement(this, this.player, this.cursors, this.wasd);
        
        // Actualizar enemigos
        updateEnemies(this, this.player);
    }
}

/**
 * Recoge un objeto
 */
function collectItem(player, itemSprite) {
    const scene = player.scene;
    const itemIndex = gameState.items.findIndex(item => item.sprite === itemSprite);
    
    if (itemIndex !== -1) {
        const item = gameState.items[itemIndex];
        
        scene.sounds.pickup();
        
        gameState.inventory.push({
            type: item.type,
            level: item.level,
            name: item.name
        });
        
        addMessage(`Has recogido: ${item.name}`);
        
        if (item.particles) {
            item.particles.destroy();
        }
        
        itemSprite.destroy();
        gameState.items.splice(itemIndex, 1);
        
        updateInventoryUI();
    }
}

/**
 * Usa un objeto del inventario
 */
function useItem(index) {
    if (index >= 0 && index < gameState.inventory.length) {
        const item = gameState.inventory[index];
        const scene = getActiveScene();
        
        if (!scene || !scene.player) return;
        
        // Aplicar efecto según tipo
        switch (item.type) {
            case 0: // Poción de Salud
                const healAmount = 20 + (item.level * 10);
                gameState.playerStats.health = Math.min(
                    gameState.playerStats.health + healAmount,
                    gameState.playerStats.maxHealth
                );
                addMessage(`Has usado ${item.name} y recuperas ${healAmount} puntos de salud.`);
                break;
                
            case 1: // Poción de Fuerza
                const attackBonus = 2 + item.level;
                gameState.playerStats.attack += attackBonus;
                addMessage(`Has usado ${item.name} y tu ataque aumenta en ${attackBonus}.`);
                break;
                
            case 2: // Poción de Defensa
                const defenseBonus = 1 + Math.floor(item.level / 2);
                gameState.playerStats.defense += defenseBonus;
                addMessage(`Has usado ${item.name} y tu defensa aumenta en ${defenseBonus}.`);
                break;
                
            case 3: // Poción de Experiencia
                const xpGain = 25 + (item.level * 25);
                gameState.playerStats.xp += xpGain;
                addMessage(`Has usado ${item.name} y ganas ${xpGain} puntos de experiencia.`);
                checkLevelUp();
                break;
                
            case 4: // Poción de Vida Máxima
                const maxHealthBonus = 5 + (item.level * 5);
                gameState.playerStats.maxHealth += maxHealthBonus;
                gameState.playerStats.health += maxHealthBonus;
                addMessage(`Has usado ${item.name} y tu salud máxima aumenta en ${maxHealthBonus}.`);
                break;
                
            case 5: // Poción Misteriosa
                // Efecto aleatorio básico
                const randomEffect = getRandomInt(0, 3);
                if (randomEffect === 0) {
                    // Curación
                    const healAmount = 30 + (item.level * 15);
                    gameState.playerStats.health = Math.min(
                        gameState.playerStats.health + healAmount,
                        gameState.playerStats.maxHealth
                    );
                    addMessage(`La poción misteriosa te cura ${healAmount} puntos de salud.`);
                } else if (randomEffect === 1) {
                    // Ataque
                    const attackBonus = 3 + item.level;
                    gameState.playerStats.attack += attackBonus;
                    addMessage(`La poción misteriosa aumenta tu ataque en ${attackBonus}.`);
                } else {
                    // Defensa
                    const defenseBonus = 2 + item.level;
                    gameState.playerStats.defense += defenseBonus;
                    addMessage(`La poción misteriosa aumenta tu defensa en ${defenseBonus}.`);
                }
                break;
        }
        
        scene.sounds.pickup();
        
        updateUI();
        
        gameState.inventory.splice(index, 1);
        updateInventoryUI();
    }
}

/**
 * Comprueba si el jugador sube de nivel
 */
function checkLevelUp() {
    if (gameState.playerStats.xp >= gameState.playerStats.nextLevelXp) {
        const scene = getActiveScene();
        
        // Subir de nivel
        gameState.playerStats.level++;
        gameState.playerStats.xp -= gameState.playerStats.nextLevelXp;
        
        // Calcular XP para el siguiente nivel
        gameState.playerStats.nextLevelXp = calculateXpForNextLevel(gameState.playerStats.level);
        
        // Mejorar estadísticas
        const healthBonus = 10 + getRandomInt(5, 15);
        const attackBonus = 2 + getRandomInt(1, 3);
        const defenseBonus = 1 + getRandomInt(0, 2);
        
        gameState.playerStats.maxHealth += healthBonus;
        gameState.playerStats.health = gameState.playerStats.maxHealth; // Curación completa
        gameState.playerStats.attack += attackBonus;
        gameState.playerStats.defense += defenseBonus;
        
        // Mensaje
        addMessage(`¡Has subido al nivel ${gameState.playerStats.level}! Salud +${healthBonus}, Ataque +${attackBonus}, Defensa +${defenseBonus}.`);
        
        if (scene && scene.player) {
            scene.sounds.levelup();
        }
        
        // Actualizar UI
        updateUI();
        
        // Comprobar si hay que volver a subir de nivel
        if (gameState.playerStats.xp >= gameState.playerStats.nextLevelXp) {
            checkLevelUp();
        }
    }
}

/**
 * Usa las escaleras para avanzar al siguiente nivel
 */
function useStairs(player, stairs) {
    const scene = player.scene;
    
    // Evitar activación múltiple
    if (gameState.isChangingLevel) return;
    gameState.isChangingLevel = true;
    
    // Desactivar movimiento del jugador
    player.body.setVelocity(0, 0);
    
    // Reproducir sonido
    scene.sounds.stairs();
    
    scene.tweens.add({
        targets: player,
        alpha: 0,
        scale: 0.5,
        duration: 800,
        onComplete: () => {
            // Aumentar nivel de mazmorra
            gameState.dungeonLevel++;
            
            // Mensaje
            addMessage(`Descendiendo al nivel ${gameState.dungeonLevel} de la mazmorra...`);
            
            // Reiniciar escena
            scene.scene.restart();
            
            // Restablecer flag
            gameState.isChangingLevel = false;
        }
    });
}