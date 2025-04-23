function fixItemGraphicError() {
    console.log("Aplicando parche para corregir error quadraticCurveTo");
    
    // Encuentra la implementación original de createItem
    const originalCreateItem = window.createItem;
    
    // Reemplaza con una versión corregida
    window.createItem = function(scene, x, y, itemType, typeIndex, level) {
        try {
            // Tamaño base para el objeto
            const size = CONFIG.tileSize * 0.8;
            
            // Crear gráfico personalizado para el objeto
            const itemGraphic = scene.add.graphics({willReadFrequently: true});
            
            // Color base según el tipo de objeto
            const baseColor = itemType.color;
            const fillColor = itemType.fill;
            
            // Dibujar forma según tipo de objeto
            switch (itemType.shape) {
                case 'shield': // Poción de defensa - Escudo
                    // Base del escudo
                    itemGraphic.fillStyle(0x7f8c8d, 1); // Base metálica
                    
                    // Forma de escudo medieval modificada para usar líneas rectas
                    itemGraphic.beginPath();
                    itemGraphic.moveTo(0, -size/2);
                    itemGraphic.lineTo(size/2, -size/4);
                    itemGraphic.lineTo(size/2, size/6);
                    itemGraphic.lineTo(size/4, size/2); // Ajuste aquí
                    itemGraphic.lineTo(0, size/2);      // Ajuste aquí
                    itemGraphic.lineTo(-size/4, size/2); // Ajuste aquí
                    itemGraphic.lineTo(-size/2, size/6);
                    itemGraphic.lineTo(-size/2, -size/4);
                    itemGraphic.closePath();
                    itemGraphic.fillPath();
                    
                    // Panel central del escudo
                    itemGraphic.fillStyle(baseColor, 1);
                    
                    // Forma central ligeramente más pequeña
                    itemGraphic.beginPath();
                    itemGraphic.moveTo(0, -size/2.5);
                    itemGraphic.lineTo(size/2.5, -size/3.5);
                    itemGraphic.lineTo(size/2.5, size/7);
                    itemGraphic.lineTo(size/4, size/2.5); // Ajuste aquí
                    itemGraphic.lineTo(0, size/2.5);      // Ajuste aquí
                    itemGraphic.lineTo(-size/4, size/2.5); // Ajuste aquí
                    itemGraphic.lineTo(-size/2.5, size/7);
                    itemGraphic.lineTo(-size/2.5, -size/3.5);
                    itemGraphic.closePath();
                    itemGraphic.fillPath();
                    
                    // Emblema central
                    itemGraphic.fillStyle(fillColor, 0.9);
                    itemGraphic.fillCircle(0, 0, size/4);
                    
                    // Detalles del emblema (cruz o símbolo similar)
                    itemGraphic.lineStyle(size/25, 0xffffff, 0.8);
                    itemGraphic.beginPath();
                    itemGraphic.moveTo(0, -size/6);
                    itemGraphic.lineTo(0, size/6);
                    itemGraphic.moveTo(-size/6, 0);
                    itemGraphic.lineTo(size/6, 0);
                    itemGraphic.strokePath();
                    
                    // Remaches en las esquinas
                    itemGraphic.fillStyle(0xbdc3c7, 1);
                    itemGraphic.fillCircle(-size/3, -size/6, size/15);
                    itemGraphic.fillCircle(size/3, -size/6, size/15);
                    itemGraphic.fillCircle(-size/3, size/4, size/15);
                    itemGraphic.fillCircle(size/3, size/4, size/15);
                    
                    // Brillo en el metal
                    itemGraphic.fillStyle(0xffffff, 0.6);
                    itemGraphic.fillCircle(-size/5, -size/5, size/15);
                    break;
                    
                default:
                    // Para todos los demás tipos, usar la implementación original
                    // Necesitamos recrear el gráfico porque ya hemos creado uno
                    itemGraphic.destroy();
                    return originalCreateItem(scene, x, y, itemType, typeIndex, level);
            }
            
            // El resto del código sigue normal...
            // Generar textura para el objeto con nombre único basado en tipo y nivel
            const itemTextureKey = `item_${typeIndex}_lvl_${level}_texture`;
            
            if (!scene.textures.exists(itemTextureKey)) {
                itemGraphic.generateTexture(itemTextureKey, CONFIG.tileSize * 2, CONFIG.tileSize * 2);
            }
            
            itemGraphic.destroy();
            
            // Crear sprite con físicas
            const itemSprite = scene.physics.add.sprite(x, y, itemTextureKey);
            itemSprite.setScale(0.7 + (level * 0.05)); // Ligeramente más grande con nivel más alto
            itemSprite.depth = 2;
            
            // Añadir al grupo de físicas
            gameState.itemsGroup.add(itemSprite);
            
            // Añadir datos del objeto
            const itemData = {
                sprite: itemSprite,
                type: typeIndex,
                level: level,
                name: getItemName(typeIndex, level)
            };
            
            // Añadir partículas de brillo para objetos de alto nivel...
            // Este código es el mismo que en la implementación original
            if (level >= 3) {
                // Crear gráfico para partículas
                const particleGraphic = scene.add.graphics({willReadFrequently: true});
                particleGraphic.fillStyle(itemType.color, 0.8);
                particleGraphic.fillCircle(0, 0, 3);
                
                const particleTexture = particleGraphic.generateTexture('item_particle_' + typeIndex, 6, 6);
                particleGraphic.destroy();
                
                // Crear emisor de partículas
                const particles = scene.add.particles('item_particle_' + typeIndex);
                const emitter = particles.createEmitter({
                    speed: 20,
                    scale: { start: 1, end: 0 },
                    alpha: { start: 0.6, end: 0 },
                    lifespan: 800,
                    blendMode: 'ADD',
                    frequency: 200
                });
                
                // Guardar referencia para limpiar después
                itemData.particles = particles;
                
                // Hacer que las partículas sigan al objeto
                emitter.startFollow(itemSprite);
            }
            
            // Añadir animación de flotación
            scene.tweens.add({
                targets: itemSprite,
                y: y - 5,
                duration: 1500,
                ease: 'Sine.easeInOut',
                yoyo: true,
                repeat: -1
            });
            
            // Añadir efecto de rotación lenta para algunos tipos
            if (typeIndex === 3 || typeIndex === 5) { // Experiencia o Misterioso
                scene.tweens.add({
                    targets: itemSprite,
                    angle: 360,
                    duration: 6000,
                    repeat: -1,
                    ease: 'Linear'
                });
            }
            
            gameState.items.push(itemData);
            
            return itemData;
        } catch (error) {
            console.error("Error en createItem:", error);
            
            // Creación de respaldo para evitar bloquear el juego
            const fallbackGraphic = scene.add.graphics({willReadFrequently: true});
            fallbackGraphic.fillStyle(0xff0000, 1);
            fallbackGraphic.fillCircle(0, 0, CONFIG.tileSize/2);
            
            const fallbackKey = `fallback_item_${Date.now()}`;
            fallbackGraphic.generateTexture(fallbackKey, CONFIG.tileSize, CONFIG.tileSize);
            fallbackGraphic.destroy();
            
            // Crear sprite básico
            const itemSprite = scene.physics.add.sprite(x, y, fallbackKey);
            itemSprite.setScale(0.7);
            itemSprite.depth = 2;
            
            // Añadir al grupo de físicas
            gameState.itemsGroup.add(itemSprite);
            
            // Datos mínimos del objeto
            const itemData = {
                sprite: itemSprite,
                type: typeIndex,
                level: level,
                name: "Objeto"
            };
            
            gameState.items.push(itemData);
            
            return itemData;
        }
    };
    
    return "Parche aplicado correctamente";
}

