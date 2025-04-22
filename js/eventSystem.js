// Archivo: js/eventSystem.js

/**
 * Sistema centralizado de eventos para el juego
 */
const EventBus = {
    events: {},
    
    /**
     * Suscribirse a un evento
     * @param {string} event - Nombre del evento
     * @param {function} callback - Función a ejecutar cuando ocurra el evento
     * @returns {function} - Función para cancelar la suscripción
     */
    subscribe: function(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
        
        // Retornar función para cancelar suscripción
        return () => {
            this.events[event] = this.events[event].filter(cb => cb !== callback);
        };
    },
    
    /**
     * Publicar un evento
     * @param {string} event - Nombre del evento
     * @param {any} data - Datos asociados al evento
     */
    publish: function(event, data) {
        if (!this.events[event]) return;
        this.events[event].forEach(callback => callback(data));
    }
};

// Exponer al ámbito global
window.EventBus = EventBus;