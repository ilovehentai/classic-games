const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 80;
const BALL_SIZE = 10;
const PADDLE_SPEED = 5;
const INITIAL_BALL_SPEED = 5;
const MAX_BALL_SPEED = 15;
const WINNING_SCORE = 5;

let gameState = 'title';
let player1Score = 0;
let player2Score = 0;
let currentTheme = localStorage.getItem('theme') || 'classic';
let playerMode = localStorage.getItem('mode') || '1player';

// Title screen state
let menuSelection = 0; // 0 = theme, 1 = mode
const menuOptions = {
    theme: ['classic', 'spatial'],
    mode: ['1player', '2player']
};

// Title screen stars
const titleStars = [];
const NUM_TITLE_STARS = 300;
for (let i = 0; i < NUM_TITLE_STARS; i++) {
    titleStars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        z: Math.random() * 1000,
        speed: Math.random() * 0.5 + 0.1
    });
}

// AI settings
const AI_REACTION_TIME = 20; // Higher = slower reaction
const AI_ERROR_CHANCE = 0.25; // Chance AI makes a mistake
const AI_PREDICTION_FRAMES = 5; // How far ahead AI predicts

// Starfield for spatial theme
const stars = [];
const NUM_STARS = 200;

// Initialize stars
for (let i = 0; i < NUM_STARS; i++) {
    stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        z: Math.random() * 3 + 1,
        opacity: Math.random()
    });
}

const paddle1 = {
    x: 20,
    y: canvas.height / 2 - PADDLE_HEIGHT / 2,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    dy: 0
};

const paddle2 = {
    x: canvas.width - 30,
    y: canvas.height / 2 - PADDLE_HEIGHT / 2,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    dy: 0
};

const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: BALL_SIZE,
    dx: INITIAL_BALL_SPEED,
    dy: 0
};

// Ball trail for comet effect
const ballTrail = [];
const MAX_TRAIL_LENGTH = 20;

const pongSound = new Audio();
pongSound.src = 'data:audio/wav;base64,UklGRigFAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQFAACfAACgAACgAACfAACgAACgAAB/AAB/AAB/AAB/AAB/AAB/AACfAACgAACgAACfAACgAACgAAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/';

// Create synth sound using Web Audio API
function createSynthSound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const duration = 0.15;
    const sampleRate = audioContext.sampleRate;
    const buffer = audioContext.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);
    
    // Generate a buzzy synth sound with multiple harmonics
    for (let i = 0; i < data.length; i++) {
        const t = i / sampleRate;
        // Base frequency with harmonics for that 80s buzz
        data[i] = (
            Math.sin(2 * Math.PI * 220 * t) * 0.3 +  // Base frequency
            Math.sin(2 * Math.PI * 440 * t) * 0.2 +  // First harmonic
            Math.sin(2 * Math.PI * 880 * t) * 0.1 +  // Second harmonic
            Math.sin(2 * Math.PI * 110 * t) * 0.2    // Sub bass
        ) * Math.exp(-t * 10); // Envelope
    }
    
    // Create audio element from buffer
    const wav = audioBufferToWav(buffer);
    const blob = new Blob([wav], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.volume = 0.5;
    return audio;
}

// Convert audio buffer to WAV
function audioBufferToWav(buffer) {
    const length = buffer.length * buffer.numberOfChannels * 2 + 44;
    const arrayBuffer = new ArrayBuffer(length);
    const view = new DataView(arrayBuffer);
    const channels = [];
    let sample;
    let offset = 0;
    let pos = 0;
    
    // Write WAV header
    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8); // file length - 8
    setUint32(0x45564157); // "WAVE"
    setUint32(0x20746d66); // "fmt " chunk
    setUint32(16); // length = 16
    setUint16(1); // PCM
    setUint16(buffer.numberOfChannels);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * buffer.numberOfChannels); // avg. bytes/sec
    setUint16(buffer.numberOfChannels * 2); // block-align
    setUint16(16); // 16-bit
    setUint32(0x61746164); // "data" - chunk
    setUint32(length - pos - 4); // chunk length
    
    // Write interleaved data
    for (let i = 0; i < buffer.numberOfChannels; i++)
        channels.push(buffer.getChannelData(i));
    
    while (pos < length) {
        for (let i = 0; i < buffer.numberOfChannels; i++) {
            sample = Math.max(-1, Math.min(1, channels[i][offset]));
            sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
            view.setInt16(pos, sample, true);
            pos += 2;
        }
        offset++;
    }
    
    return arrayBuffer;
    
    function setUint16(data) {
        view.setUint16(pos, data, true);
        pos += 2;
    }
    
    function setUint32(data) {
        view.setUint32(pos, data, true);
        pos += 4;
    }
}

