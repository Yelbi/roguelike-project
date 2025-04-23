/**
 * Parches para resolver errores y mejorar el rendimiento del juego
 * Mazmorra Infinita
 */

// ===== PARCHE 1: Optimizar el TextureManager =====
// Modificar textureManager.js para incluir willReadFrequently y mejor manejo de errores

const TextureManagerPatch = {
    getTexture: function(scene, key, width, height, renderFunction) {
        if (scene.textures.exists(key)) {
            return key;
        }
        
        try {
            // Crear un gráfico con willReadFrequently=true para optimizar operaciones de getImageData
            const graphic = scene.add.graphics({
                willReadFrequently: true
            });
            
            // Ejecutar la función de renderizado
            renderFunction(graphic);
            
            // Generar textura
            graphic.generateTexture(key, width, height);
            graphic.destroy();
            
            // Verificar que la textura se haya creado correctamente
            if (!scene.textures.exists(key)) {
                console.warn(`No se pudo crear la textura: ${key}`);
                return null;
            }
            
            return key;
        } catch (error) {
            console.error(`Error al generar textura ${key}:`, error);
            return null;
        }
    },
    
    // Resto de los métodos originales...
    createAttackTexture: function(scene, shape, color, isCrit = false, size = 40) {
        const key = `attack_${shape}_${color}_${isCrit ? 'crit' : 'normal'}`;
        
        return this.getTexture(scene, key, size * 2, size * 2, (graphic) => {
            // Base de la forma
            switch (shape) {
                case 'circle':
                    graphic.fillStyle(color, 0.8);
                    graphic.fillCircle(size, size, size/2);
                    graphic.fillStyle(0xffffff, 0.6);
                    graphic.fillCircle(size, size, size/3);
                    break;
                case 'square':
                    graphic.fillStyle(color, 0.8);
                    graphic.fillRect(size/2, size/2, size, size);
                    break;
                // Otros casos...
            }
            
            // Añadir efectos para críticos
            if (isCrit) {
                graphic.lineStyle(4, 0xffffff, 0.8);
                graphic.strokeCircle(size, size, size/1.8);
            }
        });
    }
};

// ===== PARCHE 2: Función de utilidad para crear gráficos de manera segura =====
function createSafeGraphics(scene, options = {}) {
    // Asegurar que willReadFrequently esté activado
    const graphicOptions = { 
        ...options, 
        willReadFrequently: true 
    };
    
    return scene.add.graphics(graphicOptions);
}

// ===== PARCHE 3: Función para generar texturas de manera segura =====
function generateSafeTexture(scene, graphic, key, width, height) {
    try {
        // Verificar si ya existe la textura
        if (scene.textures.exists(key)) {
            graphic.destroy();
            return key;
        }
        
        // Generar la textura y destruir el gráfico
        graphic.generateTexture(key, width, height);
        graphic.destroy();
        
        // Verificar que la textura se haya creado correctamente
        if (!scene.textures.exists(key)) {
            console.warn(`Falló la generación de textura: ${key}`);
            return null;
        }
        
        return key;
    } catch (error) {
        console.error(`Error al generar textura ${key}:`, error);
        if (graphic && !graphic.destroyed) {
            graphic.destroy();
        }
        return null;
    }
}

// ===== PARCHE 4: Función mejorada para crear partículas =====
function createSafeParticles(scene, textureKey, config = {}) {
    // Verificar que la textura exista antes de crear partículas
    if (!scene.textures.exists(textureKey)) {
        console.warn(`Intento de crear partículas con textura inexistente: ${textureKey}`);
        return null;
    }
    
    try {
        return scene.add.particles(textureKey, config);
    } catch (error) {
        console.error(`Error al crear partículas con textura ${textureKey}:`, error);
        return null;
    }
}

