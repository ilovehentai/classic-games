const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Mobile detection
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                 (window.innerWidth <= 768);

// Mac detection for performance optimizations
const isMac = /Mac|iPhone|iPad|iPod/i.test(navigator.platform) || 
              /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent);

// Game constants
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 80;
const BALL_SIZE = 10;
const PADDLE_SPEED = 5;
const INITIAL_BALL_SPEED = 5;
const MAX_BALL_SPEED = 15;
let WINNING_SCORE = parseInt(localStorage.getItem('winningScore') || '5');

// Canvas sizing
let gameScale = 1;
const baseWidth = 800;
const baseHeight = 400;

// Mobile orientation check
let orientationWarningShown = false;

function resizeCanvas() {
    const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement;
    
    let maxWidth, maxHeight;
    if (isFullscreen) {
        // In fullscreen, use full viewport
        maxWidth = window.innerWidth;
        maxHeight = window.innerHeight;
    } else {
        // Normal mode - use full width
        maxWidth = window.innerWidth;
        maxHeight = window.innerHeight - 200;
    }
    
    // Calculate scale to fit screen while maintaining aspect ratio
    const scaleX = maxWidth / baseWidth;
    const scaleY = maxHeight / baseHeight;
    gameScale = Math.min(scaleX, scaleY);
    
    canvas.width = baseWidth;
    canvas.height = baseHeight;
    canvas.style.width = (baseWidth * gameScale) + 'px';
    canvas.style.height = (baseHeight * gameScale) + 'px';
    
    // Check mobile orientation
    if (isMobile && window.innerWidth < window.innerHeight && !orientationWarningShown) {
        orientationWarningShown = true;
    }
}

// Call resize on load and window resize
window.addEventListener('load', resizeCanvas);
window.addEventListener('resize', resizeCanvas);

let gameState = 'title';
let player1Score = 0;
let player2Score = 0;
let currentTheme = localStorage.getItem('theme') || 'classic';
let playerMode = localStorage.getItem('playerMode') || '1player';
let gameMode = localStorage.getItem('gameMode') || 'pong';
let aiDifficulty = localStorage.getItem('aiDifficulty') || 'normal';
let particleEffects = localStorage.getItem('particleEffects') || (isMobile || isMac ? 'low' : 'high');

// Title screen state
let menuSelection = 0; // 0 = theme, 1 = mode, 2 = players, 3 = options
let inOptionsMenu = false;
let optionsMenuSelection = 0;
const menuOptions = {
    theme: ['classic', 'spatial'],
    mode: ['pong', 'wars'],
    players: ['1player', '2player'],
    difficulty: ['easy', 'normal', 'hard'],
    particles: ['low', 'high'],
    winningScore: [3, 5, 7, 10, 15, 20]
};

// Custom controls
let customControls = {
    player1: {
        up: localStorage.getItem('p1_up') || 'q',
        down: localStorage.getItem('p1_down') || 'a',
        shoot: localStorage.getItem('p1_shoot') || 's'
    },
    player2: {
        up: localStorage.getItem('p2_up') || 'p',
        down: localStorage.getItem('p2_down') || 'l',
        shoot: localStorage.getItem('p2_shoot') || 'k'
    }
};

let settingControls = false;
let controlBeingSet = null;

// Menu hints
const menuHints = {
    main: [
        "Choose between classic retro style or modern space theme with effects",
        "Classic Pong or Wars mode with laser combat - stun your opponent!",
        "Play against AI or challenge a friend on the same keyboard",
        "Configure game settings, controls, and victory conditions"
    ],
    options: [
        "AI difficulty - Easy, Normal, or Hard",
        "Visual effects density - Low for performance, High for beauty",
        "Set points needed to win - from quick 3-point games to epic 20-point battles",
        "Customize Player 1 keyboard controls",
        "Customize Player 2 keyboard controls"
    ]
};

// Title screen stars
const titleStars = [];
let NUM_TITLE_STARS = particleEffects === 'high' ? 300 : 50;

function createTitleStars() {
    titleStars.length = 0;
    // Reduce particles on Mac for better performance
    NUM_TITLE_STARS = particleEffects === 'high' ? (isMac ? 150 : 300) : 30;
    for (let i = 0; i < NUM_TITLE_STARS; i++) {
        titleStars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            z: Math.random() * 1000,
            speed: Math.random() * 0.5 + 0.1
        });
    }
}
createTitleStars();

// AI difficulty configurations
const AI_DIFFICULTIES = {
    easy: {
        reactionTime: 40,      // Very slow reflexes
        errorChance: 0.40,     // 40% chance of mistakes
        predictionFrames: 2,   // Poor prediction
        speedMultiplier: 0.4,  // 40% of paddle speed
        laserChance: 0.005     // 0.5% chance per frame
    },
    normal: {
        reactionTime: 25,      // Slower than original
        errorChance: 0.30,     // 30% chance of mistakes
        predictionFrames: 4,   // Moderate prediction
        speedMultiplier: 0.5,  // 50% of paddle speed
        laserChance: 0.015     // 1.5% chance per frame
    },
    hard: {
        reactionTime: 15,      // Faster reflexes
        errorChance: 0.15,     // 15% chance of mistakes
        predictionFrames: 8,   // Better prediction
        speedMultiplier: 0.75, // 75% of paddle speed
        laserChance: 0.03      // 3% chance per frame
    }
};

