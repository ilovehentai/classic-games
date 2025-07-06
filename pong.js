const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Mobile detection
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                 (window.innerWidth <= 768);

// Mac detection for performance optimizations
const isMac = /Mac|iPhone|iPad|iPod/i.test(navigator.platform) || 
              /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent);

// Game constants (base values for 800x400 resolution)
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 80;
const BALL_SIZE = 10;
// Convert speeds to pixels per second (assuming 60 FPS baseline)
const PADDLE_SPEED = 300; // pixels per second (was 5 * 60)
const INITIAL_BALL_SPEED = 300; // pixels per second (was 5 * 60)
const MAX_BALL_SPEED = 900; // pixels per second (was 15 * 60)
let WINNING_SCORE = parseInt(localStorage.getItem('winningScore') || '5');

// Frame rate limiting
const TARGET_FPS = 60;
const FRAME_TIME = 1000 / TARGET_FPS;
let lastFrameTime = 0;
let deltaTime = 0;
let fps = 0;
let frameCount = 0;
let lastFpsUpdate = 0;
let showFPS = false;

// Canvas sizing
let gameScale = 1;
let baseWidth = 800;
let baseHeight = 400;

// Mobile orientation check
let orientationWarningShown = false;

// Auto-detect best resolution based on screen size
function detectBestResolution() {
    const screenWidth = window.screen.width * window.devicePixelRatio;
    
    if (isMobile) {
        return screenWidth > 1200 ? 'medium' : 'low';
    } else if (screenWidth >= 3840) {
        return 'ultra';
    } else if (screenWidth >= 2560) {
        return 'high';
    } else if (screenWidth >= 1920) {
        return 'medium';
    } else {
        return 'low';
    }
}

// Set active resolution
function setResolution(res) {
    if (res === 'auto') {
        res = detectBestResolution();
    }
    
    activeResolution = RESOLUTIONS[res] || RESOLUTIONS.low;
    
    // Update canvas internal resolution for higher quality
    canvas.width = activeResolution.width;
    canvas.height = activeResolution.height;
    
    // Keep logical coordinates at 800x400
    baseWidth = 800;
    baseHeight = 400;
    
    // Reinitialize game objects
    initializeGameObjects();
    
    // Trigger resize to update display size
    resizeCanvas();
}

// Initialize game objects - keep same logical sizes
function initializeGameObjects() {
    // Reset to base positions - no scaling needed
    paddle1.x = 20;
    paddle1.y = baseHeight / 2 - PADDLE_HEIGHT / 2;
    paddle1.width = PADDLE_WIDTH;
    paddle1.height = PADDLE_HEIGHT;
    
    paddle2.x = baseWidth - 30;
    paddle2.y = baseHeight / 2 - PADDLE_HEIGHT / 2;
    paddle2.width = PADDLE_WIDTH;
    paddle2.height = PADDLE_HEIGHT;
    
    // Reset ball
    ball.x = baseWidth / 2;
    ball.y = baseHeight / 2;
    ball.size = BALL_SIZE;
    
    // Recreate stars with new canvas size
    createStars();
    createTitleStars();
}

function resizeCanvas() {
    const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement;
    
    let maxWidth, maxHeight;
    
    // For mobile devices
    if (isMobile) {
        // Use full viewport
        maxWidth = window.innerWidth;
        maxHeight = window.innerHeight;
        
        // If in portrait mode, still use full dimensions but show rotation message
        if (window.innerWidth < window.innerHeight) {
            // In portrait, maximize usage of available width
            const portraitScale = Math.min(maxWidth / baseHeight, maxHeight / baseWidth);
            // Rotate the game 90 degrees for better fit
            if (portraitScale * baseHeight <= maxWidth && portraitScale * baseWidth <= maxHeight) {
                // Could fit rotated, but we'll still encourage landscape
                gameScale = Math.min(maxWidth / baseWidth, maxHeight / baseHeight) * 0.9;
            } else {
                gameScale = Math.min(maxWidth / baseWidth, maxHeight / baseHeight) * 0.9;
            }
        } else {
            // Landscape mode - use full screen
            gameScale = Math.min(maxWidth / baseWidth, maxHeight / baseHeight);
        }
    } else if (isFullscreen) {
        // Desktop fullscreen
        maxWidth = window.innerWidth;
        maxHeight = window.innerHeight;
        gameScale = Math.min(maxWidth / baseWidth, maxHeight / baseHeight);
    } else {
        // Desktop normal mode
        maxWidth = window.innerWidth;
        maxHeight = window.innerHeight - 100;
        gameScale = Math.min(maxWidth / baseWidth, maxHeight / baseHeight);
    }
    
    // Ensure minimum scale for visibility
    if (isMobile && gameScale < 0.5) {
        gameScale = 0.5;
    }
    
    // Canvas internal resolution is set by setResolution()
    // Here we only update the display size
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
let isPaused = false;
let readyStartTime = 0;

// Resolution settings
const RESOLUTIONS = {
    low: { width: 800, height: 400, scale: 1 },
    medium: { width: 1200, height: 600, scale: 1.5 },
    high: { width: 1600, height: 800, scale: 2 },
    ultra: { width: 2400, height: 1200, scale: 3 }
};

let currentResolution = localStorage.getItem('resolution') || 'auto';
let activeResolution = RESOLUTIONS.low; // Start with low, will be set properly on init
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
    winningScore: [3, 5, 7, 10, 15, 20],
    resolution: ['auto', 'low', 'medium', 'high', 'ultra']
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
        "Game resolution - Auto detects best, or choose Low/Medium/High/Ultra",
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
            x: Math.random() * baseWidth,
            y: Math.random() * baseHeight,
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
            x: Math.random() * baseWidth,
            y: Math.random() * baseHeight,
            z: Math.random() * 3 + 1,
            opacity: Math.random()
        });
    }
}
createStars();

