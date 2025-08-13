class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.cells = [];
        this.player = null;
        this.score = 0;
        this.level = 1;
        this.gameState = 'playing';
        this.lastTime = 0;
        this.particles = [];
        
        this.setupCanvas();
        this.setupEventListeners();
        this.initLevel(1);
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

        document.getElementById('restartBtn').addEventListener('click', () => {
            this.restart();
        });
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
        this.level++;
        
        if (this.level > 10) {
            this.gameOver(true, 'Congratulations! You completed all levels!');
        } else {
            setTimeout(() => {
                this.initLevel(this.level);
            }, 1500);
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
    }

    restart() {
        this.initLevel(1);
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