// ===== PARCHE 5: Corregir el código de createPlayer para evitar nulls =====
function applyPlayerPatches(originalCreatePlayer) {
    return function(scene) {
        const player = originalCreatePlayer(scene);
        
        // Verificar si hay partículas
        if (player.particleEmitter && player.particles) {
            // Anular el método update para asegurar que no se accede a partículas después de destruirse
            const originalUpdate = scene.update;
            scene.update = function(...args) {
                // Si el jugador ya no está activo, detener y limpiar partículas
                if (!player.active && player.particleEmitter) {
                    player.particleEmitter.stop();
                    player.particleEmitter = null;
                }
                
                // Llamar al update original
                originalUpdate.apply(this, args);
            };
        }
        
        return player;
    };
}

// ===== PARCHE 6: Corregir los problemas de generación de enemigos =====
function applyEnemyCreationPatches(originalCreateEnemy) {
    return function(scene, x, y, enemyType, typeIndex, level) {
        try {
            // Usar nuestra función segura para crear gráficos
            const enemyGraphic = createSafeGraphics(scene);
            
            // Resto del código original de creación...
            // Color según tipo de enemigo
            enemyGraphic.fillStyle(enemyType.color, 1);
            
            // (Dibujar la forma según enemyType.shape como en el código original)
            // ... código de dibujo omitido para brevedad ...
            
            // Generar textura para el enemigo usando nuestra función segura
            const enemyTextureKey = `enemy_${typeIndex}_lvl_${level}_texture`;
            
            const textureKey = generateSafeTexture(
                scene, 
                enemyGraphic, 
                enemyTextureKey, 
                CONFIG.tileSize * 2, 
                CONFIG.tileSize * 2
            );
            
            // Verificar que la textura se haya creado correctamente
            if (!textureKey) {
                console.error(`No se pudo crear la textura enemyTextureKey para enemigo tipo ${typeIndex}`);
                // Usar textura de respaldo
                return createFallbackEnemy(scene, x, y, typeIndex, level);
            }
            
            // Resto del código original...
            // Crear sprite con físicas
            const enemy = scene.physics.add.sprite(x, y, enemyTextureKey);
            enemy.setScale(0.8 + (level * 0.03));
            enemy.depth = 5;
            
            // Resto del código de originalCreateEnemy...
            
            return enemy;
        } catch (error) {
            console.error("Error al crear enemigo:", error);
            return createFallbackEnemy(scene, x, y, typeIndex, level);
        }
    };
}

// Función de respaldo para crear un enemigo básico
function createFallbackEnemy(scene, x, y, typeIndex, level) {
    // Crear un enemigo muy básico con un círculo simple
    const fallbackGraphic = createSafeGraphics(scene);
    fallbackGraphic.fillStyle(0xff0000, 1);
    fallbackGraphic.fillCircle(0, 0, CONFIG.tileSize/2);
    
    const fallbackKey = `fallback_enemy_${Date.now()}`;
    generateSafeTexture(scene, fallbackGraphic, fallbackKey, CONFIG.tileSize, CONFIG.tileSize);
    
    // Crear sprite básico
    const enemy = scene.physics.add.sprite(x, y, fallbackKey);
    enemy.setScale(0.8);
    enemy.depth = 5;
    
    // Devolver datos mínimos del enemigo
    return {
        sprite: enemy,
        type: typeIndex,
        name: "Enemigo",
        level: level,
        health: 30 + (level * 10),
        maxHealth: 30 + (level * 10),
        attack: 5 + (level * 2),
        defense: 2 + Math.floor(level / 2),
        xpReward: 20 + (level * 10),
        lastMove: 0,
        lastAttack: 0
    };
}

// ===== PARCHE 7: Mejorar el manejo de partículas en general =====
function safeDestroyParticles(particleManager) {
    if (!particleManager) return;
    
    try {
        // Detener todos los emisores
        if (particleManager.emitters && particleManager.emitters.getAll) {
            const emitters = particleManager.emitters.getAll();
            emitters.forEach(emitter => {
                if (emitter && typeof emitter.stop === 'function') {
                    emitter.stop();
                }
            });
        }
        
        // Destruir el administrador de partículas
        if (typeof particleManager.destroy === 'function') {
            particleManager.destroy();
        }
    } catch (error) {
        console.error("Error al destruir partículas:", error);
    }
}