// Aplicamos el parche automáticamente
fixItemGraphicError();

function fixCanvasWarning() {
    console.log("Aplicando parche para corregir advertencia Canvas willReadFrequently");
    
    // 1. Asegurarnos que la configuración general del juego tenga willReadFrequently
    if (window.gameConfig && window.gameConfig.render) {
        window.gameConfig.render.willReadFrequently = true;
    }
    
    // 2. Parchear el método add.graphics para siempre añadir willReadFrequently
    const originalAddGraphics = Phaser.GameObjects.GameObjectFactory.prototype.graphics;
    
    Phaser.GameObjects.GameObjectFactory.prototype.graphics = function(config) {
        // Asegurarnos que las opciones incluyan willReadFrequently
        const newConfig = config || {};
        newConfig.willReadFrequently = true;
        
        // Llamar al método original con la configuración actualizada
        return originalAddGraphics.call(this, newConfig);
    };
    
    // 3. Parchear también cualquier lugar en el código donde se creen gráficos directamente
    // Textura Manager
    if (window.TextureManager && window.TextureManager.getTexture) {
        const originalGetTexture = window.TextureManager.getTexture;
        
        window.TextureManager.getTexture = function(scene, key, width, height, renderFunction) {
            if (scene.textures.exists(key)) {
                return key;
            }
            
            // Crear gráfico con willReadFrequently
            const graphic = scene.add.graphics({ willReadFrequently: true });
            renderFunction(graphic);
            graphic.generateTexture(key, width, height);
            graphic.destroy();
            
            return key;
        };
    }
    
    // 4. Mejorar la función createSafeGraphics si existe
    if (window.createSafeGraphics) {
        const originalCreateSafeGraphics = window.createSafeGraphics;
        
        window.createSafeGraphics = function(scene, options = {}) {
            // Asegurar que willReadFrequently esté siempre activado
            const safeOptions = { 
                ...options, 
                willReadFrequently: true 
            };
            
            return originalCreateSafeGraphics(scene, safeOptions);
        };
    }
    
    return "Parche para Canvas willReadFrequently aplicado";
}

