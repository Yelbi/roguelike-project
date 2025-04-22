/**
 * Crea un efecto visual al usar un objeto
 */
function createItemUseEffect(scene, player, color, message, itemLevel) {
    // Crear anillo de energía alrededor del jugador
    const effectGraphic = scene.add.graphics();
    
    // Color según tipo de objeto
    effectGraphic.fillStyle(color, 0.3);
    effectGraphic.fillCircle(0, 0, CONFIG.tileSize);
    
    // Borde del anillo
    effectGraphic.lineStyle(2, color, 0.7);
    effectGraphic.strokeCircle(0, 0, CONFIG.tileSize);
    
    // Generar textura
    const effectTexture = effectGraphic.generateTexture('use_effect_' + color, CONFIG.tileSize * 2, CONFIG.tileSize * 2);
    effectGraphic.destroy();
    
    // Crear sprite en la posición del jugador
    const effect = scene.add.sprite(player.x, player.y, 'use_effect_' + color);
    effect.setDepth(6);
    
    // Animación del efecto
    scene.tweens.add({
        targets: effect,
        scale: 2,
        alpha: 0,
        duration: 800,
        onComplete: () => {
            effect.destroy();
        }
    });
    
    // Añadir partículas según nivel del objeto
    const particleCount = 10 + (itemLevel * 5);
    
    // Crear gráfico para partículas
    const particleGraphic = scene.add.graphics();
    particleGraphic.fillStyle(color, 0.8);
    particleGraphic.fillCircle(0, 0, 3);
    
    const particleTexture = particleGraphic.generateTexture('use_particle_' + color, 6, 6);
    particleGraphic.destroy();
    
    // Crear partículas que emergen del jugador
    for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.5 + Math.random() * 1;
        const distance = CONFIG.tileSize * (0.5 + Math.random() * 0.5);
        
        const particleX = player.x;
        const particleY = player.y;
        
        const particle = scene.add.sprite(particleX, particleY, 'use_particle_' + color);
        particle.setDepth(7);
        
        // Animación de la partícula
        scene.tweens.add({
            targets: particle,
            x: particleX + Math.cos(angle) * distance * speed,
            y: particleY + Math.sin(angle) * distance * speed,
            alpha: 0,
            scale: { from: 1, to: 0.5 },
            duration: 600 + Math.random() * 400,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                particle.destroy();
            }
        });
    }
    
    // Mostrar mensaje flotante
    if (message) {
        const textColor = '#ffffff';
        const fontSize = 16 + (itemLevel * 2);
        
        const text = scene.add.text(
            player.x, 
            player.y - 30, 
            message, 
            { 
                fontFamily: 'Arial', 
                fontSize: fontSize, 
                color: textColor,
                stroke: '#000000',
                strokeThickness: 4,
                align: 'center'
            }
        );
        text.setOrigin(0.5);
        text.setDepth(20);
        
        // Animación del texto
        scene.tweens.add({
            targets: text,
            y: text.y - 50,
            alpha: 0,
            scale: 1.2,
            duration: 1500,
            ease: 'Cubic.easeOut',
            onComplete: () => text.destroy()
        });
    }
    
    // Sacudir la cámara ligeramente para objetos poderosos
    if (itemLevel >= 3) {
        scene.cameras.main.shake(200, 0.01);
    }
}

/**
 * Suelta un objeto en la posición dada con mejores efectos visuales
 */
