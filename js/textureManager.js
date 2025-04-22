// Archivo: js/textureManager.js

/**
 * Gestor centralizado de texturas para evitar regeneraciones
 */
const TextureManager = {
    /**
     * Obtiene una textura, generándola si no existe
     * @param {Phaser.Scene} scene - Escena actual
     * @param {string} key - Clave para la textura
     * @param {number} width - Ancho de la textura
     * @param {number} height - Alto de la textura
     * @param {function} renderFunction - Función que dibuja en el gráfico
     * @returns {string} - Clave de la textura
     */
    getTexture: function(scene, key, width, height, renderFunction) {
        if (scene.textures.exists(key)) {
            return key;
        }
        
        const graphic = scene.add.graphics();
        renderFunction(graphic);
        graphic.generateTexture(key, width, height);
        graphic.destroy();
        
        return key;
    },
    
    /**
     * Crea una textura para efectos de ataque
     * @param {Phaser.Scene} scene - Escena actual
     * @param {string} shape - Forma ('circle', 'square', etc)
     * @param {number} color - Color en formato hexadecimal
     * @param {boolean} isCrit - Si es un golpe crítico
     * @param {number} size - Tamaño de la textura
     * @returns {string} - Clave de la textura
     */
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

// Exponer al ámbito global
window.TextureManager = TextureManager;