// Starfield for spatial theme
const stars = [];
let NUM_STARS = particleEffects === 'high' ? 200 : 50;

function createStars() {
    stars.length = 0;
    // Reduce particles on Mac for better performance
    NUM_STARS = particleEffects === 'high' ? (isMac ? 100 : 200) : 30;
    for (let i = 0; i < NUM_STARS; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            z: Math.random() * 3 + 1,
            opacity: Math.random()
        });
    }
}
createStars();

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

// Laser mechanics
const LASER_SPEED = 10;
const LASER_LENGTH = 30;
const SHAKE_DURATION = 500; // ms
const lasers = {
    player1: null,
    player2: null
};

// Paddle shake state
const paddleShake = {
    paddle1: { active: false, startTime: 0 },
    paddle2: { active: false, startTime: 0 }
};

const pongSound = new Audio();
pongSound.src = 'data:audio/wav;base64,UklGRigFAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQFAACfAACgAACgAACfAACgAACgAAB/AAB/AAB/AAB/AAB/AAB/AACfAACgAACgAACfAACgAACgAAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/AAB/';

// Create lightsaber-like sound using Web Audio API
function createSynthSound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const duration = 0.25;
    const sampleRate = audioContext.sampleRate;
    const buffer = audioContext.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);
    
    // Generate a lightsaber-like hum with impact
    for (let i = 0; i < data.length; i++) {
        const t = i / sampleRate;
        
        // Impact envelope (sharp attack, quick decay)
        const impactEnv = Math.exp(-t * 15);
        
        // Sustained hum envelope
        const sustainEnv = Math.exp(-t * 4);
        
        // Base frequencies for lightsaber hum
        const baseFreq = 100;
        const hum = (
            Math.sin(2 * Math.PI * baseFreq * t) * 0.3 +        // Fundamental
            Math.sin(2 * Math.PI * (baseFreq * 2) * t) * 0.2 +  // 2nd harmonic
            Math.sin(2 * Math.PI * (baseFreq * 3) * t) * 0.15 + // 3rd harmonic
            Math.sin(2 * Math.PI * (baseFreq * 0.5) * t) * 0.2  // Sub harmonic
        );
        
        // High frequency "sizzle" for the clash
        const sizzle = (
            Math.sin(2 * Math.PI * 800 * t) * 0.1 +
            Math.sin(2 * Math.PI * 1200 * t) * 0.05 +
            (Math.random() - 0.5) * 0.05  // Slight noise
        ) * impactEnv;
        
        // Frequency modulation for movement effect
        const modulation = Math.sin(2 * Math.PI * 20 * t) * 0.1;
        
        // Combine all components
        data[i] = (hum * (1 + modulation) * sustainEnv + sizzle) * 0.6;
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

// Create laser shoot sound
function createLaserSound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const duration = 0.1;
    const sampleRate = audioContext.sampleRate;
    const buffer = audioContext.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);
    
    // Generate a descending frequency sweep
    for (let i = 0; i < data.length; i++) {
        const t = i / sampleRate;
        const frequency = 800 * Math.exp(-t * 20); // Descending sweep
        data[i] = Math.sin(2 * Math.PI * frequency * t) * Math.exp(-t * 15);
    }
    
    const wav = audioBufferToWav(buffer);
    const blob = new Blob([wav], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.volume = 0.3;
    return audio;
}

// Create hit sound
function createHitSound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const duration = 0.2;
    const sampleRate = audioContext.sampleRate;
    const buffer = audioContext.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);
    
    // Generate noise burst
    for (let i = 0; i < data.length; i++) {
        const t = i / sampleRate;
        data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 20);
    }
    
    const wav = audioBufferToWav(buffer);
    const blob = new Blob([wav], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.volume = 0.4;
    return audio;
}

const laserSound = createLaserSound();
const hitSound = createHitSound();

const keys = {};

// Touch control state
const touchControls = {
    player1Up: false,
    player1Down: false,
    player2Up: false,
    player2Down: false,
    player1Laser: false,
    player2Laser: false
};

// Set initial control display
window.addEventListener('load', () => {
    updateControlDisplay();
    updateLaserDisplay();
    if (isMobile) {
        setupTouchControls();
        // Force 1 player mode on mobile
        if (playerMode === '2player') {
            playerMode = '1player';
            localStorage.setItem('playerMode', playerMode);
            updateControlDisplay();
        }
    }
    
    // Setup fullscreen button
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', toggleFullscreen);
    }
    
    // Handle fullscreen changes
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
});

function updateLaserDisplay() {
    // No longer needed as instructions removed
}

document.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    
    if (gameState === 'title') {
        handleTitleInput(e);
    } else if (e.key === 'Enter' && (gameState === 'waiting' || gameState === 'gameover')) {
        gameState = 'title';
    } else if (gameState === 'playing' && gameMode === 'wars') {
        // Handle laser shooting with custom controls
        if (e.key.toLowerCase() === customControls.player1.shoot && !lasers.player1 && !paddleShake.paddle1.active) {
            shootLaser('player1');
        } else if (e.key.toLowerCase() === customControls.player2.shoot && !lasers.player2 && !paddleShake.paddle2.active && playerMode === '2player') {
            shootLaser('player2');
        }
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

// Fullscreen functions
function toggleFullscreen() {
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        }
    }
}

