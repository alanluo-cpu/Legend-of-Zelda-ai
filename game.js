// Game variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game state
let gameState = {
    score: 0,
    rupees: 0,
    health: 3,
    maxHealth: 3,
    inCombat: false,
    zeldaFreed: false
};

// Player (Link) object
const player = {
    x: 400,
    y: 300,
    width: 16,
    height: 16,
    speed: 2,
    direction: 'down'
};

// Game objects arrays
let chests = [];
let enemies = [];
let hearts = [];

// Input handling
const keys = {};

// Initialize game
function init() {
    setupEventListeners();
    createInitialObjects();
    gameLoop();
}

// Event listeners
function setupEventListeners() {
    // Keyboard input
    document.addEventListener('keydown', (e) => {
        keys[e.key.toLowerCase()] = true;
    });
    
    document.addEventListener('keyup', (e) => {
        keys[e.key.toLowerCase()] = false;
    });
    
    // Combat modal
    document.getElementById('submitAnswer').addEventListener('click', handleCombatAnswer);
    document.getElementById('mathAnswer').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleCombatAnswer();
        }
    });
}

// Create initial game objects
function createInitialObjects() {
    // Create chests
    for (let i = 0; i < 3; i++) {
        createChest();
    }
    
    // Create enemies
    for (let i = 0; i < 4; i++) {
        createEnemy();
    }
    
    // Create hearts
    for (let i = 0; i < 2; i++) {
        createHeart();
    }
}

// Create a chest at random position
function createChest() {
    const chest = {
        x: Math.random() * (canvas.width - 20),
        y: Math.random() * (canvas.height - 20),
        width: 20,
        height: 20,
        collected: false,
        respawnTimer: 0
    };
    chests.push(chest);
}

// Create an enemy with movement pattern
function createEnemy() {
    const enemy = {
        x: Math.random() * (canvas.width - 16),
        y: Math.random() * (canvas.height - 16),
        width: 16,
        height: 16,
        speed: 1,
        direction: Math.random() * Math.PI * 2,
        health: 2,
        maxHealth: 2,
        moveTimer: 0,
        defeated: false
    };
    enemies.push(enemy);
}

// Create a heart pickup
function createHeart() {
    const heart = {
        x: Math.random() * (canvas.width - 12),
        y: Math.random() * (canvas.height - 12),
        width: 12,
        height: 12,
        collected: false
    };
    hearts.push(heart);
}

// Update game objects
function update() {
    if (gameState.inCombat) return;
    
    updatePlayer();
    updateChests();
    updateEnemies();
    updateHearts();
    checkCollisions();
    updateUI();
}

// Update player movement
function updatePlayer() {
    let newX = player.x;
    let newY = player.y;
    
    if (keys['w'] || keys['arrowup']) {
        newY -= player.speed;
        player.direction = 'up';
    }
    if (keys['s'] || keys['arrowdown']) {
        newY += player.speed;
        player.direction = 'down';
    }
    if (keys['a'] || keys['arrowleft']) {
        newX -= player.speed;
        player.direction = 'left';
    }
    if (keys['d'] || keys['arrowright']) {
        newX += player.speed;
        player.direction = 'right';
    }
    
    // Keep player within canvas bounds
    player.x = Math.max(0, Math.min(canvas.width - player.width, newX));
    player.y = Math.max(0, Math.min(canvas.height - player.height, newY));
}

// Update chests
function updateChests() {
    chests.forEach(chest => {
        if (chest.collected) {
            chest.respawnTimer++;
            if (chest.respawnTimer > 300) { // 5 seconds at 60fps
                chest.x = Math.random() * (canvas.width - 20);
                chest.y = Math.random() * (canvas.height - 20);
                chest.collected = false;
                chest.respawnTimer = 0;
            }
        }
    });
}

// Update enemies
function updateEnemies() {
    enemies.forEach(enemy => {
        if (enemy.defeated) return;
        
        enemy.moveTimer++;
        if (enemy.moveTimer > 60) { // Change direction every second
            enemy.direction = Math.random() * Math.PI * 2;
            enemy.moveTimer = 0;
        }
        
        // Move enemy
        enemy.x += Math.cos(enemy.direction) * enemy.speed;
        enemy.y += Math.sin(enemy.direction) * enemy.speed;
        
        // Keep enemy within bounds
        enemy.x = Math.max(0, Math.min(canvas.width - enemy.width, enemy.x));
        enemy.y = Math.max(0, Math.min(canvas.height - enemy.height, enemy.y));
    });
}