function dropItem(scene, x, y) {
    // Decidir tipo de objeto
    const itemType = getRandomInt(0, 5);
    
    // Nivel del objeto basado en nivel de la mazmorra con posible bonus
    const bonusChance = Math.random();
    let itemLevel;
    
    if (bonusChance < 0.05) { // 5% probabilidad de objeto superior
        itemLevel = gameState.dungeonLevel + 2;
    } else if (bonusChance < 0.25) { // 20% probabilidad de objeto mejor
        itemLevel = gameState.dungeonLevel + 1;
    } else { // 75% probabilidad de objeto normal
        itemLevel = getRandomInt(
            Math.max(1, gameState.dungeonLevel - 1),
            gameState.dungeonLevel
        );
    }
    
    // Tipos de objetos según efecto con mejor aspecto visual
    const itemTypes = [
        { name: 'Poción de Salud', shape: 'bottle', color: 0x9bdc28, fill: 0xe74c3c },
        { name: 'Poción de Fuerza', shape: 'sword', color: 0xff5555, fill: 0xff0000 },
        { name: 'Poción de Defensa', shape: 'shield', color: 0x4477ff, fill: 0x0000ff },
        { name: 'Poción de Experiencia', shape: 'gem', color: 0xdd77ff, fill: 0xaa00ff },
        { name: 'Poción de Vida Máxima', shape: 'heart', color: 0x55dddd, fill: 0x00aaaa },
        { name: 'Poción Misteriosa', shape: 'skull', color: 0xff9933, fill: 0xff6600 }
    ];
    
    // Crear efecto de aparición
    const appearEffectGraphic = scene.add.graphics();
    appearEffectGraphic.fillStyle(0xffffff, 0.8);
    appearEffectGraphic.fillCircle(0, 0, CONFIG.tileSize/2);
    
    const appearEffectTexture = appearEffectGraphic.generateTexture('item_appear_effect', CONFIG.tileSize, CONFIG.tileSize);
    appearEffectGraphic.destroy();
    
    // Crear sprite en la posición de aparición
    const appearEffect = scene.add.sprite(x, y, 'item_appear_effect');
    appearEffect.setDepth(10);
    
    // Animación de aparición
    scene.tweens.add({
        targets: appearEffect,
        alpha: 0,
        scale: 2,
        duration: 500,
        onComplete: () => {
            appearEffect.destroy();
        }
    });
    
    // Crear partículas que convergen en el punto de aparición
    for (let i = 0; i < 12; i++) {
        const angle = (Math.PI * 2 / 12) * i;
        const distance = CONFIG.tileSize;
        
        const particleX = x + Math.cos(angle) * distance;
        const particleY = y + Math.sin(angle) * distance;
        
        const particleGraphic = scene.add.graphics();
        particleGraphic.fillStyle(0xffffff, 0.7);
        particleGraphic.fillCircle(0, 0, 3);
        
        const particleTexture = particleGraphic.generateTexture('item_appear_particle', 6, 6);
        particleGraphic.destroy();
        
        const particle = scene.add.sprite(particleX, particleY, 'item_appear_particle');
        particle.setDepth(9);
        
        // Mover hacia el centro
        scene.tweens.add({
            targets: particle,
            x: x,
            y: y,
            alpha: 0,
            duration: 300,
            delay: i * 30,
            onComplete: () => {
                particle.destroy();
            }
        });
    }
    
    // Crear el objeto en sí con un breve retraso
    scene.time.delayedCall(300, () => {
        // Crear objeto
        const itemData = createItem(scene, x, y, itemTypes[itemType], itemType, itemLevel);
        
        // Mensaje más llamativo según la rareza del objeto
        let messagePrefix = "";
        
        if (itemLevel > gameState.dungeonLevel + 1) {
            messagePrefix = "¡¡Has encontrado un objeto legendario: ";
        } else if (itemLevel > gameState.dungeonLevel) {
            messagePrefix = "¡Has encontrado un objeto raro: ";
        } else {
            messagePrefix = "Has encontrado un objeto: ";
        }
        
        // Mensaje
        addMessage(`${messagePrefix}${itemData.name}!`, "item");
    });
}/**
 * Funciones relacionadas con los objetos del juego
 */

/**
 * Coloca objetos en la mazmorra con diseños visuales mejorados
 */
