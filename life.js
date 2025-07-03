var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

// Global state variables
var currentState = "title"; // "title", "act", "black", or "fin"
var currentAct = 1;
var stateTimer = 0;
var actTimer = 0;

// Title screen duration (300 frames = 5 seconds: 1.5s black + 2s animation + 1.5s hold)
const TITLE_DURATION = 300;
const BLACK_PERIOD = 90; // 1.5 seconds of black screen
const ANIMATION_PERIOD = 120; // 2 seconds of animation
const HOLD_PERIOD = 90; // 1.5 seconds holding final position
// Act durations (in frames at 60fps)
const ACT_DURATIONS = {
    1: 180, // 3 seconds for maze
    2: 180, // 3 seconds for rainbows
    3: 420  // 7 seconds for Conway's Game of Life (6s + 1s extra for collapse message)
};
// Black screen and fin screen durations
const BLACK_SCREEN_DURATION = 60; // 1 second
const FIN_SCREEN_DURATION = 180; // 3 seconds

// Maze variables for Act I
var maze = [];
var path = [];
var ratPosition = { x: 0, y: 0 };
var currentPathIndex = 0;
var framesPerStep = 0;
var stepTimer = 0;
var mazeInitialized = false;

// Maze configuration
const MAZE_SIZE = 10;
const MAZE_OFFSET_X = 0;
const MAZE_OFFSET_Y = 0;

// Rainbow variables for Act II
var rainbowTime = 0;

// Conway's Game of Life variables for Act III
var gameGrid = [];
var nextGrid = [];
var gameGeneration = 0;
var gameInitialized = false;
const GRID_WIDTH = 60;
const GRID_HEIGHT = 45;
var generationTimer = 0;
const GENERATIONS_PER_SECOND = 37; // Fast enough to fit B-heptomino's 148 generations in ~4 seconds
const FRAMES_PER_GENERATION = 60 / GENERATIONS_PER_SECOND;
var colonyCollapsed = false;
var collapseDetected = false;
var collapseAnimationTimer = 0;
var collapseTextY = 0;
const GAME_DURATION_FRAMES = 300; // 5 seconds of gameplay
var emptyFieldTimer = 0;
const EMPTY_FIELD_PAUSE = 15; // 250ms pause (15 frames at 60fps)
var showCollapseMessage = false;
var generationsAfterCollapse = 0;
const EXTRA_GENERATIONS_AFTER_COLLAPSE = 10;

// Simple Perlin noise implementation
function fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(a, b, t) {
    return a + t * (b - a);
}

function grad(hash, x, y) {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : 0;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}

// Simplified permutation table
const p = [];
for (let i = 0; i < 256; i++) {
    p[i] = Math.floor(Math.random() * 256);
}
for (let i = 0; i < 256; i++) {
    p[256 + i] = p[i];
}

function noise(x, y) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    
    x -= Math.floor(x);
    y -= Math.floor(y);
    
    const u = fade(x);
    const v = fade(y);
    
    const a = p[X] + Y;
    const aa = p[a];
    const ab = p[a + 1];
    const b = p[X + 1] + Y;
    const ba = p[b];
    const bb = p[b + 1];
    
    return lerp(
        lerp(grad(p[aa], x, y), grad(p[ba], x - 1, y), u),
        lerp(grad(p[ab], x, y - 1), grad(p[bb], x - 1, y - 1), u),
        v
    );
}

function getCellSize() {
    // Calculate cell size to fill the entire canvas
    return Math.min(canvas.width / MAZE_SIZE, canvas.height / MAZE_SIZE);
}

function initializeMaze() {
    if (mazeInitialized) return;
    
    // Create a simple maze (1 = wall, 0 = path)
    maze = [
        [0,1,0,0,0,1,0,0,0,0],
        [0,1,0,1,0,1,0,1,1,0],
        [0,0,0,1,0,0,0,0,1,0],
        [1,1,0,1,1,1,1,0,1,0],
        [0,0,0,0,0,0,1,0,0,0],
        [0,1,1,1,0,0,1,1,1,0],
        [0,0,0,1,0,0,0,0,0,0],
        [1,1,0,1,0,1,1,1,1,0],
        [0,0,0,0,0,0,0,0,1,0],
        [0,1,1,1,1,1,1,0,0,0]
    ];
    
    // Find path using DFS
    const start = { x: 0, y: 0 };
    const end = { x: 9, y: 9 };
    path = findPathDFS(start, end);
    
    // Set up animation timing
    if (path.length > 0) {
        framesPerStep = Math.floor(ACT_DURATIONS[1] / path.length);
        ratPosition = { ...path[0] };
        currentPathIndex = 0;
        stepTimer = 0;
    }
    
    mazeInitialized = true;
}

