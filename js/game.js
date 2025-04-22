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
            hit: function() { 
                if (AudioManager && typeof AudioManager.playSound === 'function') {
                    AudioManager.playSound('hit'); 
                }
            },
            pickup: function() { 
                if (AudioManager && typeof AudioManager.playSound === 'function') {
                    AudioManager.playSound('pickup'); 
                }
            },
            levelup: function() { 
                if (AudioManager && typeof AudioManager.playSound === 'function') {
                    AudioManager.playSound('levelup'); 
                }
            },
            stairs: function() { 
                if (AudioManager && typeof AudioManager.playSound === 'function') {
                    AudioManager.playSound('stairs'); 
                }
            },
            enemyDeath: function() { 
                if (AudioManager && typeof AudioManager.playSound === 'function') {
                    AudioManager.playSound('enemyDeath'); 
                }
            },
            playerDeath: function() { 
                if (AudioManager && typeof AudioManager.playSound === 'function') {
                    AudioManager.playSound('playerDeath'); 
                }
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
 * Recoge un objeto
 */
function collectItem(scene, player, itemSprite) {
    // Buscar el objeto en el array
    const itemIndex = gameState.items.findIndex(item => item.sprite === itemSprite);
    
    if (itemIndex !== -1) {
        const item = gameState.items[itemIndex];
        
        // Reproducir sonido
        scene.sounds.pickup();
        
        // Añadir al inventario
        gameState.inventory.push({
            type: item.type,
            level: item.level,
            name: item.name
        });
        
        // Mensaje
        addMessage(`Has recogido: ${item.name}`, "item");
        
        // Efecto visual
        const pickupEffect = scene.add.sprite(itemSprite.x, itemSprite.y, 'player_texture');
        pickupEffect.setScale(0.5);
        pickupEffect.setAlpha(0.7);
        pickupEffect.setTint(0xffffff);
        
        scene.tweens.add({
            targets: pickupEffect,
            scale: 2,
            alpha: 0,
            duration: 500,
            onComplete: () => {
                pickupEffect.destroy();
            }
        });
        
        // Limpiar recursos
        if (item.particles) {
            item.particles.destroy();
        }
        
        // Eliminar objeto
        itemSprite.destroy();
        gameState.items.splice(itemIndex, 1);
        
        // Actualizar inventario
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
        
        if (!scene || !scene.player) {
            console.error("No se puede usar objeto: escena o jugador no disponible");
            return;
        }
        
        // Aplicar efecto según tipo
        switch (item.type) {
            case 0: // Poción de Salud
                const healAmount = 20 + (item.level * 10);
                gameState.playerStats.health = Math.min(
                    gameState.playerStats.health + healAmount,
                    gameState.playerStats.maxHealth
                );
                createItemUseEffect(scene, scene.player, 0x9bdc28, `+${healAmount} Salud`, item.level);
                addMessage(`Has usado ${item.name} y recuperas ${healAmount} puntos de salud.`, "item");
                break;
                
            case 1: // Poción de Fuerza
                const attackBonus = 2 + item.level;
                gameState.playerStats.attack += attackBonus;
                createItemUseEffect(scene, scene.player, 0xe94560, `+${attackBonus} Fuerza`, item.level);
                addMessage(`Has usado ${item.name} y tu ataque aumenta en ${attackBonus}.`, "item");
                break;
                
            case 2: // Poción de Defensa
                const defenseBonus = 1 + Math.floor(item.level / 2);
                gameState.playerStats.defense += defenseBonus;
                createItemUseEffect(scene, scene.player, 0x4285f4, `+${defenseBonus} Defensa`, item.level);
                addMessage(`Has usado ${item.name} y tu defensa aumenta en ${defenseBonus}.`, "item");
                break;
                
            case 3: // Poción de Experiencia
                const xpGain = 25 + (item.level * 25);
                gameState.playerStats.xp += xpGain;
                createItemUseEffect(scene, scene.player, 0x9c42f4, `+${xpGain} XP`, item.level);
                addMessage(`Has usado ${item.name} y ganas ${xpGain} puntos de experiencia.`, "item");
                checkLevelUp();
                break;
                
            case 4: // Poción de Vida Máxima
                const maxHealthBonus = 5 + (item.level * 5);
                gameState.playerStats.maxHealth += maxHealthBonus;
                gameState.playerStats.health += maxHealthBonus;
                createItemUseEffect(scene, scene.player, 0x42cef4, `+${maxHealthBonus} Vida Máx.`, item.level);
                addMessage(`Has usado ${item.name} y tu salud máxima aumenta en ${maxHealthBonus}.`, "item");
                break;
                
            case 5: // Poción Misteriosa
                // Efecto aleatorio
                const effects = [
                    // Efectos positivos
                    () => {
                        const healAmount = 30 + (item.level * 15);
                        gameState.playerStats.health = Math.min(
                            gameState.playerStats.health + healAmount,
                            gameState.playerStats.maxHealth
                        );
                        createItemUseEffect(scene, scene.player, 0x9bdc28, `+${healAmount} Salud`, item.level);
                        addMessage(`La poción misteriosa te cura ${healAmount} puntos de salud.`, "item");
                    },
                    () => {
                        const attackBonus = 3 + Math.floor(item.level * 1.5);
                        gameState.playerStats.attack += attackBonus;
                        createItemUseEffect(scene, scene.player, 0xe94560, `+${attackBonus} Fuerza`, item.level);
                        addMessage(`La poción misteriosa aumenta tu ataque en ${attackBonus}.`, "item");
                    },
                    // Efectos neutrales
                    () => {
                        // Teletransporte a una sala aleatoria
                        if (gameState.rooms.length > 0) {
                            const randomRoom = gameState.rooms[getRandomInt(0, gameState.rooms.length - 1)];
                            scene.player.x = randomRoom.centerX * CONFIG.tileSize + (CONFIG.tileSize / 2);
                            scene.player.y = randomRoom.centerY * CONFIG.tileSize + (CONFIG.tileSize / 2);
                            createItemUseEffect(scene, scene.player, 0xf4a742, `¡Teletransporte!`, item.level);
                            scene.cameras.main.flash(500, 234, 255, 255);
                            addMessage(`La poción misteriosa te teletransporta a otra sala.`, "item");
                        }
                    },
                    // Efectos negativos (solo con probabilidad baja)
                    () => {
                        if (Math.random() < 0.3) {
                            const damage = Math.max(1, Math.floor(gameState.playerStats.health * 0.1));
                            gameState.playerStats.health -= damage;
                            createItemUseEffect(scene, scene.player, 0xff0000, `-${damage} Salud`, item.level);
                            addMessage(`¡La poción misteriosa te envenena y pierdes ${damage} puntos de salud!`, "item");
                            // Comprobar muerte
                            if (gameState.playerStats.health <= 0) {
                                playerDeath(scene);
                            }
                        } else {
                            // Efecto positivo aleatorio como fallback
                            const healAmount = 20 + (item.level * 10);
                            gameState.playerStats.health = Math.min(
                                gameState.playerStats.health + healAmount,
                                gameState.playerStats.maxHealth
                            );
                            createItemUseEffect(scene, scene.player, 0x9bdc28, `+${healAmount} Salud`, item.level);
                            addMessage(`La poción misteriosa te cura ${healAmount} puntos de salud.`, "item");
                        }
                    }
                ];
                
                // Elegir un efecto aleatorio
                effects[getRandomInt(0, effects.length - 1)]();
                break;
        }
        
        // Reproducir sonido
        scene.sounds.pickup();
        
        // Actualizar UI
        updateUI();
        
        // Eliminar del inventario
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
        addMessage(`¡Has subido al nivel ${gameState.playerStats.level}! Salud +${healthBonus}, Ataque +${attackBonus}, Defensa +${defenseBonus}.`, "level");
        
        // Efectos visuales
        if (scene && scene.player) {
            // Reproducir sonido
            scene.sounds.levelup();
            
            // Efecto visual de subida de nivel
            const levelUpEffect = scene.add.graphics();
            levelUpEffect.fillStyle(0xffd369, 0.6);
            levelUpEffect.fillCircle(0, 0, CONFIG.tileSize * 2);
            
            const effectTexture = levelUpEffect.generateTexture('levelup_effect', CONFIG.tileSize * 4, CONFIG.tileSize * 4);
            levelUpEffect.destroy();
            
            const effect = scene.add.sprite(scene.player.x, scene.player.y, 'levelup_effect');
            effect.setDepth(30);
            
            scene.tweens.add({
                targets: effect,
                scale: 2,
                alpha: 0,
                duration: 1000,
                onComplete: () => {
                    effect.destroy();
                }
            });
            
            // Sacudir ligeramente la cámara
            scene.cameras.main.shake(300, 0.01);
            
            // Texto de "LEVEL UP!"
            const levelText = scene.add.text(
                scene.player.x, 
                scene.player.y - 50, 
                '¡NIVEL UP!', 
                { 
                    fontFamily: 'Arial', 
                    fontSize: 24, 
                    color: '#ffd369',
                    stroke: '#000000',
                    strokeThickness: 4,
                    align: 'center'
                }
            );
            levelText.setOrigin(0.5);
            levelText.setDepth(31);
            
            scene.tweens.add({
                targets: levelText,
                y: levelText.y - 30,
                scale: 1.5,
                alpha: 0,
                duration: 1500,
                onComplete: () => {
                    levelText.destroy();
                }
            });
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
 * Procesa los efectos de estado activos en el jugador
 */
function processStatusEffects(scene) {
    const currentTime = scene.time.now;
    
    // Filtrar efectos caducados
    gameState.playerStats.statusEffects = gameState.playerStats.statusEffects.filter(effect => {
        // Comprobar si el efecto ha expirado
        if (effect.expiresAt && effect.expiresAt < currentTime) {
            // Aplicar efecto de finalización si existe
            if (effect.onEnd) {
                effect.onEnd();
            }
            
            // Mensaje
            addMessage(`El efecto ${effect.name} ha terminado.`);
            
            // Actualizar UI
            updateUI();
            
            // Eliminar efecto
            return false;
        }
        
        // Aplicar efecto por turno si es tiempo
        if (effect.onTick && (!effect.lastTick || currentTime - effect.lastTick > effect.tickInterval)) {
            effect.onTick();
            effect.lastTick = currentTime;
            
            // Actualizar UI si el efecto cambia estadísticas
            if (effect.affectsStats) {
                updateUI();
            }
        }
        
        // Mantener efecto
        return true;
    });
}

/**
 * Coloca las escaleras para bajar al siguiente nivel
 */
function placeStairs(scene) {
    // Eliminar escaleras anteriores si existen
    if (gameState.stairs) {
        gameState.stairs.destroy();
    }
    
    // Colocar escaleras en la última sala
    if (gameState.rooms.length > 0) {
        const lastRoom = gameState.rooms[gameState.rooms.length - 1];
        const stairsX = lastRoom.centerX * CONFIG.tileSize + (CONFIG.tileSize / 2);
        const stairsY = lastRoom.centerY * CONFIG.tileSize + (CONFIG.tileSize / 2);
        
        // Crear gráfico para las escaleras (portal)
        const stairsGraphic = scene.add.graphics();
        
        // Círculo exterior
        stairsGraphic.lineStyle(3, 0xffd369, 0.8);
        stairsGraphic.strokeCircle(0, 0, CONFIG.tileSize * 0.8);
        
        // Círculo interior
        stairsGraphic.lineStyle(2, 0xe94560, 0.6);
        stairsGraphic.strokeCircle(0, 0, CONFIG.tileSize * 0.5);
        
        // Generar textura
        const stairsTextureKey = 'stairs_texture';
        stairsGraphic.generateTexture(stairsTextureKey, CONFIG.tileSize * 2, CONFIG.tileSize * 2);
        stairsGraphic.destroy();
        
        // Crear sprite con físicas
        gameState.stairs = scene.physics.add.sprite(stairsX, stairsY, stairsTextureKey);
        gameState.stairs.setScale(0.8);
        gameState.stairs.setDepth(3);
        
        // Añadir animación de brillo
        scene.tweens.add({
            targets: gameState.stairs,
            alpha: 0.7,
            scale: 0.9,
            duration: 1500,
            yoyo: true,
            repeat: -1
        });
        
        // Añadir partículas alrededor
        const particles = scene.add.particles(stairsTextureKey);
        const emitter = particles.createEmitter({
            scale: { start: 0.1, end: 0 },
            speed: 20,
            blendMode: 'ADD',
            lifespan: 1000,
            frequency: 200
        });
        
        emitter.startFollow(gameState.stairs);
        
        // Guardar referencia para limpiar después
        gameState.stairsParticles = particles;
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
    
    // Animación de transición
    scene.tweens.add({
        targets: player,
        alpha: 0,
        scale: 0.5,
        duration: 800,
        onComplete: () => {
            // Aumentar nivel de mazmorra
            gameState.dungeonLevel++;
            
            // Mensaje
            addMessage(`Descendiendo al nivel ${gameState.dungeonLevel} de la mazmorra...`, "level");
            
            // Reiniciar escena
            scene.scene.restart();
            
            // Restablecer flag
            gameState.isChangingLevel = false;
        }
    });
    
    // Efecto visual
    scene.cameras.main.flash(800, 15, 52, 96);
    
    // Efecto de partículas
    const particles = scene.add.particles('player_texture');
    const emitter = particles.createEmitter({
        scale: { start: 0.4, end: 0 },
        speed: 50,
        lifespan: 800,
        blendMode: 'ADD',
        frequency: 50
    });
    
    emitter.startFollow(player);
    
    // Limpiar partículas
    scene.time.delayedCall(800, () => {
        particles.destroy();
    });
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