function handleFullscreenChange() {
    const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement;
    const btn = document.getElementById('fullscreen-btn');
    if (btn) {
        btn.textContent = isFullscreen ? '✕ Exit Fullscreen' : '⛶ Fullscreen';
    }
    // Force canvas resize in fullscreen
    setTimeout(resizeCanvas, 100);
}

// Touch control variables for drag
let touchDragActive = {
    player1: false,
    player2: false,
    startY: 0,
    paddleStartY: 0
};

let menuTouchStart = null;

function setupTouchControls() {
    let touches = [];
    
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        touches = Array.from(e.touches);
        
        if (gameState === 'title') {
            // Handle menu swipes
            const touch = e.touches[0];
            const rect = canvas.getBoundingClientRect();
            menuTouchStart = {
                x: (touch.clientX - rect.left) / gameScale,
                y: (touch.clientY - rect.top) / gameScale,
                time: Date.now()
            };
        } else if (gameState === 'playing') {
            // Handle paddle drag start
            touches.forEach(touch => {
                const rect = canvas.getBoundingClientRect();
                const x = (touch.clientX - rect.left) / gameScale;
                const y = (touch.clientY - rect.top) / gameScale;
                
                // Check if touching near a paddle
                if (x < paddle1.x + paddle1.width + 50) {
                    // Near player 1 paddle
                    if (Math.abs(y - (paddle1.y + PADDLE_HEIGHT/2)) < 60) {
                        touchDragActive.player1 = true;
                        touchDragActive.startY = touch.clientY;
                        touchDragActive.paddleStartY = paddle1.y;
                    }
                } else if (x > paddle2.x - 50 && playerMode === '2player') {
                    // Near player 2 paddle
                    if (Math.abs(y - (paddle2.y + PADDLE_HEIGHT/2)) < 60) {
                        touchDragActive.player2 = true;
                        touchDragActive.startY = touch.clientY;
                        touchDragActive.paddleStartY = paddle2.y;
                    }
                }
                
                // Handle laser shooting on tap
                if (gameMode === 'wars' && !touchDragActive.player1 && !touchDragActive.player2) {
                    if (x < canvas.width / 2 && !lasers.player1 && !paddleShake.paddle1.active) {
                        shootLaser('player1');
                    } else if (x >= canvas.width / 2 && !lasers.player2 && !paddleShake.paddle2.active && playerMode === '2player') {
                        shootLaser('player2');
                    }
                }
            });
        }
    });
    
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        touches = Array.from(e.touches);
        
        if (gameState === 'playing' && (touchDragActive.player1 || touchDragActive.player2)) {
            // Handle paddle dragging
            touches.forEach(touch => {
                if (touchDragActive.player1) {
                    const deltaY = touch.clientY - touchDragActive.startY;
                    paddle1.y = Math.max(0, Math.min(canvas.height - PADDLE_HEIGHT, 
                                         touchDragActive.paddleStartY + deltaY / gameScale));
                }
                if (touchDragActive.player2) {
                    const deltaY = touch.clientY - touchDragActive.startY;
                    paddle2.y = Math.max(0, Math.min(canvas.height - PADDLE_HEIGHT, 
                                         touchDragActive.paddleStartY + deltaY / gameScale));
                }
            });
        }
    });
    
    canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        
        if (gameState === 'title' && menuTouchStart) {
            const touch = e.changedTouches[0];
            const rect = canvas.getBoundingClientRect();
            const endX = (touch.clientX - rect.left) / gameScale;
            const endY = (touch.clientY - rect.top) / gameScale;
            
            // Handle taps on menu items
            const baseY = 220;
            const spacing = playerMode === '1player' ? 32 : 36;
            const options = [];
            
            // Build options array with positions
            options.push({ y: baseY, index: 0 });
            options.push({ y: baseY + spacing, index: 1 });
            options.push({ y: baseY + spacing * 2, index: 2 });
            if (playerMode === '1player') {
                options.push({ y: baseY + spacing * 3, index: 3 });
                options.push({ y: baseY + spacing * 4, index: 4 });
            } else {
                options.push({ y: baseY + spacing * 3, index: 3 });
            }
            
            // Check if tapped on any menu option
            let tappedOption = -1;
            options.forEach(opt => {
                if (Math.abs(endY - opt.y) < 20) {
                    tappedOption = opt.index;
                }
            });
            
            if (tappedOption !== -1) {
                menuSelection = tappedOption;
                
                // Check if tapped on arrows
                const centerX = canvas.width / 2 + 30;
                const textWidth = 150; // Approximate width
                const arrowSpacing = 35;
                
                if (endX < centerX - textWidth/2) {
                    // Tapped left arrow
                    handleMenuOptionChange('left');
                } else if (endX > centerX + textWidth/2) {
                    // Tapped right arrow
                    handleMenuOptionChange('right');
                }
            } else if (endY > 350) {
                // Start game
                gameState = 'waiting';
                startGame();
            }
            
            menuTouchStart = null;
        }
        
        // Reset drag states
        touchDragActive.player1 = false;
        touchDragActive.player2 = false;
    });
}