function findPathDFS(start, end) {
    const visited = Array(MAZE_SIZE).fill().map(() => Array(MAZE_SIZE).fill(false));
    const foundPath = [];
    
    function dfs(x, y, currentPath) {
        if (x < 0 || x >= MAZE_SIZE || y < 0 || y >= MAZE_SIZE) return false;
        if (visited[y][x] || maze[y][x] === 1) return false;
        
        visited[y][x] = true;
        currentPath.push({ x, y });
        
        if (x === end.x && y === end.y) {
            foundPath.push(...currentPath);
            return true;
        }
        
        // Try all four directions
        const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
        for (let [dx, dy] of directions) {
            if (dfs(x + dx, y + dy, currentPath)) {
                return true;
            }
        }
        
        currentPath.pop();
        return false;
    }
    
    dfs(start.x, start.y, []);
    return foundPath;
}

function drawMaze() {
    for (let y = 0; y < MAZE_SIZE; y++) {
        for (let x = 0; x < MAZE_SIZE; x++) {
            const cellX = MAZE_OFFSET_X + x * getCellSize();
            const cellY = MAZE_OFFSET_Y + y * getCellSize();
            
            if (maze[y][x] === 1) {
                // Wall
                ctx.fillStyle = "rgb(0, 0, 0)";
                ctx.fillRect(cellX, cellY, getCellSize(), getCellSize());
            } else {
                // Path
                ctx.fillStyle = "rgb(240, 240, 240)";
                ctx.fillRect(cellX, cellY, getCellSize(), getCellSize());
            }
            
            // Grid lines
            ctx.strokeStyle = "rgb(0, 0, 0)";
            ctx.lineWidth = 1;
            ctx.strokeRect(cellX, cellY, getCellSize(), getCellSize());
        }
    }
    
    // Draw S and E
    ctx.fillStyle = "rgb(0, 100, 0)";
    ctx.font = "32px serif";
    ctx.textAlign = "center";
    ctx.fillText("S", MAZE_OFFSET_X + getCellSize()/2, MAZE_OFFSET_Y + getCellSize()/2 + 10);
    ctx.fillText("E", MAZE_OFFSET_X + 9 * getCellSize() + getCellSize()/2, MAZE_OFFSET_Y + 9 * getCellSize() + getCellSize()/2 + 10);
    ctx.textAlign = "left";
}

