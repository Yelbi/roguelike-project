/**
 * enemyModule.js
 * Módulo principal para gestión de enemigos - Importa y exporta todas las funciones relacionadas
 */

// Importar subcomponentes
// Nota: En un entorno de navegador real, necesitarías ajustar las importaciones
// según tu sistema de módulos (ES modules, CommonJS, AMD, etc.)

/**
 * Este módulo sirve como punto central para todas las funcionalidades relacionadas con enemigos.
 * Facilita el mantenimiento y la organización del código.
 * 
 * En un entorno de producción con un sistema de módulos adecuado, 
 * se importarían los submodulos así:
 * 
 * import * as EnemyCreation from './enemyCreation.js';
 * import * as EnemyAI from './enemyAI.js';
 * import * as CombatEffects from './combatEffects.js';
 * 
 * Luego se exportarían todas las funciones.
 */

// En este ejemplo, asumimos que los módulos ya están cargados en orden:
// 1. enemyCreation.js
// 2. enemyAI.js
// 3. combatEffects.js

// Exportar todas las funciones
const EnemyModule = {
    // Funciones de creación
    placeEnemies,
    createEnemy,
    createEnemyHealthBar,
    addEnemyEffects,
    
    // Funciones de IA
    updateEnemies,
    addMovementEffect,
    checkInteraction,
    
    // Efectos de combate
    createAttackEffect,
    createPlayerAttackEffect,
    attackEnemy,
    enemyAttack,
    defeatEnemy
};

// Exportar el módulo
if (typeof window !== 'undefined') {
    // Entorno de navegador
    window.EnemyModule = EnemyModule;
} else if (typeof module !== 'undefined' && module.exports) {
    // Entorno Node.js
    module.exports = EnemyModule;
}