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
        const yStart = 650;
        
        const levels = [
            // Entry Point - Respiratory System
            { id: 0, x: centerX, y: yStart, type: 'normal', connections: [1], branch: 'respiratory', name: 'Nasal Cavity', organ: 'nose' },
            { id: 1, x: centerX, y: yStart - 70, type: 'normal', connections: [2], branch: 'respiratory', name: 'Throat', organ: 'throat' },
            { id: 2, x: centerX, y: yStart - 140, type: 'normal', connections: [3, 4], branch: 'respiratory', name: 'Trachea', organ: 'trachea' },
            
            // Lungs Branch
            { id: 3, x: centerX - 100, y: yStart - 210, type: 'normal', connections: [5], branch: 'lungs', name: 'Left Lung', organ: 'lung' },
            { id: 4, x: centerX + 100, y: yStart - 210, type: 'normal', connections: [6], branch: 'lungs', name: 'Right Lung', organ: 'lung' },
            { id: 5, x: centerX - 120, y: yStart - 280, type: 'challenge', connections: [7], branch: 'lungs', name: 'Alveoli', organ: 'alveoli' },
            { id: 6, x: centerX + 120, y: yStart - 280, type: 'normal', connections: [7], branch: 'lungs', name: 'Bronchioles', organ: 'bronchi' },
            
            // Bloodstream
            { id: 7, x: centerX, y: yStart - 350, type: 'normal', connections: [8], branch: 'blood', name: 'Bloodstream', organ: 'blood' },
            
            // Heart - First Boss
            { id: 8, x: centerX, y: yStart - 420, type: 'boss', connections: [9, 10, 11], branch: 'cardiovascular', name: 'HEART', organ: 'heart' },
            
            // Three paths from heart
            { id: 9, x: centerX - 150, y: yStart - 490, type: 'normal', connections: [12], branch: 'digestive', name: 'Stomach', organ: 'stomach' },
            { id: 10, x: centerX, y: yStart - 490, type: 'challenge', connections: [13], branch: 'immune', name: 'Lymph Node', organ: 'lymph' },
            { id: 11, x: centerX + 150, y: yStart - 490, type: 'normal', connections: [14], branch: 'filtration', name: 'Liver', organ: 'liver' },
            
            // Digestive path
            { id: 12, x: centerX - 150, y: yStart - 560, type: 'normal', connections: [15], branch: 'digestive', name: 'Small Intestine', organ: 'intestine' },
            
            // Immune challenge
            { id: 13, x: centerX, y: yStart - 560, type: 'challenge', connections: [15], branch: 'immune', name: 'Spleen', organ: 'spleen' },
            
            // Filtration path
            { id: 14, x: centerX + 150, y: yStart - 560, type: 'challenge', connections: [15], branch: 'filtration', name: 'Kidneys', organ: 'kidney' },
            
            // Paths converge - Nervous System
            { id: 15, x: centerX, y: yStart - 630, type: 'normal', connections: [16], branch: 'nervous', name: 'Spinal Cord', organ: 'spine' },
            { id: 16, x: centerX, y: yStart - 700, type: 'normal', connections: [17, 18], branch: 'nervous', name: 'Brain Stem', organ: 'brainstem' },
            
            // Final branches
            { id: 17, x: centerX - 80, y: yStart - 770, type: 'challenge', connections: [19], branch: 'nervous', name: 'Cerebellum', organ: 'cerebellum' },
            { id: 18, x: centerX + 80, y: yStart - 770, type: 'normal', connections: [19], branch: 'nervous', name: 'Frontal Lobe', organ: 'brain' },
            
            // Final Boss
            { id: 19, x: centerX, y: yStart - 840, type: 'boss', connections: [], branch: 'nervous', name: 'BRAIN CORE', organ: 'brain' }
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
        
        // Clear canvas with body interior color
        this.ctx.fillStyle = '#1a0008';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw biological background
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
        // Draw floating cells/particles in the body
        const particles = 80;
        for (let i = 0; i < particles; i++) {
            const x = (i * 137.5) % this.canvas.width;
            const y = (i * 213.7) % this.canvas.height;
            const size = (i % 3) * 1.5 + 1;
            const opacity = 0.1 + (i % 5) * 0.05;
            
            // Red blood cells
            this.ctx.fillStyle = `rgba(200, 50, 50, ${opacity})`;
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // White blood cells (fewer)
        for (let i = 0; i < 20; i++) {
            const x = (i * 312.5) % this.canvas.width;
            const y = (i * 178.3) % this.canvas.height;
            const size = 3;
            const opacity = 0.15;
            
            this.ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    drawConnections() {
        for (let level of this.levels) {
            for (let connId of level.connections) {
                const target = this.levels.find(l => l.id === connId);
                if (!target) continue;
                
                // Blood vessel style connections
                const isUnlocked = this.unlockedLevels.includes(level.id) && this.unlockedLevels.includes(connId);
                
                // Draw vessel
                this.ctx.lineWidth = 8;
                this.ctx.strokeStyle = isUnlocked ? 'rgba(180, 40, 40, 0.4)' : 'rgba(100, 20, 20, 0.3)';
                
                this.ctx.beginPath();
                this.ctx.moveTo(level.x, level.y);
                
                // Draw organic curved blood vessel
                const midX = (level.x + target.x) / 2;
                const midY = (level.y + target.y) / 2;
                const curveOffset = (level.x - target.x) * 0.2;
                
                this.ctx.quadraticCurveTo(
                    midX + curveOffset, midY,
                    target.x, target.y
                );
                this.ctx.stroke();
                
                // Inner vessel highlight
                this.ctx.lineWidth = 3;
                this.ctx.strokeStyle = isUnlocked ? 'rgba(220, 80, 80, 0.3)' : 'rgba(150, 50, 50, 0.2)';
                this.ctx.stroke();
            }
        }
    }

    drawNodes() {
        for (let level of this.levels) {
            const isUnlocked = this.unlockedLevels.includes(level.id);
            const isCompleted = this.completedLevels.includes(level.id);
            const isSelected = this.selectedNode && this.selectedNode.id === level.id;
            
            // Get organ-specific color
            let organColor = this.getOrganColor(level.organ, level.branch);
            
            // Node glow effect
            if (isUnlocked) {
                const gradient = this.ctx.createRadialGradient(
                    level.x, level.y, 0,
                    level.x, level.y, 35
                );
                gradient.addColorStop(0, `rgba(${organColor.r}, ${organColor.g}, ${organColor.b}, 0.4)`);
                gradient.addColorStop(1, `rgba(${organColor.r}, ${organColor.g}, ${organColor.b}, 0)`);
                this.ctx.fillStyle = gradient;
                this.ctx.fillRect(level.x - 35, level.y - 35, 70, 70);
            }
            
            // Draw organ shape based on type
            const radius = level.type === 'boss' ? 28 : 22;
            
            // Outer ring for bosses
            if (level.type === 'boss') {
                this.ctx.beginPath();
                this.ctx.arc(level.x, level.y, radius + 5, 0, Math.PI * 2);
                this.ctx.strokeStyle = `rgba(255, 100, 100, 0.6)`;
                this.ctx.lineWidth = 3;
                this.ctx.stroke();
            }
            
            // Main node
            this.ctx.beginPath();
            this.ctx.arc(level.x, level.y, radius, 0, Math.PI * 2);
            
            // Fill based on state and organ
            if (isCompleted) {
                this.ctx.fillStyle = '#8bc34a'; // Infected (green)
            } else if (isUnlocked) {
                this.ctx.fillStyle = `rgb(${organColor.r}, ${organColor.g}, ${organColor.b})`;
            } else {
                this.ctx.fillStyle = '#2a1015';
            }
            this.ctx.fill();
            
            // Border
            this.ctx.strokeStyle = isSelected ? '#fff' : `rgba(${organColor.r + 50}, ${organColor.g + 50}, ${organColor.b + 50}, 0.8)`;
            this.ctx.lineWidth = isSelected ? 3 : 2;
            this.ctx.stroke();
            
            // Icon based on type
            this.ctx.fillStyle = isCompleted ? '#fff' : '#ffd';
            this.ctx.font = level.type === 'boss' ? 'bold 20px Arial' : 'bold 14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            let icon = this.getOrganIcon(level.organ, level.type);
            this.ctx.fillText(icon, level.x, level.y);
            
            // Level name
            if (isUnlocked) {
                this.ctx.font = level.type === 'boss' ? 'bold 14px Arial' : '12px Arial';
                this.ctx.fillStyle = 'rgba(255, 220, 220, 0.9)';
                this.ctx.fillText(level.name.toUpperCase(), level.x, level.y + (radius + 15));
            }
        }
    }
    
    getOrganColor(organ, branch) {
        const colors = {
            'respiratory': { r: 150, g: 180, b: 200 },
            'lung': { r: 200, g: 150, b: 180 },
            'blood': { r: 180, g: 40, b: 40 },
            'heart': { r: 200, g: 50, b: 50 },
            'stomach': { r: 180, g: 120, b: 100 },
            'intestine': { r: 160, g: 100, b: 80 },
            'liver': { r: 120, g: 60, b: 40 },
            'kidney': { r: 140, g: 70, b: 90 },
            'lymph': { r: 220, g: 200, b: 100 },
            'spleen': { r: 140, g: 60, b: 80 },
            'nervous': { r: 180, g: 150, b: 200 },
            'brain': { r: 200, g: 160, b: 180 },
            'spine': { r: 160, g: 140, b: 170 }
        };
        
        return colors[organ] || colors[branch] || { r: 150, g: 100, b: 100 };
    }
    
    getOrganIcon(organ, type) {
        if (type === 'boss') {
            if (organ === 'heart') return '♥';
            if (organ === 'brain') return '◉';
        }
        
        const icons = {
            'nose': '◊',
            'throat': '○',
            'lung': '◎',
            'blood': '◦',
            'stomach': '◈',
            'intestine': '∼',
            'liver': '◆',
            'kidney': '◐',
            'lymph': '✦',
            'spleen': '◉',
            'spine': '║',
            'brain': '◎',
            'alveoli': '⬡',
            'bronchi': '⫸'
        };
        
        if (type === 'challenge') return '⚡';
        return icons[organ] || '●';
    }

    drawUI() {
        // Back button
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(20, 20, 100, 40);
        this.ctx.strokeStyle = 'rgba(139, 195, 74, 0.8)';
        this.ctx.strokeRect(20, 20, 100, 40);
        
        this.ctx.fillStyle = '#8bc34a';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('BACK', 70, 45);
        
        // Selected level info
        if (this.selectedNode) {
            const infoX = this.canvas.width - 220;
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.fillRect(infoX, 20, 200, 120);
            this.ctx.strokeStyle = 'rgba(200, 50, 50, 0.8)';
            this.ctx.strokeRect(infoX, 20, 200, 120);
            
            this.ctx.fillStyle = '#ff6b6b';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(this.selectedNode.name, infoX + 10, 45);
            
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            this.ctx.font = '12px Arial';
            this.ctx.fillText(`Type: ${this.selectedNode.type.toUpperCase()}`, infoX + 10, 70);
            this.ctx.fillText(`Status: ${this.completedLevels.includes(this.selectedNode.id) ? 'COMPLETED' : 'AVAILABLE'}`, infoX + 10, 90);
            
            // Play button for selected level
            this.ctx.fillStyle = '#8bc34a';
            this.ctx.fillRect(infoX + 50, 100, 100, 30);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('INFECT', infoX + 100, 120);
        }
        
        // Progress indicator
        this.ctx.fillStyle = 'rgba(255, 220, 220, 0.9)';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        const progress = Math.round((this.completedLevels.length / this.levels.length) * 100);
        this.ctx.fillText(`INFECTION PROGRESS: ${progress}%`, this.canvas.width / 2, 40);
    }
}