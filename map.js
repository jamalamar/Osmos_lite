class MapSystem {
    constructor() {
        this.levels = this.generateMapLevels();
        this.currentLevel = 0;
        this.unlockedLevels = [0];
        this.completedLevels = [];
        this.selectedNode = null;
        this.canvas = null;
        this.ctx = null;
    }

    generateMapLevels() {
        // Get center position (will be set when canvas is initialized)
        const centerX = window.innerWidth / 2;
        
        const levels = [
            // Main path
            { id: 0, x: centerX, y: 550, type: 'normal', connections: [1], branch: 'main', name: 'Origin' },
            { id: 1, x: centerX, y: 480, type: 'normal', connections: [2, 3], branch: 'main', name: 'First Step' },
            
            // Branch point - splits into two paths
            { id: 2, x: centerX - 80, y: 410, type: 'normal', connections: [4], branch: 'left', name: 'Dense Cluster' },
            { id: 3, x: centerX + 80, y: 410, type: 'normal', connections: [5], branch: 'right', name: 'Open Space' },
            
            // Left branch
            { id: 4, x: centerX - 120, y: 340, type: 'challenge', connections: [6], branch: 'left', name: 'Challenge: Swarm' },
            { id: 6, x: centerX - 160, y: 270, type: 'normal', connections: [8], branch: 'left', name: 'Narrow Passage' },
            { id: 8, x: centerX - 120, y: 200, type: 'normal', connections: [10], branch: 'left', name: 'Convergence' },
            
            // Right branch
            { id: 5, x: centerX + 120, y: 340, type: 'normal', connections: [7], branch: 'right', name: 'Drifters' },
            { id: 7, x: centerX + 160, y: 270, type: 'challenge', connections: [9], branch: 'right', name: 'Challenge: Giants' },
            { id: 9, x: centerX + 120, y: 200, type: 'normal', connections: [10], branch: 'right', name: 'Reunification' },
            
            // Paths merge
            { id: 10, x: centerX, y: 160, type: 'boss', connections: [11], branch: 'main', name: 'Boss: Leviathan' },
            
            // Second section
            { id: 11, x: centerX, y: 100, type: 'normal', connections: [12, 13], branch: 'main', name: 'New Horizons' },
            
            // Second branch
            { id: 12, x: centerX - 80, y: 40, type: 'challenge', connections: [14], branch: 'left', name: 'Challenge: Maze' },
            { id: 13, x: centerX + 80, y: 40, type: 'normal', connections: [14], branch: 'right', name: 'Fast Track' },
            
            // Final boss
            { id: 14, x: centerX, y: -20, type: 'boss', connections: [], branch: 'main', name: 'Boss: Singularity' }
        ];
        
        return levels;
    }

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Recalculate level positions based on actual canvas width
        const centerX = canvas.width / 2;
        this.levels = this.levels.map(level => ({
            ...level,
            x: level.x - window.innerWidth / 2 + centerX
        }));
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Adjust for camera offset
            const worldX = x;
            const worldY = y - this.getCameraOffset();
            
            this.handleNodeClick(worldX, worldY);
        });
    }

    getCameraOffset() {
        // Center camera on current progress
        const currentNode = this.levels[this.currentLevel];
        if (!currentNode) return 0;
        
        const screenCenter = this.canvas.height / 2;
        return Math.max(0, screenCenter - currentNode.y);
    }

    handleNodeClick(x, y) {
        for (let level of this.levels) {
            const distance = Math.sqrt((x - level.x) ** 2 + (y - level.y) ** 2);
            if (distance < 25) {
                if (this.unlockedLevels.includes(level.id)) {
                    this.selectedNode = level;
                    return level;
                }
            }
        }
        return null;
    }

    unlockLevel(levelId) {
        if (!this.unlockedLevels.includes(levelId)) {
            this.unlockedLevels.push(levelId);
        }
    }

    completeLevel(levelId) {
        if (!this.completedLevels.includes(levelId)) {
            this.completedLevels.push(levelId);
            
            // Unlock connected levels
            const level = this.levels.find(l => l.id === levelId);
            if (level) {
                level.connections.forEach(connId => this.unlockLevel(connId));
            }
        }
    }

    render() {
        if (!this.ctx) return;
        
        const offset = this.getCameraOffset();
        
        // Clear canvas
        this.ctx.fillStyle = '#000811';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw starfield background
        this.drawStarfield();
        
        // Save context for camera transform
        this.ctx.save();
        this.ctx.translate(0, offset);
        
        // Draw connections
        this.drawConnections();
        
        // Draw nodes
        this.drawNodes();
        
        this.ctx.restore();
        
        // Draw UI
        this.drawUI();
    }

    drawStarfield() {
        const stars = 100;
        for (let i = 0; i < stars; i++) {
            const x = (i * 137.5) % this.canvas.width;
            const y = (i * 213.7) % this.canvas.height;
            const size = (i % 3) * 0.5 + 0.5;
            const opacity = 0.3 + (i % 5) * 0.1;
            
            this.ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
            this.ctx.fillRect(x, y, size, size);
        }
    }

    drawConnections() {
        this.ctx.strokeStyle = 'rgba(79, 195, 247, 0.3)';
        this.ctx.lineWidth = 2;
        
        for (let level of this.levels) {
            for (let connId of level.connections) {
                const target = this.levels.find(l => l.id === connId);
                if (!target) continue;
                
                // Highlight unlocked paths
                if (this.unlockedLevels.includes(level.id) && this.unlockedLevels.includes(connId)) {
                    this.ctx.strokeStyle = 'rgba(79, 195, 247, 0.6)';
                } else {
                    this.ctx.strokeStyle = 'rgba(79, 195, 247, 0.2)';
                }
                
                this.ctx.beginPath();
                this.ctx.moveTo(level.x, level.y);
                
                // Draw curved path
                const midX = (level.x + target.x) / 2;
                const midY = (level.y + target.y) / 2;
                const curveOffset = (level.x - target.x) * 0.1;
                
                this.ctx.quadraticCurveTo(
                    midX + curveOffset, midY,
                    target.x, target.y
                );
                this.ctx.stroke();
            }
        }
    }

    drawNodes() {
        for (let level of this.levels) {
            const isUnlocked = this.unlockedLevels.includes(level.id);
            const isCompleted = this.completedLevels.includes(level.id);
            const isSelected = this.selectedNode && this.selectedNode.id === level.id;
            
            // Node glow effect
            if (isUnlocked) {
                const gradient = this.ctx.createRadialGradient(
                    level.x, level.y, 0,
                    level.x, level.y, 30
                );
                gradient.addColorStop(0, 'rgba(79, 195, 247, 0.3)');
                gradient.addColorStop(1, 'rgba(79, 195, 247, 0)');
                this.ctx.fillStyle = gradient;
                this.ctx.fillRect(level.x - 30, level.y - 30, 60, 60);
            }
            
            // Node circle
            this.ctx.beginPath();
            this.ctx.arc(level.x, level.y, 20, 0, Math.PI * 2);
            
            // Fill based on state
            if (isCompleted) {
                this.ctx.fillStyle = '#4fc3f7';
            } else if (isUnlocked) {
                this.ctx.fillStyle = '#1976d2';
            } else {
                this.ctx.fillStyle = '#333';
            }
            this.ctx.fill();
            
            // Border
            this.ctx.strokeStyle = isSelected ? '#fff' : 'rgba(79, 195, 247, 0.8)';
            this.ctx.lineWidth = isSelected ? 3 : 2;
            this.ctx.stroke();
            
            // Icon based on type
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            let icon = '●';
            if (level.type === 'boss') icon = '★';
            else if (level.type === 'challenge') icon = '⚡';
            
            this.ctx.fillText(icon, level.x, level.y);
            
            // Level name
            if (isUnlocked) {
                this.ctx.font = '12px Arial';
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                this.ctx.fillText(level.name, level.x, level.y + 35);
            }
        }
    }

    drawUI() {
        // Back button
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(20, 20, 100, 40);
        this.ctx.strokeStyle = 'rgba(79, 195, 247, 0.8)';
        this.ctx.strokeRect(20, 20, 100, 40);
        
        this.ctx.fillStyle = '#4fc3f7';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('BACK', 70, 45);
        
        // Selected level info
        if (this.selectedNode) {
            const infoX = this.canvas.width - 220;
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.fillRect(infoX, 20, 200, 120);
            this.ctx.strokeStyle = 'rgba(79, 195, 247, 0.8)';
            this.ctx.strokeRect(infoX, 20, 200, 120);
            
            this.ctx.fillStyle = '#4fc3f7';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(this.selectedNode.name, infoX + 10, 45);
            
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            this.ctx.font = '12px Arial';
            this.ctx.fillText(`Type: ${this.selectedNode.type.toUpperCase()}`, infoX + 10, 70);
            this.ctx.fillText(`Status: ${this.completedLevels.includes(this.selectedNode.id) ? 'COMPLETED' : 'AVAILABLE'}`, infoX + 10, 90);
            
            // Play button for selected level
            this.ctx.fillStyle = '#4fc3f7';
            this.ctx.fillRect(infoX + 50, 100, 100, 30);
            this.ctx.fillStyle = '#000';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('PLAY', infoX + 100, 120);
        }
        
        // Progress indicator
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'center';
        const progress = Math.round((this.completedLevels.length / this.levels.length) * 100);
        this.ctx.fillText(`Journey Progress: ${progress}%`, this.canvas.width / 2, 40);
    }
}