function drawRat() {
    const ratX = MAZE_OFFSET_X + ratPosition.x * getCellSize() + getCellSize()/2;
    const ratY = MAZE_OFFSET_Y + ratPosition.y * getCellSize() + getCellSize()/2;
    
    // Draw tail (behind the body)
    ctx.strokeStyle = "rgb(200, 150, 150)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(ratX, ratY + 8);
    ctx.quadraticCurveTo(ratX - 15, ratY + 20, ratX - 8, ratY + 25);
    ctx.stroke();
    
    // Draw body (oval)
    ctx.fillStyle = "rgb(120, 120, 120)";
    ctx.beginPath();
    ctx.ellipse(ratX, ratY, 12, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw head (smaller oval)
    ctx.fillStyle = "rgb(130, 130, 130)";
    ctx.beginPath();
    ctx.ellipse(ratX, ratY - 10, 8, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw ears
    ctx.fillStyle = "rgb(150, 100, 100)";
    ctx.beginPath();
    ctx.ellipse(ratX - 5, ratY - 15, 3, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(ratX + 5, ratY - 15, 3, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw nose/snout
    ctx.fillStyle = "rgb(200, 150, 150)";
    ctx.beginPath();
    ctx.ellipse(ratX, ratY - 16, 2, 1, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw eyes (small black dots)
    ctx.fillStyle = "rgb(0, 0, 0)";
    ctx.beginPath();
    ctx.arc(ratX - 3, ratY - 12, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(ratX + 3, ratY - 12, 1.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw feet (small ovals)
    ctx.fillStyle = "rgb(150, 100, 100)";
    // Front feet
    ctx.beginPath();
    ctx.ellipse(ratX - 8, ratY - 3, 2, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(ratX + 8, ratY - 3, 2, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    // Back feet
    ctx.beginPath();
    ctx.ellipse(ratX - 6, ratY + 5, 2, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(ratX + 6, ratY + 5, 2, 3, 0, 0, Math.PI * 2);
    ctx.fill();
}

function updateRatPosition() {
    if (path.length === 0 || currentPathIndex >= path.length - 1) return;
    
    stepTimer++;
    if (stepTimer >= framesPerStep) {
        currentPathIndex++;
        if (currentPathIndex < path.length) {
            ratPosition = { ...path[currentPathIndex] };
        }
        stepTimer = 0;
    }
}

function drawTitleScreen(actNumber, subtitle) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Background
    ctx.fillStyle = "rgb(0, 0, 0)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Show pure black for first 1.5 seconds
    if (stateTimer < BLACK_PERIOD) {
        return;
    }
    
    // Determine current phase
    const animationTimer = stateTimer - BLACK_PERIOD;
    const isAnimationPhase = animationTimer < ANIMATION_PERIOD;
    const isHoldPhase = animationTimer >= ANIMATION_PERIOD;
    
    let animationProgress, fadeInProgress, subtitleAlpha;
    
    if (isAnimationPhase) {
        // Animation phase
        animationProgress = Math.min(animationTimer / ANIMATION_PERIOD, 1);
        fadeInProgress = Math.min(animationProgress * 2, 1); // Fade in over first half of animation
        
        // Subtitle fade-in (starts after 30% of animation)
        const subtitleStartProgress = 0.3;
        subtitleAlpha = 0;
        if (animationProgress > subtitleStartProgress) {
            const subtitleProgress = (animationProgress - subtitleStartProgress) / (1 - subtitleStartProgress);
            subtitleAlpha = Math.min(subtitleProgress * 1.5, 1) * fadeInProgress;
        }
    } else {
        // Hold phase - use final values
        animationProgress = 1;
        fadeInProgress = 1;
        subtitleAlpha = 1;
    }
    
    // Smooth easing function (ease out)
    const easeOut = 1 - Math.pow(1 - animationProgress, 3);
    
    // Act title position - starts in center, moves up
    const startY = canvas.height / 2;
    const endY = canvas.height / 2 - 30;
    const titleY = startY + (endY - startY) * easeOut;
    
    // Draw main title
    ctx.fillStyle = `rgba(255, 255, 255, ${fadeInProgress})`;
    ctx.font = "48px serif";
    ctx.textAlign = "center";
    ctx.fillText(`Act ${actNumber}`, canvas.width / 2, titleY);
    
    // Draw subtitle with fade
    if (subtitleAlpha > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${subtitleAlpha})`;
        ctx.font = "24px serif";
        ctx.fillText(subtitle, canvas.width / 2, titleY + 50);
    }
    
    // Reset text align
    ctx.textAlign = "left";
}

function drawFinScreen() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Background
    ctx.fillStyle = "rgb(0, 0, 0)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // "fin" text
    ctx.fillStyle = "rgb(255, 255, 255)";
    ctx.font = "48px serif";
    ctx.textAlign = "center";
    ctx.fillText("fin", canvas.width/2, canvas.height/2);
    
    // Reset text align
    ctx.textAlign = "left";
}

function actOne() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Initialize maze on first frame
    if (!mazeInitialized) {
        initializeMaze();
    }
    
    // White background
    ctx.fillStyle = "rgb(255, 255, 255)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw maze and rat
    drawMaze();
    updateRatPosition();
    drawRat();
}

function actTwo() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Black background
    ctx.fillStyle = "rgb(0, 0, 0)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const timeScale = rainbowTime * 0.03;
    
    // Draw flowing swirl curves
    const numSwirls = 15;
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    
    for (let s = 0; s < numSwirls; s++) {
        // Create swirl path
        ctx.beginPath();
        
        const centerX = (canvas.width / numSwirls) * s + (canvas.width / numSwirls / 2);
        const centerY = canvas.height * 0.5 + Math.sin(timeScale + s * 0.5) * 100;
        
        const swirlNoise = noise(centerX * 0.005, centerY * 0.005 + timeScale);
        const baseHue = (s * 24 + timeScale * 30 + swirlNoise * 180) % 360;
        
        // Create gradient for the swirl
        const gradient = ctx.createLinearGradient(
            centerX - 100, centerY - 100,
            centerX + 100, centerY + 100
        );
        gradient.addColorStop(0, `hsl(${baseHue}, 90%, 70%)`);
        gradient.addColorStop(0.5, `hsl(${(baseHue + 60) % 360}, 85%, 60%)`);
        gradient.addColorStop(1, `hsl(${(baseHue + 120) % 360}, 80%, 50%)`);
        
        ctx.strokeStyle = gradient;
        
        // Draw spiral swirl
        const spiralTurns = 3;
        const maxRadius = 80 + swirlNoise * 40;
        const points = 100;
        
        for (let i = 0; i <= points; i++) {
            const t = i / points;
            const angle = t * spiralTurns * Math.PI * 2 + timeScale + s;
            const radius = t * maxRadius;
            
            // Add noise-based organic variation
            const noiseVar = noise(
                centerX * 0.01 + Math.cos(angle) * 0.1,
                centerY * 0.01 + Math.sin(angle) * 0.1 + timeScale
            ) * 20;
            
            const x = centerX + Math.cos(angle) * (radius + noiseVar);
            const y = centerY + Math.sin(angle) * (radius + noiseVar);
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.stroke();
    }
    
    // Add flowing ribbon swirls
    const numRibbons = 8;
    for (let r = 0; r < numRibbons; r++) {
        ctx.beginPath();
        
        const ribbonY = (canvas.height / numRibbons) * r + Math.sin(timeScale * 0.7 + r) * 50;
        const ribbonHue = (r * 45 + timeScale * 40) % 360;
        
        // Create smooth wave path
        ctx.moveTo(-50, ribbonY);
        
        for (let x = -50; x <= canvas.width + 50; x += 10) {
            const wave1 = Math.sin((x / 120) + timeScale + r * 0.8) * 30;
            const wave2 = Math.sin((x / 200) + timeScale * 1.5 + r * 0.3) * 15;
            const noiseWave = noise(x * 0.008, ribbonY * 0.008 + timeScale) * 25;
            
            const y = ribbonY + wave1 + wave2 + noiseWave;
            
            ctx.lineTo(x, y);
        }
        
        // Create ribbon gradient
        const ribbonGradient = ctx.createLinearGradient(0, ribbonY - 40, 0, ribbonY + 40);
        ribbonGradient.addColorStop(0, `hsla(${ribbonHue}, 85%, 65%, 0.8)`);
        ribbonGradient.addColorStop(0.5, `hsla(${(ribbonHue + 30) % 360}, 90%, 70%, 0.9)`);
        ribbonGradient.addColorStop(1, `hsla(${(ribbonHue + 60) % 360}, 85%, 65%, 0.8)`);
        
        ctx.lineWidth = 25 + Math.sin(timeScale + r) * 8;
        ctx.strokeStyle = ribbonGradient;
        ctx.stroke();
    }
    
    // Add swirling particle trails
    const numTrails = 12;
    for (let t = 0; t < numTrails; t++) {
        ctx.beginPath();
        
        const trailStartX = (canvas.width / numTrails) * t;
        const trailHue = (t * 30 + timeScale * 60) % 360;
        
        ctx.moveTo(trailStartX, -20);
        
        for (let step = 0; step <= 50; step++) {
            const progress = step / 50;
            const x = trailStartX + Math.sin(progress * Math.PI * 4 + timeScale + t) * 80;
            const y = progress * (canvas.height + 40) - 20;
            
            const curlNoise = noise(x * 0.01, y * 0.01 + timeScale) * 40;
            const finalX = x + curlNoise;
            
            ctx.lineTo(finalX, y);
        }
        
        const trailGradient = ctx.createLinearGradient(trailStartX, 0, trailStartX, canvas.height);
        trailGradient.addColorStop(0, `hsla(${trailHue}, 95%, 75%, 0.6)`);
        trailGradient.addColorStop(0.5, `hsla(${(trailHue + 90) % 360}, 90%, 70%, 0.8)`);
        trailGradient.addColorStop(1, `hsla(${(trailHue + 180) % 360}, 85%, 65%, 0.4)`);
        
        ctx.lineWidth = 12;
        ctx.strokeStyle = trailGradient;
        ctx.stroke();
    }
    
    rainbowTime++;
}

function actThree() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Initialize Game of Life on first frame
    if (!gameInitialized) {
        initializeGameOfLife();
    }
    
    // Check if we're still in the game phase (first 5 seconds)
    if (actTimer < GAME_DURATION_FRAMES && !collapseDetected) {
        // Update simulation at controlled speed
        generationTimer++;
        if (generationTimer >= FRAMES_PER_GENERATION) {
            updateGameOfLife();
            generationTimer = 0;
            
            // Check for colony collapse after each generation
            checkColonyCollapse();
        }
        
        // Draw the game state
        drawGameOfLife();
    } else {
        // Either 5 seconds elapsed or colony collapsed - handle collapse sequence
        if (!collapseDetected) {
            // Force collapse if time ran out
            collapseDetected = true;
            emptyFieldTimer = 0;
            showCollapseMessage = false;
        }
        
        // Update collapse sequence timing
        updateCollapseSequence();
        
        // Always draw the final game state (empty field)
        drawGameOfLife();
        
        // Only draw collapse animation after pause period
        if (showCollapseMessage) {
            drawCollapseAnimation();
        }
    }
}

function drawBlackScreen() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Pure black screen
    ctx.fillStyle = "rgb(0, 0, 0)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function updateState() {
    stateTimer++;
    
    if (currentState === "title") {
        if (stateTimer >= TITLE_DURATION) {
            currentState = "act";
            stateTimer = 0;
            actTimer = 0;
            // Reset maze when starting Act I
            if (currentAct === 1) {
                mazeInitialized = false;
            }
            // Reset rainbow timer when starting Act II
            if (currentAct === 2) {
                rainbowTime = 0;
            }
            // Reset Game of Life when starting Act III
            if (currentAct === 3) {
                gameInitialized = false;
                gameGeneration = 0;
                generationTimer = 0;
                colonyCollapsed = false;
                collapseDetected = false;
                collapseAnimationTimer = 0;
                collapseTextY = 0;
                emptyFieldTimer = 0;
                showCollapseMessage = false;
                generationsAfterCollapse = 0;
            }
        }
    } else if (currentState === "act") {
        actTimer++;
        
        // Use appropriate duration for current act
        const currentActDuration = ACT_DURATIONS[currentAct];
        
        // Transition logic between acts
        if (actTimer >= currentActDuration) {
            if (currentAct < 3) {
                currentAct++;
                currentState = "title";
                stateTimer = 0;
            } else {
                // After Act III, go to black screen
                currentState = "black";
                stateTimer = 0;
            }
        }
    } else if (currentState === "black") {
        if (stateTimer >= BLACK_SCREEN_DURATION) {
            currentState = "fin";
            stateTimer = 0;
        }
    } else if (currentState === "fin") {
        if (stateTimer >= FIN_SCREEN_DURATION) {
            // After fin screen, stay on fin (or could loop back to beginning)
            // For now, just stay on fin screen
        }
    }
}

function draw() {
    if (currentState === "title") {
        const subtitles = ["Ever feel like a rat in a maze?", "Chaos is everywhere!  It's beautiful (and disturbing)", "Life is short..."];
        drawTitleScreen(currentAct, subtitles[currentAct - 1]);
    } else if (currentState === "black") {
        drawBlackScreen();
    } else if (currentState === "fin") {
        drawFinScreen();
    } else {
        switch (currentAct) {
            case 1:
                actOne();
                break;
            case 2:
                actTwo();
                break;
            case 3:
                actThree();
                break;
        }
    }
}

function loop() {
    updateState();
    draw();
    requestAnimationFrame(loop);
}

// Start the animation
requestAnimationFrame(loop);

function initializeGameOfLife() {
    if (gameInitialized) return;
    
    // Initialize empty grids
    gameGrid = Array(GRID_HEIGHT).fill().map(() => Array(GRID_WIDTH).fill(0));
    nextGrid = Array(GRID_HEIGHT).fill().map(() => Array(GRID_WIDTH).fill(0));
    gameGeneration = 0;
    generationTimer = 0;
    
    // Use B-heptomino: well-known pattern that dies after 148 generations
    const centerX = Math.floor(GRID_WIDTH / 2);
    const centerY = Math.floor(GRID_HEIGHT / 2);
    
    // B-heptomino pattern
    const bHeptomino = [
        [1,0,1,1],
        [1,1,1,0],
        [0,1,0,0]
    ];
    
    placePattern(bHeptomino, centerX - 1, centerY - 1);
    
    gameInitialized = true;
}

function placePattern(pattern, startX, startY) {
    for (let y = 0; y < pattern.length; y++) {
        for (let x = 0; x < pattern[y].length; x++) {
            if (startY + y < GRID_HEIGHT && startX + x < GRID_WIDTH) {
                gameGrid[startY + y][startX + x] = pattern[y][x];
            }
        }
    }
}

function countNeighbors(grid, x, y) {
    let count = 0;
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            
            const nx = x + dx;
            const ny = y + dy;
            
            if (nx >= 0 && nx < GRID_WIDTH && ny >= 0 && ny < GRID_HEIGHT) {
                count += grid[ny][nx];
            }
        }
    }
    return count;
}

function updateGameOfLife() {
    // Clear next grid
    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            nextGrid[y][x] = 0;
        }
    }
    
    // Apply Conway's rules
    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            const neighbors = countNeighbors(gameGrid, x, y);
            const isAlive = gameGrid[y][x] === 1;
            
            if (isAlive) {
                // Live cell survives with 2 or 3 neighbors
                if (neighbors === 2 || neighbors === 3) {
                    nextGrid[y][x] = 1;
                }
            } else {
                // Dead cell becomes alive with exactly 3 neighbors
                if (neighbors === 3) {
                    nextGrid[y][x] = 1;
                }
            }
        }
    }
    
    // Swap grids
    const temp = gameGrid;
    gameGrid = nextGrid;
    nextGrid = temp;
    
    gameGeneration++;
}

function drawGameOfLife() {
    const cellWidth = Math.floor(canvas.width / GRID_WIDTH);
    const cellHeight = Math.floor(canvas.height / GRID_HEIGHT);
    
    // Draw solid dark background first
    ctx.fillStyle = "rgb(10, 10, 20)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Only draw living cells
    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            if (gameGrid[y][x] === 1) {
                const cellX = Math.floor(x * cellWidth);
                const cellY = Math.floor(y * cellHeight);
                
                // Live cell - bright rainbow color based on position and generation
                const hue = (x * 6 + y * 4 + gameGeneration * 3) % 360;
                const saturation = 80 + Math.sin(gameGeneration * 0.1 + x * 0.1) * 20;
                const lightness = 60 + Math.sin(gameGeneration * 0.15 + y * 0.1) * 30;
                
                ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
                ctx.fillRect(cellX, cellY, cellWidth, cellHeight);
            }
        }
    }
}

function checkColonyCollapse() {
    // Count living cells
    let livingCells = 0;
    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            if (gameGrid[y][x] === 1) {
                livingCells++;
            }
        }
    }
    
    if (livingCells === 0) {
        if (!colonyCollapsed) {
            // First time we detect zero cells - start counting extra generations
            colonyCollapsed = true;
            generationsAfterCollapse = 0;
        } else {
            // Colony already collapsed, increment counter
            generationsAfterCollapse++;
            
            // After 10 extra generations, trigger collapse detection
            if (generationsAfterCollapse >= EXTRA_GENERATIONS_AFTER_COLLAPSE && !collapseDetected) {
                collapseDetected = true;
                emptyFieldTimer = 0;
                showCollapseMessage = false;
            }
        }
        return true;
    } else {
        // Reset if cells come back to life (shouldn't happen with our pattern)
        colonyCollapsed = false;
        generationsAfterCollapse = 0;
        return false;
    }
}

function updateCollapseSequence() {
    if (collapseDetected && !showCollapseMessage) {
        emptyFieldTimer++;
        if (emptyFieldTimer >= EMPTY_FIELD_PAUSE) {
            showCollapseMessage = true;
            collapseTextY = canvas.height / 2; // Start from middle
            collapseAnimationTimer = 0;
        }
    }
    
    if (showCollapseMessage) {
        collapseAnimationTimer++;
    }
}

function drawCollapseAnimation() {
    // Dark overlay
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // "Colony Collapsed" text that moves up at 50px/sec
    const textMoveSpeed = 50 / 60; // 50px per second = 50/60 px per frame
    collapseTextY -= textMoveSpeed;
    
    // Draw the text with glow effect
    ctx.font = "48px serif";
    ctx.textAlign = "center";
    
    // Text glow
    ctx.shadowColor = "rgba(255, 50, 50, 0.8)";
    ctx.shadowBlur = 20;
    ctx.fillStyle = "rgb(255, 100, 100)";
    ctx.fillText("COLONY COLLAPSE", canvas.width / 2, collapseTextY);
    
    // Remove shadow for clean text
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgb(255, 200, 200)";
    ctx.fillText("COLONY COLLAPSE", canvas.width / 2, collapseTextY);
    
    // Reset text alignment
    ctx.textAlign = "left";
    
    collapseAnimationTimer++;
}
  
  