const paddle1 = {
    x: 20,
    y: baseHeight / 2 - PADDLE_HEIGHT / 2,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    dy: 0
};

const paddle2 = {
    x: baseWidth - 30,
    y: baseHeight / 2 - PADDLE_HEIGHT / 2,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    dy: 0
};

const ball = {
    x: baseWidth / 2,
    y: baseHeight / 2,
    size: BALL_SIZE,
    dx: INITIAL_BALL_SPEED,
    dy: 0
};

// Ball trail for comet effect
const ballTrail = [];
const MAX_TRAIL_LENGTH = 20;

// Laser mechanics
const LASER_SPEED = 600; // pixels per second (was 10 * 60)
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

// Get scaled values based on resolution
function getScaled(value) {
    return value * activeResolution.scale;
}

function getFontSize(base) {
    return Math.round(base * activeResolution.scale);
}

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

// Helper function to convert audio buffer to WAV
function bufferToWave(buffer) {
    const length = buffer.length * buffer.numberOfChannels * 2 + 44;
    const arrayBuffer = new ArrayBuffer(length);
    const view = new DataView(arrayBuffer);
    const channels = [];
    let offset = 0;
    let pos = 0;
    
    // Write WAV header
    const setUint16 = (data) => {
        view.setUint16(pos, data, true);
        pos += 2;
    };
    const setUint32 = (data) => {
        view.setUint32(pos, data, true);
        pos += 4;
    };
    
    // RIFF chunk descriptor
    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8); // file length - 8
    setUint32(0x45564157); // "WAVE"
    
    // FMT sub-chunk
    setUint32(0x20746d66); // "fmt "
    setUint32(16); // subchunk size
    setUint16(1); // PCM format
    setUint16(buffer.numberOfChannels);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * buffer.numberOfChannels); // byte rate
    setUint16(buffer.numberOfChannels * 2); // block align
    setUint16(16); // bits per sample
    
    // Data sub-chunk
    setUint32(0x61746164); // "data"
    setUint32(length - pos - 4); // subchunk size
    
    // Write interleaved data
    const interleaved = new Float32Array(buffer.length * buffer.numberOfChannels);
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
        channels[channel] = buffer.getChannelData(channel);
    }
    
    offset = 0;
    for (let i = 0; i < buffer.length; i++) {
        for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
            interleaved[offset++] = channels[channel][i];
        }
    }
    
    // Convert float samples to 16-bit PCM
    offset = 0;
    for (let i = 0; i < interleaved.length; i++, offset += 2) {
        const s = Math.max(-1, Math.min(1, interleaved[i]));
        view.setInt16(pos + offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
    
    return arrayBuffer;
}

// Create robot voice for "Ready!"
function createReadySound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const duration = 1.0;
    const sampleRate = audioContext.sampleRate;
    const buffer = audioContext.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);
    
    // Generate clearer robotic "Ready!" sound using vocoder-style synthesis
    const phonemes = [
        { start: 0.1, end: 0.35, type: 'r', freq: 150 },     // "R" sound
        { start: 0.35, end: 0.5, type: 'eh', freq: 280 },    // "eh" sound
        { start: 0.5, end: 0.65, type: 'd', freq: 200 },     // "d" sound  
        { start: 0.65, end: 0.85, type: 'ee', freq: 320 }    // "ee" sound
    ];
    
    for (let i = 0; i < data.length; i++) {
        const t = i / sampleRate;
        let sample = 0;
        
        for (const phoneme of phonemes) {
            if (t >= phoneme.start && t < phoneme.end) {
                const localT = (t - phoneme.start) / (phoneme.end - phoneme.start);
                
                // Envelope with sharper attack for clarity
                let env = 1;
                if (localT < 0.1) env = localT / 0.1;
                else if (localT > 0.8) env = (1 - localT) / 0.2;
                env *= 0.8;
                
                if (phoneme.type === 'r' || phoneme.type === 'd') {
                    // Consonants - use noise + tone
                    const noise = (Math.random() - 0.5) * 0.3;
                    const tone = Math.sin(2 * Math.PI * phoneme.freq * t);
                    sample += (noise + tone * 0.5) * env;
                    
                    // Add formants for clarity
                    sample += Math.sin(2 * Math.PI * phoneme.freq * 2 * t) * env * 0.3;
                    sample += Math.sin(2 * Math.PI * phoneme.freq * 3 * t) * env * 0.2;
                } else {
                    // Vowels - use harmonics
                    const fundamental = Math.sin(2 * Math.PI * phoneme.freq * t);
                    const harmonic2 = Math.sin(2 * Math.PI * phoneme.freq * 2 * t);
                    const harmonic3 = Math.sin(2 * Math.PI * phoneme.freq * 3 * t);
                    
                    sample += fundamental * env * 0.5;
                    sample += harmonic2 * env * 0.3;
                    sample += harmonic3 * env * 0.2;
                }
                
                // Robotic vocoder effect
                const carrier = Math.sin(2 * Math.PI * 50 * t);
                sample = sample * (0.7 + carrier * 0.3);
            }
        }
        
        // Low-pass filter simulation for smoother sound
        if (i > 0) {
            data[i] = sample * 0.7 + data[i-1] * 0.3;
        } else {
            data[i] = sample;
        }
    }
    
    // Create audio element
    const blob = new Blob([bufferToWave(buffer)], { type: 'audio/wav' });
    const audio = new Audio(URL.createObjectURL(blob));
    audio.volume = 0.7;
    return audio;
}