const synthSound = createSynthSound();

const keys = {};

// Set initial control display
window.addEventListener('load', () => {
    updateControlDisplay();
});

document.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    
    if (gameState === 'title') {
        handleTitleInput(e);
    } else if (e.key === 'Enter' && (gameState === 'waiting' || gameState === 'gameover')) {
        gameState = 'title';
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

function handleTitleInput(e) {
    switch(e.key) {
        case 'ArrowUp':
            menuSelection = Math.max(0, menuSelection - 1);
            break;
        case 'ArrowDown':
            menuSelection = Math.min(1, menuSelection + 1);
            break;
        case 'ArrowLeft':
            if (menuSelection === 0) {
                currentTheme = currentTheme === 'classic' ? 'spatial' : 'classic';
                localStorage.setItem('theme', currentTheme);
            } else {
                playerMode = playerMode === '1player' ? '2player' : '1player';
                localStorage.setItem('mode', playerMode);
                updateControlDisplay();
            }
            break;
        case 'ArrowRight':
            if (menuSelection === 0) {
                currentTheme = currentTheme === 'classic' ? 'spatial' : 'classic';
                localStorage.setItem('theme', currentTheme);
            } else {
                playerMode = playerMode === '1player' ? '2player' : '1player';
                localStorage.setItem('mode', playerMode);
                updateControlDisplay();
            }
            break;
        case 'Enter':
            gameState = 'waiting';
            startGame();
            break;
    }
}

function updateControlDisplay() {
    if (playerMode === '1player') {
        document.getElementById('player2-controls').style.display = 'none';
        document.getElementById('ai-controls').style.display = 'block';
    } else {
        document.getElementById('player2-controls').style.display = 'block';
        document.getElementById('ai-controls').style.display = 'none';
    }
}

function startGame() {
    gameState = 'playing';
    player1Score = 0;
    player2Score = 0;
    resetBall();
}

function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.dx = (Math.random() > 0.5 ? 1 : -1) * INITIAL_BALL_SPEED;
    ball.dy = (Math.random() - 0.5) * 2;
    ballTrail.length = 0; // Clear trail when ball resets
}

function updateAI() {
    if (playerMode !== '1player' || gameState !== 'playing') return;
    
    // Predict where the ball will be
    let predictedY = ball.y;
    
    // Only track ball when it's moving towards AI
    if (ball.dx > 0) {
        // Simple prediction based on current trajectory
        const timeToReachPaddle = (paddle2.x - ball.x) / ball.dx;
        predictedY = ball.y + (ball.dy * timeToReachPaddle * AI_PREDICTION_FRAMES / 30);
        
        // Add some error to make AI beatable
        if (Math.random() < AI_ERROR_CHANCE) {
            predictedY += (Math.random() - 0.5) * PADDLE_HEIGHT * 2;
        }
    }
    
    // Move AI paddle towards predicted position
    const paddleCenter = paddle2.y + PADDLE_HEIGHT / 2;
    const diff = predictedY + ball.size / 2 - paddleCenter;
    
    // Add reaction delay
    if (Math.abs(diff) > AI_REACTION_TIME) {
        if (diff > 0) {
            paddle2.dy = Math.min(PADDLE_SPEED * 0.6, Math.abs(diff) / 15);
        } else {
            paddle2.dy = -Math.min(PADDLE_SPEED * 0.6, Math.abs(diff) / 15);
        }
    } else {
        paddle2.dy = 0;
    }
}

function updatePaddles() {
    paddle1.dy = 0;
    if (keys['q'] && paddle1.y > 0) {
        paddle1.dy = -PADDLE_SPEED;
    }
    if (keys['a'] && paddle1.y < canvas.height - PADDLE_HEIGHT) {
        paddle1.dy = PADDLE_SPEED;
    }
    
    if (playerMode === '2player') {
        paddle2.dy = 0;
        if (keys['p'] && paddle2.y > 0) {
            paddle2.dy = -PADDLE_SPEED;
        }
        if (keys['l'] && paddle2.y < canvas.height - PADDLE_HEIGHT) {
            paddle2.dy = PADDLE_SPEED;
        }
    } else {
        updateAI();
    }
    
    paddle1.y += paddle1.dy;
    paddle2.y += paddle2.dy;
    
    paddle1.y = Math.max(0, Math.min(canvas.height - PADDLE_HEIGHT, paddle1.y));
    paddle2.y = Math.max(0, Math.min(canvas.height - PADDLE_HEIGHT, paddle2.y));
}

