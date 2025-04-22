// Archivo js/audioManager.js
const AudioManager = {
    context: null,
    sounds: {},
    
    init: function() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.context = new AudioContext();
            }
        } catch (error) {
            console.warn("Web Audio API no soportada:", error);
        }
        
        // Inicializar sonidos
        if (this.context) {
            this.createSounds();
        }
    },
    
    createSounds: function() {
        // Crear sonidos básicos (código que actualmente está en createSimpleAudio)
        // ...
    },
    
    playSound: function(name) {
        if (this.context && this.sounds[name]) {
            try {
                this.sounds[name]();
            } catch (error) {
                console.warn(`Error al reproducir sonido ${name}:`, error);
            }
        }
    }
};

// Inicializar cuando se carga
window.addEventListener('load', () => {
    AudioManager.init();
});

// Exponer globalmente
window.AudioManager = AudioManager;