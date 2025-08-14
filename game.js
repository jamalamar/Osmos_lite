class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.cells = [];
        this.player = null;
        this.score = 0;
        this.level = 1;
        this.gameState = 'menu';
        this.lastTime = 0;
        this.particles = [];
        this.gameStarted = false;
        
        this.mapSystem = new MapSystem();
        this.mapCanvas = document.getElementById('mapCanvas');
        this.mapAnimationId = null;
        
        // Camera system
        this.camera = {
            x: 0,
            y: 0,
            zoom: 1,
            targetZoom: 1,
            minZoom: 0.2,
            maxZoom: 2
        };
        
        // World size (10x larger)
        this.worldWidth = window.innerWidth * 10;
        this.worldHeight = window.innerHeight * 10;
        
        this.setupCanvas();
        this.setupEventListeners();
        this.gameLoop(0);
    }

    setupCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        });
    }

    setupEventListeners() {
        this.canvas.addEventListener('click', (e) => {
            if (this.gameState !== 'playing' || !this.player) return;
            
            const rect = this.canvas.getBoundingClientRect();
            const screenX = e.clientX - rect.left;
            const screenY = e.clientY - rect.top;
            
            // Convert screen coordinates to world coordinates
            const worldX = (screenX - this.canvas.width/2) / this.camera.zoom + this.camera.x;
            const worldY = (screenY - this.canvas.height/2) / this.camera.zoom + this.camera.y;
            
            // Eject multiple masses for more activity
            const numEjections = 3;
            for (let i = 0; i < numEjections; i++) {
                const angle = (Math.atan2(worldY - this.player.y, worldX - this.player.x) + 
                              (i - 1) * 0.1);
                const ejected = this.player.ejectMassWithAngle(angle, 8 + i * 2);
                if (ejected) {
                    this.cells.push(ejected);
                }
            }
            this.updateUI();
        });
        
        // Add mouse wheel zoom
        this.canvas.addEventListener('wheel', (e) => {
            if (this.gameState !== 'playing') return;
            e.preventDefault();
            
            const zoomSpeed = 0.1;
            const delta = e.deltaY > 0 ? -zoomSpeed : zoomSpeed;
            this.camera.targetZoom = Math.max(this.camera.minZoom, 
                                             Math.min(this.camera.maxZoom, 
                                                     this.camera.targetZoom + delta));
        });
        
        // Add keyboard controls for zoom
        window.addEventListener('keydown', (e) => {
            if (this.gameState !== 'playing') return;
            
            if (e.key === 'q' || e.key === 'Q') {
                this.camera.targetZoom = Math.min(this.camera.maxZoom, this.camera.targetZoom + 0.1);
            } else if (e.key === 'e' || e.key === 'E') {
                this.camera.targetZoom = Math.max(this.camera.minZoom, this.camera.targetZoom - 0.1);
            }
        });

        document.getElementById('playBtn').addEventListener('click', () => {
            this.startGame();
        });

        document.getElementById('journeyBtn').addEventListener('click', () => {
            this.openMap();
        });

        document.getElementById('restartBtn').addEventListener('click', () => {
            this.restart();
        });

        // Map canvas events
        this.mapCanvas.addEventListener('click', (e) => {
            if (this.gameState !== 'map') return;
            
            const rect = this.mapCanvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Check for back button
            if (x >= 20 && x <= 120 && y >= 20 && y <= 60) {
                this.closeMap();
                return;
            }
            
            // Check for play button on selected level
            if (this.mapSystem.selectedNode) {
                const infoX = this.mapCanvas.width - 220;
                if (x >= infoX + 50 && x <= infoX + 150 && y >= 100 && y <= 130) {
                    this.playJourneyLevel(this.mapSystem.selectedNode);
                }
            }
        });
    }

    startGame() {
        document.getElementById('startScreen').classList.add('hidden');
        this.gameState = 'playing';
        this.gameStarted = true;
        this.initLevel(1);
    }

    openMap() {
        document.getElementById('startScreen').classList.add('hidden');
        document.getElementById('mapScreen').classList.remove('hidden');
        this.gameState = 'map';
        
        // Setup map canvas
        this.mapCanvas.width = window.innerWidth;
        this.mapCanvas.height = window.innerHeight;
        this.mapSystem.init(this.mapCanvas);
        
        // Start map render loop
        this.renderMap();
    }

    closeMap() {
        document.getElementById('mapScreen').classList.add('hidden');
        document.getElementById('startScreen').classList.remove('hidden');
        this.gameState = 'menu';
        
        // Stop map render loop
        if (this.mapAnimationId) {
            cancelAnimationFrame(this.mapAnimationId);
            this.mapAnimationId = null;
        }
    }

    renderMap() {
        if (this.gameState !== 'map') return;
        
        this.mapSystem.render();
        this.mapAnimationId = requestAnimationFrame(() => this.renderMap());
    }

    playJourneyLevel(levelNode) {
        document.getElementById('mapScreen').classList.add('hidden');
        this.gameState = 'playing';
        this.gameStarted = true;
        
        // Cancel map animation
        if (this.mapAnimationId) {
            cancelAnimationFrame(this.mapAnimationId);
            this.mapAnimationId = null;
        }
        
        // Initialize level based on node type
        this.currentJourneyLevel = levelNode;
        this.initJourneyLevel(levelNode);
    }

    initJourneyLevel(levelNode) {
        // For now, just initialize a normal level
        // Later we'll customize based on levelNode.type
        this.initLevel(levelNode.id + 1);
    }

    initLevel(levelNum) {
        this.cells = [];
        this.particles = [];
        this.score = 0;
        this.level = levelNum;
        this.gameState = 'playing';
        
        // Reset camera
        this.camera.x = this.worldWidth / 2;
        this.camera.y = this.worldHeight / 2;
        this.camera.zoom = 0.5;
        this.camera.targetZoom = 0.5;
        
        // Place player at world center
        const centerX = this.worldWidth / 2;
        const centerY = this.worldHeight / 2;
        
        this.player = new Cell(centerX, centerY, 100, 0, 0, 'player');
        this.cells.push(this.player);

        // Much more cells with varied sizes
        const cellCount = 150 + levelNum * 30;
        const hunterCount = Math.floor(levelNum * 3);
        
        // Create size distribution
        const sizeDistribution = [
            { min: 5, max: 20, count: cellCount * 0.3 },    // Tiny cells
            { min: 20, max: 50, count: cellCount * 0.25 },  // Small cells
            { min: 50, max: 100, count: cellCount * 0.2 },  // Medium cells
            { min: 100, max: 200, count: cellCount * 0.15 }, // Large cells
            { min: 200, max: 400, count: cellCount * 0.08 }, // Huge cells
            { min: 400, max: 800, count: cellCount * 0.02 }  // Giant cells
        ];
        
        let cellsCreated = 0;
        for (let size of sizeDistribution) {
            for (let i = 0; i < size.count; i++) {
                let x, y, validPosition;
                let attempts = 0;
                
                do {
                    x = Utils.random(200, this.worldWidth - 200);
                    y = Utils.random(200, this.worldHeight - 200);
                    validPosition = Utils.distance(x, y, centerX, centerY) > 300;
                    attempts++;
                } while (!validPosition && attempts < 50);
                
                const mass = Utils.random(size.min, size.max);
                const vx = Utils.random(-50, 50);
                const vy = Utils.random(-50, 50);
                const type = cellsCreated < hunterCount ? 'hunter' : 'passive';
                
                this.cells.push(new Cell(x, y, mass, vx, vy, type));
                cellsCreated++;
            }
        }
        
        // Add clusters of tiny cells for visual interest
        for (let cluster = 0; cluster < 10; cluster++) {
            const clusterX = Utils.random(500, this.worldWidth - 500);
            const clusterY = Utils.random(500, this.worldHeight - 500);
            
            for (let i = 0; i < 20; i++) {
                const angle = (Math.PI * 2 * i) / 20;
                const radius = Utils.random(50, 200);
                const x = clusterX + Math.cos(angle) * radius;
                const y = clusterY + Math.sin(angle) * radius;
                const mass = Utils.random(3, 15);
                
                this.cells.push(new Cell(x, y, mass, 
                    Utils.random(-10, 10), 
                    Utils.random(-10, 10), 
                    'passive'));
            }
        }
        
        this.updateUI();
        document.getElementById('gameOver').classList.add('hidden');
    }

    update(deltaTime) {
        if (this.gameState !== 'playing') return;
        
        // Update camera to follow player
        if (this.player) {
            this.camera.x = this.player.x;
            this.camera.y = this.player.y;
            
            // Smooth zoom transitions
            this.camera.zoom += (this.camera.targetZoom - this.camera.zoom) * 0.1;
        }

        for (let cell of this.cells) {
            cell.update(deltaTime, this.worldWidth, this.worldHeight);
            
            if (cell.type === 'hunter') {
                cell.updateHunterAI(this.player, deltaTime);
            }
        }

        for (let particle of this.particles) {
            particle.update(deltaTime, this.worldWidth, this.worldHeight);
        }

        Physics.applyGravity(this.cells, 0.00005);

        const collisions = Physics.checkCollisions(this.cells);
        for (let [cell1, cell2] of collisions) {
            const absorbed = Physics.handleAbsorption(cell1, cell2);
            
            if (absorbed) {
                if (absorbed === this.player) {
                    this.gameOver(false, 'You were absorbed!');
                    return;
                } else if (absorbed !== this.player) {
                    this.score += Math.floor(absorbed.mass);
                }
            } else {
                Physics.resolveCollision(cell1, cell2);
            }
        }

        this.cells = this.cells.filter(cell => !cell.absorbed || cell.opacity > 0);
        this.particles = this.particles.filter(p => p.opacity > 0 && !p.absorbed);

        const nonPlayerCells = this.cells.filter(c => c !== this.player && c.type !== 'ejected');
        if (nonPlayerCells.length === 0) {
            this.levelComplete();
        }

        const largestCell = this.cells.reduce((largest, cell) => 
            cell.mass > largest.mass ? cell : largest, this.cells[0]);
        
        if (largestCell === this.player && this.player.mass > 500) {
            this.levelComplete();
        }

        this.updateUI();
    }

    render() {
        if (this.gameState === 'menu') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            return;
        }
        
        // Clear with fade effect
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Save context and apply camera transform
        this.ctx.save();
        
        // Center the camera view
        this.ctx.translate(this.canvas.width/2, this.canvas.height/2);
        this.ctx.scale(this.camera.zoom, this.camera.zoom);
        this.ctx.translate(-this.camera.x, -this.camera.y);
        
        // Draw grid for spatial reference
        this.drawGrid();
        
        // Only render visible cells
        const viewBounds = this.getViewBounds();
        
        // Draw particles
        for (let particle of this.particles) {
            if (this.isInView(particle, viewBounds)) {
                particle.draw(this.ctx, this.player ? this.player.mass : 100);
            }
        }

        // Sort and draw cells
        const visibleCells = this.cells.filter(cell => this.isInView(cell, viewBounds));
        const sortedCells = visibleCells.sort((a, b) => a.radius - b.radius);
        
        for (let cell of sortedCells) {
            if (cell === this.player) {
                cell.draw(this.ctx, this.player.mass, true);
            } else {
                cell.draw(this.ctx, this.player ? this.player.mass : 100);
            }
        }

        // Draw danger zone around player
        if (this.player) {
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            this.ctx.lineWidth = 1 / this.camera.zoom;
            this.ctx.setLineDash([5, 10]);
            this.ctx.beginPath();
            this.ctx.arc(this.player.x, this.player.y, 200, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }
        
        this.ctx.restore();
        
        // Draw minimap
        this.drawMinimap();
        
        // Draw zoom indicator
        this.drawZoomIndicator();
    }
    
    drawGrid() {
        const gridSize = 500;
        const viewBounds = this.getViewBounds();
        
        this.ctx.strokeStyle = 'rgba(100, 50, 50, 0.1)';
        this.ctx.lineWidth = 1 / this.camera.zoom;
        
        // Draw vertical lines
        for (let x = Math.floor(viewBounds.left / gridSize) * gridSize; 
             x <= viewBounds.right; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, viewBounds.top);
            this.ctx.lineTo(x, viewBounds.bottom);
            this.ctx.stroke();
        }
        
        // Draw horizontal lines
        for (let y = Math.floor(viewBounds.top / gridSize) * gridSize; 
             y <= viewBounds.bottom; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(viewBounds.left, y);
            this.ctx.lineTo(viewBounds.right, y);
            this.ctx.stroke();
        }
    }
    
    getViewBounds() {
        const halfWidth = (this.canvas.width / 2) / this.camera.zoom;
        const halfHeight = (this.canvas.height / 2) / this.camera.zoom;
        
        return {
            left: this.camera.x - halfWidth,
            right: this.camera.x + halfWidth,
            top: this.camera.y - halfHeight,
            bottom: this.camera.y + halfHeight
        };
    }
    
    isInView(obj, bounds) {
        const padding = obj.radius || 50;
        return obj.x + padding > bounds.left && 
               obj.x - padding < bounds.right &&
               obj.y + padding > bounds.top && 
               obj.y - padding < bounds.bottom;
    }
    
    drawMinimap() {
        const mapSize = 150;
        const mapX = this.canvas.width - mapSize - 20;
        const mapY = 20;
        
        // Minimap background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(mapX, mapY, mapSize, mapSize);
        this.ctx.strokeStyle = 'rgba(139, 195, 74, 0.5)';
        this.ctx.strokeRect(mapX, mapY, mapSize, mapSize);
        
        // Draw cells on minimap
        const scale = mapSize / Math.max(this.worldWidth, this.worldHeight);
        
        for (let cell of this.cells) {
            const miniX = mapX + (cell.x * scale);
            const miniY = mapY + (cell.y * scale);
            const miniRadius = Math.max(1, cell.radius * scale);
            
            if (cell === this.player) {
                this.ctx.fillStyle = '#8bc34a';
            } else if (cell.type === 'hunter') {
                this.ctx.fillStyle = 'rgba(150, 50, 200, 0.8)';
            } else {
                this.ctx.fillStyle = 'rgba(255, 100, 100, 0.6)';
            }
            
            this.ctx.beginPath();
            this.ctx.arc(miniX, miniY, miniRadius, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Draw view rectangle
        const viewBounds = this.getViewBounds();
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.strokeRect(
            mapX + viewBounds.left * scale,
            mapY + viewBounds.top * scale,
            (viewBounds.right - viewBounds.left) * scale,
            (viewBounds.bottom - viewBounds.top) * scale
        );
    }
    
    drawZoomIndicator() {
        const x = 20;
        const y = this.canvas.height - 60;
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(x, y, 200, 40);
        
        this.ctx.fillStyle = '#8bc34a';
        this.ctx.font = '14px Arial';
        this.ctx.fillText(`Zoom: ${Math.round(this.camera.zoom * 100)}%`, x + 10, y + 15);
        this.ctx.fillText('Q/E or Scroll to zoom', x + 10, y + 30);
    }

    updateUI() {
        if (this.player) {
            document.getElementById('score').textContent = this.score;
            document.getElementById('level').textContent = this.level;
            document.getElementById('mass').textContent = Math.floor(this.player.mass);
        }
    }

    levelComplete() {
        this.score += this.level * 1000;
        
        // If playing journey mode
        if (this.currentJourneyLevel) {
            this.mapSystem.completeLevel(this.currentJourneyLevel.id);
            
            // Return to map
            setTimeout(() => {
                document.getElementById('mapScreen').classList.remove('hidden');
                this.gameState = 'map';
                this.currentJourneyLevel = null;
                this.renderMap();
            }, 1500);
        } else {
            // Normal mode progression
            this.level++;
            
            if (this.level > 10) {
                this.gameOver(true, 'Congratulations! You completed all levels!');
            } else {
                setTimeout(() => {
                    this.initLevel(this.level);
                }, 1500);
            }
        }
    }

    gameOver(victory, reason) {
        this.gameState = 'gameover';
        const gameOverEl = document.getElementById('gameOver');
        const gameOverText = document.getElementById('gameOverText');
        const gameOverReason = document.getElementById('gameOverReason');
        
        gameOverText.textContent = victory ? 'Victory!' : 'Game Over';
        gameOverText.style.color = victory ? '#4fc3f7' : '#f44336';
        gameOverReason.textContent = reason + ` Final Score: ${this.score}`;
        
        gameOverEl.classList.remove('hidden');
        
        if (this.player && !victory) {
            const explosion = Physics.createExplosion(
                this.player.x, 
                this.player.y, 
                this.cells, 
                12
            );
            this.particles.push(...explosion);
        }
        
        // If in journey mode and failed, allow retry from map
        if (this.currentJourneyLevel && !victory) {
            setTimeout(() => {
                document.getElementById('gameOver').classList.add('hidden');
                document.getElementById('mapScreen').classList.remove('hidden');
                this.gameState = 'map';
                this.currentJourneyLevel = null;
                this.renderMap();
            }, 3000);
        }
    }

    restart() {
        document.getElementById('startScreen').classList.remove('hidden');
        this.gameState = 'menu';
        this.gameStarted = false;
        this.cells = [];
        this.particles = [];
        this.player = null;
        this.score = 0;
        this.level = 1;
    }

    gameLoop(currentTime) {
        const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
        this.lastTime = currentTime;

        this.update(deltaTime);
        this.render();

        requestAnimationFrame((time) => this.gameLoop(time));
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new Game();
});