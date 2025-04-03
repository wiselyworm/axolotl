const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// HTML UI Elements
const mathUI = document.getElementById('math-ui');
const questionLabel = document.getElementById('question-label');
const answerInput = document.getElementById('answer-input');
const submitButton = document.getElementById('submit-button');
const feedbackDiv = document.getElementById('feedback');
const gameContainer = document.getElementById('game-container');
const instructionText = document.getElementById('instruction-text');
const winTextContainer = document.getElementById('win-text-container'); // For win text

// Audio Elements
const bgm = document.getElementById('bgm');
const correctSound = document.getElementById('correctSound');
let audioStarted = false; // Flag to start audio on first interaction

// Game States (No changes needed)
const GameState = {
    RUNNING: 'RUNNING',
    ASKING_QUESTION: 'ASKING_QUESTION',
    GAME_WON: 'GAME_WON'
};
let currentGameState = GameState.RUNNING;

// Game Variables
let problemsSolved = 0;
const problemsToWin = 10;
let gameSpeed = 2.5;
let frameCount = 0;

// Ground Level
const groundLevel = canvas.height - 60; // Make ground slightly thicker

// Player (Axolotl - No changes to structure needed)
const player = {
    baseX: 80,
    y: groundLevel - 40,
    baseWidth: 45,
    baseHeight: 30,
    sizeMultiplier: 1.0,
    get currentWidth() { return this.baseWidth * this.sizeMultiplier; },
    get currentHeight() { return this.baseHeight * this.sizeMultiplier; },
    get currentY() { return groundLevel - this.currentHeight; },
    color: '#FFC0CB', // Slightly softer pink
    gillColor: '#FF69B4',
    eyeColor: '#333' // Darker eye
};

// Enemies - Now with types!
let enemies = [];
const enemyTypes = ['octopus', 'pufferfish', 'crab'];
const enemySpawnRate = 260; // Slightly less frequent maybe

// Background Elements
let clouds = [];
const cloudSpawnRate = 150; // More clouds
let birds = [];
const birdSpawnRate = 280;

// --- NEW: Particle System for Affirmation ---
let particles = [];

// --- Drawing Functions ---

