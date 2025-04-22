/**
 * Crea un efecto visual de ataque personalizado
 */
function createAttackEffect(scene, enemy, player, opts) {
    // Opciones por defecto
    const options = Object.assign({
        color: 0xff0000,
        shape: 'circle',
        size: 40,
        duration: 300,
        particles: false
    }, opts);
    
    // Crear gráfico para el efecto
    const attackGraphic = scene.add.graphics();
    
    // Dibujar forma según el tipo
    switch (options.shape) {
        case 'circle':
            // Círculos concéntricos
            attackGraphic.fillStyle(options.color, 0.8);
            attackGraphic.fillCircle(0, 0, options.size/2);
            
            attackGraphic.fillStyle(0xffffff, 0.6);
            attackGraphic.fillCircle(0, 0, options.size/3);
            
            attackGraphic.fillStyle(options.color, 0.9);
            attackGraphic.fillCircle(0, 0, options.size/6);
            break;
            
        case 'square':
            // Cuadrado con marco
            attackGraphic.fillStyle(options.color, 0.8);
            attackGraphic.fillRect(-options.size/2, -options.size/2, options.size, options.size);
            
            attackGraphic.lineStyle(3, 0xffffff, 0.7);
            attackGraphic.strokeRect(-options.size/3, -options.size/3, options.size*2/3, options.size*2/3);
            break;
            
        case 'star':
            // Estrella mágica
            attackGraphic.fillStyle(options.color, 0.8);
            
            // Dibujar estrella
            const points = 5;
            const innerRadius = options.size/3;
            const outerRadius = options.size/1.5;
            
            attackGraphic.beginPath();
            for (let i = 0; i < points * 2; i++) {
                const radius = i % 2 === 0 ? outerRadius : innerRadius;
                const angle = (Math.PI * 2 / (points * 2)) * i;
                const px = Math.cos(angle) * radius;
                const py = Math.sin(angle) * radius;
                
                if (i === 0) {
                    attackGraphic.moveTo(px, py);
                } else {
                    attackGraphic.lineTo(px, py);
                }
            }
            
            attackGraphic.closePath();
            attackGraphic.fillPath();
            
            // Círculo central
            attackGraphic.fillStyle(0xffffff, 0.7);
            attackGraphic.fillCircle(0, 0, options.size/6);
            break;
            
        case 'line':
            // Línea de ataque (corte rápido)
            attackGraphic.lineStyle(4, options.color, 0.8);
            attackGraphic.beginPath();
            attackGraphic.moveTo(-options.size/2, -options.size/2);
            attackGraphic.lineTo(options.size/2, options.size/2);
            attackGraphic.strokePath();
            
            // Segunda línea perpendicular
            attackGraphic.lineStyle(3, 0xffffff, 0.6);
            attackGraphic.beginPath();
            attackGraphic.moveTo(options.size/3, -options.size/3);
            attackGraphic.lineTo(-options.size/3, options.size/3);
            attackGraphic.strokePath();
            break;
            
        case 'shock':
            // Onda de choque
            attackGraphic.lineStyle(5, options.color, 0.7);
            attackGraphic.strokeCircle(0, 0, options.size/2.5);
            
            attackGraphic.lineStyle(3, 0xffffff, 0.5);
            attackGraphic.strokeCircle(0, 0, options.size/1.8);
            
            attackGraphic.lineStyle(2, options.color, 0.6);
            attackGraphic.strokeCircle(0, 0, options.size/1.3);
            break;
            
        case 'wave':
            // Onda fantasmal
            for (let i = 0; i < 3; i++) {
                const alpha = 0.7 - (i * 0.2);
                const size = options.size - (i * 10);
                
                attackGraphic.lineStyle(3 - i, options.color, alpha);
                attackGraphic.beginPath();
                
                for (let j = 0; j < 20; j++) {
                    const angle = (j / 20) * Math.PI * 2;
                    const radius = size/2 + Math.sin(j * 0.5) * 5;
                    const px = Math.cos(angle) * radius;
                    const py = Math.sin(angle) * radius;
                    
                    if (j === 0) {
                        attackGraphic.moveTo(px, py);
                    } else {
                        attackGraphic.lineTo(px, py);
                    }
                }
                
                attackGraphic.closePath();
                attackGraphic.strokePath();
            }
            break;
            
        default:
            // Forma por defecto (círculo)
            attackGraphic.fillStyle(options.color, 0.8);
            attackGraphic.fillCircle(0, 0, options.size/2);
    }
    
    // Generar textura para el ataque
    const attackTextureKey = `enemy_attack_${options.shape}_${options.color}`;
    if (!scene.textures.exists(attackTextureKey)) {
        attackGraphic.generateTexture(attackTextureKey, options.size * 2, options.size * 2);
    }
    attackGraphic.destroy();
    
    // Crear el sprite del ataque
    const attackFx = scene.add.sprite(player.x, player.y, attackTextureKey);
    attackFx.setScale(0.5);
    attackFx.setDepth(15);
    
    // Animación de la explosión
    scene.tweens.add({
        targets: attackFx,
        scale: 1.3,
        alpha: 0,
        duration: options.duration,
        onComplete: () => {
            attackFx.destroy();
        }
    });
    
    // Añadir partículas si está activado
    if (options.particles) {
        // Crear gráfico para las partículas
        const particleGraphic = scene.add.graphics();
        particleGraphic.fillStyle(options.color, 0.8);
        particleGraphic.fillCircle(0, 0, 5);
        
        const particleTextureKey = `attack_particle_${options.color}`;
        if (!scene.textures.exists(particleTextureKey)) {
            particleGraphic.generateTexture(particleTextureKey, 10, 10);
        }
        particleGraphic.destroy();
        
        // Crear varias partículas
        for (let i = 0; i < 6; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 2;
            const distance = 10 + Math.random() * 20;
            
            const particleX = player.x + Math.cos(angle) * distance;
            const particleY = player.y + Math.sin(angle) * distance;
            
            const particle = scene.add.sprite(particleX, particleY, particleTextureKey);
            particle.setDepth(14);
            particle.setAlpha(0.7);
            
            // Animación de la partícula
            scene.tweens.add({
                targets: particle,
                x: particleX + Math.cos(angle) * 30 * speed,
                y: particleY + Math.sin(angle) * 30 * speed,
                alpha: 0,
                scale: 0.5,
                duration: options.duration * 1.2,
                onComplete: () => {
                    particle.destroy();
                }
            });
        }
    }
}

