// Game Constants and DOM Elements
const ROWS = 20;
const COLS = 10;
const BLOCK_SIZE = 30;
const SMALL_BLOCK_SIZE = 24;
const PIECE_COLORS = ['cyan', 'blue', 'orange', 'yellow', 'green', 'purple', 'red'];
const MAX_HIGH_SCORES = 5;

// Tetromino shapes in their default rotation
const PIECE_SHAPES = {
    I: [[0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0]],
    J: [[1, 0, 0],
        [1, 1, 1],
        [0, 0, 0]],
    L: [[0, 0, 1],
        [1, 1, 1],
        [0, 0, 0]],
    O: [[1, 1],
        [1, 1]],
    S: [[0, 1, 1],
        [1, 1, 0],
        [0, 0, 0]],
    T: [[0, 1, 0],
        [1, 1, 1],
        [0, 0, 0]],
    Z: [[1, 1, 0],
        [0, 1, 1],
        [0, 0, 0]]
};

// Game state variables
let board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
let currentPiece = null;
let nextPiece = null;
let currentPiecePosition = { x: 0, y: 0 };
let score = 0;
let level = 1;
let lines = 0;
let gameInterval = null;
let gameSpeed = 1000;
let highScores = [];
let lastMoveTime = 0;
let isGameActive = false;
let isPaused = false;
const moveDelay = 50;

// Global variables to store DOM elements
let gameArea, nextPieceArea, scoreElement, levelElement, linesElement, highScoresElement, startBtn, pauseBtn, resetBtn;

// Initialize game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing game...'); // Debug log
    
    // Initialize DOM elements
    gameArea = document.getElementById('gameArea');
    nextPieceArea = document.getElementById('nextPiece');
    scoreElement = document.getElementById('score');
    levelElement = document.getElementById('level');
    linesElement = document.getElementById('lines');
    highScoresElement = document.getElementById('highScores');
    startBtn = document.getElementById('startButton');
    pauseBtn = document.getElementById('pauseButton');
    resetBtn = document.getElementById('resetButton');

    console.log('DOM elements loaded:', { 
        gameArea, nextPieceArea, scoreElement, levelElement, 
        linesElement, highScoresElement, startBtn, pauseBtn, resetBtn 
    }); // Debug log

    // Add event listeners
    startBtn.addEventListener('click', () => {
        console.log('Start button clicked'); // Debug log
        startGame();
    });
    
    pauseBtn.addEventListener('click', () => {
        console.log('Pause button clicked'); // Debug log
        togglePause();
    });
    
    resetBtn.addEventListener('click', () => {
        console.log('Reset button clicked'); // Debug log
        resetGame();
    });
    
    // Add keyboard controls
    document.addEventListener('keydown', (event) => {
        // Handle Enter key to start game
        if (event.key === 'Enter' || event.code === 'Enter') {
            event.preventDefault();
            if (!isGameActive) {
                startGame();
            }
            return;
        }

        // Handle pause toggle separately
        if (event.key === 'p' || event.key === 'P') {
            if (isGameActive) {
                togglePause();
            }
            return;
        }

        if (!isGameActive || isPaused) return;

        switch (event.key) {
            // Arrow keys and WASD
            case 'ArrowLeft':
            case 'a':
            case 'A':
                movePiece(-1, 0);
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                movePiece(1, 0);
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                movePiece(0, 1);
                break;
            case 'ArrowUp':
            case 'w':
            case 'W':
                const rotated = currentPiece.rotate();
                console.log('Rotated shape:', rotated); // Debug log
                
                // Try rotation with wall kicks
                const kicks = [0, -1, 1, -2, 2];
                let rotationSuccessful = false;
                
                for (const kick of kicks) {
                    if (!hasCollision(rotated, currentPiecePosition.x + kick, currentPiecePosition.y)) {
                        currentPiece.shape = rotated;
                        currentPiecePosition.x += kick;
                        rotationSuccessful = true;
                        console.log('Rotation successful with kick:', kick); // Debug log
                        break;
                    }
                }
                
                if (!rotationSuccessful) {
                    console.log('Rotation failed'); // Debug log
                }
                
                drawBoard();
                break;
            case ' ':
                console.log('Hard drop triggered'); // Debug log
                console.log('Current piece before drop:', currentPiece); // Debug log
                console.log('Position before drop:', currentPiecePosition); // Debug log
                hardDrop();
                break;
        }
    });

    // Initialize the game
    initGame();
    console.log('Game initialization complete'); // Debug log
});

class Tetromino {
    constructor(shape) {
        this.shape = JSON.parse(JSON.stringify(PIECE_SHAPES[shape])); // Deep copy
        this.color = PIECE_COLORS[Object.keys(PIECE_SHAPES).indexOf(shape)];
        this.type = shape; // Store the piece type
    }

