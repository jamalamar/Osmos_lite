# VIRAL - Journey Through the Body

A browser-based physics game where you play as a virus navigating through the human body, infecting cells while avoiding the immune system.

## Game Modes

### Quick Play
Jump straight into action with classic gameplay - infect smaller cells while avoiding larger immune cells.

### Journey Mode  
Embark on an anatomical adventure through the human body! Travel from the respiratory system to the brain, conquering different organs and battling immune defenses.

## How to Play

1. Open `index.html` in any modern web browser
2. Choose **PLAY** for quick action or **JOURNEY** for the campaign mode
3. **Click anywhere** on the screen to move - your virus ejects mass for propulsion
4. **Infect smaller cells** (green) to grow larger
5. **Avoid immune cells** (red) that can destroy you
6. **Watch out for white blood cells** (purple) - they actively hunt viruses

## Journey Map

Navigate through the human body's major systems:

- **Respiratory System**: Enter through the nasal cavity and throat
- **Lungs**: Navigate the bronchioles and alveoli
- **Bloodstream**: Travel through arteries and veins
- **Heart** (Boss): The body's central pump - first major challenge
- **Digestive System**: Stomach and intestines pathway
- **Filtration Organs**: Liver and kidneys (challenge levels)
- **Immune System**: Lymph nodes and spleen (challenge levels)
- **Nervous System**: Spinal cord to brain stem
- **Brain Core** (Final Boss): The ultimate target

## Game Mechanics

- **Movement**: Click to eject mass and propel in the opposite direction
- **Mass Conservation**: Ejecting mass makes you smaller but faster
- **Infection**: Only cells with >10% mass difference can be infected
- **Physics**: Realistic momentum and collision physics
- **Viral Evolution**: Grow stronger as you progress through organs

## Visual Indicators

- **Green cells**: Infected/Smaller (safe to absorb)
- **Yellow cells**: Similar size (collision only)
- **Red cells**: Immune cells (dangerous)
- **Purple cells**: White blood cells (hunters)
- **Green virus**: You (the pathogen)

## Winning Conditions

### Quick Play
- Clear all non-player cells from the level
- OR grow to 500+ mass to dominate
- Complete all 10 levels

### Journey Mode
- Successfully infect each organ system
- Defeat boss organs (Heart and Brain)
- Track your infection progress on the body map

## Controls

- **Mouse Click**: Move/Eject mass
- **Journey Map**: Click nodes to select, click INFECT to play
- **Back Button**: Return to main menu from map
- **Restart Button**: Return to menu after game over

## Files

- `index.html` - Main game page
- `game.js` - Core game loop and logic
- `cell.js` - Cell entity class
- `physics.js` - Physics engine
- `map.js` - Journey mode map system
- `utils.js` - Helper functions
- `style.css` - Visual styling

## Browser Requirements

- Modern browser with HTML5 Canvas support
- JavaScript enabled
- Works on Chrome, Firefox, Safari, Edge

## Strategy Tips

- Small, quick movements are more efficient than large ones
- Use white blood cells' predictable behavior against them
- In Journey mode, choose your path wisely - some organs are more challenging
- Mass ejection can be used defensively to escape
- Boss organs require patience and strategy
- Completed organs stay infected - build your strength progressively

## Biological Accuracy Note

While inspired by human anatomy, gameplay mechanics are designed for fun rather than medical accuracy. Think of it as a fantastical journey through a stylized version of the human body!