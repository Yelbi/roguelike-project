/**
 * combatEffects.js
 * Funciones para efectos visuales de combate (ataques, daños y muertes)
 */

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

// Exportar funciones
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        createAttackEffect,
        createPlayerAttackEffect,
        attackEnemy,
        enemyAttack,
        defeatEnemy
    };
}