    rotate() {
        const N = this.shape.length;
        const rotated = Array.from({ length: N }, () => Array(N).fill(0));
        
        // Rotate clockwise
        for (let i = 0; i < N; i++) {
            for (let j = 0; j < N; j++) {
                rotated[j][N - 1 - i] = this.shape[i][j];
            }
        }
        
        // Special handling for I piece
        if (this.type === 'I') {
            // Trim empty rows/columns for I piece
            let minRow = N, maxRow = 0, minCol = N, maxCol = 0;
            
            // Find boundaries of the piece
            for (let i = 0; i < N; i++) {
                for (let j = 0; j < N; j++) {
                    if (rotated[i][j]) {
                        minRow = Math.min(minRow, i);
                        maxRow = Math.max(maxRow, i);
                        minCol = Math.min(minCol, j);
                        maxCol = Math.max(maxCol, j);
                    }
                }
            }
            
            // Create new array with proper dimensions
            const trimmed = Array.from({ length: maxRow - minRow + 1 }, 
                                    () => Array(maxCol - minCol + 1).fill(0));
            
            // Copy the piece to the new array
            for (let i = minRow; i <= maxRow; i++) {
                for (let j = minCol; j <= maxCol; j++) {
                    trimmed[i - minRow][j - minCol] = rotated[i][j];
                }
            }
            
            return trimmed;
        }
        
        return rotated;
    }
}

function loadHighScores() {
    const scores = localStorage.getItem('tetrisHighScores');
    return scores ? JSON.parse(scores) : [];
}

function saveHighScores() {
    localStorage.setItem('tetrisHighScores', JSON.stringify(highScores));
}

function updateHighScores() {
    if (score > 0) {
        highScores.push(score);
        highScores.sort((a, b) => b - a);
        highScores = highScores.slice(0, MAX_HIGH_SCORES);
        saveHighScores();
    }
    
    displayHighScores();
}

function displayHighScores() {
    highScoresElement.innerHTML = '';
    highScores.forEach(score => {
        const li = document.createElement('li');
        li.textContent = score;
        highScoresElement.appendChild(li);
    });
}

function createNewPiece() {
    if (!nextPiece) {
        nextPiece = createRandomPiece();
    }
    
    currentPiece = nextPiece;
    nextPiece = createRandomPiece();
    
    // Set the initial position
    currentPiecePosition = {
        x: Math.floor(COLS / 2) - Math.floor(currentPiece.shape[0].length / 2),
        y: 0
    };
    
    // Check for game over
    if (hasCollision(currentPiece.shape, currentPiecePosition.x, currentPiecePosition.y)) {
        endGame();
        return false;
    }
    
    drawBoard();
    return true;
}

function createRandomPiece() {
    const shapes = Object.keys(PIECE_SHAPES);
    const randomShape = shapes[Math.floor(Math.random() * shapes.length)];
    return new Tetromino(randomShape);
}

function drawNextPiece() {
    if (!nextPiece) return; // Add null check
    
    nextPieceArea.innerHTML = '';
    
    const offsetX = (120 - nextPiece.shape[0].length * SMALL_BLOCK_SIZE) / 2;
    const offsetY = (120 - nextPiece.shape.length * SMALL_BLOCK_SIZE) / 2;
    
    for (let r = 0; r < nextPiece.shape.length; r++) {
        for (let c = 0; c < nextPiece.shape[r].length; c++) {
            if (nextPiece.shape[r][c]) {
                const block = document.createElement('div');
                block.classList.add('next-block');
                block.style.backgroundColor = nextPiece.color;
                block.style.left = offsetX + c * SMALL_BLOCK_SIZE + 'px';
                block.style.top = offsetY + r * SMALL_BLOCK_SIZE + 'px';
                nextPieceArea.appendChild(block);
            }
        }
    }
}

function updateScore(linesCleared = 0) {
    const linePoints = [40, 100, 300, 1200]; // Points for 1, 2, 3, and 4 lines
    
    if (linesCleared > 0) {
        score += linePoints[linesCleared - 1] * level;
        lines += linesCleared;
        level = Math.floor(lines / 10) + 1;
    }
    
    // Update display
    scoreElement.textContent = score;
    levelElement.textContent = level;
    linesElement.textContent = lines;
    
    // Update game speed
    gameSpeed = Math.max(100, 1000 - (level - 1) * 100);
    if (gameInterval) {
        clearInterval(gameInterval);
        gameInterval = setInterval(gameLoop, gameSpeed);
    }
}

function resetGameInterval() {
    if (gameInterval) {
        clearInterval(gameInterval);
    }
    if (!isPaused && isGameActive) {
        gameInterval = setInterval(gameLoop, gameSpeed);
    }
}

