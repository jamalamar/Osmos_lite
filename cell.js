class Cell {
    constructor(x, y, mass, vx = 0, vy = 0, type = 'passive') {
        this.x = x;
        this.y = y;
        this.mass = mass;
        this.vx = vx;
        this.vy = vy;
        this.type = type;
        this.radius = Utils.massToRadius(mass);
        this.targetRadius = this.radius;
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.absorbed = false;
        this.opacity = 1;
        
        if (type === 'hunter') {
            this.huntSpeed = 0.5;
            this.huntRadius = 200;
        }
    }

    update(deltaTime, worldWidth, worldHeight) {
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;

        this.vx *= 0.995;
        this.vy *= 0.995;

        if (this.x - this.radius < 0) {
            this.x = this.radius;
            this.vx = Math.abs(this.vx) * 0.8;
        }
        if (this.x + this.radius > worldWidth) {
            this.x = worldWidth - this.radius;
            this.vx = -Math.abs(this.vx) * 0.8;
        }
        if (this.y - this.radius < 0) {
            this.y = this.radius;
            this.vy = Math.abs(this.vy) * 0.8;
        }
        if (this.y + this.radius > worldHeight) {
            this.y = worldHeight - this.radius;
            this.vy = -Math.abs(this.vy) * 0.8;
        }

        this.radius = Utils.lerp(this.radius, this.targetRadius, 0.1);
        this.pulsePhase += 0.02;

        if (this.absorbed) {
            this.opacity = Math.max(0, this.opacity - 0.05);
        }
    }

    updateHunterAI(player, deltaTime) {
        if (this.type !== 'hunter' || !player || this.absorbed) return;

        const dist = Utils.distance(this.x, this.y, player.x, player.y);
        
        if (dist < this.huntRadius && this.mass > player.mass * 1.2) {
            const angle = Math.atan2(player.y - this.y, player.x - this.x);
            const force = this.huntSpeed * (1 - dist / this.huntRadius);
            
            this.vx += Math.cos(angle) * force * deltaTime;
            this.vy += Math.sin(angle) * force * deltaTime;
        }
    }

    ejectMass(targetX, targetY, amount) {
        if (this.mass <= 20) return null;
        
        const ejectAmount = Math.min(amount, this.mass * 0.1);
        this.mass -= ejectAmount;
        this.targetRadius = Utils.massToRadius(this.mass);

        const angle = Math.atan2(targetY - this.y, targetX - this.x);
        const speed = 300;
        
        const ejectDistance = this.radius + Utils.massToRadius(ejectAmount) + 5;
        const ejectX = this.x + Math.cos(angle) * ejectDistance;
        const ejectY = this.y + Math.sin(angle) * ejectDistance;
        
        this.vx -= Math.cos(angle) * speed * (ejectAmount / this.mass) * 2;
        this.vy -= Math.sin(angle) * speed * (ejectAmount / this.mass) * 2;

        return new Cell(
            ejectX,
            ejectY,
            ejectAmount,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            'ejected'
        );
    }

    draw(ctx, playerMass, isPlayer = false) {
        if (this.opacity <= 0) return;

        ctx.save();
        ctx.globalAlpha = this.opacity;

        const pulse = Math.sin(this.pulsePhase) * 0.05 + 1;
        const drawRadius = this.radius * pulse;

        if (isPlayer) {
            const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, drawRadius);
            gradient.addColorStop(0, 'rgba(100, 200, 255, 0.8)');
            gradient.addColorStop(0.7, 'rgba(50, 150, 255, 0.5)');
            gradient.addColorStop(1, 'rgba(30, 100, 200, 0.2)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, drawRadius, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = 'rgba(100, 200, 255, 0.8)';
            ctx.lineWidth = 2;
            ctx.stroke();
        } else {
            const color = this.type === 'hunter' 
                ? `hsl(280, 70%, ${50 + Math.sin(this.pulsePhase * 2) * 10}%)`
                : Utils.getColorBySize(this.mass, playerMass);
            
            const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, drawRadius);
            
            if (this.type === 'ejected') {
                gradient.addColorStop(0, 'rgba(255, 255, 150, 0.9)');
                gradient.addColorStop(1, 'rgba(255, 255, 100, 0.3)');
            } else {
                const baseColor = color.match(/\d+/g);
                gradient.addColorStop(0, color);
                gradient.addColorStop(1, `hsla(${baseColor[0]}, ${baseColor[1]}%, ${baseColor[2] * 0.5}%, 0.3)`);
            }
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, drawRadius, 0, Math.PI * 2);
            ctx.fill();
            
            if (this.type === 'hunter') {
                ctx.strokeStyle = 'rgba(200, 100, 255, 0.5)';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }

        ctx.restore();
    }

    checkCollision(other) {
        const dist = Utils.distance(this.x, this.y, other.x, other.y);
        return dist < this.radius + other.radius;
    }

    absorb(other) {
        if (this.absorbed || other.absorbed) return false;
        
        if (this.mass > other.mass) {
            const totalMass = this.mass + other.mass * 0.8;
            
            const momentumX = this.vx * this.mass + other.vx * other.mass;
            const momentumY = this.vy * this.mass + other.vy * other.mass;
            
            this.vx = momentumX / totalMass;
            this.vy = momentumY / totalMass;
            
            this.mass = totalMass;
            this.targetRadius = Utils.massToRadius(this.mass);
            
            other.absorbed = true;
            return true;
        }
        return false;
    }
}