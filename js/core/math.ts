export function lerp(a: number, b: number, t: number) {
    return (1 - t) * a + t * b;
}

export function randint(lo: number, hi: number) {
    return Math.floor((hi - lo) * Math.random());
}

export function randfloat(lo: number, hi: number) {
    return lo + Math.random() * (hi - lo);
}

export type Vector = {
    x: number;
    y: number;
};

export type Rect = {
    x: number;
    y: number;
    width: number;
    height: number;
};

export function overlaps(a: Rect, b: Rect) {
    if (a.x >= b.x + b.width || b.x >= a.x + a.width) {
        return false;
    }

    if (a.y >= b.y + b.height || b.y >= a.y + a.height) {
        return false;
    }

    return true;
}

export function isPointInside(rect: Rect, x: number, y: number) {
    return rect.x <= x && x < rect.x + rect.width && rect.y <= y && y < rect.y + rect.height;
}

export function square(x: number) {
    return x * x;
}

export function approach(target: number, current: number, step: number) {
    if (target > current) {
        return Math.min(target, current + step);
    } else if (target < current) {
        return Math.max(target, current - step);
    } else {
        return target;
    }
}

export function clamp(x: number, lo: number, hi: number) {
    return Math.max(lo, Math.min(x, hi));
}

export function clampPointWithin(vector: Vector, rect: Rect) {
    return {
        x: clamp(vector.x, rect.x, rect.x + rect.width),
        y: clamp(vector.y, rect.y, rect.y + rect.height),
    };
}

export function insetRect(rect: Rect, insetBy: number): Rect {
    return {
        x: rect.x + insetBy,
        y: rect.y + insetBy,
        width: rect.width - 2 * insetBy,
        height: rect.height - 2 * insetBy,
    };
}

export function rectMidpoint(rect: Rect): Vector {
    return {
        x: rect.x + rect.width / 2,
        y: rect.y + rect.height / 2,
    };
}

export function normalize(vector: Vector, radius: number): Vector {
    const magnitude = Math.sqrt(vector.x * vector.x + vector.y * vector.y);

    return {
        x: vector.x * radius / magnitude,
        y: vector.y * radius / magnitude,
    };
}

export function distance(p1: Vector, p2: Vector) {
    return Math.sqrt(square(p1.x - p2.x) + square(p1.y - p2.y));
}

export function randomPerimeterPoint(rect: Rect): Vector {
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

export function randomPointInRect(rect: Rect): Vector {
    return {
        x: rect.x + randfloat(0, rect.width),
        y: rect.y + randfloat(0, rect.height),
    };
}
