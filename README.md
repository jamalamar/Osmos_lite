# Osmos Clone

A browser-based clone of the popular physics game Osmos, where you control a cell that grows by absorbing smaller cells while avoiding larger ones.

## How to Play

1. Open `index.html` in any modern web browser
2. **Click anywhere** on the screen to move - your cell ejects mass in the opposite direction for propulsion
3. **Absorb smaller cells** (green) to grow larger
4. **Avoid larger cells** (red) that can absorb you
5. **Watch out for hunters** (purple) - they actively chase you when you're smaller

## Game Mechanics

- **Movement**: Click to eject mass and propel yourself in the opposite direction
- **Mass Conservation**: Ejecting mass makes you smaller but faster
- **Absorption**: Only cells with >10% mass difference can absorb each other
- **Physics**: Realistic momentum and collision physics
- **Gravity**: Subtle gravitational attraction between cells

## Visual Indicators

- **Green cells**: Smaller than you (safe to absorb)
- **Yellow cells**: Similar size (collision only)
- **Red cells**: Larger than you (dangerous)
- **Purple cells**: Hunter AI (will chase you if you're smaller)
- **Blue cell**: You (the player)

## Winning

- Clear all non-player cells from the level
- OR grow to 500+ mass to dominate the level
- Complete all 10 levels to achieve victory

## Controls

- **Mouse Click**: Move/Eject mass
- **Restart Button**: Appears on game over

## Files

- `index.html` - Main game page
- `game.js` - Core game loop and logic
- `cell.js` - Cell entity class
- `physics.js` - Physics engine
- `utils.js` - Helper functions
- `style.css` - Visual styling

## Browser Requirements

- Modern browser with HTML5 Canvas support
- JavaScript enabled
- Works on Chrome, Firefox, Safari, Edge

## Tips

- Small, quick movements are more efficient than large ones
- Use hunters' predictable behavior against them
- Sometimes it's better to run than to fight
- Mass ejection can be used defensively to escape