function checkCollision(ball, paddle) {
    return ball.x < paddle.x + paddle.width &&
           ball.x + ball.size > paddle.x &&
           ball.y < paddle.y + paddle.height &&
           ball.y + ball.size > paddle.y;
}

function updateStars() {
    stars.forEach(star => {
        star.x -= star.z * 0.5;
        if (star.x < 0) {
            star.x = canvas.width;
            star.y = Math.random() * canvas.height;
            star.z = Math.random() * 3 + 1;
        }
        star.opacity = Math.sin(Date.now() * 0.001 + star.x * 0.01) * 0.5 + 0.5;
    });
}

function updateBall() {
    if (gameState !== 'playing') return;
    
    // Add current position to trail before moving
    if (currentTheme === 'spatial') {
        ballTrail.push({
            x: ball.x + ball.size / 2,
            y: ball.y + ball.size / 2,
            age: 0
        });
        
        // Limit trail length
        if (ballTrail.length > MAX_TRAIL_LENGTH) {
            ballTrail.shift();
        }
        
        // Age trail points
        ballTrail.forEach(point => point.age++);
    }
    
    ball.x += ball.dx;
    ball.y += ball.dy;
    
    if (ball.y <= 0 || ball.y >= canvas.height - ball.size) {
        ball.dy = -ball.dy;
    }
    
    if (checkCollision(ball, paddle1)) {
        if (ball.dx < 0) {
            const relativeIntersectY = (paddle1.y + PADDLE_HEIGHT / 2) - (ball.y + ball.size / 2);
            const normalizedRelativeIntersectionY = relativeIntersectY / (PADDLE_HEIGHT / 2);
            const bounceAngle = normalizedRelativeIntersectionY * Math.PI / 4;
            
            const speed = Math.min(MAX_BALL_SPEED, Math.abs(ball.dx) + Math.abs(normalizedRelativeIntersectionY) * 2);
            ball.dx = speed * Math.cos(bounceAngle);
            ball.dy = speed * -Math.sin(bounceAngle);
            
            ball.x = paddle1.x + paddle1.width;
            if (currentTheme === 'spatial') {
                // Clone and play for spatial theme to handle rapid hits
                synthSound.cloneNode().play().catch(e => console.log('Audio play failed:', e));
            } else {
                pongSound.cloneNode().play().catch(e => console.log('Audio play failed:', e));
            }
        }
    }
    
    if (checkCollision(ball, paddle2)) {
        if (ball.dx > 0) {
            const relativeIntersectY = (paddle2.y + PADDLE_HEIGHT / 2) - (ball.y + ball.size / 2);
            const normalizedRelativeIntersectionY = relativeIntersectY / (PADDLE_HEIGHT / 2);
            const bounceAngle = normalizedRelativeIntersectionY * Math.PI / 4;
            
            const speed = Math.min(MAX_BALL_SPEED, Math.abs(ball.dx) + Math.abs(normalizedRelativeIntersectionY) * 2);
            ball.dx = -speed * Math.cos(bounceAngle);
            ball.dy = speed * -Math.sin(bounceAngle);
            
            ball.x = paddle2.x - ball.size;
            if (currentTheme === 'spatial') {
                // Clone and play for spatial theme to handle rapid hits
                synthSound.cloneNode().play().catch(e => console.log('Audio play failed:', e));
            } else {
                pongSound.cloneNode().play().catch(e => console.log('Audio play failed:', e));
            }
        }
    }
    
    if (ball.x < 0) {
        player2Score++;
        if (player2Score >= WINNING_SCORE) {
            gameState = 'gameover';
        } else {
            resetBall();
        }
    }
    
    if (ball.x > canvas.width) {
        player1Score++;
        if (player1Score >= WINNING_SCORE) {
            gameState = 'gameover';
        } else {
            resetBall();
        }
    }
}

