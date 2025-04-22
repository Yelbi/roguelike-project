/**
 * Funciones relacionadas con los enemigos del juego
 */

/**
 * Coloca enemigos en las salas de la mazmorra con diseños visuales mejorados
 */
function placeEnemies(scene) {
    gameState.enemies = [];
    
    // Destruir grupo anterior si existe
    if (gameState.enemiesGroup) {
        gameState.enemiesGroup.clear(true, true);
    }
    
    // Crear nuevo grupo de enemigos
    gameState.enemiesGroup = scene.physics.add.group();
    
    // Tipos de enemigos disponibles según nivel
    const enemyTypes = [
        { name: 'Sombra', shape: 'triangle', color: 0xe74c3c, details: true },
        { name: 'Centinela', shape: 'square', color: 0xc0392b, details: true },
        { name: 'Brujo', shape: 'hex', color: 0xd35400, details: true },
        { name: 'Asesino', shape: 'diamond', color: 0xe67e22, details: true },
        { name: 'Guardián', shape: 'octagon', color: 0xf39c12, details: true },
        { name: 'Espectro', shape: 'star', color: 0x8e44ad, details: true }
    ];
    
    // Colocar enemigos en salas aleatorias (excepto la primera)
    for (let i = 1; i < gameState.rooms.length; i++) {
        const room = gameState.rooms[i];
        
        // Más enemigos en niveles más profundos
        const minEnemies = Math.min(1, Math.floor(gameState.dungeonLevel / 2));
        const maxEnemies = Math.min(5, Math.floor(gameState.dungeonLevel * 0.7) + 1);
        const enemyCount = getRandomInt(minEnemies, maxEnemies);
        
        for (let j = 0; j < enemyCount; j++) {
            // Encontrar una posición válida para el enemigo dentro de la sala
            const x = getRandomInt(room.x + 1, room.x + room.width - 2);
            const y = getRandomInt(room.y + 1, room.y + room.height - 2);
            
            // Elegir tipo de enemigo basado en nivel de mazmorra
            const availableTypes = Math.min(enemyTypes.length, gameState.dungeonLevel + 1);
            const enemyTypeIndex = getRandomInt(0, availableTypes - 1);
            const enemyType = enemyTypes[enemyTypeIndex];
            
            // Mayor variación de nivel de enemigos en pisos profundos
            const levelVariation = Math.min(2, Math.floor(gameState.dungeonLevel / 3));
            const enemyLevel = getRandomInt(
                Math.max(1, gameState.dungeonLevel - levelVariation),
                gameState.dungeonLevel + Math.ceil(levelVariation/2)
            );
            
            // Posición en píxeles
            const enemyX = x * CONFIG.tileSize + (CONFIG.tileSize / 2);
            const enemyY = y * CONFIG.tileSize + (CONFIG.tileSize / 2);
            
            // Crear un enemigo con diseño mejorado
            createEnemy(scene, enemyX, enemyY, enemyType, enemyTypeIndex, enemyLevel);
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
 * Crea un enemigo con mejor diseño visual
 */
function createEnemy(scene, x, y, enemyType, typeIndex, level) {
    // Crear gráfico personalizado para el enemigo
    const enemyGraphic = scene.add.graphics();
    const size = CONFIG.tileSize * 0.7; // Tamaño base
    
    // Aplicar color base según tipo de enemigo
    enemyGraphic.fillStyle(enemyType.color, 1);
    
    // Dibujar forma según tipo de enemigo
    switch (enemyType.shape) {
        case 'triangle':
            // Triángulo (sombra)
            enemyGraphic.beginPath();
            enemyGraphic.moveTo(0, -size/1.3);
            enemyGraphic.lineTo(-size/1.3, size/1.3);
            enemyGraphic.lineTo(size/1.3, size/1.3);
            enemyGraphic.closePath();
            enemyGraphic.fillPath();
            
            // Detalles
            if (enemyType.details) {
                // Ojo
                enemyGraphic.fillStyle(0xffffff, 0.8);
                enemyGraphic.fillCircle(0, 0, size/5);
                
                enemyGraphic.fillStyle(0x000000, 1);
                enemyGraphic.fillCircle(0, 0, size/10);
            }
            break;
            
        case 'square':
            // Cuadrado (centinela)
            enemyGraphic.fillRect(-size/1.5, -size/1.5, size*1.3, size*1.3);
            
            // Detalles
            if (enemyType.details) {
                // Marco interior
                enemyGraphic.lineStyle(2, 0x000000, 0.5);
                enemyGraphic.strokeRect(-size/2, -size/2, size, size);
                
                // Ojos
                enemyGraphic.fillStyle(0xffffff, 0.8);
                enemyGraphic.fillCircle(-size/4, -size/4, size/8);
                enemyGraphic.fillCircle(size/4, -size/4, size/8);
                
                enemyGraphic.fillStyle(0x000000, 1);
                enemyGraphic.fillCircle(-size/4, -size/4, size/16);
                enemyGraphic.fillCircle(size/4, -size/4, size/16);
            }
            break;
            
        case 'hex':
            // Hexágono (brujo)
            enemyGraphic.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i;
                const px = Math.sin(angle) * (size/1.3);
                const py = Math.cos(angle) * (size/1.3);
                if (i === 0) {
                    enemyGraphic.moveTo(px, py);
                } else {
                    enemyGraphic.lineTo(px, py);
                }
            }
            enemyGraphic.closePath();
            enemyGraphic.fillPath();
            
            // Detalles
            if (enemyType.details) {
                // Símbolo arcano
                enemyGraphic.lineStyle(2, 0xffffff, 0.7);
                enemyGraphic.beginPath();
                enemyGraphic.moveTo(0, -size/2);
                enemyGraphic.lineTo(0, size/2);
                enemyGraphic.moveTo(-size/2, 0);
                enemyGraphic.lineTo(size/2, 0);
                enemyGraphic.strokePath();
                
                // Círculo central
                enemyGraphic.lineStyle(2, 0xffffff, 0.7);
                enemyGraphic.strokeCircle(0, 0, size/4);
            }
            break;
            
        case 'diamond':
            // Diamante (asesino)
            enemyGraphic.beginPath();
            enemyGraphic.moveTo(0, -size/1.2);
            enemyGraphic.lineTo(size/1.2, 0);
            enemyGraphic.lineTo(0, size/1.2);
            enemyGraphic.lineTo(-size/1.2, 0);
            enemyGraphic.closePath();
            enemyGraphic.fillPath();
            
            // Detalles
            if (enemyType.details) {
                // Línea diagonal
                enemyGraphic.lineStyle(2, 0x000000, 0.5);
                enemyGraphic.beginPath();
                enemyGraphic.moveTo(-size/3, -size/3);
                enemyGraphic.lineTo(size/3, size/3);
                enemyGraphic.strokePath();
                
                // Línea diagonal inversa
                enemyGraphic.beginPath();
                enemyGraphic.moveTo(-size/3, size/3);
                enemyGraphic.lineTo(size/3, -size/3);
                enemyGraphic.strokePath();
            }
            break;
            
        case 'octagon':
            // Octágono (guardián)
            enemyGraphic.beginPath();
            for (let i = 0; i < 8; i++) {
                const angle = (Math.PI / 4) * i;
                const px = Math.sin(angle) * (size/1.3);
                const py = Math.cos(angle) * (size/1.3);
                if (i === 0) {
                    enemyGraphic.moveTo(px, py);
                } else {
                    enemyGraphic.lineTo(px, py);
                }
            }
            enemyGraphic.closePath();
            enemyGraphic.fillPath();
            
            // Detalles
            if (enemyType.details) {
                // Escudo central
                enemyGraphic.fillStyle(0x000000, 0.5);
                enemyGraphic.fillCircle(0, 0, size/3);
                
                // Símbolo
                enemyGraphic.fillStyle(0xffffff, 0.7);
                enemyGraphic.fillRect(-size/6, -size/6, size/3, size/3);
            }
            break;
            
        case 'star':
            // Estrella (espectro)
            enemyGraphic.beginPath();
            const points = 5;
            const innerRadius = size/2;
            const outerRadius = size/1.2;
            
            for (let i = 0; i < points * 2; i++) {
                const radius = i % 2 === 0 ? outerRadius : innerRadius;
                const angle = (Math.PI * 2 / (points * 2)) * i - Math.PI/2;
                const px = Math.cos(angle) * radius;
                const py = Math.sin(angle) * radius;
                
                if (i === 0) {
                    enemyGraphic.moveTo(px, py);
                } else {
                    enemyGraphic.lineTo(px, py);
                }
            }
            
            enemyGraphic.closePath();
            enemyGraphic.fillPath();
            
            // Detalles
            if (enemyType.details) {
                // Círculo central
                enemyGraphic.fillStyle(0xffffff, 0.6);
                enemyGraphic.fillCircle(0, 0, size/5);
                
                // Borde brillante
                enemyGraphic.lineStyle(1, 0xffffff, 0.7);
                enemyGraphic.strokeCircle(0, 0, size/2.5);
            }
            break;
    }
    
    // Añadir borde para todos los enemigos
    const borderIntensity = 0.3 + (level * 0.05); // Más brillante con nivel más alto
    enemyGraphic.lineStyle(2, enemyType.color, borderIntensity * 2);
    enemyGraphic.strokeCircle(0, 0, size/1.1);
    
    // Generar textura para el enemigo
    const enemyTextureKey = `enemy_${typeIndex}_lvl_${level}_texture`;
    
    if (!scene.textures.exists(enemyTextureKey)) {
        enemyGraphic.generateTexture(enemyTextureKey, CONFIG.tileSize * 2, CONFIG.tileSize * 2);
    }
    
    enemyGraphic.destroy();
    
    // Crear sprite con físicas
    const enemy = scene.physics.add.sprite(x, y, enemyTextureKey);
    enemy.setScale(0.8 + (level * 0.03)); // Ligeramente más grande con nivel más alto
    enemy.depth = 5;
    
    // Agregar al grupo de físicas
    gameState.enemiesGroup.add(enemy);
    
    // Ajustar estadísticas basadas en nivel y tipo
    const enemyBaseHealth = 30 + (level * 12);
    const healthMultiplier = [1.0, 1.3, 0.8, 0.9, 1.5, 0.7][typeIndex % 6];
    
    const enemyData = {
        sprite: enemy,
        type: typeIndex,
        name: enemyType.name,
        level: level,
        health: Math.floor(enemyBaseHealth * healthMultiplier),
        maxHealth: Math.floor(enemyBaseHealth * healthMultiplier),
        attack: 5 + (level * 3) + typeIndex, // Más ataque con nivel y tipo
        defense: 2 + Math.floor(level / 2) + Math.floor(typeIndex / 2), // Más defensa con nivel y tipo
        xpReward: 25 + (level * 15) + (typeIndex * 5), // Más XP por enemigos avanzados
        moveTimer: 0,
        lastMove: 0,
        lastAttack: 0
    };
    
    // Crear barra de salud mejorada
    enemyData.healthBar = createEnemyHealthBar(scene, enemy, enemyData);
    
    // Añadir efectos visuales según tipo
    addEnemyEffects(scene, enemy, typeIndex, level);
    
    // Añadir indicador de nivel
    if (level > 1) {
        const levelText = scene.add.text(0, -CONFIG.tileSize/2 - 5, level, {
            font: '12px Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        
        levelText.setDepth(20);
        
        // Hacer que el texto siga al enemigo
        scene.time.addEvent({
            delay: 50,
            callback: () => {
                if (enemy.active) {
                    levelText.x = enemy.x;
                    levelText.y = enemy.y - CONFIG.tileSize/2 - 5;
                } else {
                    levelText.destroy();
                }
            },
            loop: true
        });
    }
    
    gameState.enemies.push(enemyData);
    
    return enemyData;
}

/**
 * Crea una barra de salud mejorada para un enemigo
 */
function createEnemyHealthBar(scene, enemy, enemyData) {
    const healthBar = scene.add.graphics();
    healthBar.depth = 20;
    
    // Función para actualizar la barra
    const updateBar = () => {
        if (!enemy.active) {
            healthBar.destroy();
            return;
        }
        
        healthBar.clear();
        
        const width = 32;
        const height = 4;
        const x = enemy.x - width / 2;
        const y = enemy.y - 20;
        
        // Marco de la barra
        healthBar.fillStyle(0x000000, 0.8);
        healthBar.fillRect(x - 1, y - 1, width + 2, height + 2);
        
        // Fondo de la barra
        healthBar.fillStyle(0x333333, 0.8);
        healthBar.fillRect(x, y, width, height);
        
        // Barra de salud
        const healthPercentage = enemyData.health / enemyData.maxHealth;
        const healthColor = getHealthColor(healthPercentage);
        healthBar.fillStyle(healthColor, 1);
        healthBar.fillRect(x, y, width * healthPercentage, height);
        
        // Añadir brillos en los extremos de la barra
        if (healthPercentage > 0.1) {
            healthBar.fillStyle(0xffffff, 0.5);
            healthBar.fillRect(x, y, 2, height);
        }
    };
    
    // Configurar actualización regular
    const updateEvent = scene.time.addEvent({
        delay: 100,
        callback: updateBar,
        loop: true
    });
    
    // Primera actualización
    updateBar();
    
    // Retornar objeto con funciones para manipular la barra
    return {
        update: updateBar,
        destroy: () => {
            updateEvent.destroy();
            healthBar.destroy();
        }
    };
}

/**
 * Añade efectos visuales según el tipo de enemigo
 */
function addEnemyEffects(scene, enemy, typeIndex, level) {
    // Añadir efectos según el tipo
    switch (typeIndex % 6) {
        case 0: // Sombra - ligera neblina
            // Partículas de humo
            const smokeGraphic = scene.add.graphics();
            smokeGraphic.fillStyle(0xe74c3c, 0.3);
            smokeGraphic.fillCircle(0, 0, 5);
            
            const smokeTexture = smokeGraphic.generateTexture('smoke_particle', 10, 10);
            smokeGraphic.destroy();
            
            scene.time.addEvent({
                delay: 500 + Math.random() * 500,
                callback: () => {
                    if (enemy.active) {
                        const smoke = scene.add.sprite(
                            enemy.x + getRandomInt(-10, 10),
                            enemy.y + getRandomInt(-10, 10),
                            'smoke_particle'
                        );
                        smoke.setDepth(4);
                        
                        scene.tweens.add({
                            targets: smoke,
                            alpha: { from: 0.3, to: 0 },
                            scale: { from: 0.5, to: 1.5 },
                            y: smoke.y - 15 - Math.random() * 10,
                            duration: 1000 + Math.random() * 500,
                            onComplete: () => smoke.destroy()
                        });
                    }
                },
                loop: true
            });
            break;
            
        case 2: // Brujo - aura mágica
            // Aura de energía
            const auraGraphic = scene.add.graphics();
            auraGraphic.fillStyle(0xd35400, 0.2);
            auraGraphic.fillCircle(0, 0, 25);
            
            const auraTexture = auraGraphic.generateTexture('aura', 50, 50);
            auraGraphic.destroy();
            
            const aura = scene.add.sprite(enemy.x, enemy.y, 'aura');
            aura.setDepth(3);
            
            // Animación de aura
            scene.tweens.add({
                targets: aura,
                alpha: { from: 0.1, to: 0.3 },
                scale: { from: 0.8, to: 1.2 },
                duration: 1500,
                yoyo: true,
                repeat: -1
            });
            
            // Hacer que el aura siga al enemigo
            scene.time.addEvent({
                delay: 50,
                callback: () => {
                    if (enemy.active) {
                        aura.x = enemy.x;
                        aura.y = enemy.y;
                    } else {
                        aura.destroy();
                    }
                },
                loop: true
            });
            break;
            
        case 5: // Espectro - brillo fantasmal
            // Efecto de brillo
            scene.tweens.add({
                targets: enemy,
                alpha: { from: 0.7, to: 1 },
                duration: 1500,
                yoyo: true,
                repeat: -1
            });
            
            // Rotación lenta
            scene.tweens.add({
                targets: enemy,
                angle: 360,
                duration: 15000,
                repeat: -1
            });
            break;
    }
    
    // Para todos los enemigos de alto nivel, añadir un efecto visual
    if (level >= 3) {
        // Brillo de nivel
        const glowColor = [0xff0000, 0xffff00, 0x00ffff, 0xff00ff][level % 4];
        const glowGraphic = scene.add.graphics();
        glowGraphic.lineStyle(2, glowColor, 0.5);
        glowGraphic.strokeCircle(0, 0, CONFIG.tileSize/1.5);
        
        const glowTexture = glowGraphic.generateTexture('enemy_glow_' + level, CONFIG.tileSize * 2, CONFIG.tileSize * 2);
        glowGraphic.destroy();
        
        const glow = scene.add.sprite(enemy.x, enemy.y, 'enemy_glow_' + level);
        glow.setDepth(4);
        
        // Animación del brillo
        scene.tweens.add({
            targets: glow,
            scale: { from: 0.9, to: 1.1 },
            alpha: { from: 0.3, to: 0.5 },
            duration: 1000,
            yoyo: true,
            repeat: -1
        });
        
        // Hacer que el brillo siga al enemigo
        scene.time.addEvent({
            delay: 50,
            callback: () => {
                if (enemy.active) {
                    glow.x = enemy.x;
                    glow.y = enemy.y;
                } else {
                    glow.destroy();
                }
            },
            loop: true
        });
    }
}moveTo(-size/3, size/3);
                enemyGraphic.lineTo(size/3, -size/3);
                enemyGraphic.strokePath();
            }
            break;
            
        case 'octagon':
            // Octágono (guardián)
            enemyGraphic.beginPath();
            for (let i = 0; i < 8; i++) {
                const angle = (Math.PI / 4) * i;
                const px = Math.sin(angle) * (size/1.3);
                const py = Math.cos(angle) * (size/1.3);
                if (i === 0) {
                    enemyGraphic.moveTo(px, py);
                } else {
                    enemyGraphic.lineTo(px, py);
                }
            }
            enemyGraphic.closePath();
            enemyGraphic.fillPath();
            
            // Detalles
            if (enemyType.details) {
                // Escudo central
                enemyGraphic.fillStyle(0x000000, 0.5);
                enemyGraphic.fillCircle(0, 0, size/3);
                
                // Símbolo
                enemyGraphic.fillStyle(0xffffff, 0.7);
                enemyGraphic.fillRect(-size/6, -size/6, size/3, size/3);
            }
            break;
            
        case 'star':
            // Estrella (espectro)
            enemyGraphic.beginPath();
            const points = 5;
            const innerRadius = size/2;
            const outerRadius = size/1.2;
            
            for (let i = 0; i < points * 2; i++) {
                const radius = i % 2 === 0 ? outerRadius : innerRadius;
                const angle = (Math.PI * 2 / (points * 2)) * i - Math.PI/2;
                const px = Math.cos(angle) * radius;
                const py = Math.sin(angle) * radius;
                
                if (i === 0) {
                    enemyGraphic.moveTo(px, py);
                } else {
                    enemyGraphic.lineTo(px, py);
                }
            }
            
            enemyGraphic.closePath