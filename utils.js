const Utils = {
    random(min, max) {
        return Math.random() * (max - min) + min;
    },

    distance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    },

    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    },

    massToRadius(mass) {
        return Math.sqrt(mass / Math.PI) * 2;
    },

    radiusToMass(radius) {
        return Math.PI * (radius / 2) ** 2;
    },

    lerp(start, end, t) {
        return start + (end - start) * t;
    },

    getColorBySize(mass, playerMass) {
        const ratio = mass / playerMass;
        
        if (ratio < 0.8) {
            return `hsl(120, 70%, ${40 + ratio * 20}%)`;
        } else if (ratio < 1.2) {
            return `hsl(60, 70%, 50%)`;
        } else {
            return `hsl(0, 70%, ${60 - Math.min(ratio - 1.2, 1) * 20}%)`;
        }
    },

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    },

    normalize(x, y) {
        const mag = Math.sqrt(x * x + y * y);
        if (mag === 0) return { x: 0, y: 0 };
        return { x: x / mag, y: y / mag };
    }
};