function drawGround() {
    // Base ground color
    ctx.fillStyle = '#967969'; // More muted brown
    ctx.fillRect(0, groundLevel, canvas.width, canvas.height - groundLevel);

    // Add some texture (pebbles/dirt)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'; // Darker translucent spots
    for (let i = 0; i < 80; i++) { // Draw some random darker spots
        const x = Math.random() * canvas.width;
        const y = groundLevel + Math.random() * (canvas.height - groundLevel - 5); // Within ground area
        const size = Math.random() * 4 + 1;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
    // Add some subtle grass tufts
    ctx.fillStyle = '#558B2F'; // Darker Green
     for (let i = 0; i < 30; i++) {
        const x = Math.random() * canvas.width;
        const startY = groundLevel + 2;
        const grassHeight = Math.random() * 8 + 5;
        const curve = Math.random() * 6 - 3; // Slight curve
         ctx.beginPath();
         ctx.moveTo(x - 2, startY);
         ctx.lineTo(x, startY - grassHeight);
         ctx.lineTo(x + 2, startY);
         ctx.closePath();
         ctx.fill();
     }
}

// --- UPDATED Player Drawing ---
function drawPlayer() {
    // ... (Previous player drawing code - adjust colors if desired) ...
    const x = player.baseX;
    const y = player.currentY;
    const w = player.currentWidth;
    const h = player.currentHeight;
    const eyeSize = 3.5 * player.sizeMultiplier; // Slightly bigger eyes
    const limbWidth = 6 * player.sizeMultiplier;
    const limbLength = 11 * player.sizeMultiplier; // Slightly longer limbs
    const gillSize = 6 * player.sizeMultiplier;
    const gillOffsetY = 4 * player.sizeMultiplier;

    // Rounded corners for body
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.moveTo(x + 5, y);
    ctx.lineTo(x + w - 5, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + 5);
    ctx.lineTo(x + w, y + h - 5);
    ctx.quadraticCurveTo(x + w, y + h, x + w - 5, y + h);
    ctx.lineTo(x + 5, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - 5);
    ctx.lineTo(x, y + 5);
    ctx.quadraticCurveTo(x, y, x + 5, y);
    ctx.closePath();
    ctx.fill();


    // Legs (behind body) - Slightly rounded ends
    ctx.fillStyle = player.color;
    ctx.fillRect(x + w * 0.2 - limbWidth / 2, y + h*0.9, limbWidth, limbLength); // Back leg
    ctx.fillRect(x + w * 0.8 - limbWidth / 2, y + h*0.9, limbWidth, limbLength); // Front leg
    // Feet (simple circles)
    ctx.beginPath();
    ctx.arc(x + w * 0.2, y + h*0.9 + limbLength, limbWidth*0.6, 0, Math.PI*2); // back foot
    ctx.arc(x + w * 0.8, y + h*0.9 + limbLength, limbWidth*0.6, 0, Math.PI*2); // front foot
    ctx.fill();


    // Arms (slightly in front) - Rounded ends
     ctx.fillRect(x + w * 0.3 - limbWidth / 2, y + h * 0.5, limbWidth, limbLength); // Back arm
    ctx.fillRect(x + w * 0.7 - limbWidth / 2, y + h * 0.5, limbWidth, limbLength); // Front arm
    // Hands (simple circles)
    ctx.beginPath();
    ctx.arc(x + w * 0.3, y + h * 0.5 + limbLength, limbWidth*0.6, 0, Math.PI*2); // back hand
    ctx.arc(x + w * 0.7, y + h * 0.5 + limbLength, limbWidth*0.6, 0, Math.PI*2); // front hand
    ctx.fill();


    // Gills - Slightly more detailed/separated
    ctx.fillStyle = player.gillColor;
    const gillSpacing = gillSize * 1.8;
    // Left Gills
    ctx.fillRect(x - gillSize*1.2, y + gillOffsetY, gillSize, gillSize);
    ctx.fillRect(x - gillSize*1.5, y + gillOffsetY + gillSpacing, gillSize*0.8, gillSize*0.8);
    ctx.fillRect(x - gillSize*1.2, y + gillOffsetY + gillSpacing * 2, gillSize*0.7, gillSize*0.7);
    // Right Gills
    ctx.fillRect(x + w + gillSize*0.2, y + gillOffsetY, gillSize, gillSize);
    ctx.fillRect(x + w + gillSize*0.5, y + gillOffsetY + gillSpacing, gillSize*0.8, gillSize*0.8);
    ctx.fillRect(x + w + gillSize*0.2, y + gillOffsetY + gillSpacing * 2, gillSize*0.7, gillSize*0.7);


    // Eyes - Add a tiny highlight
    ctx.fillStyle = player.eyeColor;
    ctx.beginPath();
    ctx.arc(x + w * 0.65, y + h * 0.4, eyeSize, 0, Math.PI * 2); // Right eye
    ctx.arc(x + w * 0.85, y + h * 0.4, eyeSize, 0, Math.PI * 2); // Left eye
    ctx.fill();
     // Highlight
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(x + w * 0.65 + eyeSize * 0.3, y + h * 0.4 - eyeSize * 0.3, eyeSize * 0.3, 0, Math.PI * 2);
    ctx.arc(x + w * 0.85 + eyeSize * 0.3, y + h * 0.4 - eyeSize * 0.3, eyeSize * 0.3, 0, Math.PI * 2);
    ctx.fill();
}


// --- UPDATED Enemy Drawing ---
function drawEnemies() {
    enemies.forEach(enemy => {
        // Call specific draw function based on type
        switch (enemy.type) {
            case 'octopus':
                drawOctopus(enemy);
                break;
            case 'pufferfish':
                drawPufferfish(enemy);
                break;
            case 'crab':
                drawCrab(enemy);
                break;
            default: // Fallback just in case
                 ctx.fillStyle = 'red';
                 ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        }
        // Optional: Draw bounding box for debugging
        // ctx.strokeStyle = 'red';
        // ctx.strokeRect(enemy.x, enemy.y, enemy.width, enemy.height);
    });
}

function drawOctopus(enemy) {
    const headRadius = enemy.width * 0.4;
    const headX = enemy.x + enemy.width / 2;
    const headY = enemy.y + headRadius * 0.8;
    const color = '#E0BBE4'; // Lavender Purple

    // Tentacles (softer curves)
    ctx.strokeStyle = color;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round'; // Rounded ends
    ctx.beginPath();
    // Bottom tentacles
    ctx.moveTo(headX - headRadius * 0.5, headY + headRadius * 0.5);
    ctx.quadraticCurveTo(headX - headRadius, enemy.y + enemy.height + 8, headX - headRadius * 0.8, enemy.y + enemy.height - 8);
    ctx.moveTo(headX + headRadius * 0.5, headY + headRadius * 0.5);
    ctx.quadraticCurveTo(headX + headRadius, enemy.y + enemy.height + 8, headX + headRadius * 0.8, enemy.y + enemy.height - 8);
    // Side tentacles
    ctx.moveTo(headX - headRadius * 0.8, headY);
    ctx.quadraticCurveTo(headX - headRadius * 1.5, headY + headRadius*1.2, headX - headRadius * 1.2, enemy.y + enemy.height - 2);
     ctx.moveTo(headX + headRadius * 0.8, headY);
    ctx.quadraticCurveTo(headX + headRadius * 1.5, headY + headRadius*1.2, headX + headRadius * 1.2, enemy.y + enemy.height - 2);
    ctx.stroke();
    ctx.lineWidth = 1; // Reset
    ctx.lineCap = 'butt'; // Reset

    // Head
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(headX, headY, headRadius, 0, Math.PI * 2);
    ctx.fill();

    // Eyes (bigger, simpler)
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(headX - headRadius * 0.35, headY - headRadius * 0.1, 4, 0, Math.PI * 2);
    ctx.arc(headX + headRadius * 0.35, headY - headRadius * 0.1, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#333'; // Pupil
    ctx.beginPath();
    ctx.arc(headX - headRadius * 0.35, headY - headRadius * 0.1 + 1, 2, 0, Math.PI * 2); // Looking slightly down
    ctx.arc(headX + headRadius * 0.35, headY - headRadius * 0.1 + 1, 2, 0, Math.PI * 2); // Looking slightly down
    ctx.fill();
}

function drawPufferfish(enemy) {
    const centerX = enemy.x + enemy.width / 2;
    const centerY = enemy.y + enemy.height / 2;
    const bodyRadius = enemy.width * 0.4 * enemy.scale; // Use scale
    const color = '#FFD700'; // Gold

    // Spikes
    ctx.strokeStyle = '#DAA520'; // Goldenrod
    ctx.lineWidth = 2;
    const spikeLength = bodyRadius * 0.3;
    for (let i = 0; i < 8; i++) { // Draw 8 spikes around
        const angle = (i / 8) * Math.PI * 2;
        const startX = centerX + Math.cos(angle) * bodyRadius * 0.9;
        const startY = centerY + Math.sin(angle) * bodyRadius * 0.9;
        const endX = centerX + Math.cos(angle) * (bodyRadius + spikeLength);
        const endY = centerY + Math.sin(angle) * (bodyRadius + spikeLength);
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
    }

    // Body
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(centerX, centerY, bodyRadius, 0, Math.PI * 2);
    ctx.fill();

     // Eyes (big and cute)
    ctx.fillStyle = 'white';
    const eyeRadius = bodyRadius * 0.2;
    ctx.beginPath();
    ctx.arc(centerX - bodyRadius * 0.4, centerY - bodyRadius * 0.2, eyeRadius, 0, Math.PI * 2);
    ctx.arc(centerX + bodyRadius * 0.4, centerY - bodyRadius * 0.2, eyeRadius, 0, Math.PI * 2);
    ctx.fill();
    // Pupils
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(centerX - bodyRadius * 0.4 + eyeRadius * 0.1, centerY - bodyRadius * 0.2 + eyeRadius * 0.1, eyeRadius * 0.5, 0, Math.PI * 2);
    ctx.arc(centerX + bodyRadius * 0.4 + eyeRadius * 0.1, centerY - bodyRadius * 0.2 + eyeRadius * 0.1, eyeRadius * 0.5, 0, Math.PI * 2);
    ctx.fill();

    // Tiny Mouth
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(centerX, centerY + bodyRadius * 0.3, bodyRadius * 0.2, 0.2 * Math.PI, 0.8 * Math.PI); // Small smile arc
    ctx.stroke();
    ctx.lineWidth = 1; // Reset
}

function drawCrab(enemy) {
    const bodyWidth = enemy.width * 0.8;
    const bodyHeight = enemy.height * 0.5;
    const bodyX = enemy.x + (enemy.width - bodyWidth) / 2;
    const bodyY = enemy.y + enemy.height * 0.3;
    const color = '#FF7F50'; // Coral

    // Legs (simple lines)
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    const legLength = bodyWidth * 0.5;
    const legY = bodyY + bodyHeight * 0.8;
    for (let i = -1; i <= 1; i += 2) { // Left and Right sets
         ctx.beginPath();
         ctx.moveTo(bodyX + bodyWidth / 2 + (bodyWidth * 0.4 * i), legY); // Upper leg joint
         ctx.lineTo(bodyX + bodyWidth / 2 + (bodyWidth * 0.6 * i), legY + legLength * 0.6); // Knee
         ctx.lineTo(bodyX + bodyWidth / 2 + (bodyWidth * 0.5 * i), legY + legLength); // Foot
         ctx.moveTo(bodyX + bodyWidth / 2 + (bodyWidth * 0.1 * i), legY); // Lower leg joint
         ctx.lineTo(bodyX + bodyWidth / 2 + (bodyWidth * 0.3 * i), legY + legLength * 0.8); // Knee
         ctx.lineTo(bodyX + bodyWidth / 2 + (bodyWidth * 0.1 * i), legY + legLength * 1.1); // Foot
         ctx.stroke();
    }


    // Claws (ovals)
    const clawSize = bodyWidth * 0.3;
    const clawY = bodyY + bodyHeight * 0.2;
    const clawXOffset = bodyWidth * 0.55;
    ctx.fillStyle = '#DC143C'; // Crimson for claws
    // Left Claw
    ctx.beginPath();
    ctx.ellipse(bodyX - clawSize*0.2, clawY, clawSize, clawSize * 0.7, -0.3 * Math.PI, 0, Math.PI * 2);
    ctx.fill();
    // Right Claw
    ctx.beginPath();
    ctx.ellipse(bodyX + bodyWidth + clawSize*0.2, clawY, clawSize, clawSize * 0.7, 0.3 * Math.PI, 0, Math.PI * 2);
    ctx.fill();

     // Body (rounded rect)
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(bodyX, bodyY, bodyWidth, bodyHeight, 5); // Use roundRect if available, else draw manually
    ctx.fill();


    // Eyes (on stalks)
    const eyeSize = 4;
    const stalkHeight = 8;
    const eyeY = bodyY - stalkHeight + eyeSize/2;
    // Stalks
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bodyX + bodyWidth * 0.3, bodyY);
    ctx.lineTo(bodyX + bodyWidth * 0.3, eyeY);
    ctx.moveTo(bodyX + bodyWidth * 0.7, bodyY);
    ctx.lineTo(bodyX + bodyWidth * 0.7, eyeY);
    ctx.stroke();
    // Eyes
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(bodyX + bodyWidth * 0.3, eyeY, eyeSize, 0, Math.PI * 2);
    ctx.arc(bodyX + bodyWidth * 0.7, eyeY, eyeSize, 0, Math.PI * 2);
    ctx.fill();
    // Pupils
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(bodyX + bodyWidth * 0.3, eyeY, eyeSize * 0.5, 0, Math.PI * 2);
    ctx.arc(bodyX + bodyWidth * 0.7, eyeY, eyeSize * 0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.lineWidth = 1; // Reset
    ctx.lineCap = 'butt';// Reset
}


// --- UPDATED Clouds Drawing ---
function drawClouds() {
    clouds.forEach(cloud => {
        // Base cloud shape (slightly off-white)
        ctx.fillStyle = '#f5f5f5'; // Very light grey
        ctx.beginPath();
        ctx.ellipse(cloud.x, cloud.y, cloud.size, cloud.size * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Add fluffiness with pure white ellipses
        ctx.fillStyle = 'white';
        ctx.beginPath();
        // Offset ellipses slightly
        ctx.ellipse(cloud.x + cloud.size * 0.5, cloud.y + cloud.size * 0.1, cloud.size * 0.7, cloud.size * 0.5, 0, 0, Math.PI * 2);
        ctx.ellipse(cloud.x - cloud.size * 0.4, cloud.y + cloud.size * 0.2, cloud.size * 0.8, cloud.size * 0.4, 0, 0, Math.PI * 2);
         ctx.ellipse(cloud.x, cloud.y - cloud.size * 0.1, cloud.size * 0.6, cloud.size * 0.4, 0, 0, Math.PI * 2); // Top fluff
        ctx.fill();
    });
}

// --- UPDATED Birds Drawing (with Animation) ---
function drawBirds() {
    birds.forEach(bird => {
        ctx.fillStyle = '#555'; // Dark grey birds
        ctx.beginPath();
        const wingYOffset = bird.wingState === 0 ? 0 : bird.size * 0.4; // Wing position changes
        const bodyY = bird.y + bird.size * 0.3;

        // Left Wing
        ctx.moveTo(bird.x - bird.size * 0.8, bird.y + wingYOffset);
        ctx.lineTo(bird.x, bodyY);
        // Right Wing
        ctx.lineTo(bird.x + bird.size * 0.8, bird.y + wingYOffset);
        // Curve back towards center slightly for body illusion
        ctx.quadraticCurveTo(bird.x, bodyY + bird.size*0.1, bird.x - bird.size * 0.8, bird.y + wingYOffset);

        ctx.closePath();
        ctx.fill();
    });
}

function drawProgress() {
    ctx.fillStyle = '#444'; // Darker text
    ctx.font = 'bold 22px "Comic Sans MS", cursive, sans-serif';
    ctx.fillText(`Solved: ${problemsSolved} / ${problemsToWin}`, 20, 35);
}

// --- NEW: Particle Drawing ---
function drawParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// --- Update Functions ---

function updateEnemies() {
    // Spawn new enemies
    if (frameCount % enemySpawnRate === 0 && enemies.length < 3 && currentGameState === GameState.RUNNING) {
        spawnEnemy();
    }

    // Move existing enemies and update types (pufferfish scale)
    for (let i = enemies.length - 1; i >= 0; i--) {
        if (currentGameState === GameState.RUNNING) {
             enemies[i].x -= gameSpeed;
        }

        // Pufferfish scale animation
        if (enemies[i].type === 'pufferfish') {
            enemies[i].scale = 1.0 + Math.sin(frameCount * 0.1 + i) * 0.1; // Gentle pulsing
        }

        // Remove if off-screen left
        if (enemies[i].x + enemies[i].width < -20) { // Give a little buffer
            enemies.splice(i, 1);
        }
    }
}

function spawnEnemy() {
    const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
    let enemyData = {
        type: type,
        x: canvas.width + Math.random() * 100, // Spawn slightly off screen with variation
        width: 0,
        height: 0,
        y: 0,
    };

    // Set dimensions based on type
    switch (type) {
        case 'octopus':
            enemyData.width = 55;
            enemyData.height = 50;
            break;
        case 'pufferfish':
            enemyData.width = 50; // Base width, scale affects drawing
            enemyData.height = 50;
            enemyData.scale = 1.0; // Add scale property
            break;
        case 'crab':
             enemyData.width = 60;
             enemyData.height = 45;
            break;
    }
     enemyData.y = groundLevel - enemyData.height; // Position on ground

    enemies.push(enemyData);
}


function updateBackgroundElements() {
    // Clouds
    if (frameCount % cloudSpawnRate === 0 && currentGameState === GameState.RUNNING) {
        clouds.push({ x: canvas.width + 60, y: Math.random() * (groundLevel - 200) + 40, size: Math.random() * 40 + 25, speed: gameSpeed * (0.2 + Math.random() * 0.2) });
    }
     for (let i = clouds.length - 1; i >= 0; i--) {
        if (currentGameState === GameState.RUNNING) {
            clouds[i].x -= clouds[i].speed;
        }
        if (clouds[i].x + clouds[i].size < -50) clouds.splice(i, 1);
    }
     // Birds - with animation update
     if (frameCount % birdSpawnRate === 0 && currentGameState === GameState.RUNNING) {
         birds.push({
             x: canvas.width + 30,
             y: Math.random() * (groundLevel - 250) + 30,
             size: Math.random() * 12 + 10,
             speed: gameSpeed * (0.5 + Math.random() * 0.3),
             wingState: 0, // Initial wing state
             wingTimer: 0 // Timer for flapping
            });
     }
    for (let i = birds.length - 1; i >= 0; i--) {
        if (currentGameState === GameState.RUNNING) {
            birds[i].x -= birds[i].speed;
            // Wing Flap Animation
            birds[i].wingTimer++;
            if (birds[i].wingTimer > 10) { // Adjust flap speed
                 birds[i].wingState = 1 - birds[i].wingState; // Toggle 0 and 1
                 birds[i].wingTimer = 0;
            }
        }
        if (birds[i].x + birds[i].size < -30) birds.splice(i, 1);
    }
}

// --- NEW: Particle Update ---
function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1; // Gravity effect
        p.life -= 1;
        p.size *= 0.98; // Shrink slightly

        if (p.life <= 0 || p.size < 0.5) {
            particles.splice(i, 1);
        }
    }
}

// --- NEW: Particle Creation ---
function createSparkles(x, y) {
    const count = 15;
    const colors = ['#FFD700', '#FFEC8B', '#FFFFFF', '#FFB6C1']; // Gold, light yellow, white, pink
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 4, // Random horizontal velocity
            vy: (Math.random() - 0.7) * 5, // Mostly upward velocity
            life: Math.random() * 40 + 20, // Lifetime
            color: colors[Math.floor(Math.random() * colors.length)],
            size: Math.random() * 4 + 2 // Initial size
        });
    }
}


