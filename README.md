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
- **Score tracking**: Customizable victory points (3, 5, 7, 10, 15, or 20 points)
- **Persistent settings**: Theme, game mode, player preferences, and controls are saved locally
- **Particle effects**: Adjustable visual effects density (Low/High)
- **Ready countdown**: "Ready!" message with synthesized robot voice before game starts
- **Pause functionality**: Press ESC to pause during gameplay (desktop only)
- **Mobile support**: Full touch controls and responsive design

## Controls

### Menu Navigation
- **↑/↓**: Navigate between options
- **←/→**: Change selected option
- **Enter**: Start game or enter Options menu
- **ESC**: Go back (in Options menu)

### During Gameplay
- **ESC**: Pause game (press again to quit to menu)
- **Enter**: Resume game (when paused)

### Player 1 (Left Paddle) - Default Controls
- **Q**: Move up (customizable)
- **A**: Move down (customizable)
- **S**: Shoot laser - Wars mode only (customizable)

### Player 2 (Right Paddle) - Default Controls
- **P**: Move up (customizable)
- **L**: Move down (customizable)
- **K**: Shoot laser - Wars mode only (customizable)

*Note: In 1 Player mode, the right paddle is AI-controlled*

### Mobile Controls
- **Touch and drag**: Move paddles
- **Tap**: Shoot laser (Wars mode)
- **Tap arrows**: Navigate menu options
- **Tap anywhere**: Continue after game over

## How to Play

1. Open `index.html` in a modern web browser
2. Main menu options:
   - **Theme**: Classic or Spatial visual style
   - **Mode**: Traditional Pong or Wars mode with lasers
   - **Players**: 1 Player (vs AI) or 2 Players
   - **Options**: Access additional settings
3. Options menu includes:
   - **Difficulty**: AI difficulty (1 Player mode only)
   - **Particles**: Visual effects density
   - **Points for Victory**: Set winning score
   - **Set Controls**: Customize keyboard controls (desktop only)
4. Press Enter to start (or tap on mobile)
5. Control your paddle to hit the ball back
6. In Wars mode, strategically use lasers to stun your opponent
7. Score points when your opponent misses
8. First to reach the victory points wins!

## Technical Details

### Technologies Used
- **HTML5 Canvas**: Game rendering
- **Vanilla JavaScript**: Game logic and physics
- **Web Audio API**: Dynamic sound generation for spatial theme
- **LocalStorage**: Settings persistence

### Game Architecture
- **Title Screen**: Interactive menu with visual theme preview and hint system
- **Options Menu**: Comprehensive settings with customizable controls
- **Game States**: Title → Ready → Playing → Game Over → Title (with Pause state)
- **60 FPS**: Smooth gameplay using requestAnimationFrame
- **Responsive Physics**: Angle-based ball acceleration
- **Wars Mode**: Laser shooting and stun mechanics
- **Mobile Responsive**: Full-screen canvas with touch controls
- **Audio System**: Synthesized sounds including robot voice announcements

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

## Mobile Support

### Features
- **Full touch controls**: Drag to move paddles, tap to shoot lasers
- **Responsive design**: Automatically scales to fit any screen size
- **Orientation detection**: Prompts to rotate device for best experience
- **Mobile-optimized UI**: Larger touch targets and adapted interface
- **Performance optimization**: Reduced particle effects on mobile devices

### Mobile-Specific Instructions
- Game works best in landscape orientation
- Tap anywhere to continue after game over
- Touch and drag near paddles to control them
- Tap on your side of the screen to shoot lasers in Wars mode

## Recent Updates

### New Features
- **Customizable Controls**: Set your own keyboard keys for each action
- **Variable Victory Points**: Choose from 3 to 20 points for game length
- **Pause System**: ESC to pause, with resume/quit options
- **Ready Countdown**: "Ready!" announcement with robot voice
- **Enhanced Mobile Support**: Full touch controls and responsive design
- **Improved Menu System**: Cleaner layout with helpful hints
- **Options Menu**: Centralized settings management

## Future Enhancements
Potential features for future versions:
- Power-ups and special abilities
- Online multiplayer support
- Tournament mode with brackets
- Additional themes and customization
- Leaderboards and statistics
- Sound volume controls

---

Enjoy playing PingPong Wars!