function handleMenuOptionChange(direction) {
    if (menuSelection === 0) {
        currentTheme = currentTheme === 'classic' ? 'spatial' : 'classic';
        localStorage.setItem('theme', currentTheme);
    } else if (menuSelection === 1) {
        gameMode = gameMode === 'pong' ? 'wars' : 'pong';
        localStorage.setItem('gameMode', gameMode);
        updateLaserDisplay();
    } else if (menuSelection === 2) {
        playerMode = playerMode === '1player' ? '2player' : '1player';
        localStorage.setItem('playerMode', playerMode);
        updateControlDisplay();
        // Reset menu selection if switching from 1player to 2player while on difficulty
        if (menuSelection === 3 && playerMode === '2player') {
            menuSelection = 2;
        }
    } else if (menuSelection === 3 && playerMode === '1player') {
        const difficulties = ['easy', 'normal', 'hard'];
        let currentIndex = difficulties.indexOf(aiDifficulty);
        if (direction === 'left') {
            currentIndex = (currentIndex - 1 + 3) % 3;
        } else {
            currentIndex = (currentIndex + 1) % 3;
        }
        aiDifficulty = difficulties[currentIndex];
        localStorage.setItem('aiDifficulty', aiDifficulty);
    } else if (menuSelection === (playerMode === '1player' ? 4 : 3)) {
        particleEffects = particleEffects === 'low' ? 'high' : 'low';
        localStorage.setItem('particleEffects', particleEffects);
        createStars();
        createTitleStars();
    }
}

function handleTitleInput(e) {
    if (settingControls) {
        if (e.key === 'Escape') {
            settingControls = false;
            controlBeingSet = null;
        } else if (e.key.length === 1) {
            // Set the control
            const key = e.key.toLowerCase();
            if (controlBeingSet.startsWith('p1')) {
                if (controlBeingSet === 'p1_up') {
                    customControls.player1.up = key;
                    localStorage.setItem('p1_up', key);
                } else if (controlBeingSet === 'p1_down') {
                    customControls.player1.down = key;
                    localStorage.setItem('p1_down', key);
                } else if (controlBeingSet === 'p1_shoot') {
                    customControls.player1.shoot = key;
                    localStorage.setItem('p1_shoot', key);
                }
            } else {
                if (controlBeingSet === 'p2_up') {
                    customControls.player2.up = key;
                    localStorage.setItem('p2_up', key);
                } else if (controlBeingSet === 'p2_down') {
                    customControls.player2.down = key;
                    localStorage.setItem('p2_down', key);
                } else if (controlBeingSet === 'p2_shoot') {
                    customControls.player2.shoot = key;
                    localStorage.setItem('p2_shoot', key);
                }
            }
            settingControls = false;
            controlBeingSet = null;
        }
        return;
    }
    
    if (inOptionsMenu) {
        handleOptionsInput(e);
        return;
    }
    
    const maxSelection = 3; // Only 4 main menu options
    
    switch(e.key) {
        case 'ArrowUp':
            menuSelection = Math.max(0, menuSelection - 1);
            break;
        case 'ArrowDown':
            menuSelection = Math.min(maxSelection, menuSelection + 1);
            break;
        case 'ArrowLeft':
            if (menuSelection === 0) {
                currentTheme = currentTheme === 'classic' ? 'spatial' : 'classic';
                localStorage.setItem('theme', currentTheme);
            } else if (menuSelection === 1) {
                gameMode = gameMode === 'pong' ? 'wars' : 'pong';
                localStorage.setItem('gameMode', gameMode);
                updateLaserDisplay();
            } else if (menuSelection === 2) {
                playerMode = playerMode === '1player' ? '2player' : '1player';
                localStorage.setItem('playerMode', playerMode);
                updateControlDisplay();
            }
            break;
        case 'ArrowRight':
            if (menuSelection === 0) {
                currentTheme = currentTheme === 'classic' ? 'spatial' : 'classic';
                localStorage.setItem('theme', currentTheme);
            } else if (menuSelection === 1) {
                gameMode = gameMode === 'pong' ? 'wars' : 'pong';
                localStorage.setItem('gameMode', gameMode);
                updateLaserDisplay();
            } else if (menuSelection === 2) {
                playerMode = playerMode === '1player' ? '2player' : '1player';
                localStorage.setItem('playerMode', playerMode);
                updateControlDisplay();
            }
            break;
        case 'Enter':
            if (menuSelection === 3) {
                // Enter options menu
                inOptionsMenu = true;
                optionsMenuSelection = 0;
            } else {
                gameState = 'waiting';
                startGame();
            }
            break;
    }
}