// Update hearts
function updateHearts() {
    // Hearts don't move, just check if collected
}

// Check collisions
function checkCollisions() {
    // Check chest collisions
    chests.forEach(chest => {
        if (!chest.collected && isColliding(player, chest)) {
            chest.collected = true;
            gameState.rupees += 3;
        }
    });
    
    // Check heart collisions
    hearts.forEach(heart => {
        if (!heart.collected && isColliding(player, heart)) {
            heart.collected = true;
            if (gameState.health < gameState.maxHealth) {
                gameState.health++;
            }
        }
    });
    
    // Check enemy collisions
    enemies.forEach(enemy => {
        if (!enemy.defeated && isColliding(player, enemy)) {
            startCombat(enemy);
        }
    });
    
    // Check Zelda cage collision
    if (gameState.score >= 100 && !gameState.zeldaFreed && isColliding(player, {x: 50, y: 50, width: 30, height: 30})) {
        gameState.zeldaFreed = true;
        showVictoryModal();
    }
}

// Collision detection
function isColliding(obj1, obj2) {
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
}

// Start combat with enemy
function startCombat(enemy) {
    gameState.inCombat = true;
    gameState.currentEnemy = enemy;
    
    // Generate math problem
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const operation = Math.random() > 0.5 ? '+' : '-';
    
    let problem, answer;
    if (operation === '+') {
        problem = `${num1} + ${num2} = ?`;
        answer = num1 + num2;
    } else {
        // Ensure positive result
        const larger = Math.max(num1, num2);
        const smaller = Math.min(num1, num2);
        problem = `${larger} - ${smaller} = ?`;
        answer = larger - smaller;
    }
    
    gameState.currentAnswer = answer;
    document.getElementById('mathProblem').textContent = `Solve: ${problem}`;
    document.getElementById('mathAnswer').value = '';
    document.getElementById('combatResult').textContent = '';
    document.getElementById('combatModal').style.display = 'block';
    document.getElementById('mathAnswer').focus();
}

// Handle combat answer
function handleCombatAnswer() {
    const userAnswer = parseInt(document.getElementById('mathAnswer').value);
    const resultDiv = document.getElementById('combatResult');
    
    if (userAnswer === gameState.currentAnswer) {
        resultDiv.textContent = 'Correct! You dealt damage!';
        resultDiv.style.color = '#00FF00';
        
        gameState.currentEnemy.health--;
        if (gameState.currentEnemy.health <= 0) {
            gameState.currentEnemy.defeated = true;
            gameState.score += 10;
            resultDiv.textContent += ' Enemy defeated! +10 points!';
        }
    } else {
        resultDiv.textContent = 'Wrong answer! You took damage!';
        resultDiv.style.color = '#FF0000';
        gameState.health--;
        
        if (gameState.health <= 0) {
            alert('Game Over! You died!');
            location.reload();
        }
    }
    
    setTimeout(() => {
        document.getElementById('combatModal').style.display = 'none';
        gameState.inCombat = false;
        gameState.currentEnemy = null;
    }, 2000);
}

// Show victory modal
function showVictoryModal() {
    document.getElementById('finalScore').textContent = gameState.score;
    document.getElementById('victoryModal').style.display = 'block';
}

// Update UI
function updateUI() {
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('rupees').textContent = gameState.rupees;
    
    // Update hearts display
    const heartElements = document.querySelectorAll('.heart');
    heartElements.forEach((heart, index) => {
        if (index < gameState.health) {
            heart.classList.remove('empty');
        } else {
            heart.classList.add('empty');
        }
    });
}

// Render game
function render() {
    // Clear canvas
    ctx.fillStyle = '#228B22';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grass pattern
    drawGrassPattern();
    
    // Draw Zelda cage
    drawZeldaCage();
    
    // Draw chests
    chests.forEach(chest => {
        if (!chest.collected) {
            drawChest(chest.x, chest.y);
        }
    });
    
    // Draw hearts
    hearts.forEach(heart => {
        if (!heart.collected) {
            drawHeart(heart.x, heart.y);
        }
    });
    
    // Draw enemies
    enemies.forEach(enemy => {
        if (!enemy.defeated) {
            drawEnemy(enemy.x, enemy.y);
        }
    });
    
    // Draw player (Link)
    drawLink(player.x, player.y, player.direction);
}

