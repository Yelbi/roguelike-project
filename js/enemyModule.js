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

window.EnemyModule = {
    // Funciones de creación
    placeEnemies: window.placeEnemies || function(){},
    createEnemy: window.createEnemy || function(){},
    createEnemyHealthBar: window.createEnemyHealthBar || function(){},
    addEnemyEffects: window.addEnemyEffects || function(){},
    
    // Funciones de IA
    updateEnemies: window.updateEnemies || function(){},
    addMovementEffect: window.addMovementEffect || function(){},
    checkInteraction: window.checkInteraction || function(){},
    
    // Efectos de combate
    createAttackEffect: window.createAttackEffect || function(){},
    createPlayerAttackEffect: window.createPlayerAttackEffect || function(){},
    attackEnemy: window.attackEnemy || function(){},
    enemyAttack: window.enemyAttack || function(){},
    defeatEnemy: window.defeatEnemy || function(){}
};