/**
 * Ataca a un enemigo desde el jugador con efectos visuales mejorados
 */
function attackEnemy(scene, enemy) {
    // Calcular daño basado en estadísticas
    const baseDamage = gameState.playerStats.attack;
    const defense = enemy.defense;
    const damage = Math.max(1, baseDamage - defense);
    
    // Probabilidad de golpe crítico basada en nivel del jugador
    const critChance = 0.05 + (gameState.playerStats.level * 0.01); // 5% base + 1% por nivel
    const isCrit = Math.random() < critChance;
    
    // Calcular daño final
    const finalDamage = isCrit ? Math.floor(damage * 1.5) : damage;
    
    // Crear efecto personalizado según nivel del jugador
    let playerAttackColor, playerAttackShape, playerAttackSize;
    
    // Color según nivel
    if (gameState.playerStats.level < 3) {
        playerAttackColor = 0x3498db; // Azul básico
    } else if (gameState.playerStats.level < 6) {
        playerAttackColor = 0x2ecc71; // Verde medio
    } else if (gameState.playerStats.level < 10) {
        playerAttackColor = 0xf1c40f; // Amarillo alto
    } else {
        playerAttackColor = 0xe74c3c; // Rojo épico
    }
    
    // Forma según nivel
    if (gameState.playerStats.level < 5) {
        playerAttackShape = 'circle';
        playerAttackSize = 40;
    } else if (gameState.playerStats.level < 10) {
        playerAttackShape = 'star';
        playerAttackSize = 50;
    } else {
        playerAttackShape = 'shock';
        playerAttackSize = 60;
    }
    
    // Crear animación de ataque mejorada
    createPlayerAttackEffect(scene, enemy.sprite, {
        color: playerAttackColor,
        shape: playerAttackShape,
        size: playerAttackSize,
        duration: 350,
        isCrit: isCrit
    });
    
    // Reproducir sonido
    scene.sounds.hit();
    
    // Aplicar daño
    enemy.health -= finalDamage;
    
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
    if (isCrit) {
        addMessage(`¡Golpe crítico! Causas ${finalDamage} puntos de daño.`, "combat");
    } else {
        addMessage(`Atacas al enemigo y causas ${finalDamage} puntos de daño.`, "combat");
    }
    
    // Comprobar si el enemigo ha muerto
    if (enemy.health <= 0) {
        defeatEnemy(scene, enemy);
    }
}