function checkCollision() { // No changes needed here
    const playerX = player.baseX;
    const playerY = player.currentY;
    const playerW = player.currentWidth;
    const playerH = player.currentHeight;

    for (let i = 0; i < enemies.length; i++) {
        const enemy = enemies[i];
        if (
            playerX < enemy.x + enemy.width &&
            playerX + playerW > enemy.x &&
            playerY < enemy.y + enemy.height &&
            playerY + playerH > enemy.y
        ) {
            collisionEnemyIndex = i;
            presentMathProblem();
            return;
        }
    }
}

// --- Math Problem Logic (minor tweaks for sound/visuals) ---

function generateMathProblem() { // No changes needed here
    const maxNum = 25; // Slightly higher max number maybe?
    const operation = Math.random() < 0.6 ? '+' : '-';
    let num1 = Math.floor(Math.random() * maxNum) + 1;
    let num2 = Math.floor(Math.random() * maxNum) + 1;
    let answer;
    let questionText;

    if (operation === '+') {
        if (num1 + num2 > 40) num1 = Math.floor(maxNum/2); // Keep sums reasonable
        answer = num1 + num2;
        questionText = `${num1} + ${num2} = ?`;
    } else {
        if (num1 < num2) [num1, num2] = [num2, num1];
        answer = num1 - num2;
        questionText = `${num1} - ${num2} = ?`;
    }
    currentProblem = { question: questionText, answer: answer };
}