const readySound = createReadySound();

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
    // Initialize resolution
    setResolution(currentResolution);
    
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
    } else if (gameState === 'playing') {
        if (e.key === 'Escape') {
            if (isPaused) {
                // If already paused, ESC quits to menu
                isPaused = false;
                gameState = 'title';
            } else {
                // If not paused, ESC pauses the game
                isPaused = true;
            }
        } else if (isPaused && e.key === 'Enter') {
            // Resume game
            isPaused = false;
        } else if (e.key === 'F3') {
            e.preventDefault();
            showFPS = !showFPS;
        } else if (!isPaused && gameMode === 'wars') {
            // Handle laser shooting with custom controls
            if (e.key.toLowerCase() === customControls.player1.shoot && !lasers.player1 && !paddleShake.paddle1.active) {
                shootLaser('player1');
            } else if (e.key.toLowerCase() === customControls.player2.shoot && !lasers.player2 && !paddleShake.paddle2.active && playerMode === '2player') {
                shootLaser('player2');
            }
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
            // Handle menu touches for both main menu and options
            const touch = e.touches[0];
            const rect = canvas.getBoundingClientRect();
            // Convert touch coordinates to logical coordinates (800x400)
            const scaleX = baseWidth / rect.width;
            const scaleY = baseHeight / rect.height;
            menuTouchStart = {
                x: (touch.clientX - rect.left) * scaleX,
                y: (touch.clientY - rect.top) * scaleY,
                time: Date.now()
            };
        } else if (gameState === 'playing') {
            // Handle paddle drag start
            touches.forEach(touch => {
                const rect = canvas.getBoundingClientRect();
                const scaleX = baseWidth / rect.width;
                const scaleY = baseHeight / rect.height;
                const x = (touch.clientX - rect.left) * scaleX;
                const y = (touch.clientY - rect.top) * scaleY;
                
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
                    if (x < baseWidth / 2 && !lasers.player1 && !paddleShake.paddle1.active) {
                        shootLaser('player1');
                    } else if (x >= baseWidth / 2 && !lasers.player2 && !paddleShake.paddle2.active && playerMode === '2player') {
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
                    paddle1.y = Math.max(0, Math.min(baseHeight - PADDLE_HEIGHT, 
                                         touchDragActive.paddleStartY + deltaY / gameScale));
                }
                if (touchDragActive.player2) {
                    const deltaY = touch.clientY - touchDragActive.startY;
                    paddle2.y = Math.max(0, Math.min(baseHeight - PADDLE_HEIGHT, 
                                         touchDragActive.paddleStartY + deltaY / gameScale));
                }
            });
        }
    });
    
    canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        
        if (gameState === 'title' && menuTouchStart && !inOptionsMenu) {
            const touch = e.changedTouches[0];
            const rect = canvas.getBoundingClientRect();
            // Convert touch coordinates to canvas coordinates
            const scaleX = baseWidth / rect.width;
            const scaleY = baseHeight / rect.height;
            const endX = (touch.clientX - rect.left) * scaleX;
            const endY = (touch.clientY - rect.top) * scaleY;
            
            // Handle taps on menu items - match the positions from drawTitleScreen
            const baseY = 190;  // Match drawTitleScreen baseY
            const spacing = 32; // Match drawTitleScreen spacing
            const options = [];
            
            // Build options array with positions (4 main menu items)
            options.push({ y: baseY, index: 0 });           // Theme
            options.push({ y: baseY + spacing, index: 1 }); // Mode
            options.push({ y: baseY + spacing * 2, index: 2 }); // Players
            options.push({ y: baseY + spacing * 3, index: 3 }); // Options
            
            // Check if tapped on any menu option
            let tappedOption = -1;
            options.forEach(opt => {
                // Increase hit target to 25 pixels
                if (Math.abs(endY - opt.y) < 25) {
                    tappedOption = opt.index;
                }
            });
            
            if (tappedOption !== -1) {
                menuSelection = tappedOption;
                
                if (tappedOption === 3) {
                    // Tapped on OPTIONS - enter the options menu
                    inOptionsMenu = true;
                    optionsMenuSelection = 0;
                } else {
                    // Check if tapped on arrows for other options
                    const centerX = baseWidth / 2 + 30;
                    const optionWidth = 200; // Wider hit area
                    
                    if (endX < centerX - 20) {
                        // Tapped left side
                        handleMenuOptionChange('left');
                    } else if (endX > centerX + 20) {
                        // Tapped right side
                        handleMenuOptionChange('right');
                    }
                }
            } else if (endY < 180 && endY > 130) {
                // Tapped on "TAP TO PLAY" area
                if (menuSelection === 3) {
                    // Enter options if OPTIONS is selected
                    inOptionsMenu = true;
                    optionsMenuSelection = 0;
                } else {
                    // Start game
                    gameState = 'ready';
                    readyStartTime = Date.now();
                    startGame();
                    readySound.cloneNode().play().catch(e => console.log('Ready sound failed:', e));
                }
            }
            
            menuTouchStart = null;
        } else if (gameState === 'title' && menuTouchStart && inOptionsMenu) {
            // Handle options menu touches
            const touch = e.changedTouches[0];
            const rect = canvas.getBoundingClientRect();
            const scaleX = baseWidth / rect.width;
            const scaleY = baseHeight / rect.height;
            const endX = (touch.clientX - rect.left) * scaleX;
            const endY = (touch.clientY - rect.top) * scaleY;
            
            // Check for ESC/Back area (top of screen)
            if (endY < 130) {
                inOptionsMenu = false;
                menuTouchStart = null;
                return;
            }
            
            // Options menu positions
            const baseY = 150;
            const spacing = 30;
            
            // Determine which option was tapped
            let optionIndex = Math.floor((endY - baseY + spacing/2) / spacing);
            const maxOptions = playerMode === '1player' ? (isMobile ? 3 : 5) : (isMobile ? 2 : 4);
            
            if (optionIndex >= 0 && optionIndex < maxOptions) {
                optionsMenuSelection = optionIndex;
                
                // Handle the tap based on option type
                const centerX = baseWidth / 2 + 80;
                
                if (endX < centerX - 30) {
                    // Left arrow
                    handleOptionsInput({ key: 'ArrowLeft' });
                } else if (endX > centerX + 30) {
                    // Right arrow
                    handleOptionsInput({ key: 'ArrowRight' });
                } else if (!isMobile && (optionIndex === maxOptions - 2 || optionIndex === maxOptions - 1)) {
                    // Control settings - simulate Enter
                    handleOptionsInput({ key: 'Enter' });
                }
            }
            
            menuTouchStart = null;
        } else if (gameState === 'gameover') {
            // On mobile, tap anywhere to return to title
            if (isMobile) {
                gameState = 'title';
            }
        } else if (gameState === 'playing' && isPaused) {
            // Handle pause menu taps on mobile
            if (isMobile) {
                const touch = e.changedTouches[0];
                const rect = canvas.getBoundingClientRect();
                const scaleY = baseHeight / rect.height;
                const endY = (touch.clientY - rect.top) * scaleY;
                
                // Check which option was tapped
                const centerY = baseHeight / 2;
                if (Math.abs(endY - (centerY + 20)) < 30) {
                    // Resume tapped
                    isPaused = false;
                } else if (Math.abs(endY - (centerY + 50)) < 30) {
                    // Quit tapped
                    isPaused = false;
                    gameState = 'title';
                }
            }
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
                // Start the ready sequence
                gameState = 'ready';
                readyStartTime = Date.now();
                startGame();
                readySound.cloneNode().play().catch(e => console.log('Ready sound failed:', e));
            }
            break;
    }
}

