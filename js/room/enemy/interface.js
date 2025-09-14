/**
 * This class just exists to describe the interface of an enemy.
 * It should not be referenced in code.
 */
class EnemyInterface {
    /** Boolean property indicating alive-ness. */
    alive

    constructor(x, y, width, height) {}

    draw(ctx) {}

    update(frameDuration, room, playerPosition) {}

    applyDamage(box, impulse) {}

    intersects(box) {}
}