function placeItems(scene) {
    gameState.items = [];
    
    // Destruir grupo anterior si existe
    if (gameState.itemsGroup) {
        gameState.itemsGroup.clear(true, true);
    }
    
    // Crear nuevo grupo de objetos
    gameState.itemsGroup = scene.physics.add.group();
    
    // Tipos de objetos según efecto con mejor aspecto visual
    const itemTypes = [
        { name: 'Poción de Salud', shape: 'bottle', color: 0x9bdc28, fill: 0xe74c3c },
        { name: 'Poción de Fuerza', shape: 'sword', color: 0xff5555, fill: 0xff0000 },
        { name: 'Poción de Defensa', shape: 'shield', color: 0x4477ff, fill: 0x0000ff },
        { name: 'Poción de Experiencia', shape: 'gem', color: 0xdd77ff, fill: 0xaa00ff },
        { name: 'Poción de Vida Máxima', shape: 'heart', color: 0x55dddd, fill: 0x00aaaa },
        { name: 'Poción Misteriosa', shape: 'skull', color: 0xff9933, fill: 0xff6600 }
    ];
    
    // Colocar objetos en todas las salas
    for (let i = 0; i < gameState.rooms.length; i++) {
        const room = gameState.rooms[i];
        
        // Más objetos en niveles más profundos, pero no demasiados
        const itemChance = 0.4 + (gameState.dungeonLevel * 0.05); // Aumentar probabilidad con nivel
        const baseCount = i === 0 ? 1 : Math.random() < itemChance ? 1 : 0; // Garantizar al menos un objeto en primera sala
        const extraCount = Math.random() < (gameState.dungeonLevel * 0.03) ? 1 : 0; // Objetos adicionales en niveles profundos
        const itemCount = baseCount + extraCount;
        
        for (let j = 0; j < itemCount; j++) {
            // Buscar una posición válida dentro de la sala (lejos de las paredes)
            const x = getRandomInt(room.x + 2, room.x + room.width - 3);
            const y = getRandomInt(room.y + 2, room.y + room.height - 3);
            
            // Decidir tipo de objeto con ponderación
            // En niveles más profundos, más probabilidad de objetos mejores
            let typeIndex;
            const rarityRoll = Math.random();
            
            if (rarityRoll < 0.4) {
                // Objetos comunes (salud)
                typeIndex = 0;
            } else if (rarityRoll < 0.7) {
                // Objetos poco comunes (ataque/defensa)
                typeIndex = getRandomInt(1, 2);
            } else if (rarityRoll < 0.9) {
                // Objetos raros (experiencia/vida máxima)
                typeIndex = getRandomInt(3, 4);
            } else {
                // Objetos muy raros (misteriosos)
                typeIndex = 5;
            }
            
            const itemType = itemTypes[typeIndex];
            
            // Nivel del objeto basado en nivel de la mazmorra con variación
            const itemLevel = getRandomInt(
                Math.max(1, gameState.dungeonLevel - 1),
                gameState.dungeonLevel + 1
            );
            
            // Posición en píxeles
            const itemX = x * CONFIG.tileSize + (CONFIG.tileSize / 2);
            const itemY = y * CONFIG.tileSize + (CONFIG.tileSize / 2);
            
            // Crear objeto con diseño visual mejorado
            createItem(scene, itemX, itemY, itemType, typeIndex, itemLevel);
        }
    }
}

/**
 * Crea un objeto con mejor diseño visual
 */
