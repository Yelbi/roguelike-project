// Archivo: js/resourceManager.js

/**
 * Sistema para gestionar la limpieza de recursos del juego
 */
const ResourceManager = {
    /**
     * Registra un recurso para limpieza posterior
     * @param {object} owner - Objeto propietario
     * @param {string} type - Tipo de recurso
     * @param {object} resource - Recurso a limpiar
     */
    register: function(owner, type, resource) {
        if (!owner._resources) {
            owner._resources = {};
        }
        
        if (!owner._resources[type]) {
            owner._resources[type] = [];
        }
        
        owner._resources[type].push(resource);
    },
    
    /**
     * Limpia todos los recursos asociados a un objeto
     * @param {object} owner - Objeto propietario
     */
    cleanup: function(owner) {
        if (!owner._resources) return;
        
        // Limpiar por tipo
        Object.keys(owner._resources).forEach(type => {
            owner._resources[type].forEach(resource => {
                if (type === 'timers') {
                    if (resource.remove) resource.remove();
                    else if (resource.destroy) resource.destroy();
                } 
                else if (type === 'sprites' || type === 'graphics' || type === 'particles') {
                    if (resource.destroy) resource.destroy();
                }
                else if (type === 'tweens') {
                    if (resource.stop) resource.stop();
                }
                else if (type === 'custom' && resource.cleanup) {
                    resource.cleanup();
                }
            });
            
            // Limpiar arreglo
            owner._resources[type] = [];
        });
    }
};

// Exponer al ámbito global
window.ResourceManager = ResourceManager;