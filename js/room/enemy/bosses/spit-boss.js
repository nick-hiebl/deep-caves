const SPITBOSS_BASE_WIDTH = 340;
const SPITBOSS_BASE_HEIGHT = 76;

const SPITBOSS_HEAD_WIDTH = 60;
const SPITBOSS_HEAD_HEIGHT = 80;

const SpitBossHeadSprite = Sprite('./img/spitboss-head.png');
const SpitBossBaseSprite = Sprite('./img/spitboss-base.png');
const SpitBossSpitSprite = Sprite('./img/spitboss-spit.png');

class SpitBoss {
    constructor(x, y) {
        this.hp = 50;
        this.alive = true;

        this.isNonPhysical = false;
        this.facing = 'left';

        this.x = x;
        this.y = y;

        this.baseBox = {
            x: this.x - SPITBOSS_BASE_WIDTH / 2,
            y: this.y - SPITBOSS_BASE_HEIGHT,
            width: SPITBOSS_BASE_WIDTH,
            height: SPITBOSS_BASE_HEIGHT,
        };

        this.headBox = {
            x: this.x - SPITBOSS_HEAD_WIDTH / 2,
            y: Math.round(this.y - SPITBOSS_HEAD_HEIGHT - 0.75 * SPITBOSS_BASE_HEIGHT),
            width: SPITBOSS_HEAD_WIDTH,
            height: SPITBOSS_HEAD_HEIGHT,
        };

        this.hurtVisualiser = incDecLatch(1, 250);
        this.fireCooldown = incDecLatch(1, 1200);
    }

    draw(ctx) {
        if (this.hurtVisualiser.check() > 0) {
            ctx.filter = 'brightness(1000%) saturate(0%)';
        }

        const BASE_WIDTH_OFF = 8;
        const BASE_HEIGHT_OFF = 8;
        ctx.drawImage(
            SpitBossBaseSprite,
            0,
            0,
            SpitBossBaseSprite.width,
            SpitBossBaseSprite.height,
            this.baseBox.x - BASE_WIDTH_OFF,
            this.baseBox.y - BASE_HEIGHT_OFF,
            this.baseBox.width + 2 * BASE_WIDTH_OFF,
            this.baseBox.height + BASE_HEIGHT_OFF,
        );

        const HEAD_OFF = 4;
        ctx.drawImage(
            SpitBossHeadSprite,
            0,
            0,
            SpitBossHeadSprite.width,
            SpitBossHeadSprite.height,
            this.headBox.x - HEAD_OFF,
            this.headBox.y - HEAD_OFF,
            this.headBox.width + 2 * HEAD_OFF,
            this.headBox.height + 2 * HEAD_OFF,
        );

        ctx.filter = 'none';

        if (DRAW_FRAME_MARKERS) {
            ctx.strokeStyle = 'grey';
            ctx.strokeRect(this.baseBox.x, this.baseBox.y, this.baseBox.width, this.baseBox.height);

            ctx.strokeStyle = 'yellow';
            ctx.strokeRect(this.headBox.x, this.headBox.y, this.headBox.width, this.headBox.height);
        }
    }

    update(frameDuration, room, playerPosition) {
        this.hurtVisualiser.down(frameDuration);

        this.fireCooldown.down(frameDuration);

        if (this.fireCooldown.check() === 0) {
            const newProjectiles = this.createProjectile(room, playerPosition);

            if (newProjectiles && newProjectiles.length > 0) {
                this.fireCooldown.up(1);
                room.enemies.push(...newProjectiles);
            }
        }
    }

    createProjectile(room, playerPosition) {
        const aboveCollider = {
            x: this.x - 5,
            width: 10,
            y: 0,
            height: this.y,
        };

        const solidsAboveMe = room.solids.filter(solid => solid.isCollidable && !solid.isDroppable && overlaps(solid, aboveCollider));
        const maxY = solidsAboveMe.reduce((maxY, solid) => {
            return Math.max(maxY, solid.y + solid.height);
        }, 0);

        const startingY = this.y - 100;

        const acceptablePeak = startingY - maxY - SPITBALL_RADIUS;

        const maxYVelocity = -Math.sqrt(2 * GRAVITY * acceptablePeak);

        if (playerPosition.y <= acceptablePeak) {
            return undefined;
        }

        const yVelocity = randfloat(0.8, 1.0) * maxYVelocity;

        const determinant = yVelocity * yVelocity - 2 * GRAVITY * (startingY - playerPosition.y);

        if (determinant <= 0) {
            return undefined;
        }

        const timeToPlayerY = (-yVelocity + Math.sqrt(determinant)) / GRAVITY;
        const xVelocity = (playerPosition.x - this.x) / timeToPlayerY;

        const numToThrow = randint(1, 4);

        return new Array(numToThrow).fill(0).map(() =>
            new SpitBoss_Spit(
                this.x,
                startingY,
                xVelocity + randfloat(-0.1, 0.1),
                yVelocity + randfloat(-0.01, 0.1),
                this,
            ),
        );
    }