function presentMathProblem() { // No changes needed here
    currentGameState = GameState.ASKING_QUESTION;
    generateMathProblem();
    questionLabel.textContent = currentProblem.question;
    answerInput.value = '';
    feedbackDiv.textContent = '';
    feedbackDiv.className = ''; // Clear feedback style class
    mathUI.style.display = 'block';
    answerInput.focus();
}

function checkAnswer() {
    if (currentGameState !== GameState.ASKING_QUESTION || currentProblem === null) return;

    // --- Attempt to start BGM on first interaction ---
    if (!audioStarted && bgm.paused) {
        bgm.play().then(() => {
            audioStarted = true;
            console.log("BGM playing");
        }).catch(error => {
            console.error("BGM autoplay failed:", error);
            // User might need to click again or interact more for audio
        });
    }
    // ----------------------------------------------

    const userAnswer = parseInt(answerInput.value);

    if (isNaN(userAnswer)) {
        feedbackDiv.textContent = "Numbers only, please!";
        feedbackDiv.className = 'feedback-incorrect';
        shakeUI();
        return;
    }

    if (userAnswer === currentProblem.answer) {
        // Correct Answer
        feedbackDiv.textContent = "Yay! Correct! ✨"; // Add sparkle emoji
        feedbackDiv.className = 'feedback-correct';
        problemsSolved++;
        player.sizeMultiplier += 0.15;

        // --- Play Sound & Create Sparkles ---
        playSound(correctSound);
        createSparkles(player.baseX + player.currentWidth / 2, player.currentY + player.currentHeight / 2);
        // ------------------------------------

        if (collisionEnemyIndex !== -1) {
            enemies.splice(collisionEnemyIndex, 1);
            collisionEnemyIndex = -1;
        }

        setTimeout(() => {
             mathUI.style.display = 'none';
             currentProblem = null;
             if (problemsSolved >= problemsToWin) {
                winGame();
             } else {
                currentGameState = GameState.RUNNING;
             }
        }, 1000); // Slightly longer delay for affirmation

    } else {
        // Incorrect Answer
        feedbackDiv.textContent = "Oops! Try again!";
        feedbackDiv.className = 'feedback-incorrect';
        shakeUI();
        answerInput.select();
    }
}

