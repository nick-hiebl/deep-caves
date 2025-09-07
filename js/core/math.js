function lerp(a, b, t) {
    return (1 - t) * a + t * b;
}

function overlaps(a, b) {
    if (a.x >= b.x + b.width || b.x >= a.x + a.width) {
        return false;
    }

    if (a.y >= b.y + b.height || b.y >= a.y + a.height) {
        return false;
    }

    return true;
}

function isPointInside(rect, x, y) {
    return rect.x <= x && x < rect.x + rect.width && rect.y <= y && y < rect.y + rect.height;
}

function square(x) {
    return x * x;
}