/**
 * Crea un efecto visual para el ataque del jugador
 */
function createPlayerAttackEffect(scene, target, opts) {
    // Opciones por defecto
    const options = Object.assign({
        color: 0x3498db,
        shape: 'circle',
        size: 40,
        duration: 350,
        isCrit: false
    }, opts);
    
    // Crear gráfico para el efecto
    const attackGraphic = scene.add.graphics();
    
    // Dibujar forma según el tipo (similar a createAttackEffect pero para el jugador)
    switch (options.shape) {
        case 'circle':
            // Círculos concéntricos
            attackGraphic.fillStyle(options.color, 0.8);
            attackGraphic.fillCircle(0, 0, options.size/2);
            
            attackGraphic.fillStyle(0xffffff, 0.6);
            attackGraphic.fillCircle(0, 0, options.size/3);
            
            attackGraphic.fillStyle(options.color, 0.9);
            attackGraphic.fillCircle(0, 0, options.size/6);
            break;
            
        case 'star':
            // Estrella mágica
            attackGraphic.fillStyle(options.color, 0.8);
            
            // Dibujar estrella
            const points = 5;
            const innerRadius = options.size/3;
            const outerRadius = options.size/1.5;
            
            attackGraphic.beginPath();
            for (let i = 0; i < points * 2; i++) {
                const radius = i % 2 === 0 ? outerRadius : innerRadius;
                const angle = (Math.PI * 2 / (points * 2)) * i;
                const px = Math.cos(angle) * radius;
                const py = Math.sin(angle) * radius;
                
                if (i === 0) {
                    attackGraphic.moveTo(px, py);
                } else {
                    attackGraphic.lineTo(px, py);
                }
            }
            
            attackGraphic.closePath();
            attackGraphic.fillPath();
            
            // Círculo central
            attackGraphic.fillStyle(0xffffff, 0.7);
            attackGraphic.fillCircle(0, 0, options.size/6);
            break;
            
        case 'shock':
            // Onda de choque
            attackGraphic.lineStyle(5, options.color, 0.7);
            attackGraphic.strokeCircle(0, 0, options.size/2.5);
            
            attackGraphic.lineStyle(3, 0xffffff, 0.5);
            attackGraphic.strokeCircle(0, 0, options.size/1.8);
            
            attackGraphic.lineStyle(2, options.color, 0.6);
            attackGraphic.strokeCircle(0, 0, options.size/1.3);
            break;
            
        default:
            // Forma por defecto (círculo)
            attackGraphic.fillStyle(options.color, 0.8);
            attackGraphic.fillCircle(0, 0, options.size/2);
    }
    
    // Si es crítico, añadir efectos adicionales
    if (options.isCrit) {
        attackGraphic.lineStyle(4, 0xffffff, 0.8);
        attackGraphic.strokeCircle(0, 0, options.size/1.8);
        
        // Estrellas de crítico
        for (let i = 0; i < 4; i++) {
            const angle = (Math.PI / 2) * i;
            const distance = options.size / 1.5;
            const starX = Math.cos(angle) * distance;
            const starY = Math.sin(angle) * distance;
            
            attackGraphic.fillStyle(0xffffff, 0.9);
            attackGraphic.beginPath();
            
            for (let j = 0; j < 10; j++) {
                const starAngle = (Math.PI * 2 / 10) * j;
                const starRadius = j % 2 === 0 ? 4 : 2;
                const px = starX + Math.cos(starAngle) * starRadius;
                const py = starY + Math.sin(starAngle) * starRadius;
                
                if (j === 0) {
                    attackGraphic.moveTo(px, py);
                } else {
                    attackGraphic.lineTo(px, py);
                }
            }
            
            attackGraphic.closePath();
            attackGraphic.fillPath();
        }
    }
    
    // Generar textura para el ataque
    const attackTextureKey = `player_attack_${options.shape}_${options.isCrit ? 'crit_' : ''}${options.color}`;
    if (!scene.textures.exists(attackTextureKey)) {
        attackGraphic.generateTexture(attackTextureKey, options.size * 2, options.size * 2);
    }
    attackGraphic.destroy();
    
    // Crear el sprite del ataque
    const attackFx = scene.add.sprite(target.x, target.y, attackTextureKey);
    attackFx.setScale(options.isCrit ? 0.7 : 0.5);
    attackFx.setDepth(15);
    
    // Animación de la explosión
    scene.tweens.add({
        targets: attackFx,
        scale: options.isCrit ? 1.8 : 1.3,
        alpha: 0,
        duration: options.isCrit ? options.duration * 1.5 : options.duration,
        onComplete: () => {
            attackFx.destroy();
        }
    });
    
    // Añadir partículas adicionales para ataques críticos
    if (options.isCrit) {
        // Crear gráfico para las partículas
        const particleGraphic = scene.add.graphics();
        particleGraphic.fillStyle(0xffffff, 0.8);
        particleGraphic.fillCircle(0, 0, 5);
        
        const particleTexture = particleGraphic.generateTexture('player_crit_particle', 10, 10);
        particleGraphic.destroy();
        
        // Crear varias partículas en círculo
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 / 12) * i;
            const distance = options.size / 1.2;
            
            const particleX = target.x + Math.cos(angle) * distance;
            const particleY = target.y + Math.sin(angle) * distance;
            
            const particle = scene.add.sprite(particleX, particleY, 'player_crit_particle');
            particle.setDepth(14);
            particle.setAlpha(0.9);
            
            // Animación de la partícula
            scene.tweens.add({
                targets: particle,
                x: particleX + Math.cos(angle) * distance * 0.5,
                y: particleY + Math.sin(angle) * distance * 0.5,
                alpha: 0,
                scale: { from: 1, to: 2 },
                duration: 500,
                ease: 'Cubic.easeOut',
                onComplete: () => {
                    particle.destroy();
                }
            });
        }
        
        // Sacudir la cámara ligeramente para enfatizar el crítico
        scene.cameras.main.shake(100, 0.01);
    }
}

