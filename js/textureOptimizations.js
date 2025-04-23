/**
 * Optimizaciones específicas para la creación y gestión de texturas
 * Este archivo contiene mejoras adicionales que puedes aplicar para
 * mejorar el rendimiento y estabilidad del sistema de texturas.
 */

// ===== MEJORA 1: REUTILIZACIÓN DE TEXTURAS =====
// Esta función crea un registro global de texturas para evitar regenerarlas

const TextureCache = {
    // Almacén de texturas
    cache: {},
    
    // Verificar si una textura existe en caché
    has: function(key) {
        return this.cache[key] !== undefined;
    },
    
    // Registrar una textura en caché
    register: function(key, dimensions) {
        this.cache[key] = {
            width: dimensions.width,
            height: dimensions.height,
            usageCount: 0,
            lastUsed: Date.now()
        };
    },
    
    // Marcar como usada
    use: function(key) {
        if (this.has(key)) {
            this.cache[key].usageCount++;
            this.cache[key].lastUsed = Date.now();
        }
    },
    
    // Limpiar caché (eliminar texturas antiguas o poco usadas)
    cleanup: function(scene, maxAge = 120000) { // 2 minutos por defecto
        const now = Date.now();
        const keysToRemove = [];
        
        // Identificar texturas antiguas
        Object.keys(this.cache).forEach(key => {
            const entry = this.cache[key];
            const age = now - entry.lastUsed;
            
            // Si la textura es antigua y se ha usado poco
            if (age > maxAge && entry.usageCount < 3) {
                keysToRemove.push(key);
            }
        });
        
        // Eliminar texturas
        keysToRemove.forEach(key => {
            if (scene && scene.textures && scene.textures.exists(key)) {
                scene.textures.remove(key);
            }
            delete this.cache[key];
        });
        
        console.log(`TextureCache: Eliminadas ${keysToRemove.length} texturas antiguas`);
        return keysToRemove.length;
    }
};

// ===== MEJORA 2: FUNCIÓN OPTIMIZADA PARA CREAR TEXTURAS =====
// Esta función reemplaza el patrón común de creación de texturas
function createOptimizedTexture(scene, key, width, height, renderCallback) {
    // Verificar si ya existe para evitar recrearla
    if (scene.textures.exists(key)) {
        // Actualizar el registro de uso
        if (TextureCache.has(key)) {
            TextureCache.use(key);
        }
        return key;
    }
    
    try {
        // Crear gráfico optimizado
        const graphic = scene.add.graphics({
            willReadFrequently: true
        });
        
        // Ejecutar la función de renderizado
        renderCallback(graphic);
        
        // Generar textura con dimensiones validadas
        const finalWidth = Math.max(1, Math.round(width));
        const finalHeight = Math.max(1, Math.round(height));
        
        // Verificar dimensiones válidas
        if (finalWidth <= 0 || finalHeight <= 0 || !isFinite(finalWidth) || !isFinite(finalHeight)) {
            console.error(`Dimensiones de textura inválidas: ${width}x${height}`);
            graphic.destroy();
            return null;
        }
        
        // Generar textura
        graphic.generateTexture(key, finalWidth, finalHeight);
        graphic.destroy();
        
        // Registrar en caché
        TextureCache.register(key, { width: finalWidth, height: finalHeight });
        
        return key;
    } catch (error) {
        console.error(`Error al crear textura ${key}:`, error);
        return null;
    }
}

