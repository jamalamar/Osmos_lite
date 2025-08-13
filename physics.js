class Physics {
    static checkCollisions(cells) {
        const collisions = [];
        
        for (let i = 0; i < cells.length; i++) {
            for (let j = i + 1; j < cells.length; j++) {
                if (cells[i].checkCollision(cells[j])) {
                    collisions.push([cells[i], cells[j]]);
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
        for (let i = 0; i < cells.length; i++) {
            for (let j = i + 1; j < cells.length; j++) {
                const dx = cells[j].x - cells[i].x;
                const dy = cells[j].y - cells[i].y;
                const distSq = dx * dx + dy * dy;
                
                if (distSq < 10000 || distSq > 1000000) continue;
                
                const force = strength * (cells[i].mass * cells[j].mass) / distSq;
                const dist = Math.sqrt(distSq);
                
                const fx = (dx / dist) * force;
                const fy = (dy / dist) * force;
                
                cells[i].vx += fx / cells[i].mass;
                cells[i].vy += fy / cells[i].mass;
                cells[j].vx -= fx / cells[j].mass;
                cells[j].vy -= fy / cells[j].mass;
            }
        }
    }

    static createExplosion(x, y, cells, count = 8) {
        const particles = [];
        
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + Utils.random(-0.2, 0.2);
            const speed = Utils.random(100, 300);
            const mass = Utils.random(5, 15);
            
            particles.push(new Cell(
                x + Math.cos(angle) * 10,
                y + Math.sin(angle) * 10,
                mass,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                'particle'
            ));
        }
        
        return particles;
    }
}