# Mazmorra Infinita - Roguelike 2D para Visual Studio Code

Un roguelike 2D con generación procedural de mazmorras, desarrollado para ser ejecutado directamente desde Visual Studio Code.

## Características

- **Generación procedural de mazmorras**: Cada nivel es único
- **Sistema de combate por turnos**: Estratégico y desafiante
- **Progresión de personaje**: Sube de nivel, mejora tus estadísticas
- **Variedad de objetos**: Encuentra pociones y equipamiento
- **Diseño modular**: Estructura de código organizada y mantenible
- **Sin dependencias externas**: Todo funciona con archivos locales

## Cómo instalar y ejecutar

1. Clona o descarga este repositorio
2. Abre la carpeta en Visual Studio Code
3. Instala la extensión "Live Server" de Ritwick Dey si aún no la tienes
4. Haz clic derecho en el archivo `index.html` y selecciona "Open with Live Server"
5. El juego se abrirá en tu navegador predeterminado

## Controles

- **WASD o Flechas**: Mover al personaje
- **Espacio**: Atacar (cuando estás junto a un enemigo) o interactuar
- **E**: Abrir/cerrar inventario
- **P**: Pausar juego

## Estructura del proyecto

```
roguelike-project/
├── index.html            # Archivo principal HTML
├── css/
│   └── styles.css        # Estilos del juego
└── js/
    ├── main.js           # Inicialización y configuración principal
    ├── game.js           # Lógica principal del juego
    ├── player.js         # Clase del jugador
    ├── enemy.js          # Clase para enemigos
    ├── item.js           # Clase para objetos
    ├── dungeon.js        # Generación de mazmorras
    ├── ui.js             # Interfaz de usuario
    └── utils.js          # Funciones de utilidad
```

## Mecánicas del juego

- **Progresión**: Encuentra las escaleras para descender a niveles más profundos
- **Combate**: Muévete hacia un enemigo y presiona Espacio para atacar
- **Inventario**: Recoge objetos y úsalos desde el inventario
- **Salud**: Si tu salud llega a cero, ¡has muerto!
- **Experiencia**: Derrota enemigos para ganar experiencia y subir de nivel

## Personalización

El código está diseñado para ser fácilmente modificable:

- Añade nuevos tipos de enemigos en `enemy.js`
- Crea nuevos objetos en `item.js`
- Modifica la generación de mazmorras en `dungeon.js`
- Cambia las estadísticas del jugador en `player.js`

## Notas técnicas

Este proyecto utiliza:
- HTML5 y CSS3 para la interfaz
- JavaScript moderno para la lógica
- Phaser 3 como motor de juego
- Web Audio API para efectos de sonido simples