    applyDamage(box) {
        if (box === this.headBox) {
            this.hp -= 3;
            this.hurtVisualiser.up(1);
        } else if (box === this.baseBox) {
            this.hp -= 0.2;
            this.hurtVisualiser.up(0.2);
        }

        if (this.hp < 0) {
            this.alive = false;
        }
    }

    intersects(box) {
        if (overlaps(box, this.headBox)) {
            return this.headBox;
        } else if (overlaps(box, this.baseBox)) {
            return this.baseBox;
        }
    }
}

const SPITBALL_RADIUS = 14;

class SpitBoss_Spit {
    constructor(x, y, xVel, yVel, parent) {
        this.actor = new Actor(x - SPITBALL_RADIUS, y - SPITBALL_RADIUS, SPITBALL_RADIUS * 2, SPITBALL_RADIUS * 2);

        this.xVelocity = xVel;
        this.yVelocity = yVel;

        this.parent = parent;

        this.alive = true;

        this.struck = false;

        this.hitVisualiser = incDecLatch(1, 150);
    }

    draw(ctx) {
        const OFFSET = 2;
        ctx.drawImage(
            SpitBossSpitSprite,
            0,
            0,
            SpitBossSpitSprite.width,
            SpitBossSpitSprite.height,
            this.actor.x - OFFSET,
            this.actor.y - OFFSET,
            this.actor.width + 2 * OFFSET,
            this.actor.height + 2 * OFFSET,
        );
    }

    addParticle(room, origin, velocity) {
        const PARTICLE_RADIUS = 3;

        room.addParticle(new Particle(
            origin.x - PARTICLE_RADIUS,
            origin.y - PARTICLE_RADIUS,
            PARTICLE_RADIUS * 2,
            PARTICLE_RADIUS * 2,
            Math.random() > 0.5 ? '#674cd3' : '#9e5eff',
            velocity.x,
            velocity.y,
            randfloat(120, 200),
            true,
        ));
    }

    update(frameDuration, room, _playerPosition) {
        this.hitVisualiser.down(frameDuration);

        const wallHit = (drn) => (solid) => {
            this.alive = false;

            const origin = drn === 'x'
                ? {
                    x: this.xVelocity > 0 ? solid.x : solid.x + solid.width,
                    y: this.actor.y + this.actor.height / 2,
                  }
                : {
                    x: this.actor.x + this.actor.width / 2,
                    y: this.yVelocity > 0 ? solid.y : solid.y + solid.height,
                  };

            for (let i = 0; i < 12; i++) {
                const vel = drn === 'x'
                    ? {
                        x: -this.xVelocity * randfloat(0.4, 0.6),
                        y: randfloat(-0.2, 0.2),
                      }
                    : {
                        x: randfloat(-0.2, 0.2),
                        y: -this.yVelocity * randfloat(0.2, 0.3),
                      };

                this.addParticle(room, origin, vel);
            }
        };

        this.yVelocity += GRAVITY * frameDuration;
        this.actor.moveX(this.xVelocity * frameDuration, wallHit('x'), room.solids);
        this.actor.moveY(this.yVelocity * frameDuration, wallHit('y'), room.solids);

        /** See if we apply damage to parent */
        if (this.struck && this.parent.alive) {
            const hitBox = this.parent.intersects(this.actor);

            if (hitBox) {
                this.parent.applyDamage(hitBox);

                const origin = clampPointWithin(rectMidpoint(this.actor), insetRect(hitBox, 16));

                console.log(this.xVelocity, this.yVelocity);

                for (let i = 0; i < 12; i++) {
                    const vel = {
                        x: -this.xVelocity * randfloat(0.4, 0.6) + randfloat(-0.2, 0.2),
                        y: -this.yVelocity * randfloat(0.2, 0.3) + randfloat(-0.2, 0.2),
                    };

                    this.addParticle(room, origin, vel);
                }

                this.alive = false;
            }
        }
    }

    applyDamage(_box, impulse) {
        this.hitVisualiser.up(1);

        this.xVelocity = impulse?.x ?? 0;
        this.yVelocity = impulse?.y ?? 0;
        this.struck = true;
    }

    intersects(box) {
        if (overlaps(box, this.actor)) {
            return this.actor;
        }
    }
}
