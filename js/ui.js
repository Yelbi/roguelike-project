/**
 * Actualiza toda la interfaz de usuario
 */
function updateUI() {
    // Actualizar estadísticas del jugador
    document.getElementById('level').textContent = gameState.playerStats.level;
    document.getElementById('health').textContent = gameState.playerStats.health;
    document.getElementById('max-health').textContent = gameState.playerStats.maxHealth;
    document.getElementById('attack').textContent = gameState.playerStats.attack;
    document.getElementById('defense').textContent = gameState.playerStats.defense;
    document.getElementById('xp').textContent = gameState.playerStats.xp;
    document.getElementById('next-level').textContent = gameState.playerStats.nextLevelXp;
    document.getElementById('dungeon-level').textContent = gameState.dungeonLevel;
    
    // Actualizar barras
    const healthPercentage = (gameState.playerStats.health / gameState.playerStats.maxHealth) * 100;
    const xpPercentage = (gameState.playerStats.xp / gameState.playerStats.nextLevelXp) * 100;
    
    document.querySelector('.health-bar .fill').style.width = `${healthPercentage}%`;
    document.querySelector('.xp-bar .fill').style.width = `${xpPercentage}%`;
    
    // Actualizar efectos de estado
    updateStatusEffectsUI();
}

/**
 * Actualiza la parte de efectos de estado en la UI
 */
function updateStatusEffectsUI() {
    const statusContainer = document.getElementById('status-effects');
    statusContainer.innerHTML = '';
    
    for (const effect of gameState.playerStats.statusEffects) {
        const effectElement = document.createElement('div');
        effectElement.className = 'status-effect';
        effectElement.style.backgroundColor = effect.color;
        effectElement.title = effect.name;
        
        statusContainer.appendChild(effectElement);
    }
}

/**
 * Actualiza la UI del inventario
 */
function updateInventoryUI() {
    const inventoryElement = document.getElementById('inventory-items');
    inventoryElement.innerHTML = '';
    
    if (gameState.inventory.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.textContent = 'Inventario vacío';
        inventoryElement.appendChild(emptyMessage);
    } else {
        for (let i = 0; i < gameState.inventory.length; i++) {
            const item = gameState.inventory[i];
            
            const itemElement = document.createElement('div');
            itemElement.className = 'inventory-item';
            itemElement.dataset.index = i;
            itemElement.textContent = item.name;
            
            inventoryElement.appendChild(itemElement);
        }
    }
}

/**
 * Añade un mensaje al registro
 */
function addMessage(text, type = "") {
    gameState.messages.push({ text, type });
    
    if (gameState.messages.length > 50) {
        gameState.messages.shift();
    }
    
    updateMessages();
}

/**
 * Actualiza mensajes en la UI
 */
function updateMessages() {
    const messageContainer = document.getElementById('message-log');
    messageContainer.innerHTML = '';
    
    // Mostrar los últimos 10 mensajes
    const messages = gameState.messages.slice(-10);
    
    for (const message of messages) {
        const messageElement = document.createElement('div');
        messageElement.className = `log-message ${message.type}`;
        messageElement.textContent = message.text;
        messageContainer.appendChild(messageElement);
    }
    
    // Hacer scroll hasta el último mensaje
    messageContainer.scrollTop = messageContainer.scrollHeight;
}

/**
 * Limpia todos los mensajes
 */
function clearMessages() {
    gameState.messages = [];
    updateMessages();
}

/**
 * Muestra u oculta el inventario
 */
function toggleInventory() {
    gameState.isInventoryOpen = !gameState.isInventoryOpen;
    document.getElementById('inventory').style.display = 
        gameState.isInventoryOpen ? 'block' : 'none';
    updateInventoryUI();
}

/**
 * Pausa o reanuda el juego
 */
function pauseGame() {
    if (!gameState.isPaused) {
        gameState.isPaused = true;
        if (window.gameInstance) {
            window.gameInstance.scene.pause('GameScene');
        }
        document.getElementById('pause-menu').style.display = 'block';
    }
}

/**
 * Reanuda el juego
 */
function resumeGame() {
    if (gameState.isPaused) {
        gameState.isPaused = false;
        if (window.gameInstance) {
            window.gameInstance.scene.resume('GameScene');
        }
        document.getElementById('pause-menu').style.display = 'none';
    }
}

/**
 * Muestra la pantalla de game over
 */
function showGameOver() {
    if (window.gameInstance) {
        window.gameInstance.scene.pause('GameScene');
    }
    
    document.getElementById('final-level').textContent = gameState.playerStats.level;
    document.getElementById('final-dungeon').textContent = gameState.dungeonLevel;
    document.getElementById('enemies-killed').textContent = gameState.enemiesKilled;
    document.getElementById('game-over').style.display = 'block';
}

/**
 * Reinicia el juego
 */
function restartGame() {
    document.getElementById('game-over').style.display = 'none';
    document.getElementById('pause-menu').style.display = 'none';
    
    // Reiniciar el estado del juego
    gameState.dungeonLevel = 1;
    gameState.playerStats = {
        level: 1,
        health: 100,
        maxHealth: 100,
        attack: 10,
        defense: 5,
        xp: 0,
        nextLevelXp: 100,
        statusEffects: []
    };
    gameState.inventory = [];
    gameState.enemies = [];
    gameState.items = [];
    gameState.messages = [];
    gameState.enemiesKilled = 0;
    gameState.isPaused = false;
    gameState.isInventoryOpen = false;
    
    updateUI();
    clearMessages();
    
    // Reiniciar Phaser
    if (window.gameInstance) {
        window.gameInstance.destroy(true);
        startGame();
    }
}

/**
 * Muestra la ayuda del juego
 */
function showHelp() {
    document.getElementById('help-modal').style.display = 'block';
}

/**
 * Cierra la ayuda del juego
 */
function closeHelp() {
    document.getElementById('help-modal').style.display = 'none';
}