// Draw grass pattern
function drawGrassPattern() {
    ctx.fillStyle = '#32CD32';
    for (let x = 0; x < canvas.width; x += 20) {
        for (let y = 0; y < canvas.height; y += 20) {
            if ((x + y) % 40 === 0) {
                ctx.fillRect(x, y, 20, 20);
            }
        }
    }
}

// Draw Link sprite
function drawLink(x, y, direction) {
    ctx.save();
    ctx.translate(x + 8, y + 8);
    
    // Link's body (green tunic)
    ctx.fillStyle = '#00AA00';
    ctx.fillRect(-6, -4, 12, 8);
    
    // Link's head
    ctx.fillStyle = '#FFDBAC';
    ctx.fillRect(-4, -8, 8, 6);
    
    // Link's hat
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(-5, -8, 10, 3);
    
    // Link's eyes
    ctx.fillStyle = '#000';
    ctx.fillRect(-2, -6, 1, 1);
    ctx.fillRect(1, -6, 1, 1);
    
    // Link's sword (based on direction)
    ctx.fillStyle = '#C0C0C0';
    if (direction === 'right') {
        ctx.fillRect(6, -2, 8, 2);
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(14, -1, 2, 4);
    } else if (direction === 'left') {
        ctx.fillRect(-14, -2, 8, 2);
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-16, -1, 2, 4);
    } else if (direction === 'up') {
        ctx.fillRect(-1, -14, 2, 8);
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-2, -16, 4, 2);
    } else { // down
        ctx.fillRect(-1, 6, 2, 8);
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-2, 14, 4, 2);
    }
    
    ctx.restore();
}

// Draw chest
function drawChest(x, y) {
    // Chest body
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(x, y, 20, 15);
    
    // Chest lid
    ctx.fillStyle = '#A0522D';
    ctx.fillRect(x, y, 20, 8);
    
    // Chest lock
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(x + 8, y + 4, 4, 4);
    
    // Chest highlights
    ctx.fillStyle = '#DEB887';
    ctx.fillRect(x + 1, y + 1, 18, 2);
    ctx.fillRect(x + 1, y + 1, 2, 6);
}

// Draw enemy (Moblin-like)
function drawEnemy(x, y) {
    // Enemy body
    ctx.fillStyle = '#8B0000';
    ctx.fillRect(x, y, 16, 12);
    
    // Enemy head
    ctx.fillStyle = '#FF6347';
    ctx.fillRect(x + 2, y - 4, 12, 8);
    
    // Enemy eyes
    ctx.fillStyle = '#000';
    ctx.fillRect(x + 4, y - 2, 2, 2);
    ctx.fillRect(x + 10, y - 2, 2, 2);
    
    // Enemy weapon
    ctx.fillStyle = '#696969';
    ctx.fillRect(x + 16, y + 2, 6, 2);
}

// Draw heart
function drawHeart(x, y) {
    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.moveTo(x + 6, y + 3);
    ctx.bezierCurveTo(x + 6, y, x + 3, y, x + 3, y + 3);
    ctx.bezierCurveTo(x + 3, y, x, y, x, y + 3);
    ctx.bezierCurveTo(x, y + 6, x + 3, y + 9, x + 6, y + 12);
    ctx.bezierCurveTo(x + 9, y + 9, x + 12, y + 6, x + 12, y + 3);
    ctx.bezierCurveTo(x + 12, y, x + 9, y, x + 9, y + 3);
    ctx.bezierCurveTo(x + 9, y, x + 6, y, x + 6, y + 3);
    ctx.fill();
}

// Draw Zelda's cage
function drawZeldaCage() {
    const cageX = 50;
    const cageY = 50;
    
    // Cage bars
    ctx.fillStyle = '#8B4513';
    for (let i = 0; i < 4; i++) {
        ctx.fillRect(cageX + i * 8, cageY, 4, 30);
        ctx.fillRect(cageX, cageY + i * 8, 30, 4);
    }
    
    // Princess Zelda inside
    if (!gameState.zeldaFreed) {
        ctx.fillStyle = '#FFB6C1';
        ctx.fillRect(cageX + 8, cageY + 8, 8, 8);
        
        // Zelda's dress
        ctx.fillStyle = '#FF69B4';
        ctx.fillRect(cageX + 6, cageY + 16, 12, 8);
        
        // Zelda's crown
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(cageX + 7, cageY + 6, 10, 3);
    }
}

// Game loop
function gameLoop() {
    update();
    render();
    requestAnimationFrame(gameLoop);
}

// Start the game
init();