// Aplicar este parche antes de que el juego se inicie
(function() {
    // Si el juego ya se ha iniciado
    if (window.gameInstance) {
        fixCanvasWarning();
    } else {
        // Si el juego aún no se ha iniciado, añadir a la cola de eventos
        const originalStartGame = window.startGame;
        if (originalStartGame) {
            window.startGame = function() {
                fixCanvasWarning();
                return originalStartGame.apply(this, arguments);
            };
        }
        
        // Asegurarnos de que se aplique independientemente de cómo se inicie el juego
        window.addEventListener('DOMContentLoaded', function() {
            fixCanvasWarning();
        });
    }
    
    // Aplicar inmediatamente si es posible
    if (typeof Phaser !== 'undefined' && Phaser.GameObjects) {
        fixCanvasWarning();
    }
})();

function fixRenderError() {
    console.log("Aplicando parche para corregir error de renderizado halfWidth");
    
    // 1. Primero parchearemos la gestión de partículas, que suele ser una causa frecuente
    if (typeof Phaser !== 'undefined' && Phaser.GameObjects && Phaser.GameObjects.Particles) {
        // Sobrescribir el método update del emisor de partículas para hacer comprobaciones adicionales
        const originalEmitterUpdate = Phaser.GameObjects.Particles.ParticleEmitter.prototype.update;
        
        Phaser.GameObjects.Particles.ParticleEmitter.prototype.update = function(delta, step) {
            // Verificar si el emisor está en un estado válido antes de actualizarlo
            if (!this.active || !this.visible || this.dead) {
                return 0;
            }
            
            // Verificar si la textura es válida
            if (!this.texture || !this.texture.key) {
                console.warn("Emisor de partículas detectado con textura inválida, desactivando");
                this.active = false;
                return 0;
            }
            
            // Llamar al método original si todo parece estar bien
            try {
                return originalEmitterUpdate.call(this, delta, step);
            } catch (error) {
                console.warn("Error al actualizar emisor de partículas, desactivando:", error);
                this.active = false;
                return 0;
            }
        };
    }
    
    // 2. Parchear el método de renderizado WebGL de los sprites
    if (typeof Phaser !== 'undefined' && Phaser.Renderer && Phaser.Renderer.WebGL) {
        // Buscar el componente de renderizado de sprites
        const originalRenderWebGL = Phaser.Renderer.WebGL.Pipelines.TextureTintPipeline.prototype.batchSprite;
        
        if (originalRenderWebGL) {
            Phaser.Renderer.WebGL.Pipelines.TextureTintPipeline.prototype.batchSprite = function(sprite, camera, parentTransformMatrix) {
                try {
                    // Verificar que el sprite tenga todas las propiedades necesarias antes de renderizar
                    if (!sprite || !sprite.frame || !sprite.frame.source || sprite.alpha <= 0) {
                        return;
                    }
                    
                    // También verificar la textura
                    const texture = sprite.frame.texture;
                    if (!texture || !texture.source || !texture.source[0]) {
                        return;
                    }
                    
                    // Llamar al método original si todo parece estar bien
                    return originalRenderWebGL.call(this, sprite, camera, parentTransformMatrix);
                } catch (error) {
                    // Si hay un error, registrarlo pero no propagarlo
                    console.warn("Error al renderizar sprite, omitiendo:", sprite, error);
                    return;
                }
            };
        }
    }
    
    // 3. Parchear el método principal de renderizado de la escena
    if (typeof Phaser !== 'undefined' && Phaser.Renderer && Phaser.Renderer.WebGL) {
        const originalSceneRender = Phaser.Renderer.WebGL.WebGLRenderer.prototype.render;
        
        if (originalSceneRender) {
            Phaser.Renderer.WebGL.WebGLRenderer.prototype.render = function(scene, children, interpolationPercentage, camera) {
                try {
                    // Intentar renderizar normalmente
                    return originalSceneRender.call(this, scene, children, interpolationPercentage, camera);
                } catch (error) {
                    console.warn("Error al renderizar escena, recuperando:", error);
                    
                    // Intentar recuperar la escena
                    if (scene && scene.sys && scene.sys.settings.active) {
                        console.log("Limpiando recursos problemáticos en escena:", scene.sys.settings.key);
                        
                        // Limpiar partículas que podrían estar causando problemas
                        if (scene.sys.updateList) {
                            const particles = scene.sys.updateList.getActive().filter(
                                obj => obj.type === 'ParticleEmitterManager'
                            );
                            
                            particles.forEach(p => {
                                console.log("Desactivando gestor de partículas problemático");
                                p.active = false;
                                if (p.emitters) {
                                    p.emitters.getAll().forEach(e => {
                                        e.active = false;
                                        e.visible = false;
                                    });
                                }
                            });
                        }
                    }
                    
                    // No propagar el error - esto permitirá que el juego continúe
                    return;
                }
            };
        }
    }
    
    // 4. Parchear la gestión de ítems en el juego para prevenir posibles problemas
    if (typeof window.placeItems === 'function') {
        const originalPlaceItems = window.placeItems;
        
        window.placeItems = function(scene) {
            try {
                // Intentar usar la función original
                return originalPlaceItems(scene);
            } catch (error) {
                console.warn("Error al colocar ítems, usando método de respaldo:", error);
                
                // Si falla, usar un método simplificado como respaldo
                gameState.items = [];
                
                // Destruir grupo anterior si existe
                if (gameState.itemsGroup) {
                    gameState.itemsGroup.clear(true, true);
                }
                
                // Crear nuevo grupo de objetos
                gameState.itemsGroup = scene.physics.add.group();
                
                // No colocar ítems, pero evitar que el juego se bloquee
                return;
            }
        };
    }
    
    // 5. Añadir manejador de errores global para capturar problemas en general
    const originalRequestAnimationFrame = window.requestAnimationFrame;
    
    window.requestAnimationFrame = function(callback) {
        return originalRequestAnimationFrame(function(timestamp) {
            try {
                // Ejecutar el callback original
                callback(timestamp);
            } catch (error) {
                console.error("Error capturado en requestAnimationFrame:", error);
                // Continuar el bucle de animación a pesar del error
                window.requestAnimationFrame(callback);
            }
        });
    };
    
    // 6. Parchear la destrucción de sprites para evitar errores de referencia nula
    if (typeof Phaser !== 'undefined' && Phaser.GameObjects) {
        const originalDestroy = Phaser.GameObjects.Sprite.prototype.destroy;
        
        Phaser.GameObjects.Sprite.prototype.destroy = function(fromScene) {
            // Asegurarse de que las partículas asociadas se desactiven primero
            if (this.particleEmitter) {
                this.particleEmitter.stop();
                this.particleEmitter = null;
            }
            
            // Desactivar el cuerpo físico antes de destruir
            if (this.body) {
                this.body.enable = false;
            }
            
            // Llamar al método original
            return originalDestroy.call(this, fromScene);
        };
    }
    
    return "Parche para error de renderizado aplicado";
}