/**
 * Derrota a un enemigo con efectos visuales mejorados
 */
function defeatEnemy(scene, enemy) {
    // Reproducir sonido
    scene.sounds.enemyDeath();
    
    // Crear efecto de muerte según tipo de enemigo
    const deathEffectColor = [0xe74c3c, 0xc0392b, 0xd35400, 0xe67e22, 0xf39c12, 0x8e44ad][enemy.type % 6];
    
    // Gráfico para la explosión principal
    const explosionGraphic = scene.add.graphics();
    
    // Círculos concéntricos
    explosionGraphic.fillStyle(deathEffectColor, 0.7);
    explosionGraphic.fillCircle(0, 0, 30);
    
    explosionGraphic.fillStyle(0xffffff, 0.8);
    explosionGraphic.fillCircle(0, 0, 20);
    
    explosionGraphic.fillStyle(deathEffectColor, 0.9);
    explosionGraphic.fillCircle(0, 0, 10);
    
    // Generar textura para la explosión
    const explosionTextureKey = `enemy_death_${enemy.type}`;
    if (!scene.textures.exists(explosionTextureKey)) {
        explosionGraphic.generateTexture(explosionTextureKey, 60, 60);
    }
    explosionGraphic.destroy();
    
    // Crear el sprite de la explosión
    const explosion = scene.add.sprite(enemy.sprite.x, enemy.sprite.y, explosionTextureKey);
    explosion.setScale(0.5);
    explosion.depth = 15;
    
    // Animación de la explosión con tiempo variable según nivel del enemigo
    const explosionDuration = 500 + (enemy.level * 50);
    
    scene.tweens.add({
        targets: explosion,
        scale: 2 + (enemy.level * 0.2),
        alpha: 0,
        duration: explosionDuration,
        ease: 'Power2',
        onComplete: () => {
            explosion.destroy();
        }
    });
    
    // Añadir partículas que salen disparadas
    const particleCount = 10 + (enemy.level * 2);
    
    // Crear gráfico para las partículas
    const particleGraphic = scene.add.graphics();
    particleGraphic.fillStyle(deathEffectColor, 0.7);
    particleGraphic.fillCircle(0, 0, 4);
    
    const particleTexture = particleGraphic.generateTexture(`enemy_death_particle_${enemy.type}`, 8, 8);
    particleGraphic.destroy();
    
    // Crear partículas
    for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.5 + Math.random() * 1.5;
        const distance = 30 + Math.random() * 70;
        
        const particleX = enemy.sprite.x;
        const particleY = enemy.sprite.y;
        
        const particle = scene.add.sprite(particleX, particleY, `enemy_death_particle_${enemy.type}`);
        particle.setDepth(14);
        
        // Animación de la partícula
        scene.tweens.add({
            targets: particle,
            x: particleX + Math.cos(angle) * distance * speed,
            y: particleY + Math.sin(angle) * distance * speed,
            alpha: 0,
            scale: { from: 1, to: 0.5 },
            duration: 300 + Math.random() * 500,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                particle.destroy();
            }
        });
    }
    
    // Onda expansiva
    const shockwaveGraphic = scene.add.graphics();
    shockwaveGraphic.lineStyle(2, deathEffectColor, 0.5);
    shockwaveGraphic.strokeCircle(0, 0, 30);
    
    const shockwaveTexture = shockwaveGraphic.generateTexture(`enemy_shockwave_${enemy.type}`, 60, 60);
    shockwaveGraphic.destroy();
    
    const shockwave = scene.add.sprite(enemy.sprite.x, enemy.sprite.y, `enemy_shockwave_${enemy.type}`);
    shockwave.setDepth(13);
    
    scene.tweens.add({
        targets: shockwave,
        scale: 3,
        alpha: 0,
        duration: explosionDuration * 1.2,
        ease: 'Cubic.easeOut',
        onComplete: () => {
            shockwave.destroy();
        }
    });
    
    // Mostrar mensaje de XP con animación
    const xpGained = enemy.xpReward;
    const xpText = scene.add.text(
        enemy.sprite.x, 
        enemy.sprite.y - 20, 
        `+${xpGained} XP`, 
        { 
            fontFamily: 'Arial', 
            fontSize: 16 + (enemy.level), 
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4,
            align: 'center'
        }
    );
    xpText.setOrigin(0.5);
    xpText.setDepth(20);
    
    // Animación del texto
    scene.tweens.add({
        targets: xpText,
        y: xpText.y - 40,
        alpha: 0,
        scale: 1.2,
        duration: 1200,
        ease: 'Cubic.easeOut',
        onComplete: () => xpText.destroy()
    });
    
    // Eliminar enemigo
    if (enemy.healthBar) {
        if (typeof enemy.healthBar.destroy === 'function') {
            enemy.healthBar.destroy();
        } else {
            enemy.healthBar.clear();
        }
    }
    
    if (enemy.sprite) enemy.sprite.destroy();
    gameState.enemies = gameState.enemies.filter(e => e !== enemy);
    
    // Incrementar contador de enemigos derrotados
    gameState.enemiesKilled++;
    
    // Ganar experiencia
    gameState.playerStats.xp += xpGained;
    
    // Mensaje
    addMessage(`Has derrotado al ${enemy.name} nivel ${enemy.level} y ganas ${xpGained} puntos de experiencia.`, "combat");
    
    // Comprobar subida de nivel
    checkLevelUp();
    
    // Actualizar UI
    updateUI();
    
    // Posibilidad de soltar objeto (aumenta con nivel del enemigo)
    const dropChance = 30 + (enemy.level * 3); // Base 30% + 3% por nivel
    if (getRandomInt(1, 100) <= dropChance) {
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
        
        if (distance < 50) { // Radio de ataque ligeramente aumentado
            nearbyEnemies.push(enemy);
        }
    }
    
    if (nearbyEnemies.length > 0) {
        // Si hay múltiples enemigos, ordenarlos por distancia
        if (nearbyEnemies.length > 1) {
            nearbyEnemies.sort((a, b) => {
                const distA = Phaser.Math.Distance.Between(
                    player.x, player.y, a.sprite.x, a.sprite.y
                );
                const distB = Phaser.Math.Distance.Between(
                    player.x, player.y, b.sprite.x, b.sprite.y
                );
                return distA - distB;
            });
        }
        
        // Atacar al enemigo más cercano
        attackEnemy(scene, nearbyEnemies[0]);
        
        // Crear línea de ataque desde el jugador al enemigo (efecto visual adicional)
        const lineGraphic = scene.add.graphics();
        lineGraphic.lineStyle(2, 0xffffff, 0.5);
        lineGraphic.beginPath();
        lineGraphic.moveTo(player.x, player.y);
        lineGraphic.lineTo(nearbyEnemies[0].sprite.x, nearbyEnemies[0].sprite.y);
        lineGraphic.strokePath();
        lineGraphic.setDepth(8);
        
        // Animar la línea de ataque
        scene.tweens.add({
            targets: lineGraphic,
            alpha: 0,
            duration: 150,
            onComplete: () => {
                lineGraphic.destroy();
            }
        });
        
        return true;
    }
    
    // Comprobar interacción con otros elementos
    // Por ejemplo, interactuar con escaleras o elementos del escenario
    return false;
}/**
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
}

/**
 * Actualiza la lógica de los enemigos con mejores animaciones
 */
