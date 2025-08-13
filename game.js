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
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const ejected = this.player.ejectMass(x, y, 10);
            if (ejected) {
                this.cells.push(ejected);
                this.updateUI();
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
        
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        this.player = new Cell(centerX, centerY, 100, 0, 0, 'player');
        this.cells.push(this.player);

        const cellCount = 20 + levelNum * 5;
        const hunterCount = Math.floor(levelNum / 2);
        
        for (let i = 0; i < cellCount; i++) {
            let x, y, validPosition;
            let attempts = 0;
            
            do {
                x = Utils.random(50, this.canvas.width - 50);
                y = Utils.random(50, this.canvas.height - 50);
                validPosition = Utils.distance(x, y, centerX, centerY) > 150;
                attempts++;
            } while (!validPosition && attempts < 50);
            
            const mass = Utils.random(20, 200);
            const vx = Utils.random(-20, 20);
            const vy = Utils.random(-20, 20);
            const type = i < hunterCount ? 'hunter' : 'passive';
            
            this.cells.push(new Cell(x, y, mass, vx, vy, type));
        }
        
        this.updateUI();
        document.getElementById('gameOver').classList.add('hidden');
    }

    update(deltaTime) {
        if (this.gameState !== 'playing') return;

        for (let cell of this.cells) {
            cell.update(deltaTime, this.canvas.width, this.canvas.height);
            
            if (cell.type === 'hunter') {
                cell.updateHunterAI(this.player, deltaTime);
            }
        }

        for (let particle of this.particles) {
            particle.update(deltaTime, this.canvas.width, this.canvas.height);
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
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        for (let particle of this.particles) {
            particle.draw(this.ctx, this.player ? this.player.mass : 100);
        }

        const sortedCells = [...this.cells].sort((a, b) => a.radius - b.radius);
        
        for (let cell of sortedCells) {
            if (cell === this.player) {
                cell.draw(this.ctx, this.player.mass, true);
            } else {
                cell.draw(this.ctx, this.player ? this.player.mass : 100);
            }
        }

        if (this.player) {
            this.ctx.save();
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            this.ctx.lineWidth = 1;
            this.ctx.setLineDash([5, 10]);
            this.ctx.beginPath();
            this.ctx.arc(this.player.x, this.player.y, 100, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.restore();
        }
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