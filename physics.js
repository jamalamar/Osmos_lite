class Physics {
    static checkCollisions(cells) {
        const collisions = [];
        
        // Use spatial partitioning for efficiency in larger world
        const gridSize = 500;
        const grid = new Map();
        
        // Place cells in grid
        for (let cell of cells) {
            const gridX = Math.floor(cell.x / gridSize);
            const gridY = Math.floor(cell.y / gridSize);
            const key = `${gridX},${gridY}`;
            
            if (!grid.has(key)) {
                grid.set(key, []);
            }
            grid.get(key).push(cell);
        }
        
        // Check collisions within and between neighboring grid cells
        for (let [key, cellsInGrid] of grid) {
            const [gx, gy] = key.split(',').map(Number);
            
            // Check within same grid cell
            for (let i = 0; i < cellsInGrid.length; i++) {
                for (let j = i + 1; j < cellsInGrid.length; j++) {
                    if (cellsInGrid[i].checkCollision(cellsInGrid[j])) {
                        collisions.push([cellsInGrid[i], cellsInGrid[j]]);
                    }
                }
            }
            
            // Check neighboring cells
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    if (dx === 0 && dy === 0) continue;
                    
                    const neighborKey = `${gx + dx},${gy + dy}`;
                    if (grid.has(neighborKey)) {
                        const neighborCells = grid.get(neighborKey);
                        
                        for (let cell1 of cellsInGrid) {
                            for (let cell2 of neighborCells) {
                                if (cell1.checkCollision(cell2)) {
                                    collisions.push([cell1, cell2]);
                                }
                            }
                        }
                    }
                }
            }
        }
        
        return collisions;
    }

    static resolveCollision(cell1, cell2) {
        if (cell1.absorbed || cell2.absorbed) return;

        const dx = cell2.x - cell1.x;
        const dy = cell2.y - cell1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist === 0) return;

        const overlap = (cell1.radius + cell2.radius) - dist;
        
        if (overlap > 0) {
            const separationX = (dx / dist) * overlap * 0.5;
            const separationY = (dy / dist) * overlap * 0.5;
            
            cell1.x -= separationX;
            cell1.y -= separationY;
            cell2.x += separationX;
            cell2.y += separationY;

            const v1n = (cell1.vx * dx + cell1.vy * dy) / dist;
            const v2n = (cell2.vx * dx + cell2.vy * dy) / dist;
            
            const m1 = cell1.mass;
            const m2 = cell2.mass;
            
            const v1nAfter = (v1n * (m1 - m2) + 2 * m2 * v2n) / (m1 + m2);
            const v2nAfter = (v2n * (m2 - m1) + 2 * m1 * v1n) / (m1 + m2);
            
            const v1nDiff = v1nAfter - v1n;
            const v2nDiff = v2nAfter - v2n;
            
            cell1.vx += v1nDiff * (dx / dist) * 0.5;
            cell1.vy += v1nDiff * (dy / dist) * 0.5;
            cell2.vx += v2nDiff * (dx / dist) * 0.5;
            cell2.vy += v2nDiff * (dy / dist) * 0.5;
        }
    }

    static handleAbsorption(cell1, cell2) {
        if (cell1.absorbed || cell2.absorbed) return null;

        const massDiff = Math.abs(cell1.mass - cell2.mass);
        const smallerMass = Math.min(cell1.mass, cell2.mass);
        
        if (massDiff / smallerMass > 0.1) {
            if (cell1.mass > cell2.mass) {
                return cell1.absorb(cell2) ? cell2 : null;
            } else {
                return cell2.absorb(cell1) ? cell1 : null;
            }
        }
        
        return null;
    }

    static applyGravity(cells, strength = 0.0001) {
        // Only apply gravity between large masses to optimize performance
        const largeCells = cells.filter(c => c.mass > 100);
        
        for (let i = 0; i < largeCells.length; i++) {
            for (let j = i + 1; j < largeCells.length; j++) {
                const dx = largeCells[j].x - largeCells[i].x;
                const dy = largeCells[j].y - largeCells[i].y;
                const distSq = dx * dx + dy * dy;
                
                // Adjusted for larger world
                if (distSq < 50000 || distSq > 10000000) continue;
                
                const force = strength * (largeCells[i].mass * largeCells[j].mass) / distSq;
                const dist = Math.sqrt(distSq);
                
                const fx = (dx / dist) * force;
                const fy = (dy / dist) * force;
                
                largeCells[i].vx += fx / largeCells[i].mass;
                largeCells[i].vy += fy / largeCells[i].mass;
                largeCells[j].vx -= fx / largeCells[j].mass;
                largeCells[j].vy -= fy / largeCells[j].mass;
            }
        }
    }

    static createExplosion(x, y, cells, count = 16) {
        const particles = [];
        
        // Create more dramatic explosions
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + Utils.random(-0.2, 0.2);
            const speed = Utils.random(200, 500);
            const mass = Utils.random(3, 20);
            
            particles.push(new Cell(
                x + Math.cos(angle) * 20,
                y + Math.sin(angle) * 20,
                mass,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                'particle'
            ));
        }
        
        // Add some smaller debris
        for (let i = 0; i < count / 2; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Utils.random(50, 150);
            const mass = Utils.random(1, 5);
            
            particles.push(new Cell(
                x + Math.cos(angle) * 5,
                y + Math.sin(angle) * 5,
                mass,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                'particle'
            ));
        }
        
        return particles;
    }
}