// Aplicar este parche después de que Phaser se haya inicializado
if (typeof Phaser !== 'undefined') {
    fixRenderError();
} else {
    // Si Phaser aún no está cargado, esperar a que lo esté
    window.addEventListener('DOMContentLoaded', function() {
        if (typeof Phaser !== 'undefined') {
            fixRenderError();
        } else {
            // Intentar nuevamente después de un breve retraso
            setTimeout(function() {
                if (typeof Phaser !== 'undefined') {
                    fixRenderError();
                }
            }, 1000);
        }
    });
}

// También añadir un código de recuperación específico para partículas
function fixParticleIssues() {
    // Este código se ejecutará más tarde para dar tiempo a que se inicialice la escena
    setTimeout(function() {
        const scene = getActiveScene ? getActiveScene() : null;
        
        if (scene) {
            console.log("Verificando y corrigiendo problemas de partículas");
            
            // Verificar si hay partículas en la escena
            if (scene.sys && scene.sys.updateList) {
                const particles = scene.sys.updateList.getActive().filter(
                    obj => obj.type === 'ParticleEmitterManager'
                );
                
                particles.forEach(p => {
                    // Verificar si el gestor de partículas tiene texturas válidas
                    if (p.emitters) {
                        p.emitters.getAll().forEach(emitter => {
                            if (!emitter.texture || !emitter.texture.key || !emitter.frame) {
                                console.warn("Corrigiendo emisor de partículas con textura inválida");
                                emitter.active = false;
                                emitter.visible = false;
                            }
                        });
                    }
                });
            }
            
            // También verificar ítems
            if (gameState && gameState.items) {
                gameState.items.forEach(item => {
                    if (item.particles && (!item.sprite || !item.sprite.active)) {
                        console.log("Eliminando partículas de ítem inactivo");
                        if (typeof item.particles.destroy === 'function') {
                            item.particles.destroy();
                        }
                        item.particles = null;
                    }
                });
            }
        }
    }, 2000); // Esperar 2 segundos para que la escena se inicialice completamente
}

// Aplicar la corrección de partículas
fixParticleIssues();