export function lerp(a, b, t) {
    return (1 - t) * a + t * b;
}

export function randint(lo, hi) {
    return Math.floor((hi - lo) * Math.random());
}

export function randfloat(lo, hi) {
    return lo + Math.random() * (hi - lo);
}

export function overlaps(a, b) {
    if (a.x >= b.x + b.width || b.x >= a.x + a.width) {
        return false;
    }

    if (a.y >= b.y + b.height || b.y >= a.y + a.height) {
        return false;
    }

    return true;
}

export function isPointInside(rect, x, y) {
    return rect.x <= x && x < rect.x + rect.width && rect.y <= y && y < rect.y + rect.height;
}

export function square(x) {
    return x * x;
}

export function approach(target, current, step) {
    if (target > current) {
        return Math.min(target, current + step);
    } else if (target < current) {
        return Math.max(target, current - step);
    } else {
        return target;
    }
}

export function clamp(x, lo, hi) {
    return Math.max(lo, Math.min(x, hi));
}

export function clampPointWithin({ x, y }, rect) {
    return {
        x: clamp(x, rect.x, rect.x + rect.width),
        y: clamp(y, rect.y, rect.y + rect.height),
    };
}

export function insetRect(rect, insetBy) {
    return {
        x: rect.x + insetBy,
        y: rect.y + insetBy,
        width: rect.width - 2 * insetBy,
        height: rect.height - 2 * insetBy,
    };
}

export function rectMidpoint(rect) {
    return {
        x: rect.x + rect.width / 2,
        y: rect.y + rect.height / 2,
    };
}

export function normalize({ x, y }, radius) {
    const magnitude = Math.sqrt(x * x + y * y);

    return {
        x: x * radius / magnitude,
        y: y * radius / magnitude,
    };
}

export function distance({ x, y }, { x: x1, y: y1 }) {
    return Math.sqrt((x - x1) * (x - x1) + (y - y1) * (y - y1));
}

export function randomPerimeterPoint(rect) {
    const halfPerimeter = rect.width + rect.height;
    const pos = randfloat(0, halfPerimeter);

    if (pos < rect.width) {
        return {
            x: rect.x + pos,
            y: randint(0, 2) ? rect.y : rect.y + rect.height,
        };
    } else {
        return {
            x: randint(0, 2) ? rect.x : rect.x + rect.width,
            y: rect.y + (pos - rect.width),
        };
    }
}

export function randomPointInRect(rect) {
    return {
        x: rect.x + randfloat(0, rect.width),
        y: rect.y + randfloat(0, rect.height),
    };
}