function updateEnemies(scene, player) {
    const currentTime = scene.time.now;
    
    for (const enemy of gameState.enemies) {
        // Actualizar barra de salud
        if (enemy.healthBar && typeof enemy.healthBar.update === 'function') {
            enemy.healthBar.update();
        }
        
        // Mover enemigo cada cierto tiempo
        if (currentTime - enemy.lastMove > 1000 + getRandomInt(-200, 200)) {
            // Asegurarnos de que el sprite existe
            if (!enemy.sprite || !enemy.sprite.active) continue;
            
            const distance = Phaser.Math.Distance.Between(
                enemy.sprite.x, enemy.sprite.y,
                player.x, player.y
            );
            
            // Si el jugador está cerca, perseguirlo
            if (distance < 250) {
                // Calcular dirección hacia el jugador
                const angle = Phaser.Math.Angle.Between(
                    enemy.sprite.x, enemy.sprite.y,
                    player.x, player.y
                );
                
                // Velocidad basada en nivel y tipo de enemigo
                const baseSpeed = 40 + (enemy.level * 2);
                const typeSpeedMultiplier = [1.2, 0.9, 0.7, 1.3, 0.8, 1.1][enemy.type % 6];
                const speed = baseSpeed * typeSpeedMultiplier;
                
                const velocityX = Math.cos(angle) * speed;
                const velocityY = Math.sin(angle) * speed;
                
                enemy.sprite.setVelocity(velocityX, velocityY);
                
                // Añadir efecto visual de persecución
                if (Math.random() > 0.7) {
                    addMovementEffect(scene, enemy, angle, true);
                }
            } else {
                // Movimiento aleatorio
                const direction = getRandomInt(0, 3);
                const baseSpeed = 40;
                const speed = baseSpeed + (enemy.level * 2);
                
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
                
                // Añadir efecto visual de movimiento aleatorio
                if (Math.random() > 0.8) {
                    const moveAngle = [Math.PI * 1.5, 0, Math.PI * 0.5, Math.PI][direction];
                    addMovementEffect(scene, enemy, moveAngle, false);
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
            
            // Añadir animación de movimiento
            if (!enemy.isMoving) {
                enemy.isMoving = true;
                scene.tweens.add({
                    targets: enemy.sprite,
                    scaleX: 0.85,
                    scaleY: 0.85,
                    duration: 200,
                    yoyo: true,
                    repeat: 2,
                    onComplete: () => {
                        if (enemy.sprite && enemy.sprite.active) {
                            enemy.isMoving = false;
                        }
                    }
                });
            }
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
 * Añade efecto visual al movimiento de los enemigos
 */
function addMovementEffect(scene, enemy, angle, isChasing) {
    // Si el enemigo no está activo, no hacer nada
    if (!enemy.sprite || !enemy.sprite.active) return;
    
    // Crear efecto según tipo de enemigo
    let effectColor, effectAlpha;
    
    if (isChasing) {
        // Efecto de persecución - más intenso
        effectColor = 0xff4d4d;
        effectAlpha = 0.4;
    } else {
        // Efecto normal de movimiento
        effectColor = [0xe74c3c, 0xc0392b, 0xd35400, 0xe67e22, 0xf39c12, 0x8e44ad][enemy.type % 6];
        effectAlpha = 0.2;
    }
    
    // Crear gráfico para el efecto
    const effectGraphic = scene.add.graphics();
    effectGraphic.fillStyle(effectColor, effectAlpha);
    
    // Tamaño basado en el nivel del enemigo
    const size = CONFIG.tileSize * 0.4 * (1 + (enemy.level * 0.05));
    
    // Dibujar una estela detrás del enemigo
    effectGraphic.fillCircle(0, 0, size);
    
    // Generar textura
    const effectTexture = effectGraphic.generateTexture('movement_effect_' + enemy.type, size * 2, size * 2);
    effectGraphic.destroy();
    
    // Posición donde aparecerá el efecto (ligeramente detrás del enemigo)
    const offsetDistance = size * 0.8;
    const effectX = enemy.sprite.x - Math.cos(angle) * offsetDistance;
    const effectY = enemy.sprite.y - Math.sin(angle) * offsetDistance;
    
    // Crear sprite para el efecto
    const effect = scene.add.sprite(effectX, effectY, 'movement_effect_' + enemy.type);
    effect.setDepth(3);
    effect.setAlpha(effectAlpha);
    
    // Animación de desvanecimiento
    scene.tweens.add({
        targets: effect,
        alpha: 0,
        scale: 0.5,
        duration: 300,
        onComplete: () => effect.destroy()
    });
}

/**
 * Ataca al jugador desde un enemigo con efectos mejorados
 */
function enemyAttack(scene, enemy, player) {
    // Calcular daño
    const baseDamage = enemy.attack;
    const defense = gameState.playerStats.defense;
    const damage = Math.max(1, baseDamage - defense);
    
    // Crear animación de ataque avanzada según tipo de enemigo
    let attackEffectKey = 'enemy_attack';
    
    switch (enemy.type % 6) {
        case 0: // Sombra - ataque de energía oscura
            createAttackEffect(scene, enemy, player, {
                color: 0xe74c3c,
                shape: 'circle',
                size: 40,
                duration: 300,
                particles: true
            });
            break;
            
        case 1: // Centinela - ataque cuadrado
            createAttackEffect(scene, enemy, player, {
                color: 0xc0392b,
                shape: 'square',
                size: 35,
                duration: 350,
                particles: false
            });
            break;
            
        case 2: // Brujo - ataque mágico
            createAttackEffect(scene, enemy, player, {
                color: 0xd35400,
                shape: 'star',
                size: 45,
                duration: 400,
                particles: true
            });
            break;
            
        case 3: // Asesino - ataque rápido
            createAttackEffect(scene, enemy, player, {
                color: 0xe67e22,
                shape: 'line',
                size: 50,
                duration: 250,
                particles: false
            });
            break;
            
        case 4: // Guardián - golpe fuerte
            createAttackEffect(scene, enemy, player, {
                color: 0xf39c12,
                shape: 'shock',
                size: 60,
                duration: 450,
                particles: true
            });
            break;
            
        case 5: // Espectro - ataque fantasmal
            createAttackEffect(scene, enemy, player, {
                color: 0x8e44ad,
                shape: 'wave',
                size: 55,
                duration: 500,
                particles: true
            });
            break;
            
        default:
            // Ataque genérico para otros tipos
            createAttackEffect(scene, enemy, player, {
                color: 0xff0000,
                shape: 'circle',
                size: 40,
                duration: 300,
                particles: false
            });
    }
    
    // Reproducir sonido
    scene.sounds.hit();
    
    // Aplicar daño
    gameState.playerStats.health -= damage;
    
    // Sacudir la cámara con intensidad según el daño
    const shakeIntensity = Math.min(0.03, 0.01 + (damage * 0.002));
    scene.cameras.main.shake(100, shakeIntensity);
    
    // Mensaje
    const enemyNameDisplay = enemy.name || "Enemigo";
    addMessage(`${enemyNameDisplay} te ataca y causa ${damage} puntos de daño.`, "combat");
    
    // Actualizar UI
    updateUI();
    
    // Comprobar si el jugador ha muerto
    if (gameState.playerStats.health <= 0) {
        playerDeath(scene);
    }
}