function handleOptionsInput(e) {
    const maxSelection = playerMode === '1player' ? (isMobile ? 2 : 4) : (isMobile ? 1 : 3);
    
    switch(e.key) {
        case 'Escape':
            inOptionsMenu = false;
            break;
        case 'ArrowUp':
            optionsMenuSelection = Math.max(0, optionsMenuSelection - 1);
            break;
        case 'ArrowDown':
            optionsMenuSelection = Math.min(maxSelection, optionsMenuSelection + 1);
            break;
        case 'ArrowLeft':
        case 'ArrowRight':
            const direction = e.key === 'ArrowLeft' ? -1 : 1;
            let currentOption = optionsMenuSelection;
            
            // Adjust for 1 player vs 2 player mode
            if (playerMode === '2player' && !isMobile) {
                if (currentOption > 0) currentOption++; // Skip difficulty
            }
            
            if (currentOption === 0 && playerMode === '1player') {
                // Difficulty
                const difficulties = ['easy', 'normal', 'hard'];
                const currentIndex = difficulties.indexOf(aiDifficulty);
                aiDifficulty = difficulties[(currentIndex + direction + 3) % 3];
                localStorage.setItem('aiDifficulty', aiDifficulty);
            } else if ((currentOption === 1 && playerMode === '1player') || (currentOption === 0 && playerMode === '2player')) {
                // Particles
                particleEffects = particleEffects === 'low' ? 'high' : 'low';
                localStorage.setItem('particleEffects', particleEffects);
                createStars();
                createTitleStars();
            } else if ((currentOption === 2 && playerMode === '1player') || (currentOption === 1 && playerMode === '2player')) {
                // Winning score
                const scores = menuOptions.winningScore;
                const currentIndex = scores.indexOf(WINNING_SCORE);
                let newIndex = (currentIndex + direction + scores.length) % scores.length;
                WINNING_SCORE = scores[newIndex];
                localStorage.setItem('winningScore', WINNING_SCORE.toString());
            }
            break;
        case 'Enter':
            let currentOptIdx = optionsMenuSelection;
            if (playerMode === '2player' && !isMobile) {
                if (currentOptIdx > 0) currentOptIdx++; // Skip difficulty
            }
            
            if (!isMobile) {
                if ((currentOptIdx === 3 && playerMode === '1player') || (currentOptIdx === 2 && playerMode === '2player')) {
                    // Set controls P1
                    showControlsMenu('player1');
                } else if ((currentOptIdx === 4 && playerMode === '1player') || (currentOptIdx === 3 && playerMode === '2player')) {
                    // Set controls P2
                    showControlsMenu('player2');
                }
            }
            break;
    }
}