function drawStarfield() {
    stars.forEach(star => {
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity * 0.8})`;
        ctx.fillRect(star.x, star.y, star.z, star.z);
    });
}

function updateTitleStars() {
    titleStars.forEach(star => {
        star.z -= star.speed * 10;
        if (star.z <= 0) {
            star.x = Math.random() * canvas.width;
            star.y = Math.random() * canvas.height;
            star.z = 1000;
            star.speed = Math.random() * 0.5 + 0.1;
        }
    });
}

function drawTitleScreen() {
    // Background
    if (currentTheme === 'spatial') {
        ctx.fillStyle = '#000011';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw warp speed stars
        titleStars.forEach(star => {
            const x = (star.x - canvas.width / 2) * (1000 / star.z) + canvas.width / 2;
            const y = (star.y - canvas.height / 2) * (1000 / star.z) + canvas.height / 2;
            const size = (1 - star.z / 1000) * 3;
            const opacity = 1 - star.z / 1000;
            
            ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
            ctx.fillRect(x, y, size, size);
        });
    } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    
    // Title
    ctx.font = 'bold 60px Courier New';
    ctx.textAlign = 'center';
    
    if (currentTheme === 'spatial') {
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#0ff';
        ctx.fillStyle = '#0ff';
    } else {
        ctx.fillStyle = '#fff';
    }
    
    ctx.fillText('PINGPONG WARS', canvas.width / 2, 120);
    ctx.shadowBlur = 0;
    
    // Press Enter text
    ctx.font = '24px Courier New';
    if (currentTheme === 'spatial') {
        ctx.fillStyle = '#ff0';
    } else {
        ctx.fillStyle = '#fff';
    }
    ctx.fillText('PRESS ENTER TO PLAY', canvas.width / 2, 180);
    
    // Menu options
    const options = [
        { label: 'MODE:', value: currentTheme === 'classic' ? 'CLASSIC MODE' : 'SPATIAL MODE', y: 240 },
        { label: 'PLAYERS:', value: playerMode === '1player' ? '1 PLAYER' : '2 PLAYERS', y: 280 }
    ];
    
    options.forEach((option, index) => {
        const isSelected = index === menuSelection;
        
        // Set font based on selection
        if (currentTheme === 'classic' && isSelected) {
            ctx.font = 'bold 20px Courier New';
        } else {
            ctx.font = '20px Courier New';
        }
        
        // Draw option label
        ctx.textAlign = 'right';
        if (currentTheme === 'spatial') {
            ctx.fillStyle = isSelected ? '#ff0' : '#0ff';
            if (isSelected) {
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#ff0';
            }
        } else {
            ctx.fillStyle = '#fff';
        }
        ctx.fillText(option.label, canvas.width / 2 - 70, option.y);
        ctx.shadowBlur = 0;
        
        // Draw arrows
        ctx.textAlign = 'center';
        if (currentTheme === 'spatial') {
            ctx.fillStyle = isSelected ? '#ff0' : '#0ff';
        } else {
            ctx.fillStyle = '#fff';
        }
        
        // Calculate arrow positions based on text width
        const textWidth = ctx.measureText(option.value).width;
        const centerX = canvas.width / 2 + 30;
        
        ctx.fillText('<', centerX - textWidth/2 - 20, option.y);
        ctx.fillText('>', centerX + textWidth/2 + 20, option.y);
        
        // Draw option value
        ctx.fillText(option.value, centerX, option.y);
    });
}

function drawPaddle(paddle) {
    if (currentTheme === 'spatial') {
        // Glowing effect
        const gradient = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x + paddle.width, paddle.y);
        gradient.addColorStop(0, '#00ffff');
        gradient.addColorStop(0.5, '#ffffff');
        gradient.addColorStop(1, '#00ffff');
        
        // Glow
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#00ffff';
        ctx.fillStyle = gradient;
        ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
        ctx.shadowBlur = 0;
    } else {
        ctx.fillStyle = '#fff';
        ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    }
}

function drawCometTail() {
    if (currentTheme !== 'spatial' || ballTrail.length === 0) return;
    
    ctx.save();
    
    // Draw trail segments
    for (let i = 0; i < ballTrail.length - 1; i++) {
        const point = ballTrail[i];
        const nextPoint = ballTrail[i + 1];
        const opacity = (1 - (point.age / MAX_TRAIL_LENGTH)) * 0.6;
        const thickness = (1 - (point.age / MAX_TRAIL_LENGTH)) * ball.size * 0.8;
        
        if (opacity > 0) {
            // Create gradient for each segment
            const gradient = ctx.createLinearGradient(point.x, point.y, nextPoint.x, nextPoint.y);
            gradient.addColorStop(0, `rgba(255, 0, 255, ${opacity * 0.3})`);
            gradient.addColorStop(0.5, `rgba(255, 100, 255, ${opacity * 0.6})`);
            gradient.addColorStop(1, `rgba(255, 0, 255, ${opacity})`);
            
            ctx.strokeStyle = gradient;
            ctx.lineWidth = thickness;
            ctx.lineCap = 'round';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#ff00ff';
            
            ctx.beginPath();
            ctx.moveTo(point.x, point.y);
            ctx.lineTo(nextPoint.x, nextPoint.y);
            ctx.stroke();
        }
    }
    
    ctx.restore();
}

function drawBall() {
    if (currentTheme === 'spatial') {
        // Draw comet tail first (behind the ball)
        drawCometTail();
        
        // Glowing ball
        const gradient = ctx.createRadialGradient(
            ball.x + ball.size/2, ball.y + ball.size/2, 0,
            ball.x + ball.size/2, ball.y + ball.size/2, ball.size
        );
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.5, '#ff00ff');
        gradient.addColorStop(1, '#ff00ff');
        
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ff00ff';
        ctx.fillStyle = gradient;
        ctx.fillRect(ball.x, ball.y, ball.size, ball.size);
        ctx.shadowBlur = 0;
    } else {
        ctx.fillStyle = '#fff';
        ctx.fillRect(ball.x, ball.y, ball.size, ball.size);
    }
}

function drawScore() {
    ctx.font = '48px Courier New';
    ctx.textAlign = 'center';
    
    if (currentTheme === 'spatial') {
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#0ff';
        ctx.fillStyle = '#0ff';
    } else {
        ctx.fillStyle = '#fff';
    }
    
    ctx.fillText(player1Score, canvas.width / 4, 60);
    ctx.fillText(player2Score, 3 * canvas.width / 4, 60);
    ctx.shadowBlur = 0;
}

function drawCenterLine() {
    if (currentTheme === 'spatial') {
        ctx.setLineDash([5, 15]);
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, 0);
        ctx.lineTo(canvas.width / 2, canvas.height);
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.lineWidth = 1;
        ctx.setLineDash([]);
    } else {
        ctx.setLineDash([5, 15]);
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, 0);
        ctx.lineTo(canvas.width / 2, canvas.height);
        ctx.strokeStyle = '#fff';
        ctx.stroke();
        ctx.setLineDash([]);
    }
}

function drawGameState() {
    if (gameState === 'waiting') {
        ctx.font = '36px Courier New';
        ctx.textAlign = 'center';
        
        if (currentTheme === 'spatial') {
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#0ff';
            ctx.fillStyle = '#0ff';
        } else {
            ctx.fillStyle = '#fff';
        }
        
        ctx.fillText('PRESS ENTER TO START', canvas.width / 2, canvas.height / 2);
        ctx.shadowBlur = 0;
    } else if (gameState === 'gameover') {
        ctx.font = '36px Courier New';
        ctx.textAlign = 'center';
        
        if (currentTheme === 'spatial') {
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#ff0';
            ctx.fillStyle = '#ff0';
        } else {
            ctx.fillStyle = '#fff';
        }
        
        const winner = player1Score >= WINNING_SCORE ? 'PLAYER 1' : 'PLAYER 2';
        ctx.fillText(`${winner} WINS!`, canvas.width / 2, canvas.height / 2 - 40);
        ctx.font = '24px Courier New';
        ctx.fillText('PRESS ENTER TO PLAY AGAIN', canvas.width / 2, canvas.height / 2 + 20);
        ctx.shadowBlur = 0;
    }
}

function draw() {
    if (currentTheme === 'spatial') {
        // Dark space background
        ctx.fillStyle = '#000011';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        drawStarfield();
    } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    
    drawCenterLine();
    drawScore();
    drawPaddle(paddle1);
    drawPaddle(paddle2);
    drawBall();
    drawGameState();
}

function gameLoop() {
    if (gameState === 'title') {
        if (currentTheme === 'spatial') {
            updateTitleStars();
        }
        drawTitleScreen();
    } else {
        updatePaddles();
        updateBall();
        if (currentTheme === 'spatial') {
            updateStars();
        }
        draw();
    }
    requestAnimationFrame(gameLoop);
}

gameLoop();