function createItem(scene, x, y, itemType, typeIndex, level) {
    // Tamaño base para el objeto
    const size = CONFIG.tileSize * 0.8;
    
    // Crear gráfico personalizado para el objeto
    const itemGraphic = scene.add.graphics();
    
    // Color base según el tipo de objeto
    const baseColor = itemType.color;
    const fillColor = itemType.fill;
    
    // Dibujar forma según tipo de objeto
    switch (itemType.shape) {
        case 'bottle': // Poción de salud
            // Botella
            itemGraphic.fillStyle(baseColor, 1);
            
            // Base de la botella
            itemGraphic.fillRect(-size/4, -size/8, size/2, size/2);
            
            // Parte superior redondeada
            itemGraphic.beginPath();
            itemGraphic.arc(0, -size/8, size/4, Math.PI, 0, false);
            itemGraphic.fillPath();
            
            // Cuello de la botella
            itemGraphic.fillRect(-size/8, -size/3, size/4, size/5);
            
            // Tapa
            itemGraphic.fillStyle(0x333333, 0.8);
            itemGraphic.fillRect(-size/7, -size/2.5, size/3.5, size/10);
            
            // Contenido líquido
            itemGraphic.fillStyle(fillColor, 0.8);
            itemGraphic.fillRect(-size/5, -size/10, size/2.5, size/3);
            
            // Brillo
            itemGraphic.fillStyle(0xffffff, 0.6);
            itemGraphic.fillCircle(-size/8, -size/10, size/12);
            break;
            
        case 'sword': // Poción de fuerza - Espada
            // Hoja de la espada
            itemGraphic.fillStyle(0xcccccc, 1);
            itemGraphic.beginPath();
            itemGraphic.moveTo(0, -size/1.8);
            itemGraphic.lineTo(size/10, -size/3);
            itemGraphic.lineTo(size/10, size/3);
            itemGraphic.lineTo(0, size/2.5);
            itemGraphic.lineTo(-size/10, size/3);
            itemGraphic.lineTo(-size/10, -size/3);
            itemGraphic.closePath();
            itemGraphic.fillPath();
            
            // Filo de la espada
            itemGraphic.fillStyle(0xeeeeee, 1);
            itemGraphic.fillRect(-size/25, -size/1.9, size/12.5, size);
            
            // Empuñadura
            itemGraphic.fillStyle(baseColor, 1);
            
            // Guarda
            itemGraphic.fillRect(-size/4, size/4, size/2, size/10);
            
            // Mango
            itemGraphic.fillRect(-size/12, size/3, size/6, size/4);
            
            // Pomo
            itemGraphic.fillStyle(fillColor, 1);
            itemGraphic.fillCircle(0, size/2, size/8);
            
            // Brillo en la hoja
            itemGraphic.fillStyle(0xffffff, 0.7);
            itemGraphic.fillRect(size/30, -size/2.5, size/25, size/5);
            break;
            
        case 'shield': // Poción de defensa - Escudo
            // Base del escudo
            itemGraphic.fillStyle(baseColor, 1);
            itemGraphic.beginPath();
            itemGraphic.moveTo(0, -size/2);
            itemGraphic.lineTo(size/2, -size/4);
            itemGraphic.lineTo(size/2, size/4);
            itemGraphic.lineTo(0, size/2);
            itemGraphic.lineTo(-size/2, size/4);
            itemGraphic.lineTo(-size/2, -size/4);
            itemGraphic.closePath();
            itemGraphic.fillPath();
            
            // Borde del escudo
            itemGraphic.lineStyle(size/15, 0x333333, 0.7);
            itemGraphic.strokePath();
            
            // Emblema central
            itemGraphic.fillStyle(fillColor, 0.9);
            itemGraphic.fillCircle(0, 0, size/4);
            
            // Detalles del emblema
            itemGraphic.lineStyle(size/25, 0xffffff, 0.8);
            itemGraphic.beginPath();
            itemGraphic.moveTo(-size/8, -size/8);
            itemGraphic.lineTo(size/8, size/8);
            itemGraphic.moveTo(size/8, -size/8);
            itemGraphic.lineTo(-size/8, size/8);
            itemGraphic.strokePath();
            
            // Brillo
            itemGraphic.fillStyle(0xffffff, 0.6);
            itemGraphic.fillCircle(-size/5, -size/5, size/15);
            break;
            
        case 'gem': // Poción de experiencia - Gema
            // Base de la gema
            itemGraphic.fillStyle(baseColor, 1);
            itemGraphic.beginPath();
            itemGraphic.moveTo(0, -size/2);
            itemGraphic.lineTo(size/2.5, 0);
            itemGraphic.lineTo(0, size/2);
            itemGraphic.lineTo(-size/2.5, 0);
            itemGraphic.closePath();
            itemGraphic.fillPath();
            
            // Facetas interiores
            itemGraphic.fillStyle(fillColor, 0.8);
            
            // Faceta superior
            itemGraphic.beginPath();
            itemGraphic.moveTo(0, -size/2.5);
            itemGraphic.lineTo(size/4, -size/10);
            itemGraphic.lineTo(-size/4, -size/10);
            itemGraphic.closePath();
            itemGraphic.fillPath();
            
            // Faceta inferior
            itemGraphic.beginPath();
            itemGraphic.moveTo(0, size/2.5);
            itemGraphic.lineTo(size/4, size/10);
            itemGraphic.lineTo(-size/4, size/10);
            itemGraphic.closePath();
            itemGraphic.fillPath();
            
            // Brillo
            itemGraphic.fillStyle(0xffffff, 0.8);
            itemGraphic.fillCircle(-size/6, -size/6, size/12);
            
            // Destellos
            for (let i = 0; i < 4; i++) {
                const angle = (Math.PI / 2) * i;
                const distance = size/1.8;
                const sparkleX = Math.cos(angle) * distance;
                const sparkleY = Math.sin(angle) * distance;
                
                itemGraphic.fillStyle(0xffffff, 0.7);
                itemGraphic.fillCircle(sparkleX, sparkleY, size/15);
            }
            break;
            
        case 'heart': // Poción de vida máxima - Corazón
            // Corazón
            itemGraphic.fillStyle(baseColor, 1);
            
            // Dibujar medio corazón
            itemGraphic.beginPath();
            itemGraphic.arc(-size/4, -size/6, size/4, Math.PI, 0, true);
            itemGraphic.lineTo(0, size/2);
            itemGraphic.closePath();
            itemGraphic.fillPath();
            
            // Dibujar otro medio corazón
            itemGraphic.beginPath();
            itemGraphic.arc(size/4, -size/6, size/4, Math.PI, 2*Math.PI, true);
            itemGraphic.lineTo(0, size/2);
            itemGraphic.closePath();
            itemGraphic.fillPath();
            
            // Brillo interior
            itemGraphic.fillStyle(fillColor, 0.9);
            
            // Dibujar corazón más pequeño dentro
            const innerScale = 0.7;
            itemGraphic.beginPath();
            itemGraphic.arc(-size/4 * innerScale, -size/6 * innerScale, size/4 * innerScale, Math.PI, 0, true);
            itemGraphic.lineTo(0, size/2 * innerScale);
            itemGraphic.closePath();
            itemGraphic.fillPath();
            
            itemGraphic.beginPath();
            itemGraphic.arc(size/4 * innerScale, -size/6 * innerScale, size/4 * innerScale, Math.PI, 2*Math.PI, true);
            itemGraphic.lineTo(0, size/2 * innerScale);
            itemGraphic.closePath();
            itemGraphic.fillPath();
            
            // Brillo
            itemGraphic.fillStyle(0xffffff, 0.7);
            itemGraphic.fillCircle(-size/6, -size/6, size/15);
            break;
            
        case 'skull': // Poción misteriosa - Calavera
            // Base de la calavera
            itemGraphic.fillStyle(0xeeeeee, 1);
            
            // Forma del cráneo
            itemGraphic.beginPath();
            itemGraphic.arc(0, -size/6, size/3, 0, Math.PI * 2);
            itemGraphic.fillPath();
            
            // Mandíbula
            itemGraphic.fillStyle(0xdddddd, 1);
            itemGraphic.beginPath();
            itemGraphic.moveTo(-size/4, size/10);
            itemGraphic.lineTo(size/4, size/10);
            itemGraphic.lineTo(size/5, size/3);
            itemGraphic.lineTo(-size/5, size/3);
            itemGraphic.closePath();
            itemGraphic.fillPath();
            
            // Ojos
            itemGraphic.fillStyle(0x000000, 0.8);
            itemGraphic.fillEllipse(-size/8, -size/6, size/10, size/7);
            itemGraphic.fillEllipse(size/8, -size/6, size/10, size/7);
            
            // Nariz
            itemGraphic.beginPath();
            itemGraphic.moveTo(0, -size/10);
            itemGraphic.lineTo(size/20, size/15);
            itemGraphic.lineTo(-size/20, size/15);
            itemGraphic.closePath();
            itemGraphic.fillPath();
            
            // Aura misteriosa
            itemGraphic.fillStyle(baseColor, 0.4);
            itemGraphic.fillCircle(0, 0, size/2);
            
            // Líneas de energía
            itemGraphic.lineStyle(1, fillColor, 0.8);
            for (let i = 0; i < 8; i++) {
                const angle = (Math.PI / 4) * i;
                const innerRadius = size/2.5;
                const outerRadius = size/1.5;
                
                itemGraphic.beginPath();
                itemGraphic.moveTo(Math.cos(angle) * innerRadius, Math.sin(angle) * innerRadius);
                itemGraphic.lineTo(Math.cos(angle) * outerRadius, Math.sin(angle) * outerRadius);
                itemGraphic.strokePath();
            }
            break;
            
        default: // Objeto genérico (gema simple)
            // Forma de diamante
            itemGraphic.fillStyle(baseColor, 1);
            itemGraphic.beginPath();
            itemGraphic.moveTo(0, -size/2);
            itemGraphic.lineTo(size/2, 0);
            itemGraphic.lineTo(0, size/2);
            itemGraphic.lineTo(-size/2, 0);
            itemGraphic.closePath();
            itemGraphic.fillPath();
            
            // Brillo
            itemGraphic.fillStyle(0xffffff, 0.7);
            itemGraphic.fillCircle(-size/6, -size/6, size/8);
    }
    
    // Indicador de nivel (brillo según nivel)
    // Nivel 1: sin brillo adicional
    // Nivel 2+: brillo creciente
    if (level > 1) {
        const glowIntensity = 0.2 + (level * 0.1);
        const glowSize = size/2 + (level * 3);
        const glowColor = itemType.color;
        
        itemGraphic.fillStyle(glowColor, glowIntensity);
        itemGraphic.fillCircle(0, 0, glowSize);
        
        // Marco para nivel alto (3+)
        if (level >= 3) {
            itemGraphic.lineStyle(2, 0xffffff, 0.4);
            itemGraphic.strokeCircle(0, 0, size/1.5);
        }
    }
    
    // Generar textura para el objeto con nombre único basado en tipo y nivel
    const itemTextureKey = `item_${typeIndex}_lvl_${level}_texture`;
    
    if (!scene.textures.exists(itemTextureKey)) {
        itemGraphic.generateTexture(itemTextureKey, CONFIG.tileSize * 2, CONFIG.tileSize * 2);
    }
    
    itemGraphic.destroy();
    
    // Crear sprite con físicas
    const itemSprite = scene.physics.add.sprite(x, y, itemTextureKey);
    itemSprite.setScale(0.7 + (level * 0.03)); // Ligeramente más grande con nivel más alto
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
    
    // Añadir partículas de brillo para objetos de alto nivel
    if (level >= 3) {
        // Crear gráfico para partículas
        const particleGraphic = scene.add.graphics();
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
}