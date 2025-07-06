# PingPong Wars

A modern take on the classic Pong game with multiple game modes, visual themes, and single/multiplayer options.

## Features

### Game Modes
- **Pong Mode**: Classic Pong gameplay
- **Wars Mode**: Strategic mode with laser weapons
  - Each player can shoot one laser at a time
  - Lasers travel horizontally across the screen
  - Hit opponents are stunned for 0.5 seconds
  - Adds tactical depth to the classic formula

### Player Options
- **1 Player**: Play against an AI opponent with three difficulty levels:
  - **Easy**: Slow reflexes, poor prediction, rarely shoots lasers
  - **Normal**: Balanced gameplay with moderate challenge
  - **Hard**: Fast reflexes, good prediction, aggressive laser usage
- **2 Players**: Classic local multiplayer experience

### Visual Themes
- **Classic Theme**: Traditional black and white Pong aesthetic
- **Spatial Theme**: Futuristic space theme with:
  - Glowing neon paddles and ball
  - Comet tail effect on the ball
  - Animated starfield background (warp speed on title screen)
  - 80s-style synth sound effects

### Gameplay Features
- **Dynamic ball physics**: Ball speed increases based on paddle hit location
- **Edge hits**: Hitting the ball with the paddle edge increases speed and angle
- **Score tracking**: First to 5 points wins
- **Persistent settings**: Theme, game mode, and player preferences are saved locally

## Controls

### Menu Navigation
- **↑/↓**: Navigate between options
- **←/→**: Change selected option
- **Enter**: Start game

### Player 1 (Left Paddle)
- **Q**: Move up
- **A**: Move down
- **S**: Shoot laser (Wars mode only)

### Player 2 (Right Paddle)
- **P**: Move up
- **L**: Move down
- **K**: Shoot laser (Wars mode only)

*Note: In 1 Player mode, the right paddle is AI-controlled*

## How to Play

1. Open `index.html` in a modern web browser
2. Use arrow keys to select your preferred theme, game mode, and player count
3. Press Enter to start
4. Control your paddle to hit the ball back
5. In Wars mode, strategically use lasers to stun your opponent
6. Score points when your opponent misses
7. First to 5 points wins!

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
- **Wars Mode**: Laser shooting and stun mechanics

### AI Implementation
The AI opponent features:
- Predictive ball tracking with difficulty-based accuracy
- Three difficulty levels with unique parameters:
  - **Easy**: 40% error rate, 40% speed, 0.5% laser chance
  - **Normal**: 30% error rate, 50% speed, 1.5% laser chance  
  - **Hard**: 15% error rate, 75% speed, 3% laser chance
- Intentional errors for balanced gameplay
- Reaction delays for human-like behavior
- Laser shooting capability in Wars mode

## Visual Effects

### Classic Theme
- Clean monochrome design
- Traditional Pong sound
- Simple white laser lines (Wars mode)
- Focused, minimalist gameplay

### Spatial Theme
- Glowing cyan paddles with shadow effects
- Magenta ball with comet tail
- Yellow lasers with glow effects (Wars mode)
- Warp-speed starfield background
- Neon text with glow effects
- 80s synth buzz sound on paddle hits
- Futuristic laser and hit sounds

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