// ===== MEJORA 3: ATLAS DE TEXTURAS PARA EFECTOS COMUNES =====
// Esta función permite crear atlas de texturas para optimizar el rendimiento
function createEffectsAtlas(scene) {
    // Crear un gráfico grande para contener múltiples efectos
    const atlasGraphic = scene.add.graphics({ willReadFrequently: true });
    const atlasWidth = 512; // Ancho del atlas
    const atlasHeight = 512; // Alto del atlas
    const frameSize = 64; // Tamaño de cada cuadro
    
    // Colores para efectos
    const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff];
    
    // Mapa de frames para recordar la posición de cada efecto
    const frames = {};
    
    // Contador de posición
    let x = 0;
    let y = 0;
    
    // Dibujar diferentes efectos en el atlas
    colors.forEach((color, index) => {
        // Calcular posición en el atlas
        const fx = x * frameSize;
        const fy = y * frameSize;
        
        // Guardar referencia de este frame
        const effectKey = `effect_${color.toString(16)}`;
        frames[effectKey] = { x: fx, y: fy, width: frameSize, height: frameSize };
        
        // Dibujar efecto
        atlasGraphic.fillStyle(color, 0.8);
        atlasGraphic.fillCircle(fx + frameSize/2, fy + frameSize/2, frameSize/3);
        
        // Borde
        atlasGraphic.lineStyle(2, 0xffffff, 0.6);
        atlasGraphic.strokeCircle(fx + frameSize/2, fy + frameSize/2, frameSize/2.5);
        
        // Avanzar a la siguiente posición
        x++;
        if (x * frameSize >= atlasWidth) {
            x = 0;
            y++;
        }
    });
    
    // Generar la textura del atlas
    const atlasKey = 'effects_atlas';
    atlasGraphic.generateTexture(atlasKey, atlasWidth, atlasHeight);
    atlasGraphic.destroy();
    
    // Añadir frames al atlas
    Object.keys(frames).forEach(key => {
        const frame = frames[key];
        scene.textures.addFrame(atlasKey, key, frame.x, frame.y, frame.width, frame.height);
    });
    
    console.log(`Atlas de efectos creado con ${Object.keys(frames).length} frames`);
    
    // Devolver información del atlas
    return {
        key: atlasKey,
        frames: frames
    };
}

// ===== MEJORA 4: MONITOREO DE RENDIMIENTO =====
// Esta función añade monitoreo para identificar problemas de rendimiento con texturas
function setupTextureMonitoring(scene) {
    // Contador de texturas creadas
    let texturesCreated = 0;
    
    // Guardar referencia a la función original
    const originalGenerateTexture = Phaser.GameObjects.Graphics.prototype.generateTexture;
    
    // Reemplazar con versión instrumentada
    Phaser.GameObjects.Graphics.prototype.generateTexture = function(key, width, height) {
        texturesCreated++;
        
        // Registrar creación de texturas grandes
        if (width * height > 200 * 200) {
            console.warn(`Textura grande creada: ${key} (${width}x${height})`);
        }
        
        // Llamar a la función original
        return originalGenerateTexture.call(this, key, width, height);
    };
    
    // Añadir un evento para reportar estadísticas
    const reportInterval = setInterval(() => {
        if (!scene || !scene.scene || !scene.scene.isActive()) {
            clearInterval(reportInterval);
            return;
        }
        
        const totalTextures = Object.keys(scene.textures.list).length;
        console.log(`Texturas: ${totalTextures} total, ${texturesCreated} creadas en esta sesión`);
        
        // Reiniciar contador para el siguiente intervalo
        texturesCreated = 0;
    }, 10000); // Reportar cada 10 segundos
    
    // Auto-limpieza
    scene.events.once('shutdown', () => {
        clearInterval(reportInterval);
    });
}

// ===== INSTALACIÓN DE MEJORAS =====
function installTextureOptimizations(scene) {
    // Configurar monitoreo
    setupTextureMonitoring(scene);
    
    // Crear atlas de efectos comunes
    createEffectsAtlas(scene);
    
    // Configurar limpieza periódica
    scene.time.addEvent({
        delay: 60000, // Cada minuto
        callback: () => TextureCache.cleanup(scene),
        loop: true
    });
    
    // Exponer funciones globalmente
    window.createOptimizedTexture = createOptimizedTexture;
    window.TextureCache = TextureCache;
    
    console.log("Optimizaciones de texturas instaladas");
}

// Exportar para uso como módulo
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        TextureCache,
        createOptimizedTexture,
        createEffectsAtlas,
        setupTextureMonitoring,
        installTextureOptimizations
    };
}