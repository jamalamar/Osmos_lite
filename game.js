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
            minZoom: 0.5,
            maxZoom: 3
        };
        
        // World size (3x larger for tighter gameplay)
        this.worldWidth = window.innerWidth * 3;
        this.worldHeight = window.innerHeight * 3;
        
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
        this.camera.zoom = 0.8;
        this.camera.targetZoom = 0.8;
        
        // Place player at world center
        const centerX = this.worldWidth / 2;
        const centerY = this.worldHeight / 2;
        
        this.player = new Cell(centerX, centerY, 100, 0, 0, 'player');
        this.cells.push(this.player);

        // Balanced cell count for better performance
        const cellCount = 300 + levelNum * 50;
        const hunterCount = Math.floor(levelNum * 3);
        
        // Optimized size distribution with fewer giant cells
        const sizeDistribution = [
            { min: 1, max: 5, count: cellCount * 0.20 },      // Microscopic cells
            { min: 5, max: 15, count: cellCount * 0.18 },     // Tiny cells
            { min: 15, max: 30, count: cellCount * 0.15 },    // Very small cells
            { min: 30, max: 60, count: cellCount * 0.13 },    // Small cells
            { min: 60, max: 120, count: cellCount * 0.12 },   // Medium cells
            { min: 120, max: 250, count: cellCount * 0.10 },  // Large cells
            { min: 250, max: 500, count: cellCount * 0.07 },  // Huge cells
            { min: 500, max: 1000, count: cellCount * 0.03 }, // Giant cells
            { min: 1000, max: 1500, count: cellCount * 0.015 }, // Massive cells
            { min: 1500, max: 2500, count: cellCount * 0.005 }  // Colossal cells
        ];
        
        let cellsCreated = 0;
        for (let size of sizeDistribution) {
            for (let i = 0; i < size.count; i++) {
                let x, y, validPosition;
                let attempts = 0;
                
                // Larger cells need more space
                const minDistance = Math.max(150, size.min * 0.3);
                
                do {
                    x = Utils.random(50, this.worldWidth - 50);
                    y = Utils.random(50, this.worldHeight - 50);
                    validPosition = Utils.distance(x, y, centerX, centerY) > minDistance;
                    attempts++;
                } while (!validPosition && attempts < 50);
                
                const mass = Utils.random(size.min, size.max);
                // Larger cells move slower
                const speedFactor = Math.max(0.1, Math.min(1, 100 / mass));
                const vx = Utils.random(-50, 50) * speedFactor;
                const vy = Utils.random(-50, 50) * speedFactor;
                const type = cellsCreated < hunterCount ? 'hunter' : 'passive';
                
                this.cells.push(new Cell(x, y, mass, vx, vy, type));
                cellsCreated++;
            }
        }
        
        // Add clusters of microscopic cells (reduced for performance)
        for (let cluster = 0; cluster < 15; cluster++) {
            const clusterX = Utils.random(100, this.worldWidth - 100);
            const clusterY = Utils.random(100, this.worldHeight - 100);
            const clusterType = Math.random() > 0.5 ? 'spiral' : 'explosion';
            
            if (clusterType === 'spiral') {
                // Spiral pattern (fewer cells)
                for (let i = 0; i < 20; i++) {
                    const angle = (Math.PI * 2 * i) / 10;
                    const radius = i * 8;
                    const x = clusterX + Math.cos(angle) * radius;
                    const y = clusterY + Math.sin(angle) * radius;
                    const mass = Utils.random(0.5, 3);
                    
                    this.cells.push(new Cell(x, y, mass, 
                        Utils.random(-20, 20), 
                        Utils.random(-20, 20), 
                        'passive'));
                }
            } else {
                // Explosion pattern (fewer cells)
                for (let i = 0; i < 20; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const radius = Utils.random(20, 300);
                    const x = clusterX + Math.cos(angle) * radius;
                    const y = clusterY + Math.sin(angle) * radius;
                    const mass = Utils.random(1, 8);
                    
                    this.cells.push(new Cell(x, y, mass, 
                        Math.cos(angle) * Utils.random(10, 40), 
                        Math.sin(angle) * Utils.random(10, 40), 
                        'passive'));
                }
            }
        }
        
        // Add some super massive "asteroid field" areas
        for (let field = 0; field < 3; field++) {
            const fieldX = Utils.random(300, this.worldWidth - 300);
            const fieldY = Utils.random(300, this.worldHeight - 300);
            
            // Central massive body (smaller for better performance)
            this.cells.push(new Cell(fieldX, fieldY, 
                Utils.random(800, 1500), 0, 0, 'passive'));
            
            // Orbiting medium bodies (fewer)
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI * 2 * i) / 6;
                const orbitRadius = Utils.random(200, 350);
                const x = fieldX + Math.cos(angle) * orbitRadius;
                const y = fieldY + Math.sin(angle) * orbitRadius;
                const mass = Utils.random(200, 500);
                
                // Give them orbital velocity
                const orbitSpeed = 20;
                this.cells.push(new Cell(x, y, mass,
                    -Math.sin(angle) * orbitSpeed,
                    Math.cos(angle) * orbitSpeed,
                    'passive'));
            }
            
            // Debris field (fewer for performance)
            for (let i = 0; i < 50; i++) {
                const angle = Math.random() * Math.PI * 2;
                const radius = Utils.random(50, 400);
                const x = fieldX + Math.cos(angle) * radius;
                const y = fieldY + Math.sin(angle) * radius;
                const mass = Utils.random(0.5, 20);
                
                this.cells.push(new Cell(x, y, mass,
                    Utils.random(-15, 15),
                    Utils.random(-15, 15),
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

        // Dynamic culling based on player size
        const playerMass = this.player ? this.player.mass : 100;
        const cullThreshold = playerMass * 0.001; // Ignore cells smaller than 0.1% of player
        const updateRadius = Math.max(2000, playerMass * 5); // Only update nearby cells
        
        for (let cell of this.cells) {
            // Skip updating very tiny cells when player is large (performance)
            if (cell !== this.player && playerMass > 1000 && cell.mass < cullThreshold) {
                continue;
            }
            
            // Only update cells within reasonable distance when player is huge
            if (cell !== this.player && playerMass > 2000) {
                const dist = Utils.distance(cell.x, cell.y, this.player.x, this.player.y);
                if (dist > updateRadius) continue;
            }
            
            cell.update(deltaTime, this.worldWidth, this.worldHeight);
            
            if (cell.type === 'hunter') {
                cell.updateHunterAI(this.player, deltaTime);
            }
        }

        for (let particle of this.particles) {
            particle.update(deltaTime, this.worldWidth, this.worldHeight);
        }

        Physics.applyGravity(this.cells, 0.00005);
        
        // Player gravitational pull on smaller cells
        if (this.player && this.player.mass > 50) {
            const pullRadius = this.player.radius * 4;
            const pullStrength = 0.0003 * Math.log(this.player.mass);
            
            for (let cell of this.cells) {
                if (cell === this.player || cell.type === 'ejected') continue;
                
                // Only pull cells that are smaller
                if (cell.mass < this.player.mass * 0.8) {
                    const dx = this.player.x - cell.x;
                    const dy = this.player.y - cell.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    if (dist < pullRadius && dist > this.player.radius) {
                        // Stronger pull for smaller cells
                        const sizeFactor = Math.max(0.5, Math.min(2, this.player.mass / cell.mass / 10));
                        const force = pullStrength * sizeFactor * (1 - dist / pullRadius);
                        
                        cell.vx += (dx / dist) * force * this.player.mass;
                        cell.vy += (dy / dist) * force * this.player.mass;
                    }
                }
            }
        }

        // Filter cells for collision detection when player is large
        let collisionCells = this.cells;
        if (playerMass > 1000) {
            // Only check collisions for significant cells
            collisionCells = this.cells.filter(c => 
                c === this.player || 
                c.mass > cullThreshold ||
                Utils.distance(c.x, c.y, this.player.x, this.player.y) < 1000
            );
        }

        const collisions = Physics.checkCollisions(collisionCells);
        for (let [cell1, cell2] of collisions) {
            // Skip collision if both cells are too small relative to player
            if (playerMass > 2000 && 
                cell1 !== this.player && cell2 !== this.player &&
                cell1.mass < cullThreshold && cell2.mass < cullThreshold) {
                continue;
            }
            
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
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            return;
        }
        
        // Clear with reduced fade effect (less motion blur)
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
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

        // Draw gravitational field around player
        if (this.player && this.player.mass > 50) {
            const pullRadius = this.player.radius * 4;
            
            // Gravitational field gradient
            const gradient = this.ctx.createRadialGradient(
                this.player.x, this.player.y, this.player.radius,
                this.player.x, this.player.y, pullRadius
            );
            gradient.addColorStop(0, 'rgba(139, 195, 74, 0)');
            gradient.addColorStop(0.5, 'rgba(139, 195, 74, 0.05)');
            gradient.addColorStop(1, 'rgba(139, 195, 74, 0)');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(this.player.x, this.player.y, pullRadius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Gravitational field border
            this.ctx.strokeStyle = 'rgba(139, 195, 74, 0.15)';
            this.ctx.lineWidth = 1 / this.camera.zoom;
            this.ctx.setLineDash([5, 10]);
            this.ctx.beginPath();
            this.ctx.arc(this.player.x, this.player.y, pullRadius, 0, Math.PI * 2);
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
        const gridSize = 200;
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
        
        // Draw cells on minimap (optimize for massive cell counts)
        const scale = mapSize / Math.max(this.worldWidth, this.worldHeight);
        
        // Sort cells by size to draw big ones first
        const sortedCells = [...this.cells].sort((a, b) => b.mass - a.mass);
        
        for (let cell of sortedCells) {
            // Skip microscopic cells on minimap unless they're the player
            if (cell.mass < 10 && cell !== this.player) continue;
            
            const miniX = mapX + (cell.x * scale);
            const miniY = mapY + (cell.y * scale);
            const miniRadius = Math.max(0.5, cell.radius * scale);
            
            if (cell === this.player) {
                this.ctx.fillStyle = '#8bc34a';
                this.ctx.strokeStyle = '#fff';
                this.ctx.lineWidth = 1;
            } else if (cell.type === 'hunter') {
                this.ctx.fillStyle = 'rgba(150, 50, 200, 0.8)';
            } else if (cell.mass > 1000) {
                // Colossal cells - bright red
                this.ctx.fillStyle = 'rgba(255, 50, 50, 0.9)';
            } else if (cell.mass > 500) {
                // Giant cells - orange
                this.ctx.fillStyle = 'rgba(255, 150, 50, 0.8)';
            } else if (cell.mass > 200) {
                // Large cells - yellow
                this.ctx.fillStyle = 'rgba(255, 255, 100, 0.7)';
            } else {
                // Normal cells - standard red
                this.ctx.fillStyle = 'rgba(255, 100, 100, 0.6)';
            }
            
            this.ctx.beginPath();
            this.ctx.arc(miniX, miniY, miniRadius, 0, Math.PI * 2);
            this.ctx.fill();
            
            if (cell === this.player) {
                this.ctx.stroke();
            }
        }
        
        // Draw view rectangle
        const viewBounds = this.getViewBounds();
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 1;
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