function handleOptionsInput(e) {
    const maxSelection = playerMode === '1player' ? (isMobile ? 3 : 5) : (isMobile ? 2 : 4);
    
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
            } else if ((currentOption === 3 && playerMode === '1player') || (currentOption === 2 && playerMode === '2player')) {
                // Resolution
                const resolutions = menuOptions.resolution;
                const currentIndex = resolutions.indexOf(currentResolution);
                let newIndex = (currentIndex + direction + resolutions.length) % resolutions.length;
                currentResolution = resolutions[newIndex];
                localStorage.setItem('resolution', currentResolution);
                setResolution(currentResolution);
            }
            break;
        case 'Enter':
            let currentOptIdx = optionsMenuSelection;
            if (playerMode === '2player' && !isMobile) {
                if (currentOptIdx > 0) currentOptIdx++; // Skip difficulty
            }
            
            if (!isMobile) {
                if ((currentOptIdx === 4 && playerMode === '1player') || (currentOptIdx === 3 && playerMode === '2player')) {
                    // Set controls P1
                    showControlsMenu('player1');
                } else if ((currentOptIdx === 5 && playerMode === '1player') || (currentOptIdx === 4 && playerMode === '2player')) {
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
            ctx.fillRect(0, 0, baseWidth, baseHeight);
        } else {
            ctx.clearRect(0, 0, baseWidth, baseHeight);
        }
        
        // Title
        ctx.font = 'bold 30px Courier New';
        ctx.textAlign = 'center';
        ctx.fillStyle = currentTheme === 'spatial' ? '#ff0' : '#fff';
        ctx.fillText(`${player.toUpperCase()} CONTROLS`, baseWidth / 2, 80);
        
        ctx.font = '16px Courier New';
        ctx.fillText('PRESS KEY TO SET OR ESC TO BACK', baseWidth / 2, 120);
        
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
            ctx.fillText(option.label, baseWidth / 2 - 50, y);
            
            ctx.textAlign = 'center';
            ctx.fillText(option.value, baseWidth / 2 + 50, y);
            
            if (isSelected) {
                ctx.fillText('>', baseWidth / 2 - 100, y);
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
    ball.x = baseWidth / 2;
    ball.y = baseHeight / 2;
    ball.dx = (Math.random() > 0.5 ? 1 : -1) * INITIAL_BALL_SPEED;
    ball.dy = (Math.random() - 0.5) * INITIAL_BALL_SPEED * 0.4; // Random vertical component
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
    const laserMovement = deltaTime / 1000; // Convert to seconds
    
    // Update player 1 laser
    if (lasers.player1) {
        lasers.player1.x += lasers.player1.dx * laserMovement;
        
        // Check if laser is off screen
        if (lasers.player1.x > baseWidth) {
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
        lasers.player2.x += lasers.player2.dx * laserMovement;
        
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
        if ((keys[customControls.player1.down] || touchControls.player1Down) && paddle1.y < baseHeight - PADDLE_HEIGHT) {
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
            if ((keys[customControls.player2.down] || touchControls.player2Down) && paddle2.y < baseHeight - PADDLE_HEIGHT) {
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
    
    // Apply movement with delta time
    const paddleMovement = deltaTime / 1000; // Convert to seconds
    paddle1.y += paddle1.dy * paddleMovement;
    paddle2.y += paddle2.dy * paddleMovement;
    
    // Keep paddles in bounds (using logical coordinates)
    paddle1.y = Math.max(0, Math.min(baseHeight - PADDLE_HEIGHT, paddle1.y));
    paddle2.y = Math.max(0, Math.min(baseHeight - PADDLE_HEIGHT, paddle2.y));
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
            star.x = baseWidth;
            star.y = Math.random() * baseHeight;
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
    
    // Apply movement with delta time
    const ballMovement = deltaTime / 1000; // Convert to seconds
    ball.x += ball.dx * ballMovement;
    ball.y += ball.dy * ballMovement;
    
    if (ball.y <= 0 || ball.y >= baseHeight - ball.size) {
        ball.dy = -ball.dy;
    }
    
    if (checkCollision(ball, paddle1)) {
        if (ball.dx < 0) {
            const relativeIntersectY = (paddle1.y + paddle1.height / 2) - (ball.y + ball.size / 2);
            const normalizedRelativeIntersectionY = relativeIntersectY / (paddle1.height / 2);
            const bounceAngle = normalizedRelativeIntersectionY * Math.PI / 4;
            
            const currentSpeed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
            const speed = Math.min(MAX_BALL_SPEED, currentSpeed + Math.abs(normalizedRelativeIntersectionY) * 120);
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
            const relativeIntersectY = (paddle2.y + paddle2.height / 2) - (ball.y + ball.size / 2);
            const normalizedRelativeIntersectionY = relativeIntersectY / (paddle2.height / 2);
            const bounceAngle = normalizedRelativeIntersectionY * Math.PI / 4;
            
            const currentSpeed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
            const speed = Math.min(MAX_BALL_SPEED, currentSpeed + Math.abs(normalizedRelativeIntersectionY) * 120);
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
    
    if (ball.x > baseWidth) {
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
            star.x = Math.random() * baseWidth;
            star.y = Math.random() * baseHeight;
            star.z = 1000;
            star.speed = Math.random() * 0.5 + 0.1;
        }
    });
}

function drawOptionsMenu() {
    // Background
    if (currentTheme === 'spatial') {
        ctx.fillStyle = '#000011';
        ctx.fillRect(0, 0, baseWidth, baseHeight);
        
        // Draw warp speed stars
        titleStars.forEach(star => {
            const x = (star.x - baseWidth / 2) * (1000 / star.z) + baseWidth / 2;
            const y = (star.y - baseHeight / 2) * (1000 / star.z) + baseHeight / 2;
            const size = (1 - star.z / 1000) * 3;
            const opacity = 1 - star.z / 1000;
            
            ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
            ctx.fillRect(x, y, size, size);
        });
    } else {
        ctx.clearRect(0, 0, baseWidth, baseHeight);
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
    
    ctx.fillText('OPTIONS', baseWidth / 2, 80);
    ctx.shadowBlur = 0;
    
    // Back instruction
    ctx.font = '16px Courier New';
    ctx.fillStyle = currentTheme === 'spatial' ? '#ff0' : '#fff';
    ctx.fillText('ESC TO BACK', baseWidth / 2, 110);
    
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
    
    // Resolution setting
    options.push({
        label: 'RESOLUTION:',
        value: currentResolution.toUpperCase(),
        type: 'resolution'
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
        ctx.fillText(option.label, baseWidth / 2 - 20, y);
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
            const centerX = baseWidth / 2 + 80;
            const arrowSpacing = 20;
            
            ctx.fillText('<', centerX - textWidth/2 - arrowSpacing, y);
            ctx.fillText('>', centerX + textWidth/2 + arrowSpacing, y);
        }
        
        // Draw option value
        ctx.textAlign = 'center';
        ctx.fillText(option.value, baseWidth / 2 + 80, y);
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
        ctx.fillText(hint, baseWidth / 2, hintY);
        
        // Draw hint box border
        const hintWidth = ctx.measureText(hint).width + 20;
        ctx.strokeStyle = currentTheme === 'spatial' ? 'rgba(0, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(baseWidth / 2 - hintWidth / 2, hintY - 15, hintWidth, 25);
    }
}

function drawControlSetting() {
    ctx.font = 'bold 30px Courier New';
    ctx.textAlign = 'center';
    ctx.fillStyle = currentTheme === 'spatial' ? '#ff0' : '#fff';
    
    const player = controlBeingSet.startsWith('p1') ? 'PLAYER 1' : 'PLAYER 2';
    const action = controlBeingSet.includes('up') ? 'UP' : 
                   controlBeingSet.includes('down') ? 'DOWN' : 'SHOOT';
    
    ctx.fillText(`PRESS KEY FOR ${player} ${action}`, baseWidth / 2, baseHeight / 2 - 30);
    
    ctx.font = '20px Courier New';
    ctx.fillText('ESC TO CANCEL', baseWidth / 2, baseHeight / 2 + 30);
}

function drawTitleScreen() {
    // Apply resolution scaling
    ctx.save();
    ctx.scale(activeResolution.scale, activeResolution.scale);
    
    // Background
    if (currentTheme === 'spatial') {
        ctx.fillStyle = '#000011';
        ctx.fillRect(0, 0, baseWidth, baseHeight);
        
        // Draw warp speed stars
        titleStars.forEach(star => {
            const x = (star.x - baseWidth / 2) * (1000 / star.z) + baseWidth / 2;
            const y = (star.y - baseHeight / 2) * (1000 / star.z) + baseHeight / 2;
            const size = (1 - star.z / 1000) * 3;
            const opacity = 1 - star.z / 1000;
            
            ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
            ctx.fillRect(x, y, size, size);
        });
    } else {
        ctx.clearRect(0, 0, baseWidth, baseHeight);
    }
    
    // Show mobile orientation warning
    if (isMobile && window.innerWidth < window.innerHeight) {
        // Larger, clearer message for portrait mode
        ctx.save();
        
        // Background overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, baseWidth, baseHeight);
        
        // Rotation icon
        ctx.translate(baseWidth / 2, baseHeight / 2 - 60);
        ctx.strokeStyle = currentTheme === 'spatial' ? '#ff0' : '#fff';
        ctx.lineWidth = 3;
        
        // Draw phone icon
        ctx.strokeRect(-20, -30, 40, 60);
        
        // Draw rotation arrow
        ctx.beginPath();
        ctx.arc(0, 50, 30, -Math.PI/2, 0);
        ctx.stroke();
        
        // Arrow head
        ctx.beginPath();
        ctx.moveTo(30, 50);
        ctx.lineTo(25, 45);
        ctx.lineTo(25, 55);
        ctx.closePath();
        ctx.fillStyle = currentTheme === 'spatial' ? '#ff0' : '#fff';
        ctx.fill();
        
        ctx.restore();
        
        // Text message
        ctx.font = 'bold 30px Courier New';
        ctx.textAlign = 'center';
        ctx.fillStyle = currentTheme === 'spatial' ? '#ff0' : '#fff';
        ctx.fillText('ROTATE DEVICE', baseWidth / 2, baseHeight / 2 + 40);
        
        ctx.font = '20px Courier New';
        ctx.fillText('FOR LANDSCAPE MODE', baseWidth / 2, baseHeight / 2 + 70);
        
        // Still allow starting in portrait if they want
        ctx.font = '16px Courier New';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fillText('or tap to continue anyway', baseWidth / 2, baseHeight / 2 + 110);
        
        // Don't return - still show the menu underneath
    }
    
    if (inOptionsMenu) {
        drawOptionsMenu();
        ctx.restore();
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
    
    ctx.fillText('PINGPONG WARS', baseWidth / 2, 100);
    ctx.shadowBlur = 0;
    
    // Press Enter text (or tap for mobile)
    ctx.font = '20px Courier New';
    if (currentTheme === 'spatial') {
        ctx.fillStyle = '#ff0';
    } else {
        ctx.fillStyle = '#fff';
    }
    const startText = isMobile ? 'TAP TO PLAY' : 'PRESS ENTER TO PLAY';
    ctx.fillText(startText, baseWidth / 2, 150);
    
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
        ctx.fillText(option.label, baseWidth / 2 - 70, option.y);
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
            const centerX = baseWidth / 2 + 30;
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
        ctx.fillText(option.value, baseWidth / 2 + 30, option.y);
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
    ctx.fillText(hint, baseWidth / 2, hintY);
    
    // Draw hint box border
    const hintWidth = ctx.measureText(hint).width + 20;
    ctx.strokeStyle = currentTheme === 'spatial' ? 'rgba(0, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(baseWidth / 2 - hintWidth / 2, hintY - 15, hintWidth, 25);
    
    ctx.restore();
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
    
    ctx.fillText(player1Score, baseWidth / 4, 60);
    ctx.fillText(player2Score, 3 * baseWidth / 4, 60);
    ctx.shadowBlur = 0;
}

function drawCenterLine() {
    if (currentTheme === 'spatial') {
        ctx.setLineDash([5, 15]);
        ctx.beginPath();
        ctx.moveTo(baseWidth / 2, 0);
        ctx.lineTo(baseWidth / 2, baseHeight);
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.lineWidth = 1;
        ctx.setLineDash([]);
    } else {
        ctx.setLineDash([5, 15]);
        ctx.beginPath();
        ctx.moveTo(baseWidth / 2, 0);
        ctx.lineTo(baseWidth / 2, baseHeight);
        ctx.strokeStyle = '#fff';
        ctx.stroke();
        ctx.setLineDash([]);
    }
}

function drawPause() {
    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, baseWidth, baseHeight);
    
    // Pause text
    ctx.font = 'bold 48px Courier New';
    ctx.textAlign = 'center';
    
    if (currentTheme === 'spatial') {
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ff0';
        ctx.fillStyle = '#ff0';
    } else {
        ctx.fillStyle = '#fff';
    }
    
    ctx.fillText('PAUSED', baseWidth / 2, baseHeight / 2 - 40);
    ctx.shadowBlur = 0;
    
    // Instructions
    ctx.font = '20px Courier New';
    ctx.fillStyle = currentTheme === 'spatial' ? '#0ff' : '#fff';
    
    if (isMobile) {
        ctx.fillText('TAP HERE - Resume Game', baseWidth / 2, baseHeight / 2 + 20);
        ctx.fillText('TAP HERE - Quit to Menu', baseWidth / 2, baseHeight / 2 + 50);
    } else {
        ctx.fillText('ENTER - Resume Game', baseWidth / 2, baseHeight / 2 + 20);
        ctx.fillText('ESC - Quit to Menu', baseWidth / 2, baseHeight / 2 + 50);
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
        
        ctx.fillText('PRESS ENTER TO START', baseWidth / 2, baseHeight / 2);
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
        ctx.fillText(`${winner} WINS!`, baseWidth / 2, baseHeight / 2 - 40);
        ctx.font = '24px Courier New';
        const continueText = isMobile ? 'TAP ANYWHERE TO CONTINUE' : 'PRESS ENTER TO PLAY AGAIN';
        ctx.fillText(continueText, baseWidth / 2, baseHeight / 2 + 20);
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
    ctx.moveTo(0, baseHeight / 2);
    ctx.lineTo(baseWidth, baseHeight / 2);
    
    // Vertical line for player separation (2 player mode)
    if (playerMode === '2player') {
        ctx.moveTo(baseWidth / 2, 0);
        ctx.lineTo(baseWidth / 2, baseHeight);
    }
    
    ctx.stroke();
    
    // Draw laser zones in wars mode
    if (gameMode === 'wars') {
        ctx.strokeStyle = currentTheme === 'spatial' ? 'rgba(255, 255, 0, 0.2)' : 'rgba(255, 255, 255, 0.3)';
        ctx.strokeRect(baseWidth / 2 - 100, 0, 200, baseHeight);
    }
    
    ctx.restore();
}

function drawReady() {
    // Apply resolution scaling
    ctx.save();
    ctx.scale(activeResolution.scale, activeResolution.scale);
    
    // Background
    if (currentTheme === 'spatial') {
        ctx.fillStyle = '#000011';
        ctx.fillRect(0, 0, baseWidth, baseHeight);
        drawStarfield();
    } else {
        ctx.clearRect(0, 0, baseWidth, baseHeight);
    }
    
    drawCenterLine();
    drawScore();
    drawPaddle(paddle1);
    drawPaddle(paddle2);
    drawBall();
    
    // Draw "READY!" text
    ctx.font = 'bold 80px Courier New';
    ctx.textAlign = 'center';
    
    const elapsed = Date.now() - readyStartTime;
    const opacity = Math.max(0, 1 - ((elapsed - 1000) / 1000)); // Stay solid for 1s, then fade for 1s
    
    if (currentTheme === 'spatial') {
        ctx.shadowBlur = 30;
        ctx.shadowColor = `rgba(255, 255, 0, ${opacity})`;
        ctx.fillStyle = `rgba(255, 255, 0, ${opacity})`;
    } else {
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
    }
    
    ctx.fillText('READY!', baseWidth / 2, baseHeight / 2);
    ctx.shadowBlur = 0;
    
    // Transition to playing after 2 seconds
    if (elapsed >= 2000) {
        gameState = 'playing';
    }
    
    ctx.restore();
}

function drawFPS() {
    if (!showFPS) return;
    
    ctx.save();
    ctx.font = '14px Courier New';
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText(`FPS: ${fps}`, baseWidth - 10, 20);
    ctx.fillText(`Res: ${activeResolution.width}x${activeResolution.height}`, baseWidth - 10, 40);
    ctx.restore();
}

function draw() {
    // Apply resolution scaling to canvas
    ctx.save();
    ctx.scale(activeResolution.scale, activeResolution.scale);
    
    if (currentTheme === 'spatial') {
        // Dark space background
        ctx.fillStyle = '#000011';
        ctx.fillRect(0, 0, baseWidth, baseHeight);
        drawStarfield();
    } else {
        ctx.clearRect(0, 0, baseWidth, baseHeight);
    }
    
    drawCenterLine();
    drawScore();
    drawPaddle(paddle1);
    drawPaddle(paddle2);
    
    // Don't draw ball during game over
    if (gameState !== 'gameover') {
        drawBall();
    }
    
    if (gameMode === 'wars') {
        drawLasers();
    }
    drawTouchZones();
    drawGameState();
    
    // Draw pause overlay if paused
    if (isPaused) {
        drawPause();
    }
    
    ctx.restore();
    
    // Draw FPS counter last (without scaling)
    drawFPS();
}

function gameLoop(currentTime) {
    // Calculate delta time and FPS
    if (!lastFrameTime) {
        lastFrameTime = currentTime;
    }
    
    deltaTime = currentTime - lastFrameTime;
    
    // Frame rate limiting - skip frame if too fast
    if (deltaTime < FRAME_TIME) {
        requestAnimationFrame(gameLoop);
        return;
    }
    
    // Update FPS counter
    frameCount++;
    if (currentTime - lastFpsUpdate >= 1000) {
        fps = frameCount;
        frameCount = 0;
        lastFpsUpdate = currentTime;
    }
    
    lastFrameTime = currentTime;
    
    // Cap delta time to prevent huge jumps
    deltaTime = Math.min(deltaTime, FRAME_TIME * 2);
    if (gameState === 'title') {
        if (currentTheme === 'spatial') {
            updateTitleStars();
        }
        drawTitleScreen();
    } else if (gameState === 'ready') {
        // During ready state, don't update game objects
        if (currentTheme === 'spatial') {
            updateStars();
        }
        drawReady();
    } else {
        // Only update game objects if not paused
        if (!isPaused) {
            updatePaddles();
            updateBall();
            if (gameMode === 'wars') {
                updateLasers();
            }
        }
        if (currentTheme === 'spatial') {
            updateStars();
        }
        draw();
    }
    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);