function shakeUI() { // No changes needed here
     mathUI.classList.add('shake');
     setTimeout(() => {
         mathUI.classList.remove('shake');
     }, 500);
}

// --- NEW: Helper function for playing sounds ---
function playSound(soundElement) {
    if (soundElement) {
        soundElement.currentTime = 0; // Rewind to start
        soundElement.play().catch(error => console.error("Sound effect failed:", error));
    }
}

// --- Game State Functions ---

function winGame() {
    currentGameState = GameState.GAME_WON;
    bgm.pause(); // Stop background music
    instructionText.style.display = 'none'; // Hide instruction text
    winTextContainer.style.display = 'flex'; // Show the win text layer

     // Populate win text dynamically
     winTextContainer.innerHTML = `
        <h2 style="color: #FF69B4; font-size: 3em; margin-bottom: 10px; text-shadow: 2px 2px 4px white;">YOU WIN!</h2>
        <p style="color: #555; font-size: 1.5em; margin-bottom: 5px;">The Axolotl is big and sleepy!</p>
        <p style="color: #555; font-size: 1.2em;">(Zzz...)</p>
        <button onclick="location.reload()" style="margin-top: 25px; padding: 12px 25px; font-size: 1.3em; background-color: #4CAF50; color: white; border: none; border-radius: 8px; cursor: pointer; font-family: 'Comic Sans MS', cursive, sans-serif;">Play Again?</button>
     `;
}


