# PingPong Wars

A modern take on the classic Pong game with two distinct visual themes and single/multiplayer modes.

## Features

### Game Modes
- **1 Player**: Play against a moderate AI opponent
- **2 Players**: Classic local multiplayer experience

### Visual Themes
- **Classic Mode**: Traditional black and white Pong aesthetic
- **Spatial Mode**: Futuristic space theme with:
  - Glowing neon paddles and ball
  - Comet tail effect on the ball
  - Animated starfield background
  - 80s-style synth sound effects

### Gameplay Features
- **Dynamic ball physics**: Ball speed increases based on paddle hit location
- **Edge hits**: Hitting the ball with the paddle edge increases speed and angle
- **Score tracking**: First to 5 points wins
- **Persistent settings**: Theme and mode preferences are saved locally

## Controls

### Menu Navigation
- **↑/↓**: Navigate between options
- **←/→**: Change selected option
- **Enter**: Start game

### Player 1 (Left Paddle)
- **Q**: Move up
- **A**: Move down

### Player 2 (Right Paddle)
- **P**: Move up
- **L**: Move down

*Note: In 1 Player mode, the right paddle is AI-controlled*

## How to Play

1. Open `index.html` in a modern web browser
2. Use arrow keys to select your preferred theme and game mode
3. Press Enter to start
4. Control your paddle to hit the ball back
5. Score points when your opponent misses
6. First to 5 points wins!

## Technical Details

### Technologies Used
- **HTML5 Canvas**: Game rendering
- **Vanilla JavaScript**: Game logic and physics
- **Web Audio API**: Dynamic sound generation for spatial theme
- **LocalStorage**: Settings persistence

### Game Architecture
- **Title Screen**: Interactive menu with visual theme preview
- **Game States**: Title → Playing → Game Over → Title
- **60 FPS**: Smooth gameplay using requestAnimationFrame
- **Responsive Physics**: Angle-based ball acceleration

### AI Implementation
The AI opponent features:
- Predictive ball tracking
- Configurable difficulty parameters
- Intentional errors for balanced gameplay
- Reaction delays for human-like behavior

## Visual Effects

### Classic Theme
- Clean monochrome design
- Traditional Pong sound
- Simple, focused gameplay

### Spatial Theme
- Glowing cyan paddles with shadow effects
- Magenta ball with comet tail
- Warp-speed starfield background
- Neon text with glow effects
- 80s synth buzz sound on paddle hits

## Files Structure
```
pongze/
├── index.html      # Game HTML structure
├── pong.js         # Game logic and rendering
└── README.md       # This file
```

## Browser Compatibility
- Chrome (recommended)
- Firefox
- Safari
- Edge

*Requires a modern browser with HTML5 Canvas and Web Audio API support*

## Future Enhancements
Potential features for future versions:
- Power-ups
- Different AI difficulty levels
- Online multiplayer
- Tournament mode
- Custom themes
- Mobile touch controls

---

Enjoy playing PingPong Wars!