function endGame() {
    isGameActive = false;
    clearInterval(gameInterval);
    updateHighScores();
    alert(`Game Over! Score: ${score}`);
    resetGame();
}

function resetGame() {
    // Clear game state
    isGameActive = false;
    isPaused = false;
    score = 0;
    level = 1;
    lines = 0;
    
    // Reset board
    board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    
    // Clear pieces
    currentPiece = null;
    nextPiece = null;
    currentPiecePosition = { x: 0, y: 0 };
    
    // Reset UI
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    resetBtn.disabled = true;
    
    // Clear interval
    if (gameInterval) {
        clearInterval(gameInterval);
        gameInterval = null;
    }
    
    // Update display
    updateScore();
    drawBoard();
    console.log('Game reset!'); // Debug log
}

function hardDrop() {
    if (!currentPiece || !isGameActive || isPaused) {
        console.log('Hard drop aborted - invalid state'); // Debug log
        return;
    }
    
    console.log('Starting hard drop'); // Debug log
    console.log('Current piece:', currentPiece); // Debug log
    console.log('Current position:', currentPiecePosition); // Debug log
    
    // Calculate drop distance
    let dropDistance = 0;
    while (!hasCollision(currentPiece.shape, currentPiecePosition.x, currentPiecePosition.y + dropDistance + 1)) {
        dropDistance++;
    }
    
    console.log('Drop distance:', dropDistance); // Debug log
    
    // Move piece to final position
    currentPiecePosition.y += dropDistance;
    
    console.log('Final position:', currentPiecePosition); // Debug log
    
    // Merge piece and create new one
    mergePiece();
    checkLines();
    
    // Create new piece
    if (!createNewPiece()) {
        console.log('Failed to create new piece'); // Debug log
        endGame();
        return;
    }
    
    console.log('New piece created:', currentPiece); // Debug log
    
    // Reset move delay and redraw
    lastMoveTime = Date.now();
    drawBoard();
}

function mergePiece() {
    if (!currentPiece) {
        console.log('Merge aborted - no current piece'); // Debug log
        return;
    }
    
    console.log('Merging piece:', currentPiece); // Debug log
    console.log('At position:', currentPiecePosition); // Debug log
    
    // Get piece index based on the original type
    const pieceIndex = Object.keys(PIECE_SHAPES).indexOf(currentPiece.type) + 1;
    
    for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
            if (currentPiece.shape[y][x]) {
                const boardY = currentPiecePosition.y + y;
                const boardX = currentPiecePosition.x + x;
                if (boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLS) {
                    console.log('Placing piece type:', currentPiece.type, 'at:', boardX, boardY); // Debug log
                    board[boardY][boardX] = pieceIndex;
                }
            }
        }
    }
    
    console.log('Board after merge:', board); // Debug log
}

function hasCollision(shape, x, y) {
    const piece = shape || (currentPiece ? currentPiece.shape : null);
    if (!piece) return false;
    
    for (let r = 0; r < piece.length; r++) {
        for (let c = 0; c < piece[r].length; c++) {
            if (piece[r][c]) {
                const newX = x + c;
                const newY = y + r;
                
                if (newX < 0 || newX >= COLS || newY >= ROWS) return true;
                if (newY >= 0 && board[newY][newX]) return true;
            }
        }
    }
    return false;
}

function movePiece(dx, dy) {
    if (!isGameActive || isPaused || !currentPiece) return false;
    
    const now = Date.now();
    if (now - lastMoveTime < moveDelay) return false;
    
    const newX = currentPiecePosition.x + dx;
    const newY = currentPiecePosition.y + dy;
    
    if (hasCollision(currentPiece.shape, newX, newY)) {
        if (dy > 0) {
            mergePiece();
            checkLines();
            if (!createNewPiece()) {
                endGame();
                return false;
            }
        }
        return false;
    }
    
    currentPiecePosition.x = newX;
    currentPiecePosition.y = newY;
    lastMoveTime = now;
    drawBoard();
    return true;
}

function checkLines() {
    let linesCleared = 0;
    
    for (let r = ROWS - 1; r >= 0; r--) {
        if (board[r].every(cell => cell !== 0)) {
            // Remove the line
            board.splice(r, 1);
            // Add new empty line at top
            board.unshift(Array(COLS).fill(0));
            linesCleared++;
            r++; // Check the same row again
        }
    }
    
    if (linesCleared > 0) {
        updateScore(linesCleared);
    }
    
    return linesCleared;
}

