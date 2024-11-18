/**
 * Tetris Background Animation
 * This script handles the creation and animation of falling Tetris pieces
 * in the background of the game. It creates a dynamic, interactive backdrop
 * using actual Tetris piece shapes and colors.
 */

// Define standard Tetris piece shapes using arrays
// 1 represents a filled cell, 0 represents an empty cell
const SHAPES = {
    I: [[1, 1, 1, 1]],               // Long piece
    J: [[1, 0, 0], [1, 1, 1]],      // J-shaped piece
    L: [[0, 0, 1], [1, 1, 1]],      // L-shaped piece
    O: [[1, 1], [1, 1]],            // Square piece
    S: [[0, 1, 1], [1, 1, 0]],      // S-shaped piece
    T: [[0, 1, 0], [1, 1, 1]],      // T-shaped piece
    Z: [[1, 1, 0], [0, 1, 1]]       // Z-shaped piece
};

// Define standard Tetris colors for each piece type
const COLORS = {
    I: '#00f0f0', // Cyan
    J: '#0000f0', // Blue
    L: '#f0a000', // Orange
    O: '#f0f000', // Yellow
    S: '#00f000', // Green
    T: '#a000f0', // Purple
    Z: '#f00000'  // Red
};

/**
 * Creates a single falling Tetris piece
 * - Randomly selects a shape and color
 * - Creates the HTML structure for the piece
 * - Positions it randomly on the screen
 * - Adds animation and cleanup
 */
function createFallingBlock() {
    // Create container for the falling block
    const block = document.createElement('div');
    block.className = 'falling-block';
    
    // Select random shape and get its properties
    const shapes = Object.keys(SHAPES);
    const shapeType = shapes[Math.floor(Math.random() * shapes.length)];
    const shape = SHAPES[shapeType];
    const color = COLORS[shapeType];
    
    // Create grid container for the shape
    const grid = document.createElement('div');
    grid.className = 'tetris-shape';
    grid.style.gridTemplateRows = `repeat(${shape.length}, 25px)`;
    grid.style.gridTemplateColumns = `repeat(${shape[0].length}, 25px)`;
    
    // Create individual cells for the shape
    shape.forEach(row => {
        row.forEach(cell => {
            const cellDiv = document.createElement('div');
            if (cell) {
                cellDiv.className = 'shape-cell';
                cellDiv.style.backgroundColor = color;
            }
            grid.appendChild(cellDiv);
        });
    });
    
    block.appendChild(grid);
    
    // Set random position and animation duration
    const maxWidth = window.innerWidth - 100;
    block.style.left = Math.random() * maxWidth + 'px';
    const duration = Math.random() * 3 + 3; // 3-6 seconds
    block.style.animationDuration = duration + 's';
    
    // Add to container and set cleanup
    const container = document.getElementById('fallingBlocks');
    if (container) {
        container.appendChild(block);
        
        // Remove block after animation completes
        setTimeout(() => {
            if (block.parentNode) {
                block.parentNode.removeChild(block);
            }
        }, duration * 1000);
    }
}

/**
 * Initializes the background animation
 * - Creates initial set of blocks
 * - Sets up continuous creation of new blocks
 * @returns {number} Interval ID for cleanup
 */
function initBackground() {
    console.log('Initializing background...');
    
    // Create initial blocks with staggered timing
    for (let i = 0; i < 10; i++) {
        setTimeout(() => createFallingBlock(), i * 200);
    }
    
    // Continue creating blocks at regular intervals
    return setInterval(createFallingBlock, 800);
}

// Start animation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, starting background...');
    const interval = initBackground();
    
    // Clean up interval when page is unloaded
    window.addEventListener('unload', () => {
        clearInterval(interval);
    });
});