function showControlsMenu(player) {
    // Create a submenu for control settings
    let controlsMenuSelection = 0;
    
    // Override the normal draw function temporarily
    const originalDraw = drawOptionsMenu;
    drawOptionsMenu = function() {
        // Background
        if (currentTheme === 'spatial') {
            ctx.fillStyle = '#000011';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        
        // Title
        ctx.font = 'bold 30px Courier New';
        ctx.textAlign = 'center';
        ctx.fillStyle = currentTheme === 'spatial' ? '#ff0' : '#fff';
        ctx.fillText(`${player.toUpperCase()} CONTROLS`, canvas.width / 2, 80);
        
        ctx.font = '16px Courier New';
        ctx.fillText('PRESS KEY TO SET OR ESC TO BACK', canvas.width / 2, 120);
        
        const baseY = 180;
        const spacing = 40;
        const controls = player === 'player1' ? customControls.player1 : customControls.player2;
        
        const options = [
            { label: 'UP:', value: controls.up.toUpperCase(), action: `${player === 'player1' ? 'p1' : 'p2'}_up` },
            { label: 'DOWN:', value: controls.down.toUpperCase(), action: `${player === 'player1' ? 'p1' : 'p2'}_down` },
            { label: 'SHOOT:', value: controls.shoot.toUpperCase(), action: `${player === 'player1' ? 'p1' : 'p2'}_shoot` }
        ];
        
        options.forEach((option, index) => {
            const y = baseY + spacing * index;
            const isSelected = index === controlsMenuSelection;
            
            ctx.font = isSelected ? 'bold 20px Courier New' : '20px Courier New';
            ctx.textAlign = 'right';
            ctx.fillStyle = currentTheme === 'spatial' ? (isSelected ? '#ff0' : '#0ff') : '#fff';
            ctx.fillText(option.label, canvas.width / 2 - 50, y);
            
            ctx.textAlign = 'center';
            ctx.fillText(option.value, canvas.width / 2 + 50, y);
            
            if (isSelected) {
                ctx.fillText('>', canvas.width / 2 - 100, y);
            }
        });
    };
    
    // Override input handling
    const originalHandler = handleOptionsInput;
    handleOptionsInput = function(e) {
        switch(e.key) {
            case 'Escape':
                drawOptionsMenu = originalDraw;
                handleOptionsInput = originalHandler;
                break;
            case 'ArrowUp':
                controlsMenuSelection = Math.max(0, controlsMenuSelection - 1);
                break;
            case 'ArrowDown':
                controlsMenuSelection = Math.min(2, controlsMenuSelection + 1);
                break;
            case 'Enter':
                const actions = [`${player === 'player1' ? 'p1' : 'p2'}_up`, 
                               `${player === 'player1' ? 'p1' : 'p2'}_down`, 
                               `${player === 'player1' ? 'p1' : 'p2'}_shoot`];
                controlBeingSet = actions[controlsMenuSelection];
                settingControls = true;
                break;
        }
    };
}

function updateControlDisplay() {
    // No longer needed as instructions removed
}

function startGame() {
    gameState = 'playing';
    player1Score = 0;
    player2Score = 0;
    resetBall();
    // Reset lasers and shake states
    lasers.player1 = null;
    lasers.player2 = null;
    paddleShake.paddle1 = { active: false, startTime: 0 };
    paddleShake.paddle2 = { active: false, startTime: 0 };
}

function shootLaser(player) {
    const paddle = player === 'player1' ? paddle1 : paddle2;
    const direction = player === 'player1' ? 1 : -1;
    
    lasers[player] = {
        x: player === 'player1' ? paddle.x + paddle.width : paddle.x,
        y: paddle.y + paddle.height / 2,
        dx: direction * LASER_SPEED
    };
    
    laserSound.cloneNode().play().catch(e => console.log('Laser sound failed:', e));
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
    
    // Get current difficulty settings
    const difficulty = AI_DIFFICULTIES[aiDifficulty];
    
    // AI laser shooting in wars mode
    if (gameMode === 'wars' && !lasers.player2 && Math.random() < difficulty.laserChance) {
        shootLaser('player2');
    }
    
    // Predict where the ball will be
    let predictedY = ball.y;
    
    // Only track ball when it's moving towards AI
    if (ball.dx > 0) {
        // Simple prediction based on current trajectory
        const timeToReachPaddle = (paddle2.x - ball.x) / ball.dx;
        predictedY = ball.y + (ball.dy * timeToReachPaddle * difficulty.predictionFrames / 30);
        
        // Add some error to make AI beatable
        if (Math.random() < difficulty.errorChance) {
            predictedY += (Math.random() - 0.5) * PADDLE_HEIGHT * 2;
        }
    }
    
    // Move AI paddle towards predicted position
    const paddleCenter = paddle2.y + PADDLE_HEIGHT / 2;
    const diff = predictedY + ball.size / 2 - paddleCenter;
    
    // Add reaction delay
    if (Math.abs(diff) > difficulty.reactionTime) {
        if (diff > 0) {
            paddle2.dy = Math.min(PADDLE_SPEED * difficulty.speedMultiplier, Math.abs(diff) / 15);
        } else {
            paddle2.dy = -Math.min(PADDLE_SPEED * difficulty.speedMultiplier, Math.abs(diff) / 15);
        }
    } else {
        paddle2.dy = 0;
    }
}

function updateLasers() {
    // Update player 1 laser
    if (lasers.player1) {
        lasers.player1.x += lasers.player1.dx;
        
        // Check if laser is off screen
        if (lasers.player1.x > canvas.width) {
            lasers.player1 = null;
        }
        
        // Check collision with paddle2
        if (lasers.player1 && 
            lasers.player1.x + LASER_LENGTH >= paddle2.x &&
            lasers.player1.x <= paddle2.x + paddle2.width &&
            lasers.player1.y >= paddle2.y &&
            lasers.player1.y <= paddle2.y + paddle2.height) {
            
            lasers.player1 = null;
            paddleShake.paddle2 = { active: true, startTime: Date.now() };
            hitSound.cloneNode().play().catch(e => console.log('Hit sound failed:', e));
        }
    }
    
    // Update player 2 laser
    if (lasers.player2) {
        lasers.player2.x += lasers.player2.dx;
        
        // Check if laser is off screen
        if (lasers.player2.x < -LASER_LENGTH) {
            lasers.player2 = null;
        }
        
        // Check collision with paddle1
        if (lasers.player2 &&
            lasers.player2.x <= paddle1.x + paddle1.width &&
            lasers.player2.x + LASER_LENGTH >= paddle1.x &&
            lasers.player2.y >= paddle1.y &&
            lasers.player2.y <= paddle1.y + paddle1.height) {
            
            lasers.player2 = null;
            paddleShake.paddle1 = { active: true, startTime: Date.now() };
            hitSound.cloneNode().play().catch(e => console.log('Hit sound failed:', e));
        }
    }
    
    // Update shake states
    if (paddleShake.paddle1.active && Date.now() - paddleShake.paddle1.startTime > SHAKE_DURATION) {
        paddleShake.paddle1.active = false;
    }
    if (paddleShake.paddle2.active && Date.now() - paddleShake.paddle2.startTime > SHAKE_DURATION) {
        paddleShake.paddle2.active = false;
    }
}

function updatePaddles() {
    // Player 1 controls (only if not shaking)
    if (!paddleShake.paddle1.active) {
        paddle1.dy = 0;
        if ((keys[customControls.player1.up] || touchControls.player1Up) && paddle1.y > 0) {
            paddle1.dy = -PADDLE_SPEED;
        }
        if ((keys[customControls.player1.down] || touchControls.player1Down) && paddle1.y < canvas.height - PADDLE_HEIGHT) {
            paddle1.dy = PADDLE_SPEED;
        }
    } else {
        paddle1.dy = 0;
    }
    
    if (playerMode === '2player') {
        // Player 2 controls (only if not shaking)
        if (!paddleShake.paddle2.active) {
            paddle2.dy = 0;
            if ((keys[customControls.player2.up] || touchControls.player2Up) && paddle2.y > 0) {
                paddle2.dy = -PADDLE_SPEED;
            }
            if ((keys[customControls.player2.down] || touchControls.player2Down) && paddle2.y < canvas.height - PADDLE_HEIGHT) {
                paddle2.dy = PADDLE_SPEED;
            }
        } else {
            paddle2.dy = 0;
        }
    } else {
        if (!paddleShake.paddle2.active) {
            updateAI();
        } else {
            paddle2.dy = 0;
        }
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
    // Batch star drawing for better performance
    ctx.fillStyle = 'white';
    stars.forEach(star => {
        ctx.globalAlpha = star.opacity * 0.8;
        ctx.fillRect(star.x, star.y, star.z, star.z);
    });
    ctx.globalAlpha = 1;
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

function drawOptionsMenu() {
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
    ctx.font = 'bold 40px Courier New';
    ctx.textAlign = 'center';
    
    if (currentTheme === 'spatial') {
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#0ff';
        ctx.fillStyle = '#0ff';
    } else {
        ctx.fillStyle = '#fff';
    }
    
    ctx.fillText('OPTIONS', canvas.width / 2, 80);
    ctx.shadowBlur = 0;
    
    // Back instruction
    ctx.font = '16px Courier New';
    ctx.fillStyle = currentTheme === 'spatial' ? '#ff0' : '#fff';
    ctx.fillText('ESC TO BACK', canvas.width / 2, 110);
    
    if (settingControls) {
        drawControlSetting();
        return;
    }
    
    // Options
    const baseY = 150;
    const spacing = 30;
    
    const options = [];
    
    // Add difficulty for 1 player mode
    if (playerMode === '1player') {
        options.push({ 
            label: 'DIFFICULTY:', 
            value: aiDifficulty.toUpperCase(),
            type: 'difficulty'
        });
    }
    
    // Always show particles
    options.push({ 
        label: 'PARTICLES:', 
        value: particleEffects.toUpperCase(),
        type: 'particles'
    });
    
    // Points for victory
    options.push({
        label: 'POINTS FOR VICTORY:',
        value: WINNING_SCORE.toString(),
        type: 'winningScore'
    });
    
    // Desktop-only control settings
    if (!isMobile) {
        options.push({
            label: 'SET CONTROLS PLAYER 1:',
            value: 'ENTER >',
            type: 'controls_p1'
        });
        
        options.push({
            label: 'SET CONTROLS PLAYER 2:',
            value: 'ENTER >',
            type: 'controls_p2'
        });
    }
    
    options.forEach((option, index) => {
        const y = baseY + spacing * index;
        const isSelected = index === optionsMenuSelection;
        
        // Set font based on selection
        if (currentTheme === 'classic' && isSelected) {
            ctx.font = 'bold 18px Courier New';
        } else {
            ctx.font = '18px Courier New';
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
        ctx.fillText(option.label, canvas.width / 2 - 20, y);
        ctx.shadowBlur = 0;
        
        // Draw arrows for changeable values
        if (option.type !== 'controls_p1' && option.type !== 'controls_p2') {
            ctx.textAlign = 'center';
            if (currentTheme === 'spatial') {
                ctx.fillStyle = isSelected ? '#ff0' : '#0ff';
            } else {
                ctx.fillStyle = '#fff';
            }
            
            // Calculate arrow positions based on text width
            const textWidth = ctx.measureText(option.value).width;
            const centerX = canvas.width / 2 + 80;
            const arrowSpacing = 20;
            
            ctx.fillText('<', centerX - textWidth/2 - arrowSpacing, y);
            ctx.fillText('>', centerX + textWidth/2 + arrowSpacing, y);
        }
        
        // Draw option value
        ctx.textAlign = 'center';
        ctx.fillText(option.value, canvas.width / 2 + 80, y);
    });
    
    // Draw hint box for options menu
    ctx.font = '14px Courier New';
    ctx.textAlign = 'center';
    const hintY = baseY + spacing * options.length + 20;
    
    if (currentTheme === 'spatial') {
        ctx.fillStyle = 'rgba(0, 255, 255, 0.6)';
    } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    }
    
    // Get the appropriate hint
    let hintIndex = optionsMenuSelection;
    if (playerMode === '2player' && !isMobile && optionsMenuSelection > 0) {
        hintIndex++; // Adjust for missing difficulty option
    }
    
    const hint = menuHints.options[hintIndex] || "";
    if (hint) {
        ctx.fillText(hint, canvas.width / 2, hintY);
        
        // Draw hint box border
        const hintWidth = ctx.measureText(hint).width + 20;
        ctx.strokeStyle = currentTheme === 'spatial' ? 'rgba(0, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(canvas.width / 2 - hintWidth / 2, hintY - 15, hintWidth, 25);
    }
}

function drawControlSetting() {
    ctx.font = 'bold 30px Courier New';
    ctx.textAlign = 'center';
    ctx.fillStyle = currentTheme === 'spatial' ? '#ff0' : '#fff';
    
    const player = controlBeingSet.startsWith('p1') ? 'PLAYER 1' : 'PLAYER 2';
    const action = controlBeingSet.includes('up') ? 'UP' : 
                   controlBeingSet.includes('down') ? 'DOWN' : 'SHOOT';
    
    ctx.fillText(`PRESS KEY FOR ${player} ${action}`, canvas.width / 2, canvas.height / 2 - 30);
    
    ctx.font = '20px Courier New';
    ctx.fillText('ESC TO CANCEL', canvas.width / 2, canvas.height / 2 + 30);
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
    
    // Show mobile orientation warning
    if (isMobile && window.innerWidth < window.innerHeight) {
        ctx.font = 'bold 24px Courier New';
        ctx.textAlign = 'center';
        ctx.fillStyle = currentTheme === 'spatial' ? '#ff0' : '#fff';
        ctx.fillText('ROTATE YOUR DEVICE', canvas.width / 2, canvas.height / 2 - 20);
        ctx.font = '18px Courier New';
        ctx.fillText('FOR BEST EXPERIENCE', canvas.width / 2, canvas.height / 2 + 20);
        return;
    }
    
    if (inOptionsMenu) {
        drawOptionsMenu();
        return;
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
    
    ctx.fillText('PINGPONG WARS', canvas.width / 2, 100);
    ctx.shadowBlur = 0;
    
    // Press Enter text (or tap for mobile)
    ctx.font = '20px Courier New';
    if (currentTheme === 'spatial') {
        ctx.fillStyle = '#ff0';
    } else {
        ctx.fillStyle = '#fff';
    }
    const startText = isMobile ? 'TAP TO PLAY' : 'PRESS ENTER TO PLAY';
    ctx.fillText(startText, canvas.width / 2, 150);
    
    // Menu options - only 4 main options
    const baseY = 190;
    const spacing = 32;
    
    const options = [
        { label: 'THEME:', value: currentTheme === 'classic' ? 'CLASSIC' : 'SPATIAL', y: baseY },
        { label: 'MODE:', value: gameMode === 'pong' ? 'PONG MODE' : 'WARS MODE', y: baseY + spacing },
        { label: 'PLAYERS:', value: playerMode === '1player' ? '1 PLAYER' : '2 PLAYERS', y: baseY + spacing * 2 },
        { label: 'OPTIONS:', value: 'ENTER >', y: baseY + spacing * 3 }
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
        
        // Draw arrows (except for OPTIONS)
        if (index < 3) {
            ctx.textAlign = 'center';
            if (currentTheme === 'spatial') {
                ctx.fillStyle = isSelected ? '#ff0' : '#0ff';
            } else {
                ctx.fillStyle = '#fff';
            }
            
            // Make arrows bigger on mobile
            if (isMobile && isSelected) {
                ctx.font = 'bold 28px Courier New';
            }
            
            // Calculate arrow positions based on text width
            const textWidth = ctx.measureText(option.value).width;
            const centerX = canvas.width / 2 + 30;
            const arrowSpacing = isMobile ? 35 : 20;
            
            ctx.fillText('<', centerX - textWidth/2 - arrowSpacing, option.y);
            ctx.fillText('>', centerX + textWidth/2 + arrowSpacing, option.y);
            
            // Reset font if it was changed
            if (isMobile && isSelected) {
                ctx.font = '20px Courier New';
            }
        }
        
        // Draw option value
        ctx.textAlign = 'center';
        ctx.fillText(option.value, canvas.width / 2 + 30, option.y);
    });
    
    // Draw hint box
    ctx.font = '14px Courier New';
    ctx.textAlign = 'center';
    const hintY = baseY + spacing * 4 + 20;
    
    if (currentTheme === 'spatial') {
        ctx.fillStyle = 'rgba(0, 255, 255, 0.6)';
    } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    }
    
    // Draw hint text
    const hint = menuHints.main[menuSelection];
    ctx.fillText(hint, canvas.width / 2, hintY);
    
    // Draw hint box border
    const hintWidth = ctx.measureText(hint).width + 20;
    ctx.strokeStyle = currentTheme === 'spatial' ? 'rgba(0, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(canvas.width / 2 - hintWidth / 2, hintY - 15, hintWidth, 25);
}

function drawLasers() {
    // Draw player 1 laser
    if (lasers.player1) {
        ctx.save();
        
        if (currentTheme === 'spatial') {
            ctx.strokeStyle = '#ff0';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#ff0';
            ctx.lineWidth = 2;
        } else {
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
        }
        
        ctx.beginPath();
        ctx.moveTo(lasers.player1.x, lasers.player1.y);
        ctx.lineTo(lasers.player1.x + LASER_LENGTH, lasers.player1.y);
        ctx.stroke();
        
        ctx.restore();
    }
    
    // Draw player 2 laser
    if (lasers.player2) {
        ctx.save();
        
        if (currentTheme === 'spatial') {
            ctx.strokeStyle = '#ff0';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#ff0';
            ctx.lineWidth = 2;
        } else {
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
        }
        
        ctx.beginPath();
        ctx.moveTo(lasers.player2.x, lasers.player2.y);
        ctx.lineTo(lasers.player2.x - LASER_LENGTH, lasers.player2.y);
        ctx.stroke();
        
        ctx.restore();
    }
}

function drawPaddle(paddle) {
    ctx.save();
    
    // Apply shake effect
    let offsetX = 0;
    let offsetY = 0;
    if ((paddle === paddle1 && paddleShake.paddle1.active) || 
        (paddle === paddle2 && paddleShake.paddle2.active)) {
        offsetX = (Math.random() - 0.5) * 4;
        offsetY = (Math.random() - 0.5) * 4;
    }
    
    ctx.translate(offsetX, offsetY);
    
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
    
    ctx.restore();
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

function drawTouchZones() {
    if (!isMobile || gameState !== 'playing') return;
    
    ctx.save();
    ctx.strokeStyle = currentTheme === 'spatial' ? 'rgba(0, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    
    // Draw touch zone dividers
    ctx.beginPath();
    // Horizontal center line for up/down
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    
    // Vertical line for player separation (2 player mode)
    if (playerMode === '2player') {
        ctx.moveTo(canvas.width / 2, 0);
        ctx.lineTo(canvas.width / 2, canvas.height);
    }
    
    ctx.stroke();
    
    // Draw laser zones in wars mode
    if (gameMode === 'wars') {
        ctx.strokeStyle = currentTheme === 'spatial' ? 'rgba(255, 255, 0, 0.2)' : 'rgba(255, 255, 255, 0.3)';
        ctx.strokeRect(canvas.width / 2 - 100, 0, 200, canvas.height);
    }
    
    ctx.restore();
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
    if (gameMode === 'wars') {
        drawLasers();
    }
    drawTouchZones();
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
        if (gameMode === 'wars') {
            updateLasers();
        }
        if (currentTheme === 'spatial') {
            updateStars();
        }
        draw();
    }
    requestAnimationFrame(gameLoop);
}

gameLoop();