function drawWinScreenBackground() {
     // Clear Canvas only if needed (or draw static elements)
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw background elements one last time, maybe slightly faded?
    drawClouds();
    drawBirds();
    drawGround();
    // Draw the big sleeping axolotl
    drawPlayer(); // Size is already updated
    // Add Zzz particles or text near axolotl using canvas drawing if preferred
    ctx.fillStyle = '#444';
    ctx.font = 'bold 25px "Comic Sans MS"';
    ctx.fillText("Zzz...", player.baseX + player.currentWidth, player.currentY - 10);
}


function resetGame() {
    problemsSolved = 0;
    player.sizeMultiplier = 1.0;
    enemies = [];
    clouds = [];
    birds = [];
    particles = []; // Clear particles
    frameCount = 0;
    currentProblem = null;
    collisionEnemyIndex = -1;
    mathUI.style.display = 'none';
    winTextContainer.style.display = 'none'; // Hide win text
    instructionText.style.display = 'block'; // Show instructions
    currentGameState = GameState.RUNNING;
    audioStarted = false; // Reset audio flag
     // Optionally restart music here, but rely on interaction usually
    bgm.currentTime = 0; // Reset music time
    // bgm.play(); // Attempt play - might be blocked

    gameLoop();
}


// --- Input Handling (No changes needed) ---
submitButton.addEventListener('click', checkAnswer);
answerInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        checkAnswer();
    }
});


// --- Game Loop ---
function gameLoop() {
    // Stop loop if won - Handled differently now
    if (currentGameState === GameState.GAME_WON) {
        drawWinScreenBackground(); // Draw the final background scene
        // Text/button is handled by HTML overlay now
        return; // Stop the canvas updates
    }


    // Update game logic ONLY if running
    if (currentGameState === GameState.RUNNING) {
        updateBackgroundElements();
        updateEnemies();
        checkCollision();
        frameCount++;
    }
    // Update particles regardless of game state (so they fade out)
    updateParticles();

    // === DRAWING === (Always draw unless won)
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawClouds();
    drawBirds();
    drawGround();
    drawEnemies();
    drawPlayer();
    drawParticles(); // Draw affirmation particles
    drawProgress();

    requestAnimationFrame(gameLoop);
}

// --- Start the Game ---
resetGame();