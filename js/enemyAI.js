/**
 * enemyAI.js
 * Funciones para la inteligencia artificial y comportamiento de los enemigos
 */

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
}

// Exportar funciones
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        updateEnemies,
        addMovementEffect,
        checkInteraction
    };
}