function drawBoard() {
    // Clear the game area
    while (gameArea.firstChild) {
        gameArea.removeChild(gameArea.firstChild);
    }

    // Create grid cells
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            const cell = document.createElement('div');
            cell.style.position = 'absolute';
            cell.style.width = BLOCK_SIZE + 'px';
            cell.style.height = BLOCK_SIZE + 'px';
            cell.style.left = x * BLOCK_SIZE + 'px';
            cell.style.top = y * BLOCK_SIZE + 'px';
            cell.style.border = '1px solid rgba(255, 255, 255, 0.1)';
            
            // Add color if there's a block
            if (board[y][x]) {
                cell.style.backgroundColor = PIECE_COLORS[board[y][x] - 1];
            }
            
            gameArea.appendChild(cell);
        }
    }

    // Draw current piece
    if (currentPiece && !isPaused) {
        // Draw ghost piece first (so it appears behind the active piece)
        const ghostY = getGhostPosition();
        if (ghostY !== null && ghostY !== currentPiecePosition.y) {
            currentPiece.shape.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value) {
                        const cell = document.createElement('div');
                        cell.style.position = 'absolute';
                        cell.style.width = BLOCK_SIZE + 'px';
                        cell.style.height = BLOCK_SIZE + 'px';
                        cell.style.left = (currentPiecePosition.x + x) * BLOCK_SIZE + 'px';
                        cell.style.top = (ghostY + y) * BLOCK_SIZE + 'px';
                        cell.style.backgroundColor = currentPiece.color;
                        cell.style.opacity = '0.3';
                        cell.style.border = '1px solid rgba(255, 255, 255, 0.3)';
                        gameArea.appendChild(cell);
                    }
                });
            });
        }

        // Draw active piece on top
        currentPiece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    const cell = document.createElement('div');
                    cell.style.position = 'absolute';
                    cell.style.width = BLOCK_SIZE + 'px';
                    cell.style.height = BLOCK_SIZE + 'px';
                    cell.style.left = (currentPiecePosition.x + x) * BLOCK_SIZE + 'px';
                    cell.style.top = (currentPiecePosition.y + y) * BLOCK_SIZE + 'px';
                    cell.style.backgroundColor = currentPiece.color;
                    cell.style.border = '1px solid rgba(255, 255, 255, 0.5)';
                    gameArea.appendChild(cell);
                }
            });
        });
    }

    // Draw next piece preview
    drawNextPiece();
}

function gameLoop() {
    if (!isPaused && isGameActive) {
        movePiece(0, 1);
        drawBoard();
    }
}

function togglePause() {
    if (!isGameActive) return;
    
    isPaused = !isPaused;
    pauseBtn.textContent = isPaused ? 'Resume (P)' : 'Pause (P)';
    
    if (isPaused) {
        if (gameInterval) {
            clearInterval(gameInterval);
            gameInterval = null;
        }
        gameArea.classList.add('game-paused');
    } else {
        if (!gameInterval) {
            gameInterval = setInterval(gameLoop, gameSpeed);
        }
        gameArea.classList.remove('game-paused');
    }
    
    drawBoard();
}

function initGame() {
    displayHighScores();
    // Initialize game area size
    gameArea.style.width = COLS * BLOCK_SIZE + 'px';
    gameArea.style.height = ROWS * BLOCK_SIZE + 'px';
    
    // Initialize next piece area size
    nextPieceArea.style.width = 4 * SMALL_BLOCK_SIZE + 'px';
    nextPieceArea.style.height = 4 * SMALL_BLOCK_SIZE + 'px';
    
    // Draw initial empty board
    drawBoard();
}

function startGame() {
    console.log('startGame called'); // Debug log
    if (isGameActive) {
        console.log('Game already active, returning'); // Debug log
        return;
    }
    
    resetGame();
    isGameActive = true;
    isPaused = false;
    
    // Enable/disable appropriate buttons
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    resetBtn.disabled = false;
    
    // Create first pieces and set position
    currentPiece = createRandomPiece();
    nextPiece = createRandomPiece();
    currentPiecePosition = {
        x: Math.floor(COLS / 2) - Math.floor(currentPiece.shape[0].length / 2),
        y: 0
    };
    
    // Reset score and level
    score = 0;
    level = 1;
    lines = 0;
    updateScore();
    
    // Start game loop with initial speed
    gameSpeed = 1000;
    if (gameInterval) {
        clearInterval(gameInterval);
    }
    gameInterval = setInterval(gameLoop, gameSpeed);
    
    // Draw the initial board state
    drawBoard();
    console.log('Game started successfully!'); // Debug log
}

function getGhostPosition() {
    if (!currentPiece || !isGameActive || isPaused) return null;
    
    let ghostY = currentPiecePosition.y;
    
    while (!hasCollision(currentPiece.shape, currentPiecePosition.x, ghostY + 1)) {
        ghostY++;
    }
    
    return ghostY;
}
