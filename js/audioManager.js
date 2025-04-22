// Archivo js/audioManager.js
const AudioManager = {
    context: null,
    sounds: {},
    initialized: false,
    
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
        
        this.initialized = true;
    },
    
    createSounds: function() {
        // Crear sonidos básicos
        this.sounds.hit = () => this.createSimpleAudio(220, 'square', 0.1, 0.1);
        this.sounds.pickup = () => this.createSimpleAudio(440, 'sine', 0.2, 0.1);
        this.sounds.levelup = () => this.createSimpleAudio(880, 'sine', 0.4, 0.2);
        this.sounds.stairs = () => this.createSimpleAudio(330, 'sine', 0.3, 0.3);
        this.sounds.enemyDeath = () => this.createSimpleAudio(110, 'sawtooth', 0.2, 0.3);
        this.sounds.playerDeath = () => this.createSimpleAudio(55, 'sawtooth', 0.5, 0.5);
    },
    
    createSimpleAudio: function(frequency, type, duration, volume) {
        if (!this.context) return;
        
        try {
            const oscillator = this.context.createOscillator();
            const gainNode = this.context.createGain();
            
            oscillator.type = type;
            oscillator.frequency.value = frequency;
            gainNode.gain.value = volume || 0.1;
            
            oscillator.connect(gainNode);
            gainNode.connect(this.context.destination);
            
            oscillator.start();
            oscillator.stop(this.context.currentTime + (duration || 0.1));
        } catch (error) {
            console.warn("Error creando audio:", error);
        }
    },
    
    playSound: function(name) {
        if (!this.initialized) {
            console.warn("AudioManager no inicializado completamente al intentar reproducir:", name);
            return;
        }
        
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

// Exponer globalmente inmediatamente
window.AudioManager = AudioManager;