// ===== PARCHE 8: Mejorar el manejo de eventos de juego =====
// Modificación para GameScene para manejar mejor las transiciones
function patchGameScene() {
    const originalCreate = Phaser.Scene.prototype.create;
    
    Phaser.Scene.prototype.create = function() {
        // Llamar al método original
        originalCreate.apply(this, arguments);
        
        // Añadir un evento para limpiar recursos al cambiar de escena
        this.events.on('shutdown', function() {
            // Limpiar partículas
            if (this.particles) {
                safeDestroyParticles(this.particles);
            }
            
            // Detener todos los tweens
            this.tweens.killAll();
            
            // Limpiar texturas temporales
            // Esto debe hacerse con cuidado para no eliminar texturas que se reutilizan
            // Aquí simplemente lo mencionamos como una posibilidad
        }, this);
    };
}

// ===== PARCHE 9: Configuración para el juego en main.js =====
function patchGameConfig(originalConfig) {
    // Crear una configuración mejorada
    return {
        ...originalConfig,
        // Añadir opciones para mejorar el rendimiento
        render: {
            pixelArt: true,
            antialias: false,
            roundPixels: true,
            powerPreference: 'high-performance',
            // Asegurar que el canvas se configure correctamente
            batchSize: 512, // Valor predeterminado, puede ajustarse
            clearBeforeRender: true,
            premultipliedAlpha: true,
            // Esta es la clave para el aviso willReadFrequently
            willReadFrequently: true
        },
        callbacks: {
            preBoot: function(game) {
                console.log('preBoot: Phaser está iniciando');
                // Aplicar configuración willReadFrequently al canvas del juego
                if (game.canvas) {
                    const ctx = game.canvas.getContext('2d', { willReadFrequently: true });
                    if (ctx) {
                        // Asignar el contexto optimizado
                        game.canvas.getContext = function(type) {
                            return ctx;
                        };
                    }
                }
            },
            postBoot: function(game) {
                console.log('postBoot: Phaser ha iniciado completamente');
            }
        }
    };
}

// ===== INSTALACIÓN DE PARCHES =====
// Esta función debe ser llamada al inicio del juego
function installPatches() {
    console.log("Instalando parches para el juego...");
    
    // 1. Reemplazar TextureManager
    if (window.TextureManager) {
        Object.assign(window.TextureManager, TextureManagerPatch);
        console.log("- TextureManager parchado");
    }
    
    // 2. Patch para createPlayer
    if (window.createPlayer) {
        window.createPlayer = applyPlayerPatches(window.createPlayer);
        console.log("- createPlayer parchado");
    }
    
    // 3. Patch para createEnemy
    if (window.createEnemy) {
        window.createEnemy = applyEnemyCreationPatches(window.createEnemy);
        console.log("- createEnemy parchado");
    }
    
    // 4. Patch para GameScene
    patchGameScene();
    console.log("- GameScene parchado");
    
    // 5. Exponer funciones de utilidad
    window.createSafeGraphics = createSafeGraphics;
    window.generateSafeTexture = generateSafeTexture;
    window.createSafeParticles = createSafeParticles;
    window.safeDestroyParticles = safeDestroyParticles;
    
    // 6. Parchear la configuración del juego
    const originalGameConfig = window.gameConfig || {};
    window.gameConfig = patchGameConfig(originalGameConfig);
    console.log("- gameConfig parchado");
    
    console.log("Todos los parches instalados correctamente");
}

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        installPatches,
        TextureManagerPatch,
        createSafeGraphics,
        generateSafeTexture,
        createSafeParticles,
        safeDestroyParticles
    };
}